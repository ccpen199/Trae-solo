import client from './client';

export async function getCategories() {
  const response = await client.get('/categories');
  return response.data;
}
