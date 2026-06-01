const couriers = [
  '顺丰速运', '中通快递', '圆通速递', '申通快递', '韵达快递',
  '京东物流', '邮政EMS', '百世快递', '德邦快递', '极兔速递',
  '宅急送', '天天快递', '优速快递', '速尔快递', '全峰快递'
];

const eventTypes = [
  '已下单', '已揽收', '运输中', '到达中转站', '离开中转站',
  '正在派送', '已签收', '异常件', '退回中', '已退回'
];

const cities = [
  '北京市', '上海市', '广州市', '深圳市', '杭州市', '南京市',
  '成都市', '武汉市', '西安市', '重庆市', '天津市', '苏州市',
  '郑州市', '长沙市', '沈阳市', '青岛市', '厦门市', '东莞市'
];

function detectCourier(trackingNumber) {
  const prefix = trackingNumber.substring(0, 2).toUpperCase();
  const prefixMap = {
    'SF': '顺丰速运',
    'ZT': '中通快递',
    'YT': '圆通速递',
    'ST': '申通快递',
    'YD': '韵达快递',
    'JD': '京东物流',
    'EM': '邮政EMS',
    'BS': '百世快递',
    'DB': '德邦快递',
    'JT': '极兔速递'
  };
  return prefixMap[prefix] || couriers[Math.floor(Math.random() * couriers.length)];
}

function generateTrackingEvents(trackingNumber, courier) {
  const events = [];
  const now = new Date();
  let currentTime = new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000);
  
  const numEvents = Math.floor(Math.random() * 5) + 4;
  let currentCity = cities[Math.floor(Math.random() * cities.length)];
  const destCity = cities[Math.floor(Math.random() * cities.length)];
  
  for (let i = 0; i < numEvents; i++) {
    const event = {
      id: i + 1,
      tracking_number: trackingNumber,
      courier: courier,
      event_type: i === 0 ? '已下单' : 
                  i === 1 ? '已揽收' : 
                  i === numEvents - 1 ? '已签收' :
                  i === numEvents - 2 ? '正在派送' :
                  Math.random() > 0.8 ? '异常件' : 
                  Math.random() > 0.5 ? '到达中转站' : '运输中',
      location: i === 0 ? currentCity : 
                i === numEvents - 1 ? destCity :
                cities[Math.floor(Math.random() * cities.length)],
      description: '',
      operator: ['张师傅', '李师傅', '王师傅', '刘师傅'][Math.floor(Math.random() * 4)],
      timestamp: currentTime.toISOString()
    };
    
    event.description = generateEventDescription(event.event_type, event.location);
    
    events.push(event);
    currentTime = new Date(currentTime.getTime() + Math.random() * 24 * 60 * 60 * 1000);
  }
  
  return events.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
}

function generateEventDescription(eventType, location) {
  const descriptions = {
    '已下单': `订单已提交，等待快递员揽收`,
    '已揽收': `快递员已在${location}揽收成功`,
    '运输中': `包裹正在${location}中转运输`,
    '到达中转站': `包裹已到达${location}中转站`,
    '离开中转站': `包裹已离开${location}中转站`,
    '正在派送': `快递员正在${location}为您派送`,
    '已签收': `包裹已在${location}签收成功`,
    '异常件': `包裹在${location}出现异常，正在处理`,
    '退回中': `包裹正在退回${location}`,
    '已退回': `包裹已退回${location}`
  };
  return descriptions[eventType] || `包裹状态更新于${location}`;
}

function trackParcel(trackingNumber) {
  const courier = detectCourier(trackingNumber);
  const events = generateTrackingEvents(trackingNumber, courier);
  const latestEvent = events[events.length - 1];
  
  return {
    tracking_number: trackingNumber,
    courier: courier,
    status: latestEvent.event_type,
    latest_location: latestEvent.location,
    estimated_delivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    events: events,
    updated_at: new Date().toISOString()
  };
}

function trackParcels(trackingNumbers) {
  return trackingNumbers.map(num => trackParcel(num.trim()));
}

module.exports = { trackParcel, trackParcels, detectCourier, generateTrackingEvents };
