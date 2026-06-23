import { Router, type Request, type Response } from 'express'
import type { ApiResponse, NameProposal, CaseStudy, PaginatedResponse } from '../../shared/types'
import * as userService from '../services/userService.js'
import * as namingService from '../services/namingService.js'

const router = Router()

router.get('/history', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.headers['x-user-id'] as string
    const page = parseInt(req.query.page as string) || 1
    const pageSize = parseInt(req.query.pageSize as string) || 10
    const result = namingService.getUserHistory(userId, page, pageSize)
    const response: ApiResponse<typeof result> = { code: 0, message: '获取成功', data: result }
    res.json(response)
  } catch (error) {
    const response: ApiResponse<null> = { code: 500, message: '服务器内部错误', data: null }
    res.status(500).json(response)
  }
})

router.get('/favorites', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.headers['x-user-id'] as string
    const result = userService.getFavorites(userId)
    const response: ApiResponse<{ names: NameProposal[]; cases: CaseStudy[] }> = {
      code: 0,
      message: '获取成功',
      data: result
    }
    res.json(response)
  } catch (error) {
    const response: ApiResponse<null> = { code: 500, message: '服务器内部错误', data: null }
    res.status(500).json(response)
  }
})

router.post('/favorites/name/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.headers['x-user-id'] as string
    const { id } = req.params
    const { action } = req.body
    const result = userService.toggleFavorite(userId, 'name', id)
    const response: ApiResponse<typeof result> = { code: 0, message: '操作成功', data: result }
    res.json(response)
  } catch (error) {
    const response: ApiResponse<null> = { code: 500, message: '服务器内部错误', data: null }
    res.status(500).json(response)
  }
})

export default router
