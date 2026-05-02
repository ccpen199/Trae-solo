const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { query, run } = require('../config/database');
const { checkAuthorization, getUserRoles, generateMenuForUser } = require('../services/authorizationEngine');
const { logAudit, logSensitiveOperation, ActionType, ResourceType } = require('../services/auditEngine');

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

router.get('/', async (req, res) => {
  try {
    const authResult = checkAuthorization(req.user.userId, 'user', 'read');
    if (!authResult.allowed) {
      return res.status(403).json({ success: false, error: '权限不足' });
    }

    const { organizationId, status, search, page = 1, pageSize = 20 } = req.query;
    
    let baseSql = `
      FROM users u
      LEFT JOIN organizations o ON u.organization_id = o.id
      WHERE 1=1
    `;
    const params = [];

    if (organizationId) {
      baseSql += ' AND u.organization_id = ?';
      params.push(organizationId);
    }

    if (status) {
      baseSql += ' AND u.status = ?';
      params.push(status);
    }

    if (search) {
      baseSql += ' AND (u.username LIKE ? OR u.real_name LIKE ? OR u.email LIKE ?)';
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    const countSql = `SELECT COUNT(*) as total ${baseSql}`;
    const totalResult = query(countSql, params);
    const total = totalResult[0]?.total || 0;

    const offset = (parseInt(page) - 1) * parseInt(pageSize);

    let sql = `
      SELECT u.*, o.name as organization_name
      ${baseSql}
      ORDER BY u.created_at DESC
    `;

    sql += ` LIMIT ? OFFSET ?`;
    params.push(parseInt(pageSize), offset);

    const users = query(sql, params);

    res.json({
      success: true,
      data: {
        list: users.map(u => ({
          id: u.id,
          username: u.username,
          realName: u.real_name,
          email: u.email,
          phone: u.phone,
          status: u.status,
          organizationId: u.organization_id,
          organizationName: u.organization_name,
          roles: u.roles ? u.roles.split(',') : [],
          mfaEnabled: u.mfa_enabled === 1,
          lastLoginAt: u.last_login_at,
          createdAt: u.created_at
        })),
        pagination: {
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          total
        }
      }
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ success: false, error: '获取用户列表失败' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const authResult = checkAuthorization(req.user.userId, 'user', 'read');
    if (!authResult.allowed) {
      return res.status(403).json({ success: false, error: '权限不足' });
    }

    const { id } = req.params;
    const users = query(`
      SELECT u.*, o.name as organization_name
      FROM users u
      LEFT JOIN organizations o ON u.organization_id = o.id
      WHERE u.id = ?
    `, [id]);

    if (users.length === 0) {
      return res.status(404).json({ success: false, error: '用户不存在' });
    }

    const user = users[0];
    const roles = getUserRoles(id);
    const loginLogs = query(`
      SELECT * FROM login_logs 
      WHERE user_id = ?
      ORDER BY created_at DESC LIMIT 20
    `, [id]);

    res.json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        realName: user.real_name,
        email: user.email,
        phone: user.phone,
        status: user.status,
        organizationId: user.organization_id,
        organizationName: user.organization_name,
        roles,
        mfaEnabled: user.mfa_enabled === 1,
        lastLoginAt: user.last_login_at,
        createdAt: user.created_at,
        recentLoginLogs: loginLogs
      }
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ success: false, error: '获取用户信息失败' });
  }
});

