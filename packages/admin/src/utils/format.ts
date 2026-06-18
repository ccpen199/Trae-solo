import dayjs from 'dayjs'

export function formatDateTime(date?: string | Date | number, format: string = 'YYYY-MM-DD HH:mm:ss'): string {
  if (!date) return '-'
  return dayjs(date).format(format)
}

export function formatDate(date?: string | Date | number, format: string = 'YYYY-MM-DD'): string {
  if (!date) return '-'
  return dayjs(date).format(format)
}

export function formatNumber(num?: number, decimals: number = 2): string {
  if (num === undefined || num === null) return '-'
  return num.toLocaleString('zh-CN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })
}

export function formatMoney(amount?: number): string {
  if (amount === undefined || amount === null) return '-'
  return `¥${formatNumber(amount)}`
}

export function formatDuration(seconds?: number): string {
  if (!seconds) return '-'
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  if (hours > 0) {
    return `${hours}小时${minutes}分钟`
  }
  if (minutes > 0) {
    return `${minutes}分钟${secs}秒`
  }
  return `${secs}秒`
}

export function formatEnergy(energy?: number): string {
  if (energy === undefined || energy === null) return '-'
  return `${formatNumber(energy)} kWh`
}
