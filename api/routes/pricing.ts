import { Router, type Request, type Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { getDb } from '../db/init.js'

const router = Router()

router.get('/rules', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const { category, enabled } = req.query

    let sql = `SELECT r.*, (SELECT COUNT(*) FROM pricing_conditions c WHERE c.rule_id = r.id) as condition_count FROM pricing_rules r WHERE 1=1`
    const params: unknown[] = []

    if (category) {
      sql += ` AND r.category = ?`
      params.push(category)
    }
    if (enabled !== undefined) {
      sql += ` AND r.enabled = ?`
      params.push(Number(enabled))
    }

    sql += ` ORDER BY r.priority DESC, r.created_at DESC`
    const rules = db.prepare(sql).all(...params)

    res.json({ success: true, data: rules })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取定价规则失败' })
  }
})

router.post('/rules', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const { name, category, type, price_modifier, enabled, priority, conditions } = req.body

    if (!name || !category || !type || price_modifier === undefined) {
      res.status(400).json({ success: false, error: '缺少必填字段' })
      return
    }

    const id = uuidv4()
    db.prepare(`INSERT INTO pricing_rules (id, name, category, type, price_modifier, enabled, priority) VALUES (?, ?, ?, ?, ?, ?, ?)`).run(
      id, name, category, type, price_modifier, enabled !== undefined ? enabled : 1, priority || 0
    )

    if (conditions && Array.isArray(conditions)) {
      for (const cond of conditions) {
        db.prepare(`INSERT INTO pricing_conditions (id, rule_id, field, operator, value) VALUES (?, ?, ?, ?, ?)`).run(
          uuidv4(), id, cond.field, cond.operator, cond.value
        )
      }
    }

    const rule = db.prepare(`SELECT * FROM pricing_rules WHERE id = ?`).get(id) as Record<string, unknown>
    const ruleConditions = db.prepare(`SELECT * FROM pricing_conditions WHERE rule_id = ?`).all(id)

    res.status(201).json({ success: true, data: { ...rule, conditions: ruleConditions } })
  } catch (error) {
    res.status(500).json({ success: false, error: '创建定价规则失败' })
  }
})

router.put('/rules/:id', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const { id } = req.params
    const { name, category, type, price_modifier, enabled, priority, conditions } = req.body

    const existing = db.prepare(`SELECT * FROM pricing_rules WHERE id = ?`).get(id)
    if (!existing) {
      res.status(404).json({ success: false, error: '规则不存在' })
      return
    }

    const updates: string[] = []
    const params: unknown[] = []

    if (name !== undefined) { updates.push('name = ?'); params.push(name) }
    if (category !== undefined) { updates.push('category = ?'); params.push(category) }
    if (type !== undefined) { updates.push('type = ?'); params.push(type) }
    if (price_modifier !== undefined) { updates.push('price_modifier = ?'); params.push(price_modifier) }
    if (enabled !== undefined) { updates.push('enabled = ?'); params.push(enabled) }
    if (priority !== undefined) { updates.push('priority = ?'); params.push(priority) }

    if (updates.length > 0) {
      params.push(id)
      db.prepare(`UPDATE pricing_rules SET ${updates.join(', ')} WHERE id = ?`).run(...params)
    }

    if (conditions && Array.isArray(conditions)) {
      db.prepare(`DELETE FROM pricing_conditions WHERE rule_id = ?`).run(id)
      for (const cond of conditions) {
        db.prepare(`INSERT INTO pricing_conditions (id, rule_id, field, operator, value) VALUES (?, ?, ?, ?, ?)`).run(
          uuidv4(), id, cond.field, cond.operator, cond.value
        )
      }
    }

    const rule = db.prepare(`SELECT * FROM pricing_rules WHERE id = ?`).get(id) as Record<string, unknown>
    const ruleConditions = db.prepare(`SELECT * FROM pricing_conditions WHERE rule_id = ?`).all(id)

    res.json({ success: true, data: { ...rule, conditions: ruleConditions } })
  } catch (error) {
    res.status(500).json({ success: false, error: '更新定价规则失败' })
  }
})

