const API_BASE = '/api';

let token = localStorage.getItem('meeting_token');

export const setToken = (newToken) => {
  token = newToken;
  if (newToken) {
    localStorage.setItem('meeting_token', newToken);
  } else {
    localStorage.removeItem('meeting_token');
  }
};

const request = async (endpoint, options = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Request failed');
  }

  return data;
};

export const authApi = {
  sendCode: (target, type) => request('/auth/send-code', {
    method: 'POST',
    body: JSON.stringify({ target, type }),
  }),
  
  verifyCode: (target, code, type) => request('/auth/verify-code', {
    method: 'POST',
    body: JSON.stringify({ target, code, type }),
  }),
  
  register: (data) => request('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  login: (data) => request('/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  resetPassword: (data) => request('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  getMe: () => request('/auth/me'),
};

export const userApi = {
  getProfile: () => request('/users/profile'),
  
  updateProfile: (data) => request('/users/profile', {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  
  getMeetings: () => request('/users/meetings'),
};

export const meetingApi = {
  quickMeeting: (title, videoEnabled = true) => request('/meetings/quick', {
    method: 'POST',
    body: JSON.stringify({ title, videoEnabled }),
  }),
  
  scheduleMeeting: (data) => request('/meetings/schedule', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  getMeeting: (meetingNumber) => request(`/meetings/${meetingNumber}`),
  
  joinMeeting: (meetingNumber, password, guestName) => request(`/meetings/${meetingNumber}/join`, {
    method: 'POST',
    body: JSON.stringify({ password, guestName }),
  }),
  
  updateMeeting: (meetingId, data) => request(`/meetings/${meetingId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  
  cancelMeeting: (meetingId) => request(`/meetings/${meetingId}`, {
    method: 'DELETE',
  }),
};

export const controlApi = {
  endMeeting: (meetingId) => request(`/control/${meetingId}/end`, {
    method: 'POST',
  }),

  muteAll: (meetingId) => request(`/control/${meetingId}/mute-all`, {
    method: 'POST',
  }),
  
  muteParticipant: (meetingId, participantId) => request(`/control/${meetingId}/mute/${participantId}`, {
    method: 'POST',
  }),
  
  unmuteParticipant: (meetingId, participantId) => request(`/control/${meetingId}/unmute/${participantId}`, {
    method: 'POST',
  }),
  
  removeParticipant: (meetingId, participantId) => request(`/control/${meetingId}/remove/${participantId}`, {
    method: 'POST',
  }),
  
  admitParticipant: (meetingId, participantId) => request(`/control/${meetingId}/admit/${participantId}`, {
    method: 'POST',
  }),
  
  admitAll: (meetingId) => request(`/control/${meetingId}/admit-all`, {
    method: 'POST',
  }),
  
  toggleRecording: (meetingId, enabled) => request(`/control/${meetingId}/recording/${enabled ? 'start' : 'stop'}`, {
    method: 'POST',
  }),
  
  toggleScreenShare: (meetingId, enabled) => request(`/control/${meetingId}/screen-share/${enabled ? 'start' : 'stop'}`, {
    method: 'POST',
  }),
  
  toggleWaitingRoom: (meetingId) => request(`/control/${meetingId}/toggle-waiting-room`, {
    method: 'POST',
  }),
  
  leaveMeeting: (meetingId) => request(`/control/${meetingId}/leave`, {
    method: 'POST',
  }),
  
  toggleAudio: (meetingId, enabled) => request('/control/participant/audio', {
    method: 'PATCH',
    body: JSON.stringify({ meetingId, enabled }),
  }),
  
  toggleVideo: (meetingId, enabled) => request('/control/participant/video', {
    method: 'PATCH',
    body: JSON.stringify({ meetingId, enabled }),
  }),

  sendMessage: (meetingId, message) => request(`/control/${meetingId}/chat`, {
    method: 'POST',
    body: JSON.stringify({ message }),
  }),

  getMessages: (meetingId) => request(`/control/${meetingId}/chat`),
};
