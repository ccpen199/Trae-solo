import { Router, type Response, type NextFunction } from 'express'
import db from '../db/index.js'
import { authenticateTokenOrDemo, AuthRequest } from '../middleware/auth.js'

const router = Router()

const products = [
  { id: 1, name: '深度清洁服务', name_en: 'Deep Cleaning Service', price: 250, category: 'cleaning', stock: 99 },
  { id: 2, name: '花园维护', name_en: 'Garden Maintenance', price: 180, category: 'maintenance', stock: 99 },
  { id: 3, name: '税务咨询', name_en: 'Tax Consultation', price: 300, category: 'professional', stock: 99 },
  { id: 4, name: '房屋保险(年度)', name_en: 'Landlord Insurance (Annual)', price: 1200, category: 'insurance', stock: 99 },
]

function getProfile(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const user = db.prepare(`
      SELECT id, email, full_name, role, phone, language, timezone, avatar_url, created_at
      FROM users
      WHERE id = ?
    `).get(req.user!.id)

    res.json({
      success: true,
      data: user,
    })
  } catch (e) {
    next(e)
  }
}

router.get('/users/profile', authenticateTokenOrDemo, getProfile)
router.get('/user/profile', authenticateTokenOrDemo, getProfile)

router.get('/products', authenticateTokenOrDemo, (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    res.json({
      success: true,
      data: products,
      pagination: {
        page: 1,
        pageSize: products.length,
        total: products.length,
        totalPages: 1,
      },
    })
  } catch (e) {
    next(e)
  }
})

router.get('/orders', authenticateTokenOrDemo, (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const limit = Math.max(1, Math.min(50, Number(req.query.limit || 20)))
    const orders = db.prepare(`
      SELECT id, order_no, order_type, items, total_amount, currency, payment_method,
             payment_status, shipping_address, shipping_tracking, status, ordered_at, created_at
      FROM mall_orders
      ORDER BY COALESCE(ordered_at, created_at) DESC
      LIMIT ?
    `).all(limit)

    res.json({
      success: true,
      data: orders,
      pagination: {
        page: 1,
        pageSize: limit,
        total: orders.length,
        totalPages: 1,
      },
    })
  } catch (e) {
    next(e)
  }
})

router.get('/cart', authenticateTokenOrDemo, (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    res.json({
      success: true,
      data: {
        items: [],
        total_items: 0,
        total_amount: 0,
        currency: 'AUD',
      },
    })
  } catch (e) {
    next(e)
  }
})

router.get('/teachers', (_req, res: Response) => {
  res.json({
    success: true,
    data: [
      { id: 1, name: '澳洲税务顾问', specialty: '税务申报', rating: 4.9 },
      { id: 2, name: '物业维护顾问', specialty: '维修与保险', rating: 4.8 },
    ],
  })
})

router.get('/courses', (_req, res: Response) => {
  res.json({
    success: true,
    data: [
      { id: 1, name: '澳洲房产持有成本指南', status: 'active' },
      { id: 2, name: '跨境税务合规清单', status: 'active' },
    ],
  })
})

router.get('/bookings', authenticateTokenOrDemo, (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const appointments = db.prepare(`
      SELECT id, provider_id, service_type, appointment_date, appointment_time, status, notes, created_at
      FROM appointments
      WHERE user_id = ?
      ORDER BY appointment_date DESC, appointment_time DESC
      LIMIT 20
    `).all(req.user!.id)

    res.json({
      success: true,
      data: appointments,
    })
  } catch (e) {
    next(e)
  }
})

export default router
