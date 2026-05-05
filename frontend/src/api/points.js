import request from './index'

// 获取积分余额
export const getBalance = () => {
  return request.get('/points/balance')
}

// 获取积分交易记录
export const getTransactions = (params) => {
  return request.get('/points/transactions', { params })
}

// 模拟获取积分（测试用）
export const mockEarnPoints = (amount) => {
  return request.post('/points/mock-earn', { amount })
}
