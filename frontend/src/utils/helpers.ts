import dayjs from 'dayjs'

export function formatDate(value?: string | null, format = 'YYYY-MM-DD HH:mm:ss') {
  if (!value) return '-'
  return dayjs(value).format(format)
}

export function formatBytes(bytes?: number | string) {
  if (bytes === undefined || bytes === null || bytes === '') return '-'
  const n = typeof bytes === 'string' ? parseFloat(bytes) : bytes
  if (isNaN(n)) return '-'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let i = 0
  let v = n
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024
    i++
  }
  return `${v.toFixed(v >= 100 || i === 0 ? 0 : 2)} ${units[i]}`
}

export function getStatusColor(status: string): string {
  const s = (status || '').toLowerCase()
  if (
    ['running', 'ready', 'healthy', 'success', 'succeeded', 'completed', 'normal', 'approved'].some(
      (k) => s.includes(k),
    )
  ) {
    return 'green'
  }
  if (['pending', 'executing'].some((k) => s.includes(k))) {
    return 'orange'
  }
  if (
    ['failed', 'error', 'crash', 'backoff', 'expired', 'rolled_back'].some((k) => s.includes(k))
  ) {
    return 'red'
  }
  if (['warning', 'expiring'].some((k) => s.includes(k))) {
    return 'gold'
  }
  return 'default'
}

export function getRoleLabel(role?: string) {
  switch (role) {
    case 'admin':
      return '管理员'
    case 'operator':
      return '运维'
    case 'viewer':
      return '只读'
    default:
      return role || '-'
  }
}
