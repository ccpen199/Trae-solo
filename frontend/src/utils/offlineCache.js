const CACHE_PREFIX = 'ir_remote_cache_'
const CACHE_TTL = 24 * 60 * 60 * 1000

export const setCache = (key, data, ttl = CACHE_TTL) => {
  try {
    const cacheKey = CACHE_PREFIX + key
    const cacheEntry = {
      data,
      timestamp: Date.now(),
      ttl
    }
    localStorage.setItem(cacheKey, JSON.stringify(cacheEntry))
    cleanupExpiredCache()
  } catch (error) {
    console.warn('Cache storage failed:', error)
  }
}

export const getCache = (key) => {
  try {
    const cacheKey = CACHE_PREFIX + key
    const cached = localStorage.getItem(cacheKey)
    if (!cached) return null

    const cacheEntry = JSON.parse(cached)
    if (Date.now() - cacheEntry.timestamp > cacheEntry.ttl) {
      localStorage.removeItem(cacheKey)
      return null
    }
    return cacheEntry.data
  } catch (error) {
    console.warn('Cache retrieval failed:', error)
    return null
  }
}

export const removeCache = (key) => {
  try {
    const cacheKey = CACHE_PREFIX + key
    localStorage.removeItem(cacheKey)
  } catch (error) {
    console.warn('Cache removal failed:', error)
  }
}

export const clearCache = () => {
  try {
    const keys = Object.keys(localStorage)
    keys.forEach(key => {
      if (key.startsWith(CACHE_PREFIX)) {
        localStorage.removeItem(key)
      }
    })
  } catch (error) {
    console.warn('Cache clear failed:', error)
  }
}

export const cleanupExpiredCache = () => {
  try {
    const keys = Object.keys(localStorage)
    const now = Date.now()
    keys.forEach(key => {
      if (key.startsWith(CACHE_PREFIX)) {
        try {
          const cached = localStorage.getItem(key)
          if (cached) {
            const cacheEntry = JSON.parse(cached)
            if (now - cacheEntry.timestamp > cacheEntry.ttl) {
              localStorage.removeItem(key)
            }
          }
        } catch (e) {
          localStorage.removeItem(key)
        }
      }
    })
  } catch (error) {
    console.warn('Cache cleanup failed:', error)
  }
}

export const getCacheStats = () => {
  try {
    const keys = Object.keys(localStorage)
    const cacheKeys = keys.filter(key => key.startsWith(CACHE_PREFIX))
    let totalSize = 0
    let expiredCount = 0
    const now = Date.now()

    cacheKeys.forEach(key => {
      const cached = localStorage.getItem(key)
      totalSize += (cached?.length || 0) * 2
      try {
        const cacheEntry = JSON.parse(cached)
        if (now - cacheEntry.timestamp > cacheEntry.ttl) {
          expiredCount++
        }
      } catch (e) {
        expiredCount++
      }
    })

    return {
      totalItems: cacheKeys.length,
      expiredItems: expiredCount,
      totalSizeBytes: totalSize,
      totalSizeKB: (totalSize / 1024).toFixed(2),
      totalSizeMB: (totalSize / 1024 / 1024).toFixed(2)
    }
  } catch (error) {
    console.warn('Cache stats failed:', error)
    return {
      totalItems: 0,
      expiredItems: 0,
      totalSizeBytes: 0,
      totalSizeKB: '0',
      totalSizeMB: '0'
    }
  }
}

export const setIRCodeCache = (deviceId, command, irCode) => {
  const key = `ir_code_${deviceId}_${command}`
  setCache(key, irCode, 30 * 24 * 60 * 60 * 1000)
}

export const getIRCodeCache = (deviceId, command) => {
  const key = `ir_code_${deviceId}_${command}`
  return getCache(key)
}

export const getCachedIRCodes = (deviceId) => {
  try {
    const keys = Object.keys(localStorage)
    const prefix = CACHE_PREFIX + `ir_code_${deviceId}_`
    const codes = {}

    keys.forEach(key => {
      if (key.startsWith(prefix)) {
        const command = key.replace(prefix, '')
        const cached = getCache(`ir_code_${deviceId}_${command}`)
        if (cached) {
          codes[command] = cached
        }
      }
    })

    return codes
  } catch (error) {
    console.warn('Get cached IR codes failed:', error)
    return {}
  }
}
