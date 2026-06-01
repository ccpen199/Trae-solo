const express = require('express');
const db = require('../models/database');
const auditService = require('../services/auditService');
const { authMiddleware, requirePermission } = require('../middleware/auth');
const router = express.Router();

router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const { status, category, page = 1, pageSize = 20 } = req.query;
    const offset = (page - 1) * pageSize;
    
    let sql = `
      SELECT t.*, u.name as created_by_name, 
             (SELECT name FROM users WHERE id = t.approved_by) as approved_by_name
      FROM email_templates t
      JOIN users u ON t.created_by = u.id
      WHERE 1=1
    `;
    const params = [];
    
    if (status) {
      sql += ' AND t.status = ?';
      params.push(status);
    }
    if (category) {
      sql += ' AND t.category = ?';
      params.push(category);
    }
    
    sql += ' ORDER BY t.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(pageSize), parseInt(offset));
    
    const templates = await db.all(sql, params);
    const total = await db.get('SELECT COUNT(*) as count FROM email_templates');
    
    res.json({
      data: templates.map(t => ({
        ...t,
        variable_fields: JSON.parse(t.variable_fields || '[]')
      })),
      total: total.count
    });
  } catch (error) {
    res.status(500).json({ error: '获取模板列表失败' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const template = await db.get('SELECT * FROM email_templates WHERE id = ?', [req.params.id]);
    if (!template) {
      return res.status(404).json({ error: '模板不存在' });
    }
    
    res.json({
      ...template,
      variable_fields: JSON.parse(template.variable_fields || '[]')
    });
  } catch (error) {
    res.status(500).json({ error: '获取模板详情失败' });
  }
});

router.post('/', requirePermission('template:create'), async (req, res) => {
  try {
    const { name, subject, content, tone, category, variable_fields } = req.body;
    
    const result = await db.run(
      'INSERT INTO email_templates (name, subject, content, tone, category, variable_fields, status, version, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [name, subject, content, tone, category, JSON.stringify(variable_fields), 'draft', 1, req.user.id]
    );

    await auditService.logAction(
      'create',
      'email_template',
      result.lastID,
      req.user.id,
      '创建邮件模板',
      null,
      { name, category, status: 'draft' },
      null,
      '通过模板列表页面删除'
    );

    res.json({ id: result.lastID, message: '模板创建成功' });
  } catch (error) {
    res.status(500).json({ error: '创建模板失败' });
  }
});

router.post('/:id/approve', requirePermission('template:approve'), async (req, res) => {
  try {
    const oldTemplate = await db.get('SELECT * FROM email_templates WHERE id = ?', [req.params.id]);
    if (!oldTemplate) {
      return res.status(404).json({ error: '模板不存在' });
    }
    
    await db.run(
      'UPDATE email_templates SET status = "approved", approved_by = ?, approved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [req.user.id, req.params.id]
    );

    await auditService.logAction(
      'approve',
      'email_template',
      req.params.id,
      req.user.id,
      '审核通过邮件模板',
      { status: oldTemplate.status },
      { status: 'approved' },
      null,
      '取消审核状态'
    );

    res.json({ message: '模板审核通过' });
  } catch (error) {
    res.status(500).json({ error: '审核模板失败' });
  }
});

module.exports = router;
