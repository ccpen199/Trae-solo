import { clsx, type ClassValue } from 'clsx'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function formatCurrency(amount: number, currency = 'CNY'): string {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount)
}

export function formatDate(date: string | Date, fmt = 'yyyy-MM-dd'): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const pad = (n: number) => n.toString().padStart(2, '0')
  const map: Record<string, string> = {
    yyyy: d.getFullYear().toString(),
    MM: pad(d.getMonth() + 1),
    dd: pad(d.getDate()),
    HH: pad(d.getHours()),
    mm: pad(d.getMinutes()),
    ss: pad(d.getSeconds()),
  }
  return fmt.replace(/yyyy|MM|dd|HH|mm|ss/g, (m) => map[m])
}

export function formatDateTime(date: string | Date): string {
  return formatDate(date, 'yyyy-MM-dd HH:mm')
}

export function formatWeight(kg: number): string {
  if (kg >= 1000) return `${(kg / 1000).toFixed(2)} 吨`
  return `${kg.toFixed(0)} kg`
}

export function formatDistance(km: number): string {
  return `${km.toFixed(1)} km`
}

export function getRandomId(prefix = ''): string {
  return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
}

export function statusColor(status: string): string {
  const map: Record<string, string> = {
    pending: 'bg-yellow-500/15 text-yellow-400',
    published: 'bg-blue-500/15 text-blue-400',
    matched: 'bg-cyan-500/15 text-cyan-400',
    in_transit: 'bg-indigo-500/15 text-indigo-400',
    delivered: 'bg-green-500/15 text-green-400',
    completed: 'bg-emerald-500/15 text-emerald-400',
    cancelled: 'bg-red-500/15 text-red-400',
    exception: 'bg-orange-500/15 text-orange-400',
    approved: 'bg-green-500/15 text-green-400',
    rejected: 'bg-red-500/15 text-red-400',
    manual_review: 'bg-amber-500/15 text-amber-400',
    ocr_verifying: 'bg-blue-500/15 text-blue-400',
    online: 'bg-green-500/15 text-green-400',
    offline: 'bg-gray-500/15 text-gray-400',
    abnormal: 'bg-red-500/15 text-red-400',
    idle: 'bg-slate-500/15 text-slate-400',
    loading: 'bg-cyan-500/15 text-cyan-400',
    unloading: 'bg-purple-500/15 text-purple-400',
    maintenance: 'bg-orange-500/15 text-orange-400',
    low: 'bg-green-500/15 text-green-400',
    medium: 'bg-yellow-500/15 text-yellow-400',
    high: 'bg-red-500/15 text-red-400',
    draft: 'bg-gray-500/15 text-gray-400',
    pending_sign: 'bg-amber-500/15 text-amber-400',
    signed: 'bg-green-500/15 text-green-400',
    expired: 'bg-gray-500/15 text-gray-400',
    terminated: 'bg-red-500/15 text-red-400',
    created: 'bg-blue-500/15 text-blue-400',
    confirmed: 'bg-cyan-500/15 text-cyan-400',
    invoiced: 'bg-purple-500/15 text-purple-400',
    paid: 'bg-green-500/15 text-green-400',
    disputed: 'bg-red-500/15 text-red-400',
    submitted: 'bg-blue-500/15 text-blue-400',
    under_review: 'bg-amber-500/15 text-amber-400',
    evidence_required: 'bg-yellow-500/15 text-yellow-400',
    arbitrated: 'bg-cyan-500/15 text-cyan-400',
    closed: 'bg-gray-500/15 text-gray-400',
    pending_confirmation: 'bg-amber-500/15 text-amber-400',
    reconciled: 'bg-green-500/15 text-green-400',
  }
  return map[status] || 'bg-gray-500/15 text-gray-400'
}

export function creditRatingColor(rating: string): string {
  const map: Record<string, string> = {
    AAA: 'text-emerald-400',
    AA: 'text-green-400',
    A: 'text-cyan-400',
    BBB: 'text-blue-400',
    BB: 'text-amber-400',
    B: 'text-yellow-400',
    CCC: 'text-orange-400',
    D: 'text-red-400',
  }
  return map[rating] || 'text-gray-400'
}
