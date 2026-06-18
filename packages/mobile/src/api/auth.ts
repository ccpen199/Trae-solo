import request from './request'

export const login = (data: { phone: string; password: string }) => {
  return request.post('/auth/login', data)
}

export const register = (data: {
  phone: string
  code: string
  password: string
}) => {
  return request.post('/auth/register', data)
}

export const getUserInfo = () => {
  return request.get('/user/info')
}
