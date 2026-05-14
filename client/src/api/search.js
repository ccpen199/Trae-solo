import client from './client';

export async function search(params) {
  const response = await client.get('/search', { params });
  return response.data;
}
