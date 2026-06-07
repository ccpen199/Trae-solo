import { Router, type Request, type Response } from 'express'
import db from '../database.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

router.get('/:bargainingId', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const bargaining = db.prepare(`
      SELECT b.*, o.from_city, o.to_city, o.cargo_type, o.weight, o.mode,
             u.name as driver_name, u.phone as driver_phone
      FROM bargainings b
      JOIN orders o ON b.order_id = o.id
      JOIN driver_profiles dp ON b.driver_id = dp.id
      JOIN users u ON dp.user_id = u.id
      WHERE b.id = ?
    `).get(req.params.bargainingId) as any
    if (!bargaining) {
      res.status(404).json({ success: false, error: '议价记录不存在' })
      return
    }
    const routePrice = db.prepare('SELECT current_price, base_price FROM route_prices WHERE from_city = ? AND to_city = ?')
      .get(bargaining.from_city, bargaining.to_city) as any
    res.json({
      success: true,
      bargaining: {
        ...bargaining,
        offers: JSON.parse(bargaining.offers || '[]'),
        marketPrice: routePrice ? routePrice.current_price : bargaining.shipper_price,
        basePrice: routePrice ? routePrice.base_price : bargaining.shipper_price,
      },
    })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.post('/:bargainingId/offer', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.userId
    const userRole = (req as any).user.role
    const { price, message } = req.body
    const bargaining = db.prepare('SELECT * FROM bargainings WHERE id = ?').get(req.params.bargainingId) as any
    if (!bargaining) {
      res.status(404).json({ success: false, error: '议价记录不存在' })
      return
    }
    if (bargaining.status !== 'negotiating') {
      res.status(400).json({ success: false, error: '议价已结束' })
      return
    }
    const offers = JSON.parse(bargaining.offers || '[]')
    offers.push({ role: userRole, price, message, time: new Date().toISOString() })

    if (userRole === 'shipper') {
      db.prepare('UPDATE bargainings SET shipper_price = ?, offers = ? WHERE id = ?')
        .run(price, JSON.stringify(offers), req.params.bargainingId)
    } else {
      db.prepare('UPDATE bargainings SET driver_price = ?, offers = ? WHERE id = ?')
        .run(price, JSON.stringify(offers), req.params.bargainingId)
    }
    res.json({ success: true, currentPrice: price, status: 'negotiating' })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.post('/:bargainingId/accept', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const bargaining = db.prepare('SELECT * FROM bargainings WHERE id = ?').get(req.params.bargainingId) as any
    if (!bargaining) {
      res.status(404).json({ success: false, error: '议价记录不存在' })
      return
    }
    if (bargaining.status !== 'negotiating') {
      res.status(400).json({ success: false, error: '议价已结束' })
      return
    }
    const agreedPrice = bargaining.driver_price || bargaining.shipper_price
    db.prepare('UPDATE bargainings SET agreed_price = ?, status = ? WHERE id = ?')
      .run(agreedPrice, 'agreed', req.params.bargainingId)
    db.prepare('UPDATE orders SET status = ?, assigned_driver_id = ? WHERE id = ?')
      .run('matched', bargaining.driver_id, bargaining.order_id)
    res.json({ success: true, orderId: bargaining.order_id, agreedPrice })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

export default router
