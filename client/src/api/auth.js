import client from './client';

export async function login(username, password) {
  const response = await client.post('/auth/login', { username, password });
  return response.data;
}

export async function register(data) {
  const response = await client.post('/auth/register', data);
  return response.data;
}

export async function getCurrentUser() {
  const response = await client.get('/auth/me');
  return response.data;
}

export async function updateProfile(data) {
  const response = await client.put('/auth/profile', data);
  return response.data;
}

export function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}
