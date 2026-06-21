import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://127.0.0.1:59291/ws';

const request = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000
});

request.interceptors.response.use(
  response => response.data,
  error => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

const ensureArray = (value) => (Array.isArray(value) ? value : []);

const normalizeRevenueSummary = (value) => {
  const data = value && typeof value === 'object' ? value : {};
  const today = data.today && typeof data.today === 'object' ? data.today : {};

  return {
    ...data,
    today,
    today_orders: data.today_orders ?? today.total_orders ?? 0,
    today_energy: data.today_energy ?? today.total_energy ?? 0,
    today_revenue: data.today_revenue ?? today.total_amount ?? 0
  };
};

const normalizeRevenueDaily = (value) => {
  const data = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  const list = ensureArray(Array.isArray(value) ? value : data.list);
  const chartData = ensureArray(data.chart_data);

  return {
    ...data,
    list,
    chart_data: chartData.length > 0 ? chartData : list,
    by_station: ensureArray(data.by_station),
    summary: data.summary && typeof data.summary === 'object' ? data.summary : null
  };
};

const normalizeRevenueMonthly = (value) => {
  const data = value && typeof value === 'object' && !Array.isArray(value) ? value : {};

  return {
    ...data,
    list: ensureArray(Array.isArray(value) ? value : data.list),
    summary: data.summary && typeof data.summary === 'object' ? data.summary : null
  };
};

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
    orders: (id) => request.get(`/chargers/${id}/orders`),
    health: (id) => request.get(`/chargers/${id}/health`),
    healthList: () => request.get('/chargers/health/list')
  },
  orders: {
    list: (params) => request.get('/orders', { params }),
    detail: (id) => request.get(`/orders/${id}`),
    create: (data) => request.post('/orders', data),
    stop: (id, data) => request.post(`/orders/${id}/stop`, data),
    powerData: (id) => request.get(`/orders/${id}/power-data`)
  },
  revenue: {
    summary: async () => {
      const res = await request.get('/revenue/summary');
      const payload = res?.data !== undefined ? res.data : res;
      return {
        ...res,
        data: normalizeRevenueSummary(payload)
      };
    },
    daily: async (params) => {
      const res = await request.get('/revenue/daily', { params });
      const payload = res?.data !== undefined ? res.data : res;
      return {
        ...res,
        data: normalizeRevenueDaily(payload)
      };
    },
    monthly: async (params) => {
      const res = await request.get('/revenue/monthly', { params });
      const payload = res?.data !== undefined ? res.data : res;
      return {
        ...res,
        data: normalizeRevenueMonthly(payload)
      };
    }
  },
  alarms: {
    list: (params) => request.get('/alarms', { params }),
    detail: (id) => request.get(`/alarms/${id}`),
    update: (id, data) => request.put(`/alarms/${id}`, data)
  },
  pricing: {
    list: () => request.get('/pricing'),
    detail: (id) => request.get(`/pricing/${id}`),
    create: (data) => request.post('/pricing', data),
    update: (id, data) => request.put(`/pricing/${id}`, data),
    delete: (id) => request.delete(`/pricing/${id}`)
  },
  recommendation: {
    get: (data) => request.post('/recommendation', data),
    reserve: (data) => request.post('/recommendation/reserve', data)
  }
};

export const formatMoney = (amount) => {
  if (amount === null || amount === undefined) return '¥0.00';
  return `¥${Number(amount).toFixed(2)}`;
};

export const formatEnergy = (energy) => {
  if (energy === null || energy === undefined) return '0 kWh';
  return `${Number(energy).toFixed(2)} kWh`;
};

export const formatDuration = (seconds) => {
  if (!seconds || seconds <= 0) return '00:00:00';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const formatDateTime = (dateStr) => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

export const getStatusText = (status) => {
  const statusMap = {
    pending: '待充电',
    charging: '充电中',
    completed: '已完成',
    cancelled: '已取消',
    failed: '失败',
    offline: '离线',
    online: '在线',
    available: '空闲',
    occupied: '占用',
    fault: '故障'
  };
  return statusMap[status] || status || '-';
};

export const getStatusColor = (status) => {
  const colorMap = {
    pending: '#faad14',
    charging: '#1890ff',
    completed: '#52c41a',
    cancelled: '#8c8c8c',
    failed: '#ff4d4f',
    offline: '#8c8c8c',
    online: '#52c41a',
    available: '#52c41a',
    occupied: '#faad14',
    fault: '#ff4d4f'
  };
  return colorMap[status] || '#1890ff';
};

export const getChargerTypeText = (type) => {
  const typeMap = {
    fast: '直流快充',
    slow: '交流慢充'
  };
  return typeMap[type] || type || '-';
};

export const getHealthLevelText = (level) => {
  const levelMap = {
    excellent: '优秀',
    good: '良好',
    fair: '一般',
    poor: '较差'
  };
  return levelMap[level] || level || '-';
};

export const getHealthLevelColor = (level) => {
  const colorMap = {
    excellent: '#52c41a',
    good: '#1890ff',
    fair: '#faad14',
    poor: '#ff4d4f'
  };
  return colorMap[level] || '#1890ff';
};

export const getPeriodText = (periodType) => {
  const periodMap = {
    peak: '尖峰',
    flat: '平时',
    valley: '谷时'
  };
  return periodMap[periodType] || periodType || '-';
};

export const getPeriodColor = (periodType) => {
  const colorMap = {
    peak: '#ff4d4f',
    flat: '#faad14',
    valley: '#52c41a'
  };
  return colorMap[periodType] || '#1890ff';
};

export const getAlarmLevelText = (level) => {
  const levelMap = {
    critical: '严重',
    warning: '警告',
    info: '提示'
  };
  return levelMap[level] || level || '-';
};

export const getAlarmLevelColor = (level) => {
  const colorMap = {
    critical: '#ff4d4f',
    warning: '#faad14',
    info: '#1890ff'
  };
  return colorMap[level] || '#1890ff';
};

export const createWebSocket = () => {
  return new WebSocket(WS_URL);
};

export const parseSocketMessage = (event) => {
  try {
    return JSON.parse(event.data);
  } catch (err) {
    console.error('解析 WebSocket 消息失败:', err);
    return null;
  }
};

export default API;
