const express = require('express');
const { db } = require('./database');
const kittingService = require('./kittingService');

const router = express.Router();

router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

router.get('/materials', (req, res) => {
  const materials = db.prepare('SELECT * FROM materials ORDER BY code').all();
  res.json(materials);
});

router.post('/materials', (req, res) => {
  const { code, name, spec, unit, category, safety_stock } = req.body;
  const result = db.prepare(`
    INSERT INTO materials (code, name, spec, unit, category, safety_stock)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(code, name, spec, unit || '个', category, safety_stock || 0);
  res.json({ id: result.lastInsertRowid, ...req.body });
});

router.get('/products', (req, res) => {
  const products = db.prepare('SELECT * FROM products ORDER BY code').all();
  res.json(products);
});

router.post('/products', (req, res) => {
  const { code, name, spec } = req.body;
  const result = db.prepare(`
    INSERT INTO products (code, name, spec) VALUES (?, ?, ?)
  `).run(code, name, spec);
  res.json({ id: result.lastInsertRowid, ...req.body });
});

router.get('/boms', (req, res) => {
  const boms = db.prepare(`
    SELECT b.*, p.code as product_code, p.name as product_name
    FROM boms b
    JOIN products p ON b.product_id = p.id
    ORDER BY b.created_at DESC
  `).all();
  res.json(boms);
});

router.get('/boms/:id', (req, res) => {
  const bom = db.prepare(`
    SELECT b.*, p.code as product_code, p.name as product_name
    FROM boms b
    JOIN products p ON b.product_id = p.id
    WHERE b.id = ?
  `).get(req.params.id);

  if (!bom) {
    return res.status(404).json({ error: 'BOM不存在' });
  }

  const items = db.prepare(`
    SELECT bi.*, m.code as material_code, m.name as material_name, m.unit as material_unit
    FROM bom_items bi
    JOIN materials m ON bi.material_id = m.id
    WHERE bi.bom_id = ?
  `).all(req.params.id);

  res.json({ ...bom, items });
});

router.post('/boms', (req, res) => {
  const { product_id, version, items, created_by } = req.body;
  
  const bomResult = db.prepare(`
    INSERT INTO boms (product_id, version, created_by)
    VALUES (?, ?, ?)
  `).run(product_id, version || 'V1.0', created_by);

  const bomId = bomResult.lastInsertRowid;
  const insertItem = db.prepare(`
    INSERT INTO bom_items (bom_id, material_id, quantity, process, remark)
    VALUES (?, ?, ?, ?, ?)
  `);

  for (const item of items) {
    insertItem.run(bomId, item.material_id, item.quantity, item.process, item.remark);
  }

  res.json({ id: bomId, message: 'BOM创建成功' });
});

router.get('/inventory', (req, res) => {
  const inventory = db.prepare(`
    SELECT i.*, m.code as material_code, m.name as material_name, m.unit as material_unit,
           w.code as warehouse_code, w.name as warehouse_name
    FROM inventory i
    JOIN materials m ON i.material_id = m.id
    JOIN warehouses w ON i.warehouse_id = w.id
    ORDER BY m.code
  `).all();
  res.json(inventory);
});

router.post('/inventory/stock-in', (req, res) => {
  const { material_id, warehouse_id, location, quantity, batch_no, operator, remark } = req.body;
  
  const existing = db.prepare(`
    SELECT id, quantity FROM inventory 
    WHERE material_id = ? AND warehouse_id = ? AND location = ? AND batch_no = ?
  `).get(material_id, warehouse_id, location || '', batch_no || '');

  let newBalance;
  let invId;

  if (existing) {
    newBalance = existing.quantity + quantity;
    db.prepare(`
      UPDATE inventory SET quantity = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(newBalance, existing.id);
    invId = existing.id;
  } else {
    newBalance = quantity;
    const result = db.prepare(`
      INSERT INTO inventory (material_id, warehouse_id, location, quantity, batch_no)
      VALUES (?, ?, ?, ?, ?)
    `).run(material_id, warehouse_id, location || '', quantity, batch_no || '');
    invId = result.lastInsertRowid;
  }

  db.prepare(`
    INSERT INTO inventory_transactions (
      material_id, warehouse_id, location, batch_no, trans_type, quantity, 
      balance, ref_no, operator, remark
    ) VALUES (?, ?, ?, ?, 'stock_in', ?, ?, NULL, ?, ?)
  `).run(material_id, warehouse_id, location || '', batch_no || '', quantity, newBalance, operator || 'system', remark || '');

  res.json({ id: invId, message: '入库成功' });
});

