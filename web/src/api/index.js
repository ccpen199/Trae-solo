import request from './request'

export * from './auth'

export const getCategories = () => {
  return request.get('/categories')
}

export const getResources = (params) => {
  return request.get('/resources', { params })
}

export const getResourceById = (id) => {
  return request.get(`/resources/${id}`)
}

export const createResource = (data) => {
  return request.post('/resources', data)
}

export const toggleFavorite = (id) => {
  return request.post(`/resources/${id}/favorite`)
}

export const addComment = (id, data) => {
  return request.post(`/resources/${id}/comments`, data)
}

export const getGroups = (params) => {
  return request.get('/groups', { params })
}

export const getGroupById = (id) => {
  return request.get(`/groups/${id}`)
}

export const createGroup = (data) => {
  return request.post('/groups', data)
}

export const joinGroup = (id) => {
  return request.post(`/groups/${id}/join`)
}

export const getGroupPosts = (id, params) => {
  return request.get(`/groups/${id}/posts`, { params })
}

export const createGroupPost = (id, data) => {
  return request.post(`/groups/${id}/posts`, data)
}

export const getUserById = (id) => {
  return request.get(`/users/${id}`)
}

export const searchUsers = (params) => {
  return request.get('/users/search', { params })
}

export const getUserResources = (id, params) => {
  return request.get(`/users/${id}/resources`, { params })
}

export const updateProfile = (data) => {
  return request.put('/users/profile', data)
}

export const getFavorites = (params) => {
  return request.get('/users/favorites', { params })
}

export const removeFavorite = (id) => {
  return request.delete(`/users/favorites/${id}`)
}

export const getDashboardStats = () => {
  return request.get('/admin/dashboard')
}

export const getAdminStats = getDashboardStats

export const getPendingUsers = (params) => {
  return request.get('/admin/users/pending', { params })
}

export const reviewUser = (id, action) => {
  return request.post(`/admin/users/${id}/review`, { action })
}

export const getAdminUsers = (params) => {
  return request.get('/admin/users', { params })
}

export const updateUserStatus = reviewUser

export const getPendingResources = (params) => {
  return request.get('/admin/resources/pending', { params })
}

export const reviewResource = (id, action) => {
  return request.post(`/admin/resources/${id}/review`, { action })
}

export const getPendingComments = (params) => {
  return request.get('/admin/comments/pending', { params })
}

export const reviewComment = (id, action) => {
  return request.post(`/admin/comments/${id}/review`, { action })
}

export const getAdminCategories = () => {
  return request.get('/admin/categories')
}

export const createCategory = (data) => {
  return request.post('/admin/categories', data)
}

export const updateCategory = (id, data) => {
  return request.put(`/admin/categories/${id}`, data)
}
