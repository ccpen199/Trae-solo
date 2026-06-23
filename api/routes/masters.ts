import { Router, type Request, type Response } from 'express'
import type { ApiResponse, Master, PaginatedResponse } from '../../shared/types'
import * as masterService from '../services/masterService.js'

const router = Router()

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const pageSize = parseInt(req.query.pageSize as string) || 10
    const filters: { specialty?: string } = {}
    if (req.query.specialty) filters.specialty = req.query.specialty as string
    const result = masterService.getMasters(page, pageSize, filters)
    const response: ApiResponse<PaginatedResponse<Master>> = { code: 0, message: '获取成功', data: result }
    res.json(response)
  } catch (error) {
    const response: ApiResponse<null> = { code: 500, message: '服务器内部错误', data: null }
    res.status(500).json(response)
  }
})

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const result = masterService.getMasterById(id)
    if (!result) {
      const response: ApiResponse<null> = { code: 404, message: '命名师不存在', data: null }
      res.status(404).json(response)
      return
    }
    const response: ApiResponse<Master> = { code: 0, message: '获取成功', data: result }
    res.json(response)
  } catch (error) {
    const response: ApiResponse<null> = { code: 500, message: '服务器内部错误', data: null }
    res.status(500).json(response)
  }
})

router.post('/apply', async (req: Request, res: Response): Promise<void> => {
  try {
    const data = req.body
    const result = masterService.applyForMaster(data)
    const response: ApiResponse<typeof result> = { code: 0, message: '申请已提交', data: result }
    res.json(response)
  } catch (error) {
    const response: ApiResponse<null> = { code: 500, message: '服务器内部错误', data: null }
    res.status(500).json(response)
  }
})

export default router
