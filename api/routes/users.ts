import { Router, type Request, type Response } from 'express'
import { successResponse, errorResponse } from '../utils/response.js'
import { authenticate } from '../middleware/auth.js'
import { requirePermission } from '../middleware/permission.js'
import { getUsers, createUser, updateUser } from '../services/user.service.js'
import type { User } from '../types/index.js'

const router = Router()

router.get('/', authenticate, requirePermission('user', 'read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const users = await getUsers()
    res.json(successResponse(users, '获取用户列表成功'))
  } catch (error) {
    const message = error instanceof Error ? error.message : '获取用户列表失败'
    res.status(400).json(errorResponse(message, 400))
  }
})

router.post('/', authenticate, requirePermission('user', 'create'), async (req: Request, res: Response): Promise<void> => {
  try {
    const data = req.body as Partial<User> & { password: string }

    if (!data.username || !data.password || !data.name || !data.role || !data.phone) {
      res.status(400).json(errorResponse('用户名、密码、姓名、角色和手机号不能为空', 400))
      return
    }

    const user = await createUser(data)
    res.status(201).json(successResponse(user, '创建用户成功'))
  } catch (error) {
    const message = error instanceof Error ? error.message : '创建用户失败'
    res.status(400).json(errorResponse(message, 400))
  }
})

router.put('/:id', authenticate, requirePermission('user', 'update'), async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10)
    if (isNaN(id)) {
      res.status(400).json(errorResponse('无效的用户ID', 400))
      return
    }

    const data = req.body as Partial<User>
    const user = await updateUser(id, data)
    res.json(successResponse(user, '更新用户成功'))
  } catch (error) {
    const message = error instanceof Error ? error.message : '更新用户失败'
    res.status(400).json(errorResponse(message, 400))
  }
})

export default router
