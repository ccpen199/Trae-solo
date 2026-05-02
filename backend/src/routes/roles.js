const express = require('express');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { query, run } = require('../config/database');
const { checkAuthorization } = require('../services/authorizationEngine');
const { logAudit, ActionType, ResourceType } = require('../services/auditEngine');

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

const roleDisplayNameMap = {
  'organization_admin': '组织管理员',
  'employee': '普通员工',
  'security_auditor': '安全审计员',
  'external_app_manager': '应用管理员'
};

router.get('/', async (req, res) => {
  try {
    const authResult = checkAuthorization(req.user.userId, 'role', 'read');
    if (!authResult.allowed) {
      const roles = query(`SELECT * FROM roles WHERE 1=1 ORDER BY created_at`);
      return res.json({
        success: true,
        data: {
          list: roles.map(r => ({
            id: r.id,
            name: r.name,
            displayName: roleDisplayNameMap[r.name] || r.name,
            description: r.description,
            type: r.type
          })),
          total: roles.length
        }
      });
    }

    const roles = query(`SELECT * FROM roles ORDER BY created_at`);

    const rolesWithPerms = roles.map(role => {
      const perms = query(`
        SELECT p.* FROM permissions p
        INNER JOIN role_permissions rp ON p.id = rp.permission_id
        WHERE rp.role_id = ?
      `, [role.id]);

      return {
        id: role.id,
        name: role.name,
        displayName: roleDisplayNameMap[role.name] || role.name,
        description: role.description,
        type: role.type,
        permissions: perms,
        createdAt: role.created_at
      };
    });

    res.json({
      success: true,
      data: {
        list: rolesWithPerms,
        total: rolesWithPerms.length
      }
    });

  } catch (error) {
    console.error('Get roles error:', error);
    res.status(500).json({ success: false, error: '获取角色列表失败' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const authResult = checkAuthorization(req.user.userId, 'role', 'read');
    if (!authResult.allowed) {
      return res.status(403).json({ success: false, error: '权限不足' });
    }

    const { id } = req.params;
    const roles = query(`SELECT * FROM roles WHERE id = ?`, [id]);

    if (roles.length === 0) {
      return res.status(404).json({ success: false, error: '角色不存在' });
    }

    const role = roles[0];
    const perms = query(`
      SELECT p.* FROM permissions p
      INNER JOIN role_permissions rp ON p.id = rp.permission_id
      WHERE rp.role_id = ?
    `, [role.id]);

    res.json({
      success: true,
      data: {
        id: role.id,
        name: role.name,
        displayName: roleDisplayNameMap[role.name] || role.name,
        description: role.description,
        type: role.type,
        permissions: perms
      }
    });

  } catch (error) {
    console.error('Get role error:', error);
    res.status(500).json({ success: false, error: '获取角色信息失败' });
  }
});

router.post('/', async (req, res) => {
  try {
    const authResult = checkAuthorization(req.user.userId, 'role', 'write');
    if (!authResult.allowed) {
      return res.status(403).json({ success: false, error: '权限不足' });
    }

    const { name, description, permissions } = req.body;
    const clientInfo = getClientInfo(req);

    if (!name) {
      return res.status(400).json({ success: false, error: '角色名称不能为空' });
    }

    const existing = query(`SELECT * FROM roles WHERE name = ?`, [name]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, error: '角色名称已存在' });
    }

    const id = uuidv4();
    run(`
      INSERT INTO roles (id, name, description)
      VALUES (?, ?, ?)
    `, [id, name, description || '']);

    if (permissions && Array.isArray(permissions)) {
      for (const permId of permissions) {
        run(`
          INSERT INTO role_permissions (id, role_id, permission_id)
          VALUES (?, ?, ?)
        `, [uuidv4(), id, permId]);
      }
    }

    logAudit({
      userId: req.user.userId,
      username: req.user.username,
      action: ActionType.ROLE_CREATE,
      resourceType: ResourceType.ROLE,
      resourceId: id,
      details: { name, description, permissions },
      ipAddress: clientInfo.ipAddress,
      userAgent: clientInfo.userAgent
    });

    res.json({
      success: true,
      message: '角色创建成功',
      data: { id, name, description }
    });

  } catch (error) {
    console.error('Create role error:', error);
    res.status(500).json({ success: false, error: '创建角色失败' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const authResult = checkAuthorization(req.user.userId, 'role', 'write');
    if (!authResult.allowed) {
      return res.status(403).json({ success: false, error: '权限不足' });
    }

    const { id } = req.params;
    const { name, description, permissions } = req.body;
    const clientInfo = getClientInfo(req);

    const roles = query(`SELECT * FROM roles WHERE id = ?`, [id]);
    if (roles.length === 0) {
      return res.status(404).json({ success: false, error: '角色不存在' });
    }

    const oldRole = roles[0];
    const updates = [];
    const values = [];

    if (name !== undefined && name !== oldRole.name) {
      updates.push('name = ?');
      values.push(name);
    }
    if (description !== undefined && description !== oldRole.description) {
      updates.push('description = ?');
      values.push(description);
    }

    if (updates.length > 0) {
      updates.push('updated_at = datetime("now")');
      values.push(id);
      run(`UPDATE roles SET ${updates.join(', ')} WHERE id = ?`, values);
    }

    if (permissions !== undefined) {
      run(`DELETE FROM role_permissions WHERE role_id = ?`, [id]);
      if (Array.isArray(permissions)) {
        for (const permId of permissions) {
          run(`
            INSERT INTO role_permissions (id, role_id, permission_id)
            VALUES (?, ?, ?)
          `, [uuidv4(), id, permId]);
        }
      }
    }

    logAudit({
      userId: req.user.userId,
      username: req.user.username,
      action: ActionType.ROLE_UPDATE,
      resourceType: ResourceType.ROLE,
      resourceId: id,
      details: {
        old: { name: oldRole.name, description: oldRole.description },
        new: { name, description, permissions }
      },
      ipAddress: clientInfo.ipAddress,
      userAgent: clientInfo.userAgent
    });

    res.json({
      success: true,
      message: '角色更新成功'
    });

  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({ success: false, error: '更新角色失败' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const authResult = checkAuthorization(req.user.userId, 'role', 'write');
    if (!authResult.allowed) {
      return res.status(403).json({ success: false, error: '权限不足' });
    }

    const { id } = req.params;
    const clientInfo = getClientInfo(req);

    const roles = query(`SELECT * FROM roles WHERE id = ?`, [id]);
    if (roles.length === 0) {
      return res.status(404).json({ success: false, error: '角色不存在' });
    }

    const role = roles[0];

    const userCount = query(`SELECT COUNT(*) as count FROM user_roles WHERE role_id = ?`, [id]);
    if (userCount[0]?.count > 0) {
      return res.status(400).json({
        success: false,
        error: '该角色下还有用户，请先移除用户角色分配'
      });
    }

    run(`DELETE FROM role_permissions WHERE role_id = ?`, [id]);
    run(`DELETE FROM roles WHERE id = ?`, [id]);

    logAudit({
      userId: req.user.userId,
      username: req.user.username,
      action: ActionType.ROLE_DELETE,
      resourceType: ResourceType.ROLE,
      resourceId: id,
      details: { roleName: role.name },
      ipAddress: clientInfo.ipAddress,
      userAgent: clientInfo.userAgent
    });

    res.json({
      success: true,
      message: '角色删除成功'
    });

  } catch (error) {
    console.error('Delete role error:', error);
    res.status(500).json({ success: false, error: '删除角色失败' });
  }
});

module.exports = router;
