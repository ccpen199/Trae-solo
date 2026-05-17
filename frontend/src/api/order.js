import api from './index';

export const getOrders = (status) => {
  return api.get('/orders', { params: status ? { status } : {} });
};

export const getOrderDetail = (id) => {
  return api.get(`/orders/${id}`);
};

export const cancelOrder = (id) => {
  return api.post(`/orders/${id}/cancel`);
};

export const completeOrder = (id) => {
  return api.post(`/orders/${id}/complete`);
};

export const reviewOrder = (id, data) => {
  return api.post(`/orders/${id}/review`, data);
};

export const addClassRecord = (id, data) => {
  return api.post(`/orders/${id}/class-record`, data);
};
