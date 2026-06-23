import { Router, type Request, type Response } from 'express'
import type { ApiResponse, User, Master, CaseStudy, PaginatedResponse } from '../../shared/types'
import * as userService from '../services/userService.js'
import * as masterService from '../services/masterService.js'
import * as caseService from '../services/caseService.js'
import { users, namingHistories, masterProfiles } from '../db/index.js'

const router = Router()

router.get('/stats', async (req: Request, res: Response): Promise<void> => {
  try {
    const userCount = users.length
    const namingCount = namingHistories.length
    const masterCount = masterProfiles.filter(mp => mp.status === 'approved').length
    const result = {
      userCount,
      namingCount,
      masterCount,
      revenue: namingCount * 9.9
    }
    const response: ApiResponse<typeof result> = { code: 0, message: '获取成功', data: result }
    res.json(response)
  } catch (error) {
    const response: ApiResponse<null> = { code: 500, message: '服务器内部错误', data: null }
    res.status(500).json(response)
  }
})

router.get('/users', async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const pageSize = parseInt(req.query.pageSize as string) || 10
    const result = userService.getUsers(page, pageSize)
    const response: ApiResponse<PaginatedResponse<User>> = { code: 0, message: '获取成功', data: result }
    res.json(response)
  } catch (error) {
    const response: ApiResponse<null> = { code: 500, message: '服务器内部错误', data: null }
    res.status(500).json(response)
  }
})

router.get('/masters/pending', async (req: Request, res: Response): Promise<void> => {
  try {
    const result = masterService.getPendingMasters()
    const response: ApiResponse<Master[]> = { code: 0, message: '获取成功', data: result }
    res.json(response)
  } catch (error) {
    const response: ApiResponse<null> = { code: 500, message: '服务器内部错误', data: null }
    res.status(500).json(response)
  }
})

router.post('/masters/:id/review', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const { action, note } = req.body
    const result = masterService.reviewMaster(id, action, note)
    const response: ApiResponse<typeof result> = { code: 0, message: '审核完成', data: result }
    res.json(response)
  } catch (error) {
    const response: ApiResponse<null> = { code: 500, message: '服务器内部错误', data: null }
    res.status(500).json(response)
  }
})

router.get('/cases/pending', async (req: Request, res: Response): Promise<void> => {
  try {
    const result = caseService.getPendingCases()
    const response: ApiResponse<CaseStudy[]> = { code: 0, message: '获取成功', data: result }
    res.json(response)
  } catch (error) {
    const response: ApiResponse<null> = { code: 500, message: '服务器内部错误', data: null }
    res.status(500).json(response)
  }
})

router.post('/cases/:id/review', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const { action } = req.body
    const result = caseService.reviewCase(id, action)
    const response: ApiResponse<typeof result> = { code: 0, message: '审核完成', data: result }
    res.json(response)
  } catch (error) {
    const response: ApiResponse<null> = { code: 500, message: '服务器内部错误', data: null }
    res.status(500).json(response)
  }
})

export default router
