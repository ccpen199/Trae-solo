import { Router } from 'express';
import { db } from '../database';
import { authMiddleware, AuthRequest, adminMiddleware } from '../middleware/auth';
import { promotionEngine } from '../services/promotion';

const router = Router();

router.get('/categories', (_req, res) => {
  try {
    const categories = db.prepare(`
      SELECT c.*, (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id AND p.status = 1) as product_count
      FROM categories c ORDER BY c.sort ASC
    `).all();
    res.json({ success: true, data: categories });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.get('/products', (req, res) => {
  try {
    const { categoryId, keyword, sort = 'sort', page = 1, pageSize = 20, hot }: any = req.query;
    const wheres: string[] = ['p.status = 1'];
    const params: any[] = [];

    if (categoryId) {
      wheres.push('p.category_id = ?');
      params.push(categoryId);
    }
    if (keyword) {
      wheres.push('(p.name LIKE ? OR p.description LIKE ?)');
      params.push(`%${keyword}%`, `%${keyword}%`);
    }
    if (hot === '1') {
      wheres.push('p.is_hot = 1');
    }

    const whereSql = 'WHERE ' + wheres.join(' AND ');
    const totalRow: any = db.prepare(`SELECT COUNT(*) as cnt FROM products p ${whereSql}`).get(...params);

    let sortSql = 'p.sort ASC, p.id DESC';
    if (sort === 'price_asc') sortSql = 'p.price ASC';
    else if (sort === 'price_desc') sortSql = 'p.price DESC';
    else if (sort === 'hot') sortSql = 'p.is_hot DESC, p.sort ASC';
    else if (sort === 'newest') sortSql = 'p.created_at DESC';

    const offset = (Number(page) - 1) * Number(pageSize);
    params.push(Number(pageSize), offset);

    const products = db.prepare(`
      SELECT p.*, c.name as category_name, s.name as supplier_name, s.code as supplier_code
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      ${whereSql}
      ORDER BY ${sortSql}
      LIMIT ? OFFSET ?
    `).all(...params);

    res.json({
      success: true,
      data: {
        list: products,
        total: totalRow.cnt,
        page: Number(page),
        pageSize: Number(pageSize),
        hasMore: offset + products.length < totalRow.cnt
      }
    });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.get('/products/hot', (_req, res) => {
  try {
    const products = db.prepare(`
      SELECT p.*, c.name as category_name, c.icon as category_icon
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.status = 1 AND p.is_hot = 1
      ORDER BY p.sort ASC LIMIT 20
    `).all();
    res.json({ success: true, data: products });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.get('/products/:id', (req, res) => {
  try {
    const product: any = db.prepare(`
      SELECT p.*, c.name as category_name, s.name as supplier_name, s.code as supplier_code
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      WHERE p.id = ?
    `).get(req.params.id);

    if (!product) return res.status(404).json({ success: false, message: '商品不存在' });

    res.json({ success: true, data: product });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.post('/calculate-price', authMiddleware, (req: AuthRequest, res) => {
  try {
    const result = promotionEngine.calculate({
      items: req.body.items,
      userId: req.userId,
      couponCode: req.body.couponCode
    });
    res.json({ success: true, data: result });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.get('/promotions', (_req, res) => {
  try {
    const promotions = promotionEngine.getActivePromotions();
    res.json({ success: true, data: promotions });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.post('/products', authMiddleware, adminMiddleware, (req: AuthRequest, res) => {
  try {
    const { name, categoryId, supplierId, supplierProductId, skuType, faceValue, price,
      costPrice, commissionRate, stock, image, description, isHot, rechargeType, regionLimit } = req.body;

    const id = require('../utils').generateId();
    const t = require('../utils').now();

    db.prepare(`
      INSERT INTO products (id, name, category_id, supplier_id, supplier_product_id, sku_type,
        face_value, price, cost_price, commission_rate, stock, image, description, status,
        sort, is_hot, recharge_type, region_limit, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0, ?, ?, ?, ?, ?)
    `).run(id, name, categoryId, supplierId, supplierProductId, skuType,
      faceValue, price, costPrice, commissionRate || 0.05, stock || 0, image, description,
      isHot ? 1 : 0, rechargeType || 'auto', regionLimit || null, t, t);

    res.json({ success: true, data: { id } });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

export default router;
