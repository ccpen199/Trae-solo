import request from '@/utils/request'

export function getSettlementList(params) {
  return request({
    url: '/settlements',
    method: 'get',
    params
  })
}

export function getSettlementDetail(id) {
  return request({
    url: `/settlements/${id}`,
    method: 'get'
  })
}

export function createSettlement(data) {
  return request({
    url: '/settlements',
    method: 'post',
    data
  })
}

export function settlePayment(id, data) {
  return request({
    url: `/settlements/${id}/settle`,
    method: 'put',
    data
  })
}

export function getPendingSettlement(orderId) {
  return request({
    url: `/settlements/order/${orderId}/pending`,
    method: 'get'
  })
}

export function getSettlementStatistics(params) {
  return request({
    url: '/settlements/statistics/summary',
    method: 'get',
    params
  })
}

export const confirmSettlement = settlePayment
export const getSettlementStats = getSettlementStatistics
