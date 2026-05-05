import request from './request'

export const getWallet = () => {
  return request.get('/fuel/wallet')
}

export const recharge = (data) => {
  return request.post('/fuel/recharge', data)
}

export const getTransactions = (params) => {
  return request.get('/fuel/transactions', { params })
}

export const getVehicles = () => {
  return request.get('/fuel/vehicles')
}

export const addVehicle = (data) => {
  return request.post('/fuel/vehicle/add', data)
}

export const setDefaultVehicle = (data) => {
  return request.post('/fuel/vehicle/set-default', data)
}

export const removeVehicle = (data) => {
  return request.post('/fuel/vehicle/remove', data)
}

export const getFuelOrders = (params) => {
  return request.get('/fuel/fuel-orders', { params })
}

export const createFuelOrder = (data) => {
  return request.post('/fuel/fuel-order/create', data)
}

export const payFuelOrder = (data) => {
  return request.post('/fuel/fuel-order/pay', data)
}

export const quickFuel = (data) => {
  return request.post('/fuel/quick-fuel', data)
}

export const setPaymentPassword = (data) => {
  return request.post('/fuel/set-payment-password', data)
}
