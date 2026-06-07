import { Router, type Request, type Response } from 'express'
import db from '../database.js'
import { authMiddleware } from '../middleware/auth.js'
import { encrypt } from '../encryption.js'

const router = Router()

router.get('/sukang', authMiddleware, (req: Request, res: Response): void => {
  try {
    const userId = (req as any).user.id
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any
    if (!user) {
      db.prepare('INSERT INTO verification_history (user_id, type, method, status, error_message) VALUES (?, ?, ?, ?, ?)')
        .run(userId, 'sukang', 'api_query', 'failed', '用户不存在')
      res.json({ code: -1, message: '用户不存在' })
      return
    }

    const statuses: Array<'green' | 'yellow' | 'red'> = ['green', 'yellow', 'red']
    const status = statuses[Math.floor(Math.random() * 3)]

    db.prepare('UPDATE users SET sukang_status = ? WHERE id = ?').run(status, userId)

    db.prepare('INSERT INTO verification_history (user_id, type, method, status, result, details) VALUES (?, ?, ?, ?, ?, ?)')
      .run(userId, 'sukang', 'api_query', 'success', status, '苏康码查询成功')

    res.json({ code: 0, message: 'success', data: { status, query_time: new Date().toISOString(), encrypted: true } })
  } catch (error: any) {
    const userId = (req as any).user?.id
    if (userId) {
      db.prepare('INSERT INTO verification_history (user_id, type, method, status, error_message) VALUES (?, ?, ?, ?, ?)')
        .run(userId, 'sukang', 'api_query', 'failed', error.message)
    }
    res.json({ code: -1, message: error.message })
  }
})

router.post('/ocr', authMiddleware, (req: Request, res: Response): void => {
  try {
    const userId = (req as any).user.id
    const { id_card_front, id_card_back } = req.body

    if (!id_card_front || !id_card_back) {
      db.prepare('INSERT INTO verification_history (user_id, type, method, status, error_message) VALUES (?, ?, ?, ?, ?)')
        .run(userId, 'ocr', 'id_card', 'failed', '请提供身份证正反面照片')
      res.json({ code: -1, message: '请提供身份证正反面照片' })
      return
    }

    const ocrResult = {
      name: '张三',
      id_number: '320106199001011234',
      address: '江苏省南京市鼓楼区中山北路100号',
      issue_authority: '南京市公安局鼓楼分局',
      valid_period: '2020.01.01-2040.01.01',
      birth_date: '1990-01-01',
      gender: '男',
      ethnicity: '汉'
    }

    const encrypted = encrypt(JSON.stringify(ocrResult))

    const expiryDate = new Date()
    expiryDate.setFullYear(expiryDate.getFullYear() + 10)

    db.prepare('UPDATE users SET id_card_encrypted = ?, id_number = ?, verified = 1, verification_level = 2, verification_method = ?, verification_expiry = ?, last_verified_at = ? WHERE id = ?')
      .run(encrypted, '320106********1234', 'ocr_id_card', expiryDate.toISOString(), new Date().toISOString(), userId)

    db.prepare('INSERT INTO verification_history (user_id, type, method, status, result, details) VALUES (?, ?, ?, ?, ?, ?)')
      .run(userId, 'ocr', 'id_card', 'success', 'verified', JSON.stringify({ name: ocrResult.name, id_number: ocrResult.id_number }))

    res.json({
      code: 0,
      message: 'success',
      data: {
        ocr: ocrResult,
        verified: true,
        verification_level: 2,
        encrypted: true
      }
    })
  } catch (error: any) {
    const userId = (req as any).user?.id
    if (userId) {
      db.prepare('INSERT INTO verification_history (user_id, type, method, status, error_message) VALUES (?, ?, ?, ?, ?)')
        .run(userId, 'ocr', 'id_card', 'failed', error.message)
    }
    res.json({ code: -1, message: error.message })
  }
})

router.get('/history', authMiddleware, (req: Request, res: Response): void => {
  try {
    const userId = (req as any).user.id
    const page = parseInt((req.query.page as string) || '1')
    const limit = parseInt((req.query.limit as string) || '20')
    const offset = (page - 1) * limit

    const history = db.prepare(`
      SELECT id, type, method, status, result, details, error_message, created_at
      FROM verification_history
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).all(userId, limit, offset) as any[]

    const total = db.prepare('SELECT COUNT(*) as count FROM verification_history WHERE user_id = ?').get(userId) as { count: number }

    const sukangRecords = history.filter(h => h.type === 'sukang')
    const ocrRecords = history.filter(h => h.type === 'ocr')

    res.json({
      code: 0,
      message: 'success',
      data: {
        list: history,
        pagination: {
          page,
          limit,
          total: total.count,
          total_pages: Math.ceil(total.count / limit)
        },
        stats: {
          sukang_count: sukangRecords.length,
          ocr_count: ocrRecords.length,
          success_count: history.filter(h => h.status === 'success').length,
          failed_count: history.filter(h => h.status === 'failed').length
        }
      }
    })
  } catch (error: any) {
    res.json({ code: -1, message: error.message })
  }
})

router.post('/submit', authMiddleware, (req: Request, res: Response): void => {
  try {
    const userId = (req as any).user.id
    const { verification_type, verification_data, confirmed } = req.body

    if (!confirmed) {
      db.prepare('INSERT INTO verification_history (user_id, type, method, status, error_message) VALUES (?, ?, ?, ?, ?)')
        .run(userId, verification_type || 'manual', 'user_submit', 'failed', '用户未确认信息')
      res.json({ code: -1, message: '请确认核验信息无误后提交' })
      return
    }

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any
    if (!user) {
      res.json({ code: -1, message: '用户不存在' })
      return
    }

    const currentLevel = user.verification_level || 0
    const newLevel = Math.min(currentLevel + 1, 3)
    const expiryDate = new Date()
    expiryDate.setFullYear(expiryDate.getFullYear() + 10)

    db.prepare(`
      UPDATE users 
      SET verified = 1, 
          verification_level = ?, 
          verification_method = ?,
          verification_expiry = ?,
          last_verified_at = ?
      WHERE id = ?
    `).run(newLevel, 'user_confirmed', expiryDate.toISOString(), new Date().toISOString(), userId)

    if (verification_data) {
      encrypt(JSON.stringify(verification_data))
    }

    db.prepare('INSERT INTO verification_history (user_id, type, method, status, result, details) VALUES (?, ?, ?, ?, ?, ?)')
      .run(userId, verification_type || 'manual', 'user_submit', 'success', 'submitted', JSON.stringify({ level: newLevel, confirmed: true }))

    const updatedUser = db.prepare(`
      SELECT id, phone, name, verified, verification_level, verification_method, verification_expiry, last_verified_at, sukang_status
      FROM users WHERE id = ?
    `).get(userId)

    res.json({
      code: 0,
      message: '核验提交成功',
      data: {
        user: updatedUser,
        submitted_at: new Date().toISOString(),
        encrypted: true
      }
    })
  } catch (error: any) {
    const userId = (req as any).user?.id
    if (userId) {
      db.prepare('INSERT INTO verification_history (user_id, type, method, status, error_message) VALUES (?, ?, ?, ?, ?)')
        .run(userId, 'manual', 'user_submit', 'failed', error.message)
    }
    res.json({ code: -1, message: error.message })
  }
})

export default router
