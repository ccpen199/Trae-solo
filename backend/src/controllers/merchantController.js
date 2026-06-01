const db = require('../models/database');

exports.applyMerchant = (req, res) => {
  const { company_name, business_license, license_image } = req.body;

  if (!company_name || !business_license) {
    return res.status(400).json({ error: '公司名称和营业执照号不能为空' });
  }

  const existing = db.prepare('SELECT id FROM merchants WHERE user_id = ?').get(req.user.id);
  if (existing) {
    return res.status(400).json({ error: '已提交商家申请' });
  }

  const result = db.prepare(`
    INSERT INTO merchants (user_id, company_name, business_license, license_image)
    VALUES (?, ?, ?, ?)
  `).run(req.user.id, company_name, business_license, license_image || null);

  db.prepare('UPDATE users SET user_type = ? WHERE id = ?').run('b', req.user.id);

  const merchant = db.prepare('SELECT * FROM merchants WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ merchant });
};

exports.getMerchantProfile = (req, res) => {
  const merchant = db.prepare(`
    SELECT m.*, u.nickname, u.phone, u.avatar
    FROM merchants m
    LEFT JOIN users u ON m.user_id = u.id
    WHERE m.user_id = ?
  `).get(req.user.id);

  if (!merchant) {
    return res.status(404).json({ error: '商家信息不存在' });
  }

  res.json({ merchant });
};

exports.getMerchantListings = (req, res) => {
  const merchant = db.prepare('SELECT id FROM merchants WHERE user_id = ?').get(req.user.id);
  if (!merchant) {
    return res.status(404).json({ error: '商家信息不存在' });
  }

  const { page = 1, page_size = 20, status } = req.query;
  
  let query = 'SELECT * FROM listings WHERE merchant_id = ?';
  const params = [merchant.id];

  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(page_size), (parseInt(page) - 1) * parseInt(page_size));

  const listings = db.prepare(query).all(...params);
  const { total } = db.prepare('SELECT COUNT(*) as total FROM listings WHERE merchant_id = ?' + (status ? ' AND status = ?' : '')).get(...params.slice(0, params.length - 2));

  res.json({ listings, total });
};

exports.getLeads = (req, res) => {
  const merchant = db.prepare('SELECT id FROM merchants WHERE user_id = ?').get(req.user.id);
  if (!merchant) {
    return res.status(404).json({ error: '商家信息不存在' });
  }

  const { status, page = 1, page_size = 20 } = req.query;

  let query = `
    SELECT l.*, u.nickname as user_name, u.phone as user_phone,
           lst.title as listing_title
    FROM leads l
    LEFT JOIN users u ON l.user_id = u.id
    LEFT JOIN listings lst ON l.listing_id = lst.id
    WHERE l.merchant_id = ?
  `;
  const params = [merchant.id];

  if (status) {
    query += ' AND l.status = ?';
    params.push(status);
  }

  query += ' ORDER BY l.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(page_size), (parseInt(page) - 1) * parseInt(page_size));

  const leads = db.prepare(query).all(...params);
  const { total } = db.prepare('SELECT COUNT(*) as total FROM leads WHERE merchant_id = ?' + (status ? ' AND status = ?' : '')).get(...params.slice(0, params.length - 2));

  res.json({ leads, total });
};

exports.updateLeadStatus = (req, res) => {
  const { lead_id, status } = req.body;

  const lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(lead_id);
  if (!lead) {
    return res.status(404).json({ error: '线索不存在' });
  }

  const merchant = db.prepare('SELECT id FROM merchants WHERE user_id = ?').get(req.user.id);
  if (lead.merchant_id !== merchant?.id && req.user.user_type !== 'admin') {
    return res.status(403).json({ error: '无权限修改' });
  }

  db.prepare('UPDATE leads SET status = ? WHERE id = ?').run(status, lead_id);
  const updated = db.prepare('SELECT * FROM leads WHERE id = ?').get(lead_id);
  res.json({ lead: updated });
};

exports.createLead = (req, res) => {
  const { listing_id, contact_info, message } = req.body;

  const listing = db.prepare('SELECT * FROM listings WHERE id = ?').get(listing_id);
  if (!listing) {
    return res.status(404).json({ error: '信息不存在' });
  }

  const result = db.prepare(`
    INSERT INTO leads (listing_id, user_id, merchant_id, contact_info, message)
    VALUES (?, ?, ?, ?, ?)
  `).run(listing_id, req.user.id, listing.merchant_id || null, contact_info, message);

  const lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ lead });
};
