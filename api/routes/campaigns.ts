import { Router, type Request, type Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { getDb } from '../database.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  const db = getDb()
  const page = Math.max(1, parseInt(req.query.page as string) || 1)
  const pageSize = Math.min(50, Math.max(1, parseInt(req.query.pageSize as string) || 10))
  const status = req.query.status as string

  let where = 'WHERE 1=1'
  const params: unknown[] = []

  if (status) {
    where += ' AND status = ?'
    params.push(status)
  }

  const total = (db.prepare(`SELECT COUNT(*) as count FROM campaigns ${where}`).get(...params) as { count: number }).count
  const offset = (page - 1) * pageSize
  const items = db.prepare(`SELECT * FROM campaigns ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`).all(...params, pageSize, offset)

  const enrichedItems = items.map((c: Record<string, unknown>) => {
    const merchantIds = db.prepare('SELECT merchant_id FROM campaign_merchants WHERE campaign_id = ?').all(c.id) as Array<{ merchant_id: string }>
    const merchants = db.prepare(`SELECT id, name, category, street, lng, lat FROM merchants WHERE id IN (${merchantIds.map(() => '?').join(',')})`).all(...merchantIds.map(m => m.merchant_id))
    return { ...c, merchants }
  })

  res.json({
    code: 200,
    message: 'ok',
    data: { items: enrichedItems, total, page, pageSize },
  })
})

router.get('/:id', (req: Request, res: Response): void => {
  const db = getDb()
  const campaign = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(req.params.id) as Record<string, unknown> | undefined

  if (!campaign) {
    res.status(404).json({ code: 404, message: '活动不存在', data: null })
    return
  }

  const merchantIds = db.prepare('SELECT merchant_id FROM campaign_merchants WHERE campaign_id = ?').all(campaign.id) as Array<{ merchant_id: string }>
  const merchants = db.prepare(`SELECT id, name, category, street, lng, lat FROM merchants WHERE id IN (${merchantIds.map(() => '?').join(',')})`).all(...merchantIds.map(m => m.merchant_id))

  res.json({ code: 200, message: 'ok', data: { ...campaign, merchants } })
})

router.post('/', (req: Request, res: Response): void => {
  const db = getDb()
  const { name, description, start_time, end_time, cover_image, merchant_ids } = req.body

  if (!name) {
    res.status(400).json({ code: 400, message: '活动名称不能为空', data: null })
    return
  }

  const id = uuidv4()
  db.prepare(`
    INSERT INTO campaigns (id, name, description, start_time, end_time, status, cover_image)
    VALUES (?, ?, ?, ?, ?, 'draft', ?)
  `).run(id, name, description || '', start_time || '', end_time || '', cover_image || '')

  if (Array.isArray(merchant_ids)) {
    const insertCM = db.prepare('INSERT INTO campaign_merchants (id, campaign_id, merchant_id) VALUES (?, ?, ?)')
    for (const mid of merchant_ids) {
      const merchant = db.prepare('SELECT id FROM merchants WHERE id = ?').get(mid)
      if (merchant) {
        insertCM.run(uuidv4(), id, mid)
      }
    }
  }

  const campaign = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(id)
  res.status(201).json({ code: 201, message: 'ok', data: campaign })
})

router.put('/:id', (req: Request, res: Response): void => {
  const db = getDb()
  const campaign = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(req.params.id)
  if (!campaign) {
    res.status(404).json({ code: 404, message: '活动不存在', data: null })
    return
  }

  const { name, description, start_time, end_time, cover_image, merchant_ids } = req.body
  db.prepare(`
    UPDATE campaigns SET name = COALESCE(?, name), description = COALESCE(?, description),
    start_time = COALESCE(?, start_time), end_time = COALESCE(?, end_time),
    cover_image = COALESCE(?, cover_image) WHERE id = ?
  `).run(name, description, start_time, end_time, cover_image, req.params.id)

  if (Array.isArray(merchant_ids)) {
    db.prepare('DELETE FROM campaign_merchants WHERE campaign_id = ?').run(req.params.id)
    const insertCM = db.prepare('INSERT INTO campaign_merchants (id, campaign_id, merchant_id) VALUES (?, ?, ?)')
    for (const mid of merchant_ids) {
      const merchant = db.prepare('SELECT id FROM merchants WHERE id = ?').get(mid)
      if (merchant) {
        insertCM.run(uuidv4(), req.params.id, mid)
      }
    }
  }

  const updated = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(req.params.id)
  res.json({ code: 200, message: 'ok', data: updated })
})

