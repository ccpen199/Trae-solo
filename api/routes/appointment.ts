import { Router, type Request, type Response } from 'express'
import AppointmentService from '../services/AppointmentService.js'
import db from '../db/index.js'
import { success, error, paged } from '../utils/response.js'
import authMiddleware from '../middleware/auth.js'

const router = Router()
const appointmentService = new AppointmentService(db)

router.get('/windows', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { businessType, startDate, endDate } = req.query
    const windows = appointmentService.getWindows({
      businessType: businessType as string,
      startDate: startDate as string,
      endDate: endDate as string,
    })
    success(res, windows, '获取窗口列表成功')
  } catch (err) {
    const message = err instanceof Error ? err.message : '获取窗口列表失败'
    error(res, message)
  }
})

router.get('/slots', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { businessType, date } = req.query
    if (!businessType || !date) {
      error(res, '业务类型和日期不能为空')
      return
    }
    const slots = appointmentService.getAvailableSlots(businessType as string, date as string)
    success(res, slots, '获取可预约时段成功')
  } catch (err) {
    const message = err instanceof Error ? err.message : '获取可预约时段失败'
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

    const { windowId, businessType } = req.body
    const result = appointmentService.createAppointment({
      userId,
      windowId,
      businessType,
    })

    success(res, result, '预约成功')
  } catch (err) {
    const message = err instanceof Error ? err.message : '预约失败'
    error(res, message)
  }
})

router.get('/queue', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { appointmentId } = req.query
    if (!appointmentId) {
      error(res, '预约ID不能为空')
      return
    }
    const queueStatus = appointmentService.getQueueStatus(parseInt(appointmentId as string))
    success(res, queueStatus, '获取排队状态成功')
  } catch (err) {
    const message = err instanceof Error ? err.message : '获取排队状态失败'
    error(res, message)
  }
})

router.post('/:id/rate', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const appointmentId = parseInt(req.params.id)
    const userId = req.user?.userId
    if (!userId) {
      error(res, '用户未认证', 401)
      return
    }

    const { rating, comment } = req.body
    const result = appointmentService.rateService({
      appointmentId,
      userId,
      rating,
      comment,
    })

    success(res, result, '评价成功')
  } catch (err) {
    const message = err instanceof Error ? err.message : '评价失败'
    error(res, message)
  }
})

router.get('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { businessType, status, page = 1, pageSize = 10 } = req.query
    const userId = req.user?.userId

    const result = appointmentService.getList({
      userId,
      businessType: businessType as string,
      status: status as string,
      page: parseInt(page as string),
      pageSize: parseInt(pageSize as string),
    })

    paged(res, result.list, result.total, result.page, result.pageSize, '获取预约列表成功')
  } catch (err) {
    const message = err instanceof Error ? err.message : '获取预约列表失败'
    error(res, message)
  }
})

export default router
