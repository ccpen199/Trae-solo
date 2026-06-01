const express = require('express');
const db = require('../models/database');
const auditService = require('../services/auditService');
const alertService = require('../services/alertService');
const { authMiddleware, requirePermission } = require('../middleware/auth');
const router = express.Router();

router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const { status, agent_id, customer_id, page = 1, pageSize = 20 } = req.query;
    const offset = (page - 1) * pageSize;
    
    let sql = `
      SELECT e.*, a.name as agent_name, c.name as customer_name, c.email as customer_email,
             u.name as created_by_name, (SELECT name FROM users WHERE id = e.preview_approved_by) as approved_by_name
      FROM email_generations e
      JOIN agent_profiles a ON e.agent_id = a.id
      JOIN customer_profiles c ON e.customer_id = c.id
      JOIN users u ON e.created_by = u.id
      WHERE 1=1
    `;
    const params = [];
    
    if (status) {
      sql += ' AND e.status = ?';
      params.push(status);
    }
    if (agent_id) {
      sql += ' AND e.agent_id = ?';
      params.push(agent_id);
    }
    if (customer_id) {
      sql += ' AND e.customer_id = ?';
      params.push(customer_id);
    }
    
    sql += ' ORDER BY e.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(pageSize), parseInt(offset));
    
    const generations = await db.all(sql, params);
    const total = await db.get('SELECT COUNT(*) as count FROM email_generations');
    
    res.json({
      data: generations.map(g => ({
        ...g,
        content: g.content.replace(/\\n/g, '\n'),
        variables: JSON.parse(g.variables || '{}'),
        validation_result: JSON.parse(g.validation_result || '{}')
      })),
      total: total.count
    });
  } catch (error) {
    console.error('Get generations error:', error);
    res.status(500).json({ error: '获取邮件生成列表失败' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const generation = await db.get(`
      SELECT e.*, a.name as agent_name, c.name as customer_name, c.email as customer_email, c.is_sensitive,
             u.name as created_by_name
      FROM email_generations e
      JOIN agent_profiles a ON e.agent_id = a.id
      JOIN customer_profiles c ON e.customer_id = c.id
      JOIN users u ON e.created_by = u.id
      WHERE e.id = ?
    `, [req.params.id]);
    
    if (!generation) {
      return res.status(404).json({ error: '邮件不存在' });
    }
    
    res.json({
      ...generation,
      content: generation.content.replace(/\\n/g, '\n'),
      variables: JSON.parse(generation.variables || '{}'),
      validation_result: JSON.parse(generation.validation_result || '{}')
    });
  } catch (error) {
    res.status(500).json({ error: '获取邮件详情失败' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { agent_id, template_id, customer_id, variables } = req.body;
    
    const agent = await db.get('SELECT * FROM agent_profiles WHERE id = ?', [agent_id]);
    const customer = await db.get('SELECT * FROM customer_profiles WHERE id = ?', [customer_id]);
    let template = null;
    
    if (template_id) {
      template = await db.get('SELECT * FROM email_templates WHERE id = ?', [template_id]);
    }
    
    const validationResult = {
      variables_valid: true,
      missing_fields: [],
      warnings: []
    };
    
    const requiredFields = await db.all('SELECT * FROM variable_fields WHERE required = 1 AND status = "active"');
    for (const field of requiredFields) {
      if (!variables[field.key] || variables[field.key].toString().trim() === '') {
        validationResult.variables_valid = false;
        validationResult.missing_fields.push(field.name);
      }
    }
    
    let subject = '';
    let content = '';
    let tone = 'professional';
    
    if (template) {
      subject = template.subject;
      content = template.content.replace(/\\n/g, '\n');
      tone = template.tone;
      
      for (const [key, value] of Object.entries(variables)) {
        const regex = new RegExp(`{{${key}}}`, 'g');
        subject = subject.replace(regex, value || '');
        content = content.replace(regex, value || '');
      }
    } else {
      subject = `关于${variables.product_name || '产品'}的合作机会`;
      content = `尊敬的${variables.customer_name || '客户'}：\n\n您好！我想向您介绍我们的${variables.product_name || '产品'}...`;
    }
    
    const result = await db.run(
      'INSERT INTO email_generations (agent_id, template_id, customer_id, subject, content, tone, variables, validation_result, status, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        agent_id,
        template_id,
        customer_id,
        subject,
        content,
        tone,
        JSON.stringify(variables),
        JSON.stringify(validationResult),
        validationResult.variables_valid ? 'validated' : 'draft',
        req.user.id
      ]
    );

    const generationId = result.lastID;
    const generation = { id: generationId, variables: JSON.stringify(variables), tone };
    
    await alertService.checkVariableValidation(generation);
    await alertService.checkSensitiveCustomer(customer, generation);
    if (agent && agent.tone_preferences) {
      const preferredTones = JSON.parse(agent.tone_preferences);
      if (preferredTones.length > 0 && !preferredTones.includes(tone)) {
        await alertService.checkToneMatch(generation, preferredTones[0]);
      }
    }

    await auditService.logAction(
      'create',
      'email_generation',
      generationId,
      req.user.id,
      '生成销售邮件',
      null,
      { agent_id, customer_id, status: validationResult.variables_valid ? 'validated' : 'draft' },
      null,
      '通过邮件列表页面删除并重新生成'
    );

    res.json({ 
      id: generationId, 
      message: validationResult.variables_valid ? '邮件生成成功' : '邮件已生成但存在验证问题',
      validation_result: validationResult
    });
  } catch (error) {
    console.error('Generate email error:', error);
    res.status(500).json({ error: '生成邮件失败' });
  }
});

router.post('/:id/approve', requirePermission('email:approve'), async (req, res) => {
  try {
    const generation = await db.get('SELECT * FROM email_generations WHERE id = ?', [req.params.id]);
    if (!generation) {
      return res.status(404).json({ error: '邮件不存在' });
    }
    
    await db.run(
      'UPDATE email_generations SET status = "approved", preview_approved_by = ?, preview_approved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [req.user.id, req.params.id]
    );

    await auditService.logAction(
      'approve',
      'email_generation',
      req.params.id,
      req.user.id,
      '审核通过邮件预览',
      { status: generation.status },
      { status: 'approved' },
      null,
      '取消审核状态'
    );

    res.json({ message: '邮件审核通过' });
  } catch (error) {
    res.status(500).json({ error: '审核邮件失败' });
  }
});

router.post('/:id/send', async (req, res) => {
  try {
    const generation = await db.get(`
      SELECT e.*, c.is_sensitive, ap.approval_workflow
      FROM email_generations e
      JOIN customer_profiles c ON e.customer_id = c.id
      JOIN agent_profiles ap ON e.agent_id = ap.id
      WHERE e.id = ?
    `, [req.params.id]);
    
    if (!generation) {
      return res.status(404).json({ error: '邮件不存在' });
    }
    
    const approvalWorkflow = JSON.parse(generation.approval_workflow || '{}');
    
    if (generation.is_sensitive && generation.status !== 'approved') {
      return res.status(400).json({ error: '发送给敏感客户前需要审核人员批准' });
    }
    
    if (approvalWorkflow.require_preview_approval && generation.status !== 'approved') {
      return res.status(400).json({ error: '该Agent配置要求发送前必须审核通过' });
    }
    
    if (generation.status === 'sent') {
      return res.status(400).json({ error: '该邮件已经发送' });
    }
    
    await db.run(
      'UPDATE email_generations SET status = "sent", updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [req.params.id]
    );
    
    await db.run(
      'INSERT INTO send_records (generation_id, sent_by, status) VALUES (?, ?, ?)',
      [req.params.id, req.user.id, 'sent']
    );

    await auditService.logAction(
      'send',
      'email_generation',
      req.params.id,
      req.user.id,
      '发送销售邮件',
      { status: generation.status },
      { status: 'sent' },
      null,
      '无法撤销发送，可在发送记录中查看详情'
    );

    res.json({ message: '邮件发送成功' });
  } catch (error) {
    console.error('Send email error:', error);
    res.status(500).json({ error: '发送邮件失败' });
  }
});

router.get('/:id/timeline', async (req, res) => {
  try {
    const logs = await auditService.getLogs('email_generation', parseInt(req.params.id));
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: '获取时间线失败' });
  }
});

module.exports = router;
