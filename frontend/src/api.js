const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

function getAuthHeaders() {
  const userId = localStorage.getItem('userId');
  return userId ? { 'x-user-id': userId, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
}

async function request(path, options = {}) {
  const res = await fetch(API_BASE + path, {
    ...options,
    headers: { ...getAuthHeaders(), ...(options.headers || {}) }
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || data.message || `HTTP ${res.status}`);
  }
  return data;
}

export const api = {
  health: () => request('/api/health'),
  getMe: () => request('/api/users/me'),
  getUsers: (params) => request('/api/users' + (params ? '?' + new URLSearchParams(params).toString() : '')),
  getUser: (id) => request(`/api/users/${id}`),
  switchUser: (id) => { localStorage.setItem('userId', id); return api.getMe(); },

  getRooms: (params) => request('/api/rooms' + (params ? '?' + new URLSearchParams(params).toString() : '')),
  getRoom: (id) => request(`/api/rooms/${id}`),
  createRoom: (data) => request('/api/rooms', { method: 'POST', body: JSON.stringify(data) }),
  updateRoom: (id, data) => request(`/api/rooms/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  closeRoom: (id) => request(`/api/rooms/${id}`, { method: 'DELETE' }),
  enterRoom: (id) => request(`/api/rooms/${id}/enter`, { method: 'POST' }),
  leaveRoom: (id) => request(`/api/rooms/${id}/leave`, { method: 'POST' }),

  applyMic: (roomId) => request(`/api/mics/queue/${roomId}`, { method: 'POST' }),
  getMicQueue: (roomId) => request(`/api/mics/queue/${roomId}`),
  approveMic: (roomId, queueId) => request(`/api/mics/approve/${roomId}/${queueId}`, { method: 'POST' }),
  rejectMic: (roomId, queueId) => request(`/api/mics/reject/${roomId}/${queueId}`, { method: 'POST' }),
  leaveMic: (roomId) => request(`/api/mics/leave/${roomId}`, { method: 'POST' }),
  lockMic: (roomId, slotId) => request(`/api/mics/lock/${roomId}/${slotId}`, { method: 'POST' }),
  muteMic: (roomId, slotId) => request(`/api/mics/mute/${roomId}/${slotId}`, { method: 'POST' }),
  kickMic: (roomId, slotId) => request(`/api/mics/kick/${roomId}/${slotId}`, { method: 'POST' }),

  sendGift: (roomId, data) => request(`/api/interactions/gift/${roomId}`, { method: 'POST', body: JSON.stringify(data) }),
  sendBarrage: (roomId, data) => request(`/api/interactions/barrage/${roomId}`, { method: 'POST', body: JSON.stringify(data) }),
  getBarrages: (roomId, limit) => request(`/api/interactions/barrage/${roomId}?limit=${limit || 20}`),
  getGifts: () => request('/api/interactions/gifts'),
  postAnnouncement: (roomId, data) => request(`/api/interactions/announcement/${roomId}`, { method: 'POST', body: JSON.stringify(data) }),
  getAnnouncements: (roomId) => request(`/api/interactions/announcements/${roomId}`),
  createTask: (roomId, data) => request(`/api/interactions/task/${roomId}`, { method: 'POST', body: JSON.stringify(data) }),
  getTasks: (roomId) => request(`/api/interactions/tasks/${roomId}`),
  completeTask: (taskId) => request(`/api/interactions/task/complete/${taskId}`, { method: 'POST' }),
  playGame: (roomId, data) => request(`/api/interactions/game/${roomId}`, { method: 'POST', body: JSON.stringify(data) }),
  getEvents: (roomId, params) => request(`/api/interactions/events/${roomId}` + (params ? '?' + new URLSearchParams(params).toString() : '')),

  submitReport: (roomId, data) => request(`/api/reviews/report/${roomId}`, { method: 'POST', body: JSON.stringify(data) }),
  getReports: (params) => request('/api/reviews/reports' + (params ? '?' + new URLSearchParams(params).toString() : '')),
  reviewReport: (id, data) => request(`/api/reviews/report/review/${id}`, { method: 'POST', body: JSON.stringify(data) }),
  getReviewItems: (params) => request('/api/reviews/items' + (params ? '?' + new URLSearchParams(params).toString() : '')),
  reviewItem: (id, data) => request(`/api/reviews/item/review/${id}`, { method: 'POST', body: JSON.stringify(data) }),
  getViolations: (params) => request('/api/reviews/violations' + (params ? '?' + new URLSearchParams(params).toString() : '')),
  getViolationStats: () => request('/api/reviews/violations/stats'),

  dashboardOverview: () => request('/api/dashboard/overview'),
  dashboardDuration: (days) => request(`/api/dashboard/room-duration?days=${days || 7}`),
  dashboardRetention: (days) => request(`/api/dashboard/retention?days=${days || 7}`),
  dashboardPayments: (params) => request('/api/dashboard/payments' + (params ? '?' + new URLSearchParams(params).toString() : '')),
  dashboardCategories: () => request('/api/dashboard/categories'),
  dashboardHostContributions: (days, limit) => request(`/api/dashboard/host-contributions?days=${days || 30}&limit=${limit || 20}`),
  dashboardViolations: (days) => request(`/api/dashboard/violations-summary?days=${days || 30}`),
  dashboardTopRooms: (limit) => request(`/api/dashboard/top-rooms?limit=${limit || 10}`)
};
