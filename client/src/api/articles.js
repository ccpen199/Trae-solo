import client from './client';

export async function getArticles(params = {}) {
  const response = await client.get('/articles', { params });
  return response.data;
}

export async function getArticle(id) {
  const response = await client.get(`/articles/${id}`);
  return response.data;
}

export async function createArticle(data) {
  const response = await client.post('/articles', data);
  return response.data;
}

export async function updateArticle(id, data) {
  const response = await client.put(`/articles/${id}`, data);
  return response.data;
}

export async function likeArticle(id) {
  const response = await client.post(`/articles/${id}/like`);
  return response.data;
}

export async function favoriteArticle(id) {
  const response = await client.post(`/articles/${id}/favorite`);
  return response.data;
}
