import request from '../utils/request'

export const api = {
  health: () => request.get('/health'),
  
  getUser: (userId) => request.get(`/users/${userId}`),
  getBalance: (userId) => request.get(`/users/${userId}/balance`),
  verifyPassword: (userId, password) => request.post(`/users/${userId}/verify-password`, { password }),
  resetPassword: (userId, newPassword) => request.post(`/users/${userId}/reset-password`, { newPassword }),
  
  getBankCards: (userId) => request.get(`/bank-cards/user/${userId}`),
  identifyBankCard: (cardNumber) => request.post('/bank-cards/identify', { cardNumber }),
  bindBankCard: (data) => request.post('/bank-cards/bind', data),
  unbindBankCard: (cardId) => request.delete(`/bank-cards/${cardId}`),
  
  generateQRCode: (data) => request.post('/qrcode/generate', data),
  getQRCode: (qrId) => request.get(`/qrcode/${qrId}`),
  getLatestQRCode: (userId) => request.get(`/qrcode/user/${userId}/latest`),
  
  initiateTransaction: (data) => request.post('/transactions/initiate', data),
  confirmTransaction: (transactionId) => request.post(`/transactions/${transactionId}/confirm`),
  getTransactions: (userId, params) => request.get(`/transactions/user/${userId}`, { params }),
  getTransaction: (transactionId) => request.get(`/transactions/${transactionId}`),
  getPendingTransactions: (userId) => request.get(`/transactions/user/${userId}/pending`),
  getTransactionSummary: (userId, params) => request.get(`/transactions/user/${userId}/summary`, { params }),
  
  getNotifications: (userId, params) => request.get(`/notifications/user/${userId}`, { params }),
  markNotificationRead: (notificationId) => request.post(`/notifications/${notificationId}/read`),
  markAllNotificationsRead: (userId) => request.post(`/notifications/user/${userId}/read-all`)
}
