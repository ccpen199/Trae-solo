import { Router, type Request, type Response } from 'express'
import authMiddleware from '../middleware/auth.js'
import { householdBiz, incrementUsageCount, getUserHouseholdBiz } from '../store/memory.js'
import type { HouseholdBiz, HouseholdBizType } from '../../shared/types.js'

const router = Router()

router.get('/list', authMiddleware(), async (req: Request, res: Response): Promise<void> => {
  const userId = req.userId || 'demo-user'
  incrementUsageCount(userId, 'household')

  const list = getUserHouseholdBiz(userId)

  req.auditAction = 'get_household_list'
  req.auditModule = 'household'

  res.json({
    success: true,
    data: list,
    total: list.length,
  })
})

router.get('/:id', authMiddleware(), async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params
  const biz = householdBiz.get(id)

  if (!biz) {
    res.status(404).json({ success: false, error: '业务记录不存在' })
    return
  }

  req.auditAction = 'get_household_detail'
  req.auditModule = 'household'

  res.json({
    success: true,
    data: biz,
  })
})

router.post('/submit', authMiddleware(), async (req: Request, res: Response): Promise<void> => {
  const userId = req.userId || 'demo-user'
  const { type, title, materials } = req.body

  const typeMap: Record<HouseholdBizType, string> = {
    settle: '落户申请',
    residence: '居住证办理',
    newborn: '新生儿入户',
  }

  const newBiz: HouseholdBiz = {
    id: 'biz-' + type + '-' + Date.now(),
    type: type || 'settle',
    title: title || typeMap[type as HouseholdBizType] || '户籍业务',
    status: 'submitted',
    steps: [
      { name: '提交申请', status: 'done', time: new Date().toISOString(), desc: '材料已提交' },
      { name: '材料预审', status: 'active', desc: '等待预审' },
      { name: '部门审核', status: 'pending' },
      { name: '审批决定', status: 'pending' },
      { name: '办结', status: 'pending' },
    ],
    submittedAt: new Date().toISOString(),
    estimatedDays: 15,
    materials: materials || [
      { name: '身份证', required: true, uploaded: true, ocrPassed: true },
    ],
  }

  householdBiz.set(newBiz.id, newBiz)

  req.auditAction = 'submit_household'
  req.auditModule = 'household'

  res.json({
    success: true,
    data: {
      id: newBiz.id,
      status: newBiz.status,
      title: newBiz.title,
    },
  })
})

router.post('/ocr', authMiddleware(), async (req: Request, res: Response): Promise<void> => {
  const userId = req.userId || 'demo-user'
  const { materialType, image } = req.body

  const mockFields: Record<string, Record<string, string>> = {
    idcard: {
      name: '张三',
      idNumber: '110101199001011234',
      address: '北京市朝阳区建国路88号',
      birth: '1990-01-01',
      ethnicity: '汉',
      sex: '男',
    },
    hukou: {
      householdNumber: '110105001234',
      address: '北京市朝阳区建国路88号',
      members: '3人',
    },
  }

  const passed = Math.random() > 0.1
  const warnings: string[] = []

  if (!passed) {
    warnings.push('图片清晰度不足，请重新上传')
  }

  req.auditAction = 'ocr_material'
  req.auditModule = 'household'

  res.json({
    success: true,
    data: {
      passed,
      fields: mockFields[materialType] || mockFields.idcard,
      warnings,
    },
  })
})

export default router
