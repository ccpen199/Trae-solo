const express = require('express');
const jwt = require('jsonwebtoken');
const { query, run } = require('../config/database');
const { checkAuthorization } = require('../services/authorizationEngine');
const { 
  getAuditLogs, 
  getLoginLogs, 
  getRealTimeSnapshot,
  logAudit,
  ActionType,
  ResourceType
} = require('../services/auditEngine');

const router = express.Router();

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ success: false, error: '未授权访问' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      userId: decoded.userId,
      username: decoded.username,
      mfaVerified: decoded.mfaVerified
    };
    next();
  } catch (error) {
    return res.status(401).json({ success: false, error: 'Token 无效或已过期' });
  }
};

router.use(authenticate);

const getClientInfo = (req) => ({
  ipAddress: req.ip || req.connection.remoteAddress || '127.0.0.1',
  userAgent: req.get('User-Agent') || 'unknown'
});

router.get('/logs', async (req, res) => {
  try {
    const authResult = checkAuthorization(req.user.userId, 'audit', 'read');
    if (!authResult.allowed) {
      return res.status(403).json({ success: false, error: '权限不足' });
    }

    const { 
      userId, 
      username, 
      action, 
      resourceType, 
      riskLevel,
      startTime,
      endTime,
      page = 1, 
      pageSize = 50 
    } = req.query;

    const filters = {};
    if (userId) filters.userId = userId;
    if (username) filters.username = username;
    if (action) filters.action = action;
    if (resourceType) filters.resourceType = resourceType;
    if (riskLevel) filters.riskLevel = riskLevel;
    if (startTime) filters.startTime = startTime;
    if (endTime) filters.endTime = endTime;

    const logs = getAuditLogs(filters, { page: parseInt(page), pageSize: parseInt(pageSize) });

    const countSql = `SELECT COUNT(*) as total FROM audit_logs WHERE 1=1`;
    const countParams = [];
    const totalResult = query(countSql, countParams);

    res.json({
      success: true,
      data: {
        list: logs.map(log => ({
          ...log,
          details: log.details ? JSON.parse(log.details) : null
        })),
        pagination: {
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          total: totalResult[0]?.total || 0
        }
      }
    });

  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({ success: false, error: '获取审计日志失败' });
  }
});

router.get('/logs/:id', async (req, res) => {
  try {
    const authResult = checkAuthorization(req.user.userId, 'audit', 'read');
    if (!authResult.allowed) {
      return res.status(403).json({ success: false, error: '权限不足' });
    }

    const { id } = req.params;
    const logs = query(`SELECT * FROM audit_logs WHERE id = ?`, [id]);

    if (logs.length === 0) {
      return res.status(404).json({ success: false, error: '日志不存在' });
    }

    const log = logs[0];
    
    res.json({
      success: true,
      data: {
        ...log,
        details: log.details ? JSON.parse(log.details) : null
      }
    });

  } catch (error) {
    console.error('Get audit log error:', error);
    res.status(500).json({ success: false, error: '获取审计日志失败' });
  }
});

router.get('/login-logs', async (req, res) => {
  try {
    const authResult = checkAuthorization(req.user.userId, 'audit', 'read');
    if (!authResult.allowed) {
      return res.status(403).json({ success: false, error: '权限不足' });
    }

    const { userId, loginResult, startTime, page = 1, pageSize = 50 } = req.query;

    const filters = {};
    if (userId) filters.userId = userId;
    if (loginResult) filters.loginResult = loginResult;
    if (startTime) filters.startTime = startTime;

    const logs = getLoginLogs(filters, { page: parseInt(page), pageSize: parseInt(pageSize) });

    res.json({
      success: true,
      data: {
        list: logs,
        pagination: {
          page: parseInt(page),
          pageSize: parseInt(pageSize)
        }
      }
    });

  } catch (error) {
    console.error('Get login logs error:', error);
    res.status(500).json({ success: false, error: '获取登录日志失败' });
  }
});

