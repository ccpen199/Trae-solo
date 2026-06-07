import { Router, type Request, type Response } from 'express'
import ViolationService from '../services/ViolationService.js'
import db from '../db/index.js'
import { success, error, paged, notFound } from '../utils/response.js'
import authMiddleware from '../middleware/auth.js'

const router = Router()
const violationService = new ViolationService(db)

router.get('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, violationType, page = 1, pageSize = 10 } = req.query
    const reporterId = req.user?.userId

    const result = violationService.getList({
      reporterId,
      status: status as string,
      violationType: violationType as string,
      page: parseInt(page as string),
      pageSize: parseInt(pageSize as string),
    })

    paged(res, result.list, result.total, result.page, result.pageSize, '获取违法举报列表成功')
  } catch (err) {
    const message = err instanceof Error ? err.message : '获取列表失败'
    error(res, message)
  }
})

router.post('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const reporterId = req.user?.userId
    if (!reporterId) {
      error(res, '用户未认证', 401)
      return
    }

    const { plateNumber, violationType, violationTime, location, description, evidenceFiles } = req.body

    const result = await violationService.createReport({
      reporterId,
      plateNumber,
      violationType,
      violationTime,
      location,
      description,
      evidenceFiles,
    })

    success(res, result, '违法举报提交成功')
  } catch (err) {
    const message = err instanceof Error ? err.message : '举报提交失败'
    error(res, message)
  }
})

router.get('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id)
    const result = violationService.getDetail(id)
    success(res, result, '获取违法举报详情成功')
  } catch (err) {
    const message = err instanceof Error ? err.message : '获取详情失败'
    notFound(res, message)
  }
})

export default router
