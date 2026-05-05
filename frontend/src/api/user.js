import request from './request'

export const getProfile = () => {
  return request.get('/user/profile')
}

export const updateProfile = (data) => {
  return request.post('/user/profile/update', data)
}

export const changePassword = (data) => {
  return request.post('/user/change-password', data)
}

export const getCoupons = (params) => {
  return request.get('/user/coupons', { params })
}

export const getOrders = (params) => {
  return request.get('/user/orders', { params })
}

export const getOrderDetail = (id) => {
  return request.get(`/user/order/${id}`)
}

export const createInvite = () => {
  return request.post('/user/invite/create')
}

export const claimInvite = (data) => {
  return request.post('/user/invite/claim', data)
}

export const getPointsExchange = () => {
  return request.get('/user/points-exchange')
}

export const exchangePoints = (data) => {
  return request.post('/user/points-exchange', data)
}
