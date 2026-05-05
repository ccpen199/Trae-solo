import request from '@/utils/request'

export const login = (data) => {
  return request({
    url: '/auth/login',
    method: 'POST',
    data
  })
}

export const logout = () => {
  return request({
    url: '/auth/logout',
    method: 'POST'
  })
}

export const getUserInfo = () => {
  return request({
    url: '/auth/info',
    method: 'GET'
  })
}
