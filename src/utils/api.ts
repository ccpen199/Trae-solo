const API_BASE = (
  import.meta.env.VITE_API_BASE ||
  import.meta.env.VITE_API_URL ||
  '/api'
).replace(/\/$/, '');

function buildQuery(params?: Record<string, unknown>): string {
  const query = new URLSearchParams();
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    query.set(key, String(value));
  });
  const text = query.toString();
  return text ? `?${text}` : '';
}

interface RequestOptions extends RequestInit {
  headers?: Record<string, string>;
  requireAuth?: boolean;
}

async function request<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { requireAuth = true, headers = {}, ...rest } = options;

  const authHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  };

  if (requireAuth) {
    const token = localStorage.getItem('token') || 'local-demo-admin';
    if (token) {
      authHeaders['Authorization'] = `Bearer ${token}`;
    }
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...rest,
    headers: authHeaders,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || `HTTP ${response.status}`);
  }

  return data;
}

export const api = {
  auth: {
    login: (username: string, password: string) =>
      request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
        requireAuth: false,
      }),
    register: (username: string, password: string, role?: string) =>
      request('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username, password, role }),
        requireAuth: false,
      }),
    getProfile: () => request('/auth/profile'),
  },

  users: {
    getById: (id: string) => request(`/users/${id}`),
    getCreators: (params?: { page?: number; pageSize?: number; category?: string }) => {
      return request(`/users/creators${buildQuery(params as any)}`);
    },
    updateProfile: (data: any) =>
      request('/users/profile', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    follow: (userId: string) =>
      request(`/users/${userId}/follow`, { method: 'POST' }),
    unfollow: (userId: string) =>
      request(`/users/${userId}/follow`, { method: 'DELETE' }),
    getFollowStatus: (userId: string) => request(`/users/${userId}/follow-status`),
  },

  courses: {
    list: (params?: {
      page?: number;
      pageSize?: number;
      category?: string;
      keyword?: string;
      creatorId?: string;
      status?: string;
    }) => {
      return request(`/courses${buildQuery(params as any)}`);
    },
    getMy: (params?: { page?: number; pageSize?: number }) => {
      return request(`/courses/my${buildQuery(params as any)}`);
    },
    getById: (id: string) => request(`/courses/${id}`),
    create: (data: any) =>
      request('/courses', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: any) =>
      request(`/courses/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    submitForReview: (id: string) =>
      request(`/courses/${id}/submit`, { method: 'POST' }),
    getChapters: (courseId: string) => request(`/courses/${courseId}/chapters`),
    addChapter: (courseId: string, data: any) =>
      request(`/courses/${courseId}/chapters`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    updateChapter: (chapterId: string, data: any) =>
      request(`/courses/chapters/${chapterId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    deleteChapter: (chapterId: string) =>
      request(`/courses/chapters/${chapterId}`, { method: 'DELETE' }),
    getReviews: (courseId: string, params?: { page?: number; pageSize?: number }) => {
      return request(`/courses/${courseId}/reviews${buildQuery(params as any)}`);
    },
    addReview: (courseId: string, rating: number, content: string) =>
      request(`/courses/${courseId}/reviews`, {
        method: 'POST',
        body: JSON.stringify({ rating, content }),
      }),
    purchase: (courseId: string, purchaseType = 'one_time') =>
      request(`/courses/${courseId}/purchase`, {
        method: 'POST',
        body: JSON.stringify({ purchaseType }),
      }),
    getAccess: (courseId: string) => request(`/courses/${courseId}/access`),
  },

  orders: {
    list: (params?: {
      page?: number;
      pageSize?: number;
      category?: string;
      keyword?: string;
      status?: string;
      location?: string;
      creatorId?: string;
      requesterId?: string;
    }) => {
      return request(`/orders${buildQuery(params as any)}`);
    },
    getMy: (role?: string) => {
      const query = role ? `?role=${role}` : '';
      return request(`/orders/my${query}`);
    },
    getById: (id: string) => request(`/orders/${id}`),
    create: (data: any) =>
      request('/orders', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: any) =>
      request(`/orders/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    accept: (id: string) => request(`/orders/${id}/accept`, { method: 'POST' }),
    confirm: (id: string) => request(`/orders/${id}/confirm`, { method: 'POST' }),
    payDeposit: (id: string) => request(`/orders/${id}/pay-deposit`, { method: 'POST' }),
    start: (id: string) => request(`/orders/${id}/start`, { method: 'POST' }),
    complete: (id: string) => request(`/orders/${id}/complete`, { method: 'POST' }),
    cancel: (id: string, reason?: string) =>
      request(`/orders/${id}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      }),
    dispute: (id: string, reason: string) =>
      request(`/orders/${id}/dispute`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      }),
    getTraces: (id: string) => request(`/orders/${id}/traces`),
    getReview: (id: string) => request(`/orders/${id}/review`),
    addReview: (id: string, rating: number, content: string) =>
      request(`/orders/${id}/review`, {
        method: 'POST',
        body: JSON.stringify({ rating, content }),
      }),
    matchCreators: (id: string) => request(`/orders/${id}/match-creators`),
  },

  payment: {
    getWallet: () => request('/payment/wallet'),
    getTransactions: (params?: { page?: number; pageSize?: number; type?: string; status?: string }) => {
      return request(`/payment/transactions${buildQuery(params as any)}`);
    },
    getSettlement: (period = 'month') => request(`/payment/settlement?period=${period}`),
    withdraw: (amount: number) =>
      request('/payment/withdraw', {
        method: 'POST',
        body: JSON.stringify({ amount }),
      }),
  },

  review: {
    list: (params?: { page?: number; pageSize?: number; status?: string; contentType?: string }) => {
      return request(`/review${buildQuery(params as any)}`);
    },
    getStats: () => request('/review/stats'),
    getById: (id: string) => request(`/review/${id}`),
    approve: (id: string) => request(`/review/${id}/approve`, { method: 'POST' }),
    reject: (id: string, reason: string) =>
      request(`/review/${id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      }),
  },

  admin: {
    getDashboard: () => request('/admin/dashboard'),
    getCourses: (params?: any) => {
      return request(`/admin/courses${buildQuery(params as any)}`);
    },
    getOrders: (params?: any) => {
      return request(`/admin/orders${buildQuery(params as any)}`);
    },
    getTransactions: (params?: any) => {
      return request(`/admin/transactions${buildQuery(params as any)}`);
    },
    getFinance: () => request('/admin/finance'),
    getUsers: (params?: any) => {
      return request(`/admin/users${buildQuery(params as any)}`);
    },
    arbitrate: (orderId: string, decision: string, reason: string) =>
      request(`/admin/orders/${orderId}/arbitrate`, {
        method: 'POST',
        body: JSON.stringify({ decision, reason }),
      }),
  },

  config: () => request('/config', { requireAuth: false }),
  health: () => request('/health', { requireAuth: false }),
};

export default api;
