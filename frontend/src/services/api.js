import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  sendCode: (data) => api.post('/auth/send-code', data),
  loginByCode: (data) => api.post('/auth/login/code', data),
  loginByPassword: (data) => api.post('/auth/login/password', data),
  loginByWechat: (data) => api.post('/auth/login/wechat', data),
  loginBySSO: (data) => api.post('/auth/login/sso', data),
  register: (data) => api.post('/auth/register', data),
  getCurrentUser: () => api.get('/auth/me'),
  guestJoin: (data) => api.post('/auth/guest/join', data)
};

export const meetingAPI = {
  createQuick: (data) => api.post('/meetings/quick', data),
  schedule: (data) => api.post('/meetings/schedule', data),
  getScheduled: () => api.get('/meetings/scheduled'),
  getHistory: () => api.get('/meetings/history'),
  join: (data) => api.post('/meetings/join', data),
  getParticipants: (meetingId) => api.get(`/meetings/${meetingId}/participants`),
  manageParticipant: (meetingId, participantId, data) => api.put(`/meetings/${meetingId}/participants/${participantId}`, data),
  muteAll: (meetingId, data) => api.post(`/meetings/${meetingId}/mute-all`, data),
  end: (meetingId) => api.post(`/meetings/${meetingId}/end`),
  getSettings: (meetingId) => api.get(`/meetings/${meetingId}/settings`),
  updateSettings: (meetingId, data) => api.put(`/meetings/${meetingId}/settings`, data),
  invite: (meetingId, data) => api.post(`/meetings/${meetingId}/invite`, data)
};

export default api;
