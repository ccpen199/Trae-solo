const express = require('express');
const db = require('../db');
const { optionalAuth, authMiddleware } = require('../middleware/auth');
const { success, error, notFound, serverError } = require('../utils/response');

const router = express.Router();

router.get('/', optionalAuth, (req, res) => {
  try {
    const { page = 1, pageSize = 10, keyword, category } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(pageSize);

    let whereClause = `WHERE 1=1`;
    const params = [];

    if (keyword) {
      whereClause += ` AND (name LIKE ? OR brand LIKE ? OR description LIKE ?)`;
      params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
    }
    if (category) {
      whereClause += ` AND category = ?`;
      params.push(category);
    }

    const countQuery = `SELECT COUNT(*) as total FROM products ${whereClause}`;
    const { total } = db.prepare(countQuery).get(...params);

    const products = db.prepare(`
      SELECT p.*,
             (SELECT GROUP_CONCAT(pb.id) FROM product_bars pb WHERE pb.product_id = p.id AND pb.status = 'active') as bar_ids
      FROM products p
      ${whereClause}
      ORDER BY p.id DESC
      LIMIT ? OFFSET ?
    `).all(...params, parseInt(pageSize), offset);

    return success(res, {
      list: products,
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total
      }
    });
  } catch (err) {
    console.error('获取商品列表错误:', err);
    return serverError(res, '获取失败');
  }
});

router.get('/:id', optionalAuth, (req, res) => {
  try {
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    if (!product) {
      return notFound(res, '商品不存在');
    }

    const relatedBars = db.prepare(`
      SELECT pb.*, u.nickname as owner_nickname
      FROM product_bars pb
      LEFT JOIN users u ON pb.owner_id = u.id
      WHERE pb.product_id = ? AND pb.status = 'active'
      ORDER BY pb.member_count DESC, pb.view_count DESC
    `).all(req.params.id);

    return success(res, {
      ...product,
      related_bars: relatedBars
    });
  } catch (err) {
    console.error('获取商品详情错误:', err);
    return serverError(res, '获取失败');
  }
});

router.post('/', authMiddleware, (req, res) => {
  try {
    const { name, category, brand, description, cover_image, price, product_url } = req.body;

    if (!name || !name.trim()) {
      return error(res, '商品名称不能为空');
    }

    const result = db.prepare(`
      INSERT INTO products (name, category, brand, description, cover_image, price, product_url)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      name.trim(),
      category || null,
      brand || null,
      description || null,
      cover_image || null,
      price || 0,
      product_url || null
    );

    return success(res, { id: result.lastInsertRowid }, '商品添加成功');
  } catch (err) {
    console.error('添加商品错误:', err);
    return serverError(res, '添加失败');
  }
});

router.get('/:productId/bars', optionalAuth, (req, res) => {
  try {
    const bars = db.prepare(`
      SELECT pb.*, u.nickname as owner_nickname, u.avatar as owner_avatar
      FROM product_bars pb
      LEFT JOIN users u ON pb.owner_id = u.id
      WHERE pb.product_id = ? AND pb.status = 'active'
      ORDER BY pb.member_count DESC, pb.view_count DESC
    `).all(req.params.productId);

    return success(res, bars);
  } catch (err) {
    console.error('获取商品关联产品吧错误:', err);
    return serverError(res, '获取失败');
  }
});

module.exports = router;
