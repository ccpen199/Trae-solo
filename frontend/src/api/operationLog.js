import request from './request.js'
import { isOnline } from '../utils/networkDetection.js'
import { getCommandLogs } from './devices.js'

const PENDING_LOGS_KEY = 'pending_operation_logs'

export const logOperation = async (action, data = {}) => {
  const logEntry = {
    id: Date.now().toString(),
    action,
    data,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href
  }

  if (!isOnline()) {
    const pending = JSON.parse(localStorage.getItem(PENDING_LOGS_KEY) || '[]')
    pending.push(logEntry)
    localStorage.setItem(PENDING_LOGS_KEY, JSON.stringify(pending))
    return
  }

  try {
    localStorage.setItem(PENDING_LOGS_KEY, JSON.stringify([]))
  } catch (error) {
    const pending = JSON.parse(localStorage.getItem(PENDING_LOGS_KEY) || '[]')
    pending.push(logEntry)
    localStorage.setItem(PENDING_LOGS_KEY, JSON.stringify(pending))
  }
}

export const syncPendingLogs = async () => {
  const pending = JSON.parse(localStorage.getItem(PENDING_LOGS_KEY) || '[]')
  if (pending.length === 0) return

  localStorage.setItem(PENDING_LOGS_KEY, JSON.stringify([]))
}

export const getOperationLogs = async (params = {}) => {
  try {
    const result = await getCommandLogs(params)
    const logs = result?.commandLogs || result?.data?.commandLogs || []
    
    const formattedLogs = logs.map(log => ({
      id: log.id?.toString() || Date.now().toString(),
      action: log.command || 'unknown',
      data: {
        deviceId: log.device_id,
        command: log.command,
        deviceName: log.device_name,
        error: log.error_message
      },
      timestamp: log.created_at,
      success: log.success === 1 || log.success === true,
      networkStatus: log.network_status
    }))
    
    const pending = JSON.parse(localStorage.getItem(PENDING_LOGS_KEY) || '[]')
    return [...pending, ...formattedLogs].sort((a, b) => 
      new Date(b.timestamp) - new Date(a.timestamp)
    ).slice(0, params?.pageSize || 20)
  } catch (error) {
    const pending = JSON.parse(localStorage.getItem(PENDING_LOGS_KEY) || '[]')
    return pending.slice(0, params?.pageSize || 20)
  }
}
