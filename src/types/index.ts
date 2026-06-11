export interface Device {
  id: string
  name: string
  type: "watch" | "shoe"
  imei: string
  status: "online" | "offline" | "sos"
  batteryLevel: number
  signalStrength: number
  firmwareVersion: string
  lastLocation?: {
    lat: number
    lng: number
    accuracy: number
    timestamp: string
  }
  settings?: DeviceSettings
}

export interface DeviceSettings {
  blockUnknownCalls: boolean
  restrictedApps: string[]
  classModeEnabled: boolean
  classModeSchedule: { start: string; end: string }[]
  batteryWarningThreshold: number
  batteryCriticalThreshold: number
}

export interface Location {
  id: string
  deviceId: string
  lat: number
  lng: number
  accuracy: number
  mode: "gps" | "wifi" | "cell" | "fusion"
  speed: number
  timestamp: string
}

export interface Geofence {
  id: string
  deviceId: string
  name: string
  type: "circle" | "polygon"
  coordinates: { lat: number; lng: number }[]
  radius?: number
  rule: "enter" | "exit" | "both"
  schedule: { start: string; end: string; days: number[] }
  enabled: boolean
  alertLevel: "low" | "medium" | "high"
}

export interface CallRecord {
  id: string
  deviceId: string
  type: "audio" | "video"
  direction: "inbound" | "outbound" | "missed"
  callerNumber: string
  duration: number
  timestamp: string
  hasRecording: boolean
  recordingUrl?: string
}

export interface Alert {
  id: string
  type: "sos" | "geofence" | "battery" | "behavior" | "offline"
  deviceId: string
  severity: "critical" | "high" | "medium" | "low"
  status: "pending" | "acknowledged" | "resolved" | "closed"
  description: string
  locationLat?: number
  locationLng?: number
  notificationChain: NotificationNode[]
  timestamp: string
}

export interface NotificationNode {
  role: "guardian" | "relative" | "school_admin"
  name: string
  status: "pending" | "notified" | "responded"
  notifiedAt?: string
  respondedAt?: string
}

export interface WorkOrder {
  id: string
  alertId: string
  assignee: string
  status: "open" | "in_progress" | "resolved" | "closed"
  notes: { author: string; content: string; timestamp: string }[]
  createdAt: string
  resolvedAt?: string
}

export interface Member {
  id: string
  name: string
  avatar: string
  phone: string
  role: "primary_guardian" | "temporary_caregiver" | "school_admin"
  permissions: string[]
  joinedAt: string
  invitedBy: string
}

export interface PrivacyPolicy {
  id: string
  name: string
  description: string
  category: "face_blur" | "location_strip" | "call_encrypt" | "data_mask"
  enabled: boolean
  config?: Record<string, unknown>
}

export interface EncryptionStatus {
  callEncryption: { enabled: boolean; algorithm: string; keyRotation: string; lastRotated: string }
  dataMasking: { enabled: boolean; maskPhone: boolean; maskName: boolean }
  faceBlur: { enabled: boolean; blurLevel: string }
  locationStrip: { enabled: boolean; precisionLevel: string }
  overallStatus: "fully_protected" | "partially_protected" | "unprotected"
}

export interface BehaviorAnomaly {
  id: string
  deviceId: string
  type: "prolonged_stillness" | "nighttime_movement" | "signal_anomaly" | "unusual_route"
  confidence: number
  description: string
  timestamp: string
  resolved: boolean
}

export interface BehaviorRule {
  id: string
  type: string
  threshold: number
  sensitivity: "low" | "medium" | "high"
  enabled: boolean
  timeRange?: { start: string; end: string }
}

export interface TrendData {
  date: string
  anomalies: number
  stillness: number
  nightMove: number
  signalAnomaly: number
}
