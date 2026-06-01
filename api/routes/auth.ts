import { Router, type Request, type Response } from 'express'

const router = Router()

router.post('/login', (req: Request, res: Response) => {
  const { phone, password } = req.body
  res.json({
    success: true,
    data: {
      id: 1,
      phone,
      name: '用户',
      role: 'personal',
      token: 'mock-jwt-token',
    },
  })
})

router.post('/logout', (req: Request, res: Response) => {
  res.json({ success: true, message: 'Logged out' })
})

router.get('/profile', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      id: 1,
      phone: '138****8001',
      name: '张*三',
      role: 'personal',
      created_at: '2024-01-01T00:00:00.000Z',
    },
  })
})

export default router
