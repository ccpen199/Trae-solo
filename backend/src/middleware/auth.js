const jwt = require('jsonwebtoken');

function authMiddleware(db) {
  return (req, res, next) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: '未提供认证令牌' });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = db.prepare(`
        SELECT u.*, r.name as role_name, r.description as role_description
        FROM users u
        JOIN roles r ON u.role_id = r.id
        WHERE u.id = ? AND u.status = 'active'
      `).get(decoded.userId);

      if (!user) {
        return res.status(401).json({ error: '用户不存在或已禁用' });
      }

      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({ error: '认证令牌无效' });
    }
  };
}

function permissionMiddleware(db, action, resource) {
  return (req, res, next) => {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: '未认证' });
    }

    const hasPermission = db.prepare(`
      SELECT 1 FROM permissions
      WHERE role_id = ? AND (action = ? OR action = '*') AND (resource = ? OR resource = '*')
    `).get(user.role_id, action, resource);

    if (!hasPermission) {
      return res.status(403).json({ error: '无操作权限' });
    }

    next();
  };
}

function checkBusinessRules(db, bidId, operation) {
  const bid = db.prepare('SELECT * FROM bids WHERE id = ?').get(bidId);
  if (!bid) {
    return { valid: false, reason: '标书不存在' };
  }

  const activeRule = db.prepare('SELECT * FROM rule_versions WHERE is_active = 1').get();
  if (!activeRule) {
    return { valid: false, reason: '无有效规则版本' };
  }

  if (bid.rule_version_id && bid.rule_version_id !== activeRule.id) {
    return { valid: false, reason: `规则版本不匹配，当前版本: v${activeRule.version}` };
  }

  const nodeTransitions = {
    upload: ['parsing'],
    parsing: ['matching', 'responding'],
    matching: ['responding'],
    responding: ['reviewing'],
    reviewing: ['exporting'],
    exporting: ['completed']
  };

  if (operation !== 'refresh' && bid.previous_node && !bid.previous_conclusion) {
    return { valid: false, reason: '上一节点未完成审批' };
  }

  return { valid: true, bid, activeRule };
}

function logException(db, data) {
  return db.prepare(`
    INSERT INTO exception_logs (bid_id, operation, error_type, error_message, raw_request, operator_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    data.bid_id || null,
    data.operation,
    data.error_type,
    data.error_message,
    data.raw_request ? JSON.stringify(data.raw_request) : null,
    data.operator_id || null
  );
}

function addLedgerRecord(db, data) {
  return db.prepare(`
    INSERT INTO business_ledger (bid_id, action_type, action_detail, status, operator_id, owner_id, reviewer_id, exception_reason, rule_version, metadata_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    data.bid_id || null,
    data.action_type,
    data.action_detail || null,
    data.status,
    data.operator_id || null,
    data.owner_id || null,
    data.reviewer_id || null,
    data.exception_reason || null,
    data.rule_version || null,
    data.metadata_json ? JSON.stringify(data.metadata_json) : null
  );
}

module.exports = {
  authMiddleware,
  permissionMiddleware,
  checkBusinessRules,
  logException,
  addLedgerRecord
};
