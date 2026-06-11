import request from './request.js'

const fallbackPowerRows = [
  { date: '06-01', tv: 2.5, ac: 5.2, light: 1.2, projector: 0.8 },
  { date: '06-02', tv: 3.1, ac: 4.8, light: 1.5, projector: 1.2 },
  { date: '06-03', tv: 2.8, ac: 6.1, light: 1.3, projector: 0.5 },
  { date: '06-04', tv: 2.2, ac: 5.5, light: 1.1, projector: 1.8 },
  { date: '06-05', tv: 3.5, ac: 4.9, light: 1.4, projector: 2.1 },
  { date: '06-06', tv: 4.2, ac: 5.8, light: 1.6, projector: 2.5 },
  { date: '06-07', tv: 3.8, ac: 5.3, light: 1.2, projector: 1.9 }
]

function normalizePowerRows(response) {
  if (Array.isArray(response)) return response
  if (Array.isArray(response?.chart_data)) {
    return response.chart_data.map(row => ({
      date: row.label || row.date?.slice(5) || row.date,
      tv: row.tv || 0,
      ac: row.ac || 0,
      light: row.light || 0,
      projector: row.projector || 0
    }))
  }
  return fallbackPowerRows
}

export const getPowerConsumption = async (params) => {
  const data = await request.get('/statistics/power', { params })
  return normalizePowerRows(data)
}

export const getUsagePatterns = (params) => {
  return request.get('/statistics/usage-patterns', { params })
}

export const getDeviceUsage = (params) => {
  return request.get('/statistics/device-usage', { params })
}

export const getCommandStats = (params) => {
  return request.get('/statistics/command-stats', { params })
}

export const getOverview = async () => {
  const overview = await request.get('/statistics/overview')
  return {
    totalDevices: overview.totalDevices || 0,
    onlineDevices: overview.onlineDevices || 0,
    totalScenes: overview.totalScenes || 0,
    totalSchedules: overview.totalSchedules || 0,
    todayCommands: overview.todayCommands || 0,
    powerConsumption: overview.powerConsumption || 0,
    totalPower: overview.totalPower || 0,
    avgDailyPower: overview.avgDailyPower || 0,
    totalCommands: overview.totalCommands || 0,
    avgDailyCommands: overview.avgDailyCommands || 0,
    powerTrend: overview.powerTrend || 'up',
    commandTrend: overview.commandTrend || 'down',
    mostUsedDevice: overview.mostUsedDevice || '暂无设备',
    mostUsedCommand: overview.mostUsedCommand || '暂无指令'
  }
}
