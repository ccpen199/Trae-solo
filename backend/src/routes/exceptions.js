const express = require('express');
const { db } = require('../database');

const router = express.Router();

const EXCEPTION_TYPES = {
  misrouted: '错运',
  delayed: '延误',
  damaged: '破损',
  lost: '遗失',
  unclaimed: '无人认领'
};

const EXCEPTION_STATUSES = {
  open: '处理中',
  in_progress: '调查中',
  resolved: '已解决',
  closed: '已关闭'
};

function generateInquiryNo() {
  const prefix = 'INQ';
  const date = new Date().toISOString().slice(2, 10).replace(/-/g, '');
  const random = Math.floor(Math.random() * 9000 + 1000);
  return `${prefix}${date}${random}`;
}

router.post('/', (req, res) => {
  const {
    baggage_tag,
    exception_type,
    description,
    report_time,
    reporter
  } = req.body;

  if (!baggage_tag || !exception_type || !report_time) {
    return res.status(400).json({ error: 'Missing required fields: baggage_tag, exception_type, report_time' });
  }

  if (!EXCEPTION_TYPES[exception_type]) {
    return res.status(400).json({ error: 'Invalid exception_type' });
  }

  const baggage = db.prepare('SELECT * FROM baggage WHERE baggage_tag = ?').get(baggage_tag);
  if (!baggage) {
    return res.status(404).json({ error: 'Baggage not found' });
  }

  const inquiry_no = generateInquiryNo();

  const stmt = db.prepare(`
    INSERT INTO baggage_exceptions (
      baggage_id, exception_type, exception_name, description,
      report_time, reporter, inquiry_no, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 'open')
  `);

  const result = stmt.run(
    baggage.id,
    exception_type,
    EXCEPTION_TYPES[exception_type],
    description || '',
    report_time,
    reporter || '',
    inquiry_no
  );

  db.prepare(`
    UPDATE baggage SET status = 'exception', updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `).run(baggage.id);

  const progressStmt = db.prepare(`
    INSERT INTO progress_records (exception_id, status, operator, remark)
    VALUES (?, 'open', ?, ?)
  `);
  progressStmt.run(result.lastInsertRowid, reporter || 'system', '异常已登记，查询单已创建');

  const exception = db.prepare('SELECT * FROM baggage_exceptions WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(exception);
});

router.get('/', (req, res) => {
  const { page = 1, pageSize = 20, baggage_tag, exception_type, status } = req.query;
  const offset = (page - 1) * pageSize;

  let whereClauses = ['1=1'];
  let params = [];

  if (baggage_tag) {
    whereClauses.push('b.baggage_tag LIKE ?');
    params.push(`%${baggage_tag}%`);
  }
  if (exception_type) {
    whereClauses.push('be.exception_type = ?');
    params.push(exception_type);
  }
  if (status) {
    whereClauses.push('be.status = ?');
    params.push(status);
  }

  const whereSql = whereClauses.join(' AND ');

  const total = db.prepare(`
    SELECT COUNT(*) as count 
    FROM baggage_exceptions be
    LEFT JOIN baggage b ON be.baggage_id = b.id
    WHERE ${whereSql}
  `).get(...params);

  const list = db.prepare(`
    SELECT be.*, b.baggage_tag, b.passenger_name, b.flight_no, b.flight_date,
           (SELECT COUNT(*) FROM exception_photos ep WHERE ep.exception_id = be.id) as photo_count
    FROM baggage_exceptions be
    LEFT JOIN baggage b ON be.baggage_id = b.id
    WHERE ${whereSql}
    ORDER BY be.report_time DESC LIMIT ? OFFSET ?
  `).all(...params, parseInt(pageSize), parseInt(offset));

  res.json({
    list,
    total: total.count,
    page: parseInt(page),
    pageSize: parseInt(pageSize)
  });
});

router.get('/types', (req, res) => {
  res.json(
    Object.entries(EXCEPTION_TYPES).map(([type, name]) => ({ type, name }))
  );
});

router.get('/statuses', (req, res) => {
  res.json(
    Object.entries(EXCEPTION_STATUSES).map(([type, name]) => ({ type, name }))
  );
});

router.get('/:inquiryNo', (req, res) => {
  const { inquiryNo } = req.params;

  const exception = db.prepare(`
    SELECT be.*, b.baggage_tag, b.passenger_name, b.flight_no, b.flight_date,
           b.departure, b.destination, b.pieces, b.weight
    FROM baggage_exceptions be
    LEFT JOIN baggage b ON be.baggage_id = b.id
    WHERE be.inquiry_no = ?
  `).get(inquiryNo);

  if (!exception) {
    return res.status(404).json({ error: 'Exception not found' });
  }

  const photos = db.prepare(`
    SELECT * FROM exception_photos WHERE exception_id = ?
  `).all(exception.id);

  const progress = db.prepare(`
    SELECT * FROM progress_records WHERE exception_id = ? ORDER BY created_at DESC
  `).all(exception.id);

  const compensation = db.prepare(`
    SELECT * FROM compensation_records WHERE exception_id = ?
  `).all(exception.id);

  res.json({
    exception,
    photos,
    progress,
    compensation
  });
});

router.put('/:inquiryNo/status', (req, res) => {
  const { inquiryNo } = req.params;
  const { status, operator, remark } = req.body;

  if (!status || !EXCEPTION_STATUSES[status]) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  const exception = db.prepare('SELECT * FROM baggage_exceptions WHERE inquiry_no = ?').get(inquiryNo);
  if (!exception) {
    return res.status(404).json({ error: 'Exception not found' });
  }

  db.prepare(`
    UPDATE baggage_exceptions 
    SET status = ?, updated_at = CURRENT_TIMESTAMP
    WHERE inquiry_no = ?
  `).run(status, inquiryNo);

  const progressStmt = db.prepare(`
    INSERT INTO progress_records (exception_id, status, operator, remark)
    VALUES (?, ?, ?, ?)
  `);
  progressStmt.run(exception.id, status, operator || 'system', remark || `状态更新为 ${EXCEPTION_STATUSES[status]}`);

  if (status === 'resolved' || status === 'closed') {
    db.prepare(`
      UPDATE baggage SET status = 'in_transit', updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND status = 'exception'
    `).run(exception.baggage_id);
  }

  const updated = db.prepare('SELECT * FROM baggage_exceptions WHERE inquiry_no = ?').get(inquiryNo);
  res.json(updated);
});

router.post('/:inquiryNo/progress', (req, res) => {
  const { inquiryNo } = req.params;
  const { status, operator, remark } = req.body;

  const exception = db.prepare('SELECT * FROM baggage_exceptions WHERE inquiry_no = ?').get(inquiryNo);
  if (!exception) {
    return res.status(404).json({ error: 'Exception not found' });
  }

  const stmt = db.prepare(`
    INSERT INTO progress_records (exception_id, status, operator, remark)
    VALUES (?, ?, ?, ?)
  `);

  const result = stmt.run(
    exception.id, status || exception.status, operator || 'system', remark || '');

  const progress = db.prepare('SELECT * FROM progress_records WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(progress);
});

router.get('/:inquiryNo/progress', (req, res) => {
  const { inquiryNo } = req.params;

  const exception = db.prepare('SELECT * FROM baggage_exceptions WHERE inquiry_no = ?').get(inquiryNo);
  if (!exception) {
    return res.status(404).json({ error: 'Exception not found' });
  }

  const progress = db.prepare(`
    SELECT * FROM progress_records WHERE exception_id = ? ORDER BY created_at DESC
  `).all(exception.id);

  res.json(progress);
});

module.exports = router;
