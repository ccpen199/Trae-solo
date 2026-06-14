const BASE = '/api';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(BASE + path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || '请求失败');
  }
  return res.json();
}

export const api = {
  auth: {
    login: (phone: string, role = 'sender') => request('/auth/login', { method: 'POST', body: JSON.stringify({ phone, role }) }),
    profile: () => request('/auth/profile'),
  },
  orders: {
    create: (data: any) => request('/orders', { method: 'POST', body: JSON.stringify(data) }),
    get: (id: string) => request(`/orders/${id}`),
    getWaybill: (id: string) => request(`/orders/${id}/waybill`),
    calculateFreight: (data: any) => request('/orders/freight/calculate', { method: 'POST', body: JSON.stringify(data) }),
  },
  track: {
    get: (trackingNo: string) => request(`/track/${trackingNo}`),
    batch: (trackingNos: string[]) => request('/track/batch', { method: 'POST', body: JSON.stringify({ trackingNos }) }),
    history: (userId = 1) => request(`/track/history/list?userId=${userId}`),
  },
  outlets: {
    list: (params?: Record<string, any>) => {
      const qs = params ? '?' + new URLSearchParams(params as any).toString() : '';
      return request(`/outlets${qs}`);
    },
    get: (id: number) => request(`/outlets/${id}`),
  },
  afterSale: {
    list: (userId = 1) => request(`/after-sale?userId=${userId}`),
    create: (data: any) => request('/after-sale', { method: 'POST', body: JSON.stringify(data) }),
    get: (id: string) => request(`/after-sale/${id}`),
    upload: (id: string, files: File[]) => {
      const form = new FormData();
      files.forEach((f) => form.append('images', f));
      return fetch(BASE + `/after-sale/${id}/upload`, { method: 'POST', body: form }).then((r) => r.json());
    },
  },
  admin: {
    dashboard: () => request('/admin/dashboard'),
    heatmap: (metric: string) => request(`/admin/heatmap?metric=${metric}`),
    clv: (customerId?: number) => request(`/admin/clv${customerId ? `?customerId=${customerId}` : ''}`),
  },
};
