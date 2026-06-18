import client from './client';

export function applyPartner(data: Record<string, any>) {
  return client.post('/partner/apply', data);
}

export function getMyPartner() {
  return client.get('/partner/me');
}

export function updateMyPartner(data: Record<string, any>) {
  return client.put('/partner/me', data);
}

export function getCommissions(params?: Record<string, any>) {
  return client.get('/partner/commissions', { params });
}

export function getInviteTree() {
  return client.get('/partner/invite-tree');
}

export function requestSettle() {
  return client.post('/partner/settle');
}

export function getSettlements(params?: Record<string, any>) {
  return client.get('/partner/settlements', { params });
}

export function getPartnerStats() {
  return client.get('/partner/stats');
}
