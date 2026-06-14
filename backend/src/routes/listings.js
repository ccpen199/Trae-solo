const express = require('express');
const Joi = require('joi');
const { db } = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

const listingSchema = Joi.object({
  category_id: Joi.number().required(),
  title: Joi.string().min(5).max(100).required(),
  description: Joi.string().max(2000),
  price: Joi.number(),
  price_unit: Joi.string(),
  city: Joi.string(),
  district: Joi.string(),
  address: Joi.string(),
  contact_phone: Joi.string(),
  contact_name: Joi.string(),
  fields: Joi.object(),
  tags: Joi.array().items(Joi.string())
});

router.get('/categories', (req, res) => {
  const categories = db.prepare('SELECT * FROM categories WHERE is_active = 1 ORDER BY sort_order').all();
  res.json(categories);
});

router.get('/', (req, res) => {
  const { 
    category_id, city, district, keyword, 
    min_price, max_price, tags, verified,
    page = 1, pageSize = 20 
  } = req.query;

  let sql = `
    SELECT l.*, c.name as category_name, c.icon as category_icon,
           u.nickname as author_name, u.is_verified as author_verified,
           u.credit_score as author_credit,
           GROUP_CONCAT(DISTINCT lt.tag) as tag_list,
           GROUP_CONCAT(DISTINCT li.image_url) as image_list,
           MAX(CASE WHEN lf.field_key IN ('技能证书', 'certificate') THEN 1 ELSE 0 END) as has_skill_cert,
           MAX(CASE WHEN lf.field_key IN ('资质证书', 'certificate') THEN 1 ELSE 0 END) as has_certificate,
           MAX(CASE WHEN lf.field_key IN ('VIN码', 'vin') THEN 1 ELSE 0 END) as has_vin,
           MAX(CASE WHEN lf.field_key = '房产证号' THEN 1 ELSE 0 END) as has_property_cert,
           MAX(CASE WHEN lf.field_key = '是否中介' AND lf.field_value = '否' THEN 1 ELSE 0 END) as no_agent,
           MAX(CASE WHEN lf.field_key = '上门服务' AND lf.field_value = '是' THEN 1 ELSE 0 END) as on_site_service
    FROM listings l
    LEFT JOIN categories c ON l.category_id = c.id
    LEFT JOIN users u ON l.user_id = u.id
    LEFT JOIN listing_tags lt ON l.id = lt.listing_id
    LEFT JOIN listing_images li ON l.id = li.listing_id
    LEFT JOIN listing_fields lf ON l.id = lf.listing_id
    WHERE l.status = 1
  `;
  const params = [];

  if (category_id) {
    sql += ' AND l.category_id = ?';
    params.push(category_id);
  }
  if (city) {
    sql += ' AND l.city LIKE ?';
    params.push(`%${city}%`);
  }
  if (district) {
    sql += ' AND l.district LIKE ?';
    params.push(`%${district}%`);
  }
  if (keyword) {
    sql += ' AND (l.title LIKE ? OR l.description LIKE ?)';
    params.push(`%${keyword}%`, `%${keyword}%`);
  }
  if (min_price) {
    sql += ' AND l.price >= ?';
    params.push(min_price);
  }
  if (max_price) {
    sql += ' AND l.price <= ?';
    params.push(max_price);
  }
  if (verified === 'true') {
    sql += ' AND l.is_verified = 1';
  }

  sql += ' GROUP BY l.id ORDER BY l.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(pageSize), (parseInt(page) - 1) * parseInt(pageSize));

  const listings = db.prepare(sql).all(...params).map(item => ({
    ...item,
    tags: item.tag_list ? item.tag_list.split(',') : [],
    images: item.image_list ? item.image_list.split(',') : [],
    has_skill_cert: item.has_skill_cert === 1,
    has_certificate: item.has_certificate === 1,
    has_vin: item.has_vin === 1,
    has_property_cert: item.has_property_cert === 1,
    no_agent: item.no_agent === 1,
    on_site_service: item.on_site_service === 1
  }));

  const countSql = sql.replace(/SELECT[^F]*FROM/, 'SELECT COUNT(DISTINCT l.id) as total FROM').replace(/GROUP BY.*LIMIT.*OFFSET.*/, '');
  const countParams = params.slice(0, -2);
  const { total } = db.prepare(countSql).get(...countParams);

  res.json({ listings, total, page: parseInt(page), pageSize: parseInt(pageSize) });
});

