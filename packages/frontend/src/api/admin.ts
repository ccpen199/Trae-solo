import client from './client';

export function getDashboard() {
  return client.get('/admin/dashboard');
}

export function getCommunityHealth(tenantId: string) {
  return client.get(`/admin/community-health/${tenantId}`);
}

export function getTopicTrend(params?: Record<string, any>) {
  return client.get('/admin/topic-trend', { params });
}

export function getSalesTrend(params?: Record<string, any>) {
  return client.get('/admin/sales-trend', { params });
}

export function getComplaintMetrics(params?: Record<string, any>) {
  return client.get('/admin/complaint-metrics', { params });
}

export function getRiskAlerts(params?: Record<string, any>) {
  return client.get('/admin/risk-alerts', { params });
}

export function handleRiskAlert(id: string, data: Record<string, any>) {
  return client.post(`/admin/risk-alerts/${id}/handle`, data);
}

export function getTraceLogs(topicId: string) {
  return client.get(`/admin/trace-logs/${topicId}`);
}

export function getSensitiveWordLogs(params?: Record<string, any>) {
  return client.get('/admin/sensitive-word-logs', { params });
}

export function getRedPacketPool() {
  return client.get('/admin/redpacket-pool');
}

export function getWithdrawStats(params?: Record<string, any>) {
  return client.get('/admin/withdraw-stats', { params });
}

export function runAmlCheck(userId: string) {
  return client.post('/admin/aml-check', { userId });
}
