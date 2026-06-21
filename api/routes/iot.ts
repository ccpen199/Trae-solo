import { Router, type Request, type Response } from 'express'
import { deviceStatusList, alerts, type Alert } from '../data/mockData.js'

const router = Router()

let alertList = [...alerts]

router.get('/devices/status', async (req: Request, res: Response): Promise<void> => {
  res.json({
    success: true,
    data: deviceStatusList,
    message: '获取设备实时状态成功',
  })
})

router.get('/alerts', async (req: Request, res: Response): Promise<void> => {
  const status = req.query.status as string
  const level = req.query.level as string
  let filteredAlerts = alertList

  if (status) {
    filteredAlerts = filteredAlerts.filter((alert) => alert.status === status)
  }
  if (level) {
    filteredAlerts = filteredAlerts.filter((alert) => alert.level === level)
  }

  const page = parseInt(req.query.page as string) || 1
  const pageSize = parseInt(req.query.pageSize as string) || 10
  const start = (page - 1) * pageSize
  const end = start + pageSize
  const paginatedAlerts = filteredAlerts.slice(start, end)

  res.json({
    success: true,
    data: {
      list: paginatedAlerts,
      total: filteredAlerts.length,
      page,
      pageSize,
    },
    message: '获取故障预警列表成功',
  })
})

router.put('/alerts/:id/resolve', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params
  const { handler } = req.body

  const alertIndex = alertList.findIndex((alert) => alert.id === id)
  if (alertIndex === -1) {
    res.status(404).json({
      success: false,
      data: null,
      message: '预警不存在',
    })
    return
  }

  const updatedAlert: Alert = {
    ...alertList[alertIndex],
    status: 'resolved',
    resolvedAt: new Date().toISOString(),
    handler: handler || '系统管理员',
  }

  alertList[alertIndex] = updatedAlert

  res.json({
    success: true,
    data: updatedAlert,
    message: '处理故障预警成功',
  })
})

export default router
