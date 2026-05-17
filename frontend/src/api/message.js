import api from './index';

export const getMessages = (orderId) => {
  return api.get(`/messages/order/${orderId}`);
};

export const sendMessage = (orderId, content) => {
  return api.post(`/messages/order/${orderId}`, { content });
};

export const getUnreadCount = () => {
  return api.get('/messages/unread-count');
};
