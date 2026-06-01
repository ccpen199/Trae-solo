const { db } = require('../models/database');

const getTimeEntries = (req, res) => {
  const { matter_id, user_id, status, start_date, end_date } = req.query;
  let query = `
    SELECT t.*, m.name as matter_name, c.name as client_name, u.name as user_name,
           r.name as reviewer_name, m.case_number
    FROM time_entries t
    LEFT JOIN matters m ON t.matter_id = m.id
    LEFT JOIN clients c ON m.client_id = c.id
    LEFT JOIN users u ON t.user_id = u.id
    LEFT JOIN users r ON t.reviewer_id = r.id
    WHERE 1=1
  `;
  const params = [];

  if (matter_id) { query += ' AND t.matter_id = ?'; params.push(matter_id); }
  if (user_id) { query += ' AND t.user_id = ?'; params.push(user_id); }
  if (status) { query += ' AND t.status = ?'; params.push(status); }
  if (start_date) { query += ' AND t.date >= ?'; params.push(start_date); }
  if (end_date) { query += ' AND t.date <= ?'; params.push(end_date); }

  query += ' ORDER BY t.date DESC, t.created_at DESC';

  const entries = db.prepare(query).all(...params);
  res.json({ success: true, data: entries });
};

const getTimeEntryById = (req, res) => {
  const entry = db.prepare(`
    SELECT t.*, m.name as matter_name, c.name as client_name, u.name as user_name
    FROM time_entries t
    LEFT JOIN matters m ON t.matter_id = m.id
    LEFT JOIN clients c ON m.client_id = c.id
    LEFT JOIN users u ON t.user_id = u.id
    WHERE t.id = ?
  `).get(req.params.id);
  if (!entry) {
    return res.status(404).json({ success: false, message: '工时记录不存在' });
  }
  res.json({ success: true, data: entry });
};

const createTimeEntry = (req, res) => {
  const { date, matter_id, user_id, description, hours, is_billable, rate_amount, attachments } = req.body;

  const existing = db.prepare(`
    SELECT id FROM time_entries
    WHERE date = ? AND matter_id = ? AND user_id = ? AND description = ?
  `).get(date, matter_id, user_id, description);

  if (existing) {
    return res.status(400).json({ success: false, message: '该日期相同事项已存在重复填报', warning: 'duplicate' });
  }

  if (hours > 12) {
    return res.status(400).json({ success: false, message: '工时超过12小时，请确认是否正确', warning: 'long_hours' });
  }

  try {
    const result = db.prepare(
      'INSERT INTO time_entries (date, matter_id, user_id, description, hours, is_billable, rate_amount, attachments) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(date, matter_id, user_id, description, hours, is_billable ? 1 : 0, rate_amount, attachments);

    res.json({ success: true, data: { id: result.lastInsertRowid, ...req.body } });
  } catch (err) {
    res.status(400).json({ success: false, message: '创建工时记录失败' });
  }
};

const updateTimeEntry = (req, res) => {
  const entry = db.prepare('SELECT invoice_id FROM time_entries WHERE id = ?').get(req.params.id);
  if (entry && entry.invoice_id) {
    return res.status(400).json({ success: false, message: '已进入账单的工时不能修改' });
  }

  const { date, matter_id, user_id, description, hours, is_billable, rate_amount, attachments } = req.body;

  if (hours > 12) {
    return res.status(400).json({ success: false, message: '工时超过12小时，请确认是否正确', warning: 'long_hours' });
  }

  try {
    db.prepare(
      'UPDATE time_entries SET date = ?, matter_id = ?, user_id = ?, description = ?, hours = ?, is_billable = ?, rate_amount = ?, attachments = ? WHERE id = ?'
    ).run(date, matter_id, user_id, description, hours, is_billable ? 1 : 0, rate_amount, attachments, req.params.id);
    res.json({ success: true, message: '更新成功' });
  } catch (err) {
    res.status(400).json({ success: false, message: '更新失败' });
  }
};

const reviewTimeEntry = (req, res) => {
  const { status, reviewer_id, review_notes } = req.body;
  const entry = db.prepare('SELECT invoice_id FROM time_entries WHERE id = ?').get(req.params.id);
  if (entry && entry.invoice_id && status !== 'approved') {
    return res.status(400).json({ success: false, message: '已进入账单的工时不能退回' });
  }

  try {
    db.prepare(
      'UPDATE time_entries SET status = ?, reviewer_id = ?, review_notes = ?, reviewed_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).run(status, reviewer_id, review_notes, req.params.id);
    res.json({ success: true, message: '审核完成' });
  } catch (err) {
    res.status(400).json({ success: false, message: '审核失败' });
  }
};

const deleteTimeEntry = (req, res) => {
  const entry = db.prepare('SELECT invoice_id FROM time_entries WHERE id = ?').get(req.params.id);
  if (entry && entry.invoice_id) {
    return res.status(400).json({ success: false, message: '已进入账单的工时不能删除' });
  }

  try {
    db.prepare('DELETE FROM time_entries WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: '删除成功' });
  } catch (err) {
    res.status(400).json({ success: false, message: '删除失败' });
  }
};

module.exports = { getTimeEntries, getTimeEntryById, createTimeEntry, updateTimeEntry, reviewTimeEntry, deleteTimeEntry };
