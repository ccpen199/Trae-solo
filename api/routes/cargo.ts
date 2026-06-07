import { Router, type Request, type Response } from 'express'
import db from '../database.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

const modeLabels: Record<string, string> = {
  ftl: '整车',
  ltl: '零担',
  partial: '拼车',
}

const statusLabels: Record<string, 'pending' | 'active' | 'completed' | 'cancelled'> = {
  pending: 'pending',
  matched: 'active',
  in_transit: 'active',
  completed: 'completed',
  cancelled: 'cancelled',
}

router.get('/list', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const role = (req as any).user.role
    const userId = (req as any).user.userId
    let sql = `
      SELECT o.*, u.name as driver_name
      FROM orders o
      LEFT JOIN driver_profiles dp ON o.assigned_driver_id = dp.id
      LEFT JOIN users u ON dp.user_id = u.id
      WHERE 1=1
    `
    const params: any[] = []
    if (role === 'shipper') {
      sql += ' AND o.shipper_id = ?'
      params.push(userId)
    }
    sql += ' ORDER BY o.created_at DESC LIMIT 50'

    const rows = db.prepare(sql).all(...params) as any[]
    const cargo = rows.map((row) => ({
      id: String(row.id),
      fromCity: row.from_city,
      toCity: row.to_city,
      cargoType: row.cargo_type,
      weight: row.weight,
      mode: modeLabels[row.mode] ?? row.mode,
      price: row.price,
      status: statusLabels[row.status] ?? 'pending',
      createdAt: row.created_at,
      driverName: row.driver_name ?? undefined,
    }))
    res.json(cargo)
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

export default router
