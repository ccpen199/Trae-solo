const express = require('express');
const router = express.Router();
const db = require('../database');
const { nodeSchema } = require('../utils/validation');

router.get('/container/:containerId', (req, res) => {
  const nodes = db.prepare('SELECT * FROM container_nodes WHERE container_id = ? ORDER BY node_time DESC').all(req.params.containerId);
  res.json(nodes);
});

router.post('/', (req, res) => {
  const { error, value } = nodeSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  
  const container = db.prepare('SELECT id FROM containers WHERE id = ?').get(value.container_id);
  if (!container) {
    return res.status(404).json({ error: '箱号不存在' });
  }
  
  const stmt = db.prepare(`
    INSERT INTO container_nodes (container_id, node_type, node_time, source, remarks)
    VALUES (@container_id, @node_type, @node_time, @source, @remarks)
  `);
  
  const result = stmt.run(value);
  const node = db.prepare('SELECT * FROM container_nodes WHERE id = ?').get(result.lastInsertRowid);
  
  res.status(201).json(node);
});

router.put('/:id', (req, res) => {
  const { error, value } = nodeSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  
  const stmt = db.prepare(`
    UPDATE container_nodes 
    SET node_type = @node_type, node_time = @node_time, source = @source, remarks = @remarks
    WHERE id = @id
  `);
  
  stmt.run({ ...value, id: req.params.id });
  const node = db.prepare('SELECT * FROM container_nodes WHERE id = ?').get(req.params.id);
  
  if (!node) {
    return res.status(404).json({ error: '节点不存在' });
  }
  
  res.json(node);
});

router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM container_nodes WHERE id = ?').run(req.params.id);
  if (result.changes === 0) {
    return res.status(404).json({ error: '节点不存在' });
  }
  res.json({ message: '删除成功' });
});

module.exports = router;
