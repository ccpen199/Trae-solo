const express = require('express');
const { db } = require('../database');
const { authMiddleware, checkPermission } = require('../middleware/auth');

const router = express.Router();

router.get('/distribution-centers', authMiddleware, (req, res) => {
  let query = `
    SELECT dc.*, b.name as branch_name
    FROM distribution_centers dc
    JOIN branches b ON dc.branch_id = b.id
  `;
  const params = [];

  if (!req.user.isHeadquarters) {
    query += ` WHERE dc.branch_id = ?`;
    params.push(req.user.branchId);
  }

  query += ` ORDER BY dc.id`;

  const centers = db.prepare(query).all(...params);
  res.json({ distributionCenters: centers });
});

router.get('/warehouses', authMiddleware, (req, res) => {
  const { distributionCenterId } = req.query;

  let query = `
    SELECT w.*, dc.name as dc_name, b.name as branch_name
    FROM warehouses w
    JOIN distribution_centers dc ON w.distribution_center_id = dc.id
    JOIN branches b ON w.branch_id = b.id
  `;
  const params = [];
  const conditions = [];

  if (!req.user.isHeadquarters) {
    conditions.push('w.branch_id = ?');
    params.push(req.user.branchId);
  }

  if (distributionCenterId) {
    conditions.push('w.distribution_center_id = ?');
    params.push(parseInt(distributionCenterId));
  }

  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(' AND ')}`;
  }

  query += ` ORDER BY w.id`;

  const warehouses = db.prepare(query).all(...params);
  res.json({ warehouses });
});

router.get('/scheduling-configs', authMiddleware, checkPermission(['admin', 'scheduler']), (req, res) => {
  let query = `
    SELECT sc.*, 
           dc.name as dc_name, dc.code as dc_code,
           w.name as warehouse_name, w.code as warehouse_code,
           b.name as branch_name
    FROM scheduling_configs sc
    JOIN distribution_centers dc ON sc.distribution_center_id = dc.id
    JOIN warehouses w ON sc.warehouse_id = w.id
    JOIN branches b ON dc.branch_id = b.id
  `;
  const params = [];

  if (!req.user.isHeadquarters) {
    query += ` WHERE dc.branch_id = ?`;
    params.push(req.user.branchId);
  }

  query += ` ORDER BY sc.id DESC`;

  const configs = db.prepare(query).all(...params);
  res.json({ configs });
});

router.post('/scheduling-configs', authMiddleware, checkPermission(['admin']), (req, res) => {
  const {
    distributionCenterId,
    warehouseId,
    orderType,
    minItems,
    maxItems,
    minVolume,
    maxVolume,
    minWeight,
    maxWeight
  } = req.body;

  if (!distributionCenterId || !warehouseId || !orderType) {
    return res.status(400).json({ error: '配送中心、库房和订单类型为必填项' });
  }

  const dc = db.prepare(`
    SELECT * FROM distribution_centers WHERE id = ?
  `).get(distributionCenterId);

  if (!dc) {
    return res.status(400).json({ error: '配送中心不存在' });
  }

  if (!req.user.isHeadquarters && dc.branch_id !== req.user.branchId) {
    return res.status(403).json({ error: '只能为本分公司创建配置' });
  }

  const warehouse = db.prepare(`
    SELECT * FROM warehouses WHERE id = ? AND distribution_center_id = ?
  `).get(warehouseId, distributionCenterId);

  if (!warehouse) {
    return res.status(400).json({ error: '库房不存在或不属于该配送中心' });
  }

  const existingConfig = db.prepare(`
    SELECT id FROM scheduling_configs 
    WHERE distribution_center_id = ? AND warehouse_id = ? AND order_type = ?
  `).get(distributionCenterId, warehouseId, orderType);

  if (existingConfig) {
    return res.status(400).json({ error: '该配送中心+库房+订单类型的配置已存在' });
  }

  const result = db.prepare(`
    INSERT INTO scheduling_configs (
      distribution_center_id, warehouse_id, order_type,
      min_items, max_items, min_volume, max_volume,
      min_weight, max_weight, status, created_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
  `).run(
    distributionCenterId, warehouseId, orderType,
    minItems || 1, maxItems, minVolume, maxVolume,
    minWeight, maxWeight, req.user.id
  );

  res.json({ id: result.lastInsertRowid, message: '配置创建成功' });
});

router.put('/scheduling-configs/:id', authMiddleware, checkPermission(['admin']), (req, res) => {
  const configId = parseInt(req.params.id);
  const {
    minItems,
    maxItems,
    minVolume,
    maxVolume,
    minWeight,
    maxWeight,
    status
  } = req.body;

  const existingConfig = db.prepare(`
    SELECT sc.*, dc.branch_id
    FROM scheduling_configs sc
    JOIN distribution_centers dc ON sc.distribution_center_id = dc.id
    WHERE sc.id = ?
  `).get(configId);

  if (!existingConfig) {
    return res.status(404).json({ error: '配置不存在' });
  }

  if (!req.user.isHeadquarters && existingConfig.branch_id !== req.user.branchId) {
    return res.status(403).json({ error: '只能修改本分公司的配置' });
  }

  const updates = [];
  const values = [];

  if (minItems !== undefined) {
    updates.push('min_items = ?');
    values.push(minItems);
  }
  if (maxItems !== undefined) {
    updates.push('max_items = ?');
    values.push(maxItems);
  }
  if (minVolume !== undefined) {
    updates.push('min_volume = ?');
    values.push(minVolume);
  }
  if (maxVolume !== undefined) {
    updates.push('max_volume = ?');
    values.push(maxVolume);
  }
  if (minWeight !== undefined) {
    updates.push('min_weight = ?');
    values.push(minWeight);
  }
  if (maxWeight !== undefined) {
    updates.push('max_weight = ?');
    values.push(maxWeight);
  }
  if (status !== undefined) {
    updates.push('status = ?');
    values.push(status);
  }

  if (updates.length === 0) {
    return res.json({ message: '未提供要更新的字段' });
  }

  updates.push('updated_at = datetime("now")');
  values.push(configId);

  db.prepare(`
    UPDATE scheduling_configs SET ${updates.join(', ')} WHERE id = ?
  `).run(...values);

  res.json({ message: '配置更新成功' });
});

router.post('/scheduling-configs/batch-toggle', authMiddleware, checkPermission(['admin']), (req, res) => {
  const { ids, status } = req.body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: '请提供配置ID列表' });
  }

  if (status === undefined) {
    return res.status(400).json({ error: '请提供状态值' });
  }

  const placeholders = ids.map(() => '?').join(',');
  let query = `
    UPDATE scheduling_configs 
    SET status = ?, updated_at = datetime("now")
    WHERE id IN (${placeholders})
  `;

  if (!req.user.isHeadquarters) {
    query += ` AND distribution_center_id IN (
      SELECT id FROM distribution_centers WHERE branch_id = ?
    )`;
    const result = db.prepare(query).run(status, ...ids, req.user.branchId);
    return res.json({ updated: result.changes, message: '批量更新成功' });
  }

  const result = db.prepare(query).run(status, ...ids);
  res.json({ updated: result.changes, message: '批量更新成功' });
});

module.exports = router;
