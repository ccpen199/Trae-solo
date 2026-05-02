const { get, all, run } = require('../config/database');
const InventoryLockEngine = require('../engines/inventoryLockEngine');

exports.getTemplates = (req, res) => {
  const { category, isLocked } = req.query;
  
  let query = `
    SELECT t.*, 
           u.nickname as creator_name,
           lu.nickname as locked_by_name
    FROM templates t
    LEFT JOIN users u ON t.created_by = u.id
    LEFT JOIN users lu ON t.locked_by = lu.id
    WHERE 1=1
  `;
  let params = [];
  
  if (category) {
    query += ' AND t.category = ?';
    params.push(category);
  }
  
  if (isLocked !== undefined) {
    query += ' AND t.is_locked = ?';
    params.push(isLocked === 'true' ? 1 : 0);
  }
  
  query += ' ORDER BY t.created_at DESC';
  
  try {
    const templates = all(query, params);
    res.json(templates);
  } catch (err) {
    console.error('获取模板列表错误:', err);
    return res.status(500).json({ error: '获取模板列表失败' });
  }
};

exports.getTemplateById = (req, res) => {
  const templateId = req.params.id;
  
  try {
    const template = get(
      `SELECT t.*, 
              u.nickname as creator_name,
              lu.nickname as locked_by_name
       FROM templates t
       LEFT JOIN users u ON t.created_by = u.id
       LEFT JOIN users lu ON t.locked_by = lu.id
       WHERE t.id = ?`,
      [templateId]
    );
    
    if (!template) {
      return res.status(404).json({ error: '模板不存在' });
    }
    
    const layers = all(
      'SELECT * FROM template_layers WHERE template_id = ? ORDER BY z_index ASC',
      [templateId]
    );
    
    res.json({
      template,
      layers: layers || []
    });
  } catch (err) {
    console.error('获取模板详情错误:', err);
    return res.status(500).json({ error: '获取模板详情失败' });
  }
};

exports.createTemplate = (req, res) => {
  const { templateName, templateCode, description, canvasWidth, canvasHeight, category, previewImage } = req.body;
  const userId = req.user.id;
  
  if (!templateName) {
    return res.status(400).json({ error: '模板名称不能为空' });
  }
  
  try {
    const result = run(
      `INSERT INTO templates 
       (template_name, template_code, description, canvas_width, canvas_height, 
        preview_image, category, created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [
        templateName,
        templateCode,
        description,
        canvasWidth || 800,
        canvasHeight || 800,
        previewImage,
        category || 'general',
        userId
      ]
    );
    
    res.status(201).json({
      id: result.lastInsertRowid,
      templateName,
      templateCode
    });
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT') {
      return res.status(400).json({ error: '模板编码已存在' });
    }
    console.error('创建模板错误:', err);
    return res.status(500).json({ error: '创建模板失败' });
  }
};

exports.updateTemplate = (req, res) => {
  const templateId = req.params.id;
  const updates = req.body;
  const userId = req.user.id;
  
  try {
    const template = get('SELECT * FROM templates WHERE id = ?', [templateId]);
    
    if (!template) {
      return res.status(404).json({ error: '模板不存在' });
    }
    
    if (template.is_locked && template.locked_by !== userId) {
      return res.status(403).json({ error: '模板已被其他用户锁定' });
    }
    
    const fields = [];
    const values = [];
    
    if (updates.templateName !== undefined) {
      fields.push('template_name = ?');
      values.push(updates.templateName);
    }
    if (updates.description !== undefined) {
      fields.push('description = ?');
      values.push(updates.description);
    }
    if (updates.canvasWidth !== undefined) {
      fields.push('canvas_width = ?');
      values.push(updates.canvasWidth);
    }
    if (updates.canvasHeight !== undefined) {
      fields.push('canvas_height = ?');
      values.push(updates.canvasHeight);
    }
    if (updates.previewImage !== undefined) {
      fields.push('preview_image = ?');
      values.push(updates.previewImage);
    }
    if (updates.category !== undefined) {
      fields.push('category = ?');
      values.push(updates.category);
    }
    
    if (fields.length === 0) {
      return res.status(400).json({ error: '没有可更新的字段' });
    }
    
    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(templateId);
    
    const result = run(
      `UPDATE templates SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    
    res.json({
      success: true,
      changes: result.changes
    });
  } catch (err) {
    console.error('更新模板错误:', err);
    return res.status(500).json({ error: '更新模板失败' });
  }
};

exports.lockTemplate = async (req, res) => {
  try {
    const templateId = req.params.id;
    const userId = req.user.id;
    
    const result = await InventoryLockEngine.lockTemplate(templateId, userId);
    
    run(
      'UPDATE templates SET is_locked = 1, locked_by = ?, locked_at = CURRENT_TIMESTAMP WHERE id = ?',
      [userId, templateId]
    );
    
    res.json({
      success: true,
      locked: true,
      lockInfo: result
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.unlockTemplate = async (req, res) => {
  try {
    const templateId = req.params.id;
    const userId = req.user.id;
    
    const result = await InventoryLockEngine.releaseTemplate(templateId, userId);
    
    run(
      'UPDATE templates SET is_locked = 0, locked_by = NULL, locked_at = NULL WHERE id = ?',
      [templateId]
    );
    
    res.json({
      success: true,
      unlocked: true
    });
  } catch (err) {
    res.status(500).json({ error: '解锁模板失败' });
  }
};

exports.getCategories = (req, res) => {
  try {
    const categories = all(
      'SELECT DISTINCT category FROM templates WHERE category IS NOT NULL ORDER BY category',
      []
    );
    
    res.json(categories.map(c => c.category));
  } catch (err) {
    console.error('获取分类错误:', err);
    return res.status(500).json({ error: '获取分类失败' });
  }
};
