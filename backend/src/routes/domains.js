const express = require('express');
const Joi = require('joi');
const db = require('../database');

const router = express.Router();

const domainSchema = Joi.object({
  root_domain: Joi.string().required(),
  sub_domain: Joi.string().default('@'),
  business_owner: Joi.string().allow(''),
  dns_provider: Joi.string().allow(''),
  cert_type: Joi.string().valid('DV', 'OV', 'EV').default('DV'),
  contact_person: Joi.string().allow(''),
  contact_email: Joi.string().email().allow(''),
  priority_level: Joi.string().valid('high', 'medium', 'low').default('medium'),
  status: Joi.string().valid('active', 'inactive', 'pending').default('active'),
  notes: Joi.string().allow('')
});

router.get('/', (req, res) => {
  const { sort = 'expiry', order = 'asc', search = '', status = '', priority = '' } = req.query;
  
  let query = `
    SELECT d.*, 
           c.expiry_date,
           c.status as cert_status,
           c.ca_provider,
           julianday(c.expiry_date) - julianday('now') as days_left
    FROM domains d
    LEFT JOIN certificates c ON d.id = c.domain_id
    WHERE 1=1
  `;
  const params = [];

  if (search) {
    query += ` AND (d.full_domain LIKE ? OR d.business_owner LIKE ? OR d.contact_person LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  if (status) {
    query += ` AND d.status = ?`;
    params.push(status);
  }

  if (priority) {
    query += ` AND d.priority_level = ?`;
    params.push(priority);
  }

  const sortFields = {
    'expiry': 'c.expiry_date',
    'domain': 'd.full_domain',
    'priority': "CASE d.priority_level WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END",
    'created': 'd.created_at'
  };

  query += ` ORDER BY ${sortFields[sort] || sortFields.expiry} ${order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC'}`;

  const domains = db.prepare(query).all(...params);
  
  domains.forEach(d => {
    d.days_left = d.days_left ? Math.floor(d.days_left) : null;
  });

  res.json({ domains });
});

router.get('/:id', (req, res) => {
  const domain = db.prepare('SELECT * FROM domains WHERE id = ?').get(req.params.id);
  
  if (!domain) {
    return res.status(404).json({ error: '域名不存在' });
  }

  const certificates = db.prepare('SELECT * FROM certificates WHERE domain_id = ? ORDER BY created_at DESC').all(req.params.id);
  const logs = db.prepare('SELECT * FROM change_logs WHERE domain_id = ? ORDER BY created_at DESC LIMIT 20').all(req.params.id);

  res.json({ domain, certificates, logs });
});

router.post('/', (req, res) => {
  const { error, value } = domainSchema.validate(req.body);
  
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  const full_domain = value.sub_domain === '@' ? value.root_domain : `${value.sub_domain}.${value.root_domain}`;

  try {
    const stmt = db.prepare(`
      INSERT INTO domains (root_domain, sub_domain, full_domain, business_owner, dns_provider, cert_type, contact_person, contact_email, priority_level, status, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      value.root_domain,
      value.sub_domain,
      full_domain,
      value.business_owner,
      value.dns_provider,
      value.cert_type,
      value.contact_person,
      value.contact_email,
      value.priority_level,
      value.status,
      value.notes
    );

    db.prepare(`
      INSERT INTO change_logs (domain_id, change_type, action, description, operator)
      VALUES (?, ?, ?, ?, ?)
    `).run(result.lastInsertRowid, 'domain', '创建', `创建域名 ${full_domain}`, req.user.username);

    const domain = db.prepare('SELECT * FROM domains WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ domain });
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(400).json({ error: '该域名已存在' });
    }
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', (req, res) => {
  const { error, value } = domainSchema.validate(req.body);
  
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  const oldDomain = db.prepare('SELECT * FROM domains WHERE id = ?').get(req.params.id);
  
  if (!oldDomain) {
    return res.status(404).json({ error: '域名不存在' });
  }

  const full_domain = value.sub_domain === '@' ? value.root_domain : `${value.sub_domain}.${value.root_domain}`;

  try {
    const stmt = db.prepare(`
      UPDATE domains 
      SET root_domain = ?, sub_domain = ?, full_domain = ?, business_owner = ?, dns_provider = ?, 
          cert_type = ?, contact_person = ?, contact_email = ?, priority_level = ?, status = ?, 
          notes = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    stmt.run(
      value.root_domain,
      value.sub_domain,
      full_domain,
      value.business_owner,
      value.dns_provider,
      value.cert_type,
      value.contact_person,
      value.contact_email,
      value.priority_level,
      value.status,
      value.notes,
      req.params.id
    );

    db.prepare(`
      INSERT INTO change_logs (domain_id, change_type, action, description, old_value, new_value, operator)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(req.params.id, 'domain', '更新', `更新域名信息`, JSON.stringify(oldDomain), JSON.stringify(value), req.user.username);

    const domain = db.prepare('SELECT * FROM domains WHERE id = ?').get(req.params.id);
    res.json({ domain });
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(400).json({ error: '该域名已存在' });
    }
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', (req, res) => {
  const domain = db.prepare('SELECT * FROM domains WHERE id = ?').get(req.params.id);
  
  if (!domain) {
    return res.status(404).json({ error: '域名不存在' });
  }

  db.prepare('DELETE FROM domains WHERE id = ?').run(req.params.id);

  db.prepare(`
    INSERT INTO change_logs (change_type, action, description, operator)
    VALUES (?, ?, ?, ?)
  `).run('domain', '删除', `删除域名 ${domain.full_domain}`, req.user.username);

  res.json({ message: '删除成功' });
});

module.exports = router;
