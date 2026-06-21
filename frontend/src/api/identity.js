import request from './request'

export function getCertificates(userId) {
  return request({
    url: `/identity/certificates/${userId}`,
    method: 'get'
  })
}

export function generateCode(data) {
  return request({
    url: '/identity/generate-code',
    method: 'post',
    data
  })
}

export function verifyCode(codeToken) {
  return request({
    url: '/identity/verify-code',
    method: 'post',
    data: { codeToken }
  })
}

export function getCodeHistory(userId, params) {
  return request({
    url: `/identity/code-history/${userId}`,
    method: 'get',
    params
  })
}

export function getRiskAssessment(userId) {
  return request({
    url: `/identity/risk-assessment/${userId}`,
    method: 'get'
  })
}
