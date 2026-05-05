import request from '@/utils/request'

export const getProductList = (params) => {
  return request({
    url: '/products',
    method: 'GET',
    params
  })
}

export const getProductDetail = (id) => {
  return request({
    url: `/products/${id}`,
    method: 'GET'
  })
}

export const createProduct = (data) => {
  return request({
    url: '/products',
    method: 'POST',
    data
  })
}

export const updateProduct = (id, data) => {
  return request({
    url: `/products/${id}`,
    method: 'PUT',
    data
  })
}

export const getInventoryList = (params) => {
  return request({
    url: '/products/inventory/list',
    method: 'GET',
    params
  })
}

export const inventoryCheck = (productId, data) => {
  return request({
    url: `/products/${productId}/inventory-check`,
    method: 'POST',
    data
  })
}

export const getInventoryChecks = (params) => {
  return request({
    url: '/products/inventory-checks/list',
    method: 'GET',
    params
  })
}

export const stockIn = (data) => {
  return request({
    url: '/products/stock-in',
    method: 'POST',
    data
  })
}

export const getStockInList = (params) => {
  return request({
    url: '/products/stock-in/list',
    method: 'GET',
    params
  })
}

export const getStockOutList = (params) => {
  return request({
    url: '/products/stock-out/list',
    method: 'GET',
    params
  })
}
