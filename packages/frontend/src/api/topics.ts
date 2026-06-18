import client from './client';

export function getTopics(params?: Record<string, any>) {
  return client.get('/topics', { params });
}

export function getTopic(id: string) {
  return client.get(`/topics/${id}`);
}

export function createTopic(data: Record<string, any>) {
  return client.post('/topics', data);
}

export function updateTopic(id: string, data: Record<string, any>) {
  return client.put(`/topics/${id}`, data);
}

export function deleteTopic(id: string) {
  return client.delete(`/topics/${id}`);
}

export function likeTopic(id: string) {
  return client.post(`/topics/${id}/like`);
}

export function getComments(topicId: string, params?: Record<string, any>) {
  return client.get(`/topics/${topicId}/comments`, { params });
}

export function addComment(topicId: string, data: Record<string, any>) {
  return client.post(`/topics/${topicId}/comments`, data);
}

export function reportTopic(id: string, data: Record<string, any>) {
  return client.post(`/topics/${id}/report`, data);
}

export function getRecommendedTopics(params?: Record<string, any>) {
  return client.get('/topics/recommended', { params });
}
