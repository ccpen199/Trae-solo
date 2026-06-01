import request from './index'

export const login = (username, password) => {
  return request.post('/auth/login', { username, password })
}

export const register = (userData) => {
  return request.post('/auth/register', userData)
}

export const logout = () => {
  return request.post('/auth/logout')
}

export const getCurrentUser = () => {
  return request.get('/auth/me')
}

export const updateProfile = (userData) => {
  return request.put('/auth/profile', userData)
}

export const changePassword = (oldPassword, newPassword) => {
  return request.post('/auth/password', { oldPassword, newPassword })
}
