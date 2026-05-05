import request from '@/utils/request'

export const getProducts = (params) => {
  return request.get('/products', { params })
}

export const getProductById = (id) => {
  return request.get(`/products/${id}`)
}

export const getCategories = () => {
  return request.get('/products/categories')
}

export const createProduct = (data) => {
  return request.post('/products', data)
}

export const updateProduct = (id, data) => {
  return request.put(`/products/${id}`, data)
}

export const deleteProduct = (id) => {
  return request.delete(`/products/${id}`)
}

export const getAllProductsAdmin = (params) => {
  return request.get('/products/admin/all', { params })
}

export const createCategory = (data) => {
  return request.post('/products/categories', data)
}

export const updateCategory = (id, data) => {
  return request.put(`/products/categories/${id}`, data)
}

export const deleteCategory = (id) => {
  return request.delete(`/products/categories/${id}`)
}
