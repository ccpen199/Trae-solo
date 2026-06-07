export const DEFAULT_LAT = 39.9042
export const DEFAULT_LNG = 116.4074

export function getUserLocation(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({ lat: DEFAULT_LAT, lng: DEFAULT_LNG })
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve({ lat: DEFAULT_LAT, lng: DEFAULT_LNG }),
      { timeout: 5000 },
    )
  })
}

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)}m`
  if (km < 100) return `${km.toFixed(1)}km`
  return `${Math.round(km)}km`
}

export function formatTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}小时前`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}天前`
  return date.toLocaleDateString('zh-CN')
}

export function formatNumber(num: number): string {
  if (num >= 10000) return `${(num / 10000).toFixed(1)}万`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}k`
  return String(num)
}

export function getCredibilityLabel(score: number): { text: string; color: string } {
  if (score >= 0.8) return { text: '高可信', color: 'text-green-600 bg-green-50' }
  if (score >= 0.5) return { text: '一般', color: 'text-yellow-600 bg-yellow-50' }
  return { text: '低可信', color: 'text-red-600 bg-red-50' }
}

export function getLevelStars(level: number): string {
  return '★'.repeat(Math.min(level, 10)) + '☆'.repeat(Math.max(0, 10 - level))
}
