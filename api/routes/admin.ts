import { Router, type Request, type Response } from 'express'
import {
  getDashboardStats,
  getTaskStatistics,
  getInviteFunnelData,
  getWeeklyEarningsData,
  getPendingTasks,
  approveTask,
  rejectTask,
  getAllTasks,
  getAllUsers,
  getPendingWithdraws,
  approveWithdraw,
  rejectWithdraw,
  createTask,
  updateTaskStatus,
} from '../services/adminService.js'
import { adminLogin } from '../services/authService.js'

const router = Router()

router.post('/login', (req: Request, res: Response) => {
  try {
    const { username, password } = req.body
    const result = adminLogin(username, password)
    res.json(result)
  } catch (error) {
    res.status(500).json({ success: false, message: '登录失败' })
  }
})

router.get('/dashboard', (req: Request, res: Response) => {
  try {
    const stats = getDashboardStats()
    const taskStats = getTaskStatistics()
    res.json({ success: true, stats, taskStats })
  } catch (error) {
    res.status(500).json({ success: false, message: '获取数据失败' })
  }
})

router.get('/statistics/overview', (req: Request, res: Response) => {
  try {
    const stats = getDashboardStats()
    const funnel = getInviteFunnelData()
    const weekly = getWeeklyEarningsData()
    const taskStats = getTaskStatistics()
    res.json({ success: true, stats, funnel, weekly, taskStats })
  } catch (error) {
    res.status(500).json({ success: false, message: '获取数据失败' })
  }
})

router.get('/statistics/funnel', (req: Request, res: Response) => {
  try {
    const funnel = getInviteFunnelData()
    res.json({ success: true, funnel })
  } catch (error) {
    res.status(500).json({ success: false, message: '获取数据失败' })
  }
})

router.get('/statistics/weekly', (req: Request, res: Response) => {
  try {
    const weekly = getWeeklyEarningsData()
    res.json({ success: true, weekly })
  } catch (error) {
    res.status(500).json({ success: false, message: '获取数据失败' })
  }
})

router.get('/tasks/pending', (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const pageSize = parseInt(req.query.pageSize as string) || 20
    const result = getPendingTasks(page, pageSize)
    res.json({ success: true, ...result })
  } catch (error) {
    res.status(500).json({ success: false, message: '获取待审核任务失败' })
  }
})

router.post('/tasks/:id/approve', (req: Request, res: Response) => {
  try {
    const result = approveTask(req.params.id)
    res.json(result)
  } catch (error) {
    res.status(500).json({ success: false, message: '审核失败' })
  }
})

router.post('/tasks/:id/reject', (req: Request, res: Response) => {
  try {
    const { reason } = req.body
    const result = rejectTask(req.params.id, reason || '不符合要求')
    res.json(result)
  } catch (error) {
    res.status(500).json({ success: false, message: '审核失败' })
  }
})

router.get('/tasks/pool', (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const pageSize = parseInt(req.query.pageSize as string) || 20
    const result = getAllTasks(page, pageSize)
    res.json({ success: true, ...result })
  } catch (error) {
    res.status(500).json({ success: false, message: '获取任务列表失败' })
  }
})

router.post('/tasks', (req: Request, res: Response) => {
  try {
    const result = createTask(req.body)
    res.json(result)
  } catch (error) {
    res.status(500).json({ success: false, message: '创建任务失败' })
  }
})

router.put('/tasks/:id/status', (req: Request, res: Response) => {
  try {
    const { status } = req.body
    const result = updateTaskStatus(req.params.id, status)
    res.json(result)
  } catch (error) {
    res.status(500).json({ success: false, message: '更新失败' })
  }
})

router.get('/users', (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const pageSize = parseInt(req.query.pageSize as string) || 20
    const result = getAllUsers(page, pageSize)
    res.json({ success: true, ...result })
  } catch (error) {
    res.status(500).json({ success: false, message: '获取用户列表失败' })
  }
})

router.get('/withdraw', (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const pageSize = parseInt(req.query.pageSize as string) || 20
    const result = getPendingWithdraws(page, pageSize)
    res.json({ success: true, ...result })
  } catch (error) {
    res.status(500).json({ success: false, message: '获取提现申请失败' })
  }
})

router.post('/withdraw/:id/approve', (req: Request, res: Response) => {
  try {
    const result = approveWithdraw(req.params.id)
    res.json(result)
  } catch (error) {
    res.status(500).json({ success: false, message: '审核失败' })
  }
})

router.post('/withdraw/:id/reject', (req: Request, res: Response) => {
  try {
    const { reason } = req.body
    const result = rejectWithdraw(req.params.id, reason || '不符合要求')
    res.json(result)
  } catch (error) {
    res.status(500).json({ success: false, message: '审核失败' })
  }
})

export default router
