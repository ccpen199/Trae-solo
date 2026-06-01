import express from 'express';
import { db } from '../database.js';

const router = express.Router();

router.get('/', (req, res) => {
  const suppliers = db.prepare('SELECT * FROM suppliers ORDER BY created_at DESC').all();
  res.json(suppliers);
});

router.get('/:id', (req, res) => {
  const supplier = db.prepare('SELECT * FROM suppliers WHERE id = ?').get(req.params.id);
  if (!supplier) return res.status(404).json({ error: 'Supplier not found' });
  res.json(supplier);
});

router.post('/', (req, res) => {
  const { name, contact, phone, email, status } = req.body;
  const result = db.prepare(`
    INSERT INTO suppliers (name, contact, phone, email, status)
    VALUES (?, ?, ?, ?, ?)
  `).run(name, contact, phone, email, status || 'active');
  
  const supplier = db.prepare('SELECT * FROM suppliers WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(supplier);
});

router.put('/:id', (req, res) => {
  const { name, contact, phone, email, status } = req.body;
  const oldSupplier = db.prepare('SELECT * FROM suppliers WHERE id = ?').get(req.params.id);
  
  if (!oldSupplier) return res.status(404).json({ error: 'Supplier not found' });
  
  db.prepare(`
    UPDATE suppliers 
    SET name = ?, contact = ?, phone = ?, email = ?, status = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(name, contact, phone, email, status || 'active', req.params.id);
  
  const fields = ['name', 'contact', 'phone', 'email', 'status'];
  fields.forEach(field => {
    if (oldSupplier[field] !== req.body[field]) {
      db.prepare(`
        INSERT INTO change_logs (entity_type, entity_id, field_name, old_value, new_value, changed_by)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run('supplier', req.params.id, field, String(oldSupplier[field]), String(req.body[field] || ''), 'system');
    }
  });
  
  if (status === 'inactive' || req.body.status === 'inactive') {
    const affectedRoutes = db.prepare(`
      SELECT DISTINCT r.id, r.name FROM routes r
      JOIN route_resources rr ON r.id = rr.route_id
      JOIN resources res ON rr.resource_id = res.id
      WHERE res.supplier_id = ?
    `).all(req.params.id);
    
    affectedRoutes.forEach(route => {
      db.prepare(`
        INSERT INTO notifications (route_id, resource_id, type, message)
        VALUES (?, ?, ?, ?)
      `).run(route.id, null, 'supplier_change', `供应商 ${name} 已下架，请复核线路「${route.name}」`);
    });
  }
  
  const supplier = db.prepare('SELECT * FROM suppliers WHERE id = ?').get(req.params.id);
  res.json(supplier);
});

router.delete('/:id', (req, res) => {
  const supplier = db.prepare('SELECT * FROM suppliers WHERE id = ?').get(req.params.id);
  if (!supplier) return res.status(404).json({ error: 'Supplier not found' });
  
  db.prepare('DELETE FROM suppliers WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

export default router;
