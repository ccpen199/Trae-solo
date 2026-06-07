import api from './api';

export const getEngineers = (params) => api.get('/engineers', { params });
export const getEngineer = (id) => api.get(`/engineers/${id}`);
export const getEngineerSkills = (id) => api.get(`/engineers/${id}/skills`);
export const createEngineer = (data) => api.post('/engineers', data);
export const updateEngineer = (id, data) => api.put(`/engineers/${id}`, data);
export const addSkill = (data) => api.post('/engineers/skills', data);
