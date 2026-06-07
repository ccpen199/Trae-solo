import api from './api';

export const diagnose = (data) => api.post('/faults/diagnose', data);
export const getFaults = (params) => api.get('/faults', { params });
export const getFault = (id) => api.get(`/faults/${id}`);
export const createFault = (data) => api.post('/faults', data);
export const updateFault = (id, data) => api.put(`/faults/${id}`, data);
