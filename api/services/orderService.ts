import { nanoid } from 'nanoid'
import db from '../db/index.js'
import { analyzeImage, type AIScreenResult } from './aiScreenService.js'

export interface AppraisalOrder {
  id: string
  user_id: string
  artwork_id: string
  expert_id?: string
  order_type: string
  status: string
  price: number
  ai_result?: string
  expert_opinion?: string
  valuation?: number
  certificate_id?: string
  created_at: string
  updated_at: string
}

export interface OrderDetail extends AppraisalOrder {
  artwork_title: string
  artwork_category: string
  artwork_images?: string
  expert_name?: string
  expert_title?: string
  username: string
}

export function createOrder(userId: string, artworkId: string, orderType: 'ai' | 'expert', expertId?: string): {
  success: boolean
  order?: AppraisalOrder
  aiResult?: AIScreenResult
  error?: string
} {
  const artwork = db.prepare('SELECT * FROM artworks WHERE id = ? AND owner_id = ?').get(artworkId, userId)
  if (!artwork) {
    return { success: false, error: '藏品不存在或无权操作' }
  }

  let price = 9.9
  if (orderType === 'expert' && expertId) {
    const expert = db.prepare('SELECT price_per_appraisal FROM experts WHERE id = ? AND status = ?').get(expertId, 'approved') as { price_per_appraisal: number } | undefined
    if (!expert) return { success: false, error: '专家不存在或未通过审核' }
    price = expert.price_per_appraisal
  }

  const id = nanoid()
  let aiResult: AIScreenResult | undefined
  let aiResultJson: string | undefined

  if (orderType === 'ai') {
    aiResult = analyzeImage()
    aiResultJson = JSON.stringify(aiResult)
  }

  db.prepare(`
    INSERT INTO appraisal_orders (id, user_id, artwork_id, expert_id, order_type, status, price, ai_result)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, userId, artworkId, expertId || null, orderType, orderType === 'ai' ? 'completed' : 'pending', price, aiResultJson || null)

  if (orderType === 'ai') {
    db.prepare("UPDATE appraisal_orders SET status = 'completed', updated_at = datetime('now') WHERE id = ?").run(id)
  }

  const order = db.prepare('SELECT * FROM appraisal_orders WHERE id = ?').get(id) as AppraisalOrder
  return { success: true, order, aiResult }
}

export function getOrderById(id: string): OrderDetail | undefined {
  return db.prepare(`
    SELECT o.*, a.title as artwork_title, a.category as artwork_category, a.images as artwork_images,
           e.name as expert_name, e.title as expert_title, u.username
    FROM appraisal_orders o
    LEFT JOIN artworks a ON o.artwork_id = a.id
    LEFT JOIN experts e ON o.expert_id = e.id
    LEFT JOIN users u ON o.user_id = u.id
    WHERE o.id = ?
  `).get(id) as OrderDetail | undefined
}

export function getUserOrders(userId: string, page = 1, pageSize = 10, status?: string): {
  list: OrderDetail[]
  total: number
} {
  const offset = (page - 1) * pageSize
  let where = 'WHERE o.user_id = ?'
  const params: any[] = [userId]
  if (status) {
    where += ' AND o.status = ?'
    params.push(status)
  }
  const total = (db.prepare(`SELECT COUNT(*) as count FROM appraisal_orders o ${where}`).get(...params) as { count: number }).count
  const list = db.prepare(`
    SELECT o.*, a.title as artwork_title, a.category as artwork_category, a.images as artwork_images,
           e.name as expert_name, e.title as expert_title, u.username
    FROM appraisal_orders o
    LEFT JOIN artworks a ON o.artwork_id = a.id
    LEFT JOIN experts e ON o.expert_id = e.id
    LEFT JOIN users u ON o.user_id = u.id
    ${where}
    ORDER BY o.created_at DESC LIMIT ? OFFSET ?
  `).get(...params, pageSize, offset) as OrderDetail[]
  return { list, total }
}

export function getExpertOrders(expertUserId: string, page = 1, pageSize = 10, status?: string): {
  list: OrderDetail[]
  total: number
} {
  const expert = db.prepare('SELECT id FROM experts WHERE user_id = ?').get(expertUserId) as { id: string } | undefined
  if (!expert) return { list: [], total: 0 }
  const offset = (page - 1) * pageSize
  let where = 'WHERE o.expert_id = ?'
  const params: any[] = [expert.id]
  if (status) {
    where += ' AND o.status = ?'
    params.push(status)
  }
  const total = (db.prepare(`SELECT COUNT(*) as count FROM appraisal_orders o ${where}`).get(...params) as { count: number }).count
  const list = db.prepare(`
    SELECT o.*, a.title as artwork_title, a.category as artwork_category, a.images as artwork_images,
           e.name as expert_name, e.title as expert_title, u.username
    FROM appraisal_orders o
    LEFT JOIN artworks a ON o.artwork_id = a.id
    LEFT JOIN experts e ON o.expert_id = e.id
    LEFT JOIN users u ON o.user_id = u.id
    ${where}
    ORDER BY o.created_at DESC LIMIT ? OFFSET ?
  `).get(...params, pageSize, offset) as OrderDetail[]
  return { list, total }
}

export function acceptOrder(orderId: string, expertUserId: string): boolean {
  const expert = db.prepare('SELECT id FROM experts WHERE user_id = ?').get(expertUserId) as { id: string } | undefined
  if (!expert) return false
  const order = db.prepare('SELECT expert_id, status FROM appraisal_orders WHERE id = ?').get(orderId) as { expert_id: string; status: string } | undefined
  if (!order || order.expert_id !== expert.id || order.status !== 'pending') return false
  const info = db.prepare("UPDATE appraisal_orders SET status = 'in_progress', updated_at = datetime('now') WHERE id = ?").run(orderId)
  return info.changes > 0
}

export function submitExpertResult(orderId: string, expertUserId: string, expertOpinion: string, valuation: number): boolean {
  const expert = db.prepare('SELECT id FROM experts WHERE user_id = ?').get(expertUserId) as { id: string } | undefined
  if (!expert) return false
  const order = db.prepare('SELECT expert_id, status FROM appraisal_orders WHERE id = ?').get(orderId) as { expert_id: string; status: string } | undefined
  if (!order || order.expert_id !== expert.id || order.status !== 'in_progress') return false
  const info = db.prepare(`
    UPDATE appraisal_orders
    SET expert_opinion = ?, valuation = ?, status = 'completed', updated_at = datetime('now')
    WHERE id = ?
  `).run(expertOpinion, valuation, orderId)
  if (info.changes > 0) {
    db.prepare("UPDATE experts SET appraisal_count = appraisal_count + 1 WHERE id = ?").run(expert.id)
  }
  return info.changes > 0
}

export function getAllOrders(page = 1, pageSize = 10, status?: string): {
  list: OrderDetail[]
  total: number
} {
  const offset = (page - 1) * pageSize
  let where = ''
  const params: any[] = []
  if (status) {
    where = 'WHERE o.status = ?'
    params.push(status)
  }
  const total = (db.prepare(`SELECT COUNT(*) as count FROM appraisal_orders o ${where}`).get(...params) as { count: number }).count
  const list = db.prepare(`
    SELECT o.*, a.title as artwork_title, a.category as artwork_category, a.images as artwork_images,
           e.name as expert_name, e.title as expert_title, u.username
    FROM appraisal_orders o
    LEFT JOIN artworks a ON o.artwork_id = a.id
    LEFT JOIN experts e ON o.expert_id = e.id
    LEFT JOIN users u ON o.user_id = u.id
    ${where}
    ORDER BY o.created_at DESC LIMIT ? OFFSET ?
  `).get(...params, pageSize, offset) as OrderDetail[]
  return { list, total }
}

export function createDispute(orderId: string, userId: string, reason: string, description?: string, evidence?: string): {
  success: boolean
  disputeId?: string
  error?: string
} {
  const order = db.prepare('SELECT user_id, status FROM appraisal_orders WHERE id = ?').get(orderId) as { user_id: string; status: string } | undefined
  if (!order || order.user_id !== userId) return { success: false, error: '订单不存在或无权操作' }
  if (order.status !== 'completed') return { success: false, error: '只能对已完成的订单发起申诉' }
  const id = nanoid()
  db.prepare(`
    INSERT INTO disputes (id, order_id, user_id, reason, description, evidence, status)
    VALUES (?, ?, ?, ?, ?, ?, 'pending')
  `).run(id, orderId, userId, reason, description || '', evidence || '')
  return { success: true, disputeId: id }
}

export function getDisputes(page = 1, pageSize = 10, status?: string): { list: any[]; total: number } {
  const offset = (page - 1) * pageSize
  let where = ''
  const params: any[] = []
  if (status) {
    where = 'WHERE d.status = ?'
    params.push(status)
  }
  const total = (db.prepare(`SELECT COUNT(*) as count FROM disputes d ${where}`).get(...params) as { count: number }).count
  const list = db.prepare(`
    SELECT d.*, a.title as artwork_title, u.username
    FROM disputes d
    LEFT JOIN appraisal_orders o ON d.order_id = o.id
    LEFT JOIN artworks a ON o.artwork_id = a.id
    LEFT JOIN users u ON d.user_id = u.id
    ${where}
    ORDER BY d.created_at DESC LIMIT ? OFFSET ?
  `).get(...params, pageSize, offset) as any[]
  return { list, total }
}

export function resolveDispute(disputeId: string, resolution: string, newStatus: string): boolean {
  const info = db.prepare(`
    UPDATE disputes SET status = ?, resolution = ?, resolved_at = datetime('now')
    WHERE id = ?
  `).run(newStatus, resolution, disputeId)
  return info.changes > 0
}
