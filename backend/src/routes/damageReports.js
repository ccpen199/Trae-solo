import express from 'express';
import db from '../db.js';

const router = express.Router();

router.get('/', (req, res) => {
  const reports = db.prepare('SELECT * FROM damage_reports ORDER BY created_at DESC').all();
  res.json(reports);
});

router.get('/pending', (req, res) => {
  const reports = db.prepare("SELECT * FROM damage_reports WHERE approval_status = 'pending' ORDER BY created_at DESC").all();
  res.json(reports);
});

router.post('/', (req, res) => {
  const { linen_item_id, linen_category, quantity, report_date, reason, reporter, remarks } = req.body;
  try {
    const stmt = db.prepare(`
      INSERT INTO damage_reports (linen_item_id, linen_category, quantity, report_date, reason, reporter, remarks)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(linen_item_id || null, linen_category, quantity, report_date, reason, reporter, remarks);
    res.json({ id: result.lastInsertRowid, ...req.body, approval_status: 'pending' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id/approve', (req, res) => {
  const { approver, remarks } = req.body;
  const report = db.prepare('SELECT * FROM damage_reports WHERE id=?').get(req.params.id);
  if (!report) {
    return res.status(404).json({ error: 'Damage report not found' });
  }
  
  const stmt = db.prepare(`
    UPDATE damage_reports 
    SET approval_status='approved', approver=?, approval_date=DATE('now'), remarks=?
    WHERE id=?
  `);
  stmt.run(approver, remarks || report.remarks, req.params.id);
  
  if (report.linen_item_id) {
    db.prepare("UPDATE linen_items SET status='scrapped', scrap_reason=?, updated_at=CURRENT_TIMESTAMP WHERE id=?").run(report.reason, report.linen_item_id);
  }
  
  const logStmt = db.prepare(`
    INSERT INTO inventory_logs (linen_category, change_type, quantity, reference_type, reference_id, operator, remarks)
    VALUES (?, 'scrap', -?, 'damage', ?, ?, ?)
  `);
  logStmt.run(report.linen_category, report.quantity, req.params.id, approver, report.reason);
  
  res.json({ message: 'Report approved' });
});

router.put('/:id/reject', (req, res) => {
  const { approver, remarks } = req.body;
  const stmt = db.prepare(`
    UPDATE damage_reports 
    SET approval_status='rejected', approver=?, approval_date=DATE('now'), remarks=?
    WHERE id=?
  `);
  const result = stmt.run(approver, remarks, req.params.id);
  if (result.changes === 0) {
    return res.status(404).json({ error: 'Damage report not found' });
  }
  res.json({ message: 'Report rejected' });
});

export default router;
