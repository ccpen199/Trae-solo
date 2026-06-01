const { db } = require('../models/database');

const getMatters = (req, res) => {
  const matters = db.prepare(`
    SELECT m.*, c.name as client_name, u.name as partner_name
    FROM matters m
    LEFT JOIN clients c ON m.client_id = c.id
    LEFT JOIN users u ON m.partner_id = u.id
    ORDER BY m.created_at DESC
  `).all();
  res.json({ success: true, data: matters });
};

const getMatterById = (req, res) => {
  const matter = db.prepare(`
    SELECT m.*, c.name as client_name, u.name as partner_name
    FROM matters m
    LEFT JOIN clients c ON m.client_id = c.id
    LEFT JOIN users u ON m.partner_id = u.id
    WHERE m.id = ?
  `).get(req.params.id);
  if (!matter) {
    return res.status(404).json({ success: false, message: '案件不存在' });
  }
  res.json({ success: true, data: matter });
};

const createMatter = (req, res) => {
  const { case_number, name, client_id, billing_method, partner_id, budget_limit, discount_rate, non_billable_items, notes } = req.body;
  try {
    const result = db.prepare(
      'INSERT INTO matters (case_number, name, client_id, billing_method, partner_id, budget_limit, discount_rate, non_billable_items, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(case_number, name, client_id, billing_method || 'hourly', partner_id, budget_limit, discount_rate || 0, non_billable_items, notes);
    res.json({ success: true, data: { id: result.lastInsertRowid, ...req.body } });
  } catch (err) {
    res.status(400).json({ success: false, message: '创建案件失败' });
  }
};

const updateMatter = (req, res) => {
  const { case_number, name, client_id, billing_method, partner_id, budget_limit, discount_rate, non_billable_items, status, notes } = req.body;
  try {
    db.prepare(
      'UPDATE matters SET case_number = ?, name = ?, client_id = ?, billing_method = ?, partner_id = ?, budget_limit = ?, discount_rate = ?, non_billable_items = ?, status = ?, notes = ? WHERE id = ?'
    ).run(case_number, name, client_id, billing_method, partner_id, budget_limit, discount_rate, non_billable_items, status || 'active', notes, req.params.id);
    res.json({ success: true, message: '更新成功' });
  } catch (err) {
    res.status(400).json({ success: false, message: '更新失败' });
  }
};

module.exports = { getMatters, getMatterById, createMatter, updateMatter };
