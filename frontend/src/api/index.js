import api from './client'

export const auth = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  sendSmsCode: (data) => api.post('/auth/send-sms-code', data),
  thirdPartyLogin: (data) => api.post('/auth/third-party-login', data),
  bindPhone: (data) => api.post('/auth/bind-phone', data),
  getProfile: () => api.get('/auth/me')
}

export const bill = {
  getHome: () => api.get('/bill/home'),
  getCreditCards: () => api.get('/bill/credit-cards'),
  addCreditCard: (data) => api.post('/bill/credit-cards', data),
  deleteCreditCard: (id) => api.delete(`/bill/credit-cards/${id}`),
  getBills: (params) => api.get('/bill/bills', { params }),
  getBillDetails: (id) => api.get(`/bill/bills/${id}/details`),
  importBill: (data) => api.post('/bill/import', data),
  sendUpdateCode: (cardId) => api.post('/bill/send-update-code', { cardId }),
  updateBill: (data) => api.post('/bill/update', data),
  repay: (data) => api.post('/bill/repay', data)
}

export const message = {
  getCategories: () => api.get('/message/categories'),
  getList: (params) => api.get('/message/list', { params }),
  markRead: (id) => api.post(`/message/${id}/read`),
  markAllRead: (category) => api.post('/message/read-all', { category }),
  delete: (id) => api.delete(`/message/${id}`)
}

export const wealth = {
  getProducts: (params) => api.get('/wealth/products', { params }),
  getProductDetail: (id) => api.get(`/wealth/products/${id}`),
  getMyInvestments: (params) => api.get('/wealth/my-investments', { params }),
  invest: (data) => api.post('/wealth/invest', data),
  openBankAccount: (data) => api.post('/wealth/open-bank-account', data),
  getRpInfo: () => api.get('/wealth/rp')
}

export const loan = {
  getProducts: () => api.get('/loan/products'),
  getMyLoans: (params) => api.get('/loan/my-loans', { params }),
  apply: (data) => api.post('/loan/apply', data),
  verifyRealName: (data) => api.post('/loan/verify-real-name', data),
  verifyOperator: (data) => api.post('/loan/verify-operator', data),
  getVerificationStatus: () => api.get('/loan/verification-status')
}

export const user = {
  getProfile: () => api.get('/user/profile'),
  updateProfile: (data) => api.put('/user/profile', data),
  getRedPackets: (params) => api.get('/user/red-packets', { params }),
  getCoupons: (params) => api.get('/user/coupons', { params }),
  getHousingFund: () => api.get('/user/housing-fund'),
  queryHousingFund: (data) => api.post('/user/housing-fund/query', data),
  getCreditCards: () => api.get('/user/credit-cards'),
  getOverview: () => api.get('/user/overview')
}

export const admin = {
  initSampleData: () => api.post('/admin/init-sample-data'),
  getStats: () => api.get('/admin/stats'),
  getUsers: (params) => api.get('/admin/users', { params })
}
