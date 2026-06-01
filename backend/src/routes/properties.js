const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateUser } = require('../middleware/auth');
const { validatePropertyRegNo, validateIdCard, crossValidate } = require('../utils/validators');

router.get('/', (req, res) => {
  const { region_code, type, keyword, min_price, max_price, rooms, page = 1, page_size = 20 } = req.query;
  let sql = `SELECT p.*, r.name as region_name FROM properties p
    LEFT JOIN admin_regions r ON p.region_code = r.code
    WHERE p.status = 1`;
  const params = [];
  if (type) {
    sql += ' AND p.type = ?';
    params.push(type);
  }
  if (region_code) {
    sql += ' AND p.region_code = ?';
    params.push(region_code);
  }
  if (keyword) {
    sql += ' AND (p.title LIKE ? OR p.address LIKE ? OR p.description LIKE ?)';
    const kw = `%${keyword}%`;
    params.push(kw, kw, kw);
  }
  if (min_price) {
    sql += ' AND p.price >= ?';
    params.push(parseFloat(min_price));
  }
  if (max_price) {
    sql += ' AND p.price <= ?';
    params.push(parseFloat(max_price));
  }
  if (rooms) {
    sql += ' AND p.rooms = ?';
    params.push(parseInt(rooms));
  }
  sql += ' ORDER BY p.property_verified DESC, p.landlord_id_verified DESC, p.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(page_size), (parseInt(page) - 1) * parseInt(page_size));
  const properties = db.prepare(sql).all(...params);
  const countSql = 'SELECT COUNT(*) as total FROM properties WHERE status = 1';
  const total = db.prepare(countSql).get().total;
  res.json({ properties, total, page: parseInt(page), page_size: parseInt(page_size) });
});

router.get('/:id', (req, res) => {
  const property = db.prepare(`SELECT p.*, r.name as region_name FROM properties p
    LEFT JOIN admin_regions r ON p.region_code = r.code
    WHERE p.id = ?`).get(req.params.id);
  if (!property) {
    return res.status(404).json({ error: '房源不存在' });
  }
  const verifications = db.prepare('SELECT * FROM property_verifications WHERE property_id = ? ORDER BY created_at DESC').all(req.params.id);
  res.json({ property, verifications });
});

router.post('/verify/property-reg', authenticateUser, (req, res) => {
  const { property_reg_no } = req.body;
  if (!property_reg_no) {
    return res.status(400).json({ error: '请输入不动产登记编号' });
  }
  const result = validatePropertyRegNo(property_reg_no);
  res.json(result);
});

router.post('/verify/landlord', authenticateUser, (req, res) => {
  const { landlord_name, landlord_id_card } = req.body;
  if (!landlord_name || !landlord_id_card) {
    return res.status(400).json({ error: '请输入房东姓名和身份证号' });
  }
  if (!validateIdCard(landlord_id_card)) {
    return res.json({ valid: false, reason: '身份证号格式不正确' });
  }
  const mockVerify = landlord_id_card.startsWith('110') && landlord_name.length >= 2;
  res.json({
    valid: mockVerify,
    reason: mockVerify ? '房东身份核验通过' : '房东身份核验失败，请检查信息',
    verified: mockVerify ? 1 : 0
  });
});

router.post('/', authenticateUser, (req, res) => {
  const { type, title, region_code, address, area, rooms, price, price_unit, property_reg_no, landlord_name, landlord_id_card, description, contact_name, contact_phone } = req.body;
  if (!type || !title || !region_code || !address || !price || !price_unit || !contact_name || !contact_phone) {
    return res.status(400).json({ error: '缺少必要参数' });
  }
  if (type === 'secondhand' && !property_reg_no) {
    return res.status(400).json({ error: '二手房源必须关联不动产登记编号' });
  }
  if (!landlord_name || !landlord_id_card) {
    return res.status(400).json({ error: '租房信息需上传房东身份核验凭证' });
  }
  let property_verified = 0;
  let landlord_id_verified = 0;
  if (property_reg_no) {
    const regVerify = validatePropertyRegNo(property_reg_no);
    property_verified = regVerify.valid ? 1 : 0;
    db.prepare(`
      INSERT INTO property_verifications (property_id, property_reg_no, verification_result, verified)
      VALUES (?, ?, ?, ?)
    `).run(0, property_reg_no, regVerify.reason, property_verified);
  }
  if (landlord_id_card && validateIdCard(landlord_id_card)) {
    landlord_id_verified = landlord_id_card.startsWith('110') ? 1 : 0;
  }
  const result = db.prepare(`
    INSERT INTO properties (type, title, region_code, address, area, rooms, price, price_unit, property_reg_no, landlord_id, landlord_name, landlord_id_card, landlord_id_verified, property_verified, description, contact_name, contact_phone, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(type, title, region_code, address, area, rooms, price, price_unit, property_reg_no, req.user.id, landlord_name, landlord_id_card, landlord_id_verified, property_verified, description, contact_name, contact_phone, req.user.id);
  const validation = crossValidate('property', result.lastInsertRowid, { type, price, title, description });
  if (property_reg_no) {
    db.prepare('UPDATE property_verifications SET property_id = ? WHERE property_reg_no = ?').run(result.lastInsertRowid, property_reg_no);
  }
  const property = db.prepare('SELECT * FROM properties WHERE id = ?').get(result.lastInsertRowid);
  res.json({ message: '发布成功', property, validation });
});

module.exports = router;
