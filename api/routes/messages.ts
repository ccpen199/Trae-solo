import { Router, type Request, type Response } from 'express'
import db from '../database.js'

const router = Router()

router.get('/conversations', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.headers['x-user-id']
    const userRole = req.headers['x-user-role']
    if (!userId) {
      res.status(401).json({ success: false, error: '未登录' })
      return
    }

    let conversations
    if (userRole === 'talent') {
      const talent = db.prepare('SELECT id FROM talent_profiles WHERE user_id = ?').get(userId) as any
      if (!talent) {
        res.status(404).json({ success: false, error: '人才资料不存在' })
        return
      }
      conversations = db.prepare(`
        SELECT c.*, ip.institution_name, u.name as institution_user_name
        FROM conversations c
        JOIN institution_profiles ip ON c.institution_id = ip.id
        JOIN users u ON ip.user_id = u.id
        WHERE c.talent_id = ?
        ORDER BY c.updated_at DESC
      `).all(talent.id)
    } else if (userRole === 'institution') {
      const instProfile = db.prepare('SELECT id FROM institution_profiles WHERE user_id = ?').get(userId) as any
      if (!instProfile) {
        res.status(404).json({ success: false, error: '机构资料不存在' })
        return
      }
      conversations = db.prepare(`
        SELECT c.*, tp.title as talent_title, tp.department as talent_dept, u.name as talent_name
        FROM conversations c
        JOIN talent_profiles tp ON c.talent_id = tp.id
        JOIN users u ON tp.user_id = u.id
        WHERE c.institution_id = ?
        ORDER BY c.updated_at DESC
      `).all(instProfile.id)
    } else {
      conversations = db.prepare(`
        SELECT c.*, ip.institution_name, u_inst.name as institution_user_name,
        tp.title as talent_title, u_talent.name as talent_name
        FROM conversations c
        JOIN institution_profiles ip ON c.institution_id = ip.id
        JOIN users u_inst ON ip.user_id = u_inst.id
        JOIN talent_profiles tp ON c.talent_id = tp.id
        JOIN users u_talent ON tp.user_id = u_talent.id
        ORDER BY c.updated_at DESC
      `).all()
    }
    res.json({ success: true, data: conversations })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/conversations/:id/messages', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.headers['x-user-id']
    if (!userId) {
      res.status(401).json({ success: false, error: '未登录' })
      return
    }
    const conversation = db.prepare('SELECT * FROM conversations WHERE id = ?').get(req.params.id) as any
    if (!conversation) {
      res.status(404).json({ success: false, error: '会话不存在' })
      return
    }
    const { before, limit = '20' } = req.query
    const limitNum = Math.max(1, Math.min(100, Number(limit)))
    let messages
    if (before) {
      messages = db.prepare(`
        SELECT * FROM messages WHERE conversation_id = ? AND id < ? ORDER BY id DESC LIMIT ?
      `).all(req.params.id, Number(before), limitNum)
    } else {
      messages = db.prepare(`
        SELECT * FROM messages WHERE conversation_id = ? ORDER BY id DESC LIMIT ?
      `).all(req.params.id, limitNum)
    }
    messages.reverse()
    res.json({ success: true, data: messages })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.post('/send', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.headers['x-user-id']
    const userRole = req.headers['x-user-role']
    if (!userId) {
      res.status(401).json({ success: false, error: '未登录' })
      return
    }
    const { conversation_id, receiver_id, content, type = 'text' } = req.body
    if (!content) {
      res.status(400).json({ success: false, error: '消息内容不能为空' })
      return
    }
    if (!['text', 'resume_card', 'job_card'].includes(type)) {
      res.status(400).json({ success: false, error: '无效的消息类型' })
      return
    }

    let convId = conversation_id
    if (!convId && receiver_id) {
      let talentId: number | null = null
      let institutionId: number | null = null
      if (userRole === 'talent') {
        const talent = db.prepare('SELECT id FROM talent_profiles WHERE user_id = ?').get(userId) as any
        talentId = talent?.id || null
        const instProfile = db.prepare('SELECT id FROM institution_profiles WHERE user_id = ?').get(receiver_id) as any
        institutionId = instProfile?.id || null
      } else if (userRole === 'institution') {
        const instProfile = db.prepare('SELECT id FROM institution_profiles WHERE user_id = ?').get(userId) as any
        institutionId = instProfile?.id || null
        const talent = db.prepare('SELECT id FROM talent_profiles WHERE user_id = ?').get(receiver_id) as any
        talentId = talent?.id || null
      }
      if (!talentId || !institutionId) {
        res.status(400).json({ success: false, error: '无法确定收件人' })
        return
      }
      let existing = db.prepare('SELECT id FROM conversations WHERE talent_id = ? AND institution_id = ?').get(talentId, institutionId) as any
      if (!existing) {
        const r = db.prepare('INSERT INTO conversations (talent_id, institution_id, last_message, updated_at) VALUES (?, ?, ?, datetime(\'now\'))').run(talentId, institutionId, content)
        convId = Number(r.lastInsertRowid)
      } else {
        convId = existing.id
      }
    }

    if (!convId) {
      res.status(400).json({ success: false, error: '缺少会话信息' })
      return
    }

    const result = db.prepare('INSERT INTO messages (conversation_id, sender_id, sender_role, content, type) VALUES (?, ?, ?, ?, ?)').run(convId, userId, userRole, content, type)
    db.prepare('UPDATE conversations SET last_message = ?, updated_at = datetime(\'now\') WHERE id = ?').run(content, convId)
    const message = db.prepare('SELECT * FROM messages WHERE id = ?').get(result.lastInsertRowid)
    res.status(201).json({ success: true, data: message })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

export default router
