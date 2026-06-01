const API_BASE = '/api';

function cleanParams(params) {
  if (!params) return {};
  const result = {};
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      result[key] = value;
    }
  }
  return result;
}

async function request(url, options = {}) {
  const res = await fetch(API_BASE + url, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  health: () => request('/health'),
  stats: () => request('/stats'),
  streamers: () => request('/streamers'),
  createStreamer: (data) => request('/streamers', { method: 'POST', body: JSON.stringify(data) }),
  updateStreamer: (id, data) => request(`/streamers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  unions: () => request('/unions'),
  createUnion: (data) => request('/unions', { method: 'POST', body: JSON.stringify(data) }),
  updateUnion: (id, data) => request(`/unions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  users: () => request('/users'),
  gifts: () => request('/gifts'),
  createGift: (data) => request('/gifts', { method: 'POST', body: JSON.stringify(data) }),
  rooms: () => request('/rooms'),
  liveSessions: (params) => {
    const qs = new URLSearchParams(cleanParams(params)).toString();
    return request(`/live-sessions${qs ? '?' + qs : ''}`);
  },
  liveSession: (id) => request(`/live-sessions/${id}`),
  createSession: (data) => request('/live-sessions', { method: 'POST', body: JSON.stringify(data) }),
  endSession: (id, data) => request(`/live-sessions/${id}/end`, { method: 'PUT', body: JSON.stringify(data) }),
  flagSession: (id, data) => request(`/live-sessions/${id}/flag`, { method: 'PUT', body: JSON.stringify(data) }),
  sessionTransactions: (id) => request(`/sessions/${id}/transactions`),
  giftTransactions: (params) => {
    const qs = new URLSearchParams(cleanParams(params)).toString();
    return request(`/gift-transactions${qs ? '?' + qs : ''}`);
  },
  giftTransaction: (id) => request(`/gift-transactions/${id}`),
  createTransaction: (data) => request('/gift-transactions', { method: 'POST', body: JSON.stringify(data) }),
  refundTransaction: (id) => request(`/gift-transactions/${id}/refund`, { method: 'PUT' }),
  sharingRules: () => request('/sharing-rules'),
  activeRule: () => request('/sharing-rules/active'),
  createRule: (data) => request('/sharing-rules', { method: 'POST', body: JSON.stringify(data) }),
  createSharingRule: (data) => request('/sharing-rules', { method: 'POST', body: JSON.stringify(data) }),
  updateSharingRule: (id, data) => request(`/sharing-rules/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  riskRecords: (params) => {
    const qs = new URLSearchParams(cleanParams(params)).toString();
    return request(`/risk-records${qs ? '?' + qs : ''}`);
  },
  createRisk: (data) => request('/risk-records', { method: 'POST', body: JSON.stringify(data) }),
  createRiskRecord: (data) => request('/risk-records', { method: 'POST', body: JSON.stringify(data) }),
  updateRisk: (id, data) => request(`/risk-records/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  updateRiskRecord: (id, data) => request(`/risk-records/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  frozenFunds: () => request('/frozen-funds'),
  createFrozen: (data) => request('/frozen-funds', { method: 'POST', body: JSON.stringify(data) }),
  createFrozenFund: (data) => request('/frozen-funds', { method: 'POST', body: JSON.stringify(data) }),
  updateFrozenFund: (id, data) => request(`/frozen-funds/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  unfreeze: (id, data) => request(`/frozen-funds/${id}/unfreeze`, { method: 'PUT', body: JSON.stringify(data) }),
  freezeToPenalty: (id, data) => request(`/frozen-funds/${id}/penalty`, { method: 'PUT', body: JSON.stringify(data) }),
  penaltyRecords: () => request('/penalty-records'),
  createPenalty: (data) => request('/penalty-records', { method: 'POST', body: JSON.stringify(data) }),
  createPenaltyRecord: (data) => request('/penalty-records', { method: 'POST', body: JSON.stringify(data) }),
  settlements: (params) => {
    const qs = new URLSearchParams(cleanParams(params)).toString();
    return request(`/settlements${qs ? '?' + qs : ''}`);
  },
  getSettlementDetail: (id) => request(`/settlements/${id}`),
  generateSettlements: (data) => request('/settlements/generate', { method: 'POST', body: JSON.stringify(data) }),
  confirmSettlement: (id, data) => request(`/settlements/${id}/confirm`, { method: 'PUT', body: JSON.stringify(data) }),
  paySettlement: (id, data) => request(`/settlements/${id}/pay`, { method: 'PUT', body: JSON.stringify(data) }),
  updateSettlementDifference: (id, data) => request(`/settlements/${id}/difference`, { method: 'PUT', body: JSON.stringify(data) }),
  exportSettlements: (params) => {
    const qs = new URLSearchParams(cleanParams(params)).toString();
    return fetch(API_BASE + `/settlements/export${qs ? '?' + qs : ''}`, {
      headers: { 'Content-Type': 'application/json' },
    }).then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.blob().then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const cd = res.headers.get('Content-Disposition');
        const match = cd && cd.match(/filename="?([^"]+)"?/);
        a.download = match ? match[1] : `settlements_${params?.period || 'all'}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        return { ok: true };
      });
    });
  },
  exportSettlementDetail: (id) => {
    return fetch(API_BASE + `/settlements/${id}/export`, {
      headers: { 'Content-Type': 'application/json' },
    }).then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.blob().then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const cd = res.headers.get('Content-Disposition');
        const match = cd && cd.match(/filename="?([^"]+)"?/);
        a.download = match ? match[1] : `settlement_${id}_detail.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        return { ok: true };
      });
    });
  },
  complaints: () => request('/complaints'),
  createComplaint: (data) => request('/complaints', { method: 'POST', body: JSON.stringify(data) }),
  handleComplaint: (id, data) => request(`/complaints/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  adminOps: () => request('/admin-ops'),
  adminOpsByTarget: (targetType, targetId) => {
    const qs = new URLSearchParams(cleanParams({ target_type: targetType, target_id: targetId })).toString();
    return request(`/admin-ops${qs ? '?' + qs : ''}`);
  },
  paymentChannels: () => request('/payment-channels'),
};
