import { Router, type Request, type Response } from 'express'
import { authMiddleware, expertMiddleware, adminMiddleware, type AuthRequest } from '../middleware/auth.js'
import * as orderService from '../services/orderService.js'

const router = Router()

router.post('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { artwork_id, order_type, expert_id } = req.body
    if (!artwork_id || !order_type) {
      res.status(400).json({ success: false, error: '藏品ID和订单类型必填' })
      return
    }
    if (!['ai', 'expert'].includes(order_type)) {
      res.status(400).json({ success: false, error: '订单类型无效' })
      return
    }
    if (order_type === 'expert' && !expert_id) {
      res.status(400).json({ success: false, error: '专家鉴定需选择专家' })
      return
    }
    const result = orderService.createOrder(req.user!.id, artwork_id, order_type as 'ai' | 'expert', expert_id)
    if (!result.success) {
      res.status(400).json({ success: false, error: result.error })
      return
    }
    res.json({ success: true, order: result.order, aiResult: result.aiResult })
  } catch (err) {
    res.status(500).json({ success: false, error: '创建订单失败' })
  }
})

router.get('/mine', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const pageSize = parseInt(req.query.pageSize as string) || 10
    const status = req.query.status as string | undefined
    const result = orderService.getUserOrders(req.user!.id, page, pageSize, status)
    res.json({ success: true, ...result })
  } catch (err) {
    res.status(500).json({ success: false, error: '获取我的订单失败' })
  }
})

router.get('/expert', authMiddleware, expertMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const pageSize = parseInt(req.query.pageSize as string) || 10
    const status = req.query.status as string | undefined
    const result = orderService.getExpertOrders(req.user!.id, page, pageSize, status)
    res.json({ success: true, ...result })
  } catch (err) {
    res.status(500).json({ success: false, error: '获取专家订单失败' })
  }
})

router.get('/all', authMiddleware, adminMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const pageSize = parseInt(req.query.pageSize as string) || 10
    const status = req.query.status as string | undefined
    const result = orderService.getAllOrders(page, pageSize, status)
    res.json({ success: true, ...result })
  } catch (err) {
    res.status(500).json({ success: false, error: '获取所有订单失败' })
  }
})

router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const order = orderService.getOrderById(req.params.id)
    if (!order) {
      res.status(404).json({ success: false, error: '订单不存在' })
      return
    }
    if (order.user_id !== req.user!.id && req.user!.role !== 'admin' && req.user!.role !== 'expert') {
      res.status(403).json({ success: false, error: '无权限查看此订单' })
      return
    }
    res.json({ success: true, order })
  } catch (err) {
    res.status(500).json({ success: false, error: '获取订单详情失败' })
  }
})

router.post('/:id/accept', authMiddleware, expertMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const ok = orderService.acceptOrder(req.params.id, req.user!.id)
    if (!ok) {
      res.status(400).json({ success: false, error: '接单失败' })
      return
    }
    res.json({ success: true, message: '已接单' })
  } catch (err) {
    res.status(500).json({ success: false, error: '接单操作失败' })
  }
})

router.post('/:id/submit', authMiddleware, expertMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { expert_opinion, valuation } = req.body
    if (!expert_opinion || valuation === undefined) {
      res.status(400).json({ success: false, error: '鉴定意见和评估价值必填' })
      return
    }
    const ok = orderService.submitExpertResult(req.params.id, req.user!.id, expert_opinion, valuation)
    if (!ok) {
      res.status(400).json({ success: false, error: '提交失败' })
      return
    }
    res.json({ success: true, message: '鉴定结果已提交' })
  } catch (err) {
    res.status(500).json({ success: false, error: '提交鉴定结果失败' })
  }
})

router.post('/:id/dispute', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { reason, description, evidence } = req.body
    if (!reason) {
      res.status(400).json({ success: false, error: '申诉原因必填' })
      return
    }
    const result = orderService.createDispute(req.params.id, req.user!.id, reason, description, evidence)
    if (!result.success) {
      res.status(400).json({ success: false, error: result.error })
      return
    }
    res.json({ success: true, disputeId: result.disputeId, message: '申诉已提交' })
  } catch (err) {
    res.status(500).json({ success: false, error: '提交申诉失败' })
  }
})

router.get('/disputes/all', authMiddleware, adminMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const pageSize = parseInt(req.query.pageSize as string) || 10
    const status = req.query.status as string | undefined
    const result = orderService.getDisputes(page, pageSize, status)
    res.json({ success: true, ...result })
  } catch (err) {
    res.status(500).json({ success: false, error: '获取申诉列表失败' })
  }
})

router.post('/disputes/:id/resolve', authMiddleware, adminMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { resolution, status } = req.body
    if (!resolution || !status) {
      res.status(400).json({ success: false, error: '处理结果和状态必填' })
      return
    }
    const ok = orderService.resolveDispute(req.params.id, resolution, status)
    if (!ok) {
      res.status(400).json({ success: false, error: '处理失败' })
      return
    }
    res.json({ success: true, message: '申诉已处理' })
  } catch (err) {
    res.status(500).json({ success: false, error: '处理申诉失败' })
  }
})

export default router
