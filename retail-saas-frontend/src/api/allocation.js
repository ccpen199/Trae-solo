import request from '@/utils/request'

export function getRequisitionPage(query) {
  return request({
    url: '/allocation/page',
    method: 'get',
    params: query
  })
}

export function getRequisitionById(id) {
  return request({
    url: `/allocation/${id}`,
    method: 'get'
  })
}

export function createRequisition(data) {
  return request({
    url: '/allocation',
    method: 'post',
    data
  })
}

export function submitRequisition(id) {
  return request({
    url: `/allocation/submit/${id}`,
    method: 'post'
  })
}

export function auditRequisition(id, pass, comment) {
  return request({
    url: `/allocation/audit/${id}`,
    method: 'post',
    params: { pass, comment }
  })
}

export function cancelRequisition(id) {
  return request({
    url: `/allocation/cancel/${id}`,
    method: 'post'
  })
}

export function getRequisitionByOrgId(orgId) {
  return request({
    url: `/allocation/org/${orgId}`,
    method: 'get'
  })
}

export function processTransferOut(requisitionId) {
  return request({
    url: `/allocation/out/${requisitionId}`,
    method: 'post'
  })
}

export function processTransferIn(requisitionId) {
  return request({
    url: `/allocation/in/${requisitionId}`,
    method: 'post'
  })
}
