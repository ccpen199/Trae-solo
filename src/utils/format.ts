import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.locale('zh-cn')
dayjs.extend(relativeTime)

export const formatDate = (date: string | number | Date | null | undefined, format: string = 'YYYY-MM-DD'): string => {
  if (!date) return '-'
  return dayjs(date).format(format)
}

export const formatDateTime = (date: string | number | Date | null | undefined, format: string = 'YYYY-MM-DD HH:mm:ss'): string => {
  if (!date) return '-'
  return dayjs(date).format(format)
}

export const formatTime = (date: string | number | Date | null | undefined, format: string = 'HH:mm:ss'): string => {
  if (!date) return '-'
  return dayjs(date).format(format)
}

export const formatMonth = (date: string | number | Date | null | undefined, format: string = 'YYYY-MM'): string => {
  if (!date) return '-'
  return dayjs(date).format(format)
}

export const formatRelativeTime = (date: string | number | Date | null | undefined): string => {
  if (!date) return '-'
  return dayjs(date).fromNow()
}

export const formatDuration = (seconds: number): string => {
  if (!seconds || seconds < 0) return '0秒'
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  
  const parts: string[] = []
  if (days > 0) parts.push(`${days}天`)
  if (hours > 0 || days > 0) parts.push(`${hours}小时`)
  if (minutes > 0 || hours > 0 || days > 0) parts.push(`${minutes}分钟`)
  if (secs > 0 || parts.length === 0) parts.push(`${secs}秒`)
  
  return parts.join('')
}

export const formatDurationShort = (seconds: number): string => {
  if (!seconds || seconds < 0) return '00:00:00'
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

export const formatNumber = (num: number | string | null | undefined, decimals: number = 0): string => {
  if (num === null || num === undefined || num === '') return '-'
  const n = Number(num)
  if (isNaN(n)) return '-'
  return n.toLocaleString('zh-CN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })
}

export const formatCurrency = (amount: number | string | null | undefined, currency: string = 'CNY', decimals: number = 2): string => {
  if (amount === null || amount === undefined || amount === '') return '-'
  const n = Number(amount)
  if (isNaN(n)) return '-'
  return n.toLocaleString('zh-CN', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })
}

export const formatPercent = (value: number | string | null | undefined, decimals: number = 2): string => {
  if (value === null || value === undefined || value === '') return '-'
  const n = Number(value)
  if (isNaN(n)) return '-'
  return (n * 100).toLocaleString('zh-CN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }) + '%'
}

export const formatThousands = (num: number | string | null | undefined): string => {
  if (num === null || num === undefined || num === '') return '-'
  const n = Number(num)
  if (isNaN(n)) return '-'
  if (n >= 10000) {
    return (n / 10000).toFixed(1) + '万'
  }
  if (n >= 1000) {
    return (n / 1000).toFixed(1) + '千'
  }
  return n.toString()
}

export const formatFileSize = (bytes: number | string | null | undefined): string => {
  if (bytes === null || bytes === undefined || bytes === '') return '-'
  const b = Number(bytes)
  if (isNaN(b) || b < 0) return '-'
  if (b === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']
  const i = Math.floor(Math.log(b) / Math.log(1024))
  return (b / Math.pow(1024, i)).toFixed(2) + ' ' + units[i]
}

export const formatDistance = (meters: number | string | null | undefined): string => {
  if (meters === null || meters === undefined || meters === '') return '-'
  const m = Number(meters)
  if (isNaN(m) || m < 0) return '-'
  if (m < 1000) {
    return `${m.toFixed(0)} 米`
  }
  return `${(m / 1000).toFixed(2)} 公里`
}

export const formatAge = (birthday: string | number | Date | null | undefined): string => {
  if (!birthday) return '-'
  const birthDate = dayjs(birthday)
  const now = dayjs()
  const age = now.diff(birthDate, 'year')
  if (age < 0) return '-'
  return `${age}岁`
}

export const formatWorkYears = (startDate: string | number | Date | null | undefined): string => {
  if (!startDate) return '-'
  const start = dayjs(startDate)
  const now = dayjs()
  const years = now.diff(start, 'year', true)
  return `${years.toFixed(1)}年`
}

export const padZero = (num: number, length: number = 2): string => {
  return String(num).padStart(length, '0')
}

export const formatRange = (start: string | number | Date | null | undefined, end: string | number | Date | null | undefined, format: string = 'YYYY-MM-DD'): string => {
  if (!start && !end) return '-'
  if (start && end) {
    return `${formatDate(start, format)} ~ ${formatDate(end, format)}`
  }
  if (start) {
    return `${formatDate(start, format)} ~ 至今`
  }
  return `~ ${formatDate(end, format)}`
}

export default {
  formatDate,
  formatDateTime,
  formatTime,
  formatMonth,
  formatRelativeTime,
  formatDuration,
  formatDurationShort,
  formatNumber,
  formatCurrency,
  formatPercent,
  formatThousands,
  formatFileSize,
  formatDistance,
  formatAge,
  formatWorkYears,
  padZero,
  formatRange
}
