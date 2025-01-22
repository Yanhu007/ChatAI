import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Settings from './Settings';
import './Chat.css';

// 添加错误处理
const electron = window.electron || {
  ipcRenderer: {
    invoke: async () => {
      console.error('IPC not available');
      throw new Error('IPC not available');
    }
  }
};
const { ipcRenderer } = electron;

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState({
    azureOpenAIUrl: '',
    azureOpenAIKey: '',
    deploymentName: '',
    bingSearchUrl: '',
    bingSearchKey: ''
  });
  const messagesEndRef = useRef(null);
  const [useSearch, setUseSearch] = useState(false);

  useEffect(() => {
    const savedSettings = JSON.parse(localStorage.getItem('chatSettings') || '{}');
    setSettings(savedSettings);
    
    if (!savedSettings.azureOpenAIUrl || !savedSettings.azureOpenAIKey || 
        !savedSettings.bingSearchUrl || !savedSettings.bingSearchKey) {
      setShowSettings(true);
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const addSystemMessage = (content) => {
    setMessages(prev => [...prev, {
      role: 'system',
      content: content
    }]);
  };

  const searchBing = async (query) => {
    try {
      console.group('Bing Search Process');
      console.log('Starting search with settings:', {
        url: settings.bingSearchUrl,
        keyPresent: !!settings.bingSearchKey,
        query
      });

      addSystemMessage('🔍 正在搜索相关网页...');
      
      const fullUrl = `${settings.bingSearchUrl}?q=${encodeURIComponent(query)}`;
      console.log('Full request URL:', fullUrl);
      
      const requestOptions = {
        method: 'GET',
        headers: {
          'Ocp-Apim-Subscription-Key': settings.bingSearchKey,
          'Accept': 'application/json',
          'Accept-Language': 'zh-CN'
        },
        cache: 'no-cache'
      };
      console.log('Request options:', { ...requestOptions, headers: { ...requestOptions.headers, 'Ocp-Apim-Subscription-Key': '***' } });

      const response = await fetch(fullUrl, requestOptions);
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      const responseText = await response.text();
      console.log('Raw response:', responseText.slice(0, 500) + '...');

      if (!response.ok) {
        throw new Error(`Bing search failed with status ${response.status}: ${responseText}`);
      }

      let data;
      try {
        data = JSON.parse(responseText);
        console.log('Parsed data structure:', Object.keys(data));
        console.log('WebPages data:', data.webPages?.value?.length || 'not found');
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        throw new Error('Failed to parse Bing API response: ' + parseError.message);
      }

      if (!data.webPages?.value) {
        throw new Error('Invalid response format from Bing API: webPages.value not found');
      }

      const urls = data.webPages.value.slice(0, 3).map(page => ({
        url: page.url,
        title: page.name,
        snippet: page.snippet
      }));
      
      console.log('Extracted URLs:', urls);
      addSystemMessage(`✅ 找到以下相关网页：\n${urls.map((item, i) => 
        `${i + 1}. ${item.title}\n   ${item.url}`).join('\n')}`);
      
      return urls.map(item => item.url);
    } catch (error) {
      console.groupEnd();
      console.error('Search error details:', {
        error,
        stack: error.stack,
        settings: {
          urlPresent: !!settings.bingSearchUrl,
          keyPresent: !!settings.bingSearchKey
        }
      });
      addSystemMessage('❌ 搜索失败：' + error.message);
      throw error;
    }
  };

  const fetchPageContent = async (url, index) => {
    try {
      addSystemMessage(`📄 正在获取网页 ${index + 1} 的内容...`);
      console.log(`Fetching content for URL ${index + 1}:`, url);
      
      const content = await ipcRenderer.invoke('fetch-page', url);
      
      console.log(`Received content length for URL ${index + 1}:`, content.length);
      addSystemMessage(`✅ 已获取网页 ${index + 1} 的内容`);
      
      return content;
    } catch (error) {
      console.error(`Detailed error for URL ${index + 1}:`, {
        url,
        error: error.message,
        stack: error.stack
      });
      addSystemMessage(`❌ 获取网页 ${index + 1} 失败：${error.message}`);
      return `Failed to fetch content from ${url}`;
    }
  };

  const checkIntent = async (input) => {
    try {
      const response = await fetch(`${settings.azureOpenAIUrl}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': settings.azureOpenAIKey
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: '你是一个意图识别专家。请判断用户输入是否是查询酒店的意图。只需要回复 "true" 或 "false"。'
            },
            {
              role: 'user',
              content: input
            }
          ],
          max_tokens: 5,
          temperature: 0.1
        })
      });

      if (!response.ok) throw new Error('API request failed');
      const data = await response.json();
      return data.choices[0].message.content.toLowerCase().includes('true');
    } catch (error) {
      console.error('Intent check error:', error);
      return false;
    }
  };

  const renderHotelCard = () => {
    return (
      <div className="hotel-card">
        <iframe
          src="https://www.bing.com/travel/hotel-search?q=hotels+in+Shanghai%2C+China&displaytext=Shanghai%2C+China&cin=2025-02-12&cout=2025-02-17&form=HTFLLI&entrypoint=FBATIT"
          width="100%"
          height="600"
          frameBorder="0"
          allowFullScreen
        />
      </div>
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !settings.azureOpenAIUrl || !settings.azureOpenAIKey) return;

    const userMessage = {
      role: 'user',
      content: input
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // 检查意图
      const isHotelQuery = await checkIntent(input);
      
      if (isHotelQuery) {
        // 如果是酒店查询意图，添加酒店卡片
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: '为您找到相关酒店信息：',
          isHotelCard: true
        }]);
      } else {
        // 原有的搜索和回答逻辑
        let prompt = input;
        let webContents = '';

        if (useSearch) {
          try {
            const urls = await searchBing(input);
            addSystemMessage('🔄 正在分析网页内容...');
            
            const contents = await Promise.all(
              urls.map((url, index) => fetchPageContent(url, index))
            );
            
            webContents = contents.map((content, i) => 
              `来源 ${i + 1}: ${urls[i]}\n${content}\n`
            ).join('');

            addSystemMessage('✅ 内容分析完成，正在生成总结...');
            
            prompt = `请根据以下信息生成一个结构化的总结：

搜索词：${input}

搜索结果：
${webContents}

要求：
1. 使用 Markdown 格式，保持紧凑的格式，避免多余的空行
2. 包含来源引用
3. 按重要性组织内容
4. 突出关键信息
5. 段落之间只使用单个换行符
6. 列表项之间不要有空行`;
          } catch (error) {
            console.error('Search process failed:', error);
            addSystemMessage('❌ 搜索过程失败：' + error.message);
            throw new Error('搜索过程失败');
          }
        }

        const response = await fetch(`${settings.azureOpenAIUrl}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'api-key': settings.azureOpenAIKey
          },
          body: JSON.stringify({
            messages: [
              ...messages,
              {
                role: 'user',
                content: prompt
              }
            ],
            max_tokens: 1000,
            temperature: 0.7,
            frequency_penalty: 0,
            presence_penalty: 0,
            top_p: 0.95,
            stop: null
          })
        });

        if (!response.ok) throw new Error('API request failed');

        const data = await response.json();
        const assistantMessage = {
          role: 'assistant',
          content: data.choices[0].message.content
        };

        setMessages(prev => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '抱歉，发生了错误。请稍后重试。'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessageContent = (message) => {
    if (message.isHotelCard) {
      return (
        <>
          {message.content}
          {renderHotelCard()}
        </>
      );
    }
    
    return (
      <ReactMarkdown 
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({node, ...props}) => (
            <a target="_blank" rel="noopener noreferrer" {...props} />
          ),
          code: ({node, inline, ...props}) => (
            <code className={inline ? 'inline-code' : 'code-block'} {...props} />
          )
        }}
      >
        {message.content}
      </ReactMarkdown>
    );
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h1>Chat</h1>
        <button 
          className="settings-button"
          onClick={() => setShowSettings(true)}
        >
          ⚙️
        </button>
      </div>

      <div className="messages">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`message ${message.role === 'user' ? 'user' : 
              message.role === 'system' ? 'system' : 'assistant'} ${
              message.isSearchResult ? 'search-result' : ''
            }`}
          >
            <div className="message-content">
              {renderMessageContent(message)}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="message assistant">
            <div className="message-content loading">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="input-form" onSubmit={handleSubmit}>
        <div className="input-wrapper">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="输入消息..."
            disabled={isLoading}
          />
          <div className="search-toggle">
            <label className="toggle">
              <input
                type="checkbox"
                checked={useSearch}
                onChange={(e) => setUseSearch(e.target.checked)}
              />
              <span className="toggle-slider"></span>
              <span className="toggle-label">互联网搜索</span>
            </label>
          </div>
        </div>
        <button type="submit" disabled={isLoading || !input.trim()}>
          发送
        </button>
      </form>

      <Settings
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onSave={(newSettings) => {
          setSettings(newSettings);
          setShowSettings(false);
        }}
      />
    </div>
  );
};

export default Chat; 