import { Router, type Request, type Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import dayjs from 'dayjs'
import { getDb } from '../database.js'
import { authMiddleware, adminOnly } from '../middleware/auth.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const coupons = db.prepare(`
      SELECT * FROM coupons
      WHERE is_active = 1 AND valid_to > datetime('now', 'localtime') AND used_count < usage_limit
      ORDER BY created_at DESC
    `).all()

    res.json({ success: true, data: coupons })
  } catch (error) {
    console.error('List coupons error:', error)
    res.status(500).json({ success: false, error: '获取优惠券列表失败' })
  }
})

router.post('/', authMiddleware, adminOnly, (req: Request, res: Response): void => {
  try {
    const { code, type, discount_value, min_order_amount, valid_from, valid_to, usage_limit } = req.body

    if (!code || !type || !discount_value || !valid_from || !valid_to) {
      res.status(400).json({ success: false, error: '优惠券代码、类型、折扣值、有效期起止为必填项' })
      return
    }

    const db = getDb()
    const existing = db.prepare('SELECT id FROM coupons WHERE code = ?').get(code) as { id: string } | undefined
    if (existing) {
      res.status(409).json({ success: false, error: '优惠券代码已存在' })
      return
    }

    const id = uuidv4()
    const now = dayjs().format('YYYY-MM-DD HH:mm:ss')

    db.prepare(`
      INSERT INTO coupons (id, code, type, discount_value, min_order_amount, valid_from, valid_to, usage_limit, used_count, is_active, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 1, ?)
    `).run(id, code, type, discount_value, min_order_amount || 0, valid_from, valid_to, usage_limit || 100, now)

    const coupon = db.prepare('SELECT * FROM coupons WHERE id = ?').get(id)
    res.status(201).json({ success: true, data: coupon })
  } catch (error) {
    console.error('Create coupon error:', error)
    res.status(500).json({ success: false, error: '创建优惠券失败' })
  }
})

router.post('/claim/:id', authMiddleware, (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const coupon = db.prepare('SELECT * FROM coupons WHERE id = ?').get(req.params.id) as Record<string, unknown> | undefined
    if (!coupon) {
      res.status(404).json({ success: false, error: '优惠券不存在' })
      return
    }

    if (!coupon.is_active) {
      res.status(400).json({ success: false, error: '优惠券已停用' })
      return
    }

    if (dayjs(coupon.valid_to as string).isBefore(dayjs())) {
      res.status(400).json({ success: false, error: '优惠券已过期' })
      return
    }

    if ((coupon.used_count as number) >= (coupon.usage_limit as number)) {
      res.status(400).json({ success: false, error: '优惠券已被领完' })
      return
    }

    const existingClaim = db.prepare('SELECT id FROM user_coupons WHERE user_id = ? AND coupon_id = ?').get(req.user!.id, req.params.id) as { id: string } | undefined
    if (existingClaim) {
      res.status(409).json({ success: false, error: '您已领取过该优惠券' })
      return
    }

    const now = dayjs().format('YYYY-MM-DD HH:mm:ss')

    const claimCoupon = db.transaction(() => {
      db.prepare(`
        INSERT INTO user_coupons (id, user_id, coupon_id, status, used_at, created_at)
        VALUES (?, ?, ?, 'available', NULL, ?)
      `).run(uuidv4(), req.user!.id, req.params.id, now)

      db.prepare('UPDATE coupons SET used_count = used_count + 1 WHERE id = ?').run(req.params.id)
    })

    claimCoupon()

    res.json({ success: true, message: '领取成功' })
  } catch (error) {
    console.error('Claim coupon error:', error)
    res.status(500).json({ success: false, error: '领取优惠券失败' })
  }
})

router.get('/my-coupons', authMiddleware, (req: Request, res: Response): void => {
  try {
    const { status } = req.query
    const db = getDb()

    let sql = `
      SELECT uc.*, c.code, c.type, c.discount_value, c.min_order_amount, c.valid_from, c.valid_to
      FROM user_coupons uc
      LEFT JOIN coupons c ON uc.coupon_id = c.id
      WHERE uc.user_id = ?
    `
    const params: unknown[] = [req.user!.id]

    if (status) {
      sql += ' AND uc.status = ?'
      params.push(status)
    }

    sql += ' ORDER BY uc.created_at DESC'
    const coupons = db.prepare(sql).all(...params)

    res.json({ success: true, data: coupons })
  } catch (error) {
    console.error('List my coupons error:', error)
    res.status(500).json({ success: false, error: '获取我的优惠券失败' })
  }
})

router.post('/use/:id', authMiddleware, (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const userCoupon = db.prepare('SELECT * FROM user_coupons WHERE id = ? AND user_id = ?').get(req.params.id, req.user!.id) as Record<string, unknown> | undefined
    if (!userCoupon) {
      res.status(404).json({ success: false, error: '优惠券不存在' })
      return
    }

    if (userCoupon.status !== 'available') {
      res.status(400).json({ success: false, error: '优惠券已使用或已过期' })
      return
    }

    const coupon = db.prepare('SELECT * FROM coupons WHERE id = ?').get(userCoupon.coupon_id) as Record<string, unknown> | undefined
    if (coupon && dayjs(coupon.valid_to as string).isBefore(dayjs())) {
      db.prepare("UPDATE user_coupons SET status = 'expired' WHERE id = ?").run(req.params.id)
      res.status(400).json({ success: false, error: '优惠券已过期' })
      return
    }

    const now = dayjs().format('YYYY-MM-DD HH:mm:ss')
    db.prepare("UPDATE user_coupons SET status = 'used', used_at = ? WHERE id = ?").run(now, req.params.id)

    res.json({ success: true, message: '优惠券使用成功' })
  } catch (error) {
    console.error('Use coupon error:', error)
    res.status(500).json({ success: false, error: '使用优惠券失败' })
  }
})

export default router
