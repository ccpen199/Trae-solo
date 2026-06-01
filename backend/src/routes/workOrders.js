import express from 'express';
import db from '../models/database.js';

const router = express.Router();

router.get('/', (req, res) => {
  const { status } = req.query;
  let sql = `
    SELECT wo.*, p.code as product_code, p.name as product_name,
           pr.name as current_process_name
    FROM work_orders wo
    JOIN products p ON wo.product_id = p.id
    LEFT JOIN processes pr ON wo.current_process_id = pr.id
    WHERE 1=1
  `;
  const params = [];
  
  if (status) {
    sql += ' AND wo.status = ?';
    params.push(status);
  }
  
  sql += ' ORDER BY wo.created_at DESC';
  const orders = db.prepare(sql).all(...params);
  res.json(orders);
});

router.get('/:id', (req, res) => {
  const order = db.prepare(`
    SELECT wo.*, p.code as product_code, p.name as product_name
    FROM work_orders wo
    JOIN products p ON wo.product_id = p.id
    WHERE wo.id = ?
  `).get(req.params.id);
  
  if (order) {
    const processes = db.prepare(`
      SELECT wop.*, pr.code as process_code, pr.name as process_name,
             pr.equipment, pr.position, s.version as sop_version, s.title as sop_title
      FROM work_order_processes wop
      JOIN processes pr ON wop.process_id = pr.id
      LEFT JOIN sops s ON wop.sop_id = s.id
      WHERE wop.work_order_id = ?
      ORDER BY wop.process_order
    `).all(req.params.id);
    
    order.processes = processes;
    res.json(order);
  } else {
    res.status(404).json({ error: 'Work order not found' });
  }
});

router.post('/', (req, res) => {
  const { order_no, product_id, quantity, process_ids } = req.body;
  
  const result = db.prepare(`
    INSERT INTO work_orders (order_no, product_id, quantity, status, current_process_id)
    VALUES (?, ?, ?, 'pending', ?)
  `).run(order_no, product_id, quantity, process_ids[0]);
  
  const orderId = result.lastInsertRowid;
  
  if (process_ids && process_ids.length > 0) {
    const insertProcess = db.prepare(`
      INSERT INTO work_order_processes (work_order_id, process_id, process_order, status)
      VALUES (?, ?, ?, 'pending')
    `);
    
    process_ids.forEach((processId, index) => {
      insertProcess.run(orderId, processId, index + 1);
    });
  }
  
  res.json({ id: orderId, message: 'Work order created successfully' });
});

router.post('/:id/start', (req, res) => {
  const { process_id, operator_id } = req.body;
  const orderId = req.params.id;
  
  db.prepare(`
    UPDATE work_orders SET status = 'in_progress', updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(orderId);
  
  db.prepare(`
    UPDATE work_order_processes 
    SET status = 'in_progress', operator_id = ?, started_at = CURRENT_TIMESTAMP
    WHERE work_order_id = ? AND process_id = ?
  `).run(operator_id, orderId, process_id);
  
  const today = new Date().toISOString().split('T')[0];
  const order = db.prepare('SELECT product_id FROM work_orders WHERE id = ?').get(orderId);
  
  const activeSop = db.prepare(`
    SELECT id FROM sops
    WHERE product_id = ? AND process_id = ?
      AND status = 'approved'
      AND (effective_date IS NULL OR effective_date <= ?)
      AND (expiry_date IS NULL OR expiry_date > ?)
    ORDER BY created_at DESC
    LIMIT 1
  `).get(order.product_id, process_id, today, today);
  
  if (activeSop) {
    db.prepare(`
      UPDATE work_order_processes SET sop_id = ?
      WHERE work_order_id = ? AND process_id = ?
    `).run(activeSop.id, orderId, process_id);
  }
  
  res.json({ message: 'Process started' });
});

router.post('/:id/complete', (req, res) => {
  const { process_id, next_process_id } = req.body;
  const orderId = req.params.id;
  
  db.prepare(`
    UPDATE work_order_processes 
    SET status = 'completed', completed_at = CURRENT_TIMESTAMP
    WHERE work_order_id = ? AND process_id = ?
  `).run(orderId, process_id);
  
  if (next_process_id) {
    db.prepare(`
      UPDATE work_orders SET current_process_id = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(next_process_id, orderId);
  } else {
    db.prepare(`
      UPDATE work_orders SET status = 'completed', current_process_id = NULL, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(orderId);
  }
  
  res.json({ message: 'Process completed' });
});

router.post('/:process_id/step-execute', (req, res) => {
  const { sop_step_id, operator_id, key_params_value, exception_note, is_skipped, skip_reason } = req.body;
  
  const step = db.prepare('SELECT is_mandatory FROM sop_steps WHERE id = ?').get(sop_step_id);
  
  if (step && step.is_mandatory && is_skipped) {
    return res.status(400).json({ error: '关键步骤不允许跳步' });
  }
  
  db.prepare(`
    INSERT INTO execution_records (work_order_process_id, sop_step_id, operator_id, key_params_value, exception_note, is_skipped, skip_reason)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(req.params.process_id, sop_step_id, operator_id, key_params_value, exception_note, is_skipped ? 1 : 0, skip_reason);
  
  res.json({ message: 'Execution recorded' });
});

router.get('/:process_id/execution-records', (req, res) => {
  const records = db.prepare(`
    SELECT er.*, u.name as operator_name, ss.title as step_title, ss.step_order
    FROM execution_records er
    JOIN users u ON er.operator_id = u.id
    JOIN sop_steps ss ON er.sop_step_id = ss.id
    WHERE er.work_order_process_id = ?
    ORDER BY er.executed_at, ss.step_order
  `).all(req.params.process_id);
  
  res.json(records);
});

router.get('/:id/notifications', (req, res) => {
  const order = db.prepare('SELECT product_id FROM work_orders WHERE id = ?').get(req.params.id);
  
  if (!order) {
    return res.status(404).json({ error: 'Work order not found' });
  }
  
  const notifications = db.prepare(`
    SELECT cn.*, s.title as sop_title, s.version as sop_version
    FROM change_notifications cn
    JOIN sops s ON cn.sop_id = s.id
    WHERE s.product_id = ?
    ORDER BY cn.created_at DESC
  `).all(order.product_id);
  
  res.json(notifications);
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM work_orders WHERE id = ?').run(req.params.id);
  res.json({ message: 'Work order deleted successfully' });
});

export default router;