router.post('/', async (req, res) => {
  try {
    const authResult = checkAuthorization(req.user.userId, 'user', 'write');
    if (!authResult.allowed) {
      return res.status(403).json({ success: false, error: '权限不足' });
    }

    const { username, realName, email, phone, organizationId, roles, initialPassword } = req.body;
    const clientInfo = getClientInfo(req);

    if (!username) {
      return res.status(400).json({ success: false, error: '用户名不能为空' });
    }

    const existing = query(`SELECT * FROM users WHERE username = ?`, [username]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, error: '用户名已存在' });
    }

    const passwordHash = await bcrypt.hash(initialPassword || 'Default@123', 10);
    const id = uuidv4();

    run(`
      INSERT INTO users (id, username, real_name, email, phone, password_hash, organization_id, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
    `, [id, username, realName || username, email || null, phone || null, passwordHash, organizationId || null]);

    if (roles && Array.isArray(roles) && roles.length > 0) {
      for (const roleId of roles) {
        const roleExists = query(`SELECT * FROM roles WHERE id = ?`, [roleId]);
        if (roleExists.length > 0) {
          run(`
            INSERT INTO user_roles (id, user_id, role_id, assigned_by)
            VALUES (?, ?, ?, ?)
          `, [uuidv4(), id, roleId, req.user.userId]);
        }
      }
    }

    logAudit({
      userId: req.user.userId,
      username: req.user.username,
      action: ActionType.USER_CREATE,
      resourceType: ResourceType.USER,
      resourceId: id,
      details: { username, realName, email, organizationId, roles },
      ipAddress: clientInfo.ipAddress,
      userAgent: clientInfo.userAgent
    });

    const newUser = query(`
      SELECT u.*, o.name as organization_name
      FROM users u
      LEFT JOIN organizations o ON u.organization_id = o.id
      WHERE u.id = ?
    `, [id])[0];

    res.json({
      success: true,
      message: '用户创建成功',
      data: {
        id: newUser.id,
        username: newUser.username,
        realName: newUser.real_name,
        email: newUser.email,
        status: newUser.status,
        needActivation: true
      }
    });

  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ success: false, error: '创建用户失败' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const authResult = checkAuthorization(req.user.userId, 'user', 'write');
    if (!authResult.allowed) {
      return res.status(403).json({ success: false, error: '权限不足' });
    }

    const { id } = req.params;
    const { realName, email, phone, organizationId, status, roles } = req.body;
    const clientInfo = getClientInfo(req);

    const users = query(`SELECT * FROM users WHERE id = ?`, [id]);
    if (users.length === 0) {
      return res.status(404).json({ success: false, error: '用户不存在' });
    }

    const oldUser = users[0];
    const updates = [];
    const values = [];
    const changes = {};

    if (realName !== undefined && realName !== oldUser.real_name) {
      updates.push('real_name = ?');
      values.push(realName);
      changes.realName = { old: oldUser.real_name, new: realName };
    }
    if (email !== undefined && email !== oldUser.email) {
      updates.push('email = ?');
      values.push(email);
      changes.email = { old: oldUser.email, new: email };
    }
    if (phone !== undefined && phone !== oldUser.phone) {
      updates.push('phone = ?');
      values.push(phone);
      changes.phone = { old: oldUser.phone, new: phone };
    }
    if (organizationId !== undefined && organizationId !== oldUser.organization_id) {
      updates.push('organization_id = ?');
      values.push(organizationId);
      changes.organizationId = { old: oldUser.organization_id, new: organizationId };
    }
    if (status !== undefined && status !== oldUser.status) {
      updates.push('status = ?');
      values.push(status);
      changes.status = { old: oldUser.status, new: status };
    }

    if (updates.length > 0) {
      updates.push('updated_at = datetime("now")');
      values.push(id);

      run(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);

      logAudit({
        userId: req.user.userId,
        username: req.user.username,
        action: ActionType.USER_UPDATE,
        resourceType: ResourceType.USER,
        resourceId: id,
        details: changes,
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent
      });

      if (changes.status) {
        logAudit({
          userId: req.user.userId,
          username: req.user.username,
          action: ActionType.USER_STATUS_CHANGE,
          resourceType: ResourceType.USER,
          resourceId: id,
          details: {
            oldStatus: changes.status.old,
            newStatus: changes.status.new
          },
          ipAddress: clientInfo.ipAddress,
          userAgent: clientInfo.userAgent
        });
      }
    }

    if (roles !== undefined) {
      const oldRoles = query(`SELECT role_id FROM user_roles WHERE user_id = ?`, [id])
        .map(r => r.role_id);
      
      const oldRolesStr = oldRoles.sort().join(',');
      const newRolesStr = (roles || []).sort().join(',');

      if (oldRolesStr !== newRolesStr) {
        run(`DELETE FROM user_roles WHERE user_id = ?`, [id]);
        
        if (roles && Array.isArray(roles)) {
          for (const roleId of roles) {
            run(`
              INSERT INTO user_roles (id, user_id, role_id, assigned_by)
              VALUES (?, ?, ?, ?)
            `, [uuidv4(), id, roleId, req.user.userId]);
          }
        }

        logAudit({
          userId: req.user.userId,
          username: req.user.username,
          action: ActionType.PERMISSION_ASSIGN,
          resourceType: ResourceType.USER,
          resourceId: id,
          details: { oldRoles, newRoles: roles },
          ipAddress: clientInfo.ipAddress,
          userAgent: clientInfo.userAgent
        });
      }
    }

    const updatedUser = query(`
      SELECT u.*, o.name as organization_name
      FROM users u
      LEFT JOIN organizations o ON u.organization_id = o.id
      WHERE u.id = ?
    `, [id])[0];

    const updatedRoles = getUserRoles(id);

    res.json({
      success: true,
      message: '用户更新成功',
      data: {
        ...updatedUser,
        roles: updatedRoles
      }
    });

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ success: false, error: '更新用户失败' });
  }
});

