import client from './client';

export function getListings(params?: Record<string, any>) {
  return client.get('/secondhand', { params });
}

export function getListing(id: string) {
  return client.get(`/secondhand/${id}`);
}

export function createListing(data: Record<string, any>) {
  return client.post('/secondhand', data);
}

export function updateListing(id: string, data: Record<string, any>) {
  return client.put(`/secondhand/${id}`, data);
}

export function deleteListing(id: string) {
  return client.delete(`/secondhand/${id}`);
}

export function toggleFavorite(id: string) {
  return client.post(`/secondhand/${id}/favorite`);
}

export function buyListing(id: string, data: Record<string, any>) {
  return client.post(`/secondhand/${id}/buy`, data);
}

export function confirmReceipt(orderId: string) {
  return client.post(`/secondhand/orders/${orderId}/confirm`);
}

export function disputeOrder(orderId: string, data: Record<string, any>) {
  return client.post(`/secondhand/orders/${orderId}/dispute`, data);
}

export function getSecondhandOrders(params?: Record<string, any>) {
  return client.get('/secondhand/orders', { params });
}
