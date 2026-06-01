const { db } = require('../models/database');

const createEnvironment = (req, res) => {
  const { envName, envType, appId, baseUrl } = req.body;

  if (!envName || !envType || !appId) {
    return res.status(400).json({ error: '环境名称、类型和应用ID不能为空' });
  }

  const app = db.prepare('SELECT * FROM applications WHERE id = ?').get(appId);
  if (!app) {
    return res.status(404).json({ error: '应用不存在' });
  }

  const existingEnv = db.prepare('SELECT * FROM environments WHERE app_id = ? AND env_type = ?').get(appId, envType);
  if (existingEnv) {
    return res.status(400).json({ error: '该应用下已存在相同类型的环境' });
  }

  const envId = `${app.app_id}-${envType}-${Date.now()}`;

  const stmt = db.prepare(`
    INSERT INTO environments (env_id, env_name, app_id, env_type, base_url, created_by, status)
    VALUES (?, ?, ?, ?, ?, ?, 'active')
  `);

  const result = stmt.run(envId, envName, appId, envType, baseUrl, req.user.id);

  res.json({
    id: result.lastInsertRowid,
    envId,
    envName,
    message: '环境创建成功'
  });
};

const getEnvironments = (req, res) => {
  const { appId } = req.query;

  let query = `
    SELECT e.*, a.app_name, a.app_id, creator.real_name as creator_name
    FROM environments e
    LEFT JOIN applications a ON e.app_id = a.id
    LEFT JOIN users creator ON e.created_by = creator.id
    WHERE 1=1
  `;
  const params = [];

  if (appId) {
    query += ' AND e.app_id = ?';
    params.push(appId);
  }

  query += ' ORDER BY e.created_at DESC';

  const envs = db.prepare(query).all(...params);

  res.json({ environments: envs });
};

module.exports = {
  createEnvironment,
  getEnvironments
};
