const express = require('express');
const db = require('../db');
const { authenticateJWT, requireRole } = require('../middleware/auth');
const { logAction } = require('../middleware/audit');

const router = express.Router();

router.get('/', authenticateJWT, (req, res) => {
  const { category_code, is_builtin } = req.query;

  let sql = `
    SELECT t.*, c.category_name
    FROM jd_templates t
    JOIN manufacturing_job_categories c ON t.job_category_code = c.category_code
    WHERE 1=1
  `;
  const params = [];

  if (category_code) {
    sql += ' AND t.job_category_code LIKE ?';
    params.push(category_code + '%');
  }
  if (is_builtin !== undefined) {
    sql += ' AND t.is_builtin = ?';
    params.push(parseInt(is_builtin));
  }

  sql += ' ORDER BY t.is_builtin DESC, t.created_at DESC';

  const templates = db.prepare(sql).all(...params);

  res.json({
    templates: templates.map(t => ({
      ...t,
      ability_model: t.ability_model ? JSON.parse(t.ability_model) : null,
    })),
  });
});

router.get('/:id', authenticateJWT, (req, res) => {
  const template = db.prepare(`
    SELECT t.*, c.category_name
    FROM jd_templates t
    JOIN manufacturing_job_categories c ON t.job_category_code = c.category_code
    WHERE t.id = ?
  `).get(req.params.id);

  if (!template) {
    return res.status(404).json({ error: '模板不存在' });
  }

  template.ability_model = template.ability_model ? JSON.parse(template.ability_model) : null;

  res.json({ template });
});

router.post('/', authenticateJWT, requireRole('hr', 'admin'), (req, res) => {
  const enterprise = db.prepare('SELECT * FROM enterprises WHERE user_id = ?').get(req.user.id);
  
  const {
    template_name, job_category_code, job_title, job_description,
    requirements, ability_model, salary_min, salary_max
  } = req.body;

  const info = db.prepare(`
    INSERT INTO jd_templates (
      template_name, job_category_code, job_title, job_description,
      requirements, ability_model, salary_min, salary_max, is_builtin, enterprise_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
  `).run(template_name, job_category_code, job_title, job_description,
         requirements, JSON.stringify(ability_model || {}),
         salary_min, salary_max, enterprise?.id || null);

  logAction('create_jd_template', req, 'jd_template', info.lastInsertRowid,
    `创建JD模板：${template_name}`);

  res.json({ templateId: info.lastInsertRowid });
});

router.put('/:id', authenticateJWT, requireRole('hr', 'admin'), (req, res) => {
  const template = db.prepare('SELECT * FROM jd_templates WHERE id = ?').get(req.params.id);
  if (!template) {
    return res.status(404).json({ error: '模板不存在' });
  }

  if (template.is_builtin && req.user.role !== 'admin') {
    return res.status(403).json({ error: '内置模板不可修改' });
  }

  const {
    template_name, job_category_code, job_title, job_description,
    requirements, ability_model, salary_min, salary_max
  } = req.body;

  db.prepare(`
    UPDATE jd_templates SET
      template_name = COALESCE(?, template_name),
      job_category_code = COALESCE(?, job_category_code),
      job_title = COALESCE(?, job_title),
      job_description = COALESCE(?, job_description),
      requirements = COALESCE(?, requirements),
      ability_model = COALESCE(?, ability_model),
      salary_min = COALESCE(?, salary_min),
      salary_max = COALESCE(?, salary_max)
    WHERE id = ?
  `).run(template_name, job_category_code, job_title, job_description,
         requirements, ability_model ? JSON.stringify(ability_model) : null,
         salary_min, salary_max, req.params.id);

  logAction('update_jd_template', req, 'jd_template', req.params.id,
    `更新JD模板：${template_name || template.template_name}`);

  res.json({ success: true });
});

router.delete('/:id', authenticateJWT, requireRole('hr', 'admin'), (req, res) => {
  const template = db.prepare('SELECT * FROM jd_templates WHERE id = ?').get(req.params.id);
  if (!template) {
    return res.status(404).json({ error: '模板不存在' });
  }

  if (template.is_builtin) {
    return res.status(403).json({ error: '内置模板不可删除' });
  }

  db.prepare('DELETE FROM jd_templates WHERE id = ?').run(req.params.id);
  logAction('delete_jd_template', req, 'jd_template', req.params.id,
    `删除JD模板：${template.template_name}`);

  res.json({ success: true });
});

module.exports = router;
