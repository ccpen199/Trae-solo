import request from './request'

export const getProductList = (params) => {
  return request.get('/product/list', { params })
}

export const getProductDetail = (id) => {
  return request.get(`/product/detail/${id}`)
}

export const searchProducts = (params) => {
  return request.get('/product/search', { params })
}

export const scanProduct = (data) => {
  return request.post('/product/scan', data)
}

export const toggleFavorite = (data) => {
  return request.post('/product/favorite', data)
}

export const getFavorites = (params) => {
  return request.get('/product/favorites', { params })
}

export const getCart = () => {
  return request.get('/product/cart')
}

export const addToCart = (data) => {
  return request.post('/product/cart/add', data)
}

export const updateCart = (data) => {
  return request.post('/product/cart/update', data)
}

export const removeFromCart = (data) => {
  return request.post('/product/cart/remove', data)
}

export const createOrder = (data) => {
  return request.post('/product/order/create', data)
}

export const payOrder = (data) => {
  return request.post('/product/order/pay', data)
}
