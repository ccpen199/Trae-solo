import request from './request';

export const authAPI = {
  register: (data) => request.post('/auth/register', data),
  login: (data) => request.post('/auth/login', data),
  getProfile: () => request.get('/auth/profile')
};

export const liveAPI = {
  applyStreamer: (data) => request.post('/live/apply-streamer', data),
  getStreams: (status) => request.get('/live/streams', { params: { status } }),
  scheduleStream: (data) => request.post('/live/schedule', data),
  startStream: (id) => request.post(`/live/${id}/start`),
  endStream: (id) => request.post(`/live/${id}/end`),
  reserveStream: (id) => request.post(`/live/${id}/reserve`),
  getMessages: (id) => request.get(`/live/${id}/messages`),
  sendMessage: (id, content) => request.post(`/live/${id}/messages`, { content }),
  getReplays: () => request.get('/live/replays')
};

export const activityAPI = {
  getList: (status) => request.get('/activities', { params: { status } }),
  getDetail: (id) => request.get(`/activities/${id}`),
  register: (id) => request.post(`/activities/${id}/register`),
  create: (data) => request.post('/activities', data)
};

export const musicAPI = {
  getCategories: () => request.get('/music/categories'),
  getLibrary: (category, page, limit) => request.get('/music/library', { params: { category, page, limit } }),
  getPlaylists: () => request.get('/music/playlists'),
  createPlaylist: (name) => request.post('/music/playlists', { name }),
  addToPlaylist: (playlistId, musicId) => request.post(`/music/playlists/${playlistId}/songs/${musicId}`)
};

export const rankingAPI = {
  getDaily: () => request.get('/ranking/daily'),
  getWeekly: () => request.get('/ranking/weekly'),
  getMonthly: () => request.get('/ranking/monthly'),
  recordTraining: (data) => request.post('/ranking/record', data),
  getMyStats: () => request.get('/ranking/my-stats')
};

export const walletAPI = {
  getBalance: () => request.get('/wallet/balance'),
  getTransactions: () => request.get('/wallet/transactions'),
  recharge: (amount) => request.post('/wallet/recharge', { amount }),
  withdraw: (amount) => request.post('/wallet/withdraw', { amount })
};
