import { Router, type Request, type Response } from 'express'
import db from '../database.js'

const router = Router()

function parseResume(basicInfo: string) {
  try {
    const info = JSON.parse(basicInfo)
    const parsed: any = {}
    if (info.name) parsed.name = info.name
    if (info.gender) parsed.gender = info.gender
    if (info.age) parsed.age = info.age
    if (info.location) parsed.location = info.location
    if (info.practice_category) parsed.practice_category = info.practice_category
    if (info.department) parsed.department = info.department
    if (info.title) parsed.title = info.title
    parsed.parsed_at = new Date().toISOString()
    parsed.confidence = 0.92
    return parsed
  } catch {
    return { parsed_at: new Date().toISOString(), confidence: 0 }
  }
}

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.headers['x-user-id']
    const userRole = req.headers['x-user-role']
    if (!userId) {
      res.status(401).json({ success: false, error: '未登录' })
      return
    }
    let resumes
    if (userRole === 'talent') {
      const talent = db.prepare('SELECT id FROM talent_profiles WHERE user_id = ?').get(userId) as any
      if (!talent) {
        res.status(404).json({ success: false, error: '人才资料不存在' })
        return
      }
      resumes = db.prepare('SELECT * FROM resumes WHERE talent_id = ?').all(talent.id)
    } else if (userRole === 'institution' || userRole === 'admin') {
      resumes = db.prepare(`
        SELECT r.*, tp.department, tp.title, tp.practice_category, u.name as talent_name
        FROM resumes r
        JOIN talent_profiles tp ON r.talent_id = tp.id
        JOIN users u ON tp.user_id = u.id
      `).all()
    } else {
      resumes = []
    }
    res.json({ success: true, data: resumes })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.headers['x-user-id']
    if (!userId) {
      res.status(401).json({ success: false, error: '未登录' })
      return
    }
    const resume = db.prepare(`
      SELECT r.*, tp.department, tp.title, tp.practice_category, u.name as talent_name
      FROM resumes r
      JOIN talent_profiles tp ON r.talent_id = tp.id
      JOIN users u ON tp.user_id = u.id
      WHERE r.id = ?
    `).get(req.params.id) as any
    if (!resume) {
      res.status(404).json({ success: false, error: '简历不存在' })
      return
    }
    const privacy = JSON.parse(resume.privacy_settings || '{}')
    if (privacy.realName && resume.talent_name) {
      resume.talent_name = resume.talent_name.charAt(0) + '**'
    }
    if (privacy.phone) {
      const info = JSON.parse(resume.basic_info || '{}')
      if (info.phone) info.phone = info.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
      resume.basic_info = JSON.stringify(info)
    }
    if (privacy.email) {
      const info = JSON.parse(resume.basic_info || '{}')
      if (info.email) info.email = info.email.replace(/(.{2}).*(@.*)/, '$1***$2')
      resume.basic_info = JSON.stringify(info)
    }
    res.json({ success: true, data: resume })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.headers['x-user-id']
    const userRole = req.headers['x-user-role']
    if (!userId || userRole !== 'talent') {
      res.status(403).json({ success: false, error: '仅人才用户可创建简历' })
      return
    }
    const talent = db.prepare('SELECT id FROM talent_profiles WHERE user_id = ?').get(userId) as any
    if (!talent) {
      res.status(404).json({ success: false, error: '人才资料不存在' })
      return
    }
    const { basic_info, education, certifications, work_experience, privacy_settings } = req.body
    const result = db.prepare(`
      INSERT INTO resumes (talent_id, basic_info, education, certifications, work_experience, privacy_settings)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      talent.id,
      JSON.stringify(basic_info || {}),
      JSON.stringify(education || []),
      JSON.stringify(certifications || []),
      JSON.stringify(work_experience || []),
      JSON.stringify(privacy_settings || {})
    )
    const resume = db.prepare('SELECT * FROM resumes WHERE id = ?').get(result.lastInsertRowid)
    res.status(201).json({ success: true, data: resume })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.headers['x-user-id']
    if (!userId) {
      res.status(401).json({ success: false, error: '未登录' })
      return
    }
    const existing = db.prepare('SELECT * FROM resumes WHERE id = ?').get(req.params.id) as any
    if (!existing) {
      res.status(404).json({ success: false, error: '简历不存在' })
      return
    }
    const talent = db.prepare('SELECT id FROM talent_profiles WHERE user_id = ?').get(userId) as any
    if (!talent || (talent.id !== existing.talent_id && req.headers['x-user-role'] !== 'admin')) {
      res.status(403).json({ success: false, error: '无权修改此简历' })
      return
    }
    const { basic_info, education, certifications, work_experience, privacy_settings } = req.body
    db.prepare(`
      UPDATE resumes SET basic_info = COALESCE(?, basic_info), education = COALESCE(?, education),
      certifications = COALESCE(?, certifications), work_experience = COALESCE(?, work_experience),
      privacy_settings = COALESCE(?, privacy_settings), updated_at = datetime('now') WHERE id = ?
    `).run(
      basic_info ? JSON.stringify(basic_info) : null,
      education ? JSON.stringify(education) : null,
      certifications ? JSON.stringify(certifications) : null,
      work_experience ? JSON.stringify(work_experience) : null,
      privacy_settings ? JSON.stringify(privacy_settings) : null,
      req.params.id
    )
    const resume = db.prepare('SELECT * FROM resumes WHERE id = ?').get(req.params.id)
    res.json({ success: true, data: resume })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.headers['x-user-id']
    if (!userId) {
      res.status(401).json({ success: false, error: '未登录' })
      return
    }
    const existing = db.prepare('SELECT * FROM resumes WHERE id = ?').get(req.params.id) as any
    if (!existing) {
      res.status(404).json({ success: false, error: '简历不存在' })
      return
    }
    const talent = db.prepare('SELECT id FROM talent_profiles WHERE user_id = ?').get(userId) as any
    if (!talent || (talent.id !== existing.talent_id && req.headers['x-user-role'] !== 'admin')) {
      res.status(403).json({ success: false, error: '无权删除此简历' })
      return
    }
    db.prepare('DELETE FROM resumes WHERE id = ?').run(req.params.id)
    res.json({ success: true, data: null })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.post('/:id/parse', async (req: Request, res: Response): Promise<void> => {
  try {
    const resume = db.prepare('SELECT * FROM resumes WHERE id = ?').get(req.params.id) as any
    if (!resume) {
      res.status(404).json({ success: false, error: '简历不存在' })
      return
    }
    const parsed = parseResume(resume.basic_info)
    res.json({ success: true, data: parsed })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/:id/export', async (req: Request, res: Response): Promise<void> => {
  try {
    const resume = db.prepare('SELECT * FROM resumes WHERE id = ?').get(req.params.id) as any
    if (!resume) {
      res.status(404).json({ success: false, error: '简历不存在' })
      return
    }
    res.json({ success: true, data: { message: 'PDF导出功能待实现', resume_id: resume.id } })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

export default router
