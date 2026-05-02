const { OrderService, ORDER_STATUSES, STATUS_NAMES } = require('../services/orderService');
const InventoryLockEngine = require('../engines/inventoryLockEngine');
const { get, all, run } = require('../config/database');

exports.createOrder = async (req, res) => {
  try {
    const orderData = req.body;
    const creatorId = req.user.id;
    
    if (!orderData.canvasName) {
      return res.status(400).json({ error: '画布名称不能为空' });
    }
    
    const result = await OrderService.createOrder(orderData, creatorId);
    res.status(201).json(result);
  } catch (err) {
    console.error('创建订单错误:', err);
    res.status(500).json({ error: '创建订单失败' });
  }
};

exports.getOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;
    const { status } = req.query;
    
    const orders = await OrderService.getOrdersByUser(userId, role, { status });
    res.json(orders);
  } catch (err) {
    console.error('获取订单列表错误:', err);
    res.status(500).json({ error: '获取订单列表失败' });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const orderId = req.params.id;
    const order = await OrderService.getOrderById(orderId);
    
    if (!order) {
      return res.status(404).json({ error: '订单不存在' });
    }
    
    const images = all(
      `SELECT * FROM images WHERE order_id = ? ORDER BY created_at DESC`,
      [orderId]
    );
    
    const layers = all(
      `SELECT * FROM layers WHERE order_id = ? ORDER BY z_index ASC`,
      [orderId]
    );
    
    const timeline = all(
      `SELECT tl.*, u.nickname as user_name
       FROM timeline tl
       LEFT JOIN users u ON tl.user_id = u.id
       WHERE tl.order_id = ?
       ORDER BY tl.created_at DESC`,
      [orderId]
    );
    
    const orderTemplates = all(
      `SELECT ol.*, t.template_name, u.nickname as applied_by_name
       FROM order_templates ol
       LEFT JOIN templates t ON ol.template_id = t.id
       LEFT JOIN users u ON ol.applied_by = u.id
       WHERE ol.order_id = ?
       ORDER BY ol.applied_at DESC`,
      [orderId]
    );
    
    const exports = all(
      `SELECT e.*, u.nickname as exported_by_name
       FROM exports e
       LEFT JOIN users u ON e.exported_by = u.id
       WHERE e.order_id = ?
       ORDER BY e.exported_at DESC`,
      [orderId]
    );
    
    res.json({
      order,
      images: images || [],
      layers: layers || [],
      timeline: timeline || [],
      orderTemplates: orderTemplates || [],
      exports: exports || []
    });
  } catch (err) {
    console.error('获取订单详情错误:', err);
    res.status(500).json({ error: '获取订单详情失败' });
  }
};

