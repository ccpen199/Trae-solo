import { Router, type Request, type Response } from 'express'
import { authMiddleware, adminMiddleware, type AuthRequest } from '../middleware/auth.js'
import * as adminService from '../services/adminService.js'

const router = Router()

router.get('/dashboard', authMiddleware, adminMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const stats = adminService.getDashboardStats()
    res.json({ success: true, stats })
  } catch (err) {
    res.status(500).json({ success: false, error: '获取仪表盘数据失败' })
  }
})

router.get('/users', authMiddleware, adminMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const pageSize = parseInt(req.query.pageSize as string) || 10
    const role = req.query.role as string | undefined
    const keyword = req.query.keyword as string | undefined
    const result = adminService.getUserList(page, pageSize, role, keyword)
    res.json({ success: true, ...result })
  } catch (err) {
    res.status(500).json({ success: false, error: '获取用户列表失败' })
  }
})

router.put('/users/:id/role', authMiddleware, adminMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { role } = req.body
    if (!role) {
      res.status(400).json({ success: false, error: '角色必填' })
      return
    }
    const ok = adminService.updateUserRole(req.params.id, role)
    if (!ok) {
      res.status(400).json({ success: false, error: '更新失败' })
      return
    }
    res.json({ success: true, message: '已更新用户角色' })
  } catch (err) {
    res.status(500).json({ success: false, error: '更新用户角色失败' })
  }
})

router.delete('/users/:id', authMiddleware, adminMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const ok = adminService.deleteUser(req.params.id)
    if (!ok) {
      res.status(400).json({ success: false, error: '删除失败' })
      return
    }
    res.json({ success: true, message: '已删除用户' })
  } catch (err) {
    res.status(500).json({ success: false, error: '删除用户失败' })
  }
})

export default router
