import { Router, type Request, type Response } from 'express'
import type { ApiResponse, CreditRecord } from '../../shared/types/index.js'
import {
  getAllRiders,
  getRiderById,
  getRiderLocationHistory,
} from '../services/riderService.js'
import { getDb } from '../db/database.js'

const router = Router()

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const riders = getAllRiders()

    const response: ApiResponse = {
      success: true,
      data: riders,
    }
    res.status(200).json(response)
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch riders',
    })
  }
})

router.get('/credit', async (req: Request, res: Response): Promise<void> => {
  try {
    const riderId = req.query.riderId as string | undefined
    const db = getDb()

    let records: CreditRecord[]
    if (riderId) {
      records = db
        .prepare('SELECT * FROM credit_records WHERE rider_id = ? ORDER BY created_at DESC')
        .all(riderId) as CreditRecord[]
    } else {
      records = db
        .prepare('SELECT * FROM credit_records ORDER BY created_at DESC LIMIT 100')
        .all() as CreditRecord[]
    }

    const response: ApiResponse = {
      success: true,
      data: records,
    }
    res.status(200).json(response)
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch credit records',
    })
  }
})

router.get('/:id/location', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const rider = getRiderById(id)

    if (!rider) {
      res.status(404).json({
        success: false,
        error: 'Rider not found',
      })
      return
    }

    const history = getRiderLocationHistory(id, 1)
    const latestLocation = history.length > 0 ? history[0] : null

    const response: ApiResponse = {
      success: true,
      data: {
        riderId: id,
        lat: latestLocation?.lat ?? rider.current_lat,
        lng: latestLocation?.lng ?? rider.current_lng,
        timestamp: latestLocation?.timestamp ?? new Date().toISOString(),
        status: rider.status,
      },
    }
    res.status(200).json(response)
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch rider location',
    })
  }
})

export default router
