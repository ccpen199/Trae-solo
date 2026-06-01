import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000
});

export const getStores = () => api.get('/stores').then(r => r.data);
export const getStore = (id) => api.get(`/stores/${id}`).then(r => r.data);
export const createStore = (data) => api.post('/stores', data).then(r => r.data);
export const updateStore = (id, data) => api.put(`/stores/${id}`, data).then(r => r.data);
export const deleteStore = (id) => api.delete(`/stores/${id}`).then(r => r.data);

export const getStaff = (params) => api.get('/staff', { params }).then(r => r.data);
export const getStaffMember = (id) => api.get(`/staff/${id}`).then(r => r.data);
export const createStaff = (data) => api.post('/staff', data).then(r => r.data);
export const updateStaff = (id, data) => api.put(`/staff/${id}`, data).then(r => r.data);
export const deleteStaff = (id) => api.delete(`/staff/${id}`).then(r => r.data);

export const getServices = () => api.get('/services').then(r => r.data);
export const getService = (id) => api.get(`/services/${id}`).then(r => r.data);
export const getServiceAvailability = (id, params) => api.get(`/services/${id}/availability`, { params }).then(r => r.data);
export const createService = (data) => api.post('/services', data).then(r => r.data);
export const updateService = (id, data) => api.put(`/services/${id}`, data).then(r => r.data);
export const deleteService = (id) => api.delete(`/services/${id}`).then(r => r.data);

export const getAppointments = (params) => api.get('/appointments', { params }).then(r => r.data);
export const getAppointment = (id) => api.get(`/appointments/${id}`).then(r => r.data);
export const createAppointment = (data) => api.post('/appointments', data).then(r => r.data);
export const checkInAppointment = (id) => api.put(`/appointments/${id}/checkin`).then(r => r.data);
export const startService = (id) => api.put(`/appointments/${id}/start-service`).then(r => r.data);
export const completeAppointment = (id, data) => api.put(`/appointments/${id}/complete`, data).then(r => r.data);
export const rescheduleAppointment = (id, data) => api.put(`/appointments/${id}/reschedule`, data).then(r => r.data);
export const cancelAppointment = (id, data) => api.put(`/appointments/${id}/cancel`, data).then(r => r.data);
export const markNoShow = (id) => api.put(`/appointments/${id}/no-show`).then(r => r.data);
export const createReview = (id, data) => api.post(`/appointments/${id}/review`, data).then(r => r.data);

export const getReportSummary = (params) => api.get('/reports/summary', { params }).then(r => r.data);
export const getStaffLoad = (params) => api.get('/reports/staff-load', { params }).then(r => r.data);
export const getNoShowReasons = (params) => api.get('/reports/no-show-reasons', { params }).then(r => r.data);
export const getServicePopularity = (params) => api.get('/reports/service-popularity', { params }).then(r => r.data);
export const getDailyTrend = (params) => api.get('/reports/daily-trend', { params }).then(r => r.data);

export default api;
