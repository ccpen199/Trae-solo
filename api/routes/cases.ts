import { Router, type Request, type Response } from 'express'
import type { ApiResponse, CaseStudy, PaginatedResponse } from '../../shared/types'
import * as caseService from '../services/caseService.js'

const router = Router()

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const pageSize = parseInt(req.query.pageSize as string) || 10
    const filters: { masterId?: string; gender?: string } = {}
    if (req.query.masterId) filters.masterId = req.query.masterId as string
    if (req.query.gender) filters.gender = req.query.gender as string
    const result = caseService.getCases(page, pageSize, filters)
    const response: ApiResponse<PaginatedResponse<CaseStudy>> = { code: 0, message: '获取成功', data: result }
    res.json(response)
  } catch (error) {
    const response: ApiResponse<null> = { code: 500, message: '服务器内部错误', data: null }
    res.status(500).json(response)
  }
})

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const result = caseService.getCaseById(id)
    if (!result) {
      const response: ApiResponse<null> = { code: 404, message: '案例不存在', data: null }
      res.status(404).json(response)
      return
    }
    const response: ApiResponse<CaseStudy> = { code: 0, message: '获取成功', data: result }
    res.json(response)
  } catch (error) {
    const response: ApiResponse<null> = { code: 500, message: '服务器内部错误', data: null }
    res.status(500).json(response)
  }
})

router.post('/:id/authorize', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const { userId } = req.body
    const result = caseService.authorizeCase(id, userId)
    const response: ApiResponse<typeof result> = { code: 0, message: '授权成功', data: result }
    res.json(response)
  } catch (error) {
    const response: ApiResponse<null> = { code: 500, message: '服务器内部错误', data: null }
    res.status(500).json(response)
  }
})

export default router
