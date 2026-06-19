import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { getDb } from '../database';
import { verifyToken, JWT_SECRET } from '../middleware/auth';
import type { AuthenticatedRequest, Resident } from '../types';

const router = Router();

router.post('/login', (req, res) => {
  const { phone, verification_code } = req.body;

  if (!phone || !verification_code) {
    res.status(400).json({ success: false, error: '手机号和验证码不能为空' });
    return;
  }

  if (verification_code !== '123456') {
    res.status(401).json({ success: false, error: '验证码错误' });
    return;
  }

  const db = getDb();
  let resident = db.prepare('SELECT * FROM residents WHERE phone = ? AND status = ?').get(phone, 'active') as Resident | undefined;

  if (!resident) {
    res.status(404).json({ success: false, error: '用户未注册' });
    return;
  }

  const token = jwt.sign({ id: resident.id }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ success: true, data: { token, user: resident } });
});

router.post('/saml/callback', (req, res) => {
  const { saml_id, name } = req.body;

  if (!saml_id) {
    res.status(400).json({ success: false, error: 'SAML ID 不能为空' });
    return;
  }

  const db = getDb();
  let resident = db.prepare('SELECT * FROM residents WHERE saml_id = ? AND status = ?').get(saml_id, 'active') as Resident | undefined;

  if (!resident) {
    res.status(404).json({ success: false, error: 'SAML 用户未关联' });
    return;
  }

  const token = jwt.sign({ id: resident.id }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ success: true, data: { token, user: resident } });
});

router.get('/me', verifyToken, (req, res) => {
  const authReq = req as AuthenticatedRequest;
  res.json({ success: true, data: authReq.user });
});

export default router;
