import { Router, type Request, type Response } from 'express'
import { mockDesigners, mockCases } from '../../src/mock/data.js'
import type { Designer, DesignerApplyRequest, ApiResponse } from '../../shared/types/index.js'

const router = Router()

router.get('/:id', (req: Request<{ id: string }>, res: Response): void => {
  const { id } = req.params
  const designer = mockDesigners.find((d) => d.id === id)

  if (!designer) {
    const response: ApiResponse = {
      success: false,
      error: '设计师不存在',
    }
    res.status(404).json(response)
    return
  }

  if (designer.status !== 'approved') {
    const response: ApiResponse = {
      success: false,
      error: '该设计师尚未通过审核',
    }
    res.status(403).json(response)
    return
  }

  const cases = mockCases.filter((c) => c.designerId === id)

  const response: ApiResponse = {
    success: true,
    data: {
      designer,
      cases,
      caseCount: cases.length,
    },
  }

  res.status(200).json(response)
})

router.post(
  '/apply',
  (req: Request<unknown, unknown, DesignerApplyRequest>, res: Response): void => {
    const { userId, name, title, company, experience, specialties, bio, portfolio } = req.body

    if (!userId || !name || !title || !company || !experience || !specialties || !bio) {
      const response: ApiResponse = {
        success: false,
        error: '缺少必要参数：userId, name, title, company, experience, specialties, bio',
      }
      res.status(400).json(response)
      return
    }

    const newDesigner: Designer = {
      id: `d${Date.now()}`,
      userId,
      name,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
      title,
      company,
      yearsOfExperience: Number(experience),
      experience: Number(experience),
      rating: 0,
      completedCases: 0,
      totalCases: 0,
      status: 'pending',
      specialties: Array.isArray(specialties) ? specialties : String(specialties).split(','),
      styleTags: Array.isArray(specialties) ? specialties : String(specialties).split(','),
      bio,
      portfolio: Array.isArray(portfolio) ? portfolio : [],
      applyTime: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    }

    mockDesigners.push(newDesigner)

    const response: ApiResponse = {
      success: true,
      message: '设计师申请已提交，等待审核',
      data: newDesigner,
    }

    res.status(201).json(response)
  },
)

export default router
