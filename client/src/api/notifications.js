import client from './client';

export async function getNotifications(params = {}) {
  const response = await client.get('/notifications', { params });
  return response.data;
}

export async function getUnreadCount() {
  const response = await client.get('/notifications/unread-count');
  return response.data;
}

export async function markAsRead(id) {
  const response = await client.post(`/notifications/${id}/read`);
  return response.data;
}

export async function markAllAsRead() {
  const response = await client.post('/notifications/read-all');
  return response.data;
}
