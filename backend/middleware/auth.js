const ROLES = {
  ADMIN: 'admin',
  USER: 'user'
};

const ensureAuthenticated = (req, res, next) => {
  if (req.session && req.session.user) {
    return next();
  }
  return res.status(401).json({ 
    success: false, 
    message: '未登录，请先登录' 
  });
};

const ensureAdmin = (req, res, next) => {
  if (req.session && req.session.user && req.session.user.role === ROLES.ADMIN) {
    return next();
  }
  return res.status(403).json({ 
    success: false, 
    message: '权限不足，需要管理员权限' 
  });
};

const ensureSelfOrAdmin = (req, res, next) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ 
      success: false, 
      message: '未登录，请先登录' 
    });
  }
  
  const userId = parseInt(req.params.id);
  const currentUser = req.session.user;
  
  if (currentUser.role === ROLES.ADMIN || currentUser.id === userId) {
    return next();
  }
  
  return res.status(403).json({ 
    success: false, 
    message: '权限不足，只能修改自己的资料' 
  });
};

const isAuthenticated = (req) => {
  return req.session && req.session.user;
};

const isAdmin = (req) => {
  return req.session && req.session.user && req.session.user.role === ROLES.ADMIN;
};

module.exports = {
  ensureAuthenticated,
  ensureAdmin,
  ensureSelfOrAdmin,
  isAuthenticated,
  isAdmin,
  ROLES
};
