const express = require('express');
const db = require('../models/database');
const { authenticateToken, auditLog } = require('../middleware/auth');

const router = express.Router();
router.use(authenticateToken);

router.get('/components', (req, res) => {
  const components = db.prepare('SELECT * FROM component_library ORDER BY id').all();
  components.forEach(c => {
    c.default_props = JSON.parse(c.default_props || '{}');
  });
  res.json(components);
});

router.get('/apps/:appId/forms', (req, res) => {
  const forms = db.prepare(`
    SELECT f.*, u.name as creator_name
    FROM form_schemas f
    LEFT JOIN users u ON f.created_by = u.id
    WHERE f.app_id = ?
    ORDER BY f.updated_at DESC
  `).all(req.params.appId);
  res.json(forms);
});

router.get('/apps/:appId/forms/:formId', (req, res) => {
  const form = db.prepare('SELECT * FROM form_schemas WHERE id = ? AND app_id = ?').get(req.params.formId, req.params.appId);
  if (!form) {
    return res.status(404).json({ error: '表单不存在' });
  }
  form.schema_config = JSON.parse(form.schema_config || '[]');
  form.layout_config = JSON.parse(form.layout_config || '{}');
  form.validation_rules = JSON.parse(form.validation_rules || '[]');
  res.json(form);
});

