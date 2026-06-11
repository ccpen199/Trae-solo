export function formatPrice(price: number): string {
  return `¥${price.toFixed(2)}`
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return `${date.getMonth() + 1}月${date.getDate()}日`
}

export function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr)
  return `${date.getMonth() + 1}月${date.getDate()}日 ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

export function getTimeRemaining(deadline: string): string {
  const now = new Date()
  const end = new Date(deadline)
  const diff = end.getTime() - now.getTime()
  if (diff <= 0) return '已截止'
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  if (days > 0) return `剩余${days}天${hours}小时`
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  return `剩余${hours}小时${minutes}分钟`
}

export function getCommissionMultiplier(completedTasks: number): number {
  if (completedTasks >= 10) return 1.15
  if (completedTasks >= 5) return 1.08
  return 1.0
}

export function getCommissionLevelLabel(level: number): string {
  const labels = ['新手接单者', '初级接单者', '中级接单者', '高级接单者', '金牌接单者']
  return labels[Math.min(level, labels.length - 1)]
}

export function getAcceptanceDeadline(submittedAt: string, acceptancePeriod: string): string {
  const submitted = new Date(submittedAt).getTime()
  let hours = 24
  if (acceptancePeriod === '72h') hours = 72
  else if (acceptancePeriod === '7d') hours = 24 * 7
  return new Date(submitted + hours * 60 * 60 * 1000).toISOString()
}

export function getAcceptanceTimeRemaining(deadline: string): { total: number; days: number; hours: number; minutes: number; text: string; percent: number } {
  const now = new Date().getTime()
  const end = new Date(deadline).getTime()
  const diff = end - now
  if (diff <= 0) {
    return { total: 0, days: 0, hours: 0, minutes: 0, text: '已超时', percent: 0 }
  }
  const totalHours = diff / (1000 * 60 * 60)
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  let text = ''
  if (days > 0) text = `${days}天${hours}小时`
  else if (hours > 0) text = `${hours}小时${minutes}分`
  else text = `${minutes}分钟`
  const totalAcceptanceHours = totalHours + (1 - (totalHours % 1 || 1))
  const percent = Math.min(100, Math.max(0, (diff / (totalAcceptanceHours * 60 * 60 * 1000)) * 100))
  return { total: diff, days, hours, minutes, text, percent }
}

export function getAcceptanceDisplayText(deadline: string): string {
  const { days, hours, minutes, text } = getAcceptanceTimeRemaining(deadline)
  if (days > 0) return `${days}天`
  if (hours > 0) return `${hours}h`
  return `${minutes}m`
}
