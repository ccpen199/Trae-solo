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
    const search = req.query.search as string || ''

    const offset = (page - 1) * pageSize

    let whereClause = ''
    const params: Record<string, unknown> = {}

    if (search) {
      whereClause = 'WHERE account_no LIKE @search OR name LIKE @search'
      params.search = `%${search}%`
    }

    const countStmt = db.prepare(`SELECT COUNT(*) as total FROM users ${whereClause}`)
    const { total } = countStmt.get(params) as { total: number }

    const listStmt = db.prepare(`
      SELECT * FROM users 
      ${whereClause}
      ORDER BY open_date DESC
      LIMIT @limit OFFSET @offset
    `)
    const users = listStmt.all({ ...params, limit: pageSize, offset })

    res.json({
      success: true,
      data: {
        list: users,
        total,
        page,
        pageSize,
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '获取用户列表失败',
    })
  }
})

router.get('/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params

    const userStmt = db.prepare('SELECT * FROM users WHERE id = ?')
    const user = userStmt.get(id)

    if (!user) {
      res.status(404).json({
        success: false,
        error: '用户不存在',
      })
      return
    }

    const meterStmt = db.prepare('SELECT * FROM meters WHERE user_id = ?')
    const meters = meterStmt.all(id)

    const deviceStmt = db.prepare('SELECT * FROM gas_devices WHERE user_id = ?')
    const devices = deviceStmt.all(id)

    const inspectionStmt = db.prepare(`
      SELECT * FROM safety_inspections 
      WHERE user_id = ? 
      ORDER BY inspect_date DESC 
      LIMIT 10
    `)
    const inspections = inspectionStmt.all(id).map((item: { issues: string }) => ({
      ...item,
      issues: JSON.parse(item.issues),
    }))

    const readingStmt = db.prepare(`
      SELECT * FROM meter_readings 
      WHERE user_id = ? 
      ORDER BY reading_date DESC 
      LIMIT 12
    `)
    const readings = readingStmt.all(id)

    res.json({
      success: true,
      data: {
        ...(user as Record<string, unknown>),
        meters,
        devices,
        inspections,
        historyReadings: readings,
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '获取用户详情失败',
    })
  }
})

router.post('/', (req: Request, res: Response): void => {
  try {
    const { account_no, name, address, user_type, phone, open_date, area } = req.body

    if (!account_no || !name || !address || !user_type || !phone || !open_date) {
      res.status(400).json({
        success: false,
        error: '缺少必填字段',
      })
      return
    }

    const checkStmt = db.prepare('SELECT id FROM users WHERE account_no = ?')
    const existing = checkStmt.get(account_no)
    if (existing) {
      res.status(400).json({
        success: false,
        error: '户号已存在',
      })
      return
    }

    const id = generateId('user')

    const insertStmt = db.prepare(`
      INSERT INTO users (id, account_no, name, address, user_type, phone, open_date, status, area)
      VALUES (@id, @account_no, @name, @address, @user_type, @phone, @open_date, 'active', @area)
    `)
    insertStmt.run({
      id,
      account_no,
      name,
      address,
      user_type,
      phone,
      open_date,
      area: area || null,
    })

    const userStmt = db.prepare('SELECT * FROM users WHERE id = ?')
    const user = userStmt.get(id)

    res.json({
      success: true,
      data: user,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '创建用户失败',
    })
  }
})

router.patch('/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    const { name, address, user_type, phone, status, area } = req.body

    const checkStmt = db.prepare('SELECT id FROM users WHERE id = ?')
    const existing = checkStmt.get(id)
    if (!existing) {
      res.status(404).json({
        success: false,
        error: '用户不存在',
      })
      return
    }

    const updates: string[] = []
    const params: Record<string, unknown> = { id }

    if (name !== undefined) {
      updates.push('name = @name')
      params.name = name
    }
    if (address !== undefined) {
      updates.push('address = @address')
      params.address = address
    }
    if (user_type !== undefined) {
      updates.push('user_type = @user_type')
      params.user_type = user_type
    }
    if (phone !== undefined) {
      updates.push('phone = @phone')
      params.phone = phone
    }
    if (status !== undefined) {
      updates.push('status = @status')
      params.status = status
    }
    if (area !== undefined) {
      updates.push('area = @area')
      params.area = area
    }

    if (updates.length === 0) {
      res.status(400).json({
        success: false,
        error: '没有需要更新的字段',
      })
      return
    }

    const updateStmt = db.prepare(`
      UPDATE users SET ${updates.join(', ')} WHERE id = @id
    `)
    updateStmt.run(params)

    const userStmt = db.prepare('SELECT * FROM users WHERE id = ?')
    const user = userStmt.get(id)

    res.json({
      success: true,
      data: user,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '更新用户失败',
    })
  }
})

export default router
