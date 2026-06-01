const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../models/database');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { createAuditLog } = require('../services/auditService');

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, owner, environment, keyword } = req.query;
    let sql = `
      SELECT a.*, u.name as owner_name 
      FROM applications a 
      LEFT JOIN users u ON a.owner_id = u.id 
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      sql += ' AND a.status = ?';
      params.push(status);
    }
    if (environment) {
      sql += ' AND a.environment = ?';
      params.push(environment);
    }
    if (keyword) {
      sql += ' AND (a.name LIKE ? OR a.app_id LIKE ? OR a.description LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
    }

    sql += ' ORDER BY a.created_at DESC';
    const apps = await db.all(sql, params);
    res.json(apps);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const app = await db.get(`
      SELECT a.*, u.name as owner_name 
      FROM applications a 
      LEFT JOIN users u ON a.owner_id = u.id 
      WHERE a.id = ?
    `, [req.params.id]);
    
    if (!app) {
      return res.status(404).json({ error: '应用不存在' });
    }
    res.json(app);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authenticateToken, requireRole('admin', 'ops', 'appowner'), async (req, res) => {
  try {
    const { name, description, environment, version, owner_id } = req.body;
    const appId = 'APP-' + uuidv4().slice(0, 8).toUpperCase();
    const apiKey = 'API-' + uuidv4().replace(/-/g, '');

    const result = await db.run(
      `INSERT INTO applications (app_id, name, description, environment, version, owner_id, api_key) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [appId, name, description, environment || 'dev', version || '1.0.0', owner_id, apiKey]
    );

    await createAuditLog(
      req.user.id,
      'create',
      'application',
      result.lastID,
      null,
      { name, environment },
      req.ip,
      req.get('User-Agent')
    );

    const app = await db.get('SELECT * FROM applications WHERE id = ?', [result.lastID]);
    res.status(201).json(app);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', authenticateToken, requireRole('admin', 'ops'), async (req, res) => {
  try {
    const oldApp = await db.get('SELECT * FROM applications WHERE id = ?', [req.params.id]);
    if (!oldApp) {
      return res.status(404).json({ error: '应用不存在' });
    }

    const { name, description, environment, version, status, owner_id } = req.body;
    await db.run(
      `UPDATE applications 
       SET name = ?, description = ?, environment = ?, version = ?, status = ?, owner_id = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [name, description, environment, version, status, owner_id, req.params.id]
    );

    await createAuditLog(
      req.user.id,
      'update',
      'application',
      req.params.id,
      oldApp,
      { name, description, environment, version, status, owner_id },
      req.ip,
      req.get('User-Agent')
    );

    const app = await db.get('SELECT * FROM applications WHERE id = ?', [req.params.id]);
    res.json(app);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const oldApp = await db.get('SELECT * FROM applications WHERE id = ?', [req.params.id]);
    if (!oldApp) {
      return res.status(404).json({ error: '应用不存在' });
    }

    await db.run('DELETE FROM applications WHERE id = ?', [req.params.id]);

    await createAuditLog(
      req.user.id,
      'delete',
      'application',
      req.params.id,
      oldApp,
      null,
      req.ip,
      req.get('User-Agent')
    );

    res.json({ message: '应用已删除' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
