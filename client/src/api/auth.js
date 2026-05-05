import request from '../utils/request'

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

export const getCurrentUser = () => {
  return request({
    url: '/auth/current',
    method: 'GET'
  })
}

export const changePassword = (data) => {
  return request({
    url: '/auth/change-password',
    method: 'POST',
    data
  })
}

export const getMenus = () => {
  return request({
    url: '/permissions/menus',
    method: 'GET'
  })
}

export const getButtonPermissions = () => {
  return request({
    url: '/permissions/buttons',
    method: 'GET'
  })
}
