import request from '@/utils/request'

export function getStockByOrgId(orgId) {
  return request({
    url: `/inventory/org/${orgId}`,
    method: 'get'
  })
}

export function getStockByOrgAndProduct(orgId, productId) {
  return request({
    url: `/inventory/org/${orgId}/product/${productId}`,
    method: 'get'
  })
}

export function getLowStock(orgId) {
  return request({
    url: `/inventory/low-stock/${orgId}`,
    method: 'get'
  })
}

export function initOrgStock(orgId) {
  return request({
    url: `/inventory/init/${orgId}`,
    method: 'post'
  })
}

export function getStockStats(orgId) {
  return request({
    url: `/inventory/stats/${orgId}`,
    method: 'get'
  })
}

export function getStockJournal(query) {
  return request({
    url: '/inventory/journal',
    method: 'get',
    params: query
  })
}

export function getStockSnapshot(query) {
  return request({
    url: '/inventory/snapshot',
    method: 'get',
    params: query
  })
}
