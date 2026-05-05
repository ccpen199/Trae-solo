import request from './request'

export function getPublicArticles(params) {
  return request.get('/public/articles', { params })
}

export function getPublicArticle(id) {
  return request.get(`/public/articles/${id}`)
}

export function getRecentArticles(limit = 10) {
  return request.get('/public/articles/recent', { params: { limit } })
}

export function getStatistics() {
  return request.get('/public/statistics')
}

export function createArticle(data) {
  return request.post('/articles', data)
}

export function updateArticle(id, data) {
  return request.put(`/articles/${id}`, data)
}

export function deleteArticle(id) {
  return request.delete(`/articles/${id}`)
}

export function getAdminArticles(params) {
  return request.get('/admin/articles', { params })
}

export function getAdminArticle(id) {
  return request.get(`/admin/articles/${id}`)
}

export function lockArticle(id, locked) {
  return request.put(`/admin/articles/${id}/lock`, null, { params: { locked } })
}

export function topArticle(id, isTop) {
  return request.put(`/admin/articles/${id}/top`, null, { params: { isTop } })
}

export function deleteAdminArticle(id) {
  return request.delete(`/admin/articles/${id}`)
}
