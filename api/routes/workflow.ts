import { Router, type Request, type Response } from 'express'
import WorkflowService from '../services/WorkflowService.js'
import db from '../db/index.js'
import { success, error, paged } from '../utils/response.js'
import authMiddleware from '../middleware/auth.js'

const router = Router()
const workflowService = new WorkflowService(db)

router.get('/tasks', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const auditorId = req.user?.userId
    if (!auditorId) {
      error(res, '用户未认证', 401)
      return
    }

    const { businessType, status, page = 1, pageSize = 10 } = req.query

    const result = workflowService.getTodos({
      auditorId,
      businessType: businessType as string,
      status: status as string,
      page: parseInt(page as string),
      pageSize: parseInt(pageSize as string),
    })

    paged(res, result.list, result.total, result.page, result.pageSize, '获取待办任务成功')
  } catch (err) {
    const message = err instanceof Error ? err.message : '获取待办任务失败'
    error(res, message)
  }
})

router.get('/my-tasks', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId
    const { status, page = 1, pageSize = 10 } = req.query

    const result = workflowService.getMyTasks({
      applicantId: userId,
      status: status as string,
      page: parseInt(page as string),
      pageSize: parseInt(pageSize as string),
    })

    paged(res, result.list, result.total, result.page, result.pageSize, '获取我的任务成功')
  } catch (err) {
    const message = err instanceof Error ? err.message : '获取任务失败'
    error(res, message)
  }
})

router.get('/pending-count', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId
    const { role } = req.user || {}
    
    let count = 0
    if (role === 'auditor' || role === 'admin') {
      count = workflowService.getPendingCount(undefined, userId)
    } else {
      count = workflowService.getPendingCount(userId, undefined)
    }

    success(res, count, '获取待办数量成功')
  } catch (err) {
    const message = err instanceof Error ? err.message : '获取数量失败'
    error(res, message)
  }
})

router.get('/task/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id)
    const result = workflowService.getTaskDetail(id)
    success(res, result, '获取任务详情成功')
  } catch (err) {
    const message = err instanceof Error ? err.message : '获取详情失败'
    error(res, message)
  }
})

router.get('/task/by-business', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { businessType, businessId } = req.query
    if (!businessType || !businessId) {
      error(res, '参数不完整')
      return
    }
    const result = workflowService.getTaskByBusinessId(
      businessType as string,
      parseInt(businessId as string)
    )
    success(res, result, '获取任务成功')
  } catch (err) {
    const message = err instanceof Error ? err.message : '获取失败'
    error(res, message)
  }
})

router.get('/task/:id/records', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id)
    const result = workflowService.getAuditHistory(id)
    success(res, result, '获取审核记录成功')
  } catch (err) {
    const message = err instanceof Error ? err.message : '获取失败'
    error(res, message)
  }
})

router.post('/audit', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { taskId, action, comment } = req.body
    const auditorId = req.user?.userId
    if (!auditorId) {
      error(res, '用户未认证', 401)
      return
    }

    if (!taskId || !action || !['approve', 'reject'].includes(action)) {
      error(res, '参数不完整或不正确')
      return
    }

    const result = workflowService.audit({
      taskId: parseInt(taskId),
      auditorId,
      action,
      comment,
    })

    success(res, result, '审核成功')
  } catch (err) {
    const message = err instanceof Error ? err.message : '审核失败'
    error(res, message)
  }
})

router.post('/task/:id/claim', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const taskId = parseInt(req.params.id)
    success(res, { id: taskId, claimed: true }, '任务领取成功')
  } catch (err) {
    const message = err instanceof Error ? err.message : '领取失败'
    error(res, message)
  }
})

router.post('/task/:id/transfer', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const taskId = parseInt(req.params.id)
    const { targetAuditorId } = req.body
    success(res, { id: taskId, transferred: true, targetAuditorId }, '任务转办成功')
  } catch (err) {
    const message = err instanceof Error ? err.message : '转办失败'
    error(res, message)
  }
})

export default router
