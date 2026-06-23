import { Router, type Request, type Response } from 'express'
import db from '../db/index.js'

const router = Router()

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

router.get('/', (req: Request, res: Response): void => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const pageSize = parseInt(req.query.pageSize as string) || 10
    const status = req.query.status as string
    const userId = req.query.userId as string
    const startDate = req.query.startDate as string
    const endDate = req.query.endDate as string

    const offset = (page - 1) * pageSize

    const whereClauses: string[] = []
    const params: Record<string, unknown> = {}

    if (status) {
      whereClauses.push('b.status = @status')
      params.status = status
    }
    if (userId) {
      whereClauses.push('b.user_id = @userId')
      params.userId = userId
    }
    if (startDate) {
      whereClauses.push('b.period_start >= @startDate')
      params.startDate = startDate
    }
    if (endDate) {
      whereClauses.push('b.period_end <= @endDate')
      params.endDate = endDate
    }

    const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : ''

    const countStmt = db.prepare(`SELECT COUNT(*) as total FROM bills b ${whereClause}`)
    const { total } = countStmt.get(params) as { total: number }

    const listStmt = db.prepare(`
      SELECT b.*, u.name as user_name, u.account_no 
      FROM bills b
      LEFT JOIN users u ON b.user_id = u.id
      ${whereClause}
      ORDER BY b.period_end DESC
      LIMIT @limit OFFSET @offset
    `)
    const bills = listStmt.all({ ...params, limit: pageSize, offset }).map((item: { tiers: string }) => ({
      ...item,
      tiers: JSON.parse(item.tiers),
    }))

    res.json({
      success: true,
      data: {
        list: bills,
        total,
        page,
        pageSize,
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '获取账单列表失败',
    })
  }
})

router.get('/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params

    const stmt = db.prepare(`
      SELECT b.*, u.name as user_name, u.account_no, u.address, u.phone
      FROM bills b
      LEFT JOIN users u ON b.user_id = u.id
      WHERE b.id = ?
    `)
    const bill = stmt.get(id)

    if (!bill) {
      res.status(404).json({
        success: false,
        error: '账单不存在',
      })
      return
    }

    const billWithTiers = {
      ...(bill as Record<string, unknown>),
      tiers: JSON.parse((bill as { tiers: string }).tiers),
    }

    res.json({
      success: true,
      data: billWithTiers,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '获取账单详情失败',
    })
  }
})

router.post('/generate', (req: Request, res: Response): void => {
  try {
    const { period_start, period_end } = req.body

    if (!period_start || !period_end) {
      res.status(400).json({
        success: false,
        error: '缺少周期参数',
      })
      return
    }

    const userStmt = db.prepare('SELECT id, user_type FROM users WHERE status = ?')
    const users = userStmt.all('active') as Array<{ id: string; user_type: string }>

    const pricingStmt = db.prepare(`
      SELECT * FROM tiered_pricing_rules 
      WHERE user_type = ? AND status = 'active'
      LIMIT 1
    `)

    const meterStmt = db.prepare(`
      SELECT current_reading FROM meters 
      WHERE user_id = ? AND status = 'normal'
      LIMIT 1
    `)

    let generatedCount = 0

    const insertBill = db.prepare(`
      INSERT INTO bills (id, user_id, period_start, period_end, consumption, tiers, total_amount, status)
      VALUES (@id, @user_id, @period_start, @period_end, @consumption, @tiers, @total_amount, 'unpaid')
    `)

    const tx = db.transaction(() => {
      for (const user of users) {
        const pricing = pricingStmt.get(user.user_type) as { tiers: string } | undefined
        if (!pricing) continue

        const meter = meterStmt.get(user.id) as { current_reading: number } | undefined
        if (!meter) continue

        const tiers = JSON.parse(pricing.tiers) as Array<{
          tier: number
          rangeStart: number
          rangeEnd: number | null
          unitPrice: number
        }>

        const consumption = 25 + Math.floor(Math.random() * 35)
        let remaining = consumption
        let totalAmount = 0
        const billTiers: Array<{
          tier: number
          rangeStart: number
          rangeEnd: number | null
          unitPrice: number
          consumption: number
          amount: number
        }> = []

        for (const tier of tiers) {
          const tierRange = tier.rangeEnd !== null ? tier.rangeEnd - tier.rangeStart : remaining
          const tierConsumption = Math.min(remaining, tierRange)
          const amount = Math.round(tierConsumption * tier.unitPrice * 100) / 100
          totalAmount += amount
          remaining -= tierConsumption

          billTiers.push({
            tier: tier.tier,
            rangeStart: tier.rangeStart,
            rangeEnd: tier.rangeEnd,
            unitPrice: tier.unitPrice,
            consumption: tierConsumption,
            amount,
          })

          if (remaining <= 0) break
        }

        const id = generateId('bill')
        insertBill.run({
          id,
          user_id: user.id,
          period_start,
          period_end,
          consumption,
          tiers: JSON.stringify(billTiers),
          total_amount: Math.round(totalAmount * 100) / 100,
        })
        generatedCount++
      }
    })

    tx()

    res.json({
      success: true,
      data: {
        generated: generatedCount,
        period_start,
        period_end,
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '生成账单失败',
    })
  }
})

router.post('/:id/pay', (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    const { payment_method } = req.body

    const stmt = db.prepare('SELECT * FROM bills WHERE id = ?')
    const bill = stmt.get(id)

    if (!bill) {
      res.status(404).json({
        success: false,
        error: '账单不存在',
      })
      return
    }

    if ((bill as { status: string }).status === 'paid') {
      res.status(400).json({
        success: false,
        error: '账单已支付',
      })
      return
    }

    const updateStmt = db.prepare(`
      UPDATE bills SET status = 'paid', paid_date = @paid_date, payment_method = @payment_method
      WHERE id = @id
    `)
    updateStmt.run({
      id,
      paid_date: new Date().toISOString().split('T')[0],
      payment_method: payment_method || 'wechat',
    })

    const updatedBill = stmt.get(id)

    res.json({
      success: true,
      data: {
        ...(updatedBill as Record<string, unknown>),
        tiers: JSON.parse((updatedBill as { tiers: string }).tiers),
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '支付失败',
    })
  }
})

router.get('/user/:userId', (req: Request, res: Response): void => {
  try {
    const { userId } = req.params
    const page = parseInt(req.query.page as string) || 1
    const pageSize = parseInt(req.query.pageSize as string) || 10

    const offset = (page - 1) * pageSize

    const countStmt = db.prepare('SELECT COUNT(*) as total FROM bills WHERE user_id = ?')
    const { total } = countStmt.get(userId) as { total: number }

    const listStmt = db.prepare(`
      SELECT * FROM bills 
      WHERE user_id = ?
      ORDER BY period_end DESC
      LIMIT ? OFFSET ?
    `)
    const bills = listStmt.all(userId, pageSize, offset).map((item: { tiers: string }) => ({
      ...item,
      tiers: JSON.parse(item.tiers),
    }))

    res.json({
      success: true,
      data: {
        list: bills,
        total,
        page,
        pageSize,
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '获取用户账单失败',
    })
  }
})

export default router
