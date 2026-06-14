import request from '@/utils/request'

export const getMarketPrice = () => {
  return request({
    url: '/price/market',
    method: 'get'
  })
}

export const getPriceTrends = () => {
  return request({
    url: '/price/trends',
    method: 'get'
  })
}

export const estimatePrice = (data) => {
  return request({
    url: '/price/estimate',
    method: 'post',
    data
  })
}
