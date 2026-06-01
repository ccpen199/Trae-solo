const { db } = require('./database');

function authenticate(req, res, next) {
  const userId = req.headers['x-user-id'] || 'user_biz';
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  req.user = user;
  next();
}

function requireRole(roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Permission denied', requiredRoles: roles });
    }
    next();
  };
}

function errorHandler(err, req, res, next) {
  console.error(err);
  res.status(500).json({ error: err.message || 'Internal server error' });
}

function validateInterviewData(data) {
  const errors = [];
  if (!data.title || data.title.trim().length === 0) {
    errors.push({ field: 'title', message: '访谈标题不能为空' });
  }
  if (data.interview_date && isNaN(new Date(data.interview_date).getTime())) {
    errors.push({ field: 'interview_date', message: '访谈日期格式无效' });
  }
  return errors;
}

module.exports = { authenticate, requireRole, errorHandler, validateInterviewData };
