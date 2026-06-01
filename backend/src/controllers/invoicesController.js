const { db } = require('../models/database');
const dayjs = require('dayjs');

const getInvoices = (req, res) => {
  const invoices = db.prepare(`
    SELECT i.*, c.name as client_name, m.name as matter_name, m.case_number
    FROM invoices i
    LEFT JOIN clients c ON i.client_id = c.id
    LEFT JOIN matters m ON i.matter_id = m.id
    ORDER BY i.created_at DESC
  `).all();
  res.json({ success: true, data: invoices });
};

const getInvoiceById = (req, res) => {
  const invoice = db.prepare(`
    SELECT i.*, c.name as client_name, m.name as matter_name, m.case_number
    FROM invoices i
    LEFT JOIN clients c ON i.client_id = c.id
    LEFT JOIN matters m ON i.matter_id = m.id
    WHERE i.id = ?
  `).get(req.params.id);

  if (!invoice) {
    return res.status(404).json({ success: false, message: '账单不存在' });
  }

  const timeEntries = db.prepare(`
    SELECT t.*, u.name as user_name
    FROM time_entries t
    LEFT JOIN users u ON t.user_id = u.id
    WHERE t.invoice_id = ?
  `).all(req.params.id);

  const payments = db.prepare('SELECT * FROM payments WHERE invoice_id = ?').all(req.params.id);

  res.json({ success: true, data: { ...invoice, time_entries: timeEntries, payments } });
};

const createInvoice = (req, res) => {
  const { client_id, matter_id, time_entry_ids, fixed_fee, advance_fee, tax_rate, discount, notes } = req.body;

  const invoice_number = 'INV-' + dayjs().format('YYYYMMDDHHmmss');

  let time_fee = 0;
  let total_hours = 0;

  if (time_entry_ids && time_entry_ids.length > 0) {
    const placeholders = time_entry_ids.map(() => '?').join(',');
    const entries = db.prepare(`
      SELECT * FROM time_entries
      WHERE id IN (${placeholders}) AND status = 'approved' AND invoice_id IS NULL
    `).all(...time_entry_ids);

    entries.forEach(entry => {
      if (entry.is_billable) {
        time_fee += entry.hours * (entry.rate_amount || 0);
        total_hours += entry.hours;
      }
    });
  }

  const tax = (time_fee + (fixed_fee || 0) + (advance_fee || 0)) * ((tax_rate || 6) / 100);
  const total_amount = time_fee + (fixed_fee || 0) + (advance_fee || 0) + tax - (discount || 0);

  try {
    const result = db.prepare(
      'INSERT INTO invoices (invoice_number, client_id, matter_id, total_hours, time_fee, fixed_fee, advance_fee, tax, discount, total_amount, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(invoice_number, client_id, matter_id, total_hours, time_fee, fixed_fee || 0, advance_fee || 0, tax, discount || 0, total_amount, notes);

    const invoice_id = result.lastInsertRowid;

    if (time_entry_ids && time_entry_ids.length > 0) {
      const placeholders = time_entry_ids.map(() => '?').join(',');
      db.prepare(`UPDATE time_entries SET invoice_id = ? WHERE id IN (${placeholders})`).run(invoice_id, ...time_entry_ids);
    }

    res.json({ success: true, data: { id: invoice_id, invoice_number, total_amount } });
  } catch (err) {
    res.status(400).json({ success: false, message: '创建账单失败' });
  }
};

const updateInvoiceStatus = (req, res) => {
  const { status } = req.body;
  const id = req.params.id;

  try {
    let updateField = '';
    if (status === 'client_confirmed') {
      updateField = ', client_confirmed_at = CURRENT_TIMESTAMP';
    } else if (status === 'invoiced') {
      updateField = ', invoiced_at = CURRENT_TIMESTAMP';
    }

    db.prepare(`UPDATE invoices SET status = ? ${updateField} WHERE id = ?`).run(status, id);
    res.json({ success: true, message: '状态更新成功' });
  } catch (err) {
    res.status(400).json({ success: false, message: '更新失败' });
  }
};

const recordPayment = (req, res) => {
  const { invoice_id, amount, payment_date, payment_method, notes } = req.body;

  try {
    db.prepare(
      'INSERT INTO payments (invoice_id, amount, payment_date, payment_method, notes) VALUES (?, ?, ?, ?, ?)'
    ).run(invoice_id, amount, payment_date, payment_method, notes);

    const invoice = db.prepare('SELECT paid_amount, total_amount FROM invoices WHERE id = ?').get(invoice_id);
    const new_paid_amount = invoice.paid_amount + amount;
    const new_status = new_paid_amount >= invoice.total_amount ? 'paid' : 'partially_paid';

    db.prepare('UPDATE invoices SET paid_amount = ?, status = ?, paid_at = CASE WHEN ? >= total_amount THEN CURRENT_TIMESTAMP ELSE paid_at END WHERE id = ?')
      .run(new_paid_amount, new_status, new_paid_amount, invoice_id);

    res.json({ success: true, message: '付款记录成功' });
  } catch (err) {
    res.status(400).json({ success: false, message: '记录失败' });
  }
};

const reopenInvoice = (req, res) => {
  const id = req.params.id;

  try {
    db.prepare('UPDATE time_entries SET invoice_id = NULL WHERE invoice_id = ?').run(id);
    db.prepare('DELETE FROM payments WHERE invoice_id = ?').run(id);
    db.prepare('UPDATE invoices SET status = ?, paid_amount = 0, client_confirmed_at = NULL, invoiced_at = NULL, paid_at = NULL WHERE id = ?')
      .run('draft', id);
    res.json({ success: true, message: '账单已重新打开' });
  } catch (err) {
    res.status(400).json({ success: false, message: '重新打开失败' });
  }
};

module.exports = { getInvoices, getInvoiceById, createInvoice, updateInvoiceStatus, recordPayment, reopenInvoice };
