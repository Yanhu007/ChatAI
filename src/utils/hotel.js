const parseHotelRequest = async (input, settings) => {
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
            content: `你是一名"酒店预订专家"，负责帮助用户解析他们的酒店预订需求。根据用户的输入，完成以下任务：
1. 提取用户的预订信息，包括入住日期、离店日期、入住时长、房间数量、入住人数、酒店星级、预算范围、地理位置偏好以及其他需求。
2. 如果用户提供模糊时间（如"明天""下周五"），请根据当前日期推理出具体的日期。
3. 如果用户未提供某些信息，请标注为 null，并在 JSON 中保留这些字段。
4. 只返回 JSON 格式的解析结果，不要包含任何其他文字。

返回格式示例：
{
  "check_in_date": "YYYY-MM-DD",
  "check_out_date": "YYYY-MM-DD",
  "stay_duration": "number of nights",
  "rooms": "number of rooms",
  "guests": "number of guests",
  "hotel_star_rating": "1-5 or null",
  "budget": {
    "min": "minimum budget",
    "max": "maximum budget"
  },
  "location_preference": "location details or null",
  "special_requests": ["list of specific requests or null"]
}`
          },
          {
            role: 'user',
            content: `当前时间：${currentDateTime}\n用户输入：${input}`
          }
        ],
        max_tokens: 500,
        temperature: 0.1,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) throw new Error('API request failed');
    const data = await response.json();
    
    try {
      // 尝试解析返回的 JSON 字符串
      const parsedResult = JSON.parse(data.choices[0].message.content);
      return parsedResult;
    } catch (parseError) {
      console.error('Failed to parse hotel request result:', parseError);
      throw new Error('Invalid hotel request parse result');
    }
  } catch (error) {
    console.error('Hotel request parse error:', error);
    return {
      check_in_date: null,
      check_out_date: null,
      stay_duration: null,
      rooms: null,
      guests: null,
      hotel_star_rating: null,
      budget: {
        min: null,
        max: null
      },
      location_preference: null,
      special_requests: null
    };
  }
};

export default parseHotelRequest; 