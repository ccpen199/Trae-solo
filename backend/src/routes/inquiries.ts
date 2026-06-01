import { Router, Request, Response } from 'express'
import db from '../db'

const router = Router()

router.get('/', (req: Request, res: Response) => {
  const inquiries = db.prepare(`
    SELECT i.*, c.name as customer_name, c.company as customer_company
    FROM inquiries i
    LEFT JOIN customers c ON i.customer_id = c.id
    ORDER BY i.created_at DESC
  `).all()
  res.json(inquiries)
})

router.get('/:id', (req: Request, res: Response) => {
  const inquiry = db.prepare(`
    SELECT i.*, c.name as customer_name, c.company as customer_company, c.industry as customer_industry
    FROM inquiries i
    LEFT JOIN customers c ON i.customer_id = c.id
    WHERE i.id = ?
  `).get(req.params.id)
  
  if (!inquiry) {
    return res.status(404).json({ error: '询价不存在' })
  }
  res.json(inquiry)
})

router.get('/:id/matches', (req: Request, res: Response) => {
  const matches = db.prepare(`
    SELECT m.*, w.name as warehouse_name, w.code as warehouse_code, w.area, w.monthly_rent, w.status as warehouse_status
    FROM inquiry_matches m
    LEFT JOIN warehouses w ON m.warehouse_id = w.id
    WHERE m.inquiry_id = ?
    ORDER BY m.match_score DESC
  `).all(req.params.id)
  res.json(matches)
})

router.post('/', (req: Request, res: Response) => {
  const { customer_id, area_required, lease_term, budget, cargo_type, special_requirements } = req.body
  
  const result = db.prepare(`
    INSERT INTO inquiries (customer_id, area_required, lease_term, budget, cargo_type, special_requirements)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(customer_id, area_required, lease_term, budget, cargo_type, special_requirements)
  
  res.status(201).json({ id: result.lastInsertRowid, message: '询价创建成功' })
})

router.post('/:id/match', (req: Request, res: Response) => {
  const inquiryId = req.params.id
  
  const inquiry = db.prepare('SELECT * FROM inquiries WHERE id = ?').get(inquiryId) as any
  if (!inquiry) {
    return res.status(404).json({ error: '询价不存在' })
  }
  
  const availableWarehouses = db.prepare(`
    SELECT * FROM warehouses WHERE status = 'available'
  `).all() as any[]
  
  const matches: any[] = []
  
  for (const warehouse of availableWarehouses) {
    let score = 0
    const reasons: string[] = []
    
    if (warehouse.area >= inquiry.area_required) {
      score += 30
      reasons.push(`面积充足：${warehouse.area}㎡ ≥ 需求 ${inquiry.area_required}㎡`)
    } else if (warehouse.area >= inquiry.area_required * 0.8) {
      score += 15
      reasons.push(`面积基本满足：${warehouse.area}㎡`)
    } else {
      reasons.push(`面积不足：${warehouse.area}㎡ < 需求 ${inquiry.area_required}㎡`)
    }
    
    if (inquiry.budget) {
      const totalRent = warehouse.monthly_rent * inquiry.area_required
      if (totalRent <= inquiry.budget) {
        score += 25
        reasons.push(`租金符合预算：${totalRent}元/月 ≤ 预算 ${inquiry.budget}元/月`)
      } else if (totalRent <= inquiry.budget * 1.1) {
        score += 10
        reasons.push(`租金略超预算：${totalRent}元/月`)
      } else {
        reasons.push(`租金超出预算：${totalRent}元/月`)
      }
    }
    
    score += 20
    reasons.push(`状态：可租`)
    
    if (inquiry.cargo_type) {
      if (inquiry.cargo_type.includes('冷藏') || inquiry.cargo_type.includes('冷链')) {
        if (warehouse.temperature_control && warehouse.temperature_control.includes('冷藏')) {
          score += 25
          reasons.push('满足温控要求：冷藏')
        } else {
          reasons.push('无冷藏功能')
        }
      } else if (inquiry.cargo_type.includes('化工') || inquiry.cargo_type.includes('危险')) {
        if (warehouse.fire_rating === '甲类' || warehouse.fire_rating === '乙类') {
          score += 25
          reasons.push(`消防等级符合：${warehouse.fire_rating}`)
        } else {
          reasons.push(`消防等级：${warehouse.fire_rating}`)
        }
      } else {
        score += 15
        reasons.push(`消防等级：${warehouse.fire_rating}`)
      }
    }
    
    matches.push({
      inquiry_id: inquiryId,
      warehouse_id: warehouse.id,
      match_score: Math.min(score, 100),
      match_reason: reasons.join('；')
    })
  }
  
  matches.sort((a, b) => b.match_score - a.match_score)
  
  db.prepare('DELETE FROM inquiry_matches WHERE inquiry_id = ?').run(inquiryId)
  
  const insertMatch = db.prepare(`
    INSERT INTO inquiry_matches (inquiry_id, warehouse_id, match_score, match_reason)
    VALUES (?, ?, ?, ?)
  `)
  
  for (const match of matches) {
    insertMatch.run(match.inquiry_id, match.warehouse_id, match.match_score, match.match_reason)
  }
  
  db.prepare('UPDATE inquiries SET status = ? WHERE id = ?').run('matched', inquiryId)
  
  res.json({ matches: matches.slice(0, 5), message: '匹配完成' })
})

router.put('/:id/status', (req: Request, res: Response) => {
  const { status } = req.body
  db.prepare('UPDATE inquiries SET status = ? WHERE id = ?').run(status, req.params.id)
  res.json({ message: '状态更新成功' })
})

export default router
