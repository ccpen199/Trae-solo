import client from './client';

export async function getAdminStats() {
  const response = await client.get('/admin/stats');
  return response.data;
}

export async function getAdminUsers(params = {}) {
  const response = await client.get('/admin/users', { params });
  return response.data;
}

export async function updateUserStatus(id, status) {
  const response = await client.put(`/admin/users/${id}/status`, { status });
  return response.data;
}

export async function getAdminArticles(params = {}) {
  const response = await client.get('/admin/articles', { params });
  return response.data;
}

export async function updateArticleStatus(id, data) {
  const response = await client.put(`/admin/articles/${id}/status`, data);
  return response.data;
}

export async function getAdminQuestions(params = {}) {
  const response = await client.get('/admin/questions', { params });
  return response.data;
}

export async function updateQuestionStatus(id, data) {
  const response = await client.put(`/admin/questions/${id}/status`, data);
  return response.data;
}

export async function createCategory(data) {
  const response = await client.post('/admin/categories', data);
  return response.data;
}

export async function updateCategory(id, data) {
  const response = await client.put(`/admin/categories/${id}`, data);
  return response.data;
}

export async function getAdminCategories(params = {}) {
  const response = await client.get('/categories', { params });
  return response.data;
}
