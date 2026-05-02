const { v4: uuidv4 } = require('uuid');

const db = {
  mainOrders: [],
  orderDetails: [],
  pois: [],
  trajectories: [],
  messages: [],
  operationLogs: [],
  timelineEvents: [],
  exceptionQueues: [],
  routeSelections: [],
  attachments: [],
  users: []
};

function generateOrderNo() {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `MN${dateStr}${random}`;
}

function generateDetailNo(orderNo, sequence) {
  return `${orderNo}-${String(sequence).padStart(3, '0')}`;
}

function generateId() {
  return uuidv4().replace(/-/g, '').toUpperCase();
}

function initData() {
  db.users = [
    { id: 1, user_id: 'U001', user_name: '张三(用户)', role: 'USER', phone: '13800138001', is_active: 1, created_at: new Date().toISOString() },
    { id: 2, user_id: 'U002', user_name: '李四(司机)', role: 'DRIVER', phone: '13800138002', is_active: 1, created_at: new Date().toISOString() },
    { id: 3, user_id: 'U003', user_name: '王五(调度员)', role: 'DISPATCHER', phone: '13800138003', is_active: 1, created_at: new Date().toISOString() },
    { id: 4, user_id: 'U004', user_name: '赵六(地图服务商)', role: 'MAP_PROVIDER', phone: '13800138004', is_active: 1, created_at: new Date().toISOString() },
    { id: 5, user_id: 'U005', user_name: '钱七(运营)', role: 'OPERATOR', phone: '13800138005', is_active: 1, created_at: new Date().toISOString() }
  ];

  db.pois = [
    { id: 1, poi_id: 'POI001', name: '北京西站', address: '北京市丰台区莲花池东路', lat: 39.8947, lng: 116.3225, category: '交通枢纽', is_locked: 0, locked_by_order: null, locked_at: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 2, poi_id: 'POI002', name: '天安门广场', address: '北京市东城区长安街', lat: 39.9055, lng: 116.3976, category: '景点', is_locked: 0, locked_by_order: null, locked_at: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 3, poi_id: 'POI003', name: '中关村软件园', address: '北京市海淀区西北旺东路', lat: 40.0499, lng: 116.2851, category: '科技园', is_locked: 0, locked_by_order: null, locked_at: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 4, poi_id: 'POI004', name: '首都国际机场T3', address: '北京市顺义区机场西路', lat: 40.0799, lng: 116.6031, category: '交通枢纽', is_locked: 0, locked_by_order: null, locked_at: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 5, poi_id: 'POI005', name: '国贸CBD', address: '北京市朝阳区建国门外大街', lat: 39.9087, lng: 116.4605, category: '商业区', is_locked: 0, locked_by_order: null, locked_at: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
  ];

  console.log('内存数据库初始化完成');
}

module.exports = {
  db,
  generateOrderNo,
  generateDetailNo,
  generateId,
  initData
};
