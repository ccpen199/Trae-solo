import request from '@/utils/request';

export const orderService = {
  getOrders: async (params = {}) => {
    const response = await request.get('/orders', { params });
    return response.data;
  },

  getOrderDetail: async (id) => {
    const response = await request.get(`/orders/${id}`);
    return response.data;
  },

  createOrder: async (orderData) => {
    const response = await request.post('/orders', orderData);
    return response.data;
  },

  updateOrderStatus: async (id, action, cancelReason) => {
    const response = await request.put(`/orders/${id}/status`, { action, cancelReason });
    return response.data;
  },
};
