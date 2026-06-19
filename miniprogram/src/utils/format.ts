export const formatMoney = (amount: number, decimals: number = 2): string => {
  if (isNaN(amount) || amount === null || amount === undefined) return '0.00'
  return amount.toFixed(decimals)
}

export const formatMoneyWithSymbol = (amount: number, decimals: number = 2): string => {
  return `¥${formatMoney(amount, decimals)}`
}

export const formatVolume = (volume: number, decimals: number = 2): string => {
  if (isNaN(volume) || volume === null || volume === undefined) return '0.00'
  return volume.toFixed(decimals)
}

export const formatVolumeWithUnit = (volume: number, decimals: number = 2): string => {
  return `${formatVolume(volume, decimals)}L`
}

export const formatTemperature = (temp: number, decimals: number = 1): string => {
  if (isNaN(temp) || temp === null || temp === undefined) return '--'
  return `${temp.toFixed(decimals)}°C`
}

export const padZero = (num: number): string => {
  return num < 10 ? `0${num}` : `${num}`
}

export const formatTime = (date: Date | string | number): string => {
  const d = new Date(date)
  return `${padZero(d.getHours())}:${padZero(d.getMinutes())}`
}

export const formatDate = (date: Date | string | number): string => {
  const d = new Date(date)
  return `${d.getFullYear()}-${padZero(d.getMonth() + 1)}-${padZero(d.getDate())}`
}

export const formatDateTime = (date: Date | string | number): string => {
  return `${formatDate(date)} ${formatTime(date)}`
}

export const formatDateTimeFriendly = (date: Date | string | number): string => {
  const d = new Date(date)
  const now = new Date()
  const diff = now.getTime() - d.getTime()

  const oneMinute = 60 * 1000
  const oneHour = 60 * oneMinute
  const oneDay = 24 * oneHour

  if (diff < oneMinute) {
    return '刚刚'
  } else if (diff < oneHour) {
    return `${Math.floor(diff / oneMinute)}分钟前`
  } else if (diff < oneDay) {
    return `${Math.floor(diff / oneHour)}小时前`
  } else if (diff < 7 * oneDay) {
    return `${Math.floor(diff / oneDay)}天前`
  } else {
    return formatDate(date)
  }
}

export const formatDuration = (seconds: number): string => {
  if (!seconds || seconds < 0) return '0秒'
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  if (mins === 0) return `${secs}秒`
  if (mins < 60) return `${mins}分${secs}秒`
  const hours = Math.floor(mins / 60)
  const remainMins = mins % 60
  return `${hours}时${remainMins}分${secs}秒`
}

export const formatDurationShort = (seconds: number): string => {
  if (!seconds || seconds < 0) return '00:00'
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  if (mins < 60) {
    return `${padZero(mins)}:${padZero(secs)}`
  }
  const hours = Math.floor(mins / 60)
  const remainMins = mins % 60
  return `${padZero(hours)}:${padZero(remainMins)}:${padZero(secs)}`
}

export const getMonthOptions = (): { label: string; value: string }[] => {
  const options: { label: string; value: string }[] = []
  const now = new Date()
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    options.push({
      label: `${d.getFullYear()}年${padZero(d.getMonth() + 1)}月`,
      value: `${d.getFullYear()}-${padZero(d.getMonth() + 1)}`
    })
  }
  return options
}

export const getTemperatureName = (type: 'cold' | 'warm' | 'hot'): string => {
  const map = {
    cold: '冷水',
    warm: '温水',
    hot: '热水'
  }
  return map[type]
}

export const getTemperatureColor = (type: 'cold' | 'warm' | 'hot'): string => {
  const map = {
    cold: '#1890ff',
    warm: '#13c2c2',
    hot: '#fa541c'
  }
  return map[type]
}
