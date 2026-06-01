import request from './index'

export const getAdminStats = () => {
  return request.get('/admin/stats')
}

export const getAdminParcels = (params) => {
  return request.get('/admin/parcels', { params })
}

export const updateParcelStatus = (trackingNo, statusData) => {
  return request.put(`/admin/parcels/${trackingNo}`, statusData)
}

export const getAdminOrders = (params) => {
  return request.get('/admin/orders', { params })
}

export const updateOrderStatus = (orderId, status) => {
  return request.put(`/admin/orders/${orderId}`, { status })
}

export const getAdminUsers = (params) => {
  return request.get('/admin/users', { params })
}

export const updateUserStatus = (userId, status) => {
  return request.put(`/admin/users/${userId}`, { status })
}

export const createUser = (userData) => {
  return request.post('/admin/users', userData)
}

export const deleteUser = (userId) => {
  return request.delete(`/admin/users/${userId}`)
}

export const getDashboardStats = () => {
  return request.get('/admin/dashboard')
}

export const getDailyStats = (dateRange) => {
  return request.get('/admin/stats/daily', { params: dateRange })
}
