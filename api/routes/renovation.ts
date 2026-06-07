import { Router, type Request, type Response } from 'express'
import db from '../db.js'
import authMiddleware from '../middleware/auth.js'

const router = Router()

interface AuthRequest extends Request {
  user?: any
}

router.get('/companies', async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const pageSize = parseInt(req.query.pageSize as string) || 10

    const offset = (page - 1) * pageSize

    const countStmt = db.prepare("SELECT COUNT(*) as count FROM renovation_companies WHERE certification_status = 'approved'")
    const total = (countStmt.get() as any).count

    const companiesStmt = db.prepare(`
      SELECT * FROM renovation_companies
      WHERE certification_status = 'approved'
      ORDER BY rating DESC, cases_count DESC
      LIMIT ? OFFSET ?
    `)
    const companies = companiesStmt.all(pageSize, offset) as any[]

    res.status(200).json({
      success: true,
      data: {
        list: companies,
        total,
        page,
        pageSize
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取装修公司列表失败' })
  }
})

router.get('/cases', async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const pageSize = parseInt(req.query.pageSize as string) || 10
    const style = req.query.style as string
    const companyId = req.query.company_id as string

    const offset = (page - 1) * pageSize

    let whereClauses: string[] = []
    let params: any[] = []

    if (style) {
      whereClauses.push('c.style = ?')
      params.push(style)
    }
    if (companyId) {
      whereClauses.push('c.company_id = ?')
      params.push(companyId)
    }

    const whereSql = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : ''

    const countStmt = db.prepare(`SELECT COUNT(*) as count FROM renovation_cases c ${whereSql}`)
    const total = (countStmt.get(...params) as any).count

    params.push(pageSize, offset)

    const casesStmt = db.prepare(`
      SELECT c.*, co.name as company_name, co.logo_url as company_logo
      FROM renovation_cases c
      LEFT JOIN renovation_companies co ON c.company_id = co.id
      ${whereSql}
      ORDER BY c.created_at DESC
      LIMIT ? OFFSET ?
    `)
    const cases = casesStmt.all(...params) as any[]

    const casesWithImages = cases.map(c => ({
      ...c,
      images: c.images ? JSON.parse(c.images) : []
    }))

    res.status(200).json({
      success: true,
      data: {
        list: casesWithImages,
        total,
        page,
        pageSize
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取装修案例列表失败' })
  }
})

router.get('/companies/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    const companyStmt = db.prepare('SELECT * FROM renovation_companies WHERE id = ?')
    const company = companyStmt.get(id) as any

    if (!company) {
      res.status(404).json({ success: false, error: '装修公司不存在' })
      return
    }

    const casesStmt = db.prepare('SELECT * FROM renovation_cases WHERE company_id = ? ORDER BY created_at DESC')
    const cases = casesStmt.all(id) as any[]

    const casesWithImages = cases.map(c => ({
      ...c,
      images: c.images ? JSON.parse(c.images) : []
    }))

    res.status(200).json({
      success: true,
      data: {
        detail: {
          ...company,
          cases: casesWithImages
        }
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取装修公司详情失败' })
  }
})

router.post('/quotes', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { company_id, order_id, items } = req.body

    if (!company_id || !items) {
      res.status(400).json({ success: false, error: '公司ID和报价项不能为空' })
      return
    }

    const total_price = items.reduce((sum: number, item: any) => sum + (item.total || 0), 0)

    const stmt = db.prepare(`
      INSERT INTO renovation_quotes (company_id, order_id, items_json, total_price)
      VALUES (?, ?, ?, ?)
    `)
    const result = stmt.run(company_id, order_id || null, JSON.stringify(items), total_price)

    const quote = db.prepare('SELECT * FROM renovation_quotes WHERE id = ?').get(result.lastInsertRowid) as any
    quote.items_json = JSON.parse(quote.items_json)

    res.status(201).json({
      success: true,
      data: {
        quote
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '提交报价失败' })
  }
})

router.post('/quote-compare', async (req: Request, res: Response): Promise<void> => {
  try {
    const { quote_ids, quoteIds } = req.body
    const ids = quote_ids || quoteIds

    if (!ids || !Array.isArray(ids) || ids.length < 2) {
      res.status(400).json({ success: false, error: '请至少选择2个报价进行对比' })
      return
    }

    const placeholders = ids.map(() => '?').join(',')
    const quotesStmt = db.prepare(`
      SELECT q.*, c.name as company_name, c.logo_url, c.rating
      FROM renovation_quotes q
      LEFT JOIN renovation_companies c ON q.company_id = c.id
      WHERE q.id IN (${placeholders})
    `)
    const quotes = quotesStmt.all(...ids) as any[]

    if (quotes.length < 2) {
      res.status(400).json({ success: false, error: '未找到足够的报价数据' })
      return
    }

    const parsedQuotes = quotes.map(q => ({
      ...q,
      items: JSON.parse(q.items_json)
    }))

    const allItemNames = new Set<string>()
    parsedQuotes.forEach(q => {
      q.items.forEach((item: any) => allItemNames.add(item.name))
    })

    const comparison: any[] = []
    allItemNames.forEach(itemName => {
      const itemComparison: any = {
        name: itemName,
        quotes: [],
        status: 'same'
      }

      let firstPrice: number | null = null
      let allSame = true

      parsedQuotes.forEach(q => {
        const item = q.items.find((i: any) => i.name === itemName)
        if (item) {
          itemComparison.quotes.push({
            quote_id: q.id,
            company_name: q.company_name,
            unit: item.unit,
            quantity: item.quantity,
            price: item.price,
            total: item.total
          })
          if (firstPrice === null) {
            firstPrice = item.price
          } else if (firstPrice !== item.price) {
            allSame = false
          }
        } else {
          itemComparison.quotes.push({
            quote_id: q.id,
            company_name: q.company_name,
            unit: null,
            quantity: null,
            price: null,
            total: null
          })
          allSame = false
        }
      })

      if (!allSame) {
        itemComparison.status = itemComparison.quotes.some((q: any) => q.price === null) ? 'missing' : 'different'
      }

      comparison.push(itemComparison)
    })

    const summary = {
      same_count: comparison.filter(c => c.status === 'same').length,
      different_count: comparison.filter(c => c.status === 'different').length,
      missing_count: comparison.filter(c => c.status === 'missing').length
    }

    res.status(200).json({
      success: true,
      data: {
        quotes: parsedQuotes.map(q => ({
          id: q.id,
          company_name: q.company_name,
          logo_url: q.logo_url,
          rating: q.rating,
          total_price: q.total_price,
          items: q.items
        })),
        comparison,
        summary
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '报价对比失败' })
  }
})

router.get('/orders', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const pageSize = parseInt(req.query.pageSize as string) || 10

    const offset = (page - 1) * pageSize

    const countStmt = db.prepare('SELECT COUNT(*) as count FROM renovation_orders WHERE user_id = ?')
    const total = (countStmt.get(req.user.id) as any).count

    const ordersStmt = db.prepare(`
      SELECT o.*, c.name as company_name, c.logo_url, u.nickname as designer_name
      FROM renovation_orders o
      LEFT JOIN renovation_companies c ON o.company_id = c.id
      LEFT JOIN users u ON o.designer_id = u.id
      WHERE o.user_id = ?
      ORDER BY o.created_at DESC
      LIMIT ? OFFSET ?
    `)
    const orders = ordersStmt.all(req.user.id, pageSize, offset) as any[]

    res.status(200).json({
      success: true,
      data: {
        list: orders,
        total,
        page,
        pageSize
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取装修订单列表失败' })
  }
})

router.post('/orders', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { company_id, designer_id, description, budget } = req.body

    if (!company_id) {
      res.status(400).json({ success: false, error: '装修公司ID不能为空' })
      return
    }

    const stmt = db.prepare(`
      INSERT INTO renovation_orders (user_id, company_id, designer_id, description, budget)
      VALUES (?, ?, ?, ?, ?)
    `)
    const result = stmt.run(req.user.id, company_id, designer_id || null, description || null, budget || null)

    const order = db.prepare(`
      SELECT o.*, c.name as company_name, c.logo_url, u.nickname as designer_name
      FROM renovation_orders o
      LEFT JOIN renovation_companies c ON o.company_id = c.id
      LEFT JOIN users u ON o.designer_id = u.id
      WHERE o.id = ?
    `).get(result.lastInsertRowid) as any

    res.status(201).json({
      success: true,
      data: {
        order
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '创建装修订单失败' })
  }
})

router.get('/orders/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    const orderStmt = db.prepare(`
      SELECT o.*, c.name as company_name, c.logo_url, c.contact_phone, u.nickname as designer_name
      FROM renovation_orders o
      LEFT JOIN renovation_companies c ON o.company_id = c.id
      LEFT JOIN users u ON o.designer_id = u.id
      WHERE o.id = ? AND o.user_id = ?
    `)
    const order = orderStmt.get(id, req.user.id) as any

    if (!order) {
      res.status(404).json({ success: false, error: '订单不存在' })
      return
    }

    const progressStages = [
      { stage: 'design', name: '设计阶段', status: order.current_stage === 'design' ? 'current' : ['construction', 'inspection', 'completed'].includes(order.current_stage) ? 'completed' : 'pending' },
      { stage: 'construction', name: '施工阶段', status: order.current_stage === 'construction' ? 'current' : ['inspection', 'completed'].includes(order.current_stage) ? 'completed' : 'pending' },
      { stage: 'inspection', name: '验收阶段', status: order.current_stage === 'inspection' ? 'current' : order.current_stage === 'completed' ? 'completed' : 'pending' },
      { stage: 'completed', name: '已完成', status: order.current_stage === 'completed' ? 'current' : 'pending' },
    ]

    const progress = {
      current_stage: order.current_stage,
      stages: progressStages
    }

    res.status(200).json({
      success: true,
      data: {
        detail: {
          ...order,
          progress
        }
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取订单详情失败' })
  }
})

export default router
