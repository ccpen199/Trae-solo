const express = require('express');
const router = express.Router();
const { db } = require('../database');

router.get('/', (req, res) => {
  const { status } = req.query;
  let sql = 'SELECT * FROM leaders ORDER BY created_at DESC';
  let params = [];
  
  if (status) {
    sql = 'SELECT * FROM leaders WHERE status = ? ORDER BY created_at DESC';
    params = [status];
  }
  
  const leaders = db.prepare(sql).all(...params);
  res.json({ success: true, data: leaders });
});

router.get('/:id', (req, res) => {
  const leader = db.prepare('SELECT * FROM leaders WHERE id = ?').get(req.params.id);
  if (!leader) {
    return res.status(404).json({ success: false, message: '团长不存在' });
  }
  res.json({ success: true, data: leader });
});

router.post('/', (req, res) => {
  const { name, phone, community, service_area, qualification, deposit, level } = req.body;
  
  if (!name || !phone || !community) {
    return res.status(400).json({ success: false, message: '姓名、电话和社区为必填项' });
  }
  
  try {
    const result = db.prepare(`
      INSERT INTO leaders (name, phone, community, service_area, qualification, deposit, level)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(name, phone, community, service_area || '', qualification || '', deposit || 0, level || 1);
    
    const leader = db.prepare('SELECT * FROM leaders WHERE id = ?').get(result.lastInsertRowid);
    res.json({ success: true, data: leader });
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(400).json({ success: false, message: '该手机号已被使用' });
    }
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/:id', (req, res) => {
  const { name, phone, community, service_area, qualification, deposit, level, status, can_create_activity } = req.body;
  
  const leader = db.prepare('SELECT * FROM leaders WHERE id = ?').get(req.params.id);
  if (!leader) {
    return res.status(404).json({ success: false, message: '团长不存在' });
  }
  
  try {
    db.prepare(`
      UPDATE leaders 
      SET name = ?, phone = ?, community = ?, service_area = ?, qualification = ?, 
          deposit = ?, level = ?, status = ?, can_create_activity = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      name || leader.name,
      phone || leader.phone,
      community || leader.community,
      service_area !== undefined ? service_area : leader.service_area,
      qualification !== undefined ? qualification : leader.qualification,
      deposit !== undefined ? deposit : leader.deposit,
      level !== undefined ? level : leader.level,
      status || leader.status,
      can_create_activity !== undefined ? can_create_activity : leader.can_create_activity,
      req.params.id
    );
    
    const updated = db.prepare('SELECT * FROM leaders WHERE id = ?').get(req.params.id);
    res.json({ success: true, data: updated });
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(400).json({ success: false, message: '该手机号已被使用' });
    }
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM leaders WHERE id = ?').run(req.params.id);
  if (result.changes === 0) {
    return res.status(404).json({ success: false, message: '团长不存在' });
  }
  res.json({ success: true, message: '删除成功' });
});

module.exports = router;
