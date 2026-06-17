const BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  }
  const json = await res.json();
  if (json.code !== undefined && json.code !== 0) {
    throw new Error(json.message || "请求失败");
  }
  if (json.data !== undefined) {
    return json.data as T;
  }
  return json as T;
}

export const api = {
  health: () => request<{ status: string; timestamp: string }>("/health", { method: "GET" }),
  stats: () => request<{ totalUsers: number; totalServices: number; avgSLA: number; citiesCovered: number }>("/platform/stats", { method: "GET" }),
  user: {
    profile: () => request<any>("/user/profile"),
  },
  identity: {
    providers: () => request<any[]>("/identity/providers"),
  },
  services: {
    list: (role?: string) => request<any[]>(role ? `/services?role=${role}` : "/services"),
  },
  news: {
    list: () => request<any[]>("/news"),
  },
  gov: {
    documents: () => request<any[]>("/gov/documents"),
    meetings: () => request<any[]>("/gov/meetings"),
    tasks: () => request<any[]>("/gov/tasks"),
  },
  tour: {
    spots: () => request<any[]>("/tour/spots"),
    routes: () => request<any[]>("/tour/routes"),
    generateRoutes: (preferences: string[]) => request<any[]>("/tour/routes/generate", { method: "POST", body: JSON.stringify({ preferences }) }),
    complaints: () => request<any[]>("/tour/complaints"),
    submitComplaint: (title: string, content: string) => request<any>("/tour/complaints", { method: "POST", body: JSON.stringify({ title, content }) }),
    reserve: (spotId: string, slot: string) => request<any>(`/tour/spots/${spotId}/reserve`, { method: "POST", body: JSON.stringify({ slot }) }),
  },
  livelihood: {
    subsidies: (type?: string) => request<any[]>(type ? `/livelihood/subsidies?type=${type}` : "/livelihood/subsidies"),
    applySubsidy: (id: string) => request<any>("/livelihood/subsidies/apply", { method: "POST", body: JSON.stringify({ id }) }),
    insurance: () => request<any>("/livelihood/insurance"),
    activateCrossRegion: () => request<any>("/livelihood/insurance/cross-region", { method: "POST" }),
  },
  monitor: {
    sla: () => request<any[]>("/monitor/sla"),
    slaHistory: () => request<any[]>("/monitor/sla/history"),
    policies: () => request<any[]>("/monitor/policies"),
  },
};
