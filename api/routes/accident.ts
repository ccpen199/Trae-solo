import { Router, type Request, type Response } from 'express'
import AccidentService from '../services/AccidentService.js'
import db from '../db/index.js'
import { success, error, paged, notFound } from '../utils/response.js'
import authMiddleware from '../middleware/auth.js'

const router = Router()
const accidentService = new AccidentService(db)

router.get('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, page = 1, pageSize = 10 } = req.query
    const reporterId = req.user?.userId

    const result = accidentService.getList({
      reporterId,
      status: status as string,
      page: parseInt(page as string),
      pageSize: parseInt(pageSize as string),
    })

    paged(res, result.list, result.total, result.page, result.pageSize, '获取事故列表成功')
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

    const { accidentTime, location, description, involvedParties, evidenceFiles } = req.body

    const result = await accidentService.createAccident({
      reporterId,
      accidentTime,
      location,
      description,
      involvedParties,
      evidenceFiles,
    })

    success(res, result, '事故报案提交成功')
  } catch (err) {
    const message = err instanceof Error ? err.message : '报案提交失败'
    error(res, message)
  }
})

router.get('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id)
    const result = accidentService.getDetail(id)
    success(res, result, '获取事故详情成功')
  } catch (err) {
    const message = err instanceof Error ? err.message : '获取详情失败'
    notFound(res, message)
  }
})

router.post('/:id/liability', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id)
    const result = accidentService.generateLiability(id)
    success(res, result, '责任认定书生成成功')
  } catch (err) {
    const message = err instanceof Error ? err.message : '生成责任认定书失败'
    error(res, message)
  }
})

export default router
