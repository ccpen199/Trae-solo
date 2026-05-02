import request from '@/utils/request'

export const orderApi = {
  list: (params) => request.get('/orders', { params }),
  create: (data) => request.post('/orders', data),
  detail: (id) => request.get(`/orders/${id}`),
  update: (id, data) => request.put(`/orders/${id}`, data),
  delete: (id) => request.delete(`/orders/${id}`),
  import: (data) => request.post('/orders/import', data),
  dispatch: (id, data) => request.post(`/orders/${id}/dispatch`, data),
  cancel: (id) => request.post(`/orders/${id}/cancel`)
}

export const waybillApi = {
  list: (params) => request.get('/waybills', { params }),
  detail: (id) => request.get(`/waybills/${id}`),
  create: (data) => request.post('/waybills', data),
  update: (id, data) => request.put(`/waybills/${id}`, data),
  statusUpdate: (id, status) => request.post(`/waybills/${id}/status`, { status }),
  accept: (id) => request.post(`/waybills/${id}/accept`),
  pickup: (id) => request.post(`/waybills/${id}/pickup`),
  depart: (id) => request.post(`/waybills/${id}/depart`),
  arrive: (id) => request.post(`/waybills/${id}/arrive`),
  sign: (id, data) => request.post(`/waybills/${id}/sign`, data)
}

export const dispatchApi = {
  pendingTasks: () => request.get('/dispatch/tasks'),
  recommend: (params) => request.get('/dispatch/recommend', { params }),
  assign: (data) => request.post('/dispatch/assign', data),
  batchAssign: (data) => request.post('/dispatch/batch', data),
  history: (params) => request.get('/dispatch/history', { params })
}

export const monitorApi = {
  waybills: (params) => request.get('/monitor/waybills', { params }),
  waybillLocation: (id) => request.get(`/monitor/waybills/${id}`),
  tracks: (waybillId) => request.get(`/tracks/${waybillId}`),
  trackReplay: (waybillId) => request.get(`/tracks/${waybillId}/replay`),
  exceptions: (params) => request.get('/tracks/exceptions', { params }),
  createException: (data) => request.post('/tracks/exceptions', data),
  handleException: (id, data) => request.put(`/tracks/exceptions/${id}`, data)
}

export const vehicleApi = {
  list: (params) => request.get('/vehicles', { params }),
  detail: (id) => request.get(`/vehicles/${id}`),
  create: (data) => request.post('/vehicles', data),
  update: (id, data) => request.put(`/vehicles/${id}`, data),
  location: (id) => request.get(`/vehicles/${id}/location`)
}

export const driverApi = {
  list: (params) => request.get('/drivers', { params }),
  detail: (id) => request.get(`/drivers/${id}`),
  create: (data) => request.post('/drivers', data),
  update: (id, data) => request.put(`/drivers/${id}`, data),
  updateLocation: (data) => request.post('/driver/location', data),
  myWaybills: (params) => request.get('/driver/waybills', { params }),
  waybillDetail: (id) => request.get(`/driver/waybills/${id}`),
  acceptWaybill: (id) => request.post(`/driver/waybills/${id}/accept`),
  pickupWaybill: (id, data) => request.post(`/driver/waybills/${id}/pickup`, data),
  departWaybill: (id, data) => request.post(`/driver/waybills/${id}/depart`, data),
  arriveWaybill: (id, data) => request.post(`/driver/waybills/${id}/arrive`, data),
  signWaybill: (id, data) => request.post(`/driver/waybills/${id}/sign`, data),
  completeWaybill: (id) => request.post(`/driver/waybills/${id}/complete`),
  reportException: (data) => request.post('/driver/exception', data),
  getCurrentWaybill: (params) => request.get('/driver/current', { params })
}

export const receiptApi = {
  upload: (waybillId, data) => request.post(`/receipts/${waybillId}`, data),
  detail: (id) => request.get(`/receipts/${id}`)
}

export const freightApi = {
  list: (params) => request.get('/freights', { params }),
  detail: (id) => request.get(`/freights/${id}`),
  calculate: (waybillId) => request.post(`/freights/calculate/${waybillId}`),
  confirm: (id) => request.post(`/freights/${id}/confirm`)
}

export const statementApi = {
  list: (params) => request.get('/statements', { params }),
  detail: (id) => request.get(`/statements/${id}`),
  create: (data) => request.post('/statements', data),
  update: (id, data) => request.put(`/statements/${id}`, data),
  send: (id) => request.post(`/statements/${id}/send`),
  settle: (id) => request.post(`/statements/${id}/settle`),
  export: (id) => request.get(`/statements/${id}/export`, { responseType: 'blob' }),
  confirm: (id) => request.post(`/statements/${id}/confirm`)
}

export const reportApi = {
  timely: (params) => request.get('/reports/timely', { params }),
  exception: (params) => request.get('/reports/exception', { params }),
  cost: (params) => request.get('/reports/cost', { params }),
  signing: (params) => request.get('/reports/signing', { params }),
  comprehensive: (params) => request.get('/reports/comprehensive', { params })
}

export const customerApi = {
  orders: (params) => request.get('/customer/orders', { params }),
  orderDetail: (id) => request.get(`/customer/orders/${id}`),
  track: (orderId) => request.get(`/customer/track/${orderId}`),
  waybill: (id) => request.get(`/customer/waybill/${id}`),
  waybillTrack: (id) => request.get(`/customer/waybill/${id}/track`),
  statements: (params) => request.get('/customer/statements', { params }),
  statementDetail: (id) => request.get(`/customer/statements/${id}`),
  confirmStatement: (id) => request.post(`/customer/statements/${id}/confirm`)
}

export const authApi = {
  login: (data) => request.post('/auth/login', data),
  logout: () => request.post('/auth/logout'),
  profile: () => request.get('/auth/profile')
}