router.post('/apps/:appId/forms', (req, res) => {
  const { form_name, form_code, description, schema_config, layout_config, validation_rules, model_id } = req.body;
  
  if (!form_name || !form_code) {
    return res.status(400).json({ error: '表单名称和编码不能为空' });
  }

  try {
    const stmt = db.prepare(`
      INSERT INTO form_schemas (app_id, form_name, form_code, description, schema_config, layout_config, validation_rules, model_id, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      req.params.appId,
      form_name,
      form_code,
      description || '',
      JSON.stringify(schema_config || []),
      JSON.stringify(layout_config || {}),
      JSON.stringify(validation_rules || []),
      model_id || null,
      req.user.id
    );

    auditLog(req, 'create', 'form_schema', result.lastInsertRowid, null, { form_name, form_code });
    res.json({ id: result.lastInsertRowid, form_name, form_code });
  } catch (err) {
    if (err.message.includes('UNIQUE constraint')) {
      return res.status(400).json({ error: '表单编码已存在' });
    }
    throw err;
  }
});

router.put('/apps/:appId/forms/:formId', (req, res) => {
  const { form_name, description, schema_config, layout_config, validation_rules, status } = req.body;
  
  const oldForm = db.prepare('SELECT * FROM form_schemas WHERE id = ? AND app_id = ?').get(req.params.formId, req.params.appId);
  if (!oldForm) {
    return res.status(404).json({ error: '表单不存在' });
  }

  db.prepare(`
    UPDATE form_schemas
    SET form_name = COALESCE(?, form_name),
        description = COALESCE(?, description),
        schema_config = COALESCE(?, schema_config),
        layout_config = COALESCE(?, layout_config),
        validation_rules = COALESCE(?, validation_rules),
        status = COALESCE(?, status),
        version = version + 1,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    form_name,
    description,
    schema_config ? JSON.stringify(schema_config) : undefined,
    layout_config ? JSON.stringify(layout_config) : undefined,
    validation_rules ? JSON.stringify(validation_rules) : undefined,
    status,
    req.params.formId
  );

  auditLog(req, 'update', 'form_schema', req.params.formId, oldForm, { form_name, status });
  res.json({ message: '更新成功' });
});

router.post('/apps/:appId/forms/:formId/publish', (req, res) => {
  const form = db.prepare('SELECT * FROM form_schemas WHERE id = ? AND app_id = ?').get(req.params.formId, req.params.appId);
  if (!form) {
    return res.status(404).json({ error: '表单不存在' });
  }

  db.prepare(`
    UPDATE form_schemas SET status = 'published', updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `).run(req.params.formId);

  auditLog(req, 'publish', 'form_schema', req.params.formId, null, { status: 'published' });
  res.json({ message: '发布成功' });
});

router.delete('/apps/:appId/forms/:formId', (req, res) => {
  db.prepare('DELETE FROM form_schemas WHERE id = ? AND app_id = ?').run(req.params.formId, req.params.appId);
  auditLog(req, 'delete', 'form_schema', req.params.formId, null, null);
  res.json({ message: '删除成功' });
});

router.get('/apps/:appId/models', (req, res) => {
  const models = db.prepare(`
    SELECT m.*, u.name as creator_name
    FROM data_models m
    LEFT JOIN users u ON m.created_by = u.id
    WHERE m.app_id = ?
    ORDER BY m.updated_at DESC
  `).all(req.params.appId);
  models.forEach(m => {
    m.fields = JSON.parse(m.fields || '[]');
  });
  res.json(models);
});

router.get('/apps/:appId/models/:modelId', (req, res) => {
  const model = db.prepare('SELECT * FROM data_models WHERE id = ? AND app_id = ?').get(req.params.modelId, req.params.appId);
  if (!model) {
    return res.status(404).json({ error: '数据模型不存在' });
  }
  model.fields = JSON.parse(model.fields || '[]');
  res.json(model);
});

router.post('/apps/:appId/models', (req, res) => {
  const { model_name, model_code, description, fields } = req.body;
  
  if (!model_name || !model_code) {
    return res.status(400).json({ error: '模型名称和编码不能为空' });
  }

  try {
    const stmt = db.prepare(`
      INSERT INTO data_models (app_id, model_name, model_code, description, fields, created_by)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      req.params.appId,
      model_name,
      model_code,
      description || '',
      JSON.stringify(fields || []),
      req.user.id
    );

    auditLog(req, 'create', 'data_model', result.lastInsertRowid, null, { model_name, model_code });
    res.json({ id: result.lastInsertRowid, model_name, model_code });
  } catch (err) {
    if (err.message.includes('UNIQUE constraint')) {
      return res.status(400).json({ error: '模型编码已存在' });
    }
    throw err;
  }
});

router.put('/apps/:appId/models/:modelId', (req, res) => {
  const { model_name, description, fields, status } = req.body;
  
  db.prepare(`
    UPDATE data_models
    SET model_name = COALESCE(?, model_name),
        description = COALESCE(?, description),
        fields = COALESCE(?, fields),
        status = COALESCE(?, status),
        version = version + 1,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    model_name,
    description,
    fields ? JSON.stringify(fields) : undefined,
    status,
    req.params.modelId
  );

  auditLog(req, 'update', 'data_model', req.params.modelId, null, { model_name, status });
  res.json({ message: '更新成功' });
});

router.delete('/apps/:appId/models/:modelId', (req, res) => {
  db.prepare('DELETE FROM data_models WHERE id = ? AND app_id = ?').run(req.params.modelId, req.params.appId);
  auditLog(req, 'delete', 'data_model', req.params.modelId, null, null);
  res.json({ message: '删除成功' });
});

router.get('/apps/:appId/flows', (req, res) => {
  const flows = db.prepare(`
    SELECT f.*, u.name as creator_name
    FROM flow_definitions f
    LEFT JOIN users u ON f.created_by = u.id
    WHERE f.app_id = ?
    ORDER BY f.updated_at DESC
  `).all(req.params.appId);
  flows.forEach(f => {
    f.nodes_config = JSON.parse(f.nodes_config || '[]');
    f.edges_config = JSON.parse(f.edges_config || '[]');
  });
  res.json(flows);
});

router.get('/apps/:appId/flows/:flowId', (req, res) => {
  const flow = db.prepare('SELECT * FROM flow_definitions WHERE id = ? AND app_id = ?').get(req.params.flowId, req.params.appId);
  if (!flow) {
    return res.status(404).json({ error: '流程不存在' });
  }
  flow.nodes_config = JSON.parse(flow.nodes_config || '[]');
  flow.edges_config = JSON.parse(flow.edges_config || '[]');
  res.json(flow);
});

router.post('/apps/:appId/flows', (req, res) => {
  const { flow_name, flow_code, description, nodes_config, edges_config } = req.body;
  
  if (!flow_name || !flow_code) {
    return res.status(400).json({ error: '流程名称和编码不能为空' });
  }

  try {
    const stmt = db.prepare(`
      INSERT INTO flow_definitions (app_id, flow_name, flow_code, description, nodes_config, edges_config, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      req.params.appId,
      flow_name,
      flow_code,
      description || '',
      JSON.stringify(nodes_config || []),
      JSON.stringify(edges_config || []),
      req.user.id
    );

    auditLog(req, 'create', 'flow_definition', result.lastInsertRowid, null, { flow_name, flow_code });
    res.json({ id: result.lastInsertRowid, flow_name, flow_code });
  } catch (err) {
    if (err.message.includes('UNIQUE constraint')) {
      return res.status(400).json({ error: '流程编码已存在' });
    }
    throw err;
  }
});

router.put('/apps/:appId/flows/:flowId', (req, res) => {
  const { flow_name, description, nodes_config, edges_config, status } = req.body;
  
  db.prepare(`
    UPDATE flow_definitions
    SET flow_name = COALESCE(?, flow_name),
        description = COALESCE(?, description),
        nodes_config = COALESCE(?, nodes_config),
        edges_config = COALESCE(?, edges_config),
        status = COALESCE(?, status),
        version = version + 1,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    flow_name,
    description,
    nodes_config ? JSON.stringify(nodes_config) : undefined,
    edges_config ? JSON.stringify(edges_config) : undefined,
    status,
    req.params.flowId
  );

  auditLog(req, 'update', 'flow_definition', req.params.flowId, null, { flow_name, status });
  res.json({ message: '更新成功' });
});

router.post('/apps/:appId/flows/:flowId/publish', (req, res) => {
  db.prepare(`
    UPDATE flow_definitions SET status = 'published', updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `).run(req.params.flowId);
  auditLog(req, 'publish', 'flow_definition', req.params.flowId, null, { status: 'published' });
  res.json({ message: '发布成功' });
});

router.delete('/apps/:appId/flows/:flowId', (req, res) => {
  db.prepare('DELETE FROM flow_definitions WHERE id = ? AND app_id = ?').run(req.params.flowId, req.params.appId);
  auditLog(req, 'delete', 'flow_definition', req.params.flowId, null, null);
  res.json({ message: '删除成功' });
});

router.post('/forms/:formId/submit', (req, res) => {
  const { form_data } = req.body;
  
  const stmt = db.prepare(`
    INSERT INTO form_instances (form_id, app_id, form_data, creator_id)
    SELECT id, app_id, ?, ? FROM form_schemas WHERE id = ?
  `);
  const result = stmt.run(JSON.stringify(form_data || {}), req.user.id, req.params.formId);

  auditLog(req, 'submit', 'form_instance', result.lastInsertRowid, null, { form_id: req.params.formId });
  res.json({ id: result.lastInsertRowid, message: '提交成功' });
});

router.get('/forms/:formId/data', (req, res) => {
  const { page = 1, pageSize = 20 } = req.query;
  
  const instances = db.prepare(`
    SELECT i.*, u.name as creator_name
    FROM form_instances i
    LEFT JOIN users u ON i.creator_id = u.id
    WHERE i.form_id = ?
    ORDER BY i.created_at DESC
    LIMIT ? OFFSET ?
  `).all(req.params.formId, parseInt(pageSize), (parseInt(page) - 1) * parseInt(pageSize));

  instances.forEach(i => {
    i.form_data = JSON.parse(i.form_data || '{}');
  });

  const { total } = db.prepare('SELECT COUNT(*) as total FROM form_instances WHERE form_id = ?').get(req.params.formId);

  res.json({ list: instances, total, page: parseInt(page), pageSize: parseInt(pageSize) });
});

router.get('/apps/:appId/pages', (req, res) => {
  const pages = db.prepare(`
    SELECT p.*, u.name as creator_name, f.form_name, m.model_name
    FROM page_configs p
    LEFT JOIN users u ON p.created_by = u.id
    LEFT JOIN form_schemas f ON p.form_id = f.id
    LEFT JOIN data_models m ON p.model_id = m.id
    WHERE p.app_id = ?
    ORDER BY p.updated_at DESC
  `).all(req.params.appId);
  pages.forEach(p => {
    p.page_config = JSON.parse(p.page_config || '{}');
  });
  res.json(pages);
});

router.post('/apps/:appId/pages', (req, res) => {
  const { page_name, page_code, page_type, page_config, form_id, model_id } = req.body;
  
  try {
    const stmt = db.prepare(`
      INSERT INTO page_configs (app_id, page_name, page_code, page_type, page_config, form_id, model_id, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      req.params.appId,
      page_name,
      page_code,
      page_type,
      JSON.stringify(page_config || {}),
      form_id || null,
      model_id || null,
      req.user.id
    );
    res.json({ id: result.lastInsertRowid, page_name, page_code });
  } catch (err) {
    if (err.message.includes('UNIQUE constraint')) {
      return res.status(400).json({ error: '页面编码已存在' });
    }
    throw err;
  }
});

router.put('/apps/:appId/pages/:pageId', (req, res) => {
  const { page_name, page_config, status } = req.body;
  db.prepare(`
    UPDATE page_configs
    SET page_name = COALESCE(?, page_name),
        page_config = COALESCE(?, page_config),
        status = COALESCE(?, status),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(page_name, page_config ? JSON.stringify(page_config) : undefined, status, req.params.pageId);
  res.json({ message: '更新成功' });
});

router.delete('/apps/:appId/pages/:pageId', (req, res) => {
  db.prepare('DELETE FROM page_configs WHERE id = ? AND app_id = ?').run(req.params.pageId, req.params.appId);
  res.json({ message: '删除成功' });
});

module.exports = router;
