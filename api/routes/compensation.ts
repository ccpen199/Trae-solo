import { Router, type Request, type Response } from 'express'
import type { ApiResponse, CompensationStatus, CompensationType } from '../../shared/types/index.js'
import {
  getAllCompensations,
  getCompensationsByStatus,
  createCompensation,
  processAutomaticCompensation,
  type CreateCompensationParams,
} from '../services/compensationService.js'
import { getDb, type Order } from '../db/database.js'

const router = Router()

router.get('/rules', async (req: Request, res: Response): Promise<void> => {
  try {
    const rules = {
      timeout: {
        thresholdMinutes: 30,
        baseAmount: 10,
        incrementalAmount: 5,
        incrementalInterval: 10,
        maxAmount: 50,
      },
      lost: {
        thresholdHours: 24,
        multiplier: 2,
        minAmount: 50,
        maxAmount: 200,
      },
      damaged: {
        baseAmount: 30,
      },
    }

    const response: ApiResponse = {
      success: true,
      data: rules,
    }
    res.status(200).json(response)
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch compensation rules',
    })
  }
})

router.get('/records', async (req: Request, res: Response): Promise<void> => {
  try {
    const status = req.query.status as CompensationStatus | undefined

    let records
    if (status) {
      records = getCompensationsByStatus(status)
    } else {
      records = getAllCompensations()
    }

    const response: ApiResponse = {
      success: true,
      data: records,
    }
    res.status(200).json(response)
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch compensation records',
    })
  }
})

router.post('/trigger', async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderId, type, reason, userId } = req.body as {
      orderId: string
      type: CompensationType
      reason: string
      userId?: string
    }

    if (!orderId || !type || !reason) {
      res.status(400).json({
        success: false,
        error: 'orderId, type and reason are required',
      })
      return
    }

    const db = getDb()
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId) as Order | undefined

    if (!order) {
      res.status(404).json({
        success: false,
        error: 'Order not found',
      })
      return
    }

    const effectiveUserId = userId ?? order.merchant_id

    const params: CreateCompensationParams = {
      order_id: orderId,
      user_id: effectiveUserId,
      type,
      reason,
    }

    const compensation = createCompensation(params)

    const response: ApiResponse = {
      success: true,
      data: compensation,
      message: 'Compensation triggered successfully',
    }
    res.status(201).json(response)
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to trigger compensation',
    })
  }
})

export default router
