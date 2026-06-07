export function getToken(): string {
  return localStorage.getItem('renovation_token') || localStorage.getItem('token') || '';
}

export function setToken(token: string): void {
  localStorage.setItem('renovation_token', token);
  localStorage.setItem('token', token);
}

export function removeToken(): void {
  localStorage.removeItem('renovation_token');
  localStorage.removeItem('token');
}

export function isLoggedIn(): boolean {
  return !!getToken();
}

export function getAuth(): { token: string; user: any } {
  const token = getToken();
  const raw = localStorage.getItem('user');
  let user = null;
  if (raw) {
    try { user = JSON.parse(raw); } catch { user = null; }
  }
  return { token, user };
}

export function removeAuth(): void {
  removeToken();
  localStorage.removeItem('user');
}

export function getUser<T = any>(): T | null {
  const raw = localStorage.getItem('user');
  if (!raw) return null;
  try { return JSON.parse(raw) as T; } catch { return null; }
}

export function setUser(user: any): void {
  localStorage.setItem('user', JSON.stringify(user));
}
