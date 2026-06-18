import { Router } from 'express';
import { authMiddleware, roleMiddleware, AuthRequest } from '../middleware/auth.js';
import { success, error, paginated } from '../utils/response.js';
import { queryMany, queryOne, execute, transaction } from '../db.js';
import type { Product, ProductBatch, TraceRecord, Inventory, Promotion, PromotionRule } from '../../shared/types.js';

const router = Router();

router.get('/products', authMiddleware, (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;
    const category = req.query.category as string;
    const keyword = req.query.keyword as string;

    let whereClause = 'WHERE status = ?';
    const params: unknown[] = ['active'];

    if (category) {
      whereClause += ' AND category = ?';
      params.push(category);
    }
    if (keyword) {
      whereClause += ' AND (name LIKE ? OR code LIKE ?';
      params.push(`%${keyword}%`, `%${keyword}%`);
    }

    const offset = (page - 1) * pageSize;

    const products = queryMany<Product>(
      `SELECT * FROM products ${whereClause} ORDER BY id DESC LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    );

    const countResult = queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM products ${whereClause}`,
      params
    );

    const transformed = products.map(p => ({
      ...p,
      originalPrice: (p as unknown as { original_price: number }).original_price,
      imageUrl: (p as unknown as { image_url: string }).image_url,
      specs: (p as unknown as { specs: string }).specs ? JSON.parse((p as unknown as { specs: string }).specs) : {},
    }));

    res.json(paginated(transformed, countResult?.count || 0, page, pageSize));
  } catch {
    res.status(500).json(error('获取产品列表失败', 500));
  }
});

router.get('/products/:id', authMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    const product = queryOne<Product>('SELECT * FROM products WHERE id = ?', [id]);

    if (!product) {
      res.status(404).json(error('产品不存在', 404));
      return;
    }

    const batches = queryMany<ProductBatch>(
      'SELECT * FROM product_batches WHERE product_id = ? ORDER BY created_at DESC LIMIT 10',
      [id]
    );

    const transformed: Product = {
      ...product,
      originalPrice: (product as unknown as { original_price: number }).original_price,
      imageUrl: (product as unknown as { image_url: string }).image_url,
      specs: (product as unknown as { specs: string }).specs ? JSON.parse((product as unknown as { specs: string }).specs) : {},
    };

    res.json(success({ ...transformed, batches }));
  } catch {
    res.status(500).json(error('获取产品详情失败', 500));
  }
});

router.get('/products/trace/:batchNo', authMiddleware, (req, res) => {
  try {
    const { batchNo } = req.params;

    const batch = queryOne<ProductBatch & { product_name?: string }>(
      `SELECT pb.*, p.name as product_name 
       FROM product_batches pb 
       LEFT JOIN products p ON pb.product_id = p.id
       WHERE pb.batch_no = ?`,
      [batchNo]
    );

    if (!batch) {
      res.status(404).json(error('批次不存在', 404));
      return;
    }

    const records = queryMany<TraceRecord>(
      'SELECT * FROM trace_records WHERE batch_no = ? ORDER BY timestamp ASC',
      [batchNo]
    );

    res.json(success({ batch, records }));
  } catch {
    res.status(500).json(error('获取溯源信息失败', 500));
  }
});

router.get('/inventory', authMiddleware, roleMiddleware(['store_owner', 'operator', 'admin']), (req: AuthRequest, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;
    const warehouseId = req.query.warehouseId as string;

    let whereClause = '';
    const params: unknown[] = [];

    if (req.user?.role === 'store_owner') {
      whereClause = 'WHERE i.warehouse_id IN (SELECT id FROM stores WHERE owner_id = ?)';
      params.push(req.user.userId);
    } else if (warehouseId) {
      whereClause = 'WHERE i.warehouse_id = ?';
      params.push(warehouseId);
    }

    const offset = (page - 1) * pageSize;

    const inventory = queryMany<Inventory>(
      `SELECT i.*, p.name as product_name
       FROM inventory i
       LEFT JOIN products p ON i.product_id = p.id
       ${whereClause}
       ORDER BY i.last_sync_at DESC
       LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    );

    const countResult = queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM inventory i ${whereClause}`,
      params
    );

    const transformed = inventory.map(i => ({
      ...i,
      productName: (i as unknown as { product_name: string }).product_name,
      availableQuantity: (i as unknown as { available_quantity: number }).available_quantity,
      lastSyncAt: (i as unknown as { last_sync_at: string }).last_sync_at,
    }));

    res.json(paginated(transformed, countResult?.count || 0, page, pageSize));
  } catch {
    res.status(500).json(error('获取库存数据失败', 500));
  }
});

router.post('/inventory/sync', authMiddleware, roleMiddleware(['store_owner', 'operator', 'admin']), (req, res) => {
  try {
    const { inventoryId, quantity } = req.body;

    execute(
      'UPDATE inventory SET quantity = ?, available_quantity = ?, last_sync_at = CURRENT_TIMESTAMP WHERE id = ?',
      [quantity, quantity, inventoryId]
    );

    res.json(success({ synced: true }, '库存同步成功'));
  } catch {
    res.status(500).json(error('库存同步失败', 500));
  }
});

router.get('/promotions', authMiddleware, roleMiddleware(['operator', 'admin', 'sales', 'store_owner']), (req, res) => {
  try {
    const promotions = queryMany<Promotion>(
      'SELECT * FROM promotions ORDER BY created_at DESC'
    );

    const transformed = promotions.map((p) => {
      const rules = queryMany<PromotionRule>(
        'SELECT condition_type as conditionType, condition_value as conditionValue, discount_type as discountType, discount_value as discountValue FROM promotion_rules WHERE promotion_id = ?',
        [p.id]
      );

      return {
        ...p,
        startTime: (p as unknown as { start_time: string }).start_time,
        endTime: (p as unknown as { end_time: string }).end_time,
        rules,
      };
    });

    res.json(success(transformed));
  } catch {
    res.status(500).json(error('获取促销活动失败', 500));
  }
});

router.post('/promotions', authMiddleware, roleMiddleware(['operator', 'admin']), (req, res) => {
  try {
    const { name, type, startTime, endTime, rules } = req.body;

    transaction(() => {
      const result = execute(
        'INSERT INTO promotions (name, type, start_time, end_time, status) VALUES (?, ?, ?, ?, ?)',
        [name, type, startTime, endTime, 'active']
      );

      const promotionId = result.lastInsertRowid as number;

      for (const rule of rules) {
        execute(
          'INSERT INTO promotion_rules (promotion_id, condition_type, condition_value, discount_type, discount_value) VALUES (?, ?, ?, ?, ?)',
          [promotionId, rule.conditionType, rule.conditionValue, rule.discountType, rule.discountValue]
        );
      }
    });

    res.json(success({ created: true }, '促销活动创建成功'));
  } catch {
    res.status(500).json(error('创建促销活动失败', 500));
  }
});

export default router;
