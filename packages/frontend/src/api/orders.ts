import client from './client';

export function createOrder(data: Record<string, any>) {
  return client.post('/orders', data);
}

export function getOrders(params?: Record<string, any>) {
  return client.get('/orders', { params });
}

export function getOrder(id: string) {
  return client.get(`/orders/${id}`);
}

export function payOrder(id: string, data: Record<string, any>) {
  return client.post(`/orders/${id}/pay`, data);
}

export function cancelOrder(id: string) {
  return client.post(`/orders/${id}/cancel`);
}

export function confirmOrder(id: string) {
  return client.post(`/orders/${id}/confirm`);
}

export function refundOrder(id: string, data: Record<string, any>) {
  return client.post(`/orders/${id}/refund`, data);
}
