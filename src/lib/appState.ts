export interface User {
  id: number;
  phone: string;
  nickname: string;
  role: string;
  balance: number;
  vehicle_info?: string;
}

export function getToken(): string | null {
  try { return localStorage.getItem('token'); } catch { return null; }
}

export function getUser(): User | null {
  try {
    const data = localStorage.getItem('user');
    return data ? JSON.parse(data) : null;
  } catch { return null; }
}

export function getCurrentPage(): string {
  try {
    const page = localStorage.getItem('currentPage');
    if (page) return page;
  } catch {}
  return 'login';
}

export function getSelectedStation(): any {
  try {
    const data = localStorage.getItem('selectedStation');
    return data ? JSON.parse(data) : null;
  } catch { return null; }
}

export function getSelectedGun(): any {
  try {
    const data = localStorage.getItem('selectedGun');
    return data ? JSON.parse(data) : null;
  } catch { return null; }
}

export function getCurrentOrder(): any {
  try {
    const data = localStorage.getItem('currentOrder');
    return data ? JSON.parse(data) : null;
  } catch { return null; }
}

export function setCurrentPage(page: string): void {
  localStorage.setItem('currentPage', page);
  window.dispatchEvent(new CustomEvent('pagechange', { detail: page }));
}

export function setUser(user: User): void {
  localStorage.setItem('user', JSON.stringify(user));
  window.dispatchEvent(new CustomEvent('userchange', { detail: user }));
}

export function setToken(token: string): void {
  localStorage.setItem('token', token);
}

export function setSelectedStation(station: any): void {
  if (station) {
    localStorage.setItem('selectedStation', JSON.stringify(station));
  } else {
    localStorage.removeItem('selectedStation');
  }
  window.dispatchEvent(new CustomEvent('stationchange', { detail: station }));
}

export function setSelectedGun(gun: any): void {
  if (gun) {
    localStorage.setItem('selectedGun', JSON.stringify(gun));
  } else {
    localStorage.removeItem('selectedGun');
  }
  window.dispatchEvent(new CustomEvent('gunchange', { detail: gun }));
}

export function setCurrentOrder(order: any): void {
  if (order) {
    localStorage.setItem('currentOrder', JSON.stringify(order));
  } else {
    localStorage.removeItem('currentOrder');
  }
  window.dispatchEvent(new CustomEvent('orderchange', { detail: order }));
}

export function logout(): void {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.setItem('currentPage', 'login');
  window.dispatchEvent(new CustomEvent('logout'));
}

export function getRoleHome(role: string): string {
  if (role === 'admin' || role === 'operator') return 'admin-dashboard';
  return 'home';
}
