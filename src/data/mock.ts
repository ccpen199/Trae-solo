import type { Transaction, AlertItem, FirmwareTask, ROIData, User } from "@/types"

export const users: User[] = [
  { id: "U001", phone: "13800001111", role: "student", balance: 25.60, boundDevices: ["DEV001", "DEV005", "DEV007"] },
  { id: "U002", phone: "13800002222", role: "operator", balance: 0, boundDevices: [] },
  { id: "U003", phone: "13800003333", role: "investor", balance: 0, boundDevices: [] },
]

export const transactions: Transaction[] = [
  { id: "TXN001", userId: "U001", deviceId: "DEV001", startTime: "2026-06-11T08:30:00", endTime: "2026-06-11T08:33:20", waterTemperature: 95, volume: 0.5, amount: 1.50, encrypted: true, nonce: "n_a3f8c2d1" },
  { id: "TXN002", userId: "U001", deviceId: "DEV005", startTime: "2026-06-11T10:15:00", endTime: "2026-06-11T10:18:45", waterTemperature: 90, volume: 0.75, amount: 2.25, encrypted: true, nonce: "n_b7e1d4f9" },
  { id: "TXN003", userId: "U001", deviceId: "DEV007", startTime: "2026-06-10T22:00:00", endTime: "2026-06-10T22:05:00", waterTemperature: 96, volume: 1.0, amount: 3.00, encrypted: true, nonce: "n_c2a9b8e5" },
  { id: "TXN004", userId: "U001", deviceId: "DEV001", startTime: "2026-06-10T14:20:00", endTime: "2026-06-10T14:22:30", waterTemperature: 93, volume: 0.4, amount: 1.20, encrypted: true, nonce: "n_d5c3f7a1" },
  { id: "TXN005", userId: "U001", deviceId: "DEV011", startTime: "2026-06-10T12:00:00", endTime: "2026-06-10T12:04:15", waterTemperature: 97, volume: 0.85, amount: 2.55, encrypted: true, nonce: "n_e8b2d6c4" },
  { id: "TXN006", userId: "U001", deviceId: "DEV005", startTime: "2026-06-09T16:30:00", endTime: "2026-06-09T16:34:00", waterTemperature: 92, volume: 0.7, amount: 2.10, encrypted: true, nonce: "n_f1e4a8b3" },
  { id: "TXN007", userId: "U001", deviceId: "DEV009", startTime: "2026-06-09T07:45:00", endTime: "2026-06-09T07:48:30", waterTemperature: 94, volume: 0.6, amount: 1.80, encrypted: true, nonce: "n_g4d7c2e9" },
  { id: "TXN008", userId: "U001", deviceId: "DEV001", startTime: "2026-06-08T20:10:00", endTime: "2026-06-08T20:13:40", waterTemperature: 95, volume: 0.55, amount: 1.65, encrypted: true, nonce: "n_h7f5b1d8" },
  { id: "TXN009", userId: "U001", deviceId: "DEV012", startTime: "2026-06-08T12:30:00", endTime: "2026-06-08T12:35:00", waterTemperature: 95, volume: 0.9, amount: 2.70, encrypted: true, nonce: "n_i2a8e6c3" },
  { id: "TXN010", userId: "U001", deviceId: "DEV007", startTime: "2026-06-07T21:00:00", endTime: "2026-06-07T21:04:20", waterTemperature: 96, volume: 0.8, amount: 2.40, encrypted: true, nonce: "n_j5b3d9f7" },
  { id: "TXN011", userId: "U001", deviceId: "DEV005", startTime: "2026-06-07T09:00:00", endTime: "2026-06-07T09:03:10", waterTemperature: 90, volume: 0.45, amount: 1.35, encrypted: true, nonce: "n_k8c1e4a2" },
  { id: "TXN012", userId: "U001", deviceId: "DEV001", startTime: "2026-06-06T18:45:00", endTime: "2026-06-06T18:49:30", waterTemperature: 92, volume: 0.65, amount: 1.95, encrypted: true, nonce: "n_l3d6f8b5" },
]

