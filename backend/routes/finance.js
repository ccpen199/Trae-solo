const express = require('express');
const { db } = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

function parseJSONFields(product) {
  if (!product) return product;
  try {
    product.params = JSON.parse(product.params || '{}');
  } catch (e) {}
  return product;
}

router.get('/products', (req, res) => {
  try {
    const type = req.query.type;
    let sql = 'SELECT * FROM finance_products WHERE 1=1';
    const params = [];

    if (type) {
      sql += ' AND type = ?';
      params.push(type);
    }

    sql += ' ORDER BY created_at DESC';
    const products = db.prepare(sql).all(...params).map(parseJSONFields);

    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message, code: 500 });
  }
});

router.get('/products/:id', (req, res) => {
  try {
    const product = db.prepare('SELECT * FROM finance_products WHERE id = ?').get(req.params.id);
    if (!product) {
      return res.status(404).json({ error: '金融产品不存在', code: 404 });
    }
    res.json(parseJSONFields(product));
  } catch (err) {
    res.status(500).json({ error: err.message, code: 500 });
  }
});

router.post('/products', authMiddleware, (req, res) => {
  try {
    const { name, type, params = {}, rate, term, max_amount, status = 'active' } = req.body;
    if (!name || !type) {
      return res.status(400).json({ error: '产品名称和类型不能为空', code: 400 });
    }

    const result = db.prepare(
      `INSERT INTO finance_products (name, type, params, rate, term, max_amount, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(name, type, JSON.stringify(params), rate || null, term || null, max_amount || null, status);

    res.json({ id: result.lastInsertRowid, message: '创建成功' });
  } catch (err) {
    res.status(500).json({ error: err.message, code: 500 });
  }
});

router.put('/products/:id', authMiddleware, (req, res) => {
  try {
    const { name, type, params, rate, term, max_amount, status } = req.body;
    const product = db.prepare('SELECT * FROM finance_products WHERE id = ?').get(req.params.id);
    if (!product) {
      return res.status(404).json({ error: '金融产品不存在', code: 404 });
    }

    db.prepare(
      `UPDATE finance_products SET name = COALESCE(?, name), type = COALESCE(?, type),
       params = COALESCE(?, params), rate = COALESCE(?, rate),
       term = COALESCE(?, term), max_amount = COALESCE(?, max_amount),
       status = COALESCE(?, status) WHERE id = ?`
    ).run(
      name || null, type || null,
      params ? JSON.stringify(params) : null,
      rate || null, term || null, max_amount || null, status || null,
      req.params.id
    );

    res.json({ message: '更新成功' });
  } catch (err) {
    res.status(500).json({ error: err.message, code: 500 });
  }
});

router.post('/applications', (req, res) => {
  try {
    const { farmer_id, product_id, amount } = req.body;
    if (!farmer_id || !product_id || !amount) {
      return res.status(400).json({ error: '农户ID、产品ID和申请金额不能为空', code: 400 });
    }

    const farmer = db.prepare('SELECT * FROM farmers WHERE id = ?').get(farmer_id);
    if (!farmer) {
      return res.status(404).json({ error: '农户不存在', code: 404 });
    }

    const product = db.prepare('SELECT * FROM finance_products WHERE id = ?').get(product_id);
    if (!product) {
      return res.status(404).json({ error: '金融产品不存在', code: 404 });
    }

    const result = db.prepare(
      `INSERT INTO finance_applications (farmer_id, product_id, amount, status)
       VALUES (?, ?, ?, 'pending')`
    ).run(farmer_id, product_id, amount);

    res.json({ id: result.lastInsertRowid, message: '申请已提交，等待审核', status: 'pending' });
  } catch (err) {
    res.status(500).json({ error: err.message, code: 500 });
  }
});

router.get('/applications', authMiddleware, (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const status = req.query.status;
    const farmer_id = req.query.farmer_id;

    let sql = `SELECT fa.*, f.name as farmer_name, fp.name as product_name, fp.type as product_type
               FROM finance_applications fa
               LEFT JOIN farmers f ON fa.farmer_id = f.id
               LEFT JOIN finance_products fp ON fa.product_id = fp.id
               WHERE 1=1`;
    const params = [];

    if (status) {
      sql += ' AND fa.status = ?';
      params.push(status);
    }
    if (farmer_id) {
      sql += ' AND fa.farmer_id = ?';
      params.push(farmer_id);
    }

    sql += ' ORDER BY fa.created_at DESC LIMIT ? OFFSET ?';
    params.push(pageSize, (page - 1) * pageSize);

    const applications = db.prepare(sql).all(...params);

    const countSql = 'SELECT COUNT(*) as total FROM finance_applications fa WHERE 1=1';
    const countParams = params.slice(0, -2);
    const { total } = db.prepare(countSql).all(...countParams)[0];

    res.json({ data: applications, total, page, pageSize });
  } catch (err) {
    res.status(500).json({ error: err.message, code: 500 });
  }
});

router.put('/applications/:id', authMiddleware, (req, res) => {
  try {
    const { status, review_note } = req.body;
    const app = db.prepare('SELECT * FROM finance_applications WHERE id = ?').get(req.params.id);
    if (!app) {
      return res.status(404).json({ error: '申请记录不存在', code: 404 });
    }

    if (!['pending', 'approved', 'rejected', 'disbursed'].includes(status)) {
      return res.status(400).json({ error: '无效的状态值', code: 400 });
    }

    db.prepare(
      `UPDATE finance_applications SET status = ?, review_note = ?, updated_at = datetime('now') WHERE id = ?`
    ).run(status, review_note || null, req.params.id);

    res.json({ message: '审核完成', status });
  } catch (err) {
    res.status(500).json({ error: err.message, code: 500 });
  }
});

module.exports = router;