router.post('/calculate', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const { order_id, category, items } = req.body

    let targetCategory = category
    let orderItems: { brand?: string; model?: string; condition?: string; weight?: number }[] = items || []

    if (order_id) {
      const order = db.prepare(`SELECT category FROM orders WHERE id = ?`).get(order_id) as { category: string } | undefined
      if (!order) {
        res.status(404).json({ success: false, error: '订单不存在' })
        return
      }
      targetCategory = order.category
      orderItems = db.prepare(`SELECT * FROM order_items WHERE order_id = ?`).all(order_id) as { brand?: string; model?: string; condition?: string; weight?: number }[]
    }

    if (!targetCategory || orderItems.length === 0) {
      res.status(400).json({ success: false, error: '缺少品类或物品信息' })
      return
    }

    const rules = db.prepare(`SELECT r.*, 
      (SELECT json_group_array(json_object('field', c.field, 'operator', c.operator, 'value', c.value)) 
       FROM pricing_conditions c WHERE c.rule_id = r.id) as conditions
      FROM pricing_rules r WHERE r.category = ? AND r.enabled = 1 ORDER BY r.priority DESC`).all(targetCategory)

    let totalPrice = 0
    const itemResults = []

    for (const item of orderItems) {
      let itemPrice = 0
      const appliedRules: { name: string; modifier: number; type: string }[] = []

      if (targetCategory === 'phone') {
        const modelPrices: Record<string, number> = {
          'iPhone 13': 2150, 'iPhone 14': 3000, 'iPhone 15': 4000,
          'Mate 60': 2650, 'P60': 1850, 'Redmi Note 12': 450,
          'Reno 10': 700, 'X100': 1150, 'Galaxy S23': 1700,
        }
        const base = modelPrices[item.model || ''] || 800
        const condMult: Record<string, number> = { '全新': 1.8, '九成新': 1.4, '八成新': 1.0, '七成新': 0.6, '六成新': 0.35 }
        itemPrice = base * (condMult[item.condition || '八成新'] || 1.0)
      } else if (targetCategory === 'book') {
        const basePerKg = 2.0
        const weight = item.weight || 0.5
        const condMult: Record<string, number> = { '全新': 1.6, '九成新': 1.3, '八成新': 1.0, '七成新': 0.6, '六成新': 0.4 }
        itemPrice = basePerKg * weight * (condMult[item.condition || '八成新'] || 1.0)
      } else {
        const basePerKg = 3.0
        const weight = item.weight || 1
        const brandMult: Record<string, number> = { 'Nike': 1.8, 'Adidas': 1.7, '优衣库': 1.3, '波司登': 2.0, '李宁': 1.5 }
        const condMult: Record<string, number> = { '全新': 1.5, '九成新': 1.2, '八成新': 1.0, '七成新': 0.7, '六成新': 0.5 }
        itemPrice = basePerKg * weight * (brandMult[item.brand || ''] || 1.0) * (condMult[item.condition || '八成新'] || 1.0)
      }

      for (const rule of rules as Record<string, unknown>[]) {
        if (rule.type === 'weight' && item.weight) {
          itemPrice *= rule.price_modifier as number
          appliedRules.push({ name: rule.name as string, modifier: rule.price_modifier as number, type: rule.type as string })
        } else if (rule.type === 'market' && item.brand) {
          const condStr = rule.conditions as string
          try {
            const conds = JSON.parse(condStr)
            const brandCond = conds.find((c: { field: string }) => c.field === 'brand')
            if (brandCond && (brandCond.operator === '=' && brandCond.value === item.brand ||
                brandCond.operator === 'IN' && brandCond.value.split(',').includes(item.brand || ''))) {
              itemPrice *= rule.price_modifier as number
              appliedRules.push({ name: rule.name as string, modifier: rule.price_modifier as number, type: rule.type as string })
            }
          } catch {}
        }
      }

      totalPrice += itemPrice
      itemResults.push({
        item,
        price: Math.round(itemPrice * 100) / 100,
        applied_rules: appliedRules,
      })
    }

    res.json({
      success: true,
      data: {
        total_price: Math.round(totalPrice * 100) / 100,
        currency: 'CNY',
        category: targetCategory,
        item_count: orderItems.length,
        items: itemResults,
        rules_evaluated: rules.length,
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '计算价格失败' })
  }
})

export default router
