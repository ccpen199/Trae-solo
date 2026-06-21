export function desensitizePhone(phone: string): string {
  if (!phone || phone.length < 7) return phone
  return phone.slice(0, 3) + '****' + phone.slice(-4)
}

export function desensitizeIdCard(id: string): string {
  if (!id || id.length < 4) return id
  return id.slice(0, 3) + '*'.repeat(id.length - 4) + id.slice(-1)
}

const salaryUnitMap: Record<string, string> = {
  hourly: '元/时',
  daily: '元/天',
  monthly: '元/月',
}

export function formatSalary(
  min: number,
  max: number,
  type: 'hourly' | 'daily' | 'monthly'
): string {
  const unit = salaryUnitMap[type] || '元/月'
  return `${min}-${max} ${unit}`
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return ''
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function formatDateTime(dateStr: string): string {
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return ''
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${day} ${h}:${min}`
}

export function getTimeRemaining(deadline: string): {
  hours: number
  minutes: number
  expired: boolean
} {
  const now = Date.now()
  const end = new Date(deadline).getTime()
  const diff = end - now

  if (diff <= 0) {
    return { hours: 0, minutes: 0, expired: true }
  }

  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

  return { hours, minutes, expired: false }
}

const industryLabelMap: Record<string, string> = {
  restaurant: '餐饮',
  retail: '零售',
  housekeeping: '家政',
  logistics: '物流',
  security: '安保',
  other: '其他',
}

export function getIndustryLabel(industry: string): string {
  return industryLabelMap[industry] || industry
}

export function getMatchScoreColor(score: number): string {
  if (score >= 80) return 'text-success'
  if (score >= 60) return 'text-info'
  if (score >= 40) return 'text-accent'
  return 'text-danger'
}

const riskLevelColorMap: Record<string, string> = {
  none: 'text-success',
  low: 'text-info',
  medium: 'text-accent',
  high: 'text-danger',
}

export function getRiskLevelColor(level: string): string {
  return riskLevelColorMap[level] || 'text-gray-500'
}

const statusLabelMap: Record<string, string> = {
  pending: '待审核',
  approved: '已通过',
  rejected: '已拒绝',
  draft: '草稿',
  published: '已发布',
  offline: '已下线',
  applied: '已投递',
  viewed: '已查看',
  interviewing: '面试中',
  accepted: '已录用',
  expired: '已过期',
  completed: '已完成',
  cancelled: '已取消',
  pending_sign: '待签署',
  signed: '已签署',
  terminated: '已终止',
  not_filed: '未备案',
  filing: '备案中',
  filed: '已备案',
  failed: '备案失败',
  pending_ocr: '待OCR识别',
  ocr_done: 'OCR完成',
  scanning: '风险扫描中',
  risk_detected: '检测到风险',
  pending_review: '待人工审核',
  submitted: '已提交',
  mediating: '调解中',
  resolved: '已解决',
  escalated: '已升级',
  verified: '已认证',
}

export function getStatusLabel(status: string): string {
  return statusLabelMap[status] || status
}
