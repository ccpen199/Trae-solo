export function formatTime(isoString: string): string {
  const d = new Date(isoString)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  if (diff < 60000) return "刚刚"
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  return d.toLocaleDateString("zh-CN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}秒`
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  if (m < 60) return `${m}分${s}秒`
  const h = Math.floor(m / 60)
  return `${h}时${m % 60}分`
}

export function getStatusColor(status: string): string {
  switch (status) {
    case "online": return "text-guardian-green"
    case "offline": return "text-gray-500"
    case "sos": return "text-guardian-red animate-pulse"
    default: return "text-gray-400"
  }
}

export function getSeverityClass(severity: string): string {
  switch (severity) {
    case "critical": return "severity-critical"
    case "high": return "severity-high"
    case "medium": return "severity-medium"
    case "low": return "severity-low"
    default: return ""
  }
}

export function getAlertTypeLabel(type: string): string {
  const map: Record<string, string> = {
    sos: "SOS求助",
    geofence: "围栏越界",
    battery: "电量预警",
    behavior: "行为异常",
    offline: "设备离线",
  }
  return map[type] || type
}

export function getAnomalyTypeLabel(type: string): string {
  const map: Record<string, string> = {
    prolonged_stillness: "长时间静止",
    nighttime_movement: "夜间异常移动",
    signal_anomaly: "信号异常",
    unusual_route: "异常路线",
  }
  return map[type] || type
}

export function getDirectionLabel(dir: string): string {
  const map: Record<string, string> = {
    inbound: "来电",
    outbound: "去电",
    missed: "未接",
  }
  return map[dir] || dir
}

export function getRoleLabel(role: string): string {
  const map: Record<string, string> = {
    primary_guardian: "主监护人",
    temporary_caregiver: "临时看护人",
    school_admin: "学校管理员",
  }
  return map[role] || role
}
