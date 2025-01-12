import React, { useState, useEffect } from 'react';
import './Settings.css';

const Settings = ({ isOpen, onClose, onSave }) => {
  const [azureOpenAIUrl, setAzureOpenAIUrl] = useState('');
  const [azureOpenAIKey, setAzureOpenAIKey] = useState('');
  const [deploymentName, setDeploymentName] = useState('');
  const [bingSearchUrl, setBingSearchUrl] = useState('');
  const [bingSearchKey, setBingSearchKey] = useState('');

  useEffect(() => {
    const savedSettings = JSON.parse(localStorage.getItem('chatSettings') || '{}');
    setAzureOpenAIUrl(savedSettings.azureOpenAIUrl || '');
    setAzureOpenAIKey(savedSettings.azureOpenAIKey || '');
    setDeploymentName(savedSettings.deploymentName || '');
    setBingSearchUrl(savedSettings.bingSearchUrl || '');
    setBingSearchKey(savedSettings.bingSearchKey || '');
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    const settings = {
      azureOpenAIUrl,
      azureOpenAIKey,
      deploymentName,
      bingSearchUrl,
      bingSearchKey
    };
    localStorage.setItem('chatSettings', JSON.stringify(settings));
    onSave(settings);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="settings-overlay">
      <div className="settings-modal">
        <h2>API 设置</h2>
        <form onSubmit={handleSubmit}>
          <div className="settings-section">
            <h3>Azure OpenAI 设置</h3>
            <div className="form-group">
              <label htmlFor="azureOpenAIUrl">OpenAI API 端点</label>
              <input
                type="url"
                id="azureOpenAIUrl"
                value={azureOpenAIUrl}
                onChange={(e) => setAzureOpenAIUrl(e.target.value)}
                placeholder="例如：https://<your-resource-name>.openai.azure.com"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="deploymentName">部署名称</label>
              <input
                type="text"
                id="deploymentName"
                value={deploymentName}
                onChange={(e) => setDeploymentName(e.target.value)}
                placeholder="输入部署名称"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="azureOpenAIKey">OpenAI API Key</label>
              <input
                type="password"
                id="azureOpenAIKey"
                value={azureOpenAIKey}
                onChange={(e) => setAzureOpenAIKey(e.target.value)}
                placeholder="输入 Azure OpenAI API Key"
                required
              />
            </div>
          </div>

          <div className="settings-section">
            <h3>Bing Search 设置</h3>
            <div className="form-group">
              <label htmlFor="bingSearchUrl">Bing Search API 端点</label>
              <input
                type="url"
                id="bingSearchUrl"
                value={bingSearchUrl}
                onChange={(e) => setBingSearchUrl(e.target.value)}
                placeholder="例如：https://api.bing.microsoft.com/v7.0/search"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="bingSearchKey">Bing Search API Key</label>
              <input
                type="password"
                id="bingSearchKey"
                value={bingSearchKey}
                onChange={(e) => setBingSearchKey(e.target.value)}
                placeholder="输入 Bing Search API Key"
                required
              />
            </div>
          </div>

          <div className="button-group">
            <button type="button" onClick={onClose} className="cancel-button">
              取消
            </button>
            <button type="submit" className="save-button">
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Settings; 