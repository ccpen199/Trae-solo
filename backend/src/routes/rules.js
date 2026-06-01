const express = require('express');
const db = require('../models/database');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { createAuditLog, createAlert } = require('../services/auditService');

const router = express.Router();

router.get('/version/:appId', authenticateToken, async (req, res) => {
  try {
    const result = await db.get(
      'SELECT MAX(version) as max_version FROM mask_rules WHERE app_id = ?',
      [req.params.appId]
    );
    res.json({ max_version: result.max_version || 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/', authenticateToken, async (req, res) => {
  try {
    const { appId, isActive } = req.query;
    let sql = `
      SELECT r.*, a.name as app_name, u.name as created_by_name
      FROM mask_rules r
      LEFT JOIN applications a ON r.app_id = a.id
      LEFT JOIN users u ON r.created_by = u.id
      WHERE 1=1
    `;
    const params = [];

    if (appId) {
      sql += ' AND r.app_id = ?';
      params.push(appId);
    }
    if (isActive !== undefined) {
      sql += ' AND r.is_active = ?';
      params.push(isActive === 'true' ? 1 : 0);
    }

    sql += ' ORDER BY r.created_at DESC';
    const rules = await db.all(sql, params);
    res.json(rules);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const rule = await db.get(`
      SELECT r.*, a.name as app_name, u.name as created_by_name
      FROM mask_rules r
      LEFT JOIN applications a ON r.app_id = a.id
      LEFT JOIN users u ON r.created_by = u.id
      WHERE r.id = ?
    `, [req.params.id]);
    
    if (!rule) {
      return res.status(404).json({ error: '规则不存在' });
    }
    res.json(rule);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authenticateToken, requireRole('admin', 'ops', 'security'), async (req, res) => {
  try {
    const { app_id, name, description, rule_type, pattern, replacement } = req.body;

    if (!app_id || !name || !rule_type || !pattern) {
      return res.status(400).json({ error: '应用ID、规则名称、规则类型和匹配模式为必填' });
    }

    const versionResult = await db.get('SELECT MAX(version) as max_version FROM mask_rules WHERE app_id = ?', [app_id]);
    const newVersion = (versionResult.max_version || 0) + 1;

    const result = await db.run(
      `INSERT INTO mask_rules (app_id, name, description, rule_type, pattern, replacement, version, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [app_id, name, description, rule_type, pattern, replacement || '***', newVersion, req.user.id]
    );

    await createAuditLog(
      req.user.id,
      'create',
      'mask_rule',
      result.lastID,
      null,
      { name, rule_type, pattern },
      req.ip,
      req.get('User-Agent')
    );

    const rule = await db.get('SELECT * FROM mask_rules WHERE id = ?', [result.lastID]);
    res.status(201).json(rule);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', authenticateToken, requireRole('admin', 'ops', 'security'), async (req, res) => {
  try {
    const oldRule = await db.get('SELECT * FROM mask_rules WHERE id = ?', [req.params.id]);
    if (!oldRule) {
      return res.status(404).json({ error: '规则不存在' });
    }

    const { name, description, rule_type, pattern, replacement, is_active } = req.body;

    await db.run(
      `UPDATE mask_rules 
       SET name = ?, description = ?, rule_type = ?, pattern = ?, replacement = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [name, description, rule_type, pattern, replacement, is_active ? 1 : 0, req.params.id]
    );

    await createAuditLog(
      req.user.id,
      'update',
      'mask_rule',
      req.params.id,
      oldRule,
      { name, description, rule_type, pattern, replacement, is_active },
      req.ip,
      req.get('User-Agent')
    );

    if (oldRule.is_active && !is_active) {
      await createAlert(
        'rule_change',
        'warning',
        '脱敏规则已停用',
        `规则 "${oldRule.name}" 已被停用`,
        oldRule.app_id,
        null,
        null
      );
    }

    const rule = await db.get('SELECT * FROM mask_rules WHERE id = ?', [req.params.id]);
    res.json(rule);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', authenticateToken, requireRole('admin', 'security'), async (req, res) => {
  try {
    const oldRule = await db.get('SELECT * FROM mask_rules WHERE id = ?', [req.params.id]);
    if (!oldRule) {
      return res.status(404).json({ error: '规则不存在' });
    }

    await db.run('DELETE FROM mask_rules WHERE id = ?', [req.params.id]);

    await createAuditLog(
      req.user.id,
      'delete',
      'mask_rule',
      req.params.id,
      oldRule,
      null,
      req.ip,
      req.get('User-Agent')
    );

    res.json({ message: '规则已删除' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
