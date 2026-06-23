import { Router, type Request, type Response } from 'express'
import db from '../db/index.js'

const router = Router()

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

router.get('/', (req: Request, res: Response): void => {
  try {
    const userType = req.query.userType as string
    const status = req.query.status as string

    const whereClauses: string[] = []
    const params: Record<string, unknown> = {}

    if (userType) {
      whereClauses.push('user_type = @userType')
      params.userType = userType
    }
    if (status) {
      whereClauses.push('status = @status')
      params.status = status
    }

    const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : ''

    const stmt = db.prepare(`
      SELECT * FROM tiered_pricing_rules 
      ${whereClause}
      ORDER BY effective_from DESC
    `)
    const rules = stmt.all(params).map((item: { tiers: string }) => ({
      ...item,
      tiers: JSON.parse(item.tiers),
    }))

    res.json({
      success: true,
      data: rules,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '获取计价规则失败',
    })
  }
})

router.get('/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params

    const stmt = db.prepare('SELECT * FROM tiered_pricing_rules WHERE id = ?')
    const rule = stmt.get(id)

    if (!rule) {
      res.status(404).json({
        success: false,
        error: '计价规则不存在',
      })
      return
    }

    const ruleWithTiers = {
      ...(rule as Record<string, unknown>),
      tiers: JSON.parse((rule as { tiers: string }).tiers),
    }

    res.json({
      success: true,
      data: ruleWithTiers,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '获取计价规则失败',
    })
  }
})

router.post('/', (req: Request, res: Response): void => {
  try {
    const { name, user_type, tiers, effective_from, effective_to, status } = req.body

    if (!name || !user_type || !tiers || !effective_from) {
      res.status(400).json({
        success: false,
        error: '缺少必填字段',
      })
      return
    }

    if (!Array.isArray(tiers) || tiers.length === 0) {
      res.status(400).json({
        success: false,
        error: '阶梯数据格式错误',
      })
      return
    }

    const id = generateId('pricing')

    const insertStmt = db.prepare(`
      INSERT INTO tiered_pricing_rules (id, name, user_type, tiers, effective_from, effective_to, status)
      VALUES (@id, @name, @user_type, @tiers, @effective_from, @effective_to, @status)
    `)
    insertStmt.run({
      id,
      name,
      user_type,
      tiers: JSON.stringify(tiers),
      effective_from,
      effective_to: effective_to || null,
      status: status || 'draft',
    })

    const stmt = db.prepare('SELECT * FROM tiered_pricing_rules WHERE id = ?')
    const rule = stmt.get(id)

    res.json({
      success: true,
      data: {
        ...(rule as Record<string, unknown>),
        tiers: JSON.parse((rule as { tiers: string }).tiers),
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '创建计价规则失败',
    })
  }
})

router.patch('/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    const { name, user_type, tiers, effective_from, effective_to, status } = req.body

    const checkStmt = db.prepare('SELECT id FROM tiered_pricing_rules WHERE id = ?')
    const existing = checkStmt.get(id)

    if (!existing) {
      res.status(404).json({
        success: false,
        error: '计价规则不存在',
      })
      return
    }

    const updates: string[] = []
    const params: Record<string, unknown> = { id }

    if (name !== undefined) {
      updates.push('name = @name')
      params.name = name
    }
    if (user_type !== undefined) {
      updates.push('user_type = @user_type')
      params.user_type = user_type
    }
    if (tiers !== undefined) {
      updates.push('tiers = @tiers')
      params.tiers = JSON.stringify(tiers)
    }
    if (effective_from !== undefined) {
      updates.push('effective_from = @effective_from')
      params.effective_from = effective_from
    }
    if (effective_to !== undefined) {
      updates.push('effective_to = @effective_to')
      params.effective_to = effective_to
    }
    if (status !== undefined) {
      updates.push('status = @status')
      params.status = status
    }

    if (updates.length === 0) {
      res.status(400).json({
        success: false,
        error: '没有需要更新的字段',
      })
      return
    }

    const updateStmt = db.prepare(`
      UPDATE tiered_pricing_rules SET ${updates.join(', ')} WHERE id = @id
    `)
    updateStmt.run(params)

    const stmt = db.prepare('SELECT * FROM tiered_pricing_rules WHERE id = ?')
    const rule = stmt.get(id)

    res.json({
      success: true,
      data: {
        ...(rule as Record<string, unknown>),
        tiers: JSON.parse((rule as { tiers: string }).tiers),
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '更新计价规则失败',
    })
  }
})

router.post('/simulate', (req: Request, res: Response): void => {
  try {
    const { consumption, rule_id } = req.body

    if (consumption === undefined || !rule_id) {
      res.status(400).json({
        success: false,
        error: '缺少参数',
      })
      return
    }

    const stmt = db.prepare('SELECT * FROM tiered_pricing_rules WHERE id = ?')
    const rule = stmt.get(rule_id)

    if (!rule) {
      res.status(404).json({
        success: false,
        error: '计价规则不存在',
      })
      return
    }

    const tiers = JSON.parse((rule as { tiers: string }).tiers) as Array<{
      tier: number
      rangeStart: number
      rangeEnd: number | null
      unitPrice: number
    }>

    let remaining = consumption
    let totalAmount = 0
    const details: Array<{
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

      details.push({
        tier: tier.tier,
        rangeStart: tier.rangeStart,
        rangeEnd: tier.rangeEnd,
        unitPrice: tier.unitPrice,
        consumption: tierConsumption,
        amount,
      })

      if (remaining <= 0) break
    }

    res.json({
      success: true,
      data: {
        consumption,
        total_amount: Math.round(totalAmount * 100) / 100,
        rule_id,
        rule_name: (rule as { name: string }).name,
        tier_details: details,
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '模拟计算失败',
    })
  }
})

export default router
