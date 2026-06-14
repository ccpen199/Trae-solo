import getDatabase from '../config/database.js'
import { toCamelCase } from './utils.js'
import type { VolunteerPlan, PlanItem } from '../../shared/types/index.js'

interface PlanWithItems extends VolunteerPlan {
  items: PlanItem[]
}

const volunteerPlanRepository = {
  findById(id: number): VolunteerPlan | null {
    const db = getDatabase()
    const stmt = db.prepare('SELECT * FROM volunteer_plans WHERE id = ?')
    const row = stmt.get(id)
    return row ? toCamelCase<VolunteerPlan>(row) : null
  },

  findByIdWithItems(id: number): PlanWithItems | null {
    const db = getDatabase()
    const planStmt = db.prepare('SELECT * FROM volunteer_plans WHERE id = ?')
    const planRow = planStmt.get(id)
    if (!planRow) return null

    const itemsStmt = db.prepare('SELECT * FROM plan_items WHERE plan_id = ? ORDER BY order_index')
    const itemRows = itemsStmt.all(id)

    const plan = toCamelCase<VolunteerPlan>(planRow)
    const items = toCamelCase<PlanItem[]>(itemRows)

    return {
      ...plan,
      items
    }
  },

  findByUserId(userId: number): VolunteerPlan[] {
    const db = getDatabase()
    const stmt = db.prepare('SELECT * FROM volunteer_plans WHERE user_id = ? ORDER BY id DESC')
    const rows = stmt.all(userId)
    return toCamelCase<VolunteerPlan[]>(rows)
  },

  findAll(): VolunteerPlan[] {
    const db = getDatabase()
    const stmt = db.prepare('SELECT * FROM volunteer_plans ORDER BY id')
    const rows = stmt.all()
    return toCamelCase<VolunteerPlan[]>(rows)
  },

  create(data: Omit<VolunteerPlan, 'id' | 'createdAt' | 'items'> & { items?: Omit<PlanItem, 'id' | 'planId' | 'createdAt'>[] }): number {
    const db = getDatabase()
    const insertPlan = db.prepare(`
      INSERT INTO volunteer_plans (user_id, name, slip_risk, adjustment_risk, conflict_warnings)
      VALUES (@userId, @name, @slipRisk, @adjustmentRisk, @conflictWarnings)
    `)

    const insertItem = db.prepare(`
      INSERT INTO plan_items (plan_id, university_id, major_id, order_index, tier, probability, match_reasons)
      VALUES (@planId, @universityId, @majorId, @order, @tier, @probability, @matchReasons)
    `)

    const createTransaction = db.transaction((planData: {
      userId: number
      name: string
      slipRisk?: number
      adjustmentRisk?: number
      conflictWarnings: string[]
      items?: Omit<PlanItem, 'id' | 'planId' | 'createdAt'>[]
    }) => {
      const planResult = insertPlan.run({
        userId: data.userId,
        name: data.name,
        slipRisk: data.slipRisk ?? 0,
        adjustmentRisk: data.adjustmentRisk ?? 0,
        conflictWarnings: JSON.stringify(data.conflictWarnings || [])
      })
      const planId = Number(planResult.lastInsertRowid)

      if (planData.items && planData.items.length > 0) {
        for (const item of planData.items) {
          insertItem.run({
            planId,
            universityId: item.universityId,
            majorId: item.majorId,
            order: item.order,
            tier: item.tier,
            probability: item.probability ?? 0,
            matchReasons: JSON.stringify(item.matchReasons || [])
          })
        }
      }

      return planId
    })

    return createTransaction(data)
  },

  update(id: number, data: Partial<Omit<VolunteerPlan, 'id' | 'createdAt' | 'items'>>): boolean {
    const db = getDatabase()
    const fields: string[] = []
    const params: Record<string, unknown> = { id }

    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
        fields.push(`${snakeKey} = @${key}`)
        if (key === 'conflictWarnings' && Array.isArray(value)) {
          params[key] = JSON.stringify(value)
        } else {
          params[key] = value
        }
      }
    }

    if (fields.length === 0) return false

    const stmt = db.prepare(`UPDATE volunteer_plans SET ${fields.join(', ')} WHERE id = @id`)
    const result = stmt.run(params)
    return result.changes > 0
  },

  updateItems(planId: number, items: Omit<PlanItem, 'id' | 'planId' | 'createdAt'>[]): boolean {
    const db = getDatabase()

    const deleteItems = db.prepare('DELETE FROM plan_items WHERE plan_id = ?')
    const insertItem = db.prepare(`
      INSERT INTO plan_items (plan_id, university_id, major_id, order_index, tier, probability, match_reasons)
      VALUES (@planId, @universityId, @majorId, @order, @tier, @probability, @matchReasons)
    `)

    const updateTransaction = db.transaction(() => {
      deleteItems.run(planId)
      for (const item of items) {
        insertItem.run({
          planId,
          universityId: item.universityId,
          majorId: item.majorId,
          order: item.order,
          tier: item.tier,
          probability: item.probability,
          matchReasons: JSON.stringify(item.matchReasons || [])
        })
      }
    })

    updateTransaction()
    return true
  },

  addItem(planId: number, item: Omit<PlanItem, 'id' | 'planId' | 'createdAt'>): number {
    const db = getDatabase()
    const stmt = db.prepare(`
      INSERT INTO plan_items (plan_id, university_id, major_id, order_index, tier, probability, match_reasons)
      VALUES (@planId, @universityId, @majorId, @order, @tier, @probability, @matchReasons)
    `)
    const result = stmt.run({
      planId,
      universityId: item.universityId,
      majorId: item.majorId,
      order: item.order,
      tier: item.tier,
      probability: item.probability,
      matchReasons: JSON.stringify(item.matchReasons || [])
    })
    return Number(result.lastInsertRowid)
  },

  removeItem(itemId: number): boolean {
    const db = getDatabase()
    const stmt = db.prepare('DELETE FROM plan_items WHERE id = ?')
    const result = stmt.run(itemId)
    return result.changes > 0
  },

  delete(id: number): boolean {
    const db = getDatabase()
    const deleteItems = db.prepare('DELETE FROM plan_items WHERE plan_id = ?')
    const deletePlan = db.prepare('DELETE FROM volunteer_plans WHERE id = ?')

    const deleteTransaction = db.transaction((planId: number) => {
      deleteItems.run(planId)
      deletePlan.run(planId)
    })

    deleteTransaction(id)
    return true
  }
}

export default volunteerPlanRepository
