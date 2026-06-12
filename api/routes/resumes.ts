import { Router, type Request, type Response } from 'express'
import multer from 'multer'
import db from '../database.js'

const router = Router()
const upload = multer({ storage: multer.memoryStorage() })

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

router.post('/parse', upload.single('file'), async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.headers['x-user-id']
    if (!userId) {
      res.status(401).json({ success: false, error: '未登录' })
      return
    }
    const talent = db.prepare('SELECT id FROM talent_profiles WHERE user_id = ?').get(userId) as any
    if (!talent) {
      res.status(404).json({ success: false, error: '人才资料不存在' })
      return
    }
    const mockParsed = {
      basic_info: {
        name: '张三',
        phone: '13800138000',
        email: 'zhangsan@example.com',
        gender: '男',
        birthDate: '1990-01-15',
        address: '北京市朝阳区',
        department: '内科',
        title: '主治医师',
        practiceCategory: '临床',
        currentEmployer: '北京协和医院',
        expectedSalary: '25000',
      },
      education: [
        { school: '北京大学医学部', major: '临床医学', degree: '硕士', startDate: '2010-09', endDate: '2015-06' },
        { school: '清华大学医学院', major: '内科学', degree: '博士', startDate: '2015-09', endDate: '2018-06' },
      ],
      certifications: [
        { name: '医师资格证书', number: '2018110111000001', issuedBy: '国家卫生健康委员会', issuedDate: '2018-11-01' },
        { name: '主治医师资格证', number: '2021110111000002', issuedBy: '北京市卫生健康委员会', issuedDate: '2021-11-01' },
      ],
      work_experience: [
        { institution: '北京协和医院', department: '心内科', title: '住院医师', startDate: '2018-07', endDate: '2021-06', description: '负责心内科常见病、多发病的诊断和治疗' },
        { institution: '北京协和医院', department: '心内科', title: '主治医师', startDate: '2021-07', endDate: '', description: '独立处理心内科疑难病例，参与教学和科研工作' },
      ],
    }
    res.json({ success: true, data: mockParsed })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/:id/export-pdf', async (req: Request, res: Response): Promise<void> => {
  try {
    const resume = db.prepare('SELECT * FROM resumes WHERE id = ?').get(req.params.id) as any
    if (!resume) {
      res.status(404).json({ success: false, error: '简历不存在' })
      return
    }
    const pdfContent = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>
endobj
4 0 obj
<< /Length 44 >>
stream
BT
/F1 24 Tf
100 700 Td
(Resume Export) Tj
ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000010 00000 n 
0000000060 00000 n 
0000000110 00000 n 
0000000180 00000 n 
0000000290 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
360
%%EOF`
    const buffer = Buffer.from(pdfContent, 'utf-8')
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="resume-${req.params.id}.pdf"`)
    res.setHeader('Content-Length', buffer.length)
    res.send(buffer)
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

export default router
