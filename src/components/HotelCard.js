const HotelCard = ({ searchUrl, hotelInfo }) => {
  // 默认的搜索 URL
  const defaultUrl = 'https://www.bing.com/travel/hotel-search?loc=Shanghai,China&cin=2024-03-01&cout=2024-03-02&displaytext=Shanghai,China&type=hotel';
  
  // 显示预订信息摘要
  const renderBookingSummary = () => {
    if (!hotelInfo) return null;
    
    return (
      <div className="booking-summary">
        <h3>预订信息摘要</h3>
        <ul>
          {hotelInfo.location_preference && (
            <li>目的地：{hotelInfo.location_preference}</li>
          )}
          {hotelInfo.check_in_date && (
            <li>入住日期：{hotelInfo.check_in_date}</li>
          )}
          {hotelInfo.check_out_date && (
            <li>离店日期：{hotelInfo.check_out_date}</li>
          )}
          {hotelInfo.stay_duration && (
            <li>入住时长：{hotelInfo.stay_duration}晚</li>
          )}
          {hotelInfo.rooms && (
            <li>房间数量：{hotelInfo.rooms}间</li>
          )}
          {hotelInfo.hotel_star_rating && (
            <li>期望星级：{hotelInfo.hotel_star_rating}星</li>
          )}
          {hotelInfo.budget?.min && hotelInfo.budget?.max && (
            <li>预算范围：{hotelInfo.budget.min} - {hotelInfo.budget.max}元/晚</li>
          )}
        </ul>
      </div>
    );
  };

  return (
    <div className="hotel-card">
      {renderBookingSummary()}
      <iframe
        src={searchUrl || defaultUrl}
        width="100%"
        height="600"
        frameBorder="0"
        allowFullScreen
      />
    </div>
  );
};

export default HotelCard; 