const API_BASE = '/api';

async function request(url, options = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers,
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || '请求失败');
  }

  return data;
}

export const api = {
  auth: {
    register: (data) => request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
    login: (data) => request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
    profile: () => request('/auth/profile'),
    verify: (data) => request('/auth/verify', { method: 'POST', body: JSON.stringify(data) }),
  },
  tasks: {
    list: (params) => {
      const query = new URLSearchParams(params).toString();
      return request(`/tasks?${query}`);
    },
    hot: () => request('/tasks/hot'),
    templates: () => request('/tasks/templates'),
    get: (id) => request(`/tasks/${id}`),
    create: (data) => request('/tasks', { method: 'POST', body: JSON.stringify(data) }),
    accept: (id) => request(`/tasks/${id}/accept`, { method: 'POST' }),
    submit: (id, data) => request(`/tasks/${id}/submit`, { method: 'POST', body: JSON.stringify(data) }),
    confirm: (id, workerId) => request(`/tasks/${id}/confirm`, { method: 'POST', body: JSON.stringify({ workerId }) }),
    myPublished: () => request('/tasks/my-published'),
    myAccepted: () => request('/tasks/my-accepted'),
    dispute: (id, data) => request(`/tasks/${id}/dispute`, { method: 'POST', body: JSON.stringify(data) }),
  },
  wallet: {
    recharge: (amount) => request('/wallet/recharge', { method: 'POST', body: JSON.stringify({ amount }) }),
    withdraw: (data) => request('/wallet/withdraw', { method: 'POST', body: JSON.stringify(data) }),
    transactions: (params) => {
      const query = new URLSearchParams(params).toString();
      return request(`/wallet/transactions?${query}`);
    },
    withdrawals: () => request('/wallet/withdrawals'),
  },
  activities: {
    redPackets: () => request('/activities/red-packets'),
    createRedPacket: (data) => request('/activities/red-packets', { method: 'POST', body: JSON.stringify(data) }),
    grabRedPacket: (id) => request(`/activities/red-packets/${id}/grab`, { method: 'POST' }),
    rankingTasks: () => request('/activities/ranking/tasks'),
    rankingEarning: () => request('/activities/ranking/earning'),
  },
  admin: {
    stats: () => request('/admin/stats'),
    publicStats: () => request('/admin/stats/public'),
    users: (params) => {
      const query = new URLSearchParams(params).toString();
      return request(`/admin/users?${query}`);
    },
    tasks: (params) => {
      const query = new URLSearchParams(params).toString();
      return request(`/admin/tasks?${query}`);
    },
    disputes: (params) => {
      const query = new URLSearchParams(params).toString();
      return request(`/admin/disputes?${query}`);
    },
    resolveDispute: (id, data) => request(`/admin/disputes/${id}/resolve`, { method: 'POST', body: JSON.stringify(data) }),
    reports: (params) => {
      const query = new URLSearchParams(params).toString();
      return request(`/admin/reports?${query}`);
    },
    handleReport: (id) => request(`/admin/reports/${id}/handle`, { method: 'POST' }),
    withdrawals: (params) => {
      const query = new URLSearchParams(params).toString();
      return request(`/wallet/admin/withdrawals?${query}`);
    },
    auditWithdrawal: (id, status) => request(`/wallet/admin/withdrawals/${id}/audit`, { method: 'POST', body: JSON.stringify({ status }) }),
    transactions: (params) => {
      const query = new URLSearchParams(params).toString();
      return request(`/admin/transactions?${query}`);
    },
  },
};
