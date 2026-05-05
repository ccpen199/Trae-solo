import request from '@/utils/request';

export const userService = {
  getMyFavorites: async (params = {}) => {
    const response = await request.get('/users/favorites', { params });
    return response.data;
  },

  getBrowseHistory: async (params = {}) => {
    const response = await request.get('/users/browse-history', { params });
    return response.data;
  },

  clearBrowseHistory: async () => {
    const response = await request.delete('/users/browse-history');
    return response.data;
  },

  getMyCoupons: async (params = {}) => {
    const response = await request.get('/users/coupons', { params });
    return response.data;
  },

  getNotifications: async (params = {}) => {
    const response = await request.get('/users/notifications', { params });
    return response.data;
  },

  markNotificationRead: async (id) => {
    const response = await request.put(`/users/notifications/${id}/read`);
    return response.data;
  },

  markAllNotificationsRead: async () => {
    const response = await request.put('/users/notifications/read-all');
    return response.data;
  },

  getMyReviews: async (params = {}) => {
    const response = await request.get('/users/reviews', { params });
    return response.data;
  },

  createReview: async (reviewData) => {
    const response = await request.post('/users/reviews', reviewData);
    return response.data;
  },
};