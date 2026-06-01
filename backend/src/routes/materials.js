import express from 'express';
import { db } from '../database.js';

const router = express.Router();

router.get('/', (req, res) => {
  const { resource_id, expired } = req.query;
  let query = 'SELECT * FROM materials WHERE 1=1';
  const params = [];
  
  if (resource_id) {
    query += ' AND resource_id = ?';
    params.push(resource_id);
  }
  
  if (expired === 'false') {
    query += ' AND (expire_at IS NULL OR expire_at > datetime("now"))';
  } else if (expired === 'true') {
    query += ' AND expire_at <= datetime("now")';
  }
  
  query += ' ORDER BY created_at DESC';
  
  const materials = db.prepare(query).all(...params);
  res.json(materials);
});

router.get('/:id', (req, res) => {
  const material = db.prepare('SELECT * FROM materials WHERE id = ?').get(req.params.id);
  if (!material) return res.status(404).json({ error: 'Material not found' });
  res.json(material);
});

router.post('/', (req, res) => {
  const { resource_id, type, name, url, content, copyright, channels, expire_at } = req.body;
  
  const result = db.prepare(`
    INSERT INTO materials (resource_id, type, name, url, content, copyright, channels, expire_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(resource_id, type, name, url, content, copyright, channels, expire_at);
  
  const material = db.prepare('SELECT * FROM materials WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(material);
});

router.put('/:id', (req, res) => {
  const oldMaterial = db.prepare('SELECT * FROM materials WHERE id = ?').get(req.params.id);
  if (!oldMaterial) return res.status(404).json({ error: 'Material not found' });
  
  const { resource_id, type, name, url, content, copyright, channels, expire_at } = req.body;
  
  db.prepare(`
    UPDATE materials 
    SET resource_id = ?, type = ?, name = ?, url = ?, content = ?, copyright = ?, channels = ?, expire_at = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(resource_id, type, name, url, content, copyright, channels, expire_at, req.params.id);
  
  const fields = ['type', 'name', 'url', 'content', 'copyright', 'channels', 'expire_at'];
  fields.forEach(field => {
    const oldVal = String(oldMaterial[field] || '');
    const newVal = String(req.body[field] || '');
    if (oldVal !== newVal) {
      db.prepare(`
        INSERT INTO change_logs (entity_type, entity_id, field_name, old_value, new_value, changed_by)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run('material', req.params.id, field, oldVal, newVal, 'system');
    }
  });
  
  const material = db.prepare('SELECT * FROM materials WHERE id = ?').get(req.params.id);
  res.json(material);
});

router.delete('/:id', (req, res) => {
  const material = db.prepare('SELECT * FROM materials WHERE id = ?').get(req.params.id);
  if (!material) return res.status(404).json({ error: 'Material not found' });
  
  db.prepare('DELETE FROM materials WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

export default router;
