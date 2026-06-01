const express = require('express');
const router = express.Router();
const { db } = require('../database');

router.get('/', (req, res) => {
  const { status, type } = req.query;
  let query = `
    SELECT t.*, c.name as customer_name, c.customer_no 
    FROM todo_items t 
    LEFT JOIN customers c ON t.customer_id = c.id 
    WHERE 1=1
  `;
  const params = [];
  
  if (status) {
    query += ' AND t.status = ?';
    params.push(status);
  }
  if (type) {
    query += ' AND t.type = ?';
    params.push(type);
  }
  
  query += ' ORDER BY t.due_date ASC, t.created_at DESC';
  const todos = db.prepare(query).all(...params);
  res.json(todos);
});

router.put('/:id', (req, res) => {
  const { status } = req.body;
  db.prepare('UPDATE todo_items SET status = ? WHERE id = ?').run(status, req.params.id);
  res.json({ success: true });
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM todo_items WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
