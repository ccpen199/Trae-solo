import { Router, type Request, type Response } from 'express'
import authMiddleware from '../middleware/auth.js'
import { schools, districts, incrementUsageCount } from '../store/memory.js'
import type { School, EnrollRequest } from '../../shared/types.js'

const router = Router()

router.get('/schools', authMiddleware(), async (req: Request, res: Response): Promise<void> => {
  const userId = req.userId || 'demo-user'
  incrementUsageCount(userId, 'education')

  const { district, level, keyword } = req.query

  let schoolList = schools.get('default') || []

  if (district) {
    schoolList = schoolList.filter((s: School) => s.district === district)
  }
  if (level) {
    schoolList = schoolList.filter((s: School) => s.level === level)
  }
  if (keyword) {
    const kw = (keyword as string).toLowerCase()
    schoolList = schoolList.filter(
      (s: School) => s.name.toLowerCase().includes(kw) || s.address.toLowerCase().includes(kw)
    )
  }

  req.auditAction = 'get_schools'
  req.auditModule = 'education'

  res.json({
    success: true,
    data: schoolList,
    total: schoolList.length,
  })
})

router.get('/districts', authMiddleware(), async (req: Request, res: Response): Promise<void> => {
  const userId = req.userId || 'demo-user'
  incrementUsageCount(userId, 'education')

  const districtList = districts.get('default') || []

  req.auditAction = 'get_districts'
  req.auditModule = 'education'

  res.json({
    success: true,
    data: districtList,
  })
})

router.post('/enroll', authMiddleware(), async (req: Request, res: Response): Promise<void> => {
  const userId = req.userId || 'demo-user'
  const { childName, childIdCard, schoolId, district, materials } = req.body as EnrollRequest

  if (!childName || !childIdCard || !schoolId) {
    res.status(400).json({ success: false, error: '请填写完整的报名信息' })
    return
  }

  const schoolList = schools.get('default') || []
  const school = schoolList.find((s: School) => s.id === schoolId)

  const enrollId = 'enroll-' + Date.now()

  req.auditAction = 'submit_enroll'
  req.auditModule = 'education'

  res.json({
    success: true,
    data: {
      id: enrollId,
      status: 'submitted',
      childName,
      schoolName: school?.name || '未知学校',
      district,
      submittedAt: new Date().toISOString(),
      estimatedNoticeDate: '2026-07-15',
      materialsStatus: materials?.map((m) => ({
        name: m.name,
        status: m.uploaded ? 'uploaded' : 'pending',
      })),
    },
  })
})

export default router
