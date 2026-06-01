const API_BASE = '/api';

async function request(url, options) {
  const opts = options || {};
  const response = await fetch(API_BASE + url, {
    headers: {
      'Content-Type': 'application/json'
    },
    method: opts.method,
    body: opts.body ? JSON.stringify(opts.body) : undefined
  });
  
  if (!response.ok) {
    throw new Error('请求失败');
  }
  
  return response.json();
}

export const api = {
  getApplications: function() { return request('/applications'); },
  getTasks: function() { return request('/tasks'); },
  getChangeOrders: function() { return request('/change-orders'); },
  getDashboardStats: function() { return request('/audit/dashboard/stats'); },
  getAlerts: function() { return request('/audit/alerts'); },
  getExecutions: function() { return request('/audit/executions'); }
};
