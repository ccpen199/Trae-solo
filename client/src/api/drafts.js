import client from './client';

export async function saveDraft(type, data) {
  const response = await client.post('/drafts', { type, data });
  return response.data;
}

export async function getDraft(type) {
  const response = await client.get(`/drafts/${type}`);
  return response.data;
}

export async function deleteDraft(type) {
  const response = await client.delete(`/drafts/${type}`);
  return response.data;
}
