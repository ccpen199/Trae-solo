const { db } = require('../models/database');
const { v4: uuidv4 } = require('uuid');

const createApplication = (req, res) => {
  const { appId, appName, appDescription } = req.body;

  if (!appId || !appName) {
    return res.status(400).json({ error: '应用ID和名称不能为空' });
  }

  const existingApp = db.prepare('SELECT * FROM applications WHERE app_id = ?').get(appId);
  if (existingApp) {
    return res.status(400).json({ error: '应用ID已存在' });
  }

  const stmt = db.prepare(`
    INSERT INTO applications (app_id, app_name, app_description, owner_id, created_by, status)
    VALUES (?, ?, ?, ?, ?, 'pending')
  `);

  const result = stmt.run(appId, appName, appDescription, req.user.id, req.user.id);

  res.json({
    id: result.lastInsertRowid,
    appId,
    appName,
    message: '应用创建成功，等待审批'
  });
};

const getApplications = (req, res) => {
  const { status, owner, keyword } = req.query;
  
  let query = `
    SELECT a.*, u.real_name as owner_name, creator.real_name as creator_name
    FROM applications a
    LEFT JOIN users u ON a.owner_id = u.id
    LEFT JOIN users creator ON a.created_by = creator.id
    WHERE 1=1
  `;
  const params = [];

  if (status) {
    query += ' AND a.status = ?';
    params.push(status);
  }

  if (owner) {
    query += ' AND a.owner_id = ?';
    params.push(owner);
  }

  if (keyword) {
    query += ' AND (a.app_name LIKE ? OR a.app_id LIKE ?)';
    params.push(`%${keyword}%`, `%${keyword}%`);
  }

  query += ' ORDER BY a.created_at DESC';

  const apps = db.prepare(query).all(...params);

  res.json({ applications: apps });
};

const getApplicationById = (req, res) => {
  const app = db.prepare(`
    SELECT a.*, u.real_name as owner_name, creator.real_name as creator_name
    FROM applications a
    LEFT JOIN users u ON a.owner_id = u.id
    LEFT JOIN users creator ON a.created_by = creator.id
    WHERE a.id = ?
  `).get(req.params.id);

  if (!app) {
    return res.status(404).json({ error: '应用不存在' });
  }

  res.json({ application: app });
};

const approveApplication = (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const app = db.prepare('SELECT * FROM applications WHERE id = ?').get(id);
  if (!app) {
    return res.status(404).json({ error: '应用不存在' });
  }

  db.prepare(`
    UPDATE applications 
    SET status = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(status || 'active', id);

  res.json({ message: '应用状态已更新' });
};

module.exports = {
  createApplication,
  getApplications,
  getApplicationById,
  approveApplication
};
