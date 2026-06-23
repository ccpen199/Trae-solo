import { Router, type Request, type Response } from 'express'

const router = Router()

const familyBinds = [
  {
    id: 'f001',
    elderId: 'e001',
    elderName: '王大爷',
    elderAge: 72,
    familyId: 'fm001',
    relation: '儿子',
    receiveAlerts: true,
    createdAt: '2026-01-15 10:30:00',
  },
  {
    id: 'f002',
    elderId: 'e001',
    elderName: '王大爷',
    elderAge: 72,
    familyId: 'fm002',
    relation: '女儿',
    receiveAlerts: true,
    createdAt: '2026-01-16 14:20:00',
  },
  {
    id: 'f003',
    elderId: 'e002',
    elderName: '李奶奶',
    elderAge: 68,
    familyId: 'fm003',
    relation: '孙子',
    receiveAlerts: false,
    createdAt: '2026-02-10 09:00:00',
  },
]

const activityLogs = [
  {
    elderId: 'e001',
    elderName: '王大爷',
    date: '2026-06-19',
    durationMinutes: 120,
    featuresUsed: ['查看天气', '日历黄历', '健康食谱', '八段锦视频', '用药提醒'],
    hasActivity: true,
  },
  {
    elderId: 'e001',
    elderName: '王大爷',
    date: '2026-06-18',
    durationMinutes: 95,
    featuresUsed: ['查看天气', '健康食谱', '太极拳视频'],
    hasActivity: true,
  },
  {
    elderId: 'e001',
    elderName: '王大爷',
    date: '2026-06-17',
    durationMinutes: 60,
    featuresUsed: ['查看天气', '用药提醒'],
    hasActivity: true,
  },
  {
    elderId: 'e001',
    elderName: '王大爷',
    date: '2026-06-16',
    durationMinutes: 0,
    featuresUsed: [],
    hasActivity: false,
  },
  {
    elderId: 'e001',
    elderName: '王大爷',
    date: '2026-06-15',
    durationMinutes: 80,
    featuresUsed: ['查看天气', '日历黄历', '五禽戏视频'],
    hasActivity: true,
  },
  {
    elderId: 'e001',
    elderName: '王大爷',
    date: '2026-06-14',
    durationMinutes: 110,
    featuresUsed: ['查看天气', '健康食谱', '用药提醒', '散步健身法'],
    hasActivity: true,
  },
  {
    elderId: 'e001',
    elderName: '王大爷',
    date: '2026-06-13',
    durationMinutes: 45,
    featuresUsed: ['查看天气', '日历黄历'],
    hasActivity: true,
  },
]

const alerts = [
  {
    id: 'a001',
    bindId: 'f001',
    type: 'inactivity',
    message: '王大爷已超过24小时未使用应用，建议电话联系确认情况。',
    triggeredAt: '2026-06-17 08:00:00',
    acknowledged: true,
    elderName: '王大爷',
  },
  {
    id: 'a002',
    bindId: 'f001',
    type: 'medicine',
    message: '王大爷今日上午的降压药还未服用，请提醒老人按时吃药。',
    triggeredAt: '2026-06-19 10:30:00',
    acknowledged: false,
    elderName: '王大爷',
  },
  {
    id: 'a003',
    bindId: 'f001',
    type: 'health',
    message: '检测到王大爷近期用药依从性下降，建议关注老人健康状况。',
    triggeredAt: '2026-06-18 20:00:00',
    acknowledged: false,
    elderName: '王大爷',
  },
  {
    id: 'a004',
    bindId: 'f002',
    type: 'medicine',
    message: '王大爷今日晚上的他汀类药物还未服用，请提醒老人按时吃药。',
    triggeredAt: '2026-06-19 21:15:00',
    acknowledged: false,
    elderName: '王大爷',
  },
  {
    id: 'a005',
    bindId: 'f003',
    type: 'inactivity',
    message: '李奶奶已超过48小时未使用应用，建议电话联系确认情况。',
    triggeredAt: '2026-06-19 09:00:00',
    acknowledged: false,
    elderName: '李奶奶',
  },
]

router.post('/bind', (req: Request, res: Response): void => {
  const { elderPhone, familyPhone, relation } = req.body

  if (!elderPhone || !familyPhone || !relation) {
    res.status(400).json({
      success: false,
      message: '请填写完整的绑定信息',
      data: null,
    })
    return
  }

  const newBind = {
    id: `f${Date.now()}`,
    elderId: `e${Date.now()}`,
    elderName: '新绑定老人',
    elderAge: 65,
    familyId: `fm${Date.now()}`,
    relation,
    receiveAlerts: true,
    createdAt: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-'),
  }

  familyBinds.unshift(newBind)

  res.json({
    success: true,
    message: '绑定成功',
    data: newBind,
  })
})

router.get('/activity', (req: Request, res: Response): void => {
  const { elderId } = req.query

  let filteredActivity = activityLogs

  if (elderId) {
    filteredActivity = activityLogs.filter((a) => a.elderId === elderId)
  }

  const stats = {
    totalActiveDays: filteredActivity.filter((a) => a.hasActivity).length,
    averageDuration: Math.round(
      filteredActivity.reduce((sum, a) => sum + a.durationMinutes, 0) / filteredActivity.length
    ),
    mostUsedFeatures: ['查看天气', '健康食谱', '用药提醒'],
    lastActiveDate: filteredActivity.find((a) => a.hasActivity)?.date || null,
  }

  res.json({
    success: true,
    message: '获取活跃度数据成功',
    data: {
      logs: filteredActivity,
      stats,
    },
  })
})

router.get('/alerts', (req: Request, res: Response): void => {
  const { bindId, acknowledged } = req.query

  let filteredAlerts = alerts

  if (bindId) {
    filteredAlerts = filteredAlerts.filter((a) => a.bindId === bindId)
  }

  if (acknowledged !== undefined) {
    const isAcknowledged = acknowledged === 'true'
    filteredAlerts = filteredAlerts.filter((a) => a.acknowledged === isAcknowledged)
  }

  res.json({
    success: true,
    message: '获取预警信息成功',
    data: {
      list: filteredAlerts,
      unreadCount: filteredAlerts.filter((a) => !a.acknowledged).length,
    },
  })
})

export default router
