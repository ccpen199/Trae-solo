import request from '../utils/request';

export const authApi = {
  login: (data) => request.post('/auth/login', data),
  register: (data) => request.post('/auth/register', data),
  getProfile: () => request.get('/auth/profile')
};

export const planetApi = {
  getPlanets: (params) => request.get('/planets', { params }),
  getPlanet: (id) => request.get(`/planets/${id}`),
  createPlanet: (data) => request.post('/planets', data),
  joinPlanet: (id, data) => request.post(`/planets/${id}/join`, data),
  createInviteCode: (id, data) => request.post(`/planets/${id}/invite-code`, data),
  getInviteCodes: (id) => request.get(`/planets/${id}/invite-codes`)
};

export const topicApi = {
  getTopics: (params) => request.get('/topics', { params }),
  searchTopics: (params) => request.get('/topics/search', { params }),
  getTopic: (id) => request.get(`/topics/${id}`),
  createTopic: (data) => request.post('/topics', data),
  getComments: (id) => request.get(`/topics/${id}/comments`),
  createComment: (id, data) => request.post(`/topics/${id}/comments`, data)
};
