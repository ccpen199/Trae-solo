const express = require('express');
const { getDb } = require('../database/init');

const router = express.Router();
const db = getDb();

router.get('/', (req, res) => {
  try {
    const { parentId } = req.query;

    let sql = `
      SELECT d.*, e.name as leader_name
      FROM departments d
      LEFT JOIN employees e ON d.leader_id = e.id
      WHERE d.status = 1
    `;
    const params = [];

    if (parentId !== undefined) {
      if (parentId === 'null') {
        sql += ' AND d.parent_id IS NULL';
      } else {
        sql += ' AND d.parent_id = ?';
        params.push(parentId);
      }
    }

    sql += ' ORDER BY d.name ASC';

    const rows = db.prepare(sql).all(...params);

    res.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/tree', (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT d.*, e.name as leader_name
      FROM departments d
      LEFT JOIN employees e ON d.leader_id = e.id
      WHERE d.status = 1
      ORDER BY d.id ASC
    `).all();

    const buildTree = (parentId = null) => {
      return rows
        .filter(item => item.parent_id === parentId)
        .map(item => ({
          ...item,
          children: buildTree(item.id),
        }));
    };

    res.json({
      success: true,
      data: buildTree(),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;

    const row = db.prepare(`
      SELECT d.*, e.name as leader_name
      FROM departments d
      LEFT JOIN employees e ON d.leader_id = e.id
      WHERE d.id = ?
    `).get(id);

    if (!row) {
      return res.status(404).json({ success: false, message: '部门不存在' });
    }

    res.json({
      success: true,
      data: row,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
