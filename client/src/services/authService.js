import api from '../utils/api';

export const authService = {
  register: (data) => {
    return api.post('/auth/register', data);
  },
  
  login: (data) => {
    return api.post('/auth/login', data);
  },
  
  logout: () => {
    return api.post('/auth/logout');
  },
  
  getProfile: () => {
    return api.get('/auth/profile');
  },
  
  updateProfile: (data) => {
    return api.put('/auth/profile', data);
  },
  
  changePassword: (data) => {
    return api.put('/auth/change-password', data);
  }
};