const express = require('express');
const { db } = require('../database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, (req, res) => {
  const packages = db.prepare(`
    SELECT p.*, 
           (SELECT COUNT(*) FROM package_items WHERE package_id = p.id) as item_count
    FROM packages p
    ORDER BY p.created_at DESC
  `).all();
  res.json(packages);
});

router.get('/published', (req, res) => {
  const packages = db.prepare(`
    SELECT p.*, 
           (SELECT COUNT(*) FROM package_items WHERE package_id = p.id) as item_count
    FROM packages p
    WHERE p.is_published = 1
    ORDER BY p.created_at DESC
  `).all();
  res.json(packages);
});

router.get('/:id', authenticateToken, (req, res) => {
  const pkg = db.prepare('SELECT * FROM packages WHERE id = ?').get(req.params.id);
  if (!pkg) {
    return res.status(404).json({ error: '套餐不存在' });
  }
  
  const items = db.prepare('SELECT * FROM package_items WHERE package_id = ?').all(req.params.id);
  const versions = db.prepare('SELECT * FROM package_versions WHERE package_id = ? ORDER BY version DESC').all(req.params.id);
  
  res.json({ ...pkg, items, versions });
});

router.post('/', authenticateToken, requireRole('admin', 'reception'), (req, res) => {
  const { name, description, target_audience, contraindications, price, preparation, items } = req.body;
  
  const insertPackage = db.prepare(`
    INSERT INTO packages (name, description, target_audience, contraindications, price, preparation, version, is_published)
    VALUES (?, ?, ?, ?, ?, ?, 1, 0)
  `);
  
  const result = insertPackage.run(name, description, target_audience, contraindications, price, preparation);
  const packageId = result.lastInsertRowid;
  
  const insertVersion = db.prepare(`
    INSERT INTO package_versions (package_id, name, description, target_audience, contraindications, price, preparation, version)
    VALUES (?, ?, ?, ?, ?, ?, ?, 1)
  `);
  insertVersion.run(packageId, name, description, target_audience, contraindications, price, preparation);
  
  if (items && items.length > 0) {
    const insertItem = db.prepare(`
      INSERT INTO package_items (package_id, name, category, description, reference_range, unit, is_key)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    for (const item of items) {
      insertItem.run(packageId, item.name, item.category, item.description, item.reference_range, item.unit, item.is_key ? 1 : 0);
    }
  }
  
  res.json({ id: packageId, message: '套餐创建成功' });
});

router.put('/:id', authenticateToken, requireRole('admin', 'reception'), (req, res) => {
  const { name, description, target_audience, contraindications, price, preparation, items } = req.body;
  const packageId = req.params.id;
  
  const pkg = db.prepare('SELECT * FROM packages WHERE id = ?').get(packageId);
  if (!pkg) {
    return res.status(404).json({ error: '套餐不存在' });
  }
  
  const newVersion = pkg.version + 1;
  
  const updatePackage = db.prepare(`
    UPDATE packages 
    SET name = ?, description = ?, target_audience = ?, contraindications = ?, price = ?, preparation = ?, version = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);
  updatePackage.run(name, description, target_audience, contraindications, price, preparation, newVersion, packageId);
  
  const insertVersion = db.prepare(`
    INSERT INTO package_versions (package_id, name, description, target_audience, contraindications, price, preparation, version)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertVersion.run(packageId, name, description, target_audience, contraindications, price, preparation, newVersion);
  
  db.prepare('DELETE FROM package_items WHERE package_id = ?').run(packageId);
  
  if (items && items.length > 0) {
    const insertItem = db.prepare(`
      INSERT INTO package_items (package_id, name, category, description, reference_range, unit, is_key)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    for (const item of items) {
      insertItem.run(packageId, item.name, item.category, item.description, item.reference_range, item.unit, item.is_key ? 1 : 0);
    }
  }
  
  res.json({ message: '套餐更新成功，已创建新版本' });
});

router.post('/:id/publish', authenticateToken, requireRole('admin', 'reception'), (req, res) => {
  db.prepare('UPDATE packages SET is_published = 1 WHERE id = ?').run(req.params.id);
  res.json({ message: '套餐发布成功' });
});

router.post('/:id/unpublish', authenticateToken, requireRole('admin', 'reception'), (req, res) => {
  db.prepare('UPDATE packages SET is_published = 0 WHERE id = ?').run(req.params.id);
  res.json({ message: '套餐已下架' });
});

router.delete('/:id', authenticateToken, requireRole('admin'), (req, res) => {
  db.prepare('DELETE FROM package_items WHERE package_id = ?').run(req.params.id);
  db.prepare('DELETE FROM package_versions WHERE package_id = ?').run(req.params.id);
  db.prepare('DELETE FROM packages WHERE id = ?').run(req.params.id);
  res.json({ message: '套餐删除成功' });
});

module.exports = router;
