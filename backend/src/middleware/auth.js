const jwt = require('jsonwebtoken');
const config = require('../config');
const db = require('../database');

const getUserByIdStmt = db.prepare('SELECT * FROM users WHERE id = ?');

class AuthMiddleware {
  static authenticate(req, res, next) {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: '未提供认证令牌' });
    }
    
    const token = authHeader.substring(7);
    
    try {
      const decoded = jwt.verify(token, config.jwt.secret);
      
      const user = getUserByIdStmt.get(decoded.userId);
      
      if (!user || user.status !== 'active') {
        return res.status(401).json({ error: '用户不存在或已禁用' });
      }
      
      req.user = {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        email: user.email,
        phone: user.phone
      };
      
      next();
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ error: '令牌已过期' });
      }
      return res.status(401).json({ error: '无效的令牌' });
    }
  }

  static requireRole(...allowedRoles) {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({ error: '未认证' });
      }
      
      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ error: '权限不足' });
      }
      
      next();
    };
  }

  static requirePolicyholderOrAgent(req, res, next) {
    if (!req.user) {
      return res.status(401).json({ error: '未认证' });
    }
    
    if (req.user.role !== config.roles.POLICYHOLDER && 
        req.user.role !== config.roles.AGENT) {
      return res.status(403).json({ error: '仅限投保人或代理人访问' });
    }
    
    next();
  }

  static requirePolicyOwner(req, res, next) {
    if (!req.user) {
      return res.status(401).json({ error: '未认证' });
    }
    
    const policyId = req.params.policyId || req.body.policy_id;
    
    if (!policyId) {
      return res.status(400).json({ error: '缺少保单ID' });
    }
    
    const getPolicyStmt = db.prepare('SELECT policyholder_id, agent_id FROM policies WHERE id = ?');
    const policy = getPolicyStmt.get(policyId);
    
    if (!policy) {
      return res.status(404).json({ error: '保单不存在' });
    }
    
    if (req.user.role === config.roles.POLICYHOLDER) {
      if (policy.policyholder_id !== req.user.id) {
        return res.status(403).json({ error: '无权访问此保单' });
      }
    } else if (req.user.role === config.roles.AGENT) {
      if (policy.agent_id !== req.user.id) {
        return res.status(403).json({ error: '无权访问此保单' });
      }
    }
    
    next();
  }

  static generateToken(userId, role) {
    return jwt.sign(
      { userId, role },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );
  }
}

module.exports = AuthMiddleware;
