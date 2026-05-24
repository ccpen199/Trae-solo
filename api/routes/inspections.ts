import { Router, type Request, type Response } from 'express'
import { authenticate } from '../middleware/auth.js'
import { requirePermission } from '../middleware/permission.js'
import { successResponse, errorResponse } from '../utils/response.js'
import {
  getInspections,
  getInspectionById,
  createInspection,
  updateInspection,
  submitInspection,
  auditInspection
} from '../services/inspection.service.js'
import type { Inspection } from '../types/index.js'

const router = Router()

router.get(
  '/',
  authenticate,
  requirePermission('inspection', 'read'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { inspectorId, status, carId } = req.query

      const filters: { inspectorId?: number; status?: string; carId?: number } = {}

      if (inspectorId !== undefined && inspectorId !== '') {
        filters.inspectorId = parseInt(inspectorId as string, 10)
      }
      if (status !== undefined && status !== '') {
        filters.status = status as string
      }
      if (carId !== undefined && carId !== '') {
        filters.carId = parseInt(carId as string, 10)
      }

      if (req.user?.role === 'inspector') {
        filters.inspectorId = req.user.userId
      }

      const inspections = await getInspections(filters)
      res.json(successResponse(inspections))
    } catch (error) {
      const message = error instanceof Error ? error.message : '获取检测报告列表失败'
      res.status(400).json(errorResponse(message))
    }
  }
)

router.post(
  '/',
  authenticate,
  requirePermission('inspection', 'create'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { carId, ...rest } = req.body

      if (!carId) {
        res.status(400).json(errorResponse('缺少车源ID'))
        return
      }

      if (!req.user) {
        res.status(401).json(errorResponse('用户未认证', 401))
        return
      }

      if (req.user.role !== 'inspector' && req.user.role !== 'admin') {
        res.status(403).json(errorResponse('无权限创建检测报告', 403))
        return
      }

      const data: Partial<Inspection> & { carId: number; inspectorId: number } = {
        ...rest,
        carId: parseInt(carId as string, 10),
        inspectorId: req.user.userId
      }

      const inspection = await createInspection(data)
      res.json(successResponse(inspection, '检测报告创建成功'))
    } catch (error) {
      const message = error instanceof Error ? error.message : '创建检测报告失败'
      res.status(400).json(errorResponse(message))
    }
  }
)

router.get(
  '/:id',
  authenticate,
  requirePermission('inspection', 'read'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id, 10)
      const inspection = await getInspectionById(id)

      if (!inspection) {
        res.status(404).json(errorResponse('检测报告不存在', 404))
        return
      }

      if (req.user?.role === 'inspector' && inspection.inspectorId !== req.user.userId) {
        res.status(403).json(errorResponse('无权限查看此检测报告', 403))
        return
      }

      res.json(successResponse(inspection))
    } catch (error) {
      const message = error instanceof Error ? error.message : '获取检测报告详情失败'
      res.status(400).json(errorResponse(message))
    }
  }
)

router.put(
  '/:id',
  authenticate,
  requirePermission('inspection', 'update'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id, 10)

      if (!req.user) {
        res.status(401).json(errorResponse('用户未认证', 401))
        return
      }

      if (req.user.role !== 'inspector' && req.user.role !== 'admin') {
        res.status(403).json(errorResponse('无权限更新检测报告', 403))
        return
      }

      const inspection = await updateInspection(id, req.body, req.user.userId)
      res.json(successResponse(inspection, '检测报告更新成功'))
    } catch (error) {
      const message = error instanceof Error ? error.message : '更新检测报告失败'
      res.status(400).json(errorResponse(message))
    }
  }
)

router.put(
  '/:id/submit',
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id, 10)

      if (!req.user) {
        res.status(401).json(errorResponse('用户未认证', 401))
        return
      }

      if (req.user.role !== 'inspector' && req.user.role !== 'admin') {
        res.status(403).json(errorResponse('无权限提交检测报告', 403))
        return
      }

      const inspection = await submitInspection(id, req.user.userId)
      res.json(successResponse(inspection, '检测报告提交成功'))
    } catch (error) {
      const message = error instanceof Error ? error.message : '提交检测报告失败'
      res.status(400).json(errorResponse(message))
    }
  }
)

router.put(
  '/:id/audit',
  authenticate,
  requirePermission('inspection', 'audit'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id, 10)
      const { approved, comment } = req.body

      if (approved === undefined || approved === null) {
        res.status(400).json(errorResponse('缺少审核结果'))
        return
      }

      if (!req.user) {
        res.status(401).json(errorResponse('用户未认证', 401))
        return
      }

      if (req.user.role !== 'admin') {
        res.status(403).json(errorResponse('无权限审核检测报告', 403))
        return
      }

      const inspection = await auditInspection(id, Boolean(approved), comment || '', req.user.userId)
      res.json(successResponse(inspection, `检测报告审核${approved ? '通过' : '拒绝'}`))
    } catch (error) {
      const message = error instanceof Error ? error.message : '审核检测报告失败'
      res.status(400).json(errorResponse(message))
    }
  }
)

export default router
