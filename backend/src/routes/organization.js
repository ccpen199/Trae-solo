const express = require('express');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { query, run } = require('../config/database');
const { checkAuthorization, generateMenuForUser } = require('../services/authorizationEngine');
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
    const authResult = checkAuthorization(req.user.userId, 'organization', 'read');
    if (!authResult.allowed) {
      return res.status(403).json({
        success: false,
        error: '权限不足'
      });
    }

    const organizations = query(`
      SELECT o.*, 
             (SELECT COUNT(*) FROM users u WHERE u.organization_id = o.id) as user_count,
             (SELECT COUNT(*) FROM organizations c WHERE c.parent_id = o.id) as child_count
      FROM organizations o
      ORDER BY o.created_at
    `);

    const buildTree = (items, parentId = null) => {
      return items
        .filter(item => item.parent_id === parentId)
        .map(item => ({
          ...item,
          children: buildTree(items, item.id)
        }));
    };

    const tree = buildTree(organizations);

    res.json({
      success: true,
      data: {
        list: organizations,
        tree: tree,
        total: organizations.length
      }
    });

  } catch (error) {
    console.error('Get organizations error:', error);
    res.status(500).json({ success: false, error: '获取组织架构失败' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const authResult = checkAuthorization(req.user.userId, 'organization', 'read');
    if (!authResult.allowed) {
      return res.status(403).json({ success: false, error: '权限不足' });
    }

    const { id } = req.params;
    const orgs = query(`SELECT * FROM organizations WHERE id = ?`, [id]);

    if (orgs.length === 0) {
      return res.status(404).json({ success: false, error: '组织不存在' });
    }

    const org = orgs[0];
    
    const children = query(`SELECT * FROM organizations WHERE parent_id = ?`, [id]);
    const users = query(`
      SELECT u.id, u.username, u.real_name, u.email, u.status
      FROM users u WHERE u.organization_id = ?
    `, [id]);

    res.json({
      success: true,
      data: {
        ...org,
        children,
        users
      }
    });

  } catch (error) {
    console.error('Get organization error:', error);
    res.status(500).json({ success: false, error: '获取组织信息失败' });
  }
});

