const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  const result = (await response.json()) as ApiResponse<T>;

  if (!result.success) {
    throw new Error(result.error || "API请求失败");
  }

  return result.data as T;
}

export const api = {
  devices: {
    list: () => request("/devices"),
    scan: () => request("/devices/scan", { method: "POST" }),
    bind: (data: { brand: string; model: string; name: string; deviceId: string }) =>
      request("/devices/bind", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    unbind: (id: string) =>
      request(`/devices/${id}`, { method: "DELETE" }),
    getStatus: (id: string) => request(`/devices/${id}/status`),
    sync: (id: string) =>
      request(`/devices/${id}/sync`, { method: "POST" }),
    setConnection: (id: string, status: string) =>
      request(`/devices/${id}/connection`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      }),
  },

  health: {
    realtime: () => request("/vitals/realtime"),
    hrv: (range = "7d") => request(`/hrv?range=${range}`),
    heartRate: (range = "7d") => request(`/heart-rate?range=${range}`),
    stress: (range = "7d") => request(`/stress?range=${range}`),
    bloodOxygen: (range = "7d") => request(`/blood-oxygen?range=${range}`),
    healthScore: () => request("/health-score"),
    sleep: (range = "7d") => request(`/sleep?range=${range}`),
    exercise: (range = "7d") => request(`/exercise?range=${range}`),
    exerciseTrajectory: (id: string) => request(`/exercise/${id}/trajectory`),
    currentPlan: () => request("/plans/current"),
    generatePlan: () =>
      request("/plans/generate", { method: "POST" }),
    completeExercise: (
      planId: string,
      dayIdx: number,
      exerciseId: string
    ) =>
      request(`/plans/${planId}/exercise/${dayIdx}/complete`, {
        method: "PUT",
        body: JSON.stringify({ exerciseId }),
      }),
  },

  alerts: {
    list: (status?: string) =>
      request(status ? `/alerts?status=${status}` : "/alerts"),
    active: () => request("/alerts/active"),
    rules: () => request("/alerts/rules"),
    createRule: (rule: unknown) =>
      request("/alerts/rules", {
        method: "POST",
        body: JSON.stringify(rule),
      }),
    updateRule: (id: string, rule: unknown) =>
      request(`/alerts/rules/${id}`, {
        method: "PUT",
        body: JSON.stringify(rule),
      }),
    deleteRule: (id: string) =>
      request(`/alerts/rules/${id}`, { method: "DELETE" }),
    acknowledge: (id: string, data?: Record<string, unknown>) =>
      request(`/alerts/${id}/acknowledge`, {
        method: "PUT",
        body: JSON.stringify(data || {}),
      }),
    dismiss: (id: string, data?: Record<string, unknown>) =>
      request(`/alerts/${id}/dismiss`, {
        method: "PUT",
        body: JSON.stringify(data || {}),
      }),
    scheduleReview: (id: string, reviewTime: string, dispositionStatus?: string) =>
      request(`/alerts/${id}/schedule-review`, {
        method: "PUT",
        body: JSON.stringify({ reviewTime, dispositionStatus }),
      }),
    markReferral: (id: string, appointmentId?: string) =>
      request(`/alerts/${id}/mark-referral`, {
        method: "PUT",
        body: JSON.stringify({ appointmentId }),
      }),
    completeReview: (id: string, dispositionStatus: string, dispositionNote?: string) =>
      request(`/alerts/${id}/complete-review`, {
        method: "PUT",
        body: JSON.stringify({ dispositionStatus, dispositionNote }),
      }),
    evaluate: () =>
      request("/alerts/evaluate", { method: "POST" }),
  },

  archives: {
    list: () => request("/archives"),
    generate: (data: {
      dateStart: string;
      dateEnd: string;
      dataTypes: string[];
      format: string;
    }) =>
      request("/archives/generate", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    download: (id: string) => `${API_BASE}/archives/${id}/download`,
    hisDepartments: () => request("/archives/his/departments"),
    hisDoctors: (dept?: string) =>
      request(dept ? `/archives/his/doctors?dept=${dept}` : "/archives/his/doctors"),
    hisAppointments: () => request("/archives/his/appointments"),
    createAppointment: (data: unknown) =>
      request("/archives/his/appointments", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    cancelAppointment: (id: string) =>
      request(`/archives/his/appointments/${id}/cancel`, {
        method: "PUT",
      }),
    authorizations: () => request("/archives/authorization"),
    createAuthorization: (data: unknown) =>
      request("/archives/authorization", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    revokeAuthorization: (id: string) =>
      request(`/archives/authorization/${id}`, { method: "DELETE" }),
  },
};
