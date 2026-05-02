import request from '@/utils/request';

export function getViolations(params) {
  return request({
    url: '/violations',
    method: 'get',
    params,
  });
}

export function getViolationById(id) {
  return request({
    url: `/violations/${id}`,
    method: 'get',
  });
}

export function enterpriseRespond(violationId, data) {
  return request({
    url: `/violations/${violationId}/respond`,
    method: 'post',
    data,
  });
}

export function escalateToInspection(violationId, data) {
  return request({
    url: `/violations/${violationId}/escalate`,
    method: 'post',
    data,
  });
}

export function assignInspectionOrder(orderId, regulatorId) {
  return request({
    url: `/violations/inspections/${orderId}/assign`,
    method: 'put',
    data: { regulatorId },
  });
}

export function submitInspectionResult(orderId, data) {
  return request({
    url: `/violations/inspections/${orderId}/submit`,
    method: 'put',
    data,
  });
}

export function submitRectification(violationId, data) {
  return request({
    url: `/violations/${violationId}/rectify`,
    method: 'post',
    data,
  });
}

export function reviewRectification(rectificationId, data) {
  return request({
    url: `/violations/rectifications/${rectificationId}/review`,
    method: 'put',
    data,
  });
}

export function verifyCompliance(violationId) {
  return request({
    url: `/violations/${violationId}/verify`,
    method: 'put',
  });
}

export function getInspectionOrders(params) {
  return request({
    url: '/violations/inspections',
    method: 'get',
    params,
  });
}

export function getInspectionOrderById(id) {
  return request({
    url: `/violations/inspections/${id}`,
    method: 'get',
  });
}

export function getRectifications(params) {
  return request({
    url: '/violations/rectifications',
    method: 'get',
    params,
  });
}

export function getTrace(id) {
  return request({
    url: `/violations/${id}/trace`,
    method: 'get',
  });
}

export function getStatistics() {
  return request({
    url: '/violations/statistics',
    method: 'get',
  });
}