router.post('/', async (req, res) => {
  try {
    const authResult = checkAuthorization(req.user.userId, 'organization', 'write');
    if (!authResult.allowed) {
      return res.status(403).json({ success: false, error: '权限不足' });
    }

    const { name, parentId, type = 'department' } = req.body;
    const clientInfo = getClientInfo(req);

    if (!name) {
      return res.status(400).json({ success: false, error: '组织名称不能为空' });
    }

    if (parentId) {
      const parentOrgs = query(`SELECT * FROM organizations WHERE id = ?`, [parentId]);
      if (parentOrgs.length === 0) {
        return res.status(400).json({ success: false, error: '上级组织不存在' });
      }
    }

    const id = uuidv4();
    run(`
      INSERT INTO organizations (id, name, parent_id, type)
      VALUES (?, ?, ?, ?)
    `, [id, name, parentId || null, type]);

    logAudit({
      userId: req.user.userId,
      username: req.user.username,
      action: ActionType.ORG_CREATE,
      resourceType: ResourceType.ORGANIZATION,
      resourceId: id,
      details: { name, parentId, type },
      ipAddress: clientInfo.ipAddress,
      userAgent: clientInfo.userAgent
    });

    const newOrg = query(`SELECT * FROM organizations WHERE id = ?`, [id])[0];

    res.json({
      success: true,
      message: '组织创建成功',
      data: newOrg
    });

  } catch (error) {
    console.error('Create organization error:', error);
    res.status(500).json({ success: false, error: '创建组织失败' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const authResult = checkAuthorization(req.user.userId, 'organization', 'write');
    if (!authResult.allowed) {
      return res.status(403).json({ success: false, error: '权限不足' });
    }

    const { id } = req.params;
    const { name, parentId, type } = req.body;
    const clientInfo = getClientInfo(req);

    const orgs = query(`SELECT * FROM organizations WHERE id = ?`, [id]);
    if (orgs.length === 0) {
      return res.status(404).json({ success: false, error: '组织不存在' });
    }

    const oldOrg = orgs[0];
    const updates = [];
    const values = [];

    if (name !== undefined) {
      updates.push('name = ?');
      values.push(name);
    }
    if (parentId !== undefined) {
      updates.push('parent_id = ?');
      values.push(parentId);
    }
    if (type !== undefined) {
      updates.push('type = ?');
      values.push(type);
    }

    if (updates.length > 0) {
      updates.push('updated_at = datetime("now")');
      values.push(id);

      run(`
        UPDATE organizations SET ${updates.join(', ')} WHERE id = ?
      `, values);

      logAudit({
        userId: req.user.userId,
        username: req.user.username,
        action: ActionType.ORG_UPDATE,
        resourceType: ResourceType.ORGANIZATION,
        resourceId: id,
        details: { 
          old: { name: oldOrg.name, parentId: oldOrg.parent_id, type: oldOrg.type },
          new: { name, parentId, type }
        },
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent
      });
    }

    const updatedOrg = query(`SELECT * FROM organizations WHERE id = ?`, [id])[0];

    res.json({
      success: true,
      message: '组织更新成功',
      data: updatedOrg
    });

  } catch (error) {
    console.error('Update organization error:', error);
    res.status(500).json({ success: false, error: '更新组织失败' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const authResult = checkAuthorization(req.user.userId, 'organization', 'write');
    if (!authResult.allowed) {
      return res.status(403).json({ success: false, error: '权限不足' });
    }

    const { id } = req.params;
    const clientInfo = getClientInfo(req);

    const orgs = query(`SELECT * FROM organizations WHERE id = ?`, [id]);
    if (orgs.length === 0) {
      return res.status(404).json({ success: false, error: '组织不存在' });
    }

    const org = orgs[0];

    const children = query(`SELECT * FROM organizations WHERE parent_id = ?`, [id]);
    if (children.length > 0) {
      return res.status(400).json({ 
        success: false, 
        error: '该组织下还有子组织，请先删除或转移子组织' 
      });
    }

    const users = query(`SELECT * FROM users WHERE organization_id = ?`, [id]);
    if (users.length > 0) {
      return res.status(400).json({ 
        success: false, 
        error: '该组织下还有员工，请先转移员工' 
      });
    }

    logSensitiveOperation({
      userId: req.user.userId,
      username: req.user.username,
      operation: '删除组织',
      resourceType: ResourceType.ORGANIZATION,
      resourceId: id,
      details: { orgName: org.name, orgType: org.type },
      ipAddress: clientInfo.ipAddress,
      userAgent: clientInfo.userAgent
    });

    run(`DELETE FROM organizations WHERE id = ?`, [id]);

    res.json({
      success: true,
      message: '组织删除成功'
    });

  } catch (error) {
    console.error('Delete organization error:', error);
    res.status(500).json({ success: false, error: '删除组织失败' });
  }
});

router.post('/sync', async (req, res) => {
  try {
    const authResult = checkAuthorization(req.user.userId, 'organization', 'write');
    if (!authResult.allowed) {
      return res.status(403).json({ success: false, error: '权限不足' });
    }

    const { source, organizations, users } = req.body;
    const clientInfo = getClientInfo(req);

    let syncedOrgs = 0;
    let syncedUsers = 0;

    if (organizations && Array.isArray(organizations)) {
      for (const org of organizations) {
        const existing = query(`SELECT * FROM organizations WHERE id = ?`, [org.id]);
        
        if (existing.length === 0) {
          run(`
            INSERT INTO organizations (id, name, parent_id, type)
            VALUES (?, ?, ?, ?)
          `, [org.id, org.name, org.parentId || null, org.type || 'department']);
          syncedOrgs++;
        } else {
          run(`
            UPDATE organizations SET name = ?, parent_id = ?, type = ?, updated_at = datetime('now')
            WHERE id = ?
          `, [org.name, org.parentId || null, org.type || 'department', org.id]);
          syncedOrgs++;
        }
      }
    }

    if (users && Array.isArray(users)) {
      const bcrypt = require('bcryptjs');
      
      for (const user of users) {
        const existing = query(`SELECT * FROM users WHERE id = ? OR username = ?`, [user.id, user.username]);
        
        if (existing.length === 0) {
          const passwordHash = await bcrypt.hash(user.initialPassword || 'Default@123', 10);
          run(`
            INSERT INTO users (id, username, email, phone, password_hash, real_name, status, organization_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            user.id || uuidv4(), 
            user.username, 
            user.email || null, 
            user.phone || null, 
            passwordHash, 
            user.realName || user.username,
            user.status || 'pending',
            user.organizationId || null
          ]);
          syncedUsers++;
        }
      }
    }

    logAudit({
      userId: req.user.userId,
      username: req.user.username,
      action: ActionType.ORG_UPDATE,
      resourceType: ResourceType.ORGANIZATION,
      details: { 
        source: source || 'manual_sync',
        syncedOrgs,
        syncedUsers
      },
      ipAddress: clientInfo.ipAddress,
      userAgent: clientInfo.userAgent
    });

    res.json({
      success: true,
      message: '同步完成',
      data: {
        syncedOrgs,
        syncedUsers
      }
    });

  } catch (error) {
    console.error('Sync organizations error:', error);
    res.status(500).json({ success: false, error: '同步组织架构失败' });
  }
});

module.exports = router;
