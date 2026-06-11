export type UserRole = "student" | "operator" | "investor"

export type DeviceStatus = "online" | "offline" | "fault"

export interface Device {
  id: string
  name: string
  location: string
  status: DeviceStatus
  lat: number
  lng: number
  temperature: number
  firmwareVersion: string
  lastOnline: string
  totalRunHours: number
  dailyWaterUsage: number
  faultCode: string | null
  energyConsumption: number
}

export interface Transaction {
  id: string
  userId: string
  deviceId: string
  startTime: string
  endTime: string
  waterTemperature: number
  volume: number
  amount: number
  encrypted: boolean
  nonce: string
}

export interface User {
  id: string
  phone: string
  role: UserRole
  balance: number
  boundDevices: string[]
}

export interface AlertItem {
  id: string
  deviceId: string
  level: "warning" | "error" | "critical"
  message: string
  timestamp: string
  status: "pending" | "resolved"
}

export interface FirmwareTask {
  id: string
  version: string
  targetDevices: string[]
  progress: number
  status: "pending" | "in_progress" | "completed" | "failed"
  createdAt: string
}

export interface ROIData {
  projectId: string
  projectName: string
  dailyWaterVolume: number
  unitPrice: number
  dailyRevenue: number
  maintenanceCost: number
  dailyROI: number
  trend: ROITrendPoint[]
}

export interface ROITrendPoint {
  date: string
  roi: number
  revenue: number
  cost: number
}

export interface DispenseSession {
  deviceId: string
  deviceName: string
  waterTemperature: number
  startTime: string
  isActive: boolean
  currentVolume: number
  currentAmount: number
}