router.put('/:id/status', (req: Request, res: Response): void => {
  const db = getDb()
  const { status } = req.body
  if (!['draft', 'active', 'ended'].includes(status)) {
    res.status(400).json({ code: 400, message: '无效的活动状态', data: null })
    return
  }

  const campaign = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(req.params.id)
  if (!campaign) {
    res.status(404).json({ code: 404, message: '活动不存在', data: null })
    return
  }

  db.prepare('UPDATE campaigns SET status = ? WHERE id = ?').run(status, req.params.id)
  const updated = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(req.params.id)
  res.json({ code: 200, message: 'ok', data: updated })
})

router.delete('/:id', (req: Request, res: Response): void => {
  const db = getDb()
  const campaign = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(req.params.id)
  if (!campaign) {
    res.status(404).json({ code: 404, message: '活动不存在', data: null })
    return
  }

  db.prepare('DELETE FROM campaign_merchants WHERE campaign_id = ?').run(req.params.id)
  db.prepare('DELETE FROM campaigns WHERE id = ?').run(req.params.id)
  res.json({ code: 200, message: 'ok', data: null })
})

router.get('/:id/stats', (req: Request, res: Response): void => {
  const db = getDb()
  const campaign = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(req.params.id) as Record<string, unknown> | undefined
  if (!campaign) {
    res.status(404).json({ code: 404, message: '活动不存在', data: null })
    return
  }

  const merchantIds = db.prepare('SELECT merchant_id FROM campaign_merchants WHERE campaign_id = ?').all(campaign.id) as Array<{ merchant_id: string }>

  let totalOrders = 0
  let totalRevenue = 0
  let totalVerified = 0
  const merchantStats: Array<{ id: string; name: string; category: string; orders: number; revenue: number; verified: number }> = []

  for (const { merchant_id } of merchantIds) {
    const m = db.prepare('SELECT id, name, category FROM merchants WHERE id = ?').get(merchant_id) as Record<string, unknown> | undefined
    if (!m) continue

    const orderStat = db.prepare(`
      SELECT COUNT(*) as cnt, COALESCE(SUM(amount), 0) as rev,
        SUM(CASE WHEN status = 'used' THEN 1 ELSE 0 END) as ver
      FROM orders WHERE merchant_id = ? AND status IN ('paid', 'used')
    `).get(merchant_id) as { cnt: number; rev: number; ver: number }

    totalOrders += orderStat.cnt
    totalRevenue += orderStat.rev
    totalVerified += orderStat.ver

    merchantStats.push({
      id: merchant_id,
      name: m.name as string,
      category: m.category as string,
      orders: orderStat.cnt,
      revenue: orderStat.rev,
      verified: orderStat.ver,
    })
  }

  const verificationRate = totalOrders > 0 ? Number((totalVerified / totalOrders * 100).toFixed(1)) : 0

  res.json({
    code: 200,
    message: 'ok',
    data: {
      campaignId: campaign.id,
      campaignName: campaign.name,
      status: campaign.status,
      startTime: campaign.start_time,
      endTime: campaign.end_time,
      merchantCount: merchantIds.length,
      totalOrders,
      totalRevenue,
      totalVerified,
      verificationRate,
      merchantStats,
    },
  })
})

export default router
