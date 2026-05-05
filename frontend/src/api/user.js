import request from './index'

export const login = (data) => {
  return request.post('/users/login', data)
}

export const register = (data) => {
  return request.post('/users/register', data)
}

export const sendVerificationCode = (phone, type) => {
  return request.post('/users/send-code', { phone, type })
}

export const getUserProfile = () => {
  return request.get('/users/profile')
}

export const updateUserProfile = (data) => {
  return request.put('/users/profile', data)
}

export const changePassword = (data) => {
  return request.put('/users/password', data)
}
