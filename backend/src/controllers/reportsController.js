const { db } = require('../models/database');

const getBudgetReport = (req, res) => {
  const report = db.prepare(`
    SELECT m.id, m.case_number, m.name as matter_name, c.name as client_name,
           m.budget_limit,
           COALESCE(SUM(CASE WHEN t.is_billable = 1 THEN t.hours * t.rate_amount ELSE 0 END), 0) as used_amount
    FROM matters m
    LEFT JOIN clients c ON m.client_id = c.id
    LEFT JOIN time_entries t ON m.id = t.matter_id AND t.status != 'rejected'
    WHERE m.status = 'active'
    GROUP BY m.id
    ORDER BY used_amount DESC
  `).all();

  res.json({ success: true, data: report });
};

const getTimeSummary = (req, res) => {
  const { start_date, end_date, user_id, matter_id } = req.query;

  let query = `
    SELECT u.name as user_name, m.case_number, m.name as matter_name,
           c.name as client_name,
           COUNT(DISTINCT t.id) as entry_count,
           SUM(t.hours) as total_hours,
           SUM(CASE WHEN t.is_billable = 1 THEN t.hours ELSE 0 END) as billable_hours,
           SUM(CASE WHEN t.is_billable = 1 THEN t.hours * t.rate_amount ELSE 0 END) as billable_amount,
           t.status
    FROM time_entries t
    LEFT JOIN users u ON t.user_id = u.id
    LEFT JOIN matters m ON t.matter_id = m.id
    LEFT JOIN clients c ON m.client_id = c.id
    WHERE 1=1
  `;
  const params = [];

  if (start_date) { query += ' AND t.date >= ?'; params.push(start_date); }
  if (end_date) { query += ' AND t.date <= ?'; params.push(end_date); }
  if (user_id) { query += ' AND t.user_id = ?'; params.push(user_id); }
  if (matter_id) { query += ' AND t.matter_id = ?'; params.push(matter_id); }

  query += ' GROUP BY u.id, m.id, t.status ORDER BY total_hours DESC';

  const summary = db.prepare(query).all(...params);
  res.json({ success: true, data: summary });
};

const getRevenueReport = (req, res) => {
  const { start_date, end_date } = req.query;

  let query = `
    SELECT strftime('%Y-%m', i.created_at) as month,
           COUNT(*) as invoice_count,
           SUM(i.time_fee) as total_time_fee,
           SUM(i.fixed_fee) as total_fixed_fee,
           SUM(i.advance_fee) as total_advance_fee,
           SUM(i.tax) as total_tax,
           SUM(i.total_amount) as total_amount,
           SUM(i.paid_amount) as total_paid
    FROM invoices i
    WHERE i.status != 'draft'
  `;
  const params = [];

  if (start_date) { query += ' AND i.created_at >= ?'; params.push(start_date); }
  if (end_date) { query += ' AND i.created_at <= ?'; params.push(end_date); }

  query += ' GROUP BY month ORDER BY month DESC';

  const report = db.prepare(query).all(...params);
  res.json({ success: true, data: report });
};

module.exports = { getBudgetReport, getTimeSummary, getRevenueReport };
