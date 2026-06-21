import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
const WS_URL = import.meta.env.VITE_WS_URL || (window.location.protocol === 'https:' ? 'wss:' : 'ws:') + '//' + window.location.host + '/ws';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.response.use(
  response => response.data,
  error => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

export const API = {
  health: () => axios.get('/api/health'),
  
  stations: {
    list: (params) => api.get('/stations', { params }),
    detail: (id) => api.get(`/stations/${id}`),
    chargers: (id) => api.get(`/stations/${id}/chargers`),
    price: (id) => api.get(`/stations/${id}/price`)
  },
  
  chargers: {
    detail: (id) => api.get(`/chargers/${id}`),
    byCode: (code) => api.get(`/chargers/code/${code}`),
    updateStatus: (id, data) => api.post(`/chargers/${id}/status`, data),
    orders: (id) => api.get(`/chargers/${id}/orders`),
    health: (id) => api.get(`/chargers/${id}/health`),
    healthList: () => api.get('/chargers/health/list'),
    ocppMessages: (id) => api.get(`/chargers/${id}/ocpp-messages`)
  },
  
  orders: {
    list: (params) => api.get('/orders', { params }),
    detail: (id) => api.get(`/orders/${id}`),
    create: (data) => api.post('/orders', data),
    stop: (id, data) => api.post(`/orders/${id}/stop`, data),
    powerData: (id) => api.get(`/orders/${id}/power-data`)
  },
  
  recommendation: {
    get: (data) => api.post('/recommendation', data),
    reserve: (data) => api.post('/recommendation/reserve', data),
    userReservations: (userId) => api.get(`/recommendation/user/${userId}`)
  },
  
  ocpp: {
    sendMessage: (chargerCode, data) => api.post(`/ocpp/${chargerCode}/message`, data),
    getMessages: (chargerCode) => api.get(`/ocpp/${chargerCode}/messages`)
  },
  
  alarms: {
    list: (params) => api.get('/alarms', { params }),
    detail: (id) => api.get(`/alarms/${id}`),
    update: (id, data) => api.put(`/alarms/${id}`, data),
    create: (data) => api.post('/alarms', data)
  },
  
  pricing: {
    list: (params) => api.get('/pricing', { params }),
    create: (data) => api.post('/pricing', data),
    update: (id, data) => api.put(`/pricing/${id}`, data)
  },
  
  revenue: {
    daily: (params) => api.get('/revenue/daily', { params }),
    monthly: (params) => api.get('/revenue/monthly', { params }),
    summary: () => api.get('/revenue/summary')
  }
};

export function createWebSocket() {
  return new WebSocket(WS_URL);
}

export function formatDuration(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function formatDateTime(dateStr) {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function formatMoney(amount) {
  if (amount === null || amount === undefined) return '-';
  return `¥${Number(amount).toFixed(2)}`;
}

export function formatEnergy(energy) {
  if (energy === null || energy === undefined) return '-';
  return `${Number(energy).toFixed(2)} kWh`;
}

export function getStatusText(status) {
  const statusMap = {
    online: '在线',
    offline: '离线',
    available: '空闲',
    occupied: '占用',
    charging: '充电中',
    fault: '故障',
    pending: '待处理',
    processing: '处理中',
    resolved: '已解决',
    completed: '已完成'
  };
  return statusMap[status] || status;
}

export function getStatusColor(status) {
  const colorMap = {
    online: '#52c41a',
    offline: '#8c8c8c',
    available: '#1890ff',
    occupied: '#faad14',
    charging: '#52c41a',
    fault: '#ff4d4f',
    pending: '#faad14',
    processing: '#1890ff',
    resolved: '#52c41a',
    completed: '#52c41a'
  };
  return colorMap[status] || '#8c8c8c';
}

export function getChargerTypeText(type) {
  return type === 'fast' ? '直流快充' : '交流慢充';
}

export function getPeriodText(type) {
  const map = {
    peak: '峰时',
    flat: '平时',
    valley: '谷时'
  };
  return map[type] || type;
}

export function getPeriodColor(type) {
  const map = {
    peak: '#ff4d4f',
    flat: '#faad14',
    valley: '#52c41a'
  };
  return map[type] || '#8c8c8c';
}

export function getHealthLevelText(level) {
  const map = {
    excellent: '优秀',
    good: '良好',
    fair: '一般',
    poor: '较差'
  };
  return map[level] || level;
}

export function getHealthLevelColor(level) {
  const map = {
    excellent: '#52c41a',
    good: '#1890ff',
    fair: '#faad14',
    poor: '#ff4d4f'
  };
  return map[level] || '#8c8c8c';
}

export function getAlarmLevelText(level) {
  const map = {
    high: '高',
    medium: '中',
    low: '低'
  };
  return map[level] || level;
}

export function getAlarmLevelColor(level) {
  const map = {
    high: '#ff4d4f',
    medium: '#faad14',
    low: '#1890ff'
  };
  return map[level] || '#8c8c8c';
}