exports.uploadImage = (req, res) => {
  try {
    const orderId = req.params.id;
    const file = req.file;
    
    if (!file) {
      return res.status(400).json({ error: '请选择要上传的文件' });
    }
    
    const order = get('SELECT * FROM orders WHERE id = ?', [orderId]);
    
    if (!order) {
      return res.status(404).json({ error: '订单不存在' });
    }
    
    const imgResult = run(
      `INSERT INTO images 
       (order_id, file_name, file_path, file_size, mime_type, version, created_by, created_at)
       VALUES (?, ?, ?, ?, ?, 1, ?, CURRENT_TIMESTAMP)`,
      [orderId, file.originalname, file.path, file.size, file.mimetype, req.user.id]
    );
    
    const imageId = imgResult.lastInsertRowid;
    
    if (order.status === ORDER_STATUSES.PENDING_UPLOAD) {
      run(
        `UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [ORDER_STATUSES.PENDING_EDIT, orderId]
      );
      
      run(
        `INSERT INTO operation_logs 
         (order_id, user_id, action, action_detail, from_status, to_status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [orderId, req.user.id, 'upload_image', `上传图片: ${file.originalname}`, 
         ORDER_STATUSES.PENDING_UPLOAD, ORDER_STATUSES.PENDING_EDIT]
      );
      
      run(
        `INSERT INTO timeline 
         (order_id, user_id, action, comment, created_at)
         VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [orderId, req.user.id, '上传图片', `图片: ${file.originalname}`]
      );
    }
    
    res.json({
      id: imageId,
      fileName: file.originalname,
      size: file.size,
      orderId
    });
  } catch (err) {
    console.error('上传图片错误:', err);
    res.status(500).json({ error: '上传图片失败' });
  }
};

exports.addLayer = (req, res) => {
  try {
    const orderId = req.params.id;
    const layerData = req.body;
    
    const order = get('SELECT * FROM orders WHERE id = ?', [orderId]);
    
    if (!order) {
      return res.status(404).json({ error: '订单不存在' });
    }
    
    const zResult = get(
      'SELECT MAX(z_index) as max_z FROM layers WHERE order_id = ?',
      [orderId]
    );
    const nextZ = (zResult?.max_z || 0) + 1;
    
    const layerResult = run(
      `INSERT INTO layers 
       (order_id, image_id, layer_name, layer_type, position_x, position_y, 
        width, height, z_index, opacity, is_visible, is_locked, properties, version)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        orderId,
        layerData.imageId,
        layerData.layerName || '新建图层',
        layerData.layerType || 'image',
        layerData.positionX || 0,
        layerData.positionY || 0,
        layerData.width,
        layerData.height,
        layerData.zIndex || nextZ,
        layerData.opacity !== undefined ? layerData.opacity : 1,
        layerData.isVisible !== undefined ? layerData.isVisible : 1,
        layerData.isLocked || 0,
        JSON.stringify(layerData.properties || {})
      ]
    );
    
    const layerId = layerResult.lastInsertRowid;
    
    if (layerData.layerType === 'text' && layerData.textContent) {
      run(
        `INSERT INTO texts 
         (layer_id, content, font_family, font_size, font_color, font_weight, 
          font_style, text_align, line_height, letter_spacing)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          layerId,
          layerData.textContent,
          layerData.fontFamily || 'Arial',
          layerData.fontSize || 16,
          layerData.fontColor || '#000000',
          layerData.fontWeight || 'normal',
          layerData.fontStyle || 'normal',
          layerData.textAlign || 'left',
          layerData.lineHeight || 1.5,
          layerData.letterSpacing || 0
        ]
      );
    }
    
    run(
      `INSERT INTO timeline 
       (order_id, user_id, action, comment, created_at)
       VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [orderId, req.user.id, '添加图层', `图层: ${layerData.layerName || '新建图层'}`]
    );
    
    res.json({
      id: layerId,
      orderId,
      zIndex: layerData.zIndex || nextZ
    });
  } catch (err) {
    console.error('添加图层错误:', err);
    res.status(500).json({ error: '添加图层失败' });
  }
};

exports.updateLayer = (req, res) => {
  try {
    const orderId = req.params.id;
    const layerId = req.params.layerId;
    const updates = req.body;
    
    const fields = [];
    const values = [];
    
    if (updates.layerName !== undefined) {
      fields.push('layer_name = ?');
      values.push(updates.layerName);
    }
    if (updates.positionX !== undefined) {
      fields.push('position_x = ?');
      values.push(updates.positionX);
    }
    if (updates.positionY !== undefined) {
      fields.push('position_y = ?');
      values.push(updates.positionY);
    }
    if (updates.width !== undefined) {
      fields.push('width = ?');
      values.push(updates.width);
    }
    if (updates.height !== undefined) {
      fields.push('height = ?');
      values.push(updates.height);
    }
    if (updates.zIndex !== undefined) {
      fields.push('z_index = ?');
      values.push(updates.zIndex);
    }
    if (updates.opacity !== undefined) {
      fields.push('opacity = ?');
      values.push(updates.opacity);
    }
    if (updates.isVisible !== undefined) {
      fields.push('is_visible = ?');
      values.push(updates.isVisible);
    }
    if (updates.isLocked !== undefined) {
      fields.push('is_locked = ?');
      values.push(updates.isLocked);
    }
    if (updates.properties !== undefined) {
      fields.push('properties = ?');
      values.push(JSON.stringify(updates.properties));
    }
    
    if (fields.length === 0) {
      return res.status(400).json({ error: '没有可更新的字段' });
    }
    
    fields.push('version = version + 1');
    fields.push('updated_at = CURRENT_TIMESTAMP');
    
    values.push(layerId, orderId);
    
    const result = run(
      `UPDATE layers SET ${fields.join(', ')} WHERE id = ? AND order_id = ?`,
      values
    );
    
    if (result.changes === 0) {
      return res.status(404).json({ error: '图层不存在' });
    }
    
    res.json({
      success: true,
      layerId,
      changes: result.changes
    });
  } catch (err) {
    console.error('更新图层错误:', err);
    res.status(500).json({ error: '更新图层失败' });
  }
};

exports.applyTemplate = async (req, res) => {
  try {
    const orderId = req.params.id;
    const { templateId } = req.body;
    const userId = req.user.id;
    
    const order = await OrderService.getOrderById(orderId);
    if (!order) {
      return res.status(404).json({ error: '订单不存在' });
    }
    
    let lock;
    try {
      lock = await InventoryLockEngine.lockTemplate(templateId, userId);
    } catch (lockErr) {
      return res.status(400).json({ error: lockErr.message });
    }
    
    const template = get('SELECT * FROM templates WHERE id = ?', [templateId]);
    
    if (!template) {
      InventoryLockEngine.releaseTemplate(templateId, userId).catch(() => {});
      return res.status(404).json({ error: '模板不存在' });
    }
    
    const otResult = run(
      `INSERT INTO order_templates 
       (order_id, template_id, applied_at, applied_by, status)
       VALUES (?, ?, CURRENT_TIMESTAMP, ?, ?)`,
      [orderId, templateId, userId, 'pending']
    );
    
    const orderTemplateId = otResult.lastInsertRowid;
    
    if (order.status === ORDER_STATUSES.PENDING_EDIT) {
      run(
        `UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [ORDER_STATUSES.PENDING_TEMPLATE, orderId]
      );
      
      run(
        `INSERT INTO operation_logs 
         (order_id, user_id, action, action_detail, from_status, to_status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [orderId, userId, 'apply_template', `应用模板: ${template.template_name}`,
         ORDER_STATUSES.PENDING_EDIT, ORDER_STATUSES.PENDING_TEMPLATE]
      );
      
      run(
        `INSERT INTO timeline 
         (order_id, user_id, action, comment, created_at)
         VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [orderId, userId, '应用模板', `模板: ${template.template_name}`]
      );
    }
    
    res.json({
      orderTemplateId,
      templateId,
      templateName: template.template_name,
      locked: true
    });
  } catch (err) {
    console.error('应用模板错误:', err);
    res.status(500).json({ error: '应用模板失败' });
  }
};

exports.reviewTemplate = (req, res) => {
  try {
    const orderId = req.params.id;
    const { action, comment } = req.body;
    const userId = req.user.id;
    
    const validActions = ['approve', 'reject', 'request_more', 'reassign'];
    
    if (!validActions.includes(action)) {
      return res.status(400).json({ error: '无效的操作类型' });
    }
    
    const order = get('SELECT * FROM orders WHERE id = ?', [orderId]);
    
    if (!order) {
      return res.status(404).json({ error: '订单不存在' });
    }
    
    if (order.status !== ORDER_STATUSES.PENDING_TEMPLATE) {
      return res.status(400).json({ error: '订单不在待套模板状态' });
    }
    
    let newStatus;
    let actionText;
    
    switch (action) {
      case 'approve':
        newStatus = ORDER_STATUSES.PENDING_EXPORT;
        actionText = '审核通过';
        break;
      case 'reject':
        newStatus = ORDER_STATUSES.REJECTED;
        actionText = '审核驳回';
        break;
      case 'request_more':
        newStatus = ORDER_STATUSES.PENDING_EDIT;
        actionText = '要求补充资料';
        break;
      case 'reassign':
        newStatus = ORDER_STATUSES.PENDING_EDIT;
        actionText = '转派重新编辑';
        break;
    }
    
    run(
      `UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [newStatus, orderId]
    );
    
    run(
      `UPDATE order_templates 
       SET status = ?, review_comment = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP
       WHERE order_id = ? AND status = 'pending'`,
      [action === 'approve' ? 'approved' : 'rejected', comment, userId, orderId]
    );
    
    run(
      `INSERT INTO operation_logs 
       (order_id, user_id, action, action_detail, from_status, to_status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [orderId, userId, 'review_template', `${actionText}: ${comment || ''}`,
       ORDER_STATUSES.PENDING_TEMPLATE, newStatus]
    );
    
    run(
      `INSERT INTO timeline 
       (order_id, user_id, action, comment, created_at)
       VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [orderId, userId, '模板审核', `${actionText}${comment ? ': ' + comment : ''}`]
    );
    
    res.json({
      success: true,
      action,
      fromStatus: order.status,
      toStatus: newStatus
    });
  } catch (err) {
    console.error('模板审核错误:', err);
    res.status(500).json({ error: '模板审核失败' });
  }
};

exports.exportImage = (req, res) => {
  try {
    const orderId = req.params.id;
    const { format, width, height } = req.body;
    const userId = req.user.id;
    
    const order = get('SELECT * FROM orders WHERE id = ?', [orderId]);
    
    if (!order) {
      return res.status(404).json({ error: '订单不存在' });
    }
    
    if (order.status !== ORDER_STATUSES.PENDING_EXPORT) {
      return res.status(400).json({ error: '订单不在待导出状态' });
    }
    
    const fileName = `export_${order.order_no}_${Date.now()}.${format || 'png'}`;
    
    const expResult = run(
      `INSERT INTO exports 
       (order_id, export_format, export_width, export_height, file_name, exported_by, exported_at, version)
       VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, 1)`,
      [orderId, format || 'png', width || order.canvas_width, height || order.canvas_height, fileName, userId]
    );
    
    const exportId = expResult.lastInsertRowid;
    
    run(
      `UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [ORDER_STATUSES.PUBLISHED, orderId]
    );
    
    run(
      `INSERT INTO operation_logs 
       (order_id, user_id, action, action_detail, from_status, to_status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [orderId, userId, 'export', `导出格式: ${format || 'png'}`,
       ORDER_STATUSES.PENDING_EXPORT, ORDER_STATUSES.PUBLISHED]
    );
    
    run(
      `INSERT INTO timeline 
       (order_id, user_id, action, comment, created_at)
       VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [orderId, userId, '导出图片', `文件: ${fileName}`]
    );
    
    const locks = all(
      `SELECT * FROM inventory_locks 
       WHERE resource_type = 'template' AND is_active = 1`,
      []
    );
    
    locks.forEach(lock => {
      InventoryLockEngine.releaseTemplate(lock.resource_id, lock.lock_holder_id).catch(() => {});
    });
    
    res.json({
      exportId,
      fileName,
      status: ORDER_STATUSES.PUBLISHED,
      statusName: STATUS_NAMES[ORDER_STATUSES.PUBLISHED]
    });
  } catch (err) {
    console.error('导出错误:', err);
    res.status(500).json({ error: '导出失败' });
  }
};

exports.getTodoCount = async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;
    
    const counts = await OrderService.getTodoCount(userId, role);
    res.json(counts);
  } catch (err) {
    console.error('获取待办数量错误:', err);
    res.status(500).json({ error: '获取待办数量失败' });
  }
};

exports.getStatusInfo = (req, res) => {
  res.json(OrderService.getStatusInfo());
};

exports.getStatistics = (req, res) => {
  const userId = req.user.id;
  const role = req.user.role;
  
  let query = `
    SELECT 
      status,
      COUNT(*) as count
    FROM orders
    WHERE 1=1
  `;
  
  let params = [];
  
  if (role !== 'admin') {
    if (role === 'design_operation') {
      query += ' AND (creator_id = ? OR assignee_id = ?)';
      params.push(userId, userId);
    } else if (role === 'creator') {
      query += ' AND assignee_id = ?';
      params.push(userId);
    } else if (role === 'merchant') {
      query += ' AND creator_id = ?';
      params.push(userId);
    }
  }
  
  query += ' GROUP BY status';
  
  const results = all(query, params);
  
  const stats = {};
  results.forEach(r => {
    stats[r.status] = r.count;
  });
  
  res.json({
    byStatus: stats,
    statusNames: STATUS_NAMES
  });
};
