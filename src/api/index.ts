import type {
  Vessel,
  Certificate,
  Declaration,
  TrackPoint,
  Fence,
  Alert,
  Event,
  EventNotification,
  EventReceipt,
  DashboardData,
  FleetStat,
  SeaAreaStat,
  ViolationStat,
  SafetyRiskStat,
  VoyageStat,
  VesselType,
  SeaArea,
  ApiResponse,
  PaginatedData,
} from "../types"

const API_BASE = "/api"

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || data.message || "Request failed")
  }

  return data
}

export async function getVessels(params?: Record<string, string | number>) {
  const query = params ? "?" + new URLSearchParams(params as Record<string, string>).toString() : ""
  return fetchJson<ApiResponse<PaginatedData<Vessel>>>(`${API_BASE}/vessels${query}`)
}

export async function getVessel(id: number) {
  return fetchJson<ApiResponse<Vessel>>(`${API_BASE}/vessels/${id}`)
}

export async function createVessel(data: Partial<Vessel>) {
  return fetchJson<ApiResponse<Vessel>>(`${API_BASE}/vessels`, {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function updateVessel(id: number, data: Partial<Vessel>) {
  return fetchJson<ApiResponse<Vessel>>(`${API_BASE}/vessels/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  })
}

export async function deleteVessel(id: number) {
  return fetchJson<ApiResponse<void>>(`${API_BASE}/vessels/${id}`, {
    method: "DELETE",
  })
}

export async function getVesselCertificates(vesselId: number) {
  return fetchJson<ApiResponse<Certificate[]>>(`${API_BASE}/vessels/${vesselId}/certificates`)
}

export async function createCertificate(vesselId: number, data: Partial<Certificate>) {
  return fetchJson<ApiResponse<Certificate>>(`${API_BASE}/vessels/${vesselId}/certificates`, {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function updateCertificate(id: number, data: Partial<Certificate>) {
  return fetchJson<ApiResponse<Certificate>>(`${API_BASE}/certificates/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  })
}

export async function getDeclarations(params?: Record<string, string | number>) {
  const query = params ? "?" + new URLSearchParams(params as Record<string, string>).toString() : ""
  return fetchJson<ApiResponse<PaginatedData<Declaration>>>(`${API_BASE}/declarations${query}`)
}

export async function getDeclaration(id: number) {
  return fetchJson<ApiResponse<Declaration>>(`${API_BASE}/declarations/${id}`)
}

export async function createDeclaration(data: Partial<Declaration>) {
  return fetchJson<ApiResponse<Declaration>>(`${API_BASE}/declarations`, {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function updateDeclaration(id: number, data: Partial<Declaration>) {
  return fetchJson<ApiResponse<Declaration>>(`${API_BASE}/declarations/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  })
}

export async function verifyDeclaration(id: number) {
  return fetchJson<ApiResponse<Declaration>>(`${API_BASE}/declarations/${id}/verify`, {
    method: "POST",
  })
}

export async function approveDeclaration(id: number) {
  return fetchJson<ApiResponse<Declaration>>(`${API_BASE}/declarations/${id}/approve`, {
    method: "POST",
  })
}

export async function rejectDeclaration(id: number, reason: string) {
  return fetchJson<ApiResponse<Declaration>>(`${API_BASE}/declarations/${id}/reject`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  })
}

export async function returnDeclaration(id: number) {
  return fetchJson<ApiResponse<Declaration>>(`${API_BASE}/declarations/${id}/return`, {
    method: "POST",
  })
}

export async function getMonitorVessels() {
  return fetchJson<ApiResponse<Vessel[]>>(`${API_BASE}/monitor/vessels`)
}

export async function getVesselTrack(id: number, params?: Record<string, string | number>) {
  const query = params ? "?" + new URLSearchParams(params as Record<string, string>).toString() : ""
  return fetchJson<ApiResponse<TrackPoint[]>>(`${API_BASE}/monitor/vessels/${id}/track${query}`)
}

export async function getFences() {
  return fetchJson<ApiResponse<Fence[]>>(`${API_BASE}/monitor/fences`)
}

export async function createFence(data: Partial<Fence>) {
  return fetchJson<ApiResponse<Fence>>(`${API_BASE}/monitor/fences`, {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function getAlerts(params?: Record<string, string | number>) {
  const query = params ? "?" + new URLSearchParams(params as Record<string, string>).toString() : ""
  return fetchJson<ApiResponse<Alert[]>>(`${API_BASE}/monitor/alerts${query}`)
}

export async function handleAlert(id: number) {
  return fetchJson<ApiResponse<{ event_id: number }>>(`${API_BASE}/monitor/alerts/${id}/handle`, {
    method: "POST",
  })
}

export async function getEvents(params?: Record<string, string | number>) {
  const query = params ? "?" + new URLSearchParams(params as Record<string, string>).toString() : ""
  return fetchJson<ApiResponse<PaginatedData<Event>>>(`${API_BASE}/events${query}`)
}

export async function getEvent(id: number) {
  return fetchJson<ApiResponse<Event>>(`${API_BASE}/events/${id}`)
}

export async function createEvent(data: Partial<Event>) {
  return fetchJson<ApiResponse<Event>>(`${API_BASE}/events`, {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function updateEvent(id: number, data: Partial<Event>) {
  return fetchJson<ApiResponse<Event>>(`${API_BASE}/events/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  })
}

export async function notifyEvent(id: number, data: Partial<EventNotification>) {
  return fetchJson<ApiResponse<EventNotification>>(`${API_BASE}/events/${id}/notify`, {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function receiptEvent(id: number, data: Partial<EventReceipt>) {
  return fetchJson<ApiResponse<EventReceipt>>(`${API_BASE}/events/${id}/receipt`, {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function resolveEvent(id: number, resolution: string) {
  return fetchJson<ApiResponse<Event>>(`${API_BASE}/events/${id}/resolve`, {
    method: "POST",
    body: JSON.stringify({ resolution }),
  })
}

export async function getDashboardData() {
  return fetchJson<ApiResponse<DashboardData>>(`${API_BASE}/dashboard`)
}

export async function getFleetStats() {
  return fetchJson<ApiResponse<FleetStat[]>>(`${API_BASE}/stats/fleet`)
}

export async function getSeaAreaStats() {
  return fetchJson<ApiResponse<SeaAreaStat[]>>(`${API_BASE}/stats/sea-areas`)
}

export async function getVoyageStats() {
  return fetchJson<ApiResponse<VoyageStat>>(`${API_BASE}/stats/voyages`)
}

export async function getViolationStats() {
  return fetchJson<ApiResponse<ViolationStat[]>>(`${API_BASE}/stats/violations`)
}

export async function getSafetyRiskStats() {
  return fetchJson<ApiResponse<SafetyRiskStat[]>>(`${API_BASE}/stats/safety-risks`)
}

export async function getVesselTypes() {
  return fetchJson<ApiResponse<VesselType[]>>(`${API_BASE}/options/vessel-types`)
}

export async function getSeaAreas() {
  return fetchJson<ApiResponse<SeaArea[]>>(`${API_BASE}/options/sea-areas`)
}
