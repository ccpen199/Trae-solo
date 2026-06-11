import type { LegalCaseType, ConsultationStatus, LawyerStatus } from '@/types'

export function formatTimestamp(timestamp: number, format: string = 'YYYY-MM-DD HH:mm:ss'): string {
  const date = new Date(timestamp)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')

  return format
    .replace('YYYY', String(year))
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds)
}

export function formatRelativeTime(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp

  if (diff < 60 * 1000) {
    return '刚刚'
  }
  if (diff < 60 * 60 * 1000) {
    return `${Math.floor(diff / (60 * 1000))}分钟前`
  }
  if (diff < 24 * 60 * 60 * 1000) {
    return `${Math.floor(diff / (60 * 60 * 1000))}小时前`
  }
  if (diff < 7 * 24 * 60 * 60 * 1000) {
    return `${Math.floor(diff / (24 * 60 * 60 * 1000))}天前`
  }
  return formatTimestamp(timestamp, 'YYYY-MM-DD')
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export const caseTypeMap: Record<LegalCaseType, string> = {
  marriage: '婚姻家庭',
  labor: '劳动争议',
  debt: '债务纠纷',
  property: '房产纠纷',
  contract: '合同纠纷',
  traffic: '交通事故',
  criminal: '刑事辩护',
  other: '其他'
}

export function formatCaseType(caseType: LegalCaseType): string {
  return caseTypeMap[caseType] || '其他'
}

export const consultationStatusMap: Record<ConsultationStatus, string> = {
  pending: '待分派',
  dispatched: '已指派',
  in_progress: '进行中',
  completed: '已结案',
  cancelled: '已取消'
}

export function formatConsultationStatus(status: ConsultationStatus): string {
  return consultationStatusMap[status] || '未知'
}

export const lawyerStatusMap: Record<LawyerStatus, string> = {
  active: '正常执业',
  inactive: '离线',
  frozen: '已冻结',
  pending_review: '待审核'
}

export function formatLawyerStatus(status: LawyerStatus): string {
  return lawyerStatusMap[status] || '未知'
}

export function formatDate(timestamp: number): string {
  return formatTimestamp(timestamp, 'YYYY-MM-DD')
}

export function formatTime(timestamp: number): string {
  return formatTimestamp(timestamp, 'HH:mm')
}

export function formatDateTime(timestamp: number): string {
  return formatTimestamp(timestamp, 'YYYY-MM-DD HH:mm')
}

export function formatResponseTime(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}秒`
  }
  if (seconds < 3600) {
    return `${Math.floor(seconds / 60)}分钟`
  }
  if (seconds < 86400) {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return minutes > 0 ? `${hours}小时${minutes}分钟` : `${hours}小时`
  }
  const days = Math.floor(seconds / 86400)
  return `${days}天`
}
