import client from './client';

export async function getQuestions(params = {}) {
  const response = await client.get('/questions', { params });
  return response.data;
}

export async function getQuestion(id) {
  const response = await client.get(`/questions/${id}`);
  return response.data;
}

export async function createQuestion(data) {
  const response = await client.post('/questions', data);
  return response.data;
}

export async function likeQuestion(id) {
  const response = await client.post(`/questions/${id}/like`);
  return response.data;
}

export async function favoriteQuestion(id) {
  const response = await client.post(`/questions/${id}/favorite`);
  return response.data;
}

export async function getAnswers(questionId, params = {}) {
  const response = await client.get(`/questions/${questionId}/answers`, { params });
  return response.data;
}

export async function createAnswer(questionId, content) {
  const response = await client.post(`/questions/${questionId}/answers`, { content });
  return response.data;
}
