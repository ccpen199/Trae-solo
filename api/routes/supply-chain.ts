import { Router, type Request, type Response } from 'express'
import db from '../db.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  try {
    const { page = '1', pageSize = '10', enterprise_id, direction, product, status } = req.query
    const offset = (Number(page) - 1) * Number(pageSize)
    const limit = Number(pageSize)

    let whereClauses: string[] = []
    let params: any[] = []

    if (enterprise_id) {
      whereClauses.push('sc.enterprise_id = ?')
      params.push(enterprise_id)
    }
    if (direction) {
      whereClauses.push('sc.direction = ?')
      params.push(direction)
    }
    if (product) {
      whereClauses.push('sc.product LIKE ?')
      params.push(`%${product}%`)
    }
    if (status) {
      whereClauses.push('sc.status = ?')
      params.push(status)
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : ''

    const countStmt = db.prepare(`SELECT COUNT(*) as total FROM supply_chain sc ${whereSql}`)
    const { total } = countStmt.get(...params) as any

    const stmt = db.prepare(`
      SELECT sc.*, e.name as enterprise_name, e.industry as enterprise_industry
      FROM supply_chain sc 
      LEFT JOIN enterprises e ON sc.enterprise_id = e.id
      ${whereSql}
      ORDER BY sc.id DESC
      LIMIT ? OFFSET ?
    `)
    const items = stmt.all(...params, limit, offset)

    res.json({ success: true, data: { list: items, total, page: Number(page), pageSize: Number(pageSize) } })
  } catch (error) {
    console.error('Get supply chain items error:', error)
    res.status(500).json({ success: false, error: 'Failed to get supply chain items' })
  }
})

router.get('/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params

    const item = db.prepare(`
      SELECT sc.*, e.name as enterprise_name, e.industry as enterprise_industry, e.contact_phone as enterprise_phone
      FROM supply_chain sc 
      LEFT JOIN enterprises e ON sc.enterprise_id = e.id
      WHERE sc.id = ?
    `).get(id)

    if (!item) {
      res.status(404).json({ success: false, error: 'Supply chain item not found' })
      return
    }

    res.json({ success: true, data: item })
  } catch (error) {
    console.error('Get supply chain item detail error:', error)
    res.status(500).json({ success: false, error: 'Failed to get supply chain item' })
  }
})

