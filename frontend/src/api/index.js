import axios from 'axios';

const request = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

request.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

export const API = {
  stations: {
    list: (params) => request.get('/stations', { params }),
    detail: (id) => request.get(`/stations/${id}`),
    chargers: (id) => request.get(`/stations/${id}/chargers`),
    price: (id) => request.get(`/stations/${id}/price`)
  },
  chargers: {
    list: (params) => request.get('/chargers', { params }),
    detail: (id) => request.get(`/chargers/${id}`),
    status: (id) => request.get(`/chargers/${id}/status`),
    healthList: () => request.get('/chargers/health/list')
  },
  orders: {
    list: (params) => request.get('/orders', { params }),
    detail: (id) => request.get(`/orders/${id}`),
    create: (data) => request.post('/orders', data),
    stop: (id, data) => request.post(`/orders/${id}/stop`, data),
    powerData: (id) => request.get(`/orders/${id}/power-data`)
  },
  recommendation: {
    get: (data) => request.post('/recommendation', data),
    reserve: (data) => request.post('/recommendation/reserve', data),
    userReservations: (userId) => request.get(`/recommendation/user/${userId}`)
  },
  alarms: {
    list: (params) => request.get('/alarms', { params }),
    detail: (id) => request.get(`/alarms/${id}`),
    update: (id, data) => request.put(`/alarms/${id}`, data)
  },
  revenue: {
    summary: () => request.get('/revenue/summary'),
    daily: (params) => request.get('/revenue/daily', { params }),
    monthly: (params) => request.get('/revenue/monthly', { params })
  },
  pricing: {
    list: (params) => request.get('/pricing', { params }),
    detail: (id) => request.get(`/pricing/${id}`)
  }
};

export function formatMoney(amount) {
  if (amount === null || amount === undefined) return '-';
  return `¥${Number(amount).toFixed(2)}`;
}

function formatEnergy(energy) {
  if (energy === null || energy === undefined) return '-';
  return `${Number(energy).toFixed(1)} kWh`;
}

function formatDuration(seconds) {
  if (!seconds || seconds <= 0) return '00:00:00';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function formatDateTime(dateStr) {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

function getStatusText(status) {
  const statusMap = {
    available: '空闲',
    charging: '充电中',
    occupied: '占用',
    offline: '离线',
    fault: '故障'
  };
  return statusMap[status] || status || '-';
}

function getStatusColor(status) {
  const colorMap = {
    available: '#52c41a',
    charging: '#1890ff',
    occupied: '#faad14',
    offline: '#8c8c8c',
    fault: '#ff4d4f'
  };
  return colorMap[status] || '#8c8c8c';
}

function getChargerTypeText(type) {
  const typeMap = {
    fast: '直流快充',
    slow: '交流慢充',
    dc: '直流快充',
    ac: '交流慢充'
  };
  return typeMap[type] || type || '-';
}

function getPeriodText(period) {
  const periodMap = {
    peak: '峰时',
    flat: '平时',
    valley: '谷时'
  };
  return periodMap[period] || period || '-';
}

function getPeriodColor(period) {
  const colorMap = {
    peak: '#ff4d4f',
    flat: '#faad14',
    valley: '#52c41a'
  };
  return colorMap[period] || '#8c8c8c';
}

function getHealthLevelText(level) {
  const levelMap = {
    excellent: '优秀',
    good: '良好',
    fair: '一般',
    poor: '较差'
  };
  return levelMap[level] || level || '-';
}

function getHealthLevelColor(level) {
  const colorMap = {
    excellent: '#52c41a',
    good: '#1890ff',
    fair: '#faad14',
    poor: '#ff4d4f'
  };
  return colorMap[level] || '#8c8c8c';
}

function getAlarmLevelText(level) {
  const levelMap = {
    low: '低',
    medium: '中',
    high: '高',
    critical: '紧急'
  };
  return levelMap[level] || level || '-';
}

function getAlarmLevelColor(level) {
  const colorMap = {
    low: '#52c41a',
    medium: '#faad14',
    high: '#ff4d4f',
    critical: '#722ed1'
  };
  return colorMap[level] || '#8c8c8c';
}

function createWebSocket() {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.host}/ws`;
  return new WebSocket(wsUrl);
}

function parseSocketMessage(event) {
  try {
    return JSON.parse(event.data);
  } catch (err) {
    console.error('解析 WebSocket 消息解析失败:', err);
    return null;
  }
}

export {
  formatMoney,
  formatEnergy,
  formatDuration,
  formatDateTime,
  getStatusText,
  getStatusColor,
  getChargerTypeText,
  getPeriodText,
  getPeriodColor,
  getHealthLevelText,
  getHealthLevelColor,
  getAlarmLevelText,
  getAlarmLevelColor,
  createWebSocket,
  parseSocketMessage
};

export default API;
