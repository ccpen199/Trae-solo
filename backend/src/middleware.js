const jwt = require('jsonwebtoken');
const { getQuery } = require('./database');

const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: '未登录，请先选择身份'
    });
  }

  const token = authHeader.substring(7);
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await getQuery('SELECT * FROM users WHERE id = ?', [decoded.userId]);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '用户不存在'
      });
    }
    
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: '登录已过期，请重新选择身份'
    });
  }
};

const requireStudent = (req, res, next) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({
      success: false,
      message: '只有学生可以执行此操作'
    });
  }
  next();
};

const requireTeacher = (req, res, next) => {
  if (req.user.role !== 'teacher') {
    return res.status(403).json({
      success: false,
      message: '只有老师可以执行此操作'
    });
  }
  next();
};

const errorHandler = (err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    message: '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
};

module.exports = {
  authenticate,
  requireStudent,
  requireTeacher,
  errorHandler
};
