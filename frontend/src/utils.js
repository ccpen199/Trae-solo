import dayjs from 'dayjs'

export const formatDate = (date, format = 'YYYY-MM-DD HH:mm:ss') => {
  if (!date) return ''
  return dayjs(date).format(format)
}

export const formatRelativeTime = (date) => {
  if (!date) return ''
  const now = dayjs()
  const target = dayjs(date)
  const diffDays = now.diff(target, 'day')
  
  if (diffDays === 0) return '今天'
  if (diffDays === 1) return '昨天'
  if (diffDays < 7) return `${diffDays}天前`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}周前`
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}个月前`
  return `${Math.floor(diffDays / 365)}年前`
}

export const formatDuration = (minutes) => {
  if (!minutes) return '0分钟'
  if (minutes < 60) return `${minutes}分钟`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hours}小时${mins}分钟` : `${hours}小时`
}

export const debounce = (fn, delay = 300) => {
  let timer = null
  return function (...args) {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => fn.apply(this, args), delay)
  }
}

export const throttle = (fn, delay = 300) => {
  let lastTime = 0
  return function (...args) {
    const now = Date.now()
    if (now - lastTime >= delay) {
      fn.apply(this, args)
      lastTime = now
    }
  }
}

export const generateId = () => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

export const safeGet = (obj, path, defaultValue = undefined) => {
  const keys = path.split('.')
  let result = obj
  for (const key of keys) {
    if (result == null) return defaultValue
    result = result[key]
  }
  return result ?? defaultValue
}

export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    const textArea = document.createElement('textarea')
    textArea.value = text
    textArea.style.position = 'fixed'
    textArea.style.opacity = '0'
    document.body.appendChild(textArea)
    textArea.select()
    document.execCommand('copy')
    document.body.removeChild(textArea)
    return true
  }
}

export const getRandomColor = () => {
  const colors = ['#f56a00', '#7265e6', '#ffbf00', '#00a2ae', '#52c41a', '#1890ff', '#eb2f96']
  return colors[Math.floor(Math.random() * colors.length)]
}

export const getFirstLetter = (str) => {
  if (!str) return '#'
  return str.charAt(0).toUpperCase()
}
