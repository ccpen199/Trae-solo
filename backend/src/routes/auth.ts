import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../config/database';
import logger from '../config/logger';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'lst-gov-secret-key-2024';

router.post('/login', (req, res) => {
  const { username, password, loginType } = req.body;

  if (!username || !password) {
    return res.status(400).json({ code: 400, message: '用户名和密码不能为空' });
  }

  try {
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as any;

    if (!user) {
      return res.status(401).json({ code: 401, message: '用户名或密码错误' });
    }

    const isValid = bcrypt.compareSync(password, user.password);
    if (!isValid) {
      return res.status(401).json({ code: 401, message: '用户名或密码错误' });
    }

    if (user.status !== 1) {
      return res.status(403).json({ code: 403, message: '账户已被禁用' });
    }

    if (loginType && user.user_type !== 'admin') {
      if (loginType === 'natural' && user.user_type === 'legal') {
        return res.status(400).json({ code: 400, message: '该账号为法人账户，请使用法人入口登录' });
      }
      if (loginType === 'legal' && user.user_type === 'natural') {
        return res.status(400).json({ code: 400, message: '该账号为自然人账户，请使用自然人入口登录' });
      }
    }

    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        userType: user.user_type,
        realName: user.real_name
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    db.prepare(`
      INSERT INTO operation_logs (user_id, action, module, detail, ip_address)
      VALUES (?, ?, ?, ?, ?)
    `).run(user.id, '登录', '认证', `入口: ${loginType || '未知'}`, req.ip);

    logger.info(`用户登录成功: ${username}, 入口: ${loginType || '未知'}`);

    res.json({
      code: 200,
      message: '登录成功',
      data: {
        token,
        userInfo: {
          id: user.id,
          username: user.username,
          userType: user.user_type,
          realName: user.real_name,
          idCard: user.id_card,
          phone: user.phone,
          policeVerified: user.police_verified,
          businessName: user.business_name,
          creditCode: user.credit_code,
          businessLicenseHash: user.business_license_hash
        }
      }
    });
  } catch (error) {
    logger.error('登录失败', error);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

router.post('/register', (req, res) => {
  const { username, password, userType, realName, phone, idCard, creditCode, businessName } = req.body;

  if (!username || !password || !userType) {
    return res.status(400).json({ code: 400, message: '必填项不能为空' });
  }

  try {
    const existingUser = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    if (existingUser) {
      return res.status(400).json({ code: 400, message: '用户名已存在' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    const result = db.prepare(`
      INSERT INTO users (username, password, user_type, real_name, phone, id_card, credit_code, business_name, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(username, hashedPassword, userType, realName || '', phone || '', idCard || '', creditCode || '', businessName || '', 1);

    logger.info(`用户注册成功: ${username}`);

    res.json({
      code: 200,
      message: '注册成功',
      data: { userId: result.lastInsertRowid }
    });
  } catch (error) {
    logger.error('注册失败', error);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

export default router;
