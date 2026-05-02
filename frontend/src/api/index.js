import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

export const playerApi = {
  list: (limit = 100, offset = 0) =>
    api.get(`/players?limit=${limit}&offset=${offset}`),
  get: (id) => api.get(`/players/${id}`),
  create: (name, avatar) => api.post('/players', { name, avatar }),
  updateScore: (id, delta) => api.put(`/players/${id}/score`, { delta }),
  getTierConfig: () => api.get('/players/config/tier'),
};

export const matchApi = {
  joinQueue: (playerId) => api.post('/match/queue', { playerId }),
  leaveQueue: (playerId) => api.delete('/match/queue', { data: { playerId } }),
  getQueueStatus: (playerId) => api.get(`/match/queue/status/${playerId}`),
  processMatches: () => api.post('/match/process'),
  getBattle: (battleId) => api.get(`/match/battle/${battleId}`),
  startBattle: (battleId) => api.post(`/match/battle/${battleId}/start`),
  endBattle: (battleId, winnerId) => api.post(`/match/battle/${battleId}/end`, { winnerId }),
  getPlayerBattles: (playerId, limit = 20) =>
    api.get(`/match/player/${playerId}/battles?limit=${limit}`),
  getConfig: () => api.get('/match/config'),
};

export const traceApi = {
  listRequests: (limit = 100, offset = 0, status = null) => {
    let url = `/trace/requests?limit=${limit}&offset=${offset}`;
    if (status) url += `&status=${status}`;
    return api.get(url);
  },
  getRequest: (requestId) => api.get(`/trace/requests/${requestId}`),
  getPlayerRequests: (playerId, limit = 50) =>
    api.get(`/trace/player/${playerId}/requests?limit=${limit}`),
  getRequestLogs: (requestId) => api.get(`/trace/requests/${requestId}/logs`),
};

export const healthApi = {
  check: () => api.get('/health'),
};

export default api;