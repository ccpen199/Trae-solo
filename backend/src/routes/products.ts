import { Router, Request, Response } from 'express';
import { db } from '../models/database';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  try {
    const { category, page = '1', pageSize = '10' } = req.query;
    const offset = (Number(page) - 1) * Number(pageSize);

    let countSql = 'SELECT COUNT(*) as total FROM products';
    let listSql = 'SELECT * FROM products';
    const params: any[] = [];

    if (category) {
      countSql += ' WHERE category = ?';
      listSql += ' WHERE category = ?';
      params.push(category);
    }

    listSql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';

    const total = (db.prepare(countSql).get(...params) as any).total;
    const products = db.prepare(listSql).all(...params, Number(pageSize), offset);

    res.json({
      success: true,
      data: { list: products, total, page: Number(page), pageSize: Number(pageSize) }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/', authMiddleware, (req: Request, res: Response) => {
  try {
    if (req.user!.role !== 'admin') {
      return res.status(403).json({ success: false, message: '无权操作' });
    }

    const { sku, name, brand, category, price, erp_stock, aftersales_parts, description, image_url } = req.body;
    if (!sku || !name || !brand || !price) {
      return res.status(400).json({ success: false, message: '缺少必填字段' });
    }

    const result = db.prepare(
      'INSERT INTO products (sku, name, brand, category, price, erp_stock, aftersales_parts, description, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(sku, name, brand, category || null, price, erp_stock || 0, aftersales_parts || 0, description || null, image_url || null);

    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ success: true, data: product });
  } catch (error: any) {
    if (error.message.includes('UNIQUE')) {
      return res.status(409).json({ success: false, message: 'SKU已存在' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:id', authMiddleware, (req: Request, res: Response) => {
  try {
    if (req.user!.role !== 'admin') {
      return res.status(403).json({ success: false, message: '无权操作' });
    }

    const { id } = req.params;
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(id) as any;
    if (!product) {
      return res.status(404).json({ success: false, message: '产品不存在' });
    }

    const { sku, name, brand, category, price, erp_stock, aftersales_parts, description, image_url } = req.body;
    db.prepare(
      `UPDATE products SET sku = COALESCE(?, sku), name = COALESCE(?, name), brand = COALESCE(?, brand),
       category = COALESCE(?, category), price = COALESCE(?, price), erp_stock = COALESCE(?, erp_stock),
       aftersales_parts = COALESCE(?, aftersales_parts), description = COALESCE(?, description),
       image_url = COALESCE(?, image_url) WHERE id = ?`
    ).run(sku || null, name || null, brand || null, category || null, price || null, erp_stock ?? null, aftersales_parts ?? null, description || null, image_url || null, id);

    const updated = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/:id/stock', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const product = db.prepare('SELECT id, sku, name, brand, erp_stock, aftersales_parts FROM products WHERE id = ?').get(id) as any;
    if (!product) {
      return res.status(404).json({ success: false, message: '产品不存在' });
    }

    res.json({
      success: true,
      data: {
        product_id: product.id,
        sku: product.sku,
        name: product.name,
        brand: product.brand,
        erp_stock: product.erp_stock,
        aftersales_parts: product.aftersales_parts,
        total_available: product.erp_stock + product.aftersales_parts,
        stock_status: product.erp_stock > 10 ? '充足' : product.erp_stock > 0 ? '紧张' : '缺货'
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