router.post('/', (req: Request, res: Response): void => {
  try {
    const { enterprise_id, direction, product, quantity, price, unit, description, status } = req.body

    if (!enterprise_id || !direction || !product) {
      res.status(400).json({ success: false, error: 'enterprise_id, direction, and product are required' })
      return
    }

    const enterprise = db.prepare('SELECT id FROM enterprises WHERE id = ?').get(enterprise_id)
    if (!enterprise) {
      res.status(404).json({ success: false, error: 'Enterprise not found' })
      return
    }

    const stmt = db.prepare(`
      INSERT INTO supply_chain (enterprise_id, direction, product, quantity, price, unit, description, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)
    const result = stmt.run(
      enterprise_id,
      direction,
      product,
      quantity || null,
      price || null,
      unit || null,
      description || null,
      status || 'active'
    )

    const item = db.prepare('SELECT * FROM supply_chain WHERE id = ?').get(result.lastInsertRowid)
    res.json({ success: true, data: item })
  } catch (error) {
    console.error('Create supply chain item error:', error)
    res.status(500).json({ success: false, error: 'Failed to create supply chain item' })
  }
})

router.put('/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    const { direction, product, quantity, price, unit, description, status } = req.body

    const existing = db.prepare('SELECT id FROM supply_chain WHERE id = ?').get(id)
    if (!existing) {
      res.status(404).json({ success: false, error: 'Supply chain item not found' })
      return
    }

    const stmt = db.prepare(`
      UPDATE supply_chain 
      SET direction = ?, product = ?, quantity = ?, price = ?, unit = ?, description = ?, status = ?
      WHERE id = ?
    `)
    stmt.run(direction, product, quantity, price, unit, description, status, id)

    const item = db.prepare('SELECT * FROM supply_chain WHERE id = ?').get(id)
    res.json({ success: true, data: item })
  } catch (error) {
    console.error('Update supply chain item error:', error)
    res.status(500).json({ success: false, error: 'Failed to update supply chain item' })
  }
})

router.delete('/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params

    const existing = db.prepare('SELECT id FROM supply_chain WHERE id = ?').get(id)
    if (!existing) {
      res.status(404).json({ success: false, error: 'Supply chain item not found' })
      return
    }

    db.prepare('DELETE FROM supply_chain WHERE id = ?').run(id)
    res.json({ success: true, data: { message: 'Supply chain item deleted successfully' } })
  } catch (error) {
    console.error('Delete supply chain item error:', error)
    res.status(500).json({ success: false, error: 'Failed to delete supply chain item' })
  }
})

router.post('/match', (req: Request, res: Response): void => {
  try {
    const { supply_id, demand_id } = req.body

    if (!supply_id || !demand_id) {
      res.status(400).json({ success: false, error: 'supply_id and demand_id are required' })
      return
    }

    const supply = db.prepare('SELECT * FROM supply_chain WHERE id = ? AND direction = ?').get(supply_id, 'supply') as any
    if (!supply) {
      res.status(404).json({ success: false, error: 'Supply item not found' })
      return
    }

    const demand = db.prepare('SELECT * FROM supply_chain WHERE id = ? AND direction = ?').get(demand_id, 'demand') as any
    if (!demand) {
      res.status(404).json({ success: false, error: 'Demand item not found' })
      return
    }

    let matchScore = 0
    let matchDetails: string[] = []

    if (supply.product === demand.product) {
      matchScore += 50
      matchDetails.push('Product match')
    } else if (supply.product.includes(demand.product) || demand.product.includes(supply.product)) {
      matchScore += 30
      matchDetails.push('Product partial match')
    }

    if (supply.price && demand.price) {
      if (supply.price <= demand.price) {
        matchScore += 25
        matchDetails.push('Price compatible')
      } else if (supply.price <= demand.price * 1.1) {
        matchScore += 15
        matchDetails.push('Price within 10% range')
      }
    }

    if (supply.quantity && demand.quantity) {
      matchScore += 15
      matchDetails.push('Quantity information available')
    }

    if (supply.status === 'active' && demand.status === 'active') {
      matchScore += 10
      matchDetails.push('Both items active')
    }

    const supplyEnterprise = db.prepare('SELECT name, industry FROM enterprises WHERE id = ?').get(supply.enterprise_id)
    const demandEnterprise = db.prepare('SELECT name, industry FROM enterprises WHERE id = ?').get(demand.enterprise_id)

    res.json({
      success: true,
      data: {
        match_score: matchScore,
        match_details: matchDetails,
        supply: {
          ...supply,
          enterprise: supplyEnterprise
        },
        demand: {
          ...demand,
          enterprise: demandEnterprise
        }
      }
    })
  } catch (error) {
    console.error('Supply chain matching error:', error)
    res.status(500).json({ success: false, error: 'Failed to match supply and demand' })
  }
})

router.get('/match/recommendations/:item_id', (req: Request, res: Response): void => {
  try {
    const { item_id } = req.params

    const item = db.prepare('SELECT * FROM supply_chain WHERE id = ?').get(item_id) as any
    if (!item) {
      res.status(404).json({ success: false, error: 'Item not found' })
      return
    }

    const oppositeDirection = item.direction === 'supply' ? 'demand' : 'supply'

    const potentialMatches = db.prepare(`
      SELECT sc.*, e.name as enterprise_name, e.industry as enterprise_industry
      FROM supply_chain sc
      LEFT JOIN enterprises e ON sc.enterprise_id = e.id
      WHERE sc.direction = ? AND sc.status = 'active'
        AND (sc.product LIKE ? OR ? LIKE '%' || sc.product || '%')
      ORDER BY sc.id DESC
      LIMIT 10
    `).all(oppositeDirection, `%${item.product}%`, item.product)

    const scoredMatches = potentialMatches.map((match: any) => {
      let score = 0

      if (match.product === item.product) score += 50
      else if (match.product.includes(item.product) || item.product.includes(match.product)) score += 30

      if (match.price && item.price) {
        if (oppositeDirection === 'demand' && match.price <= item.price) score += 25
        else if (oppositeDirection === 'supply' && item.price <= match.price) score += 25
      }

      if (match.quantity && item.quantity) score += 15

      return {
        ...match,
        match_score: score
      }
    })

    scoredMatches.sort((a, b) => b.match_score - a.match_score)

    res.json({ success: true, data: scoredMatches })
  } catch (error) {
    console.error('Get supply chain recommendations error:', error)
    res.status(500).json({ success: false, error: 'Failed to get recommendations' })
  }
})

router.get('/statistics/summary', (req: Request, res: Response): void => {
  try {
    const supplyCount = db.prepare(`SELECT COUNT(*) as count FROM supply_chain WHERE direction = 'supply' AND status = 'active'`).get() as any
    const demandCount = db.prepare(`SELECT COUNT(*) as count FROM supply_chain WHERE direction = 'demand' AND status = 'active'`).get() as any

    const byDirection = db.prepare(`
      SELECT direction, COUNT(*) as count 
      FROM supply_chain 
      GROUP BY direction
    `).all()

    const topProducts = db.prepare(`
      SELECT product, COUNT(*) as count 
      FROM supply_chain 
      WHERE status = 'active'
      GROUP BY product 
      ORDER BY count DESC 
      LIMIT 10
    `).all()

    res.json({
      success: true,
      data: {
        active_supply: supplyCount.count,
        active_demand: demandCount.count,
        by_direction: byDirection,
        top_products: topProducts
      }
    })
  } catch (error) {
    console.error('Get supply chain statistics error:', error)
    res.status(500).json({ success: false, error: 'Failed to get statistics' })
  }
})

export default router