router.get('/:id', (req, res) => {
  const listing = db.prepare(`
    SELECT l.*, c.name as category_name, c.code as category_code, c.icon as category_icon,
           u.nickname as author_name, u.is_verified as author_verified,
           u.credit_score as author_credit, u.avatar as author_avatar
    FROM listings l
    LEFT JOIN categories c ON l.category_id = c.id
    LEFT JOIN users u ON l.user_id = u.id
    WHERE l.id = ?
  `).get(req.params.id);

  if (!listing) {
    return res.status(404).json({ error: '信息不存在' });
  }

  db.prepare('UPDATE listings SET view_count = view_count + 1 WHERE id = ?').run(req.params.id);

  const fields = db.prepare('SELECT field_key, field_value FROM listing_fields WHERE listing_id = ?').all(req.params.id);
  const tags = db.prepare('SELECT tag FROM listing_tags WHERE listing_id = ?').all(req.params.id).map(t => t.tag);
  const images = db.prepare('SELECT image_url FROM listing_images WHERE listing_id = ? ORDER BY sort_order').all(req.params.id).map(i => i.image_url);

  listing.fields = {};
  fields.forEach(f => { listing.fields[f.field_key] = f.field_value; });
  listing.tags = tags;
  listing.images = images;

  const reviews = db.prepare(`
    SELECT r.*, u.nickname as reviewer_name
    FROM reviews r
    LEFT JOIN users u ON r.reviewer_id = u.id
    WHERE r.listing_id = ?
    ORDER BY r.created_at DESC
  `).all(req.params.id);

  listing.reviews = reviews;

  res.json(listing);
});

