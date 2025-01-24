const INTENTS = {
  HOTEL_QUERY: 1,
  OTHER: 0
};

const checkIntent = async (input, settings) => {
  try {
    // 获取当前时间并格式化
    const now = new Date();
    const currentDateTime = now.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      weekday: 'long',
      hour12: false
    });

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
            content: `你是一个意图识别专家。请分析用户输入属于哪种意图，并返回对应的数字代码。

支持的意图类型：
- 酒店查询（返回数字1）：查找酒店、预订房间、寻找住宿等相关意图
- 其他意图（返回数字0）：任何非酒店查询的意图

只需返回对应的数字（0或1），不需要任何其他解释或文字。

示例：
用户：我想找个酒店住两晚
返回：1

用户：今天天气怎么样
返回：0

用户：帮我订一个五星级酒店
返回：1`
          },
          {
            role: 'user',
            content: `当前时间：${currentDateTime}\n用户输入：${input}`
          }
        ],
        max_tokens: 5,
        temperature: 0.1
      })
    });

    if (!response.ok) throw new Error('API request failed');
    const data = await response.json();
    const intentOutput = parseInt(data.choices[0].message.content.trim());
    
    // 验证返回值是否有效
    if (![INTENTS.HOTEL_QUERY, INTENTS.OTHER].includes(intentOutput)) {
      throw new Error('Invalid intent output');
    }

    return intentOutput;
  } catch (error) {
    console.error('Intent check error:', error);
    return INTENTS.OTHER; // 发生错误时返回默认意图
  }
};

export { INTENTS, checkIntent }; 