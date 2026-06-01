import express from 'express';
import { db } from '../database.js';

const router = express.Router();

router.get('/', (req, res) => {
  const { type } = req.query;
  let query = `
    SELECT r.*, s.name as supplier_name, s.status as supplier_status
    FROM resources r
    LEFT JOIN suppliers s ON r.supplier_id = s.id
  `;
  const params = [];
  
  if (type) {
    query += ' WHERE r.type = ?';
    params.push(type);
  }
  query += ' ORDER BY r.created_at DESC';
  
  const resources = db.prepare(query).all(...params);
  res.json(resources);
});

router.get('/:id', (req, res) => {
  const resource = db.prepare(`
    SELECT r.*, s.name as supplier_name, s.status as supplier_status
    FROM resources r
    LEFT JOIN suppliers s ON r.supplier_id = s.id
    WHERE r.id = ?
  `).get(req.params.id);
  
  if (!resource) return res.status(404).json({ error: 'Resource not found' });
  res.json(resource);
});

router.post('/', (req, res) => {
  const { type, name, description, location, latitude, longitude, opening_hours, suitable_for, price, stock, notes, is_closed, season_start, season_end, supplier_id } = req.body;
  
  const result = db.prepare(`
    INSERT INTO resources (type, name, description, location, latitude, longitude, opening_hours, suitable_for, price, stock, notes, is_closed, season_start, season_end, supplier_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(type, name, description, location, latitude, longitude, opening_hours, suitable_for, price, stock, notes, is_closed ? 1 : 0, season_start, season_end, supplier_id);
  
  const resource = db.prepare('SELECT * FROM resources WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(resource);
});

router.put('/:id', (req, res) => {
  const oldResource = db.prepare('SELECT * FROM resources WHERE id = ?').get(req.params.id);
  if (!oldResource) return res.status(404).json({ error: 'Resource not found' });
  
  const { type, name, description, location, latitude, longitude, opening_hours, suitable_for, price, stock, notes, is_closed, season_start, season_end, supplier_id } = req.body;
  
  db.prepare(`
    UPDATE resources 
    SET type = ?, name = ?, description = ?, location = ?, latitude = ?, longitude = ?, 
        opening_hours = ?, suitable_for = ?, price = ?, stock = ?, notes = ?, 
        is_closed = ?, season_start = ?, season_end = ?, supplier_id = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(type, name, description, location, latitude, longitude, opening_hours, suitable_for, price, stock, notes, is_closed ? 1 : 0, season_start, season_end, supplier_id, req.params.id);
  
  const fields = ['type', 'name', 'description', 'location', 'opening_hours', 'suitable_for', 'price', 'stock', 'notes', 'is_closed', 'supplier_id'];
  fields.forEach(field => {
    const oldVal = String(oldResource[field] || '');
    const newVal = String(req.body[field] || '');
    if (oldVal !== newVal) {
      db.prepare(`
        INSERT INTO change_logs (entity_type, entity_id, field_name, old_value, new_value, changed_by)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run('resource', req.params.id, field, oldVal, newVal, 'system');
    }
  });
  
  if (is_closed || req.body.is_closed) {
    const affectedRoutes = db.prepare(`
      SELECT DISTINCT r.id, r.name FROM routes r
      JOIN route_resources rr ON r.id = rr.route_id
      WHERE rr.resource_id = ?
    `).all(req.params.id);
    
    affectedRoutes.forEach(route => {
      db.prepare(`
        INSERT INTO notifications (route_id, resource_id, type, message)
        VALUES (?, ?, ?, ?)
      `).run(route.id, req.params.id, 'resource_closed', `资源「${name}」已停业，请复核线路「${route.name}」`);
    });
  }
  
  if (oldResource.price !== price) {
    const affectedRoutes = db.prepare(`
      SELECT DISTINCT r.id, r.name FROM routes r
      JOIN route_resources rr ON r.id = rr.route_id
      WHERE rr.resource_id = ?
    `).all(req.params.id);
    
    affectedRoutes.forEach(route => {
      db.prepare(`
        INSERT INTO notifications (route_id, resource_id, type, message)
        VALUES (?, ?, ?, ?)
      `).run(route.id, req.params.id, 'price_change', `资源「${name}」价格从 ${oldResource.price} 变更为 ${price}，请复核线路「${route.name}」`);
    });
  }
  
  const resource = db.prepare('SELECT * FROM resources WHERE id = ?').get(req.params.id);
  res.json(resource);
});

router.delete('/:id', (req, res) => {
  const resource = db.prepare('SELECT * FROM resources WHERE id = ?').get(req.params.id);
  if (!resource) return res.status(404).json({ error: 'Resource not found' });
  
  db.prepare('DELETE FROM resources WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

router.get('/:id/changelogs', (req, res) => {
  const logs = db.prepare(`
    SELECT * FROM change_logs 
    WHERE entity_type = 'resource' AND entity_id = ?
    ORDER BY created_at DESC
  `).all(req.params.id);
  res.json(logs);
});

export default router;
