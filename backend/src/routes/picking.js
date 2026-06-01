const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/pickers', (req, res) => {
  const pickers = db.prepare('SELECT * FROM pickers ORDER BY name').all();
  res.json(pickers);
});

router.get('/', (req, res) => {
  const { status, picker_id } = req.query;
  let query = `
    SELECT pt.*, o.order_no, o.customer_name, o.address, o.time_slot, o.priority,
           p.name as picker_name
    FROM pick_tasks pt
    JOIN orders o ON pt.order_id = o.id
    LEFT JOIN pickers p ON pt.picker_id = p.id
    WHERE 1=1
  `;
  const params = [];
  
  if (status) {
    query += ' AND pt.status = ?';
    params.push(status);
  }
  if (picker_id) {
    query += ' AND pt.picker_id = ?';
    params.push(picker_id);
  }
  
  query += ' ORDER BY o.priority DESC, pt.created_at ASC';
  const tasks = db.prepare(query).all(...params);
  res.json(tasks);
});

router.get('/:id', (req, res) => {
  const task = db.prepare(`
    SELECT pt.*, o.order_no, o.customer_name, o.address, o.time_slot,
           p.name as picker_name
    FROM pick_tasks pt
    JOIN orders o ON pt.order_id = o.id
    LEFT JOIN pickers p ON pt.picker_id = p.id
    WHERE pt.id = ?
  `).get(req.params.id);
  
  if (!task) {
    return res.status(404).json({ error: 'Pick task not found' });
  }
  
  const items = db.prepare(`
    SELECT pti.*, oi.quantity, oi.unit_price,
           s.sku_code, s.name, s.is_weighed, s.unit,
           i.batch_no, i.location, i.expiry_date
    FROM pick_task_items pti
    JOIN order_items oi ON pti.order_item_id = oi.id
    JOIN skus s ON oi.sku_id = s.id
    LEFT JOIN inventory i ON pti.inventory_id = i.id
    WHERE pti.pick_task_id = ?
  `).all(req.params.id);
  
  res.json({ task, items });
});

router.post('/assign', (req, res) => {
  const { order_ids, picker_id } = req.body;
  
  const createTask = db.prepare(`
    INSERT INTO pick_tasks (order_id, picker_id, status)
    VALUES (?, ?, 'assigned')
  `);
  
  for (const orderId of order_ids) {
    const taskResult = createTask.run(orderId, picker_id);
    const taskId = taskResult.lastInsertRowid;
    
    const orderItems = db.prepare('SELECT id FROM order_items WHERE order_id = ?').all(orderId);
    
    const createTaskItem = db.prepare(`
      INSERT INTO pick_task_items (pick_task_id, order_item_id, status)
      VALUES (?, ?, 'pending')
    `);
    
    for (const item of orderItems) {
      createTaskItem.run(taskId, item.id);
    }
    
    db.prepare('UPDATE orders SET status = ? WHERE id = ?').run('picking', orderId);
  }
  
  res.json({ success: true });
});

router.post('/:id/start', (req, res) => {
  db.prepare(`
    UPDATE pick_tasks 
    SET status = 'in_progress', started_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(req.params.id);
  
  res.json({ success: true });
});

router.post('/:id/pick-item', (req, res) => {
  const { task_item_id, inventory_id, picked_quantity, picked_weight, photo_url } = req.body;
  
  const inventory = db.prepare('SELECT * FROM inventory WHERE id = ?').get(inventory_id);
  if (!inventory || inventory.quality_level !== 'normal') {
    return res.status(400).json({ error: 'Invalid inventory' });
  }
  
  const today = new Date().toISOString().split('T')[0];
  if (inventory.expiry_date && inventory.expiry_date < today) {
    return res.status(400).json({ error: 'Inventory expired' });
  }
  
  db.prepare(`
    UPDATE pick_task_items 
    SET inventory_id = ?, picked_quantity = ?, picked_weight = ?, photo_url = ?, status = 'picked'
    WHERE id = ?
  `).run(inventory_id, picked_quantity, picked_weight || null, photo_url || null, task_item_id);
  
  const actualQty = picked_weight || picked_quantity;
  db.prepare(`
    UPDATE inventory 
    SET quantity = quantity - ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(actualQty, inventory_id);
  
  const orderItem = db.prepare('SELECT order_item_id FROM pick_task_items WHERE id = ?').get(task_item_id);
  db.prepare(`
    UPDATE order_items 
    SET actual_quantity = ?, actual_weight = ?, status = 'picked'
    WHERE id = ?
  `).run(picked_quantity, picked_weight || null, orderItem.order_item_id);
  
  db.prepare(`
    INSERT INTO inventory_logs 
    (inventory_id, sku_id, batch_no, change_type, quantity_change, notes)
    VALUES (?, ?, ?, 'pick', -?, ?)
  `).run(inventory_id, inventory.sku_id, inventory.batch_no, actualQty, 'Picking');
  
  res.json({ success: true });
});

router.post('/:id/complete', (req, res) => {
  db.prepare(`
    UPDATE pick_tasks 
    SET status = 'completed', completed_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(req.params.id);
  
  const task = db.prepare('SELECT order_id FROM pick_tasks WHERE id = ?').get(req.params.id);
  db.prepare('UPDATE orders SET status = ? WHERE id = ?').run('picked', task.order_id);
  
  res.json({ success: true });
});

module.exports = router;
