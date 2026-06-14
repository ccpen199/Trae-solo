import request from '@/utils/request'

export const getStats = () => {
  return request({
    url: '/admin/stats',
    method: 'get'
  })
}

export const getWasteReviewList = (params) => {
  return request({
    url: '/admin/waste-review',
    method: 'get',
    params
  })
}

export const reviewWaste = (id, data) => {
  return request({
    url: `/admin/waste-review/${id}`,
    method: 'post',
    data
  })
}

export const getUserAuditList = (params) => {
  return request({
    url: '/admin/user-audit',
    method: 'get',
    params
  })
}

export const auditUser = (id, data) => {
  return request({
    url: `/admin/user-audit/${id}`,
    method: 'post',
    data
  })
}

export const getEnvReportList = (params) => {
  return request({
    url: '/admin/env-report',
    method: 'get',
    params
  })
}

export const submitEnvReport = (data) => {
  return request({
    url: '/admin/env-report',
    method: 'post',
    data
  })
}
