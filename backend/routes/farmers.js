const express = require('express');
const { db } = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

function parseJSONFields(farmer) {
  if (!farmer) return farmer;
  try {
    farmer.planting_tags = JSON.parse(farmer.planting_tags || '[]');
    farmer.breeding_tags = JSON.parse(farmer.breeding_tags || '[]');
  } catch (e) {}
  return farmer;
}

router.get('/', authMiddleware, (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const village = req.query.village;
    const keyword = req.query.keyword;
    const ocr_status = req.query.ocr_status;

    let where = 'WHERE 1=1';
    const params = [];

    if (village) {
      where += ' AND village = ?';
      params.push(village);
    }
    if (keyword) {
      where += ' AND (name LIKE ? OR phone LIKE ? OR id_card LIKE ?)';
      const kw = `%${keyword}%`;
      params.push(kw, kw, kw);
    }
    if (ocr_status) {
      where += ' AND ocr_status = ?';
      params.push(ocr_status);
    }

    let sql = `SELECT * FROM farmers ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    params.push(pageSize, (page - 1) * pageSize);

    const farmers = db.prepare(sql).all(...params).map(parseJSONFields);

    const countSql = `SELECT COUNT(*) as total FROM farmers ${where}`;
    const countParams = params.slice(0, -2);
    const { total } = db.prepare(countSql).all(...countParams)[0];

    res.json({ data: farmers, total, page, pageSize });
  } catch (err) {
    res.status(500).json({ error: err.message, code: 500 });
  }
});

router.get('/:id', authMiddleware, (req, res) => {
  try {
    const farmer = db.prepare('SELECT * FROM farmers WHERE id = ?').get(req.params.id);
    if (!farmer) {
      return res.status(404).json({ error: '农户信息不存在', code: 404 });
    }
    res.json(parseJSONFields(farmer));
  } catch (err) {
    res.status(500).json({ error: err.message, code: 500 });
  }
});

router.post('/', authMiddleware, (req, res) => {
  try {
    const { name, id_card, phone, village, land_area, land_cert_no, planting_tags = [], breeding_tags = [] } = req.body;
    if (!name) {
      return res.status(400).json({ error: '农户姓名不能为空', code: 400 });
    }

    const result = db.prepare(
      `INSERT INTO farmers (name, id_card, phone, village, land_area, land_cert_no, planting_tags, breeding_tags)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      name, id_card || null, phone || null, village || null,
      land_area || null, land_cert_no || null,
      JSON.stringify(planting_tags), JSON.stringify(breeding_tags)
    );

    res.json({ id: result.lastInsertRowid, message: '创建成功' });
  } catch (err) {
    res.status(500).json({ error: err.message, code: 500 });
  }
});

router.put('/:id', authMiddleware, (req, res) => {
  try {
    const { name, id_card, phone, village, land_area, land_cert_no, planting_tags, breeding_tags } = req.body;
    const farmer = db.prepare('SELECT * FROM farmers WHERE id = ?').get(req.params.id);
    if (!farmer) {
      return res.status(404).json({ error: '农户信息不存在', code: 404 });
    }

    db.prepare(
      `UPDATE farmers SET name = COALESCE(?, name), id_card = COALESCE(?, id_card),
       phone = COALESCE(?, phone), village = COALESCE(?, village),
       land_area = COALESCE(?, land_area), land_cert_no = COALESCE(?, land_cert_no),
       planting_tags = COALESCE(?, planting_tags), breeding_tags = COALESCE(?, breeding_tags),
       updated_at = datetime('now')
       WHERE id = ?`
    ).run(
      name || null, id_card || null, phone || null, village || null,
      land_area || null, land_cert_no || null,
      planting_tags ? JSON.stringify(planting_tags) : null,
      breeding_tags ? JSON.stringify(breeding_tags) : null,
      req.params.id
    );

    res.json({ message: '更新成功' });
  } catch (err) {
    res.status(500).json({ error: err.message, code: 500 });
  }
});

router.post('/:id/ocr', authMiddleware, (req, res) => {
  try {
    const farmer = db.prepare('SELECT * FROM farmers WHERE id = ?').get(req.params.id);
    if (!farmer) {
      return res.status(404).json({ error: '农户信息不存在', code: 404 });
    }

    const simulatedCertNo = 'LC' + String(Math.floor(100000 + Math.random() * 900000));
    const simulatedArea = (Math.random() * 10 + 1).toFixed(2);

    db.prepare(
      `UPDATE farmers SET ocr_status = 'completed', land_cert_no = ?, land_area = ?, updated_at = datetime('now') WHERE id = ?`
    ).run(simulatedCertNo, simulatedArea, req.params.id);

    res.json({
      message: 'OCR识别完成',
      ocr_status: 'completed',
      land_cert_no: simulatedCertNo,
      land_area: simulatedArea,
    });
  } catch (err) {
    res.status(500).json({ error: err.message, code: 500 });
  }
});

router.get('/:id/ocr-status', authMiddleware, (req, res) => {
  try {
    const farmer = db.prepare('SELECT ocr_status, land_cert_no, land_area FROM farmers WHERE id = ?').get(req.params.id);
    if (!farmer) {
      return res.status(404).json({ error: '农户信息不存在', code: 404 });
    }
    res.json({
      ocr_status: farmer.ocr_status,
      land_cert_no: farmer.land_cert_no,
      land_area: farmer.land_area,
    });
  } catch (err) {
    res.status(500).json({ error: err.message, code: 500 });
  }
});

module.exports = router;
