import request from './request'

export const sendCode = (data) => {
  return request.post('/auth/send-code', data)
}

export const loginByCode = (data) => {
  return request.post('/auth/login-code', data)
}

export const loginByPassword = (data) => {
  return request.post('/auth/login-password', data)
}

export const register = (data) => {
  return request.post('/auth/register', data)
}

export const thirdLogin = (data) => {
  return request.post('/auth/third-login', data)
}
