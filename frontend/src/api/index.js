import request from '../utils/request'

export const login = (data) => request.post('/auth/login', data)
export const register = (data) => request.post('/auth/register', data)
export const getUser = (id) => request.get(`/users/${id}`)
export const getUsers = (params) => request.get('/users', { params })
export const verifyUser = (id, data) => request.put(`/users/${id}/verify`, data)

export const getBuildings = () => request.get('/buildings')
export const getRooms = (params) => request.get('/rooms', { params })
export const bindRoom = (data) => request.post('/user-rooms/bind', data)
export const getUserRooms = (params) => request.get('/user-rooms', { params })
export const verifyRoomBind = (id, data) => request.put(`/user-rooms/${id}/verify`, data)

export const getAccessDevices = (params) => request.get('/access-devices', { params })
export const getAccessRecords = (params) => request.get('/access-records', { params })
export const verifyAccess = (data) => request.post('/access/verify', data)

export const getVisitors = (params) => request.get('/visitors', { params })
export const getOverstayVisitors = () => request.get('/visitors/overstay')
export const createVisitor = (data) => request.post('/visitors', data)
export const checkinVisitor = (id, data) => request.post(`/visitors/${id}/checkin`, data)
export const checkoutVisitor = (id) => request.post(`/visitors/${id}/checkout`)

export const getCategories = () => request.get('/product-categories')

export const getMerchants = (params) => request.get('/merchants', { params })
export const getMerchant = (id) => request.get(`/merchants/${id}`)
export const verifyMerchant = (id, data) => request.put(`/merchants/${id}/verify`, data)

export const getProducts = (params) => request.get('/products', { params })
export const getProduct = (id) => request.get(`/products/${id}`)
export const purchaseProduct = (id, data) => request.post(`/products/${id}/purchase`, data)

export const getOrders = (params) => request.get('/orders', { params })
export const payOrder = (id) => request.post(`/orders/${id}/pay`)

export const getCoupons = (params) => request.get('/coupons', { params })

export const getAnnouncements = (params) => request.get('/announcements', { params })
export const readAnnouncement = (id, data) => request.post(`/announcements/${id}/read`, data)
export const createAnnouncement = (data) => request.post('/announcements', data)

export const getAlerts = (params) => request.get('/alerts', { params })
export const handleAlert = (id, data) => request.put(`/alerts/${id}/handle`, data)

export const getSecurityEvents = (params) => request.get('/security-events', { params })
export const handleSecurityEvent = (id, data) => request.put(`/security-events/${id}/handle`, data)

export const getDeviceHealthLogs = (params) => request.get('/device-health-logs', { params })

export const getDashboardStats = () => request.get('/dashboard/stats')