export const alerts: AlertItem[] = [
  { id: "ALT001", deviceId: "DEV004", level: "critical", message: "加热模块故障，错误码 E003", timestamp: "2026-06-10T18:05:00", status: "pending" },
  { id: "ALT002", deviceId: "DEV014", level: "critical", message: "传感器异常，错误码 E007", timestamp: "2026-06-09T15:02:00", status: "pending" },
  { id: "ALT003", deviceId: "DEV022", level: "error", message: "主板通信失败，错误码 E012", timestamp: "2026-06-08T12:03:00", status: "pending" },
  { id: "ALT004", deviceId: "DEV008", level: "warning", message: "设备离线超过12小时", timestamp: "2026-06-11T08:00:00", status: "pending" },
  { id: "ALT005", deviceId: "DEV018", level: "warning", message: "设备离线，最后在线 08:00", timestamp: "2026-06-11T10:00:00", status: "pending" },
  { id: "ALT006", deviceId: "DEV003", level: "warning", message: "水温偏高 98°C，建议检查", timestamp: "2026-06-11T09:30:00", status: "resolved" },
  { id: "ALT007", deviceId: "DEV011", level: "warning", message: "日用水量异常偏高 920L", timestamp: "2026-06-10T20:00:00", status: "resolved" },
  { id: "ALT008", deviceId: "DEV007", level: "warning", message: "固件版本过旧 v2.3.0", timestamp: "2026-06-09T10:00:00", status: "resolved" },
  { id: "ALT009", deviceId: "DEV001", level: "warning", message: "滤芯寿命即将到期", timestamp: "2026-06-08T14:00:00", status: "resolved" },
  { id: "ALT010", deviceId: "DEV019", level: "warning", message: "能耗偏高 14.8kWh", timestamp: "2026-06-07T16:00:00", status: "resolved" },
  { id: "ALT011", deviceId: "DEV012", level: "warning", message: "设备运行时长超过预警值", timestamp: "2026-06-06T11:00:00", status: "resolved" },
  { id: "ALT012", deviceId: "DEV016", level: "warning", message: "水温波动较大", timestamp: "2026-06-05T09:00:00", status: "resolved" },
]

export const firmwareTasks: FirmwareTask[] = [
  { id: "FW001", version: "v2.3.2", targetDevices: ["DEV003", "DEV004", "DEV010", "DEV013", "DEV016", "DEV020"], progress: 66, status: "in_progress", createdAt: "2026-06-11T08:00:00" },
  { id: "FW002", version: "v2.3.1", targetDevices: ["DEV008", "DEV014", "DEV018", "DEV022"], progress: 100, status: "completed", createdAt: "2026-06-09T10:00:00" },
  { id: "FW003", version: "v2.4.0", targetDevices: ["DEV001", "DEV002", "DEV005", "DEV006", "DEV011", "DEV012", "DEV019", "DEV021"], progress: 0, status: "pending", createdAt: "2026-06-11T12:00:00" },
]

const generateROITrend = () => {
  const trend = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date(2026, 5, 11 - i)
    const dateStr = `${d.getMonth() + 1}/${d.getDate()}`
    const revenue = 2800 + Math.random() * 1200
    const cost = 800 + Math.random() * 400
    trend.push({ date: dateStr, roi: Math.round((revenue - cost) / cost * 100), revenue: Math.round(revenue), cost: Math.round(cost) })
  }
  return trend
}

export const roiData: ROIData[] = [
  {
    projectId: "P001",
    projectName: "杭州校区-一期",
    dailyWaterVolume: 5850,
    unitPrice: 3.0,
    dailyRevenue: 17550,
    maintenanceCost: 4200,
    dailyROI: 318,
    trend: generateROITrend(),
  },
  {
    projectId: "P002",
    projectName: "杭州校区-二期",
    dailyWaterVolume: 3200,
    unitPrice: 3.0,
    dailyRevenue: 9600,
    maintenanceCost: 2800,
    dailyROI: 243,
    trend: generateROITrend(),
  },
]

export const energyTrend = Array.from({ length: 30 }, (_, i) => {
  const d = new Date(2026, 5, 11 - i)
  return { date: `${d.getMonth() + 1}/${d.getDate()}`, hours: 16 + Math.random() * 8, energy: 10 + Math.random() * 5, usage: 300 + Math.random() * 200 }
})
