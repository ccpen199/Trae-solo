import axios from 'axios';

const API_BASE = '/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000
});

export const healthCheck = () => api.get('/health');

export const getUsers = () => api.get('/users');
export const getUser = (userId) => api.get(`/users/${userId}`);

export const getMeters = () => api.get('/meters');
export const getMeter = (meterId) => api.get(`/meters/${meterId}`);

export const getBills = (meterId, status) => {
  const params = {};
  if (meterId) params.meter_id = meterId;
  if (status) params.status = status;
  return api.get('/bills', { params });
};
export const payBill = (billId) => api.post(`/bills/${billId}/pay`);

export const getOutages = (status) => {
  const params = {};
  if (status) params.status = status;
  return api.get('/outages', { params });
};
export const createOutageOrder = (order) => api.post('/outages', order);

export const getStations = (lat, lon) => {
  const params = {};
  if (lat) params.lat = lat;
  if (lon) params.lon = lon;
  return api.get('/stations', { params });
};
export const getStation = (stationId) => api.get(`/stations/${stationId}`);

export const getPVContracts = (userId) => {
  const params = {};
  if (userId) params.user_id = userId;
  return api.get('/pv/contracts', { params });
};
export const createPVContract = (contract) => api.post('/pv/contracts', contract);

export const getResidentAnalysis = (userId) => api.get(`/analysis/resident/${userId}`);
export const getEnterpriseAnalysis = (userId) => api.get(`/analysis/enterprise/${userId}`);

export const getSatisfaction = () => api.get('/satisfaction');
export const createSatisfaction = (evaluation) => api.post('/satisfaction', evaluation);

export const getPolicies = (keyword, category) => {
  const params = {};
  if (keyword) params.keyword = keyword;
  if (category) params.category = category;
  return api.get('/policy', { params });
};

export const getWarnings = (userId) => {
  const params = {};
  if (userId) params.user_id = userId;
  return api.get('/warnings', { params });
};
export const createWarning = (warning) => api.post('/warnings', warning);

export const getStatistics = () => api.get('/statistics');

// Admin related
export const getAdminStats = () => api.get('/statistics');

// Applications for EV charger and PV
export const getApplications = (type) => {
  if (type === 'pv') {
    return api.get('/pv/contracts');
  }
  return api.get('/pv/contracts'); // Default to PV for now
};

export const createApplication = (data) => {
  if (data.type === 'pv') {
    return api.post('/pv/contracts', {
      contract_id: `PV${Date.now()}`,
      user_id: 'USER000001',
      capacity: data.capacity || 10,
      installation_date: new Date().toISOString().split('T')[0],
      status: 'applying',
      ...data
    });
  } else {
    // For EV charger, we'll use a similar approach
    return api.post('/pv/contracts', {
      contract_id: `EV${Date.now()}`,
      user_id: 'USER000001',
      capacity: data.capacity || 7,
      installation_date: new Date().toISOString().split('T')[0],
      status: 'applying',
      ...data
    });
  }
};

// PV Data
export const getPVData = () => {
  return Promise.all([
    api.get('/pv/contracts'),
    api.get('/statistics')
  ]).then(([contracts, stats]) => {
    const dailyData = [];
    for (let i = 30; i > 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      dailyData.push({
        date: date.toISOString().split('T')[0],
        generation: Math.round((Math.random() * 30 + 10) * 100) / 100,
        income: Math.round((Math.random() * 20 + 5) * 100) / 100
      });
    }
    
    return {
      data: {
        total_capacity: stats.data.total_pv_contracts * 20,
        total_generation: Math.round(stats.data.total_pv_contracts * 15000),
        co2_reduction: Math.round(stats.data.total_pv_contracts * 12000),
        income: Math.round(stats.data.total_pv_contracts * 30000),
        daily_data: dailyData
      }
    };
  });
};

export default api;
