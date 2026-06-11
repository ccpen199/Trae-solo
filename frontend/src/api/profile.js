import request from './request';

export const getProfileInfo = () => {
  return request.get('/profile/info');
};

export const getArchives = (params) => {
  return request.get('/profile/archives', { params });
};

export const getNotifications = (params) => {
  return request.get('/profile/notifications', { params });
};

export const markNotificationRead = (id) => {
  return request.post(`/profile/notifications/${id}/read`, {}, { loading: false });
};

export const markAllNotificationsRead = () => {
  return request.post('/profile/notifications/read-all');
};

export const getAuthorizations = () => {
  return request.get('/profile/authorizations');
};

export const toggleAuthorization = (id) => {
  return request.post(`/profile/authorizations/${id}/toggle`);
};

export const getAuditLogs = (params) => {
  return request.get('/profile/audit-logs', { params });
};
