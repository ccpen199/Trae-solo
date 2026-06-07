const TOKEN_KEY = 'dispatch_token';
const USER_KEY = 'dispatch_user';

export function saveToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem('token', token);
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || localStorage.getItem('token');
}

export function removeToken() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem('token');
}

export function saveUser(user) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getUser() {
  const raw = localStorage.getItem(USER_KEY);
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function removeUser() {
  localStorage.removeItem(USER_KEY);
}

export function isLoggedIn() {
  return !!getToken();
}

export function getUserRole() {
  const user = getUser();
  return user?.role || null;
}

export function logout() {
  removeToken();
  removeUser();
  window.location.href = '/login';
}
