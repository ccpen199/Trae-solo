import request from './index'

export const calculatePrice = (params) => {
  return request.post('/shipping/calculate-price', params)
}

export const createOrder = (orderData) => {
  return request.post('/shipping/create-order', orderData)
}

export const getOrders = (params) => {
  return request.get('/shipping/orders', { params })
}

export const getOrderDetail = (orderId) => {
  return request.get(`/shipping/orders/${orderId}`)
}

export const cancelOrder = (orderId) => {
  return request.post(`/shipping/orders/${orderId}/cancel`)
}

export const schedulePickup = (orderId, scheduleData) => {
  return request.post('/shipping/schedule-pickup', { order_id: orderId, ...scheduleData })
}

export const createLargeItemOrder = (orderData) => {
  return request.post('/shipping/large-item', orderData)
}

export const getLargeItemServices = () => {
  return request.get('/shipping/couriers')
}

export const getServiceTypes = () => {
  return request.get('/shipping/couriers')
}
