let lastPingTime = 0
let lastPingLatency = 0
let networkType = 'unknown'

export const isOnline = () => {
  return navigator.onLine
}

export const isWeakNetwork = () => {
  if (!navigator.onLine) return true
  if (lastPingLatency > 2000) return true
  if (navigator.connection) {
    const connection = navigator.connection
    if (connection.saveData) return true
    if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') return true
    if (connection.downlink < 0.5) return true
    if (connection.rtt > 1000) return true
  }
  return false
}

export const getNetworkStatus = () => {
  if (!navigator.onLine) return 'offline'
  if (isWeakNetwork()) return 'weak'
  return 'online'
}

export const getNetworkInfo = () => {
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection
  return {
    online: navigator.onLine,
    type: connection?.type || networkType,
    effectiveType: connection?.effectiveType || 'unknown',
    downlink: connection?.downlink || 0,
    rtt: connection?.rtt || 0,
    saveData: connection?.saveData || false,
    lastPingLatency,
    isWeak: isWeakNetwork()
  }
}

export const pingServer = async (url = '/api/ping') => {
  const startTime = Date.now()
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 3000)

    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      cache: 'no-store'
    })

    clearTimeout(timeoutId)
    lastPingTime = Date.now()
    lastPingLatency = lastPingTime - startTime
    return {
      success: response.ok,
      latency: lastPingLatency,
      timestamp: lastPingTime
    }
  } catch (error) {
    lastPingLatency = 9999
    return {
      success: false,
      latency: lastPingLatency,
      timestamp: Date.now(),
      error: error.message
    }
  }
}

export const startNetworkMonitoring = (callback, interval = 5000) => {
  const checkNetwork = async () => {
    await pingServer()
    const status = getNetworkStatus()
    const info = getNetworkInfo()
    callback?.({ status, info })
  }

  checkNetwork()
  const intervalId = setInterval(checkNetwork, interval)

  const handleOnline = () => checkNetwork()
  const handleOffline = () => checkNetwork()

  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)

  return () => {
    clearInterval(intervalId)
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
  }
}

export const getOfflineIndicator = () => {
  const status = getNetworkStatus()
  if (status === 'offline') {
    return { type: 'error', text: '离线模式' }
  }
  if (status === 'weak') {
    return { type: 'warning', text: '弱网模式' }
  }
  return { type: 'success', text: '在线' }
}
