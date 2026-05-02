import axios from 'axios';

const API_BASE = '/api';

export const DEFAULT_USER = {
  id: 'consumer_001',
  name: '张三',
  role: 'consumer'
};

const getOperatorHeaders = (user) => {
  return {
    'X-Operator-Id': user?.id || DEFAULT_USER.id,
    'X-Operator-Name': user?.name || DEFAULT_USER.name,
    'X-Operator-Role': user?.role || DEFAULT_USER.role
  };
};

export const api = {
  async getHealth() {
    const response = await axios.get(`${API_BASE}/health`);
    return response.data;
  },

  async getConfig() {
    const response = await axios.get(`${API_BASE}/config`);
    return response.data;
  },

  async getUsers(role) {
    const params = role ? { role } : {};
    const response = await axios.get(`${API_BASE}/users`, { params });
    return response.data;
  },

  async getUser(id) {
    const response = await axios.get(`${API_BASE}/users/${id}`);
    return response.data;
  },

  async createOrder(data, user) {
    const response = await axios.post(`${API_BASE}/orders`, data, {
      headers: getOperatorHeaders(user)
    });
    return response.data;
  },

  async getOrders(params = {}) {
    const response = await axios.get(`${API_BASE}/orders`, { params });
    return response.data;
  },

  async getOrder(id) {
    const response = await axios.get(`${API_BASE}/orders/${id}`);
    return response.data;
  },

  async openCamera(orderId, data, user) {
    const response = await axios.post(`${API_BASE}/orders/${orderId}/open-camera`, data, {
      headers: getOperatorHeaders(user)
    });
    return response.data;
  },

  async getAvailableActions(orderId) {
    const response = await axios.get(`${API_BASE}/orders/${orderId}/actions`);
    return response.data;
  },

  async recognize(orderId, data, user) {
    const response = await axios.post(`${API_BASE}/orders/${orderId}/recognize`, data, {
      headers: getOperatorHeaders(user)
    });
    return response.data;
  },

  async getRecognitionResult(orderId) {
    const response = await axios.get(`${API_BASE}/orders/${orderId}/recognition`);
    return response.data;
  },

  async getProducts(category) {
    const params = category ? { category } : {};
    const response = await axios.get(`${API_BASE}/products`, { params });
    return response.data;
  },

  async getProduct(id) {
    const response = await axios.get(`${API_BASE}/products/${id}`);
    return response.data;
  },

  async startTryon(orderId, productId, user) {
    const response = await axios.post(`${API_BASE}/orders/${orderId}/start-tryon`, { productId }, {
      headers: getOperatorHeaders(user)
    });
    return response.data;
  },

  async completeTryon(orderId, data, user) {
    const response = await axios.post(`${API_BASE}/orders/${orderId}/complete-tryon`, data, {
      headers: getOperatorHeaders(user)
    });
    return response.data;
  },

  async saveScreenshot(data, user) {
    const response = await axios.post(`${API_BASE}/screenshots`, data, {
      headers: getOperatorHeaders(user)
    });
    return response.data;
  },

  async saveShare(orderId, data, user) {
    const response = await axios.post(`${API_BASE}/orders/${orderId}/save-share`, data, {
      headers: getOperatorHeaders(user)
    });
    return response.data;
  },

  async submitApproval(orderId, user) {
    const response = await axios.post(`${API_BASE}/orders/${orderId}/submit-approval`, {}, {
      headers: getOperatorHeaders(user)
    });
    return response.data;
  },

  async approve(orderId, data, user) {
    const response = await axios.post(`${API_BASE}/orders/${orderId}/approve`, data, {
      headers: getOperatorHeaders(user)
    });
    return response.data;
  },

  async reject(orderId, data, user) {
    const response = await axios.post(`${API_BASE}/orders/${orderId}/reject`, data, {
      headers: getOperatorHeaders(user)
    });
    return response.data;
  },

  async placeOrder(orderId, user) {
    const response = await axios.post(`${API_BASE}/orders/${orderId}/place-order`, {}, {
      headers: getOperatorHeaders(user)
    });
    return response.data;
  },

  async reassign(orderId, newResponsiblePerson, user) {
    const response = await axios.post(`${API_BASE}/orders/${orderId}/reassign`, { newResponsiblePerson }, {
      headers: getOperatorHeaders(user)
    });
    return response.data;
  },

  async cancelOrder(orderId, user) {
    const response = await axios.post(`${API_BASE}/orders/${orderId}/cancel`, {}, {
      headers: getOperatorHeaders(user)
    });
    return response.data;
  },

  async createReverseOrder(orderId, data, user) {
    const response = await axios.post(`${API_BASE}/orders/${orderId}/reverse`, data, {
      headers: getOperatorHeaders(user)
    });
    return response.data;
  },

  async getReverseOrders(orderId) {
    const response = await axios.get(`${API_BASE}/orders/${orderId}/reverse`);
    return response.data;
  },

  async getTodos(userId, status) {
    const params = { userId };
    if (status) params.status = status;
    const response = await axios.get(`${API_BASE}/todos`, { params });
    return response.data;
  },

  async getTodoCount(userId) {
    const response = await axios.get(`${API_BASE}/todos/count`, { params: { userId } });
    return response.data;
  },

  async completeTodo(todoId, userId, user) {
    const response = await axios.post(`${API_BASE}/todos/${todoId}/complete`, { userId }, {
      headers: getOperatorHeaders(user)
    });
    return response.data;
  },

  async getNotifications(userId, isRead) {
    const params = { userId };
    if (isRead !== undefined) params.isRead = isRead;
    const response = await axios.get(`${API_BASE}/notifications`, { params });
    return response.data;
  },

  async getNotificationCount(userId) {
    const response = await axios.get(`${API_BASE}/notifications/count`, { params: { userId } });
    return response.data;
  },

  async markNotificationRead(notificationId, userId) {
    const response = await axios.post(`${API_BASE}/notifications/${notificationId}/read`, { userId });
    return response.data;
  },

  async getDashboardStats() {
    const response = await axios.get(`${API_BASE}/dashboard/stats`);
    return response.data;
  },

  async getOrdersByStatus() {
    const response = await axios.get(`${API_BASE}/dashboard/orders-by-status`);
    return response.data;
  },

  async getTopProducts(limit) {
    const params = limit ? { limit } : {};
    const response = await axios.get(`${API_BASE}/dashboard/top-products`, { params });
    return response.data;
  },

  async createSnapshot() {
    const response = await axios.post(`${API_BASE}/snapshots`);
    return response.data;
  },

  async getSnapshots(limit) {
    const params = limit ? { limit } : {};
    const response = await axios.get(`${API_BASE}/snapshots`, { params });
    return response.data;
  },

  async getConsumerStats(consumerId) {
    const response = await axios.get(`${API_BASE}/consumers/${consumerId}/stats`);
    return response.data;
  },

  async getAuditLogs(params = {}) {
    const response = await axios.get(`${API_BASE}/audit-logs`, { params });
    return response.data;
  },

  async getOrderAuditLogs(orderId) {
    const response = await axios.get(`${API_BASE}/orders/${orderId}/audit-logs`);
    return response.data;
  }
};

export default api;
