import { Router, type Request, type Response } from 'express'
import { mockPolicies } from '../data/mock.js'
import type { PolicyDocument } from '../../shared/types.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  try {
    res.json({
      success: true,
      data: mockPolicies as PolicyDocument[],
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取政策列表失败',
    })
  }
})

router.get('/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    const policy = mockPolicies.find((p) => p.id === id)

    if (!policy) {
      res.status(404).json({
        success: false,
        error: '未找到该政策',
      })
      return
    }

    res.json({
      success: true,
      data: policy as PolicyDocument,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取政策详情失败',
    })
  }
})

export default router
