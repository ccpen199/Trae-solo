import express from 'express';
import bcrypt from 'bcryptjs';
import db from '../database';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

router.get('/profile', authenticateToken, (req: AuthRequest, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user?.id) as any;

  if (!user) {
    return res.status(404).json({ error: '用户不存在' });
  }

  res.json({
    id: user.id,
    username: user.username,
    email: user.email,
    avatar: user.avatar,
    phone: user.phone,
    wechat: user.wechat,
    meetingNumber: user.meeting_number,
    role: user.role,
    plan: user.plan,
    recordingSpace: user.recording_space,
    maxRecordingSpace: user.max_recording_space,
    createdAt: user.created_at
  });
});

router.put('/profile', authenticateToken, (req: AuthRequest, res) => {
  const { username, email, phone, wechat, avatar } = req.body;
  const userId = req.user?.id;

  try {
    const stmt = db.prepare(`
      UPDATE users 
      SET username = ?, email = ?, phone = ?, wechat = ?, avatar = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    stmt.run(username, email, phone, wechat, avatar, userId);

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any;
    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      phone: user.phone,
      wechat: user.wechat,
      meetingNumber: user.meeting_number,
      role: user.role,
      plan: user.plan
    });
  } catch (err: any) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(400).json({ error: '用户名或邮箱已存在' });
    }
    res.status(500).json({ error: '更新失败' });
  }
});

router.put('/password', authenticateToken, (req: AuthRequest, res) => {
  const { oldPassword, newPassword } = req.body;
  const userId = req.user?.id;

  if (!oldPassword || !newPassword) {
    return res.status(400).json({ error: '请填写完整信息' });
  }

  const user = db.prepare('SELECT password FROM users WHERE id = ?').get(userId) as any;

  if (!bcrypt.compareSync(oldPassword, user.password)) {
    return res.status(400).json({ error: '原密码错误' });
  }

  const hashedPassword = bcrypt.hashSync(newPassword, 10);
  db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashedPassword, userId);

  res.json({ message: '密码修改成功' });
});

export default router;
