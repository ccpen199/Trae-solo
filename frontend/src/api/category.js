import request from './request'

export function getPublicCategories() {
  return request.get('/public/categories')
}

export function getAdminCategories(params) {
  return request.get('/admin/categories', { params })
}

export function getAllAdminCategories() {
  return request.get('/admin/categories/all')
}

export function createCategory(data) {
  return request.post('/admin/categories', data)
}

export function updateCategory(id, data) {
  return request.put(`/admin/categories/${id}`, data)
}

export function deleteCategory(id) {
  return request.delete(`/admin/categories/${id}`)
}

export function getSubCategories(categoryId) {
  return request.get(`/admin/categories/${categoryId}/sub-categories`)
}

export function createSubCategory(data) {
  return request.post('/admin/categories/sub-categories', data)
}

export function updateSubCategory(id, data) {
  return request.put(`/admin/categories/sub-categories/${id}`, data)
}

export function deleteSubCategory(id) {
  return request.delete(`/admin/categories/sub-categories/${id}`)
}
