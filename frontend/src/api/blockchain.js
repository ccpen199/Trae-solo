import request from '@/utils/request'

export const getBlockchainRecords = (params) => {
  return request({
    url: '/blockchain',
    method: 'get',
    params
  })
}

export const getBlockchainDetail = (hash) => {
  return request({
    url: `/blockchain/${hash}`,
    method: 'get'
  })
}

export const verifyBlockchain = (hash) => {
  return request({
    url: `/blockchain/${hash}/verify`,
    method: 'get'
  })
}

export const createBlockchainRecord = (data) => {
  return request({
    url: '/blockchain',
    method: 'post',
    data
  })
}
