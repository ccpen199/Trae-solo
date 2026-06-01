import express from 'express';
import db from '../models/database.js';

const router = express.Router();

router.get('/', (req, res) => {
  const { product_id, process_id, status } = req.query;
  let sql = `
    SELECT s.*, p.code as product_code, p.name as product_name,
           pr.code as process_code, pr.name as process_name,
           pr.equipment, pr.position,
           u.name as creator_name
    FROM sops s
    JOIN products p ON s.product_id = p.id
    JOIN processes pr ON s.process_id = pr.id
    JOIN users u ON s.created_by = u.id
    WHERE 1=1
  `;
  const params = [];
  
  if (product_id) {
    sql += ' AND s.product_id = ?';
    params.push(product_id);
  }
  if (process_id) {
    sql += ' AND s.process_id = ?';
    params.push(process_id);
  }
  if (status) {
    sql += ' AND s.status = ?';
    params.push(status);
  }
  
  sql += ' ORDER BY s.created_at DESC';
  const sops = db.prepare(sql).all(...params);
  res.json(sops);
});

router.get('/active', (req, res) => {
  const { product_id, process_id } = req.query;
  const today = new Date().toISOString().split('T')[0];
  
  const sop = db.prepare(`
    SELECT s.*, p.code as product_code, p.name as product_name,
           pr.code as process_code, pr.name as process_name
    FROM sops s
    JOIN products p ON s.product_id = p.id
    JOIN processes pr ON s.process_id = pr.id
    WHERE s.product_id = ? AND s.process_id = ?
      AND s.status = 'approved'
      AND (s.effective_date IS NULL OR s.effective_date <= ?)
      AND (s.expiry_date IS NULL OR s.expiry_date > ?)
    ORDER BY s.created_at DESC
    LIMIT 1
  `).get(product_id, process_id, today, today);
  
  if (sop) {
    const steps = db.prepare(`
      SELECT * FROM sop_steps WHERE sop_id = ? ORDER BY step_order
    `).all(sop.id);
    res.json({ ...sop, steps });
  } else {
    res.json(null);
  }
});

router.get('/:id', (req, res) => {
  const sop = db.prepare(`
    SELECT s.*, p.code as product_code, p.name as product_name,
           pr.code as process_code, pr.name as process_name,
           pr.equipment, pr.position
    FROM sops s
    JOIN products p ON s.product_id = p.id
    JOIN processes pr ON s.process_id = pr.id
    WHERE s.id = ?
  `).get(req.params.id);
  
  if (sop) {
    const steps = db.prepare(`
      SELECT * FROM sop_steps WHERE sop_id = ? ORDER BY step_order
    `).all(sop.id);
    res.json({ ...sop, steps });
  } else {
    res.status(404).json({ error: 'SOP not found' });
  }
});

router.post('/', (req, res) => {
  const { product_id, process_id, version, title, steps, created_by } = req.body;
  
  const result = db.prepare(`
    INSERT INTO sops (product_id, process_id, version, title, created_by)
    VALUES (?, ?, ?, ?, ?)
  `).run(product_id, process_id, version, title, created_by);
  
  const sopId = result.lastInsertRowid;
  
  if (steps && steps.length > 0) {
    const insertStep = db.prepare(`
      INSERT INTO sop_steps (sop_id, step_order, title, description, image_url, 
                             video_url, attention, quality_standard, key_params, is_mandatory)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    steps.forEach((step, index) => {
      insertStep.run(sopId, index + 1, step.title, step.description, step.image_url,
                     step.video_url, step.attention, step.quality_standard, step.key_params, step.is_mandatory ? 1 : 0);
    });
  }
  
  res.json({ id: sopId, message: 'SOP created successfully' });
});

router.put('/:id', (req, res) => {
  const { product_id, process_id, version, title, steps } = req.body;
  
  db.prepare(`
    UPDATE sops 
    SET product_id = ?, process_id = ?, version = ?, title = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(product_id, process_id, version, title, req.params.id);
  
  db.prepare('DELETE FROM sop_steps WHERE sop_id = ?').run(req.params.id);
  
  if (steps && steps.length > 0) {
    const insertStep = db.prepare(`
      INSERT INTO sop_steps (sop_id, step_order, title, description, image_url, 
                             video_url, attention, quality_standard, key_params, is_mandatory)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    steps.forEach((step, index) => {
      insertStep.run(req.params.id, index + 1, step.title, step.description, step.image_url,
                     step.video_url, step.attention, step.quality_standard, step.key_params, step.is_mandatory ? 1 : 0);
    });
  }
  
  res.json({ message: 'SOP updated successfully' });
});

router.post('/:id/submit', (req, res) => {
  db.prepare(`
    UPDATE sops SET status = 'pending_review', updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(req.params.id);
  res.json({ message: 'SOP submitted for review' });
});

router.post('/:id/approve', (req, res) => {
  const { reviewer_id, effective_date, expiry_date } = req.body;
  
  const sop = db.prepare('SELECT * FROM sops WHERE id = ?').get(req.params.id);
  
  db.prepare(`
    UPDATE sops 
    SET status = 'approved', reviewer_id = ?, reviewed_at = CURRENT_TIMESTAMP,
        effective_date = ?, expiry_date = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(reviewer_id, effective_date, expiry_date, req.params.id);
  
  const affectedOrders = db.prepare(`
    SELECT id FROM work_orders 
    WHERE product_id = ? AND status IN ('pending', 'in_progress')
  `).all(sop.product_id);
  
  if (affectedOrders.length > 0) {
    const affectedIds = affectedOrders.map(o => o.id).join(',');
    db.prepare(`
      INSERT INTO change_notifications (sop_id, old_version, new_version, change_description, affected_work_order_ids)
      VALUES (?, ?, ?, ?, ?)
    `).run(sop.id, null, sop.version, '新版本已发布', affectedIds);
  }
  
  res.json({ message: 'SOP approved successfully' });
});

router.post('/:id/reject', (req, res) => {
  db.prepare(`
    UPDATE sops SET status = 'draft', updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(req.params.id);
  res.json({ message: 'SOP rejected' });
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM sops WHERE id = ?').run(req.params.id);
  res.json({ message: 'SOP deleted successfully' });
});

export default router;
