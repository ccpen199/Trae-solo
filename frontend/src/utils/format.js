import dayjs from 'dayjs'

export const formatDateTime = (date, format = 'YYYY-MM-DD HH:mm:ss') => {
  if (!date) return '-'
  return dayjs(date).format(format)
}

export const formatDate = (date) => {
  return formatDateTime(date, 'YYYY-MM-DD')
}

export const formatTime = (date) => {
  return formatDateTime(date, 'HH:mm:ss')
}

export const formatRelativeTime = (date) => {
  if (!date) return '-'
  const now = dayjs()
  const diff = now.diff(dayjs(date), 'minute')
  if (diff < 1) return '刚刚'
  if (diff < 60) return `${diff}分钟前`
  const hours = Math.floor(diff / 60)
  if (hours < 24) return `${hours}小时前`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}天前`
  return formatDate(date)
}

export const formatStatusText = (status) => {
  const statusMap = {
    pending: '待揽收',
    picked: '已揽收',
    in_transit: '运输中',
    arrived: '已到达',
    out_for_delivery: '派送中',
    delivered: '已签收',
    pickup_ready: '待取件',
    pickup_done: '已取件',
    transferred: '已转驿站',
    anomaly: '异常',
    returned: '已退回',
    cancelled: '已取消',
    completed: '已完成',
    processing: '处理中',
    success: '成功',
    failed: '失败'
  }
  return statusMap[status] || status || '-'
}

export const formatStatusColor = (status) => {
  const colorMap = {
    pending: 'default',
    picked: 'processing',
    in_transit: 'processing',
    arrived: 'processing',
    out_for_delivery: 'processing',
    delivered: 'success',
    pickup_ready: 'warning',
    pickup_done: 'success',
    transferred: 'processing',
    anomaly: 'error',
    returned: 'error',
    cancelled: 'default',
    completed: 'success',
    processing: 'processing',
    success: 'success',
    failed: 'error'
  }
  return colorMap[status] || 'default'
}

export const formatAmount = (amount, currency = '¥') => {
  if (amount === undefined || amount === null) return '-'
  return `${currency}${Number(amount).toFixed(2)}`
}

export const formatWeight = (weight) => {
  if (!weight) return '-'
  if (weight < 1000) return `${weight}g`
  return `${(weight / 1000).toFixed(2)}kg`
}

export const formatVolume = (volume) => {
  if (!volume) return '-'
  return `${volume}m³`
}

export const formatHash = (hash, prefix = 8, suffix = 8) => {
  if (!hash) return '-'
  if (hash.length <= prefix + suffix) return hash
  return `${hash.slice(0, prefix)}...${hash.slice(-suffix)}`
}

export const formatPhone = (phone) => {
  if (!phone) return '-'
  const str = String(phone)
  if (str.length === 11) {
    return `${str.slice(0, 3)}****${str.slice(-4)}`
  }
  return str
}

export const formatIdCard = (idCard) => {
  if (!idCard) return '-'
  const str = String(idCard)
  if (str.length === 18) {
    return `${str.slice(0, 6)}********${str.slice(-4)}`
  }
  return str
}

export const formatTrackingNo = (trackingNo) => {
  if (!trackingNo) return '-'
  return String(trackingNo).toUpperCase()
}

export const formatFileSize = (bytes) => {
  if (!bytes) return '-'
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)}KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)}MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)}GB`
}

export const formatDuration = (minutes) => {
  if (!minutes) return '-'
  if (minutes < 60) return `${minutes}分钟`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours < 24) return mins > 0 ? `${hours}小时${mins}分钟` : `${hours}小时`
  const days = Math.floor(hours / 24)
  const remainHours = hours % 24
  return remainHours > 0 ? `${days}天${remainHours}小时` : `${days}天`
}

export const formatPoints = (points) => {
  if (points === undefined || points === null) return '-'
  return `${Number(points).toLocaleString()} 积分`
}

export const formatPercent = (value, total) => {
  if (!total) return '0%'
  return `${((value / total) * 100).toFixed(1)}%`
}

export const formatAddress = (address) => {
  if (!address) return '-'
  if (typeof address === 'string') return address
  const parts = [
    address.province,
    address.city,
    address.district,
    address.detail
  ].filter(Boolean)
  return parts.join('')
}

export const formatOperationType = (type) => {
  const typeMap = {
    create: '创建订单',
    pickup: '揽收',
    transit: '运输',
    arrive: '到达',
    delivery: '派送',
    sign: '签收',
    pickup_code: '生成取件码',
    verify: '身份验证',
    transfer: '转驿站',
    anomaly: '异常上报',
    resolve: '异常解决',
    return: '退回'
  }
  return typeMap[type] || type || '-'
}

export const formatAnomalyType = (type) => {
  const typeMap = {
    delay: '超时滞留',
    damage: '破损',
    lost: '丢失',
    address_error: '地址错误',
    recipient_unavailable: '收件人无法联系',
    refused: '拒收',
    other: '其他异常'
  }
  return typeMap[type] || type || '-'
}

export const formatRecyclingType = (type) => {
  const typeMap = {
    paper: '纸张',
    plastic: '塑料',
    metal: '金属',
    glass: '玻璃',
    electronics: '电子废弃物',
    clothing: '衣物',
    other: '其他'
  }
  return typeMap[type] || type || '-'
}

export const formatUserRole = (role) => {
  const roleMap = {
    user: '普通用户',
    courier: '快递员',
    station: '驿站管理员',
    admin: '系统管理员'
  }
  return roleMap[role] || role || '-'
}

export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    try {
      document.execCommand('copy')
      document.body.removeChild(textarea)
      return true
    } catch {
      document.body.removeChild(textarea)
      return false
    }
  }
}

export const debounce = (fn, delay = 300) => {
  let timer = null
  return function (...args) {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => fn.apply(this, args), delay)
  }
}

export const throttle = (fn, delay = 300) => {
  let last = 0
  return function (...args) {
    const now = Date.now()
    if (now - last >= delay) {
      last = now
      fn.apply(this, args)
    }
  }
}

export const generateRandomCode = (length = 6) => {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export const getDaysDiff = (date1, date2) => {
  if (!date1 || !date2) return 0
  return dayjs(date1).startOf('day').diff(dayjs(date2).startOf('day'), 'day')
}

export const isOverdue = (date, hours = 48) => {
  if (!date) return false
  const diff = dayjs().diff(dayjs(date), 'hour')
  return diff > hours
}

export const getAgeFromIdCard = (idCard) => {
  if (!idCard || idCard.length !== 18) return '-'
  const birthYear = parseInt(idCard.slice(6, 10), 10)
  const birthMonth = parseInt(idCard.slice(10, 12), 10)
  const birthDay = parseInt(idCard.slice(12, 14), 10)
  const now = dayjs()
  let age = now.year() - birthYear
  if (now.month() + 1 < birthMonth || (now.month() + 1 === birthMonth && now.date() < birthDay)) {
    age--
  }
  return age
}
