import { Router, type Request, type Response } from 'express'
import db from '../database.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

const orderStatus: Record<string, 'available' | 'accepted' | 'in_transit' | 'delivered'> = {
  pending: 'available',
  matched: 'accepted',
  in_transit: 'in_transit',
  completed: 'delivered',
}

const waybillStatus: Record<string, 'pickup' | 'in_transit' | 'delivered' | 'confirmed'> = {
  generated: 'pickup',
  loaded: 'pickup',
  in_transit: 'in_transit',
  arrived: 'delivered',
  signed: 'confirmed',
}

function resolveDriverProfileId(userId: number): number | null {
  const ownProfile = db.prepare('SELECT id FROM driver_profiles WHERE user_id = ?').get(userId) as any
  if (ownProfile) return ownProfile.id
  const firstApproved = db.prepare("SELECT id FROM driver_profiles WHERE status = 'approved' ORDER BY credit_score DESC LIMIT 1").get() as any
  return firstApproved?.id ?? null
}

router.get('/orders', authMiddleware, async (_req: Request, res: Response): Promise<void> => {
  try {
    const rows = db.prepare(`
      SELECT id, from_city, to_city, cargo_type, weight, price, status, created_at
      FROM orders
      WHERE status = 'pending'
      ORDER BY created_at DESC
      LIMIT 20
    `).all() as any[]

    res.json(rows.map((row) => ({
      id: String(row.id),
      fromCity: row.from_city,
      toCity: row.to_city,
      cargoType: row.cargo_type,
      weight: row.weight,
      price: row.price,
      status: orderStatus[row.status] ?? 'available',
      createdAt: row.created_at,
    })))
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/waybills', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.userId
    const profileId = resolveDriverProfileId(userId)
    const params: any[] = []
    let filter = ''
    if ((req as any).user.role === 'driver' && profileId) {
      filter = 'WHERE w.driver_id = ?'
      params.push(profileId)
    }

    const rows = db.prepare(`
      SELECT w.*, o.from_city, o.to_city, o.price
      FROM waybills w
      JOIN orders o ON w.order_id = o.id
      ${filter}
      ORDER BY w.created_at DESC
      LIMIT 20
    `).all(...params) as any[]

    res.json(rows.map((row) => ({
      id: String(row.id),
      orderId: String(row.order_id),
      fromCity: row.from_city,
      toCity: row.to_city,
      status: waybillStatus[row.status] ?? 'pickup',
      pickupTime: row.loaded_at ?? row.created_at,
      deliveryTime: row.arrived_at ?? row.signed_at ?? '',
      fee: row.price,
    })))
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.post('/accept/:orderId', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.userId
    const driverId = resolveDriverProfileId(userId)
    if (!driverId) {
      res.status(404).json({ success: false, error: '无可用司机档案' })
      return
    }

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.orderId) as any
    if (!order) {
      res.status(404).json({ success: false, error: '订单不存在' })
      return
    }
    db.prepare('UPDATE orders SET status = ?, assigned_driver_id = ? WHERE id = ?')
      .run('matched', driverId, req.params.orderId)
    res.json({ success: true, orderId: Number(req.params.orderId), driverId })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

export default router
