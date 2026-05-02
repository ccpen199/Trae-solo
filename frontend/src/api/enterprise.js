import request from '@/utils/request';

export function getEnterprises(params) {
  return request({
    url: '/enterprises',
    method: 'get',
    params,
  });
}

export function getEnterpriseById(id) {
  return request({
    url: `/enterprises/${id}`,
    method: 'get',
  });
}

export function createEnterprise(data) {
  return request({
    url: '/enterprises',
    method: 'post',
    data,
  });
}

export function updateEnterprise(id, data) {
  return request({
    url: `/enterprises/${id}`,
    method: 'put',
    data,
  });
}

export function evaluateEnterprise(id, period) {
  const params = {};
  if (period) params.period = period;

  return request({
    url: `/enterprises/${id}/evaluate`,
    method: 'get',
    params,
  });
}

export function getRanking(params) {
  return request({
    url: '/enterprises/ranking',
    method: 'get',
    params,
  });
}

export function getIndustryStats() {
  return request({
    url: '/enterprises/stats/industry',
    method: 'get',
  });
}

export function getComplianceStats() {
  return request({
    url: '/enterprises/stats/compliance',
    method: 'get',
  });
}

export function getMonitorPoints(enterpriseId) {
  return request({
    url: `/enterprises/${enterpriseId}/monitor-points`,
    method: 'get',
  });
}

export function getViolations(enterpriseId, params) {
  return request({
    url: `/enterprises/${enterpriseId}/violations`,
    method: 'get',
    params,
  });
}