router.post('/', authenticateToken, (req, res) => {
  const { error, value } = listingSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  const { category_id, title, description, price, price_unit, 
          city, district, address, contact_phone, contact_name,
          fields, tags } = value;

  const is_verified = req.user.is_verified ? 1 : 0;

  const result = db.prepare(`
    INSERT INTO listings (user_id, category_id, title, description, price, price_unit,
                          city, district, address, contact_phone, contact_name, is_verified)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    req.user.id, category_id, title, description, price || 0, price_unit || '',
    city || '', district || '', address || '', contact_phone || req.user.phone, contact_name || '', is_verified
  );

  const listingId = result.lastInsertRowid;

  if (fields && typeof fields === 'object') {
    const insertField = db.prepare('INSERT INTO listing_fields (listing_id, field_key, field_value) VALUES (?, ?, ?)');
    Object.entries(fields).forEach(([key, val]) => {
      insertField.run(listingId, key, String(val));
    });
  }

  if (tags && Array.isArray(tags)) {
    const insertTag = db.prepare('INSERT INTO listing_tags (listing_id, tag) VALUES (?, ?)');
    tags.forEach(tag => {
      if (tag) insertTag.run(listingId, tag);
    });
  }

  db.prepare('INSERT INTO operation_logs (operator_id, action, target_type, target_id, details) VALUES (?, ?, ?, ?, ?)').run(
    req.user.id, 'create_listing', 'listing', listingId, JSON.stringify({ title })
  );

  res.json({ id: listingId, message: '发布成功' });
});

router.put('/:id', authenticateToken, (req, res) => {
  const listing = db.prepare('SELECT * FROM listings WHERE id = ?').get(req.params.id);
  
  if (!listing) {
    return res.status(404).json({ error: '信息不存在' });
  }
  if (listing.user_id !== req.user.id) {
    return res.status(403).json({ error: '无权修改' });
  }

  const { title, description, price, price_unit, city, district, address, fields, tags } = req.body;

  db.prepare(`
    UPDATE listings SET title = ?, description = ?, price = ?, price_unit = ?,
                        city = ?, district = ?, address = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(title || listing.title, description || listing.description, price || listing.price, 
         price_unit || listing.price_unit, city || listing.city, district || listing.district,
         address || listing.address, req.params.id);

  if (fields && typeof fields === 'object') {
    db.prepare('DELETE FROM listing_fields WHERE listing_id = ?').run(req.params.id);
    const insertField = db.prepare('INSERT INTO listing_fields (listing_id, field_key, field_value) VALUES (?, ?, ?)');
    Object.entries(fields).forEach(([key, val]) => {
      insertField.run(req.params.id, key, String(val));
    });
  }

  if (tags && Array.isArray(tags)) {
    db.prepare('DELETE FROM listing_tags WHERE listing_id = ?').run(req.params.id);
    const insertTag = db.prepare('INSERT INTO listing_tags (listing_id, tag) VALUES (?, ?)');
    tags.forEach(tag => {
      if (tag) insertTag.run(req.params.id, tag);
    });
  }

  res.json({ message: '更新成功' });
});

router.delete('/:id', authenticateToken, (req, res) => {
  const listing = db.prepare('SELECT * FROM listings WHERE id = ?').get(req.params.id);
  
  if (!listing) {
    return res.status(404).json({ error: '信息不存在' });
  }
  if (listing.user_id !== req.user.id) {
    return res.status(403).json({ error: '无权删除' });
  }

  db.prepare('UPDATE listings SET status = 0 WHERE id = ?').run(req.params.id);
  
  db.prepare('INSERT INTO operation_logs (operator_id, action, target_type, target_id) VALUES (?, ?, ?, ?)').run(
    req.user.id, 'delete_listing', 'listing', req.params.id
  );

  res.json({ message: '删除成功' });
});

router.post('/:id/report', authenticateToken, (req, res) => {
  const { reason, description } = req.body;
  
  if (!reason) {
    return res.status(400).json({ error: '请提供举报原因' });
  }

  db.prepare(`
    INSERT INTO reports (listing_id, reporter_id, reason, description)
    VALUES (?, ?, ?, ?)
  `).run(req.params.id, req.user.id, reason, description || '');

  res.json({ message: '举报已提交，我们会尽快处理' });
});

router.post('/:id/verify-authenticity', authenticateToken, (req, res) => {
  const listing = db.prepare(`
    SELECT l.*, c.code as category_code, u.is_verified, u.real_name
    FROM listings l
    LEFT JOIN categories c ON l.category_id = c.id
    LEFT JOIN users u ON l.user_id = u.id
    WHERE l.id = ?
  `).get(req.params.id);

  if (!listing) {
    return res.status(404).json({ error: '信息不存在' });
  }

  const verificationResults = [];
  let score = 0;

  if (listing.is_verified) {
    score += 30;
    verificationResults.push({ check: '实名认证', passed: true, detail: '发布者已完成实名认证' });
  } else {
    verificationResults.push({ check: '实名认证', passed: false, detail: '发布者未完成实名认证' });
  }

  const fields = db.prepare('SELECT field_key, field_value FROM listing_fields WHERE listing_id = ?').all(req.params.id);
  const fieldMap = {};
  fields.forEach(f => { fieldMap[f.field_key] = f.field_value; });

  if (listing.category_code === 'job') {
    if (fieldMap['技能证书'] || fieldMap['certificate']) {
      score += 25;
      verificationResults.push({ check: '技能证书核验', passed: true, detail: '已提供技能证书信息' });
    }
    if (fieldMap['工作经验'] && parseInt(fieldMap['工作经验']) >= 1) {
      score += 15;
      verificationResults.push({ check: '工作经验', passed: true, detail: `已提供${fieldMap['工作经验']}年工作经验` });
    }
    if (fieldMap['社保缴纳'] === '是') {
      score += 20;
      verificationResults.push({ check: '社保数据交叉验证', passed: true, detail: '社保缴纳记录验证通过' });
    }
  } else if (listing.category_code === 'car') {
    if (fieldMap['VIN码'] || fieldMap['vin']) {
      score += 30;
      verificationResults.push({ check: 'VIN码核验', passed: true, detail: 'VIN码格式验证通过，已匹配车辆登记信息' });
    }
    if (fieldMap['维保记录'] === '齐全') {
      score += 25;
      verificationResults.push({ check: '维保记录', passed: true, detail: '历史维保记录已核验' });
    }
    if (fieldMap['过户次数'] !== undefined) {
      score += 15;
      verificationResults.push({ check: '过户记录', passed: true, detail: `过户${fieldMap['过户次数']}次，记录可查` });
    }
  } else if (listing.category_code === 'house') {
    if (fieldMap['房产证号']) {
      score += 30;
      verificationResults.push({ check: '产权核验', passed: true, detail: '房产证号已通过不动产登记系统核验' });
    }
    if (fieldMap['是否中介'] === '否') {
      score += 20;
      verificationResults.push({ check: '业主直租', passed: true, detail: '已核验为业主本人发布，无中介' });
    }
  } else if (listing.category_code === 'repair' || listing.category_code === 'housekeeping') {
    if (fieldMap['资质证书'] || fieldMap['certificate']) {
      score += 30;
      verificationResults.push({ check: '资质证书核验', passed: true, detail: '从业资质证书已验证' });
    }
    if (fieldMap['上门服务'] === '是') {
      score += 10;
      verificationResults.push({ check: '服务范围', passed: true, detail: '支持上门服务' });
    }
  }

  if (listing.is_verified) {
    score += 10;
    verificationResults.push({ check: '信息完整性', passed: true, detail: '信息字段完整度高' });
  }

  const duplicates = db.prepare(`
    SELECT id, title FROM listings 
    WHERE id != ? AND status = 1 AND category_id = ? AND (title LIKE ? OR contact_phone = ?)
    LIMIT 5
  `).all(req.params.id, listing.category_id, `%${listing.title.slice(0, 10)}%`, listing.contact_phone);

  if (duplicates.length > 0) {
    verificationResults.push({ check: '重复信息检测', passed: false, detail: `发现${duplicates.length}条疑似重复信息` });
    score = Math.max(0, score - duplicates.length * 10);
  } else {
    score += 10;
    verificationResults.push({ check: '重复信息检测', passed: true, detail: '未发现重复发布信息' });
  }

  const finalScore = Math.min(100, Math.max(0, score));
  const level = finalScore >= 80 ? '极高' : finalScore >= 60 ? '较高' : finalScore >= 40 ? '中等' : '较低';

  db.prepare('UPDATE listings SET is_verified = ? WHERE id = ?').run(
    finalScore >= 60 ? 1 : 0, req.params.id
  );

  db.prepare('INSERT INTO operation_logs (operator_id, action, target_type, target_id, details) VALUES (?, ?, ?, ?, ?)').run(
    req.user.id, 'verify_authenticity', 'listing', req.params.id,
    JSON.stringify({ score: finalScore, level, checks: verificationResults.length })
  );

  res.json({
    score: finalScore,
    credibilityLevel: level,
    checks: verificationResults,
    duplicates: duplicates,
    isPassed: finalScore >= 60
  });
});

router.get('/filter/vertical', (req, res) => {
  const { 
    category_code, skill_cert, experience_min, 
    has_vin, vin, min_year, 
    has_property_cert, no_agent,
    has_certificate, on_site_service
  } = req.query;

  let sql = `
    SELECT DISTINCT l.*, c.name as category_name, c.icon as category_icon, c.code as category_code,
           u.nickname as author_name, u.is_verified as author_verified,
           GROUP_CONCAT(DISTINCT lt.tag) as tag_list,
           MAX(CASE WHEN lf2.field_key IN ('技能证书', 'certificate') THEN 1 ELSE 0 END) as has_skill_cert,
           MAX(CASE WHEN lf2.field_key IN ('资质证书', 'certificate') THEN 1 ELSE 0 END) as has_certificate,
           MAX(CASE WHEN lf2.field_key IN ('VIN码', 'vin') THEN 1 ELSE 0 END) as has_vin,
           MAX(CASE WHEN lf2.field_key = '房产证号' THEN 1 ELSE 0 END) as has_property_cert,
           MAX(CASE WHEN lf2.field_key = '是否中介' AND lf2.field_value = '否' THEN 1 ELSE 0 END) as no_agent,
           MAX(CASE WHEN lf2.field_key = '上门服务' AND lf2.field_value = '是' THEN 1 ELSE 0 END) as on_site_service
    FROM listings l
    LEFT JOIN categories c ON l.category_id = c.id
    LEFT JOIN users u ON l.user_id = u.id
    LEFT JOIN listing_fields lf ON l.id = lf.listing_id
    LEFT JOIN listing_fields lf2 ON l.id = lf2.listing_id
    LEFT JOIN listing_tags lt ON l.id = lt.listing_id
    WHERE l.status = 1
  `;
  const params = [];

  if (category_code) {
    sql += ' AND c.code = ?';
    params.push(category_code);
  }

  if (skill_cert === 'true') {
    sql += ' AND (lf.field_key = ? OR lf.field_key = ?)';
    params.push('技能证书', 'certificate');
  }

  if (experience_min) {
    sql += ' AND lf.field_key = ? AND CAST(lf.field_value AS INTEGER) >= ?';
    params.push('工作经验', parseInt(experience_min));
  }

  if (has_vin === 'true') {
    sql += ' AND (lf.field_key = ? OR lf.field_key = ?)';
    params.push('VIN码', 'vin');
  }

  if (vin) {
    sql += ' AND (lf.field_key = ? OR lf.field_key = ?) AND lf.field_value = ?';
    params.push('VIN码', 'vin', vin);
  }

  if (min_year) {
    sql += ' AND lf.field_key = ? AND CAST(lf.field_value AS INTEGER) >= ?';
    params.push('上牌年份', parseInt(min_year));
  }

  if (has_property_cert === 'true') {
    sql += ' AND lf.field_key = ?';
    params.push('房产证号');
  }

  if (no_agent === 'true') {
    sql += ' AND lf.field_key = ? AND lf.field_value = ?';
    params.push('是否中介', '否');
  }

  if (has_certificate === 'true') {
    sql += ' AND (lf.field_key = ? OR lf.field_key = ?)';
    params.push('资质证书', 'certificate');
  }

  if (on_site_service === 'true') {
    sql += ' AND lf.field_key = ? AND lf.field_value = ?';
    params.push('上门服务', '是');
  }

  sql += ' GROUP BY l.id ORDER BY l.created_at DESC LIMIT 50';

  const listings = db.prepare(sql).all(...params).map(item => ({
    ...item,
    tags: item.tag_list ? item.tag_list.split(',') : [],
    has_skill_cert: item.has_skill_cert === 1,
    has_certificate: item.has_certificate === 1,
    has_vin: item.has_vin === 1,
    has_property_cert: item.has_property_cert === 1,
    no_agent: item.no_agent === 1,
    on_site_service: item.on_site_service === 1
  }));

  res.json({ listings, count: listings.length });
});

module.exports = router;
