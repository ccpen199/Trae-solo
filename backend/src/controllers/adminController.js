const db = require('../models/database');

exports.getDashboardStats = (req, res) => {
  const stats = {
    total_users: db.prepare('SELECT COUNT(*) as count FROM users').get().count,
    total_listings: db.prepare("SELECT COUNT(*) as count FROM listings WHERE status = 'active'").get().count,
    total_merchants: db.prepare('SELECT COUNT(*) as count FROM merchants WHERE is_approved = 1').get().count,
    pending_reports: db.prepare("SELECT COUNT(*) as count FROM reports WHERE status = 'pending'").get().count,
    pending_tickets: db.prepare("SELECT COUNT(*) as count FROM tickets WHERE status IN ('open', 'processing')").get().count,
    pending_merchants: db.prepare('SELECT COUNT(*) as count FROM merchants WHERE is_approved = 0').get().count
  };

  res.json({ stats });
};

exports.getMerchantApplications = (req, res) => {
  const { status, page = 1, page_size = 20 } = req.query;

  let query = `
    SELECT m.*, u.nickname, u.phone
    FROM merchants m
    LEFT JOIN users u ON m.user_id = u.id
  `;
  const params = [];

  if (status === 'pending') {
    query += ' WHERE m.is_approved = 0';
  } else if (status === 'approved') {
    query += ' WHERE m.is_approved = 1';
  }

  query += ' ORDER BY m.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(page_size), (parseInt(page) - 1) * parseInt(page_size));

  const merchants = db.prepare(query).all(...params);
  res.json({ merchants });
};

exports.approveMerchant = (req, res) => {
  const { merchant_id } = req.body;

  db.prepare(`
    UPDATE merchants 
    SET is_approved = 1, approved_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(merchant_id);

  const merchant = db.prepare('SELECT * FROM merchants WHERE id = ?').get(merchant_id);
  if (merchant) {
    db.prepare("UPDATE users SET user_type = 'b' WHERE id = ?").run(merchant.user_id);
  }

  res.json({ success: true });
};

exports.getReports = (req, res) => {
  const { status, page = 1, page_size = 20 } = req.query;

  let query = `
    SELECT r.*, u.nickname as reporter_name, l.title as listing_title
    FROM reports r
    LEFT JOIN users u ON r.reporter_id = u.id
    LEFT JOIN listings l ON r.listing_id = l.id
  `;
  const params = [];

  if (status) {
    query += ' WHERE r.status = ?';
    params.push(status);
  }

  query += ' ORDER BY r.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(page_size), (parseInt(page) - 1) * parseInt(page_size));

  const reports = db.prepare(query).all(...params);
  const { total } = db.prepare('SELECT COUNT(*) as total FROM reports' + (status ? ' WHERE status = ?' : '')).get(...params.slice(0, params.length - 2));

  res.json({ reports, total });
};

exports.handleReport = (req, res) => {
  const { report_id, status, handle_note, action } = req.body;

  const report = db.prepare('SELECT * FROM reports WHERE id = ?').get(report_id);
  if (!report) {
    return res.status(404).json({ error: '举报不存在' });
  }

  db.prepare(`
    UPDATE reports 
    SET status = ?, handler_id = ?, handled_at = CURRENT_TIMESTAMP, handle_note = ?
    WHERE id = ?
  `).run(status, req.user.id, handle_note, report_id);

  if (action === 'remove_listing' && report.listing_id) {
    db.prepare("UPDATE listings SET status = 'deleted' WHERE id = ?").run(report.listing_id);
  }

  res.json({ success: true });
};

exports.getTickets = (req, res) => {
  const { status, page = 1, page_size = 20 } = req.query;

  let query = `
    SELECT t.*, u.nickname as user_name
    FROM tickets t
    LEFT JOIN users u ON t.user_id = u.id
  `;
  const params = [];

  if (status) {
    query += ' WHERE t.status = ?';
    params.push(status);
  }

  query += ' ORDER BY t.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(page_size), (parseInt(page) - 1) * parseInt(page_size));

  const tickets = db.prepare(query).all(...params);
  const { total } = db.prepare('SELECT COUNT(*) as total FROM tickets' + (status ? ' WHERE status = ?' : '')).get(...params.slice(0, params.length - 2));

  res.json({ tickets, total });
};

exports.getTicketDetail = (req, res) => {
  const { id } = req.params;

  const ticket = db.prepare(`
    SELECT t.*, u.nickname as user_name
    FROM tickets t
    LEFT JOIN users u ON t.user_id = u.id
    WHERE t.id = ?
  `).get(id);

  if (!ticket) {
    return res.status(404).json({ error: '工单不存在' });
  }

  const messages = db.prepare(`
    SELECT m.*, u.nickname as sender_name
    FROM ticket_messages m
    LEFT JOIN users u ON m.sender_id = u.id
    WHERE m.ticket_id = ?
    ORDER BY m.created_at ASC
  `).all(id);

  res.json({ ticket, messages });
};

exports.replyTicket = (req, res) => {
  const { ticket_id, content, is_internal = false } = req.body;

  const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(ticket_id);
  if (!ticket) {
    return res.status(404).json({ error: '工单不存在' });
  }

  db.prepare(`
    INSERT INTO ticket_messages (ticket_id, sender_id, content, is_internal)
    VALUES (?, ?, ?, ?)
  `).run(ticket_id, req.user.id, content, is_internal ? 1 : 0);

  db.prepare(`
    UPDATE tickets SET status = 'processing', updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(ticket_id);

  res.json({ success: true });
};

exports.closeTicket = (req, res) => {
  const { ticket_id } = req.body;

  db.prepare("UPDATE tickets SET status = 'closed', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(ticket_id);
  res.json({ success: true });
};

exports.getFlaggedListings = (req, res) => {
  const { page = 1, page_size = 20 } = req.query;

  const listings = db.prepare(`
    SELECT l.*, f.score as fraud_score, u.nickname as author_name
    FROM listings l
    INNER JOIN fraud_detections f ON l.id = f.listing_id
    LEFT JOIN users u ON l.user_id = u.id
    WHERE f.is_flagged = 1 AND l.status = 'rejected'
    ORDER BY f.created_at DESC LIMIT ? OFFSET ?
  `).all(parseInt(page_size), (parseInt(page) - 1) * parseInt(page_size));

  res.json({ listings });
};
