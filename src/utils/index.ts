import dayjs from 'dayjs'
import numeral from 'numeral'
import type {
  ApplicationStatus,
  TicketStatus,
  TicketPriority,
  TicketType,
  ServiceCategory,
  MonitorStatus,
  EvaluationSource,
  UserRole,
  Gender,
  ReportType,
  VenueType,
  PageResult
} from '@/types'

export function formatDate(
  date: string | Date | number | undefined | null,
  format: string = 'YYYY-MM-DD HH:mm:ss'
): string {
  if (!date) return '-'
  return dayjs(date).format(format)
}

export function formatDateShort(date: string | Date | number | undefined | null): string {
  return formatDate(date, 'YYYY-MM-DD')
}

export function formatTime(date: string | Date | number | undefined | null): string {
  return formatDate(date, 'HH:mm:ss')
}

export function formatRelativeTime(date: string | Date | number | undefined | null): string {
  if (!date) return '-'
  const now = dayjs()
  const target = dayjs(date)
  const diffSeconds = now.diff(target, 'second')
  const diffMinutes = now.diff(target, 'minute')
  const diffHours = now.diff(target, 'hour')
  const diffDays = now.diff(target, 'day')

  if (diffSeconds < 60) return '刚刚'
  if (diffMinutes < 60) return `${diffMinutes}分钟前`
  if (diffHours < 24) return `${diffHours}小时前`
  if (diffDays < 7) return `${diffDays}天前`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}周前`
  return formatDateShort(date)
}

export function formatAmount(amount: number | string | undefined | null, decimals: number = 2): string {
  if (amount === undefined || amount === null || amount === '') return '-'
  return numeral(Number(amount)).format(`0,0.${'0'.repeat(decimals)}`)
}

export function formatCurrency(amount: number | string | undefined | null, symbol: string = '¥'): string {
  if (amount === undefined || amount === null || amount === '') return '-'
  return `${symbol}${formatAmount(amount)}`
}

export function formatPercent(value: number | string | undefined | null, decimals: number = 2): string {
  if (value === undefined || value === null || value === '') return '-'
  return `${numeral(Number(value)).format(`0.${'0'.repeat(decimals)}`)}%`
}

export function maskIdCard(idCard: string | undefined | null): string {
  if (!idCard || idCard.length < 8) return idCard || '-'
  const start = idCard.slice(0, 6)
  const end = idCard.slice(-4)
  const middle = '*'.repeat(idCard.length - 10)
  return `${start}${middle}${end}`
}

export function maskPhone(phone: string | undefined | null): string {
  if (!phone || phone.length < 7) return phone || '-'
  const start = phone.slice(0, 3)
  const end = phone.slice(-4)
  return `${start}****${end}`
}

export function maskEmail(email: string | undefined | null): string {
  if (!email || !email.includes('@')) return email || '-'
  const [username, domain] = email.split('@')
  if (username.length <= 2) return `${username[0]}*@${domain}`
  return `${username.slice(0, 2)}${'*'.repeat(username.length - 2)}@${domain}`
}

export function maskName(name: string | undefined | null): string {
  if (!name) return '-'
  if (name.length === 1) return name
  if (name.length === 2) return `${name[0]}*`
  return `${name[0]}${'*'.repeat(name.length - 2)}${name[name.length - 1]}`
}

export const applicationStatusMap: Record<ApplicationStatus, { label: string; color: string }> = {
  draft: { label: '草稿', color: '#909399' },
  submitted: { label: '已提交', color: '#409EFF' },
  accepted: { label: '已受理', color: '#E6A23C' },
  reviewing: { label: '审核中', color: '#409EFF' },
  supplement: { label: '待补件', color: '#F56C6C' },
  approved: { label: '已通过', color: '#67C23A' },
  rejected: { label: '已驳回', color: '#F56C6C' },
  completed: { label: '已完成', color: '#67C23A' },
  cancelled: { label: '已取消', color: '#909399' }
}

export const ticketStatusMap: Record<TicketStatus, { label: string; color: string }> = {
  pending: { label: '待分配', color: '#909399' },
  assigned: { label: '已分配', color: '#409EFF' },
  accepted: { label: '已受理', color: '#67C23A' },
  processing: { label: '处理中', color: '#E6A23C' },
  replied: { label: '已回复', color: '#409EFF' },
  evaluating: { label: '待评价', color: '#9B59B6' },
  rectifying: { label: '整改中', color: '#E74C3C' },
  reviewing: { label: '复查中', color: '#E67E22' },
  completed: { label: '已完成', color: '#67C23A' },
  closed: { label: '已关闭', color: '#909399' },
  archived: { label: '已归档', color: '#7F8C8D' }
}

export const ticketPriorityMap: Record<TicketPriority, { label: string; color: string }> = {
  low: { label: '低', color: '#909399' },
  medium: { label: '中', color: '#409EFF' },
  high: { label: '高', color: '#E6A23C' },
  urgent: { label: '紧急', color: '#F56C6C' }
}

export const ticketTypeMap: Record<TicketType, { label: string; color: string }> = {
  complaint: { label: '投诉', color: '#F56C6C' },
  suggestion: { label: '建议', color: '#409EFF' },
  consultation: { label: '咨询', color: '#E6A23C' },
  help: { label: '求助', color: '#9B59B6' },
  praise: { label: '表扬', color: '#67C23A' }
}

export const serviceCategoryMap: Record<ServiceCategory, { label: string; color: string; icon: string }> = {
  social_security: { label: '社会保障', color: '#1E5AA8', icon: 'Shield' },
  medical_insurance: { label: '医疗保险', color: '#2ECC71', icon: 'Heart' },
  education: { label: '教育服务', color: '#9B59B6', icon: 'GraduationCap' },
  housing_fund: { label: '住房公积金', color: '#F39C12', icon: 'Home' },
  traffic: { label: '交通运输', color: '#3498DB', icon: 'Car' },
  culture_tourism: { label: '文化旅游', color: '#E74C3C', icon: 'MapPin' },
  civil_affairs: { label: '民政服务', color: '#1ABC9C', icon: 'Users' },
  taxation: { label: '税务服务', color: '#E67E22', icon: 'Receipt' },
  industry_commerce: { label: '市场监管', color: '#34495E', icon: 'Building2' },
  public_security: { label: '公安服务', color: '#2C3E50', icon: 'ShieldCheck' },
  justice: { label: '司法服务', color: '#8E44AD', icon: 'Scale' },
  health: { label: '卫生健康', color: '#E91E63', icon: 'Stethoscope' }
}

export const monitorStatusMap: Record<MonitorStatus, { label: string; color: string }> = {
  healthy: { label: '正常', color: '#67C23A' },
  warning: { label: '警告', color: '#E6A23C' },
  critical: { label: '严重', color: '#F56C6C' },
  offline: { label: '离线', color: '#909399' }
}

export const evaluationSourceMap: Record<EvaluationSource, { label: string; color: string }> = {
  application: { label: '办件评价', color: '#409EFF' },
  ticket: { label: '诉求评价', color: '#E6A23C' },
  venue: { label: '场馆评价', color: '#67C23A' },
  general: { label: '通用评价', color: '#909399' }
}

export const userRoleMap: Record<UserRole, { label: string; color: string }> = {
  citizen: { label: '市民用户', color: '#409EFF' },
  enterprise: { label: '企业法人', color: '#67C23A' },
  department_staff: { label: '部门经办', color: '#06B6D4' },
  department_admin: { label: '委办局管理员', color: '#E6A23C' },
  platform_operate: { label: '运营管理员', color: '#F97316' },
  platform_admin: { label: '平台管理员', color: '#F56C6C' }
}

export const genderMap: Record<Gender, { label: string; color: string }> = {
  male: { label: '男', color: '#409EFF' },
  female: { label: '女', color: '#E91E63' },
  other: { label: '其他', color: '#909399' }
}

export const reportTypeMap: Record<ReportType, { label: string; color: string }> = {
  daily: { label: '日报', color: '#409EFF' },
  weekly: { label: '周报', color: '#67C23A' },
  monthly: { label: '月报', color: '#E6A23C' },
  quarterly: { label: '季报', color: '#9B59B6' },
  yearly: { label: '年报', color: '#F56C6C' }
}

export const venueTypeMap: Record<VenueType, { label: string; color: string; icon: string }> = {
  library: { label: '图书馆', color: '#1E5AA8', icon: 'BookOpen' },
  museum: { label: '博物馆', color: '#8B4513', icon: 'Landmark' },
  gymnasium: { label: '体育馆', color: '#E74C3C', icon: 'Dumbbell' },
  park: { label: '公园', color: '#2ECC71', icon: 'Trees' },
  community_center: { label: '社区中心', color: '#9B59B6', icon: 'Home' },
  cultural_center: { label: '文化中心', color: '#F39C12', icon: 'Theater' },
  government_hall: { label: '政务大厅', color: '#34495E', icon: 'Building' }
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number = 300
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | null = null
  return function (this: unknown, ...args: Parameters<T>) {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      fn.apply(this, args)
      timer = null
    }, delay)
  }
}

export function throttle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number = 300
): (...args: Parameters<T>) => void {
  let lastTime = 0
  return function (this: unknown, ...args: Parameters<T>) {
    const now = Date.now()
    if (now - lastTime >= delay) {
      fn.apply(this, args)
      lastTime = now
    }
  }
}

export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj
  if (obj instanceof Date) return new Date(obj.getTime()) as T
  if (obj instanceof Array) return obj.map(item => deepClone(item)) as T
  if (typeof obj === 'object') {
    const cloned = {} as T
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        cloned[key] = deepClone(obj[key])
      }
    }
    return cloned
  }
  return obj
}

export function generateId(prefix: string = ''): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).slice(2, 10)
  return `${prefix}${timestamp}${random}`
}

export function generateNo(prefix: string = ''): string {
  const date = dayjs().format('YYYYMMDDHHmmss')
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0')
  return `${prefix}${date}${random}`
}

export function copyToClipboard(text: string): Promise<boolean> {
  return new Promise(resolve => {
    if (navigator.clipboard) {
      navigator.clipboard
        .writeText(text)
        .then(() => resolve(true))
        .catch(() => resolve(false))
    } else {
      const textarea = document.createElement('textarea')
      textarea.value = text
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      try {
        document.execCommand('copy')
        resolve(true)
      } catch {
        resolve(false)
      } finally {
        document.body.removeChild(textarea)
      }
    }
  })
}

export function downloadFile(url: string, filename: string): void {
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.target = '_blank'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export function validateIdCard(idCard: string): boolean {
  if (!/^[1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/.test(idCard)) {
    return false
  }
  const factors = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2]
  const checkCodes = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2']
  let sum = 0
  for (let i = 0; i < 17; i++) {
    sum += parseInt(idCard.charAt(i)) * factors[i]
  }
  const checkCode = checkCodes[sum % 11]
  return idCard.charAt(17).toUpperCase() === checkCode
}

export function validatePhone(phone: string): boolean {
  return /^1[3-9]\d{9}$/.test(phone)
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function getFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
}

export function getFileExtension(filename: string): string {
  const dotIndex = filename.lastIndexOf('.')
  return dotIndex === -1 ? '' : filename.slice(dotIndex + 1).toLowerCase()
}

export function groupBy<T, K extends keyof T>(array: T[], key: K): Record<string, T[]> {
  return array.reduce((groups, item) => {
    const groupKey = String(item[key])
    if (!groups[groupKey]) {
      groups[groupKey] = []
    }
    groups[groupKey].push(item)
    return groups
  }, {} as Record<string, T[]>)
}

export function paginate<T>(array: T[], page: number, pageSize: number): PageResult<T> {
  const start = (page - 1) * pageSize
  const total = array.length
  const totalPages = Math.ceil(total / pageSize)
  return {
    list: array.slice(start, start + pageSize),
    total,
    page,
    pageSize,
    totalPages
  }
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
