import { Router, type Request, type Response } from 'express'
import db from '../db.js'
import { authMiddleware } from '../auth.js'
import bcrypt from 'bcryptjs'

const router = Router()

router.get('/profile', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = db.prepare('SELECT id, username, role, real_name, id_number, phone, digital_cert, created_at FROM users WHERE id = ?').get(req.user!.id) as any
    if (!user) {
      res.status(404).json({ success: false, error: '用户不存在' })
      return
    }
    const taxpayers = db.prepare('SELECT * FROM taxpayers WHERE user_id = ?').all(user.id)
    res.json({ success: true, data: { ...user, taxpayers } })
  } catch (err) {
    res.status(500).json({ success: false, error: '获取账户信息失败' })
  }
})

router.put('/profile', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { real_name, phone } = req.body
    db.prepare('UPDATE users SET real_name=?, phone=? WHERE id=?')
      .run(real_name || req.user!.real_name, phone || null, req.user!.id)
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ success: false, error: '更新账户信息失败' })
  }
})

router.put('/password', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { old_password, new_password } = req.body
    if (!old_password || !new_password) {
      res.status(400).json({ success: false, error: '缺少密码参数' })
      return
    }
    const user = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(req.user!.id) as any
    if (!bcrypt.compareSync(old_password, user.password_hash)) {
      res.status(400).json({ success: false, error: '原密码错误' })
      return
    }
    const hash = bcrypt.hashSync(new_password, 10)
    db.prepare('UPDATE users SET password_hash=? WHERE id=?').run(hash, req.user!.id)
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ success: false, error: '修改密码失败' })
  }
})

router.post('/certificate', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { cert_data } = req.body
    if (!cert_data) {
      res.status(400).json({ success: false, error: '缺少证书数据' })
      return
    }
    const certId = `CERT-USER-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
    db.prepare('UPDATE users SET digital_cert=? WHERE id=?').run(certId, req.user!.id)
    res.json({ success: true, data: { cert_id: certId } })
  } catch (err) {
    res.status(500).json({ success: false, error: '绑定数字证书失败' })
  }
})

router.get('/logs', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const logs = db.prepare(
      'SELECT * FROM audit_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT 50'
    ).all(req.user!.id)
    res.json({ success: true, data: logs })
  } catch (err) {
    res.status(500).json({ success: false, error: '获取操作日志失败' })
  }
})

export default router
