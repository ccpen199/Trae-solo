const { db } = require('../models/database');

const createConfigVersion = (req, res) => {
  const { version, appId, envId, mfaType, configData, ruleEngine } = req.body;

  if (!version || !appId || !envId || !mfaType || !configData) {
    return res.status(400).json({ error: '缺少必填字段' });
  }

  const stmt = db.prepare(`
    INSERT INTO mfa_config_versions (version, app_id, env_id, mfa_type, config_data, rule_engine, status, created_by)
    VALUES (?, ?, ?, ?, ?, ?, 'draft', ?)
  `);

  const result = stmt.run(version, appId, envId, mfaType, JSON.stringify(configData), ruleEngine, req.user.id);

  res.json({
    id: result.lastInsertRowid,
    version,
    message: '配置版本创建成功'
  });
};

const getConfigVersions = (req, res) => {
  const { appId, envId, status } = req.query;

  let query = `
    SELECT cv.*, a.app_name, e.env_name, creator.real_name as creator_name, approver.real_name as approver_name
    FROM mfa_config_versions cv
    LEFT JOIN applications a ON cv.app_id = a.id
    LEFT JOIN environments e ON cv.env_id = e.id
    LEFT JOIN users creator ON cv.created_by = creator.id
    LEFT JOIN users approver ON cv.approved_by = approver.id
    WHERE 1=1
  `;
  const params = [];

  if (appId) {
    query += ' AND cv.app_id = ?';
    params.push(appId);
  }

  if (envId) {
    query += ' AND cv.env_id = ?';
    params.push(envId);
  }

  if (status) {
    query += ' AND cv.status = ?';
    params.push(status);
  }

  query += ' ORDER BY cv.created_at DESC';

  const configs = db.prepare(query).all(...params);

  res.json({ configVersions: configs });
};

const approveConfigVersion = (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const config = db.prepare('SELECT * FROM mfa_config_versions WHERE id = ?').get(id);
  if (!config) {
    return res.status(404).json({ error: '配置不存在' });
  }

  db.prepare(`
    UPDATE mfa_config_versions 
    SET status = ?, approved_by = ?, approved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(status || 'approved', req.user.id, id);

  res.json({ message: '配置审批完成' });
};

module.exports = {
  createConfigVersion,
  getConfigVersions,
  approveConfigVersion
};
