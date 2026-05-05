import jwt from 'jsonwebtoken';
import { db } from '../database/init.js';

const JWT_SECRET = process.env.JWT_SECRET || 'weaver-video-messaging-secret-key-2024';

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') 
    ? authHeader.substring(7) 
    : null;

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: '未提供认证令牌' 
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    const sessionStmt = db.prepare(`
      SELECT ls.*, a.cid, a.username, a.email, a.phone, a.status, a.avatar
      FROM login_sessions ls
      JOIN accounts a ON ls.user_id = a.id
      WHERE ls.token = ? AND ls.is_active = 1
    `);
    const session = sessionStmt.get(token);

    if (!session) {
      return res.status(401).json({ 
        success: false, 
        message: '会话已失效，请重新登录' 
      });
    }

    req.user = {
      id: session.user_id,
      cid: session.cid,
      username: session.username,
      email: session.email,
      phone: session.phone,
      status: session.status,
      avatar: session.avatar
    };
    
    next();
  } catch (error) {
    return res.status(403).json({ 
      success: false, 
      message: '令牌无效或已过期' 
    });
  }
};