router.post('/inventory/stock-out', (req, res) => {
  const { material_id, warehouse_id, location, quantity, batch_no, operator, remark } = req.body;
  
  const existing = db.prepare(`
    SELECT id, quantity FROM inventory 
    WHERE material_id = ? AND warehouse_id = ? AND location = ? AND batch_no = ?
  `).get(material_id, warehouse_id, location || '', batch_no || '');

  if (!existing || existing.quantity < quantity) {
    return res.status(400).json({ error: '库存不足' });
  }

  const newBalance = existing.quantity - quantity;
  db.prepare(`
    UPDATE inventory SET quantity = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(newBalance, existing.id);

  db.prepare(`
    INSERT INTO inventory_transactions (
      material_id, warehouse_id, location, batch_no, trans_type, quantity, 
      balance, ref_no, operator, remark
    ) VALUES (?, ?, ?, ?, 'stock_out', ?, ?, NULL, ?, ?)
  `).run(material_id, warehouse_id, location || '', batch_no || '', quantity, newBalance, operator || 'system', remark || '');

  res.json({ id: existing.id, message: '出库成功' });
});

router.post('/inventory/adjust', (req, res) => {
  const { material_id, warehouse_id, location, quantity, batch_no, operator, reason } = req.body;
  
  const existing = db.prepare(`
    SELECT id, quantity FROM inventory 
    WHERE material_id = ? AND warehouse_id = ? AND location = ? AND batch_no = ?
  `).get(material_id, warehouse_id, location || '', batch_no || '');

  if (!existing) {
    return res.status(400).json({ error: '库存记录不存在' });
  }

  const adjustQty = quantity - existing.quantity;
  const transType = adjustQty >= 0 ? 'stock_plus' : 'stock_minus';

  db.prepare(`
    UPDATE inventory SET quantity = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(quantity, existing.id);

  db.prepare(`
    INSERT INTO inventory_transactions (
      material_id, warehouse_id, location, batch_no, trans_type, quantity, 
      balance, ref_no, operator, remark
    ) VALUES (?, ?, ?, ?, ?, ?, ?, NULL, ?, ?)
  `).run(material_id, warehouse_id, location || '', batch_no || '', transType, Math.abs(adjustQty), quantity, operator || 'system', reason || '');

  res.json({ id: existing.id, message: '库存调整成功' });
});

router.get('/inventory/transactions', (req, res) => {
  const { material_id, warehouse_id, trans_type } = req.query;
  
  let where = 'WHERE 1=1';
  const params = [];
  
  if (material_id) {
    where += ' AND it.material_id = ?';
    params.push(material_id);
  }
  if (warehouse_id) {
    where += ' AND it.warehouse_id = ?';
    params.push(warehouse_id);
  }
  if (trans_type) {
    where += ' AND it.trans_type = ?';
    params.push(trans_type);
  }

  const transactions = db.prepare(`
    SELECT it.*, m.code as material_code, m.name as material_name, m.unit as material_unit,
           w.code as warehouse_code, w.name as warehouse_name
    FROM inventory_transactions it
    JOIN materials m ON it.material_id = m.id
    JOIN warehouses w ON it.warehouse_id = w.id
    ${where}
    ORDER BY it.created_at DESC
    LIMIT 100
  `).all(...params);

  res.json(transactions);
});

router.get('/in-transit', (req, res) => {
  const inTransit = db.prepare(`
    SELECT it.*, m.code as material_code, m.name as material_name
    FROM in_transit it
    JOIN materials m ON it.material_id = m.id
    ORDER BY it.expected_arrival
  `).all();
  res.json(inTransit);
});

router.post('/in-transit', (req, res) => {
  const { material_id, quantity, po_no, expected_arrival, supplier } = req.body;
  const result = db.prepare(`
    INSERT INTO in_transit (material_id, quantity, po_no, expected_arrival, supplier)
    VALUES (?, ?, ?, ?, ?)
  `).run(material_id, quantity, po_no, expected_arrival, supplier);
  res.json({ id: result.lastInsertRowid, message: '在途物料创建成功' });
});

router.post('/in-transit/:id/receive', (req, res) => {
  const { warehouse_id, location, batch_no, operator } = req.body;
  
  const inTransit = db.prepare('SELECT * FROM in_transit WHERE id = ?').get(req.params.id);
  if (!inTransit) {
    return res.status(404).json({ error: '在途记录不存在' });
  }
  if (inTransit.status !== 'shipping') {
    return res.status(400).json({ error: '该物料已入库或已取消' });
  }

  const existing = db.prepare(`
    SELECT id, quantity FROM inventory 
    WHERE material_id = ? AND warehouse_id = ? AND location = ? AND batch_no = ?
  `).get(inTransit.material_id, warehouse_id, location || '', batch_no || '');

  let newBalance;
  if (existing) {
    newBalance = existing.quantity + inTransit.quantity;
    db.prepare(`
      UPDATE inventory SET quantity = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(newBalance, existing.id);
  } else {
    newBalance = inTransit.quantity;
    db.prepare(`
      INSERT INTO inventory (material_id, warehouse_id, location, quantity, batch_no)
      VALUES (?, ?, ?, ?, ?)
    `).run(inTransit.material_id, warehouse_id, location || '', inTransit.quantity, batch_no || '');
  }

  db.prepare("UPDATE in_transit SET status = 'received' WHERE id = ?").run(req.params.id);

  db.prepare(`
    INSERT INTO inventory_transactions (
      material_id, warehouse_id, location, batch_no, trans_type, quantity, 
      balance, ref_no, operator, remark
    ) VALUES (?, ?, ?, ?, 'receive', ?, ?, ?, ?, '采购到货')
  `).run(inTransit.material_id, warehouse_id, location || '', batch_no || '', inTransit.quantity, newBalance, inTransit.po_no, operator || 'system');

  res.json({ message: '到货入库成功' });
});

router.get('/substitutes', (req, res) => {
  const substitutes = db.prepare(`
    SELECT sr.*, 
           m1.code as original_code, m1.name as original_name,
           m2.code as substitute_code, m2.name as substitute_name
    FROM substitute_rules sr
    JOIN materials m1 ON sr.original_material_id = m1.id
    JOIN materials m2 ON sr.substitute_material_id = m2.id
    ORDER BY sr.created_at DESC
  `).all();
  res.json(substitutes);
});

router.post('/substitutes', (req, res) => {
  const { original_material_id, substitute_material_id, priority, approval_required, valid_from, valid_to, remark } = req.body;
  const result = db.prepare(`
    INSERT INTO substitute_rules (original_material_id, substitute_material_id, priority, approval_required, valid_from, valid_to, remark)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(original_material_id, substitute_material_id, priority || 1, approval_required ? 1 : 0, valid_from, valid_to, remark);
  res.json({ id: result.lastInsertRowid, message: '替代料规则创建成功' });
});

router.post('/substitutes/:id/approve', (req, res) => {
  const { approved_by } = req.body;
  db.prepare(`
    UPDATE substitute_rules SET approved = 1, approved_by = ?, approved_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(approved_by, req.params.id);
  res.json({ message: '替代料审批通过' });
});

router.get('/work-orders', (req, res) => {
  const workOrders = db.prepare(`
    SELECT wo.*, p.code as product_code, p.name as product_name
    FROM work_orders wo
    JOIN products p ON wo.product_id = p.id
    ORDER BY wo.created_at DESC
  `).all();
  res.json(workOrders);
});

router.get('/work-orders/:id', (req, res) => {
  const workOrder = db.prepare(`
    SELECT wo.*, p.code as product_code, p.name as product_name,
           b.version as bom_version
    FROM work_orders wo
    JOIN products p ON wo.product_id = p.id
    LEFT JOIN boms b ON wo.bom_id = b.id
    WHERE wo.id = ?
  `).get(req.params.id);

  if (!workOrder) {
    return res.status(404).json({ error: '工单不存在' });
  }

  res.json(workOrder);
});

router.post('/work-orders', (req, res) => {
  const { wo_no, product_id, bom_id, quantity, production_line, planned_start_date, planned_end_date, created_by } = req.body;
  const result = db.prepare(`
    INSERT INTO work_orders (wo_no, product_id, bom_id, quantity, production_line, planned_start_date, planned_end_date, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(wo_no, product_id, bom_id, quantity, production_line, planned_start_date, planned_end_date, created_by);
  res.json({ id: result.lastInsertRowid, message: '工单创建成功' });
});

router.post('/work-orders/:id/kitting-check', (req, res) => {
  try {
    const result = kittingService.calculateWorkOrderKitting(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/work-orders/:id/kitting', (req, res) => {
  const kittingItems = db.prepare(`
    SELECT wok.*, m.code as material_code, m.name as material_name, m.unit as material_unit,
           s.substitute_code, s.substitute_name
    FROM work_order_kitting wok
    JOIN materials m ON wok.material_id = m.id
    LEFT JOIN (
      SELECT sr.original_material_id, m.code as substitute_code, m.name as substitute_name
      FROM substitute_rules sr
      JOIN materials m ON sr.substitute_material_id = m.id
      WHERE sr.approved = 1
    ) s ON wok.material_id = s.original_material_id
    WHERE wok.work_order_id = ?
  `).all(req.params.id);

  res.json(kittingItems);
});

router.get('/kitting-board', (req, res) => {
  const result = kittingService.getKittingBoard(req.query);
  res.json(result);
});

router.get('/warehouses', (req, res) => {
  const warehouses = db.prepare('SELECT * FROM warehouses').all();
  res.json(warehouses);
});

router.post('/material-issues', (req, res) => {
  const { work_order_id, material_id, warehouse_id, quantity, batch_no, location, operator, issue_type, remark } = req.body;
  
  const issueNo = `ISS-${Date.now()}`;
  
  db.prepare(`
    INSERT INTO material_issues (issue_no, work_order_id, material_id, warehouse_id, quantity, batch_no, location, operator, issue_type, remark)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(issueNo, work_order_id, material_id, warehouse_id, quantity, batch_no || '', location || '', operator, issue_type || 'normal', remark);

  const inventory = db.prepare(`
    SELECT id, quantity FROM inventory 
    WHERE material_id = ? AND warehouse_id = ? AND (batch_no = ? OR batch_no = '')
    ORDER BY quantity DESC LIMIT 1
  `).get(material_id, warehouse_id, batch_no || '');

  if (inventory) {
    db.prepare(`
      UPDATE inventory SET quantity = quantity - ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(quantity, inventory.id);
  }

  res.json({ issue_no: issueNo, message: '领料成功' });
});

router.post('/material-returns', (req, res) => {
  const { work_order_id, material_id, warehouse_id, quantity, batch_no, location, operator, return_type, reason, remark } = req.body;
  
  const returnNo = `RET-${Date.now()}`;
  
  db.prepare(`
    INSERT INTO material_returns (return_no, work_order_id, material_id, warehouse_id, quantity, batch_no, location, operator, return_type, reason, remark)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(returnNo, work_order_id, material_id, warehouse_id, quantity, batch_no || '', location || '', operator, return_type || 'normal', reason, remark);

  const inventory = db.prepare(`
    SELECT id FROM inventory 
    WHERE material_id = ? AND warehouse_id = ? AND location = ? AND batch_no = ?
  `).get(material_id, warehouse_id, location || '', batch_no || '');

  if (inventory) {
    db.prepare(`
      UPDATE inventory SET quantity = quantity + ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(quantity, inventory.id);
  } else {
    db.prepare(`
      INSERT INTO inventory (material_id, warehouse_id, location, quantity, batch_no)
      VALUES (?, ?, ?, ?, ?)
    `).run(material_id, warehouse_id, location || '', quantity, batch_no || '');
  }

  res.json({ return_no: returnNo, message: '退料成功' });
});

router.get('/kitting-logs/:workOrderId', (req, res) => {
  const logs = db.prepare(`
    SELECT * FROM kitting_logs WHERE work_order_id = ? ORDER BY created_at DESC
  `).all(req.params.workOrderId);
  res.json(logs);
});

module.exports = router;
