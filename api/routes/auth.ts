import { Router, type Request, type Response } from 'express'
import { AuthService } from '../services/auth.service.js'
import type { AuthErrorCode } from '@shared/types/index.js'

const router = Router()

interface LoginRequest {
  email: string;
  password: string;
  role?: string;
}

interface AuthErrorResponse {
  success: false;
  error: string;
  errorCode: AuthErrorCode;
}

router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, phone, role } = req.body
    const result = await AuthService.register({ name, email, password, phone, role })
    res.json({ success: true, data: result })
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ 
        success: false, 
        error: error.message,
        errorCode: 'USER_NOT_FOUND'
      })
    } else {
      res.status(400).json({ success: false, error: '注册失败', errorCode: 'NETWORK_ERROR' })
    }
  }
})

router.post('/login', async (req: Request<unknown, unknown, LoginRequest>, res: Response): Promise<void> => {
  try {
    const { email, password, role } = req.body
    const result = await AuthService.login(email, password, role)
    res.json({ success: true, data: result })
  } catch (error) {
    const statusCode = 401
    if (error instanceof Error && 'code' in error) {
      const authError = error as { message: string; code: AuthErrorCode }
      res.status(statusCode).json({
        success: false,
        error: authError.message,
        errorCode: authError.code
      } as AuthErrorResponse)
    } else if (error instanceof Error) {
      res.status(statusCode).json({ 
        success: false, 
        error: error.message,
        errorCode: 'NETWORK_ERROR'
      } as AuthErrorResponse)
    } else {
      res.status(statusCode).json({ 
        success: false, 
        error: '登录失败',
        errorCode: 'NETWORK_ERROR'
      } as AuthErrorResponse)
    }
  }
})

router.post('/logout', async (_req: Request, res: Response): Promise<void> => {
  try {
    await AuthService.logout()
    res.json({ success: true, data: { message: '登出成功' } })
  } catch (error) {
    res.status(500).json({ success: false, error: '登出失败', errorCode: 'NETWORK_ERROR' })
  }
})

router.get('/me', async (req: Request, res: Response): Promise<void> => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) {
      res.status(401).json({ success: false, error: '未登录', errorCode: 'USER_NOT_FOUND' })
      return
    }
    const user = await AuthService.getCurrentUser(token)
    if (!user) {
      res.status(401).json({ success: false, error: '用户不存在', errorCode: 'USER_NOT_FOUND' })
      return
    }
    res.json({ success: true, data: { user } })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取用户信息失败', errorCode: 'NETWORK_ERROR' })
  }
})

export default router
