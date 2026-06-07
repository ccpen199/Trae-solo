import request from './request'

export const auth = {
  login: (data: { phone: string; password: string }) => request.post('/auth/login', data) as Promise<any>,
  register: (data: { phone: string; password: string; name: string }) => request.post('/auth/register', data) as Promise<any>,
  getMe: () => request.get('/auth/me') as Promise<any>,
}

export const riders = {
  getProfile: () => request.get('/riders/profile') as Promise<any>,
  updateProfile: (data: any) => request.put('/riders/profile', data) as Promise<any>,
  verifyRealname: (data: { id_card_number: string; name: string }) => request.post('/riders/verify-realname', data) as Promise<any>,
  verifyIdCard: (data: { id_card_front_url: string; id_card_back_url: string }) => request.post('/riders/verify-id-card', data) as Promise<any>,
  bindInsurance: (data: { insurance_id: string }) => request.post('/riders/bind-insurance', data) as Promise<any>,
  getCredit: () => request.get('/riders/credit') as Promise<any>,
  updateLocation: (data: { lat: number; lng: number; is_online?: number }) => request.post('/riders/location', data) as Promise<any>,
  getOnlineCount: () => request.get('/riders/online') as Promise<any>,
  listRiders: (params?: any) => request.get('/riders', { params }) as Promise<any>,
  updateRiderStatus: (id: number, data: { status: string }) => request.put(`/riders/${id}/status`, data) as Promise<any>,
}

export const orders = {
  createOrder: (data: any) => request.post('/orders', data) as Promise<any>,
  listOrders: (params?: any) => request.get('/orders', { params }) as Promise<any>,
  getOrder: (id: number | string) => request.get(`/orders/${id}`) as Promise<any>,
  acceptOrder: (id: number | string) => request.put(`/orders/${id}/accept`) as Promise<any>,
  pickupOrder: (id: number | string) => request.put(`/orders/${id}/pickup`) as Promise<any>,
  deliverOrder: (id: number | string) => request.put(`/orders/${id}/deliver`) as Promise<any>,
  completeOrder: (id: number | string) => request.put(`/orders/${id}/complete`) as Promise<any>,
  appealOrder: (id: number | string, data?: any) => request.put(`/orders/${id}/appeal`, data) as Promise<any>,
  cancelOrder: (id: number | string, data?: any) => request.put(`/orders/${id}/cancel`, data) as Promise<any>,
  getNearbyOrders: (params?: any) => request.get('/orders/nearby/list', { params }) as Promise<any>,
}

export const settlements = {
  listSettlements: (params?: any) => request.get('/settlements', { params }) as Promise<any>,
  getBalance: () => request.get('/settlements/balance') as Promise<any>,
  requestWithdrawal: (data: { amount: number; bank_account: string; bank_name: string }) => request.post('/settlements/withdraw', data) as Promise<any>,
  listWithdrawals: () => request.get('/settlements/withdrawals') as Promise<any>,
  getSettlementDetail: (orderId: number | string) => request.get(`/settlements/detail/${orderId}`) as Promise<any>,
  adminListSettlements: (params?: any) => request.get('/settlements/admin/list', { params }) as Promise<any>,
  adminProcessWithdrawal: (id: number | string, data: { status: string }) => request.put(`/settlements/admin/withdrawals/${id}`, data) as Promise<any>,
}

export const dispatch = {
  autoDispatch: (data: { order_id: number }) => request.post('/dispatch/auto', data) as Promise<any>,
  getGridHeatmap: () => request.get('/dispatch/grid') as Promise<any>,
  updateGrid: (id: number | string, data: any) => request.put(`/dispatch/grid/${id}`, data) as Promise<any>,
}

export const admin = {
  getDashboard: () => request.get('/admin/dashboard') as Promise<any>,
  listRiskAudits: (params?: any) => request.get('/admin/risk-audits', { params }) as Promise<any>,
  createRiskAudit: (data: any) => request.post('/admin/risk-audits', data) as Promise<any>,
  resolveRiskAudit: (id: number | string, data: any) => request.put(`/admin/risk-audits/${id}`, data) as Promise<any>,
  getCapacity: () => request.get('/admin/capacity') as Promise<any>,
  listContracts: (params?: any) => request.get('/admin/labor-contracts', { params }) as Promise<any>,
  createContract: (data: any) => request.post('/admin/labor-contracts', data) as Promise<any>,
  signContract: (id: number | string) => request.put(`/admin/labor-contracts/${id}/sign`) as Promise<any>,
  getSystemConfigs: () => request.get('/admin/system-configs') as Promise<any>,
  updateSystemConfig: (key: string, data: { value: string }) => request.put(`/admin/system-configs/${key}`, data) as Promise<any>,
}
