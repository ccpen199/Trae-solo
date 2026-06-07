import { Router } from 'express';
import db from '../db/database.js';
import { authMiddleware } from '../middleware/auth.js';
import { AuthenticatedRequest } from '../types/index.js';

const router = Router();
router.use(authMiddleware);

router.get('/', (req: AuthenticatedRequest, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.pageSize || req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const category = req.query.category as string;
    const supplierId = req.query.supplierId as string;
    const stockWarning = (req.query.stockWarning ?? req.query.stock_warning) as string | boolean | undefined;

    const conditions: string[] = [];
    const params: any[] = [];

    if (category) {
      conditions.push('m.category = ?');
      params.push(category);
    }
    if (supplierId) {
      conditions.push('m.supplier_id = ?');
      params.push(supplierId);
    }
    if (stockWarning === true || stockWarning === 'true') {
      conditions.push('m.stock <= m.min_stock');
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const total = (db.prepare(`SELECT COUNT(*) as count FROM materials m ${whereClause}`).get(...params) as any).count;
    const materials = db.prepare(
      `SELECT m.*, u.name as supplier_name
       FROM materials m
       JOIN users u ON m.supplier_id = u.id
       ${whereClause}
       ORDER BY m.updated_at DESC LIMIT ? OFFSET ?`
    ).all(...params, limit, offset);

    res.json({ success: true, data: { list: materials, total, page, limit, pageSize: limit } });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取材料列表失败' });
  }
});

