import api from './api';

export const createOrder = (data) => api.post('/orders', data);
export const getOrders = (params) => api.get('/orders', { params });
export const getOrder = (id) => api.get(`/orders/${id}`);
export const updateOrderStatus = (id, data) => api.put(`/orders/${id}/status`, data);
export const assignEngineer = (id, engineerId) => api.post(`/orders/${id}/assign`, { engineerId });
export const getRecommendedEngineers = (params) => api.get('/orders/engineers/recommend', { params });
export const uploadEvidence = (id, data) => api.post(`/orders/${id}/evidence`, data);
export const addRating = (id, data) => api.post(`/orders/${id}/rating`, data);
