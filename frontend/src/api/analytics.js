import request from './index';

export const getDashboard = (params) => {
  return request.get('/analytics/dashboard', { params });
};

export const getTimeMonitoring = (params) => {
  return request.get('/analytics/time-monitoring', { params });
};

export const getWorkflowTimeline = (params) => {
  return request.get('/analytics/workflow-timeline', { params });
};

export const getSlaAlerts = (params) => {
  return request.get('/analytics/sla-alerts', { params });
};

export const getSatisfaction = (params) => {
  return request.get('/analytics/satisfaction', { params });
};

export const submitSatisfaction = (data) => {
  return request.post('/satisfaction/submit', data);
};

export const getHeatmap = (params) => {
  return request.get('/analytics/heatmap', { params });
};

export const getRegionalStats = (params) => {
  return request.get('/analytics/regional-stats', { params });
};

export const getAuditLogs = (params) => {
  return request.get('/audit-logs', { params });
};

export const getNotifications = () => {
  return request.get('/notifications');
};

export const markNotificationRead = (id) => {
  return request.post(`/notifications/${id}/read`);
};

export const markAllNotificationsRead = () => {
  return request.post('/notifications/read-all');
};
