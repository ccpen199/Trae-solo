const express = require('express');
const db = require('../database');

const router = express.Router();

router.get('/summary', (req, res) => {
  const totalDomains = db.prepare('SELECT COUNT(*) as count FROM domains').get().count;
  const totalCerts = db.prepare('SELECT COUNT(*) as count FROM certificates').get().count;
  const activeTasks = db.prepare("SELECT COUNT(*) as count FROM renewal_tasks WHERE status IN ('pending', 'in_progress')").get().count;
  const failedTasks = db.prepare("SELECT COUNT(*) as count FROM renewal_tasks WHERE status = 'failed'").get().count;

  const expiring30 = db.prepare(`
    SELECT COUNT(*) as count 
    FROM certificates 
    WHERE julianday(expiry_date) - julianday('now') <= 30 
      AND julianday(expiry_date) - julianday('now') > 0
      AND status != 'expired'
  `).get().count;

  const expired = db.prepare("SELECT COUNT(*) as count FROM certificates WHERE status = 'expired'").get().count;

  res.json({
    summary: {
      totalDomains,
      totalCerts,
      activeTasks,
      failedTasks,
      expiring30,
      expired
    }
  });
});

router.get('/risks', (req, res) => {
  const expiringSoon = db.prepare(`
    SELECT c.*, d.full_domain, d.business_owner, d.contact_person, d.priority_level,
           julianday(c.expiry_date) - julianday('now') as days_left
    FROM certificates c
    LEFT JOIN domains d ON c.domain_id = d.id
    WHERE julianday(c.expiry_date) - julianday('now') <= 30 
      AND julianday(c.expiry_date) - julianday('now') > 0
      AND c.status != 'expired'
    ORDER BY c.expiry_date ASC
  `).all();

  expiringSoon.forEach(c => c.days_left = Math.floor(c.days_left));

  const expired = db.prepare(`
    SELECT c.*, d.full_domain, d.business_owner, d.contact_person, d.priority_level,
           julianday(c.expiry_date) - julianday('now') as days_left
    FROM certificates c
    LEFT JOIN domains d ON c.domain_id = d.id
    WHERE c.status = 'expired'
    ORDER BY c.expiry_date DESC
  `).all();

  expired.forEach(c => c.days_left = Math.floor(c.days_left));

  const weakAlgorithms = db.prepare(`
    SELECT c.*, d.full_domain, d.business_owner, d.contact_person
    FROM certificates c
    LEFT JOIN domains d ON c.domain_id = d.id
    WHERE c.algorithm IN ('RSA-1024', 'MD5-RSA', 'SHA1-RSA')
       OR c.algorithm LIKE '%MD5%'
       OR c.algorithm LIKE '%SHA1%'
    ORDER BY c.created_at DESC
  `).all();

  const noContact = db.prepare(`
    SELECT d.*, c.expiry_date,
           julianday(c.expiry_date) - julianday('now') as days_left
    FROM domains d
    LEFT JOIN certificates c ON d.id = c.domain_id
    WHERE (d.contact_person IS NULL OR d.contact_person = '')
       OR (d.contact_email IS NULL OR d.contact_email = '')
    ORDER BY d.created_at DESC
  `).all();

  noContact.forEach(d => d.days_left = d.days_left ? Math.floor(d.days_left) : null);

  const mismatched = db.prepare(`
    SELECT c.*, d.full_domain
    FROM certificates c
    LEFT JOIN domains d ON c.domain_id = d.id
    WHERE c.common_name NOT LIKE '%' || d.root_domain || '%'
      AND d.full_domain IS NOT NULL
    LIMIT 50
  `).all();

  const failedTasks = db.prepare(`
    SELECT t.*, c.common_name, d.full_domain, d.business_owner
    FROM renewal_tasks t
    LEFT JOIN certificates c ON t.cert_id = c.id
    LEFT JOIN domains d ON t.domain_id = d.id
    WHERE t.status = 'failed'
    ORDER BY t.updated_at DESC
  `).all();

  const noAutoRenew = db.prepare(`
    SELECT c.*, d.full_domain, d.business_owner, d.contact_person,
           julianday(c.expiry_date) - julianday('now') as days_left
    FROM certificates c
    LEFT JOIN domains d ON c.domain_id = d.id
    WHERE c.auto_renew = 0
      AND c.status = 'valid'
    ORDER BY c.expiry_date ASC
    LIMIT 50
  `).all();

  noAutoRenew.forEach(c => c.days_left = Math.floor(c.days_left));

  res.json({
    risks: {
      expiringSoon,
      expired,
      weakAlgorithms,
      noContact,
      mismatched,
      failedTasks,
      noAutoRenew
    },
    counts: {
      expiringSoon: expiringSoon.length,
      expired: expired.length,
      weakAlgorithms: weakAlgorithms.length,
      noContact: noContact.length,
      mismatched: mismatched.length,
      failedTasks: failedTasks.length,
      noAutoRenew: noAutoRenew.length
    }
  });
});

router.get('/alerts', (req, res) => {
  const { is_read = '', type = '', level = '' } = req.query;
  
  let query = `
    SELECT a.*, d.full_domain, c.common_name
    FROM alerts a
    LEFT JOIN domains d ON a.domain_id = d.id
    LEFT JOIN certificates c ON a.cert_id = c.id
    WHERE 1=1
  `;
  const params = [];

  if (is_read !== '') {
    query += ` AND a.is_read = ?`;
    params.push(is_read === 'true' ? 1 : 0);
  }

  if (type) {
    query += ` AND a.type = ?`;
    params.push(type);
  }

  if (level) {
    query += ` AND a.level = ?`;
    params.push(level);
  }

  query += ` ORDER BY a.triggered_at DESC LIMIT 100`;

  const alerts = db.prepare(query).all(...params);

  alerts.forEach(a => {
    a.is_read = !!a.is_read;
  });

  res.json({ alerts });
});

router.post('/alerts/:id/read', (req, res) => {
  db.prepare('UPDATE alerts SET is_read = 1 WHERE id = ?').run(req.params.id);
  res.json({ message: '已标记为已读' });
});

router.post('/alerts/read-all', (req, res) => {
  db.prepare('UPDATE alerts SET is_read = 1 WHERE is_read = 0').run();
  res.json({ message: '全部标记为已读' });
});

router.get('/charts/cert-status', (req, res) => {
  const data = db.prepare(`
    SELECT 
      status,
      COUNT(*) as count
    FROM certificates
    GROUP BY status
  `).all();

  res.json({ data });
});

router.get('/charts/ca-distribution', (req, res) => {
  const data = db.prepare(`
    SELECT 
      ca_provider as name,
      COUNT(*) as value
    FROM certificates
    GROUP BY ca_provider
    ORDER BY value DESC
  `).all();

  res.json({ data });
});

router.get('/charts/dns-providers', (req, res) => {
  const data = db.prepare(`
    SELECT 
      dns_provider as name,
      COUNT(*) as value
    FROM domains
    WHERE dns_provider IS NOT NULL AND dns_provider != ''
    GROUP BY dns_provider
    ORDER BY value DESC
  `).all();

  res.json({ data });
});

router.get('/charts/task-status', (req, res) => {
  const data = db.prepare(`
    SELECT 
      status as name,
      COUNT(*) as value
    FROM renewal_tasks
    GROUP BY status
  `).all();

  res.json({ data });
});

module.exports = router;
