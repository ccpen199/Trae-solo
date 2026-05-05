import request from './index'

// 大转盘抽奖
export const spinWheel = () => {
  return request.post('/lottery/wheel')
}

// 砸蛋抽奖
export const hitEgg = () => {
  return request.post('/lottery/egg')
}

// 获取我的奖品列表
export const getUserPrizes = (params) => {
  return request.get('/lottery/prizes', { params })
}

// 领取奖品
export const receivePrize = (id) => {
  return request.post(`/lottery/prizes/${id}/receive`)
}

// 立即兑换积分奖品
export const redeemPointsPrize = (id) => {
  return request.post(`/lottery/prizes/${id}/redeem`)
}
