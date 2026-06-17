const BASE = import.meta.env.VITE_API_BASE_URL || "/api";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  try {
    const res = await fetch(`${BASE}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...init,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    return res.json();
  } catch (err) {
    console.warn(`[API] ${path} failed, falling back to store:`, (err as Error).message);
    throw err;
  }
}

export const api = {
  tasks: {
    list: (params?: Record<string, string>) => {
      const qs = params ? "?" + new URLSearchParams(params).toString() : "";
      return request<{ data: any[]; total: number }>(`/tasks${qs}`);
    },
    get: (id: string) => request<any>(`/tasks/${id}`),
    create: (data: any) => request<any>("/tasks", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: any) => request<any>(`/tasks/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    addPricing: (id: string, data: any) => request<any>(`/tasks/${id}/pricing`, { method: "POST", body: JSON.stringify(data) }),
    stats: () => request<any>("/tasks/stats"),
  },
  submissions: {
    list: (params?: Record<string, string>) => {
      const qs = params ? "?" + new URLSearchParams(params).toString() : "";
      return request<{ data: any[]; total: number }>(`/submissions${qs}`);
    },
    get: (id: string) => request<any>(`/submissions/${id}`),
    updateStatus: (id: string, status: string, notes?: string) =>
      request<any>(`/submissions/${id}/status`, { method: "PATCH", body: JSON.stringify({ status, notes }) }),
  },
  alerts: {
    list: () => request<{ data: any[]; total: number }>("/alerts"),
    refresh: () => request<{ data: any[]; total: number }>("/alerts/refresh", { method: "POST" }),
    resolve: (id: string) => request<any>(`/alerts/${id}/resolve`, { method: "PATCH" }),
  },
  transactions: {
    list: (params?: Record<string, string>) => {
      const qs = params ? "?" + new URLSearchParams(params).toString() : "";
      return request<{ data: any[]; total: number }>(`/transactions${qs}`);
    },
    withdraw: (userId: string, amount: number) =>
      request<any>("/transactions/withdraw", { method: "POST", body: JSON.stringify({ userId, amount }) }),
  },
  users: {
    enterprises: () => request<{ data: any[] }>("/users/enterprises"),
    executors: () => request<{ data: any[] }>("/users/executors"),
  },
  health: () => request<{ status: string }>("/health"),
};
