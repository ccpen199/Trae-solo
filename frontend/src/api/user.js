import api from './index'

export const userApi = {
  
  register: (data) => {
    return api.post('/api/auth/register', data)
  },

  login: (data) => {
    return api.post('/api/auth/login', data)
  },

  getProfile: () => {
    return api.get('/api/user/profile')
  },

  updateProfile: (data) => {
    return api.put('/api/user/profile', data)
  },

  changePassword: (data) => {
    return api.put('/api/user/password', data)
  }
}
