import { Router, type Request, type Response } from 'express'
import type { ApiResponse, Order, Rider } from '../../shared/types/index.js'
import { getDb } from '../db/database.js'

const router = Router()

router.get('/capacity', async (req: Request, res: Response): Promise<void> => {
  try {
    const db = getDb()
    const riders = db.prepare("SELECT * FROM riders WHERE status != 'offline'").all() as Rider[]

    const heatmapData = riders.map((rider) => ({
      riderId: rider.id,
      lat: rider.current_lat,
      lng: rider.current_lng,
      status: rider.status,
      creditScore: rider.credit_score,
      weight: rider.status === 'online' ? 1 : rider.status === 'busy' ? 0.5 : 0.2,
    }))

    const response: ApiResponse = {
      success: true,
      data: heatmapData,
    }
    res.status(200).json(response)
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch capacity heatmap',
    })
  }
})

router.get('/orders', async (req: Request, res: Response): Promise<void> => {
  try {
    const db = getDb()
    const status = req.query.status as string | undefined

    let query = 'SELECT * FROM orders WHERE 1=1'
    const params: unknown[] = []

    if (status) {
      query += ' AND status = ?'
      params.push(status)
    } else {
      query += " AND status IN ('pending', 'assigned', 'picked', 'picked_up', 'in_transit', 'delivering')"
    }

    query += ' ORDER BY created_at DESC LIMIT 100'

    const orders = db.prepare(query).all(...params) as Order[]

    const heatmapData = orders.map((order) => ({
      orderId: order.id,
      orderNo: order.order_no,
      pickupLat: order.pickup_lat,
      pickupLng: order.pickup_lng,
      deliveryLat: order.delivery_lat,
      deliveryLng: order.delivery_lng,
      status: order.status,
      isAbnormal: order.is_abnormal,
      weight: order.status === 'pending' ? 1 : order.status === 'exception' ? 1.5 : 0.5,
    }))

    const response: ApiResponse = {
      success: true,
      data: heatmapData,
    }
    res.status(200).json(response)
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch orders heatmap',
    })
  }
})

export default router