router.get('/access-logs', async (req, res) => {
  try {
    const authResult = checkAuthorization(req.user.userId, 'audit', 'read');
    if (!authResult.allowed) {
      return res.status(403).json({ success: false, error: '权限不足' });
    }

    const { userId, resourceType, accessResult, page = 1, pageSize = 50 } = req.query;

    let sql = `SELECT * FROM access_logs WHERE 1=1`;
    const params = [];

    if (userId) {
      sql += ' AND user_id = ?';
      params.push(userId);
    }
    if (resourceType) {
      sql += ' AND resource_type = ?';
      params.push(resourceType);
    }
    if (accessResult) {
      sql += ' AND access_result = ?';
      params.push(accessResult);
    }

    sql += ' ORDER BY created_at DESC';

    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    sql += ` LIMIT ? OFFSET ?`;
    params.push(parseInt(pageSize), offset);

    const logs = query(sql, params);

    res.json({
      success: true,
      data: {
        list: logs,
        pagination: {
          page: parseInt(page),
          pageSize: parseInt(pageSize)
        }
      }
    });

  } catch (error) {
    console.error('Get access logs error:', error);
    res.status(500).json({ success: false, error: '获取访问日志失败' });
  }
});

router.get('/snapshot', async (req, res) => {
  try {
    const authResult = checkAuthorization(req.user.userId, 'monitor', 'view');
    if (!authResult.allowed) {
      return res.status(403).json({ success: false, error: '权限不足' });
    }

    const snapshot = getRealTimeSnapshot();

    res.json({
      success: true,
      data: snapshot
    });

  } catch (error) {
    console.error('Get snapshot error:', error);
    res.status(500).json({ success: false, error: '获取实时快照失败' });
  }
});

router.get('/statistics', async (req, res) => {
  try {
    const authResult = checkAuthorization(req.user.userId, 'audit', 'read');
    if (!authResult.allowed) {
      return res.status(403).json({ success: false, error: '权限不足' });
    }

    const { period = '24h' } = req.query;
    
    let timeCondition = "datetime('now', '-24 hour')";
    if (period === '7d') {
      timeCondition = "datetime('now', '-7 day')";
    } else if (period === '30d') {
      timeCondition = "datetime('now', '-30 day')";
    }

    const totalUsers = query(`SELECT COUNT(*) as count FROM users`);
    const activeUsers = query(`SELECT COUNT(*) as count FROM users WHERE status = 'active'`);
    
    const loginsToday = query(`
      SELECT COUNT(*) as count FROM login_logs 
      WHERE created_at >= ${timeCondition} AND login_result = 'success'
    `);

    const failedLogins = query(`
      SELECT COUNT(*) as count FROM login_logs 
      WHERE created_at >= ${timeCondition} AND login_result = 'failed'
    `);

    const highRiskEvents = query(`
      SELECT COUNT(*) as count FROM audit_logs 
      WHERE created_at >= ${timeCondition} AND risk_level IN ('high', 'critical')
    `);

    const mfaAttempts = query(`
      SELECT COUNT(*) as count FROM login_logs 
      WHERE created_at >= ${timeCondition} AND mfa_used = 1
    `);

    const actionDistribution = query(`
      SELECT action, COUNT(*) as count 
      FROM audit_logs 
      WHERE created_at >= ${timeCondition}
      GROUP BY action 
      ORDER BY count DESC 
      LIMIT 10
    `);

    const riskDistribution = query(`
      SELECT risk_level, COUNT(*) as count 
      FROM audit_logs 
      WHERE created_at >= ${timeCondition}
      GROUP BY risk_level
    `);

    res.json({
      success: true,
      data: {
        overview: {
          totalUsers: totalUsers[0]?.count || 0,
          activeUsers: activeUsers[0]?.count || 0,
          loginsInPeriod: loginsToday[0]?.count || 0,
          failedLogins: failedLogins[0]?.count || 0,
          highRiskEvents: highRiskEvents[0]?.count || 0,
          mfaAttempts: mfaAttempts[0]?.count || 0
        },
        actionDistribution,
        riskDistribution
      }
    });

  } catch (error) {
    console.error('Get statistics error:', error);
    res.status(500).json({ success: false, error: '获取统计数据失败' });
  }
});

