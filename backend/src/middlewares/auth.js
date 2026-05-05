const jwt = require('jsonwebtoken');
const store = require('../data/store');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: '未授权访问，请先登录'
      });
    }
    
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: '未授权访问，请先登录'
      });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await store.users.findByPk(decoded.userId);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '用户不存在'
      });
    }
    
    if (user.status !== 1) {
      return res.status(403).json({
        success: false,
        message: '账号已被禁用'
      });
    }
    
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: '登录已过期，请重新登录'
      });
    }
    return res.status(401).json({
      success: false,
      message: '无效的令牌'
    });
  }
};

const optionalAuthMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }
    
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return next();
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await store.users.findByPk(decoded.userId);
    
    if (user && user.status === 1) {
      req.user = user;
    }
    
    next();
  } catch (error) {
    next();
  }
};

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '未授权访问，请先登录'
      });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: '权限不足'
      });
    }
    
    next();
  };
};

const isModeratorForBoard = async (userId, boardId) => {
  const moderator = await store.boardModerators.findOne({
    where: {
      userId,
      boardId
    }
  });
  return !!moderator;
};

const requireBoardModerator = (boardIdParam = 'boardId') => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '未授权访问，请先登录'
      });
    }
    
    if (req.user.role === store.USER_ROLES.ADMIN) {
      return next();
    }
    
    const boardId = req.params[boardIdParam] || req.body.boardId;
    
    if (!boardId) {
      return res.status(400).json({
        success: false,
        message: '缺少版块ID'
      });
    }
    
    const isModerator = await isModeratorForBoard(req.user.id, parseInt(boardId));
    
    if (!isModerator) {
      return res.status(403).json({
        success: false,
        message: '您不是该版块的版主，权限不足'
      });
    }
    
    next();
  };
};

const isAdmin = () => requireRole([store.USER_ROLES.ADMIN]);
const isModeratorOrAdmin = () => requireRole([store.USER_ROLES.MODERATOR, store.USER_ROLES.ADMIN]);

module.exports = {
  authMiddleware,
  optionalAuthMiddleware,
  requireRole,
  requireBoardModerator,
  isModeratorForBoard,
  isAdmin,
  isModeratorOrAdmin
};
