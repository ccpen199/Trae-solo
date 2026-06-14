import { Router, type Request, type Response } from 'express'
import db from '../db.js'
import { authMiddleware, roleMiddleware } from '../middleware/auth.js'

const router = Router()

router.get('/status', authMiddleware, roleMiddleware('driver'), (req: Request, res: Response): void => {
  const userId = req.user!.userId
  const profile = db.prepare('SELECT * FROM driver_profiles WHERE user_id = ?').get(userId)

  res.json({
    success: true,
    data: {
      id_card: profile && (profile as any).id_card_no ? 'passed' : 'none',
      transport_license: profile && (profile as any).transport_license_no ? 'passed' : 'none',
      qualification: profile && (profile as any).qualification_no ? 'passed' : 'none',
      overall: (profile as any)?.certification_status || 'none',
      certification_reason: (profile as any)?.certification_reason || '',
    }
  })
})

router.post('/id-card', authMiddleware, roleMiddleware('driver'), (req: Request, res: Response): void => {
  const userId = req.user!.userId
  const { id_card_no, name, frontImage, backImage } = req.body

  if (!id_card_no || !name) {
    res.status(400).json({ success: false, error: '身份证号和姓名为必填' })
    return
  }

  const existing = db.prepare('SELECT id_card_front, id_card_back FROM driver_profiles WHERE user_id = ?').get(userId) as any
  const front = frontImage || existing?.id_card_front || ''
  const back = backImage || existing?.id_card_back || ''

  db.prepare(`
    UPDATE driver_profiles
    SET id_card_no = ?, id_card_front = ?, id_card_back = ?,
        certification_status = 'pending'
    WHERE user_id = ?
  `).run(id_card_no, front, back, userId)

  setTimeout(() => {
    db.prepare("UPDATE driver_profiles SET certification_status = 'passed' WHERE user_id = ? AND certification_status = 'pending'").run(userId)
  }, 1000)

  const profile = db.prepare('SELECT * FROM driver_profiles WHERE user_id = ?').get(userId)

  res.json({
    success: true,
    ocrResult: {
      name,
      id_card_no,
      gender: id_card_no.charAt(16) % 2 === 1 ? '男' : '女',
      birth: id_card_no.substring(6, 14),
    },
    status: 'passed',
    profile,
  })
})

router.post('/transport-license', authMiddleware, roleMiddleware('driver'), (req: Request, res: Response): void => {
  const userId = req.user!.userId
  const { license_no, owner, vehicle_type, image } = req.body

  if (!license_no) {
    res.status(400).json({ success: false, error: '道路运输证号为必填' })
    return
  }

  const existing = db.prepare('SELECT transport_license_image FROM driver_profiles WHERE user_id = ?').get(userId) as any
  const img = image || existing?.transport_license_image || ''

  db.prepare(`
    UPDATE driver_profiles
    SET transport_license_no = ?, transport_license_image = ?,
        certification_status = 'pending'
    WHERE user_id = ?
  `).run(license_no, img, userId)

  setTimeout(() => {
    db.prepare("UPDATE driver_profiles SET certification_status = 'passed' WHERE user_id = ? AND certification_status = 'pending'").run(userId)
  }, 1000)

  const profile = db.prepare('SELECT * FROM driver_profiles WHERE user_id = ?').get(userId)

  res.json({
    success: true,
    ocrResult: {
      license_no,
      owner: owner || '个人',
      vehicle_type: vehicle_type || '普通货运',
      valid_from: '2024-01-01',
      valid_to: '2028-01-01',
    },
    status: 'passed',
    profile,
  })
})

router.post('/qualification', authMiddleware, roleMiddleware('driver'), (req: Request, res: Response): void => {
  const userId = req.user!.userId
  const { qualification_no, name, category, image } = req.body

  if (!qualification_no) {
    res.status(400).json({ success: false, error: '从业资格证号为必填' })
    return
  }

  const existing = db.prepare('SELECT qualification_image FROM driver_profiles WHERE user_id = ?').get(userId) as any
  const img = image || existing?.qualification_image || ''

  db.prepare(`
    UPDATE driver_profiles
    SET qualification_no = ?, qualification_image = ?,
        certification_status = 'pending'
    WHERE user_id = ?
  `).run(qualification_no, img, userId)

  setTimeout(() => {
    db.prepare("UPDATE driver_profiles SET certification_status = 'passed' WHERE user_id = ? AND certification_status = 'pending'").run(userId)
  }, 1000)

  const profile = db.prepare('SELECT * FROM driver_profiles WHERE user_id = ?').get(userId)

  res.json({
    success: true,
    ocrResult: {
      qualification_no,
      name: name || '',
      category: category || '道路运输从业人员',
      issued_date: '2023-06-01',
      valid_period: '6年',
    },
    status: 'passed',
    profile,
  })
})

export default router