router.post('/:id/transfer', async (req, res) => {
  try {
    const authResult = checkAuthorization(req.user.userId, 'user', 'write');
    if (!authResult.allowed) {
      return res.status(403).json({ success: false, error: '权限不足' });
    }

    const { id } = req.params;
    const { newOrganizationId, newRoleIds, comment } = req.body;
    const clientInfo = getClientInfo(req);

    const users = query(`SELECT * FROM users WHERE id = ?`, [id]);
    if (users.length === 0) {
      return res.status(404).json({ success: false, error: '用户不存在' });
    }

    const user = users[0];
    const oldOrgId = user.organization_id;
    const oldRoles = getUserRoles(id);

    if (newOrganizationId) {
      const orgExists = query(`SELECT * FROM organizations WHERE id = ?`, [newOrganizationId]);
      if (orgExists.length === 0) {
        return res.status(400).json({ success: false, error: '目标组织不存在' });
      }
    }

    logSensitiveOperation({
      userId: req.user.userId,
      username: req.user.username,
      operation: '岗位变动',
      resourceType: ResourceType.USER,
      resourceId: id,
      details: {
        userId: id,
        oldOrganizationId: oldOrgId,
        newOrganizationId: newOrganizationId,
        oldRoles: oldRoles.map(r => r.id),
        newRoles: newRoleIds,
        comment
      },
      ipAddress: clientInfo.ipAddress,
      userAgent: clientInfo.userAgent
    });

    const positionChangeId = uuidv4();
    run(`
      INSERT INTO position_changes (
        id, user_id, old_organization_id, new_organization_id,
        old_roles, new_roles, changed_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      positionChangeId, id, oldOrgId, newOrganizationId,
      JSON.stringify(oldRoles.map(r => r.id)),
      JSON.stringify(newRoleIds || []),
      req.user.userId
    ]);

    if (newOrganizationId) {
      run(`UPDATE users SET organization_id = ? WHERE id = ?`, [newOrganizationId, id]);
    }

    if (newRoleIds !== undefined) {
      run(`DELETE FROM user_roles WHERE user_id = ?`, [id]);
      if (newRoleIds && Array.isArray(newRoleIds)) {
        for (const roleId of newRoleIds) {
          run(`
            INSERT INTO user_roles (id, user_id, role_id, assigned_by)
            VALUES (?, ?, ?, ?)
          `, [uuidv4(), id, roleId, req.user.userId]);
        }
      }
    }

    res.json({
      success: true,
      message: '岗位变动处理完成',
      data: {
        positionChangeId,
        userId: id,
        oldOrganizationId: oldOrgId,
        newOrganizationId: newOrganizationId
      }
    });

  } catch (error) {
    console.error('Transfer user error:', error);
    res.status(500).json({ success: false, error: '岗位变动处理失败' });
  }
});

router.post('/:id/cleanup-permissions', async (req, res) => {
  try {
    const authResult = checkAuthorization(req.user.userId, 'user', 'write');
    if (!authResult.allowed) {
      return res.status(403).json({ success: false, error: '权限不足' });
    }

    const { id } = req.params;
    const clientInfo = getClientInfo(req);

    const users = query(`SELECT * FROM users WHERE id = ?`, [id]);
    if (users.length === 0) {
      return res.status(404).json({ success: false, error: '用户不存在' });
    }

    const user = users[0];
    const oldRoles = getUserRoles(id);
    const oldAppAccess = query(`SELECT * FROM application_access WHERE user_id = ?`, [id]);

    logSensitiveOperation({
      userId: req.user.userId,
      username: req.user.username,
      operation: '权限自动清理',
      resourceType: ResourceType.USER,
      resourceId: id,
      details: {
        userId: id,
        username: user.username,
        cleanedRoles: oldRoles.map(r => r.id),
        cleanedAppAccess: oldAppAccess.map(a => a.application_id)
      },
      ipAddress: clientInfo.ipAddress,
      userAgent: clientInfo.userAgent
    });

    run(`DELETE FROM user_roles WHERE user_id = ?`, [id]);
    run(`DELETE FROM application_access WHERE user_id = ?`, [id]);

    res.json({
      success: true,
      message: '权限清理完成',
      data: {
        userId: id,
        cleanedRolesCount: oldRoles.length,
        cleanedAppAccessCount: oldAppAccess.length
      }
    });

  } catch (error) {
    console.error('Cleanup permissions error:', error);
    res.status(500).json({ success: false, error: '权限清理失败' });
  }
});

router.put('/:id/reset-password', async (req, res) => {
  try {
    const authResult = checkAuthorization(req.user.userId, 'user', 'write');
    if (!authResult.allowed) {
      return res.status(403).json({ success: false, error: '权限不足' });
    }

    const { id } = req.params;
    const { newPassword } = req.body;
    const clientInfo = getClientInfo(req);

    const users = query(`SELECT * FROM users WHERE id = ?`, [id]);
    if (users.length === 0) {
      return res.status(404).json({ success: false, error: '用户不存在' });
    }

    if (!newPassword) {
      return res.status(400).json({ success: false, error: '新密码不能为空' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    run(`UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?`, [passwordHash, id]);

    logSensitiveOperation({
      userId: req.user.userId,
      username: req.user.username,
      operation: '密码重置',
      resourceType: ResourceType.USER,
      resourceId: id,
      details: { targetUserId: id, targetUsername: users[0].username },
      ipAddress: clientInfo.ipAddress,
      userAgent: clientInfo.userAgent
    });

    res.json({
      success: true,
      message: '密码重置成功'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, error: '密码重置失败' });
  }
});

module.exports = router;
