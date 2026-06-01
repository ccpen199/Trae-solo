const express = require('express');
const router = express.Router();
const { db } = require('../database');

router.get('/', (req, res) => {
  const { leader_id, status } = req.query;
  let sql = `
    SELECT a.*, l.name as leader_name, l.community 
    FROM activities a 
    LEFT JOIN leaders l ON a.leader_id = l.id 
    ORDER BY a.created_at DESC
  `;
  let params = [];
  let conditions = [];
  
  if (leader_id) {
    conditions.push('a.leader_id = ?');
    params.push(leader_id);
  }
  if (status) {
    conditions.push('a.status = ?');
    params.push(status);
  }
  
  if (conditions.length > 0) {
    sql = `
      SELECT a.*, l.name as leader_name, l.community 
      FROM activities a 
      LEFT JOIN leaders l ON a.leader_id = l.id 
      WHERE ${conditions.join(' AND ')}
      ORDER BY a.created_at DESC
    `;
  }
  
  const activities = db.prepare(sql).all(...params);
  res.json({ success: true, data: activities });
});

router.get('/:id', (req, res) => {
  const activity = db.prepare(`
    SELECT a.*, l.name as leader_name, l.community 
    FROM activities a 
    LEFT JOIN leaders l ON a.leader_id = l.id 
    WHERE a.id = ?
  `).get(req.params.id);
  
  if (!activity) {
    return res.status(404).json({ success: false, message: '活动不存在' });
  }
  
  const products = db.prepare('SELECT * FROM products WHERE activity_id = ?').all(req.params.id);
  activity.products = products;
  
  res.json({ success: true, data: activity });
});

router.post('/', (req, res) => {
  const { leader_id, title, description, cut_off_time, pickup_point, min_group_size, products } = req.body;
  
  if (!leader_id || !title || !cut_off_time || !pickup_point) {
    return res.status(400).json({ success: false, message: '团长、标题、截单时间和提货点为必填项' });
  }
  
  const leader = db.prepare('SELECT * FROM leaders WHERE id = ?').get(leader_id);
  if (!leader) {
    return res.status(400).json({ success: false, message: '团长不存在' });
  }
  if (!leader.can_create_activity) {
    return res.status(400).json({ success: false, message: '该团长被限制开团' });
  }
  
  const insertActivity = db.prepare(`
    INSERT INTO activities (leader_id, title, description, cut_off_time, pickup_point, min_group_size, status)
    VALUES (?, ?, ?, ?, ?, ?, 'draft')
  `);
  
  const insertProduct = db.prepare(`
    INSERT INTO products (activity_id, name, price, stock, unit)
    VALUES (?, ?, ?, ?, ?)
  `);
  
  const transaction = db.transaction(() => {
    const result = insertActivity.run(leader_id, title, description || '', cut_off_time, pickup_point, min_group_size || 0);
    const activityId = result.lastInsertRowid;
    
    if (products && products.length > 0) {
      for (const product of products) {
        insertProduct.run(activityId, product.name, product.price, product.stock, product.unit || '');
      }
    }
    
    return activityId;
  });
  
  try {
    const activityId = transaction();
    const activity = db.prepare(`
      SELECT a.*, l.name as leader_name 
      FROM activities a 
      LEFT JOIN leaders l ON a.leader_id = l.id 
      WHERE a.id = ?
    `).get(activityId);
    activity.products = db.prepare('SELECT * FROM products WHERE activity_id = ?').all(activityId);
    
    res.json({ success: true, data: activity });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/:id', (req, res) => {
  const { title, description, cut_off_time, pickup_point, min_group_size, status, products } = req.body;
  
  const activity = db.prepare('SELECT * FROM activities WHERE id = ?').get(req.params.id);
  if (!activity) {
    return res.status(404).json({ success: false, message: '活动不存在' });
  }
  
  const updateActivity = db.prepare(`
    UPDATE activities 
    SET title = ?, description = ?, cut_off_time = ?, pickup_point = ?, min_group_size = ?, status = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);
  
  const deleteProducts = db.prepare('DELETE FROM products WHERE activity_id = ?');
  const insertProduct = db.prepare(`
    INSERT INTO products (activity_id, name, price, stock, unit)
    VALUES (?, ?, ?, ?, ?)
  `);
  
  const transaction = db.transaction(() => {
    updateActivity.run(
      title || activity.title,
      description !== undefined ? description : activity.description,
      cut_off_time || activity.cut_off_time,
      pickup_point || activity.pickup_point,
      min_group_size !== undefined ? min_group_size : activity.min_group_size,
      status || activity.status,
      req.params.id
    );
    
    if (products) {
      deleteProducts.run(req.params.id);
      for (const product of products) {
        insertProduct.run(req.params.id, product.name, product.price, product.stock, product.unit || '');
      }
    }
  });
  
  try {
    transaction();
    const updated = db.prepare(`
      SELECT a.*, l.name as leader_name 
      FROM activities a 
      LEFT JOIN leaders l ON a.leader_id = l.id 
      WHERE a.id = ?
    `).get(req.params.id);
    updated.products = db.prepare('SELECT * FROM products WHERE activity_id = ?').all(req.params.id);
    
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM activities WHERE id = ?').run(req.params.id);
  if (result.changes === 0) {
    return res.status(404).json({ success: false, message: '活动不存在' });
  }
  res.json({ success: true, message: '删除成功' });
});

module.exports = router;
