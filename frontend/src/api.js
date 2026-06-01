const API_BASE = '/api';

async function request(url, options = {}) {
  try {
    const response = await fetch(`${API_BASE}${url}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API请求错误:', error);
    return { success: false, error: error.message };
  }
}

export const shipsAPI = {
  getAll: () => request('/ships'),
  get: (id) => request(`/ships/${id}`),
  create: (data) => request('/ships', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/ships/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => request(`/ships/${id}`, { method: 'DELETE' })
};

export const schedulesAPI = {
  getAll: () => request('/schedules'),
  getGantt: () => request('/schedules/gantt'),
  validate: (data) => request('/schedules/validate', { method: 'POST', body: JSON.stringify(data) }),
  create: (data) => request('/schedules', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/schedules/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => request(`/schedules/${id}`, { method: 'DELETE' })
};

export const berthsAPI = {
  getAll: () => request('/berths'),
  getTides: (start, end) => request(`/berths/tides?start_date=${start}&end_date=${end}`)
};

export const resourcesAPI = {
  getAll: (type) => request(`/resources${type ? `?type=${type}` : ''}`),
  getAssignments: () => request('/resources/assignments'),
  assign: (data) => request('/resources/assign', { method: 'POST', body: JSON.stringify(data) }),
  deleteAssignment: (id) => request(`/resources/assignments/${id}`, { method: 'DELETE' })
};

export const adjustmentsAPI = {
  getAll: () => request('/adjustments'),
  getNotifications: (role) => request(`/adjustments/notifications?role=${role}&unread_only=1`),
  markRead: (id) => request(`/adjustments/notifications/${id}/read`, { method: 'PUT' })
};
