import { Router, type Request, type Response } from 'express'
import EbikeService from '../services/EbikeService.js'
import db from '../db/index.js'
import { success, error, paged, notFound } from '../utils/response.js'
import authMiddleware from '../middleware/auth.js'

const router = Router()
const ebikeService = new EbikeService(db)

router.get('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, page = 1, pageSize = 10 } = req.query
    const ownerId = req.user?.userId

    const result = ebikeService.getList({
      ownerId,
      status: status as string,
      page: parseInt(page as string),
      pageSize: parseInt(pageSize as string),
    })

    paged(res, result.list, result.total, result.page, result.pageSize, '获取电动车登记列表成功')
  } catch (err) {
    const message = err instanceof Error ? err.message : '获取列表失败'
    error(res, message)
  }
})

router.post('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const ownerId = req.user?.userId
    if (!ownerId) {
      error(res, '用户未认证', 401)
      return
    }

    const { ownerName, ownerIdCard, phone, brand, model, frameNumber, motorNumber, purchaseDate, invoiceNumber } = req.body

    const result = await ebikeService.createRegistration({
      ownerId,
      ownerName,
      ownerIdCard,
      phone,
      brand,
      model,
      frameNumber,
      motorNumber,
      purchaseDate,
      invoiceNumber,
    })

    success(res, result, '电动车登记申请提交成功')
  } catch (err) {
    const message = err instanceof Error ? err.message : '登记申请失败'
    error(res, message)
  }
})

router.get('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id)
    const result = ebikeService.getDetail(id)
    success(res, result, '获取电动车登记详情成功')
  } catch (err) {
    const message = err instanceof Error ? err.message : '获取详情失败'
    notFound(res, message)
  }
})

router.get('/:id/license', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id)
    const registration = ebikeService.getDetail(id)
    
    if (registration.status !== 'approved' || !registration.license_plate || !registration.license_number) {
      error(res, '行驶证尚未生成，请等待审核通过')
      return
    }

    success(res, {
      licensePlate: registration.license_plate,
      licenseNumber: registration.license_number,
      registration,
    }, '获取行驶证成功')
  } catch (err) {
    const message = err instanceof Error ? err.message : '获取行驶证失败'
    error(res, message)
  }
})

export default router
