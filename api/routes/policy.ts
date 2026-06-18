import { Router, type Request, type Response } from 'express'
import { getDb } from '../db.js'
import { auth } from '../middleware/auth.js'

const router = Router()

router.get('/search', (req: Request, res: Response): void => {
  const { q } = req.query
  if (!q || typeof q !== 'string') {
    res.status(400).json({ ok: false, error: '缺少搜索关键词' })
    return
  }

  const db = getDb()
  const keyword = `%${q}%`
  const results = db.prepare(
    "SELECT * FROM policy_articles WHERE title LIKE ? OR content LIKE ? OR keywords LIKE ?"
  ).all(keyword, keyword, keyword)

  res.json({ ok: true, results })
})

router.post('/material/recognize', auth, (req: Request, res: Response): void => {
  const { fileData, fileName } = req.body
  if (!fileData || !fileName) {
    res.status(400).json({ ok: false, error: '缺少文件数据' })
    return
  }

  const db = getDb()
  const userId = req.user!.userId

  const recognized = {
    name: fileName,
    category: '身份证明',
    recognizedText: `已识别文件: ${fileName}。经OCR识别，该材料包含身份信息、姓名、证件号码等内容。`,
    reusableFor: ['失业金申领', '职称申报', '劳动合同签署'],
  }

  db.prepare(
    'INSERT INTO materials (user_id, name, category, file_path, recognized_text, reusable_for) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(userId, fileName, recognized.category, `/uploads/${fileName}`, recognized.recognizedText, JSON.stringify(recognized.reusableFor))

  res.json({ ok: true, recognized })
})

router.get('/material/reuse', auth, (req: Request, res: Response): void => {
  const db = getDb()
  const materials = db.prepare(
    'SELECT * FROM materials WHERE user_id = ? ORDER BY created_at DESC'
  ).all(req.user!.userId)

  const materialsWithReuse = materials.map((m: any) => ({
    ...m,
    reusable_for: JSON.parse(m.reusable_for || '[]'),
  }))

  res.json({ ok: true, materials: materialsWithReuse })
})

export default router
