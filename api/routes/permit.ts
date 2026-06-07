import { Router, type Request, type Response } from 'express'
import PermitService from '../services/PermitService.js'
import db from '../db/index.js'
import { success, error, paged, notFound } from '../utils/response.js'
import authMiddleware from '../middleware/auth.js'

const router = Router()
const permitService = new PermitService(db)

router.get('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, page = 1, pageSize = 10 } = req.query
    const userId = req.user?.userId

    const result = permitService.getList({
      userId,
      status: status as string,
      page: parseInt(page as string),
      pageSize: parseInt(pageSize as string),
    })

    paged(res, result.list, result.total, result.page, result.pageSize, '获取进京证列表成功')
  } catch (err) {
    const message = err instanceof Error ? err.message : '获取列表失败'
    error(res, message)
  }
})

router.get('/my', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, page = 1, pageSize = 10 } = req.query
    const userId = req.user?.userId

    const result = permitService.getList({
      userId,
      status: status as string,
      page: parseInt(page as string),
      pageSize: parseInt(pageSize as string),
    })

    paged(res, result.list, result.total, result.page, result.pageSize, '获取我的进京证成功')
  } catch (err) {
    const message = err instanceof Error ? err.message : '获取列表失败'
    error(res, message)
  }
})

router.get('/valid', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId
    const result = permitService.getList({
      userId,
      status: 'approved',
      page: 1,
      pageSize: 1,
    })
    success(res, result.list.length > 0 ? result.list[0] : null, '获取有效进京证成功')
  } catch (err) {
    const message = err instanceof Error ? err.message : '获取失败'
    error(res, message)
  }
})

router.post('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId
    if (!userId) {
      error(res, '用户未认证', 401)
      return
    }

    const { plateNumber, vehicleType, ownerName, ownerIdCard, enterDate, leaveDate, purpose, destination } = req.body

    const result = await permitService.createApplication({
      userId,
      plateNumber,
      vehicleType,
      ownerName,
      ownerIdCard,
      enterDate,
      leaveDate,
      purpose,
      destination,
    })

    success(res, result, '进京证申请提交成功')
  } catch (err) {
    const message = err instanceof Error ? err.message : '申请提交失败'
    error(res, message)
  }
})

router.get('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id)
    const result = permitService.getDetail(id)
    success(res, result, '获取进京证详情成功')
  } catch (err) {
    const message = err instanceof Error ? err.message : '获取详情失败'
    notFound(res, message)
  }
})

router.post('/:id/renew', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id)
    const { enterDate, leaveDate } = req.body

    const result = await permitService.renew({
      id,
      enterDate,
      leaveDate,
    })

    success(res, result, '续期申请提交成功')
  } catch (err) {
    const message = err instanceof Error ? err.message : '续期申请失败'
    error(res, message)
  }
})

router.get('/:id/verify', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id)
    const result = permitService.getDetail(id)
    success(res, { verified: result.status === 'approved' || result.status === 'verified', permit: result }, '核验完成')
  } catch (err) {
    const message = err instanceof Error ? err.message : '核验失败'
    error(res, message)
  }
})

export default router
