import client from './client';

export async function getComments(params) {
  const response = await client.get('/comments', { params });
  return response.data;
}

export async function createComment(data) {
  const response = await client.post('/comments', data);
  return response.data;
}

export async function likeComment(id) {
  const response = await client.post(`/comments/${id}/like`);
  return response.data;
}

export async function deleteComment(id) {
  const response = await client.delete(`/comments/${id}`);
  return response.data;
}
