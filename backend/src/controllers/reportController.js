const db = require('../models/database');

exports.createReport = (req, res) => {
  const { listing_id, report_type, reason, description, evidence } = req.body;

  if (!report_type || !reason) {
    return res.status(400).json({ error: '举报类型和原因不能为空' });
  }

  const result = db.prepare(`
    INSERT INTO reports (listing_id, reporter_id, report_type, reason, description, evidence)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    listing_id || null,
    req.user.id,
    report_type,
    reason,
    description || null,
    evidence ? JSON.stringify(evidence) : null
  );

  const report = db.prepare('SELECT * FROM reports WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ report });
};

exports.getMyReports = (req, res) => {
  const { page = 1, page_size = 20 } = req.query;

  const reports = db.prepare(`
    SELECT r.*, l.title as listing_title
    FROM reports r
    LEFT JOIN listings l ON r.listing_id = l.id
    WHERE r.reporter_id = ?
    ORDER BY r.created_at DESC LIMIT ? OFFSET ?
  `).all(req.user.id, parseInt(page_size), (parseInt(page) - 1) * parseInt(page_size));

  const { total } = db.prepare('SELECT COUNT(*) as total FROM reports WHERE reporter_id = ?').get(req.user.id);

  res.json({ reports, total });
};
