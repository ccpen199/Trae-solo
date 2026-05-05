import request from '@/utils/request'

export const register = (data) => {
  return request.post('/users/register', data)
}

export const login = (data) => {
  return request.post('/users/login', data)
}

export const getProfile = () => {
  return request.get('/users/profile')
}

export const updateProfile = (data) => {
  return request.put('/users/profile', data)
}

export const updatePassword = (data) => {
  return request.put('/users/password', data)
}
