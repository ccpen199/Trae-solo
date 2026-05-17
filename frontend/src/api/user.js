import request from '@/utils/request'

export const register = (data) => {
  return request({
    url: '/users/register',
    method: 'post',
    data
  })
}

export const login = (data) => {
  return request({
    url: '/users/login',
    method: 'post',
    data
  })
}

export const getProfile = () => {
  return request({
    url: '/users/profile',
    method: 'get'
  })
}

export const updateProfile = (data) => {
  return request({
    url: '/users/profile',
    method: 'put',
    data
  })
}