router.get('/export', async (req, res) => {
  try {
    const authResult = checkAuthorization(req.user.userId, 'audit', 'export');
    if (!authResult.allowed) {
      return res.status(403).json({ success: false, error: '权限不足' });
    }

    const { startTime, endTime, format = 'json' } = req.query;
    const clientInfo = getClientInfo(req);

    logAudit({
      userId: req.user.userId,
      username: req.user.username,
      action: ActionType.AUDIT_EXPORT,
      resourceType: ResourceType.AUDIT,
      details: { startTime, endTime, format },
      ipAddress: clientInfo.ipAddress,
      userAgent: clientInfo.userAgent
    });

    let sql = `SELECT * FROM audit_logs WHERE 1=1`;
    const params = [];

    if (startTime) {
      sql += ' AND created_at >= ?';
      params.push(startTime);
    }
    if (endTime) {
      sql += ' AND created_at <= ?';
      params.push(endTime);
    }

    sql += ' ORDER BY created_at DESC';

    const logs = query(sql, params);

    if (format === 'csv') {
      const headers = ['ID', '用户ID', '用户名', '操作', '资源类型', '资源ID', '风险等级', 'IP地址', '创建时间', '指纹'];
      const csvContent = [
        headers.join(','),
        ...logs.map(log => [
          log.id,
          log.user_id || '',
          log.username || '',
          log.action,
          log.resource_type || '',
          log.resource_id || '',
          log.risk_level,
          log.ip_address || '',
          log.created_at,
          log.fingerprint
        ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename=audit-logs-${Date.now()}.csv`);
      res.send('\uFEFF' + csvContent);
    } else {
      res.json({
        success: true,
        data: {
          format: 'json',
          exportTime: new Date().toISOString(),
          recordCount: logs.length,
          records: logs.map(log => ({
            ...log,
            details: log.details ? JSON.parse(log.details) : null
          }))
        }
      });
    }

  } catch (error) {
    console.error('Export audit logs error:', error);
    res.status(500).json({ success: false, error: '导出审计日志失败' });
  }
});

router.get('/position-changes', async (req, res) => {
  try {
    const authResult = checkAuthorization(req.user.userId, 'audit', 'read');
    if (!authResult.allowed) {
      return res.status(403).json({ success: false, error: '权限不足' });
    }

    const { userId, page = 1, pageSize = 20 } = req.query;

    let sql = `
      SELECT pc.*, 
             u.username, u.real_name,
             o1.name as old_org_name,
             o2.name as new_org_name,
             cu.real_name as changed_by_name
      FROM position_changes pc
      LEFT JOIN users u ON pc.user_id = u.id
      LEFT JOIN organizations o1 ON pc.old_organization_id = o1.id
      LEFT JOIN organizations o2 ON pc.new_organization_id = o2.id
      LEFT JOIN users cu ON pc.changed_by = cu.id
      WHERE 1=1
    `;
    const params = [];

    if (userId) {
      sql += ' AND pc.user_id = ?';
      params.push(userId);
    }

    sql += ' ORDER BY pc.created_at DESC';

    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    sql += ` LIMIT ? OFFSET ?`;
    params.push(parseInt(pageSize), offset);

    const changes = query(sql, params);

    res.json({
      success: true,
      data: {
        list: changes.map(c => ({
          id: c.id,
          userId: c.user_id,
          username: c.username,
          realName: c.real_name,
          oldOrganizationId: c.old_organization_id,
          oldOrganizationName: c.old_org_name,
          newOrganizationId: c.new_organization_id,
          newOrganizationName: c.new_org_name,
          oldRoles: c.old_roles ? JSON.parse(c.old_roles) : [],
          newRoles: c.new_roles ? JSON.parse(c.new_roles) : [],
          changedBy: c.changed_by,
          changedByName: c.changed_by_name,
          createdAt: c.created_at
        })),
        pagination: {
          page: parseInt(page),
          pageSize: parseInt(pageSize)
        }
      }
    });

  } catch (error) {
    console.error('Get position changes error:', error);
    res.status(500).json({ success: false, error: '获取岗位变动记录失败' });
  }
});

module.exports = router;
