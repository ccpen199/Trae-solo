import client from './client';

export async function getUser(id) {
  const response = await client.get(`/users/${id}`);
  return response.data;
}

export async function getUserArticles(id, params = {}) {
  const response = await client.get(`/users/${id}/articles`, { params });
  return response.data;
}

export async function getUserQuestions(id, params = {}) {
  const response = await client.get(`/users/${id}/questions`, { params });
  return response.data;
}

export async function followUser(id) {
  const response = await client.post(`/users/${id}/follow`);
  return response.data;
}

export async function getFollowers(id, params = {}) {
  const response = await client.get(`/users/${id}/followers`, { params });
  return response.data;
}

export async function getFollowing(id, params = {}) {
  const response = await client.get(`/users/${id}/following`, { params });
  return response.data;
}

export { getFollowers as getUserFollowers, getFollowing as getUserFollowing };
