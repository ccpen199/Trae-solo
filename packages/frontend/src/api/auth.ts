import client from './client';

export function login(phone: string, password: string) {
  return client.post('/auth/login', { phone, password });
}

export function register(phone: string, code: string, password: string) {
  return client.post('/auth/register', { phone, code, password });
}

export function sendSmsCode(phone: string) {
  return client.post('/auth/sms-code', { phone });
}

export function samlLogin() {
  return client.get('/auth/saml/login');
}

export function refreshToken() {
  return client.post('/auth/refresh');
}

export function getCurrentUser() {
  return client.get('/auth/me');
}
