import axios from 'axios';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

export const getHealth = () => api.get('/health');

export const getDisasters = () => api.get('/dict/disasters');
export const getCrops = () => api.get('/dict/crops');
export const getUsers = (role) => api.get('/users', { params: { role } });
export const getUser = (id) => api.get(`/users/${id}`);
export const getFarmers = () => api.get('/farmers');
export const getFarmer = (id) => api.get(`/farmers/${id}`);

export const getPolicies = (params) => api.get('/policies', { params });
export const getPolicy = (id) => api.get(`/policies/${id}`);
export const createPolicy = (data) => api.post('/policies', data);
export const updatePolicy = (id, data) => api.put(`/policies/${id}`, data);
export const payPolicy = (id) => api.post(`/policies/${id}/pay`);

export const getReports = (params) => api.get('/reports', { params });
export const getReport = (id) => api.get(`/reports/${id}`);
export const createReport = (data) => api.post('/reports', data);
export const updateReport = (id, data) => api.put(`/reports/${id}`, data);

export const getSurveys = (params) => api.get('/surveys', { params });
export const getSurvey = (id) => api.get(`/surveys/${id}`);
export const createSurvey = (data) => api.post('/surveys', data);
export const updateSurvey = (id, data) => api.put(`/surveys/${id}`, data);

export const getClaims = (params) => api.get('/claims', { params });
export const getClaim = (id) => api.get(`/claims/${id}`);
export const createClaim = (data) => api.post('/claims', data);
export const approveClaim = (id, data) => api.post(`/claims/${id}/approve`, data);
export const rejectClaim = (id, data) => api.post(`/claims/${id}/reject`, data);
export const payClaim = (id) => api.post(`/claims/${id}/pay`);

export const getStatsOverview = (params) => api.get('/stats/overview', { params });
export const getDisasterDistribution = (params) => api.get('/stats/disaster-distribution', { params });
export const getCompensationProgress = () => api.get('/stats/compensation-progress');
export const getRejectionReasons = () => api.get('/stats/rejection-reasons');
export const getCropDistribution = () => api.get('/stats/crop-distribution');
export const getProcessingTime = (params) => api.get('/stats/processing-time', { params });
export const getRegulatoryReport = (params) => api.get('/stats/regulatory-report', { params });

export const getLogs = (params) => api.get('/logs', { params });

export default api;
