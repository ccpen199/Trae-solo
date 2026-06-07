import { Router, type Request, type Response } from 'express'
import db from '../db.js'

const router = Router()

router.get('/brands', async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const pageSize = parseInt(req.query.pageSize as string) || 20
    const category = req.query.category as string

    let whereClauses: string[] = []
    let params: any[] = []

    if (category) {
      whereClauses.push('category = ?')
      params.push(category)
    }

    const whereSql = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : ''

    const countStmt = db.prepare(`SELECT COUNT(*) as count FROM material_brands ${whereSql}`)
    const total = (countStmt.get(...params) as any).count

    const offset = (page - 1) * pageSize
    const brandsStmt = db.prepare(`
      SELECT * FROM material_brands
      ${whereSql}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `)
    const brands = brandsStmt.all(...params, pageSize, offset) as any[]

    res.status(200).json({
      success: true,
      data: {
        list: brands,
        total,
        page,
        pageSize
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取材料品牌列表失败' })
  }
})

router.get('/samples', async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const pageSize = parseInt(req.query.pageSize as string) || 20
    const brand_id = req.query.brand_id as string
    const category = req.query.category as string

    let whereClauses: string[] = []
    let params: any[] = []

    if (brand_id) {
      whereClauses.push('brand_id = ?')
      params.push(brand_id)
    }
    if (category) {
      whereClauses.push('category = ?')
      params.push(category)
    }

    const whereSql = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : ''

    const countStmt = db.prepare(`SELECT COUNT(*) as count FROM material_samples ${whereSql}`)
    const total = (countStmt.get(...params) as any).count

    const offset = (page - 1) * pageSize
    const samplesStmt = db.prepare(`
      SELECT s.*, b.name as brand_name, b.logo_url as brand_logo
      FROM material_samples s
      LEFT JOIN material_brands b ON s.brand_id = b.id
      ${whereSql}
      ORDER BY s.created_at DESC
      LIMIT ? OFFSET ?
    `)
    const samples = samplesStmt.all(...params, pageSize, offset) as any[]

    res.status(200).json({
      success: true,
      data: {
        list: samples,
        total,
        page,
        pageSize
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取材料样品列表失败' })
  }
})

router.get('/dealers', async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const pageSize = parseInt(req.query.pageSize as string) || 20
    const brand_id = req.query.brand_id as string
    const city = req.query.city as string

    let whereClauses: string[] = []
    let params: any[] = []

    if (brand_id) {
      whereClauses.push('brand_id = ?')
      params.push(brand_id)
    }
    if (city) {
      whereClauses.push('address LIKE ?')
      params.push(`%${city}%`)
    }

    const whereSql = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : ''

    const countStmt = db.prepare(`SELECT COUNT(*) as count FROM material_dealers ${whereSql}`)
    const total = (countStmt.get(...params) as any).count

    const offset = (page - 1) * pageSize
    const dealersStmt = db.prepare(`
      SELECT d.*, b.name as brand_name, b.logo_url as brand_logo
      FROM material_dealers d
      LEFT JOIN material_brands b ON d.brand_id = b.id
      ${whereSql}
      ORDER BY d.created_at DESC
      LIMIT ? OFFSET ?
    `)
    const dealers = dealersStmt.all(...params, pageSize, offset) as any[]

    res.status(200).json({
      success: true,
      data: {
        list: dealers,
        total,
        page,
        pageSize
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取经销商列表失败' })
  }
})

export default router
