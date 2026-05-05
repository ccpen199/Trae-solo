const jwt = require('jsonwebtoken');
const prisma = require('../utils/prisma');

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;

  if (!token) {
    return res.status(401).json({ success: false, message: '未提供认证令牌' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { rider: true, riderSettings: true }
    });

    if (!user) {
      return res.status(401).json({ success: false, message: '用户不存在' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Token验证错误:', error);
    return res.status(403).json({ success: false, message: '令牌无效或已过期' });
  }
};

const requireRider = (req, res, next) => {
  if (!req.user.rider) {
    return res.status(403).json({ success: false, message: '需要骑手身份' });
  }
  next();
};

const requireApproved = (req, res, next) => {
  if (req.user.status !== 'approved') {
    return res.status(403).json({ success: false, message: '账号尚未审核通过' });
  }
  next();
};

const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: '需要管理员权限' });
  }
  next();
};

module.exports = {
  authenticateToken,
  requireRider,
  requireApproved,
  requireAdmin
};
