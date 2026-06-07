import request from './request'

export const authApi = {
  login: (data) => request.post('/auth/login', data),
  register: (data) => request.post('/auth/register', data),
  profile: () => request.get('/auth/profile'),
  logout: () => request.post('/auth/logout')
}

export const shipperApi = {
  submitCert: (data) => request.post('/shipper/enterprise-cert', data),
  getCert: () => request.get('/shipper/enterprise-cert'),
  calculatePrice: (data) => request.post('/shipper/calculate-price', data),
  publishCargo: (data) => request.post('/shipper/cargo', data),
  getCargoList: (params) => request.get('/shipper/cargo', { params }),
  getCargoDetail: (id) => request.get(`/shipper/cargo/${id}`),
  cancelCargo: (id) => request.put(`/shipper/cargo/${id}/cancel`),
  acceptBid: (cargoId, data) => request.post(`/shipper/cargo/${cargoId}/accept-bid`, data),
  getWhitelist: () => request.get('/shipper/whitelist'),
  addWhitelist: (data) => request.post('/shipper/whitelist', data),
  removeWhitelist: (id) => request.delete(`/shipper/whitelist/${id}`),
  getCooperationRecords: (params) => request.get('/shipper/cooperation-records', { params })
}

export const driverApi = {
  submitInfo: (data) => request.post('/driver/driver-info', data),
  updateLocation: (data) => request.post('/driver/update-location', data),
  getCargoPool: (params) => request.get('/driver/cargo-pool', { params }),
  getNearbyCargo: (params) => request.get('/driver/nearby-cargo', { params }),
  placeBid: (cargoId, data) => request.post(`/driver/cargo/${cargoId}/bid`, data),
  getMyBids: (params) => request.get('/driver/my-bids', { params })
}

export const waybillApi = {
  create: (data) => request.post('/waybill/create', data),
  getList: (params) => request.get('/waybill', { params }),
  getDetail: (id) => request.get(`/waybill/${id}`),
  startLoading: (id) => request.put(`/waybill/${id}/start-loading`),
  uploadWaybill: (id, file) => {
    const formData = new FormData()
    formData.append('waybill_photo', file)
    return request.put(`/waybill/${id}/upload-waybill`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  ocrWaybill: (id, file) => {
    const formData = new FormData()
    formData.append('waybill_photo', file)
    return request.post(`/waybill/${id}/ocr-waybill`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  startTransport: (id) => request.put(`/waybill/${id}/start-transport`),
  track: (id, data) => request.post(`/waybill/${id}/track`, data),
  getTracking: (id) => request.get(`/waybill/${id}/tracking`),
  complete: (id) => request.put(`/waybill/${id}/complete`),
  confirmReceipt: (id, data) => request.put(`/waybill/${id}/confirm-receipt`, data),
  getSplit: (id) => request.get(`/waybill/${id}/split`),
  getDashboardStats: () => request.get('/waybill/dashboard/stats')
}

export const paymentApi = {
  getWallet: () => request.get('/payment/wallet'),
  recharge: (data) => request.post('/payment/recharge', data),
  freezeEscrow: (data) => request.post('/payment/escrow-freeze', data),
  releaseEscrow: (data) => request.post('/payment/escrow-release', data),
  withdraw: (data) => request.post('/payment/withdraw', data),
  getTransactions: (params) => request.get('/payment/transactions', { params }),
  getReconciliation: (params) => request.get('/payment/reconciliation', { params }),
  getEscrowList: () => request.get('/payment/escrow-list')
}

export const adminApi = {
  getStats: () => request.get('/admin/stats'),
  getUsers: (params) => request.get('/admin/users', { params }),
  verifyUser: (id, data) => request.put(`/admin/user/${id}/verify`, data),
  getAlerts: (params) => request.get('/admin/alerts', { params }),
  handleAlert: (id, data) => request.put(`/admin/alert/${id}/handle`, data),
  getWaybills: (params) => request.get('/admin/waybills', { params }),
  getInsurancePolicies: () => request.get('/admin/insurance-policies'),
  getAuditLogs: (params) => request.get('/admin/audit-logs', { params })
}
