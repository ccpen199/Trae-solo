const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: '未提供认证令牌' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const result = await query('SELECT * FROM users WHERE id = $1', [decoded.userId]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: '用户不存在' });
    }

    req.user = result.rows[0];
    next();
  } catch (error) {
    console.error('认证错误:', error);
    return res.status(401).json({ error: '认证失败' });
  }
};

const authorize = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: '未登录' });
    }

    if (!roles.includes(req.user.role) && req.user.role !== 'admin') {
      return res.status(403).json({ error: '无权限执行此操作' });
    }

    next();
  };
};

const checkDocumentAccess = async (req, res, next) => {
  try {
    const documentId = req.params.id;
    const userId = req.user.id;
    
    const documentResult = await query(
      'SELECT * FROM documents WHERE id = $1',
      [documentId]
    );

    if (documentResult.rows.length === 0) {
      return res.status(404).json({ error: '公文不存在' });
    }

    const document = documentResult.rows[0];

    if (req.user.role === 'admin') {
      req.document = document;
      return next();
    }

    if (document.creator_id === userId) {
      req.document = document;
      return next();
    }

    const permissionResult = await query(
      `SELECT * FROM document_permissions 
       WHERE document_id = $1 AND user_id = $2`,
      [documentId, userId]
    );

    if (permissionResult.rows.length > 0) {
      req.document = document;
      return next();
    }

    const nodeResult = await query(
      `SELECT * FROM process_nodes 
       WHERE document_id = $1 AND handler_id = $2`,
      [documentId, userId]
    );

    if (nodeResult.rows.length > 0) {
      req.document = document;
      return next();
    }

    return res.status(403).json({ error: '无权限查看此公文' });
  } catch (error) {
    console.error('权限检查错误:', error);
    return res.status(500).json({ error: '服务器错误' });
  }
};

module.exports = {
  authenticate,
  authorize,
  checkDocumentAccess,
};
