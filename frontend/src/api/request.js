import api from './index';

export const getRequests = (status = 'pending') => {
  return api.get('/requests', { params: { status } });
};

export const getRequestDetail = (id) => {
  return api.get(`/requests/${id}`);
};

export const createRequest = (data) => {
  return api.post('/requests', data);
};

export const acceptRequest = (id) => {
  return api.post(`/requests/${id}/accept`);
};

export const cancelRequest = (id) => {
  return api.delete(`/requests/${id}`);
};

export const getAddressHistory = () => {
  return api.get('/requests/address/history');
};