router.post('/', (req: AuthenticatedRequest, res) => {
  try {
    const { name, brand, category, specification, unit_price, stock, min_stock, image_url, supplier_id } = req.body;
    if (!name || !unit_price) {
      return res.status(400).json({ success: false, error: '材料名称和单价不能为空' });
    }

    const result = db.prepare(
      `INSERT INTO materials (supplier_id, name, brand, category, specification, unit_price, stock, min_stock, image_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      supplier_id || req.user!.id,
      name,
      brand || null,
      category || null,
      specification || null,
      unit_price,
      stock || 0,
      min_stock || 0,
      image_url || null
    );

    res.status(201).json({ success: true, data: { id: result.lastInsertRowid } });
  } catch (error) {
    res.status(500).json({ success: false, error: '创建材料失败' });
  }
});

router.get('/stock-warnings', (req: AuthenticatedRequest, res) => {
  try {
    const materials = db.prepare(
      `SELECT m.*, u.name as supplier_name
       FROM materials m
       JOIN users u ON m.supplier_id = u.id
       WHERE m.stock <= m.min_stock AND m.status = 'active'
       ORDER BY (m.min_stock - m.stock) DESC`
    ).all();
    res.json({ success: true, data: materials });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取库存预警失败' });
  }
});

router.get('/:id', (req: AuthenticatedRequest, res) => {
  try {
    const material = db.prepare(
      `SELECT m.*, u.name as supplier_name
       FROM materials m
       JOIN users u ON m.supplier_id = u.id WHERE m.id = ?`
    ).get(req.params.id);
    if (!material) {
      return res.status(404).json({ success: false, error: '材料不存在' });
    }
    res.json({ success: true, data: material });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取材料信息失败' });
  }
});

function updateMaterial(req: AuthenticatedRequest, res: any) {
  try {
    const { name, brand, category, specification, unit_price, stock, min_stock, image_url, status } = req.body;

    const material = db.prepare('SELECT * FROM materials WHERE id = ?').get(req.params.id) as any;
    if (!material) {
      return res.status(404).json({ success: false, error: '材料不存在' });
    }

    db.prepare(
      `UPDATE materials SET name = ?, brand = ?, category = ?, specification = ?, unit_price = ?, stock = ?, min_stock = ?, image_url = ?, status = ?, updated_at = datetime('now') WHERE id = ?`
    ).run(
      name ?? material.name,
      brand ?? material.brand,
      category ?? material.category,
      specification ?? material.specification,
      unit_price ?? material.unit_price,
      stock ?? material.stock,
      min_stock ?? material.min_stock,
      image_url ?? material.image_url,
      status ?? material.status,
      req.params.id
    );

    res.json({ success: true, data: { id: req.params.id } });
  } catch (error) {
    res.status(500).json({ success: false, error: '更新材料失败' });
  }
}

router.put('/:id', updateMaterial);
router.patch('/:id', updateMaterial);

router.delete('/:id', (req: AuthenticatedRequest, res) => {
  try {
    const material = db.prepare('SELECT * FROM materials WHERE id = ?').get(req.params.id);
    if (!material) {
      return res.status(404).json({ success: false, error: '材料不存在' });
    }
    const orderCount = (db.prepare('SELECT COUNT(*) as count FROM material_orders WHERE material_id = ?').get(req.params.id) as any).count;
    if (orderCount > 0) {
      db.prepare("UPDATE materials SET status = 'inactive', updated_at = datetime('now') WHERE id = ?").run(req.params.id);
    } else {
      db.prepare('DELETE FROM materials WHERE id = ?').run(req.params.id);
    }
    res.json({ success: true, data: { id: req.params.id } });
  } catch {
    res.status(500).json({ success: false, error: '删除材料失败' });
  }
});

router.get('/:id/orders', (req: AuthenticatedRequest, res) => {
  try {
    const orders = db.prepare(
      `SELECT mo.*, p.title as project_title
       FROM material_orders mo
       JOIN projects p ON mo.project_id = p.id
       WHERE mo.material_id = ?
       ORDER BY mo.created_at DESC`
    ).all(req.params.id);
    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取材料订单失败' });
  }
});

router.post('/orders', (req: AuthenticatedRequest, res) => {
  try {
    const { material_id, project_id, quantity } = req.body;
    if (!material_id || !project_id || !quantity) {
      return res.status(400).json({ success: false, error: '材料ID、项目ID和数量不能为空' });
    }

    const material = db.prepare('SELECT * FROM materials WHERE id = ?').get(material_id) as any;
    if (!material) {
      return res.status(404).json({ success: false, error: '材料不存在' });
    }

    if (material.stock < quantity) {
      return res.status(400).json({ success: false, error: `库存不足，当前库存: ${material.stock}` });
    }

    const totalPrice = material.unit_price * quantity;

    const result = db.prepare(
      `INSERT INTO material_orders (material_id, project_id, quantity, unit_price, total_price)
       VALUES (?, ?, ?, ?, ?)`
    ).run(material_id, project_id, quantity, material.unit_price, totalPrice);

    db.prepare("UPDATE materials SET stock = stock - ?, updated_at = datetime('now') WHERE id = ?").run(quantity, material_id);

    res.status(201).json({ success: true, data: { id: result.lastInsertRowid } });
  } catch (error) {
    res.status(500).json({ success: false, error: '创建材料订单失败' });
  }
});

router.get('/orders/list', (req: AuthenticatedRequest, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const status = req.query.status as string;

    let whereClause = '';
    const params: any[] = [];
    if (status) {
      whereClause = 'WHERE mo.status = ?';
      params.push(status);
    }

    const total = (db.prepare(`SELECT COUNT(*) as count FROM material_orders mo ${whereClause}`).get(...params) as any).count;
    const orders = db.prepare(
      `SELECT mo.*, m.name as material_name, m.brand as material_brand, p.title as project_title
       FROM material_orders mo
       JOIN materials m ON mo.material_id = m.id
       JOIN projects p ON mo.project_id = p.id
       ${whereClause}
       ORDER BY mo.created_at DESC LIMIT ? OFFSET ?`
    ).all(...params, limit, offset);

    res.json({ success: true, data: { list: orders, total, page, limit } });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取订单列表失败' });
  }
});

router.put('/orders/:id', (req: AuthenticatedRequest, res) => {
  try {
    const { status, logistics_info } = req.body;

    const order = db.prepare('SELECT * FROM material_orders WHERE id = ?').get(req.params.id) as any;
    if (!order) {
      return res.status(404).json({ success: false, error: '订单不存在' });
    }

    db.prepare(
      `UPDATE material_orders SET status = ?, logistics_info = ?, updated_at = datetime('now') WHERE id = ?`
    ).run(
      status ?? order.status,
      logistics_info ?? order.logistics_info,
      req.params.id
    );

    res.json({ success: true, data: { id: req.params.id } });
  } catch (error) {
    res.status(500).json({ success: false, error: '更新订单失败' });
  }
});

router.put('/orders/:id/return', (req: AuthenticatedRequest, res) => {
  try {
    const order = db.prepare('SELECT * FROM material_orders WHERE id = ?').get(req.params.id) as any;
    if (!order) {
      return res.status(404).json({ success: false, error: '订单不存在' });
    }

    if (order.status === 'returned') {
      return res.status(400).json({ success: false, error: '订单已退货' });
    }

    db.prepare("UPDATE material_orders SET status = ?, updated_at = datetime('now') WHERE id = ?").run('returned', req.params.id);
    db.prepare("UPDATE materials SET stock = stock + ?, updated_at = datetime('now') WHERE id = ?").run(order.quantity, order.material_id);

    res.json({ success: true, data: { id: req.params.id, returned_quantity: order.quantity } });
  } catch (error) {
    res.status(500).json({ success: false, error: '退货失败' });
  }
});

export default router;
