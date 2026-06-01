import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../database';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'cloud-meeting-secret-key-2024';

function generateMeetingNumber() {
  return Math.floor(100000000 + Math.random() * 900000000).toString();
}

router.post('/register', (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: '请填写完整信息' });
  }

  try {
    const hashedPassword = bcrypt.hashSync(password, 10);
    let meetingNumber = generateMeetingNumber();

    while (db.prepare('SELECT id FROM users WHERE meeting_number = ?').get(meetingNumber)) {
      meetingNumber = generateMeetingNumber();
    }

    const stmt = db.prepare(`
      INSERT INTO users (username, email, password, meeting_number)
      VALUES (?, ?, ?, ?)
    `);
    const result = stmt.run(username, email, hashedPassword, meetingNumber);

    const token = jwt.sign(
      { id: result.lastInsertRowid, username, role: 'user', plan: 'free' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: result.lastInsertRowid,
        username,
        email,
        meetingNumber,
        role: 'user',
        plan: 'free'
      }
    });
  } catch (err: any) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(400).json({ error: '用户名或邮箱已存在' });
    }
    res.status(500).json({ error: '注册失败' });
  }
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: '请填写邮箱和密码' });
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;

  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: '邮箱或密码错误' });
  }

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role, plan: user.plan },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({
    token,
    user: {
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
      maxRecordingSpace: user.max_recording_space
    }
  });
});

router.get('/me', (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: '未登录' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(decoded.id) as any;

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
      maxRecordingSpace: user.max_recording_space
    });
  } catch (err) {
    res.status(403).json({ error: 'Token 无效' });
  }
});

export default router;
