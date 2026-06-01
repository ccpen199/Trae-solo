const express = require('express');
const router = express.Router();
const db = require('../database');
const { containerSchema } = require('../utils/validation');

router.get('/', (req, res) => {
  const { search, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;
  
  let query = 'SELECT * FROM containers WHERE 1=1';
  const params = [];
  
  if (search) {
    query += ' AND (container_number LIKE ? OR booking_number LIKE ? OR bill_of_lading LIKE ?)';
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm, searchTerm);
  }
  
  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));
  
  let containers = db.prepare(query).all(...params);
  
  // 为每个箱号统计未解决的异常数量
  containers = containers.map(container => {
    const { count } = db.prepare("SELECT COUNT(*) as count FROM exceptions WHERE container_id = ? AND status IN ('open', 'processing')").get(container.id);
    return {
      ...container,
      open_exceptions_count: count
    };
  });
  
  const countQuery = 'SELECT COUNT(*) as total FROM containers WHERE 1=1' + (search ? ' AND (container_number LIKE ? OR booking_number LIKE ? OR bill_of_lading LIKE ?)' : '');
  const countParams = search ? [`%${search}%`, `%${search}%`, `%${search}%`] : [];
  const { total } = db.prepare(countQuery).get(...countParams);
  
  res.json({ data: containers, total, page: parseInt(page), limit: parseInt(limit) });
});

router.get('/:id', (req, res) => {
  const container = db.prepare('SELECT * FROM containers WHERE id = ?').get(req.params.id);
  if (!container) {
    return res.status(404).json({ error: '箱号不存在' });
  }
  
  const nodes = db.prepare('SELECT * FROM container_nodes WHERE container_id = ? ORDER BY node_time DESC').all(req.params.id);
  const exceptions = db.prepare('SELECT * FROM exceptions WHERE container_id = ? ORDER BY created_at DESC').all(req.params.id);
  
  // 为每个异常添加处理日志
  const exceptionsWithLogs = exceptions.map(exc => {
    const logs = db.prepare('SELECT * FROM exception_logs WHERE exception_id = ? ORDER BY created_at DESC').all(exc.id);
    return { ...exc, logs };
  });
  
  // 统计未解决的异常数量
  const openExceptionsCount = exceptions.filter(e => ['open', 'processing'].includes(e.status)).length;
  
  res.json({ 
    container: {
      ...container,
      open_exceptions_count: openExceptionsCount
    }, 
    nodes, 
    exceptions: exceptionsWithLogs 
  });
});

router.get('/number/:containerNumber', (req, res) => {
  const container = db.prepare('SELECT * FROM containers WHERE container_number = ?').get(req.params.containerNumber);
  if (!container) {
    return res.status(404).json({ error: '箱号不存在' });
  }
  
  const nodes = db.prepare('SELECT * FROM container_nodes WHERE container_id = ? ORDER BY node_time DESC').all(container.id);
  const exceptions = db.prepare('SELECT * FROM exceptions WHERE container_id = ? ORDER BY created_at DESC').all(container.id);
  
  res.json({ container, nodes, exceptions });
});

router.post('/', (req, res) => {
  const { error, value } = containerSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  
  const existing = db.prepare('SELECT id FROM containers WHERE container_number = ?').get(value.container_number);
  if (existing) {
    return res.status(400).json({ error: '箱号已存在' });
  }
  
  const stmt = db.prepare(`
    INSERT INTO containers (container_number, booking_number, bill_of_lading, container_type, seal_number, shipper, origin_port, destination_port)
    VALUES (@container_number, @booking_number, @bill_of_lading, @container_type, @seal_number, @shipper, @origin_port, @destination_port)
  `);
  
  const result = stmt.run(value);
  const container = db.prepare('SELECT * FROM containers WHERE id = ?').get(result.lastInsertRowid);
  
  res.status(201).json(container);
});

router.put('/:id', (req, res) => {
  const { error, value } = containerSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  
  const existing = db.prepare('SELECT id FROM containers WHERE container_number = ? AND id != ?').get(value.container_number, req.params.id);
  if (existing) {
    return res.status(400).json({ error: '箱号已存在' });
  }
  
  const stmt = db.prepare(`
    UPDATE containers 
    SET container_number = @container_number, booking_number = @booking_number, bill_of_lading = @bill_of_lading,
        container_type = @container_type, seal_number = @seal_number, shipper = @shipper,
        origin_port = @origin_port, destination_port = @destination_port, updated_at = CURRENT_TIMESTAMP
    WHERE id = @id
  `);
  
  stmt.run({ ...value, id: req.params.id });
  const container = db.prepare('SELECT * FROM containers WHERE id = ?').get(req.params.id);
  
  res.json(container);
});

router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM containers WHERE id = ?').run(req.params.id);
  if (result.changes === 0) {
    return res.status(404).json({ error: '箱号不存在' });
  }
  res.json({ message: '删除成功' });
});

module.exports = router;
