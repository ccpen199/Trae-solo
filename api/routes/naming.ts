import { Router, type Request, type Response } from 'express'
import type { ApiResponse, NamingInput, BaZiResult, NameProposal } from '../../shared/types'
import * as namingService from '../services/namingService.js'

const router = Router()

router.post('/analyze-bazi', async (req: Request, res: Response): Promise<void> => {
  try {
    const input = req.body as NamingInput
    const userId = req.headers['x-user-id'] as string | undefined
    const result = namingService.analyzeBaZi(input, userId)
    const response: ApiResponse<{ bazi: BaZiResult; historyId: string }> = {
      code: 0,
      message: '分析成功',
      data: result
    }
    res.json(response)
  } catch (error) {
    const response: ApiResponse<null> = { code: 500, message: '服务器内部错误', data: null }
    res.status(500).json(response)
  }
})

router.post('/generate', async (req: Request, res: Response): Promise<void> => {
  try {
    const input = req.body as NamingInput
    const userId = req.headers['x-user-id'] as string | undefined
    const result = namingService.generateNames(input, userId)
    const response: ApiResponse<{ proposals: NameProposal[]; bazi: BaZiResult; historyId: string }> = {
      code: 0,
      message: '生成成功',
      data: result
    }
    res.json(response)
  } catch (error) {
    const response: ApiResponse<null> = { code: 500, message: '服务器内部错误', data: null }
    res.status(500).json(response)
  }
})

router.get('/results/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const result = namingService.getNamingHistory(id)
    if (!result) {
      const response: ApiResponse<null> = { code: 404, message: '记录不存在', data: null }
      res.status(404).json(response)
      return
    }
    const response: ApiResponse<typeof result> = { code: 0, message: '获取成功', data: result }
    res.json(response)
  } catch (error) {
    const response: ApiResponse<null> = { code: 500, message: '服务器内部错误', data: null }
    res.status(500).json(response)
  }
})

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

export default router
