import express from 'express'

const router = express.Router()

router.get('/overview', (req, res) => {
  res.json({
    success: true,
    data: {
      serviceStatus: [
        { name: '社保查询', status: 'online', requestsToday: 1286, successRate: 99.2 },
        { name: '便民缴费', status: 'online', requestsToday: 942, successRate: 98.7 },
        { name: '交通态势', status: 'online', requestsToday: 731, successRate: 97.9 },
        { name: '政策公告', status: 'cached', requestsToday: 318, successRate: 96.4 },
      ],
      alerts: [
        { id: 'alert-001', level: 'warning', title: '政策公告离线缓存待刷新', owner: '市政府办公厅' },
        { id: 'alert-002', level: 'info', title: '停车缴费新增市南区网点 12 个', owner: '市南区缴费系统' },
      ],
      metrics: {
        usersOnline: 18432,
        apiSuccessRate: 98.8,
        pendingTickets: 23,
        cachedPolicies: 42,
      },
    },
  })
})

export default router
