import { Router, type Request, type Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../db.js';
import { logOperation, addBlockchainRecord } from '../security.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'tax_service_secret_key_2024';

function getIdCardInfo(idCard: string): { valid: boolean; birthDate?: string; gender?: string } {
  if (idCard.length !== 18) return { valid: false };
  
  const birthDate = `${idCard.substring(6, 10)}-${idCard.substring(10, 12)}-${idCard.substring(12, 14)}`;
  const genderCode = parseInt(idCard.substring(16, 17));
  const gender = genderCode % 2 === 1 ? '男' : '女';
  
  return { valid: true, birthDate, gender };
}

function verifyBankCard(cardNumber: string): boolean {
  if (!/^\d{16,19}$/.test(cardNumber)) return false;
  
  const digits = cardNumber.split('').map(Number);
  let sum = 0;
  
  for (let i = digits.length - 2; i >= 0; i -= 2) {
    let d = digits[i] * 2;
    if (d > 9) d -= 9;
    sum += d;
  }
  
  for (let i = digits.length - 1; i >= 0; i -= 2) {
    sum += digits[i];
  }
  
  return sum % 10 === 0;
}

router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { idCard, name, phone, password } = req.body;
    
    if (!idCard || !name || !password) {
      res.status(400).json({ success: false, error: '身份证号、姓名和密码不能为空' });
      return;
    }
    
    const idInfo = getIdCardInfo(idCard);
    if (!idInfo.valid) {
      res.status(400).json({ success: false, error: '身份证号格式不正确' });
      return;
    }
    
    const existingUser = db.prepare('SELECT id FROM users WHERE id_card = ?').get(idCard);
    if (existingUser) {
      res.status(400).json({ success: false, error: '该身份证号已注册' });
      return;
    }
    
    const passwordHash = bcrypt.hashSync(password, 10);
    
    const result = db.prepare(`
      INSERT INTO users (id_card, name, phone, password_hash)
      VALUES (?, ?, ?, ?)
    `).run(idCard, name, phone || null, passwordHash);
    
    const userId = result.lastInsertRowid as number;
    
    logOperation('user_register', userId, undefined, req.ip, req.get('User-Agent'), { idCard, name });
    addBlockchainRecord('user_register', userId, { idCard, name, timestamp: Date.now() });
    
    res.json({
      success: true,
      message: '注册成功',
      data: { userId, birthDate: idInfo.birthDate, gender: idInfo.gender }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: '注册失败' });
  }
});

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { idCard, password } = req.body;
    
    if (!idCard || !password) {
      res.status(400).json({ success: false, error: '身份证号和密码不能为空' });
      return;
    }
    
    const user = db.prepare('SELECT * FROM users WHERE id_card = ?').get(idCard) as any;
    if (!user) {
      res.status(401).json({ success: false, error: '用户不存在' });
      return;
    }
    
    if (!bcrypt.compareSync(password, user.password_hash)) {
      res.status(401).json({ success: false, error: '密码错误' });
      return;
    }
    
    const token = jwt.sign(
      { userId: user.id, idCard: user.id_card, name: user.name },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    logOperation('user_login', user.id, undefined, req.ip, req.get('User-Agent'));
    
    res.json({
      success: true,
      message: '登录成功',
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          idCard: user.id_card,
          faceVerified: user.face_verified === 1,
          bankCardVerified: user.bank_card_verified === 1
        }
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: '登录失败' });
  }
});

router.post('/face-verify', async (req: Request, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      res.status(401).json({ success: false, error: '未授权' });
      return;
    }
    
    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    const { faceImage } = req.body;
    
    const verifyPassed = faceImage && faceImage.length > 100;
    
    if (verifyPassed) {
      db.prepare('UPDATE users SET face_verified = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(decoded.userId);
      
      logOperation('face_verify_success', decoded.userId, undefined, req.ip);
      
      res.json({
        success: true,
        message: '人脸识别验证通过',
        data: { verified: true }
      });
    } else {
      res.status(400).json({
        success: false,
        error: '人脸识别验证失败'
      });
    }
  } catch (error) {
    res.status(401).json({ success: false, error: 'Token无效或已过期' });
  }
});

router.post('/bank-verify', async (req: Request, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      res.status(401).json({ success: false, error: '未授权' });
      return;
    }
    
    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    const { bankCardNumber, bankName } = req.body;
    
    if (!bankCardNumber) {
      res.status(400).json({ success: false, error: '银行卡号不能为空' });
      return;
    }
    
    if (!verifyBankCard(bankCardNumber)) {
      res.status(400).json({ success: false, error: '银行卡号格式不正确' });
      return;
    }
    
    db.prepare(`
      UPDATE users 
      SET bank_card_verified = 1, bank_card_number = ?, bank_name = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(bankCardNumber, bankName || null, decoded.userId);
    
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(decoded.userId) as any;
    
    const authLevel = user.face_verified === 1 && user.bank_card_verified === 1 ? 'high' : 'medium';
    
    logOperation('bank_verify_success', decoded.userId, undefined, req.ip);
    
    res.json({
      success: true,
      message: '银行卡验证通过',
      data: { verified: true, authLevel }
    });
  } catch (error) {
    res.status(401).json({ success: false, error: 'Token无效或已过期' });
  }
});

router.post('/logout', async (req: Request, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        logOperation('user_logout', decoded.userId, undefined, req.ip);
      } catch (e) {}
    }
    
    res.json({ success: true, message: '登出成功' });
  } catch (error) {
    res.status(500).json({ success: false, error: '登出失败' });
  }
});

router.get('/profile', async (req: Request, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      res.status(401).json({ success: false, error: '未授权' });
      return;
    }
    
    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    const user = db.prepare('SELECT id, id_card, name, phone, face_verified, bank_card_verified, bank_name, created_at FROM users WHERE id = ?').get(decoded.userId) as any;
    
    if (!user) {
      res.status(404).json({ success: false, error: '用户不存在' });
      return;
    }
    
    res.json({
      success: true,
      data: {
        id: user.id,
        idCard: user.id_card,
        name: user.name,
        phone: user.phone,
        faceVerified: user.face_verified === 1,
        bankCardVerified: user.bank_card_verified === 1,
        bankName: user.bank_name,
        createdAt: user.created_at
      }
    });
  } catch (error) {
    res.status(401).json({ success: false, error: 'Token无效或已过期' });
  }
});

router.post('/officer/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      res.status(400).json({ success: false, error: '用户名和密码不能为空' });
      return;
    }
    
    const officer = db.prepare('SELECT * FROM tax_officers WHERE username = ?').get(username) as any;
    if (!officer) {
      res.status(401).json({ success: false, error: '用户不存在' });
      return;
    }
    
    if (!bcrypt.compareSync(password, officer.password_hash)) {
      res.status(401).json({ success: false, error: '密码错误' });
      return;
    }
    
    const token = jwt.sign(
      { officerId: officer.id, username: officer.username, role: officer.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    logOperation('officer_login', undefined, officer.id, req.ip);
    
    res.json({
      success: true,
      message: '登录成功',
      data: {
        token,
        officer: {
          id: officer.id,
          username: officer.username,
          name: officer.name,
          role: officer.role
        }
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: '登录失败' });
  }
});

export default router;
