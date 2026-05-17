import axios from 'axios';

const API_BASE_URL = 'http://localhost:47721/api';

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

client.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error)
);

client.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.message || error.message || '请求失败';
    console.error('API Error:', message);
    return Promise.reject({ ...error, message });
  }
);

export const roomsAPI = {
  getRooms: (filter = 'recommended') => client.get(`/rooms?filter=${filter}`),
  getRoom: (id) => client.get(`/rooms/${id}`),
  createRoom: (data) => client.post('/rooms', data),
  joinRoom: (id, userId) => client.post(`/rooms/${id}/join`, { userId }),
  leaveRoom: (id, userId) => client.post(`/rooms/${id}/leave`, { userId })
};

export const usersAPI = {
  getUser: (id) => client.get(`/users/${id}`),
  getFollowingRooms: (id) => client.get(`/users/${id}/following-rooms`)
};

export const matchesAPI = {
  startMatch: (data) => client.post('/matches', data),
  cancelMatch: (userId) => client.delete(`/matches/${userId}`),
  getMatchStatus: (userId) => client.get(`/matches/${userId}/status`)
};

export const storiesAPI = {
  getStories: (difficulty) => client.get(`/stories${difficulty ? `?difficulty=${difficulty}` : ''}`),
  getStory: (id) => client.get(`/stories/${id}`)
};

export const messagesAPI = {
  sendMessage: (data) => client.post('/messages', data),
  getMessages: (roomId) => client.get(`/messages/room/${roomId}`)
};

export default client;
