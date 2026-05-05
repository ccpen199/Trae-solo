import request from '@/utils/request'

export const getCart = () => {
  return request.get('/carts')
}

export const addToCart = (data) => {
  return request.post('/carts', data)
}

export const updateCartItem = (productId, quantity) => {
  return request.put(`/carts/${productId}`, { quantity })
}

export const removeFromCart = (productId) => {
  return request.delete(`/carts/${productId}`)
}

export const clearCart = () => {
  return request.delete('/carts')
}

export const checkout = () => {
  return request.post('/carts/checkout')
}

export const confirmPurchase = () => {
  return request.post('/carts/confirm')
}
