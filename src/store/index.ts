import { create } from "zustand"
import type {
  Device,
  Alert,
  Member,
  CallRecord,
  Location,
  Geofence,
  PrivacyPolicy,
  BehaviorAnomaly,
  BehaviorRule,
  TrendData,
  EncryptionStatus,
  WorkOrder,
} from "@/types"

interface AppState {
  devices: Device[]
  locations: Location[]
  alerts: Alert[]
  members: Member[]
  callRecords: CallRecord[]
  geofences: Geofence[]
  privacyPolicies: PrivacyPolicy[]
  anomalies: BehaviorAnomaly[]
  behaviorRules: BehaviorRule[]
  trendData: TrendData[]
  encryptionStatus: EncryptionStatus | null
  workOrders: WorkOrder[]
  loading: boolean

  fetchDevices: () => Promise<void>
  fetchLocations: (params?: Record<string, string>) => Promise<void>
  fetchAlerts: (params?: Record<string, string>) => Promise<void>
  fetchMembers: () => Promise<void>
  fetchCallRecords: (params?: Record<string, string>) => Promise<void>
  fetchGeofences: () => Promise<void>
  fetchPrivacyPolicies: () => Promise<void>
  fetchAnomalies: (params?: Record<string, string>) => Promise<void>
  fetchBehaviorRules: () => Promise<void>
  fetchTrendData: (params?: Record<string, string>) => Promise<void>
  fetchEncryptionStatus: () => Promise<void>
  fetchWorkOrders: () => Promise<void>
  updateDeviceSettings: (id: string, settings: Partial<Device["settings"]>) => Promise<void>
  acknowledgeAlert: (id: string) => Promise<void>
  resolveAlert: (id: string) => Promise<void>
  createWorkOrder: (alertId: string, assignee: string) => Promise<void>
  updatePrivacyPolicy: (id: string, enabled: boolean) => Promise<void>
  updateBehaviorRule: (id: string, data: Partial<BehaviorRule>) => Promise<void>
  deleteGeofence: (id: string) => Promise<void>
}

async function apiFetch<T>(url: string): Promise<T> {
  const res = await fetch(url)
  const json = await res.json()
  if (!json.success) throw new Error(json.error || "API Error")
  return json.data as T
}

async function apiPut<T>(url: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  })
  const json = await res.json()
  if (!json.success) throw new Error(json.error || "API Error")
  return json.data as T
}

async function apiPost<T>(url: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  })
  const json = await res.json()
  if (!json.success) throw new Error(json.error || "API Error")
  return json.data as T
}

async function apiDelete<T>(url: string): Promise<T> {
  const res = await fetch(url, { method: "DELETE" })
  const json = await res.json()
  if (!json.success) throw new Error(json.error || "API Error")
  return json.data as T
}

export const useAppStore = create<AppState>((set, get) => ({
  devices: [],
  locations: [],
  alerts: [],
  members: [],
  callRecords: [],
  geofences: [],
  privacyPolicies: [],
  anomalies: [],
  behaviorRules: [],
  trendData: [],
  encryptionStatus: null,
  workOrders: [],
  loading: false,

  fetchDevices: async () => {
    const data = await apiFetch<Device[]>("/api/devices")
    set({ devices: data })
  },

  fetchLocations: async (params) => {
    const query = params ? "?" + new URLSearchParams(params).toString() : ""
    const data = await apiFetch<Location[]>(`/api/locations${query}`)
    set({ locations: data })
  },

  fetchAlerts: async (params) => {
    const query = params ? "?" + new URLSearchParams(params).toString() : ""
    const data = await apiFetch<Alert[]>(`/api/alerts${query}`)
    set({ alerts: data })
  },

  fetchMembers: async () => {
    const data = await apiFetch<Member[]>("/api/members")
    set({ members: data })
  },

  fetchCallRecords: async (params) => {
    const query = params ? "?" + new URLSearchParams(params).toString() : ""
    const data = await apiFetch<CallRecord[]>(`/api/calls${query}`)
    set({ callRecords: data })
  },

  fetchGeofences: async () => {
    const data = await apiFetch<Geofence[]>("/api/geofences")
    set({ geofences: data })
  },

  fetchPrivacyPolicies: async () => {
    const data = await apiFetch<PrivacyPolicy[]>("/api/privacy/policies")
    set({ privacyPolicies: data })
  },

  fetchAnomalies: async (params) => {
    const query = params ? "?" + new URLSearchParams(params).toString() : ""
    const data = await apiFetch<BehaviorAnomaly[]>(`/api/analytics/anomalies${query}`)
    set({ anomalies: data })
  },

  fetchBehaviorRules: async () => {
    const data = await apiFetch<BehaviorRule[]>("/api/analytics/rules")
    set({ behaviorRules: data })
  },

  fetchTrendData: async (params) => {
    const query = params ? "?" + new URLSearchParams(params).toString() : ""
    const data = await apiFetch<TrendData[]>(`/api/analytics/trends${query}`)
    set({ trendData: data })
  },

  fetchEncryptionStatus: async () => {
    const data = await apiFetch<EncryptionStatus>("/api/privacy/encryption/status")
    set({ encryptionStatus: data })
  },

  fetchWorkOrders: async () => {
    const data = await apiFetch<WorkOrder[]>("/api/alerts/workorders")
    set({ workOrders: data })
  },

  updateDeviceSettings: async (id, settings) => {
    await apiPut(`/api/devices/${id}/settings`, settings)
    const devices = get().devices.map((d) =>
      d.id === id ? { ...d, settings: { ...d.settings, ...settings } as Device["settings"] } : d
    )
    set({ devices })
  },

  acknowledgeAlert: async (id) => {
    await apiPut(`/api/alerts/${id}/acknowledge`)
    const alerts = get().alerts.map((a) =>
      a.id === id ? { ...a, status: "acknowledged" as const } : a
    )
    set({ alerts })
  },

  resolveAlert: async (id) => {
    await apiPut(`/api/alerts/${id}/resolve`)
    const alerts = get().alerts.map((a) =>
      a.id === id ? { ...a, status: "resolved" as const } : a
    )
    set({ alerts })
  },

  createWorkOrder: async (alertId, assignee) => {
    await apiPost(`/api/alerts/${alertId}/workorder`, { assignee })
  },

  updatePrivacyPolicy: async (id, enabled) => {
    await apiPut(`/api/privacy/policies/${id}`, { enabled })
    const privacyPolicies = get().privacyPolicies.map((p) =>
      p.id === id ? { ...p, enabled } : p
    )
    set({ privacyPolicies })
  },

  updateBehaviorRule: async (id, data) => {
    await apiPut(`/api/analytics/rules/${id}`, data)
    const behaviorRules = get().behaviorRules.map((r) =>
      r.id === id ? { ...r, ...data } : r
    )
    set({ behaviorRules })
  },

  deleteGeofence: async (id) => {
    await apiDelete(`/api/geofences/${id}`)
    const geofences = get().geofences.filter((g) => g.id !== id)
    set({ geofences })
  },
}))
