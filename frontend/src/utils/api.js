const BASE_URL = '/api';

export async function fetchCities() {
  const response = await fetch(`${BASE_URL}/cities`);
  return response.json();
}

export async function fetchLandmarks(cityId, type = '') {
  const url = type ? `${BASE_URL}/cities/${cityId}/landmarks?type=${type}` : `${BASE_URL}/cities/${cityId}/landmarks`;
  const response = await fetch(url);
  return response.json();
}

export async function fetchCarTypes() {
  const response = await fetch(`${BASE_URL}/car-types`);
  return response.json();
}

export async function createOrder(orderData) {
  const response = await fetch(`${BASE_URL}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(orderData),
  });
  return response.json();
}

export async function fetchOrders(limit = 10) {
  const response = await fetch(`${BASE_URL}/orders?limit=${limit}`);
  return response.json();
}

export async function fetchOrderById(id) {
  const response = await fetch(`${BASE_URL}/orders/${id}`);
  return response.json();
}

export async function fetchPromotions() {
  const response = await fetch(`${BASE_URL}/promotions`);
  return response.json();
}

export async function fetchMessages() {
  const response = await fetch(`${BASE_URL}/messages`);
  return response.json();
}

export async function fetchUnreadMessageCount() {
  const response = await fetch(`${BASE_URL}/messages/unread-count`);
  return response.json();
}

export async function markMessageAsRead(id) {
  const response = await fetch(`${BASE_URL}/messages/${id}/read`, {
    method: 'POST',
  });
  return response.json();
}

export async function fetchUserLocations() {
  const response = await fetch(`${BASE_URL}/user-locations`);
  return response.json();
}

export async function createUserLocation(locationData) {
  const response = await fetch(`${BASE_URL}/user-locations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(locationData),
  });
  return response.json();
}

export async function deleteUserLocation(id) {
  const response = await fetch(`${BASE_URL}/user-locations/${id}`, {
    method: 'DELETE',
  });
  return response.json();
}

export async function checkHealth() {
  const response = await fetch(`${BASE_URL}/health`);
  return response.json();
}
