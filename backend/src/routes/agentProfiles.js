const express = require('express');
const db = require('../models/database');
const auditService = require('../services/auditService');
const { authMiddleware, requirePermission } = require('../middleware/auth');
const router = express.Router();

router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const { status, page = 1, pageSize = 20 } = req.query;
    const offset = (page - 1) * pageSize;
    
    let sql = 'SELECT a.*, u.name as created_by_name FROM agent_profiles a JOIN users u ON a.created_by = u.id';
    const params = [];
    
    if (status) {
      sql += ' WHERE a.status = ?';
      params.push(status);
    }
    
    sql += ' ORDER BY a.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(pageSize), parseInt(offset));
    
    const agents = await db.all(sql, params);
    const total = await db.get('SELECT COUNT(*) as count FROM agent_profiles');
    
    res.json({
      data: agents.map(a => ({
        ...a,
        model_config: JSON.parse(a.model_config || '{}'),
        tone_preferences: JSON.parse(a.tone_preferences || '[]'),
        variable_requirements: JSON.parse(a.variable_requirements || '[]'),
        approval_workflow: JSON.parse(a.approval_workflow || '{}')
      })),
      total: total.count
    });
  } catch (error) {
    console.error('Get agents error:', error);
    res.status(500).json({ error: '获取Agent列表失败' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const agent = await db.get(
      'SELECT a.*, u.name as created_by_name FROM agent_profiles a JOIN users u ON a.created_by = u.id WHERE a.id = ?',
      [req.params.id]
    );
    
    if (!agent) {
      return res.status(404).json({ error: 'Agent不存在' });
    }
    
    res.json({
      ...agent,
      model_config: JSON.parse(agent.model_config || '{}'),
      tone_preferences: JSON.parse(agent.tone_preferences || '[]'),
      variable_requirements: JSON.parse(agent.variable_requirements || '[]'),
      approval_workflow: JSON.parse(agent.approval_workflow || '{}')
    });
  } catch (error) {
    res.status(500).json({ error: '获取Agent详情失败' });
  }
});

router.post('/', requirePermission('agent:manage'), async (req, res) => {
  try {
    const { name, description, model_config, tone_preferences, variable_requirements, approval_workflow, status } = req.body;
    
    const result = await db.run(
      'INSERT INTO agent_profiles (name, description, model_config, tone_preferences, variable_requirements, approval_workflow, status, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [
        name,
        description,
        JSON.stringify(model_config),
        JSON.stringify(tone_preferences),
        JSON.stringify(variable_requirements),
        JSON.stringify(approval_workflow),
        status || 'active',
        req.user.id
      ]
    );

    await auditService.logAction(
      'create',
      'agent_profile',
      result.lastID,
      req.user.id,
      '创建新的AI邮件Agent',
      null,
      { name, description, status },
      null,
      '通过Agent列表页面点击撤销按钮恢复'
    );

    res.json({ id: result.lastID, message: 'Agent创建成功' });
  } catch (error) {
    console.error('Create agent error:', error);
    res.status(500).json({ error: '创建Agent失败' });
  }
});

router.put('/:id', requirePermission('agent:configure'), async (req, res) => {
  try {
    const oldAgent = await db.get('SELECT * FROM agent_profiles WHERE id = ?', [req.params.id]);
    if (!oldAgent) {
      return res.status(404).json({ error: 'Agent不存在' });
    }

    const { name, description, model_config, tone_preferences, variable_requirements, approval_workflow, status } = req.body;
    
    await db.run(
      'UPDATE agent_profiles SET name = ?, description = ?, model_config = ?, tone_preferences = ?, variable_requirements = ?, approval_workflow = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [
        name,
        description,
        JSON.stringify(model_config),
        JSON.stringify(tone_preferences),
        JSON.stringify(variable_requirements),
        JSON.stringify(approval_workflow),
        status,
        req.params.id
      ]
    );

    await auditService.logAction(
      'update',
      'agent_profile',
      req.params.id,
      req.user.id,
      '更新Agent配置',
      { name: oldAgent.name, status: oldAgent.status },
      { name, status },
      null,
      '通过审计日志查看历史版本并手动恢复'
    );

    res.json({ message: 'Agent更新成功' });
  } catch (error) {
    res.status(500).json({ error: '更新Agent失败' });
  }
});

router.get('/:id/timeline', async (req, res) => {
  try {
    const logs = await auditService.getLogs('agent_profile', parseInt(req.params.id));
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: '获取时间线失败' });
  }
});

module.exports = router;
