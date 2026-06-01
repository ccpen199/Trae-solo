const express = require('express');
const Joi = require('joi');
const db = require('../database');

const router = express.Router();

const certSchema = Joi.object({
  domain_id: Joi.number().required(),
  ca_provider: Joi.string().required(),
  serial_number: Joi.string().allow(''),
  common_name: Joi.string().required(),
  san_list: Joi.string().allow(''),
  key_storage: Joi.string().allow(''),
  deploy_locations: Joi.string().allow(''),
  auto_renew: Joi.boolean().default(false),
  issue_date: Joi.string().isoDate().allow(''),
  expiry_date: Joi.string().isoDate().required(),
  algorithm: Joi.string().default('RSA-2048'),
  status: Joi.string().valid('valid', 'expiring_soon', 'expired', 'revoked').default('valid'),
  cert_content: Joi.string().allow(''),
  private_key_path: Joi.string().allow('')
});

router.get('/', (req, res) => {
  const { sort = 'expiry', order = 'asc', search = '', status = '', ca = '' } = req.query;
  
  let query = `
    SELECT c.*, d.full_domain, d.business_owner, d.contact_person,
           julianday(c.expiry_date) - julianday('now') as days_left
    FROM certificates c
    LEFT JOIN domains d ON c.domain_id = d.id
    WHERE 1=1
  `;
  const params = [];

  if (search) {
    query += ` AND (c.common_name LIKE ? OR c.serial_number LIKE ? OR d.full_domain LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  if (status) {
    query += ` AND c.status = ?`;
    params.push(status);
  }

  if (ca) {
    query += ` AND c.ca_provider LIKE ?`;
    params.push(`%${ca}%`);
  }

  const sortFields = {
    'expiry': 'c.expiry_date',
    'issued': 'c.issue_date',
    'domain': 'd.full_domain',
    'created': 'c.created_at'
  };

  query += ` ORDER BY ${sortFields[sort] || sortFields.expiry} ${order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC'}`;

  const certificates = db.prepare(query).all(...params);
  
  certificates.forEach(c => {
    c.days_left = c.days_left ? Math.floor(c.days_left) : null;
    c.auto_renew = !!c.auto_renew;
  });

  res.json({ certificates });
});

router.get('/:id', (req, res) => {
  const cert = db.prepare(`
    SELECT c.*, d.full_domain, d.business_owner, d.contact_person
    FROM certificates c
    LEFT JOIN domains d ON c.domain_id = d.id
    WHERE c.id = ?
  `).get(req.params.id);
  
  if (!cert) {
    return res.status(404).json({ error: '证书不存在' });
  }

  cert.days_left = Math.floor((new Date(cert.expiry_date) - new Date()) / (1000 * 60 * 60 * 24));
  cert.auto_renew = !!cert.auto_renew;

  const tasks = db.prepare('SELECT * FROM renewal_tasks WHERE cert_id = ? ORDER BY created_at DESC').all(req.params.id);
  const logs = db.prepare('SELECT * FROM change_logs WHERE cert_id = ? ORDER BY created_at DESC LIMIT 20').all(req.params.id);

  res.json({ certificate: cert, tasks, logs });
});

router.post('/', (req, res) => {
  const { error, value } = certSchema.validate(req.body);
  
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  try {
    const stmt = db.prepare(`
      INSERT INTO certificates (domain_id, ca_provider, serial_number, common_name, san_list,
                                key_storage, deploy_locations, auto_renew, issue_date, expiry_date,
                                algorithm, status, cert_content, private_key_path)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      value.domain_id,
      value.ca_provider,
      value.serial_number,
      value.common_name,
      value.san_list,
      value.key_storage,
      value.deploy_locations,
      value.auto_renew ? 1 : 0,
      value.issue_date || null,
      value.expiry_date,
      value.algorithm,
      value.status,
      value.cert_content,
      value.private_key_path
    );

    db.prepare(`
      INSERT INTO change_logs (domain_id, cert_id, change_type, action, description, operator)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(value.domain_id, result.lastInsertRowid, 'certificate', '创建', `创建证书 ${value.common_name}`, req.user.username);

    const cert = db.prepare('SELECT * FROM certificates WHERE id = ?').get(result.lastInsertRowid);
    cert.auto_renew = !!cert.auto_renew;
    res.status(201).json({ certificate: cert });
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(400).json({ error: '序列号已存在' });
    }
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', (req, res) => {
  const { error, value } = certSchema.validate(req.body);
  
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  const oldCert = db.prepare('SELECT * FROM certificates WHERE id = ?').get(req.params.id);
  
  if (!oldCert) {
    return res.status(404).json({ error: '证书不存在' });
  }

  try {
    const stmt = db.prepare(`
      UPDATE certificates 
      SET domain_id = ?, ca_provider = ?, serial_number = ?, common_name = ?, san_list = ?,
          key_storage = ?, deploy_locations = ?, auto_renew = ?, issue_date = ?, expiry_date = ?,
          algorithm = ?, status = ?, cert_content = ?, private_key_path = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    stmt.run(
      value.domain_id,
      value.ca_provider,
      value.serial_number,
      value.common_name,
      value.san_list,
      value.key_storage,
      value.deploy_locations,
      value.auto_renew ? 1 : 0,
      value.issue_date || null,
      value.expiry_date,
      value.algorithm,
      value.status,
      value.cert_content,
      value.private_key_path,
      req.params.id
    );

    db.prepare(`
      INSERT INTO change_logs (domain_id, cert_id, change_type, action, description, old_value, new_value, operator)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(value.domain_id, req.params.id, 'certificate', '更新', `更新证书信息`, JSON.stringify(oldCert), JSON.stringify(value), req.user.username);

    const cert = db.prepare('SELECT * FROM certificates WHERE id = ?').get(req.params.id);
    cert.auto_renew = !!cert.auto_renew;
    res.json({ certificate: cert });
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(400).json({ error: '序列号已存在' });
    }
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', (req, res) => {
  const cert = db.prepare('SELECT * FROM certificates WHERE id = ?').get(req.params.id);
  
  if (!cert) {
    return res.status(404).json({ error: '证书不存在' });
  }

  db.prepare('DELETE FROM certificates WHERE id = ?').run(req.params.id);

  db.prepare(`
    INSERT INTO change_logs (change_type, action, description, operator)
    VALUES (?, ?, ?, ?)
  `).run('certificate', '删除', `删除证书 ${cert.common_name}`, req.user.username);

  res.json({ message: '删除成功' });
});

module.exports = router;
