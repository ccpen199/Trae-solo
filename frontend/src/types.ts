export const STATUS_COLORS: Record<string, string> = {
  pending: 'orange',
  accepted: 'blue',
  picked_up: 'cyan',
  delivering: 'geekblue',
  signed: 'green',
  completed: 'green',
  cancelled: 'red',
}

export const STATUS_LABELS: Record<string, string> = {
  pending: '待调度',
  accepted: '已接单',
  picked_up: '已取件',
  delivering: '配送中',
  signed: '已签收',
  completed: '已完成',
  cancelled: '已取消',
}

export const CATEGORY_COLORS: Record<string, string> = {
  food: 'orange',
  fresh: 'green',
  document: 'blue',
  gift: 'purple',
}

export const CATEGORY_LABELS: Record<string, string> = {
  food: '美食',
  fresh: '生鲜',
  document: '文件',
  gift: '礼品',
}

export const KNIGHT_STATUS_COLORS: Record<string, string> = {
  online: 'green',
  offline: 'default',
  busy: 'orange',
  suspended: 'red',
}

export const KNIGHT_STATUS_LABELS: Record<string, string> = {
  online: '在线',
  offline: '离线',
  busy: '忙碌',
  suspended: '已封禁',
}

export const KNIGHT_TYPE_COLORS: Record<string, string> = {
  certified: 'gold',
  crowdsourced: 'default',
}

export const KNIGHT_TYPE_LABELS: Record<string, string> = {
  certified: '认证骑手',
  crowdsourced: '众包骑手',
}

export const EXCEPTION_TYPE_COLORS: Record<string, string> = {
  pickup_timeout: 'orange',
  knight_offline: 'red',
  delivery_timeout: 'volcano',
}

export const EXCEPTION_TYPE_LABELS: Record<string, string> = {
  pickup_timeout: '取件超时',
  knight_offline: '骑手离线',
  delivery_timeout: '配送超时',
}

export const EXCEPTION_STATUS_COLORS: Record<string, string> = {
  pending: 'orange',
  auto_reassigned: 'cyan',
  resolved: 'green',
}

export const EXCEPTION_STATUS_LABELS: Record<string, string> = {
  pending: '处理中',
  auto_reassigned: '已自动转派',
  resolved: '已解决',
}

export const INSURANCE_LEVEL_COLORS: Record<string, string> = {
  basic: 'default',
  standard: 'blue',
  premium: 'gold',
}

export const INSURANCE_LEVEL_LABELS: Record<string, string> = {
  basic: '基础版',
  standard: '标准版',
  premium: '尊享版',
}

export function formatTime(dateStr: string) {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return '-'
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}
