import dayjs from 'dayjs'

export const formatTime = (date: Date | string, format: string = 'YYYY-MM-DD HH:mm') => {
  return dayjs(date).format(format)
}

export const formatDuration = (minutes: number) => {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours > 0) {
    return `${hours}小时${mins}分钟`
  }
  return `${mins}分钟`
}

export const formatDistance = (meters: number) => {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)}km`
  }
  return `${Math.round(meters)}m`
}

export const formatMoney = (amount: number) => {
  return `¥${amount.toFixed(2)}`
}
