const express = require('express');
const db = require('../database');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const path = require('path');
const fs = require('fs');
const router = express.Router();

router.get('/', (req, res) => {
  const { action, entity_type, start_date, end_date, limit = 100, offset = 0 } = req.query;
  let query = 'SELECT * FROM audit_logs WHERE 1=1';
  const params = [];

  if (action) {
    query += ' AND action = ?';
    params.push(action);
  }
  if (entity_type) {
    query += ' AND entity_type = ?';
    params.push(entity_type);
  }
  if (start_date) {
    query += ' AND created_at >= ?';
    params.push(start_date);
  }
  if (end_date) {
    query += ' AND created_at <= ?';
    params.push(end_date);
  }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));

  const stmt = db.prepare(query);
  const logs = stmt.all(...params);

  const countStmt = db.prepare('SELECT COUNT(*) as total FROM audit_logs');
  const { total } = countStmt.get();

  res.json({
    data: logs.map(l => ({
      ...l,
      details: JSON.parse(l.details || '{}')
    })),
    total
  });
});

router.get('/export', (req, res) => {
  const { action, entity_type, start_date, end_date } = req.query;
  let query = 'SELECT * FROM audit_logs WHERE 1=1';
  const params = [];

  if (action) {
    query += ' AND action = ?';
    params.push(action);
  }
  if (entity_type) {
    query += ' AND entity_type = ?';
    params.push(entity_type);
  }
  if (start_date) {
    query += ' AND created_at >= ?';
    params.push(start_date);
  }
  if (end_date) {
    query += ' AND created_at <= ?';
    params.push(end_date);
  }

  query += ' ORDER BY created_at DESC';

  const stmt = db.prepare(query);
  const logs = stmt.all(...params);

  const exportDir = path.join(__dirname, '../exports');
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir, { recursive: true });
  }

  const filename = `audit_export_${Date.now()}.csv`;
  const filepath = path.join(exportDir, filename);

  const csvWriter = createCsvWriter({
    path: filepath,
    header: [
      { id: 'id', title: 'ID' },
      { id: 'action', title: '操作' },
      { id: 'entity_type', title: '实体类型' },
      { id: 'entity_id', title: '实体ID' },
      { id: 'details', title: '详情' },
      { id: 'operator', title: '操作人' },
      { id: 'ip_address', title: 'IP地址' },
      { id: 'created_at', title: '创建时间' }
    ]
  });

  const records = logs.map(l => ({
    ...l,
    details: l.details || '{}'
  }));

  csvWriter.writeRecords(records)
    .then(() => {
      res.download(filepath, filename, (err) => {
        if (err) {
          res.status(500).json({ error: '导出失败' });
        }
      });
    })
    .catch(() => {
      res.status(500).json({ error: '导出失败' });
    });
});

router.get('/stats', (req, res) => {
  const actionStats = db.prepare(`
    SELECT action, COUNT(*) as count 
    FROM audit_logs 
    GROUP BY action 
    ORDER BY count DESC
  `).all();

  const entityStats = db.prepare(`
    SELECT entity_type, COUNT(*) as count 
    FROM audit_logs 
    WHERE entity_type IS NOT NULL 
    GROUP BY entity_type 
    ORDER BY count DESC
  `).all();

  const todayStats = db.prepare(`
    SELECT COUNT(*) as count 
    FROM audit_logs 
    WHERE DATE(created_at) = DATE('now')
  `).get();

  res.json({
    action_stats: actionStats,
    entity_stats: entityStats,
    today_count: todayStats.count
  });
});

module.exports = router;
