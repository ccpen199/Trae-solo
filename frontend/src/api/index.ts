
const API_BASE = '/api';

export async function checkPhone(phone: string) {
  const res = await fetch(`${API_BASE}/auth/check-phone`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone })
  });
  return res.json();
}

export async function sendCode(phone: string) {
  const res = await fetch(`${API_BASE}/auth/send-code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone })
  });
  return res.json();
}

export async function verifyCode(phone: string, code: string) {
  const res = await fetch(`${API_BASE}/auth/verify-code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, code })
  });
  return res.json();
}

export async function register(phone: string, password: string) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, password })
  });
  return res.json();
}

export async function login(phone: string, password: string) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, password })
  });
  return res.json();
}

export async function createRide(data: {
  userId: number;
  startLocation: string;
  endLocation: string;
  city?: string;
  serviceType?: string;
}) {
  const res = await fetch(`${API_BASE}/ride/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function getRides(userId: number) {
  const res = await fetch(`${API_BASE}/ride/list/${userId}`);
  return res.json();
}
