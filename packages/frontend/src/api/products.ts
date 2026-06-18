import client from './client';

export function getProducts(params?: Record<string, any>) {
  return client.get('/products', { params });
}

export function getProduct(id: string) {
  return client.get(`/products/${id}`);
}

export function getCategories() {
  return client.get('/products/categories');
}

export function getWarehouses() {
  return client.get('/products/warehouses');
}

export function getPickupPoints() {
  return client.get('/products/pickup-points');
}
