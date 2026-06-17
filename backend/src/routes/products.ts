import { Router } from 'express';
import { db } from '../database';
import { authMiddleware, AuthRequest, adminMiddleware } from '../middleware/auth';
import { promotionEngine } from '../services/promotion';
import { verifyToken, now, generateId } from '../utils';

const router = Router();

function formatBatchNo(timestamp: number): string {
  const d = new Date(timestamp * 1000);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hour = String(d.getHours()).padStart(2, '0');
  return `BATCH${year}${month}${day}${hour}`;
}

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

    const enriched = products.map((p: any) => {
      const ch: any[] = db.prepare(`
        SELECT rc.*, s.name as supplier_name
        FROM recharge_channels rc
        LEFT JOIN suppliers s ON rc.supplier_id = s.id
        WHERE rc.product_id = ?
        ORDER BY rc.priority ASC
      `).all(p.id);
      const activeChannels = ch.filter(c => c.status === 1);
      const inactiveChannels = ch.filter(c => c.status !== 1);
      const hasFallback = ch.length > 1;
      const regionLimits: any[] = db.prepare('SELECT region_code FROM region_limits WHERE product_id = ? AND allow = 1').all(p.id);
      const regionLimited = p.region_limit ? 1 : (regionLimits.length > 0 ? 1 : 0);
      const syncBatch = p.updated_at ? formatBatchNo(p.updated_at) : null;

      const supplierChannels = ch.filter(c => c.supplier_id === p.supplier_id);
      const supplierSuccessRate = supplierChannels.length > 0
        ? Math.round(supplierChannels.reduce((sum, c) => sum + (c.success_rate || 0), 0) / supplierChannels.length * 100) / 100
        : 0.95;

      const allSuppliers = db.prepare(`
        SELECT DISTINCT s.id, s.name, s.code, s.status as supplier_status,
          (SELECT COUNT(*) FROM recharge_channels rc WHERE rc.supplier_id = s.id AND rc.product_id = ? AND rc.status = 1) as active_channels,
          (SELECT COUNT(*) FROM recharge_channels rc WHERE rc.supplier_id = s.id AND rc.product_id = ?) as total_channels,
          (SELECT p2.stock FROM products p2 WHERE p2.supplier_id = s.id AND p2.category_id = ? AND p2.status = 1 LIMIT 1) as supplier_stock
        FROM suppliers s
        INNER JOIN recharge_channels rc ON rc.supplier_id = s.id
        WHERE rc.product_id = ?
        ORDER BY s.id = ? DESC, active_channels DESC
      `).all(p.id, p.id, p.category_id, p.id, p.supplier_id);

      const syncHistory: any[] = db.prepare(`
        SELECT before_stock as before, after_stock as after, variance, sync_time as time, sync_batch
        FROM stock_sync_history
        WHERE product_id = ?
        ORDER BY sync_time DESC
        LIMIT 3
      `).all(p.id);

      const mainChannel = ch.find(c => c.status === 1) || ch[0];
      const backupChannels = ch.filter((c, idx) => idx > 0 && c.status === 1);
      const fallbackSwitchTime = inactiveChannels.length > 0 ? (inactiveChannels[0].last_fail_time || p.updated_at) : undefined;
      const backupChannelNumber = backupChannels.length > 0 ? backupChannels[0].priority : (ch.length > 1 ? 2 : 0);

      const supplier_info = {
        name: p.supplier_name,
        code: p.supplier_code,
        success_rate: supplierSuccessRate,
        channel_count: supplierChannels.length,
        stock: p.stock,
        stock_warning: p.stock_warning || 10
      };

      return {
        ...p,
        channels: ch,
        channelCount: ch.length,
        activeChannelCount: activeChannels.length,
        hasFallback,
        lastSync: p.updated_at,
        sync_batch: syncBatch,
        region_limited: regionLimited,
        available_regions: regionLimits.length > 0 ? regionLimits.map(r => r.region_code) : ['全国'],
        channelStatus: {
          total: ch.length,
          active: activeChannels.length,
          inactive: inactiveChannels.length,
          successRate: ch.length > 0 ? Math.round(activeChannels.reduce((sum, c) => sum + (c.success_rate || 0), 0) / ch.length * 100) / 100 : 0,
          mainChannel: mainChannel ? { id: mainChannel.id, priority: mainChannel.priority, supplier_name: mainChannel.supplier_name, success_rate: mainChannel.success_rate } : null,
          backupChannels: backupChannels.map(bc => ({ id: bc.id, priority: bc.priority, supplier_name: bc.supplier_name, success_rate: bc.success_rate }))
        },
        supplier_info,
        suppliers: allSuppliers,
        supplier_count: allSuppliers.length,
        stock_sync_history: syncHistory,
        fallback_switch_time: fallbackSwitchTime,
        fallback_reason: inactiveChannels.length > 0 ? (inactiveChannels[0].fail_reason || '主通道超时或失败率过高') : undefined,
        backup_channel_number: backupChannelNumber,
        stock_status: p.stock <= 0 ? 'none' : p.stock <= (p.stock_warning || 10) ? 'warning' : 'sufficient'
      };
    });

    res.json({
      success: true,
      data: {
        list: enriched,
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
      SELECT p.*, c.name as category_name, c.icon as category_icon, s.name as supplier_name, s.code as supplier_code
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      WHERE p.status = 1 AND p.is_hot = 1
      ORDER BY p.sort ASC LIMIT 20
    `).all();

    const enriched = products.map((p: any) => {
      const channels: any[] = db.prepare(`
        SELECT rc.*, s.name as supplier_name
        FROM recharge_channels rc
        LEFT JOIN suppliers s ON rc.supplier_id = s.id
        WHERE rc.product_id = ?
        ORDER BY rc.priority ASC
      `).all(p.id);
      const activeChannels = channels.filter(c => c.status === 1);
      const inactiveChannels = channels.filter(c => c.status !== 1);
      const hasFallback = channels.length > 1;
      const regionLimits: any[] = db.prepare('SELECT region_code FROM region_limits WHERE product_id = ? AND allow = 1').all(p.id);
      const regionLimited = p.region_limit ? 1 : (regionLimits.length > 0 ? 1 : 0);
      const syncBatch = p.updated_at ? formatBatchNo(p.updated_at) : null;

      const supplierChannels = channels.filter(c => c.supplier_id === p.supplier_id);
      const supplierSuccessRate = supplierChannels.length > 0
        ? Math.round(supplierChannels.reduce((sum, c) => sum + (c.success_rate || 0), 0) / supplierChannels.length * 100) / 100
        : 0.95;

      const allSuppliers = db.prepare(`
        SELECT DISTINCT s.id, s.name, s.code, s.status as supplier_status,
          (SELECT COUNT(*) FROM recharge_channels rc WHERE rc.supplier_id = s.id AND rc.product_id = ? AND rc.status = 1) as active_channels,
          (SELECT COUNT(*) FROM recharge_channels rc WHERE rc.supplier_id = s.id AND rc.product_id = ?) as total_channels,
          (SELECT p2.stock FROM products p2 WHERE p2.supplier_id = s.id AND p2.category_id = ? AND p2.status = 1 LIMIT 1) as supplier_stock
        FROM suppliers s
        INNER JOIN recharge_channels rc ON rc.supplier_id = s.id
        WHERE rc.product_id = ?
        ORDER BY s.id = ? DESC, active_channels DESC
      `).all(p.id, p.id, p.category_id, p.id, p.supplier_id);

      const syncHistory: any[] = db.prepare(`
        SELECT before_stock as before, after_stock as after, variance, sync_time as time, sync_batch
        FROM stock_sync_history
        WHERE product_id = ?
        ORDER BY sync_time DESC
        LIMIT 3
      `).all(p.id);

      const mainChannel = channels.find(c => c.status === 1) || channels[0];
      const backupChannels = channels.filter((c, idx) => idx > 0 && c.status === 1);
      const fallbackSwitchTime = inactiveChannels.length > 0 ? (inactiveChannels[0].last_fail_time || p.updated_at) : undefined;
      const backupChannelNumber = backupChannels.length > 0 ? backupChannels[0].priority : (channels.length > 1 ? 2 : 0);

      const supplier_info = {
        name: p.supplier_name,
        code: p.supplier_code,
        success_rate: supplierSuccessRate,
        channel_count: supplierChannels.length,
        stock: p.stock,
        stock_warning: p.stock_warning || 10
      };

      return {
        ...p,
        channels,
        channelCount: channels.length,
        activeChannelCount: activeChannels.length,
        hasFallback,
        lastSync: p.updated_at,
        sync_batch: syncBatch,
        region_limited: regionLimited,
        available_regions: regionLimits.length > 0 ? regionLimits.map(r => r.region_code) : ['全国'],
        channelStatus: {
          total: channels.length,
          active: activeChannels.length,
          inactive: inactiveChannels.length,
          successRate: channels.length > 0 ? Math.round(activeChannels.reduce((sum, c) => sum + (c.success_rate || 0), 0) / channels.length * 100) / 100 : 0,
          mainChannel: mainChannel ? { id: mainChannel.id, priority: mainChannel.priority, supplier_name: mainChannel.supplier_name, success_rate: mainChannel.success_rate } : null,
          backupChannels: backupChannels.map(bc => ({ id: bc.id, priority: bc.priority, supplier_name: bc.supplier_name, success_rate: bc.success_rate }))
        },
        supplier_info,
        suppliers: allSuppliers,
        supplier_count: allSuppliers.length,
        stock_sync_history: syncHistory,
        fallback_switch_time: fallbackSwitchTime,
        fallback_reason: inactiveChannels.length > 0 ? (inactiveChannels[0].fail_reason || '主通道超时或失败率过高') : undefined,
        backup_channel_number: backupChannelNumber,
        stock_status: p.stock <= 0 ? 'none' : p.stock <= (p.stock_warning || 10) ? 'warning' : 'sufficient'
      };
    });

    res.json({ success: true, data: enriched });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.get('/products/:id', (req, res) => {
  try {
    const product: any = db.prepare(`
      SELECT p.*, c.name as category_name, c.icon as category_icon, s.name as supplier_name, s.code as supplier_code
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      WHERE p.id = ?
    `).get(req.params.id);

    if (!product) return res.status(404).json({ success: false, message: '商品不存在' });

    const channels: any[] = db.prepare(`
      SELECT rc.*, s.name as supplier_name, s.code as supplier_code
      FROM recharge_channels rc
      LEFT JOIN suppliers s ON rc.supplier_id = s.id
      WHERE rc.product_id = ?
      ORDER BY rc.priority ASC
    `).all(product.id);
    const activeChannels = channels.filter(c => c.status === 1);
    const hasFallback = channels.length > 1;

    const regionLimits: any[] = db.prepare('SELECT region_code FROM region_limits WHERE product_id = ? AND allow = 1').all(product.id);
    const regionLimited = product.region_limit ? 1 : (regionLimits.length > 0 ? 1 : 0);
    const availableRegions = regionLimits.length > 0 ? regionLimits.map(r => r.region_code) : ['全国'];

    const syncBatch = product.updated_at ? formatBatchNo(product.updated_at) : null;

    const supplierChannels = channels.filter(c => c.supplier_id === product.supplier_id);
    const supplierSuccessRate = supplierChannels.length > 0
      ? Math.round(supplierChannels.reduce((sum, c) => sum + (c.success_rate || 0), 0) / supplierChannels.length * 100) / 100
      : 0.95;

    const supplier_info = {
      name: product.supplier_name,
      code: product.supplier_code,
      success_rate: supplierSuccessRate,
      channel_count: supplierChannels.length
    };

    const syncHistory: any[] = db.prepare(`
      SELECT before_stock as before, after_stock as after, variance, sync_time as time
      FROM stock_sync_history
      WHERE product_id = ?
      ORDER BY sync_time DESC
      LIMIT 3
    `).all(product.id);

    const promotions = promotionEngine.getActivePromotions().filter(pr => {
      const scope = pr.rules.scope;
      if (!scope) return true;
      if (scope.productIds && scope.productIds.length > 0) return scope.productIds.includes(product.id);
      if (scope.categoryIds && scope.categoryIds.length > 0) return scope.categoryIds.includes(product.category_id);
      return true;
    });

    const inactiveChannels = channels.filter(c => c.status !== 1);

    res.json({
      success: true,
      data: {
        ...product,
        channels,
        channelCount: channels.length,
        activeChannelCount: activeChannels.length,
        hasFallback,
        lastSync: product.updated_at,
        sync_batch: syncBatch,
        region_limited: regionLimited,
        available_regions: availableRegions,
        supplier_info,
        stock_sync_history: syncHistory,
        channelStatus: {
          total: channels.length,
          active: activeChannels.length,
          inactive: inactiveChannels.length,
          successRate: channels.length > 0 ? Math.round(activeChannels.reduce((sum, c) => sum + (c.success_rate || 0), 0) / channels.length * 100) / 100 : 0
        },
        applicablePromotions: promotions
      }
    });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

function calculatePrice(req: AuthRequest, res: any) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    let userId: string | undefined;
    if (token) {
      try {
        const decoded: any = verifyToken(token);
        if (decoded && decoded.userId) {
          userId = decoded.userId;
        }
      } catch { /* ignore invalid token */ }
    }

    let items = req.body?.items || [];
    if (!Array.isArray(items) || items.length === 0) {
      const singleProductId = req.body?.productId;
      const singleQuantity = req.body?.quantity || 1;
      if (singleProductId) {
        items = [{ productId: singleProductId, quantity: singleQuantity }];
      } else {
        return res.status(400).json({ success: false, message: '请选择商品' });
      }
    }

    const resolvedItems = items.map((item: any) => {
      if (!item || !item.productId) return null;
      const product: any = db.prepare('SELECT * FROM products WHERE id = ?').get(item.productId);
      if (!product) return null;
      return {
        productId: product.id,
        productName: product.name,
        unitPrice: product.price,
        quantity: Math.max(1, parseInt(item.quantity) || 1),
        categoryId: product.category_id,
        commissionRate: product.commission_rate || 0
      };
    }).filter(Boolean) as Array<{productId: string, productName: string, unitPrice: number, quantity: number, categoryId: string, commissionRate: number}>;

    if (resolvedItems.length === 0) {
      return res.status(400).json({ success: false, message: '未找到有效商品' });
    }

    const result = promotionEngine.calculate({
      items: resolvedItems,
      userId: userId,
      couponCode: req.body?.couponCode
    });

    const originalPrice = result.originalAmount;
    const finalPrice = result.finalAmount;
    const savedAmount = result.totalDiscount + result.cashbackAmount;
    const commissionEarned = Math.round(finalPrice * resolvedItems.reduce((sum, i) => sum + i.commissionRate * i.quantity, 0) / resolvedItems.reduce((sum, i) => sum + i.quantity, 0) * 100) / 100;

    const breakdown = result.discountDetails.map((d: any) => ({
      type: d.type,
      name: d.promotionName,
      description: d.description,
      discount: d.discountAmount,
      rule: d.type
    }));

    res.json({
      success: true,
      data: {
        originalPrice,
        finalPrice,
        savedAmount,
        commissionEarned,
        breakdown
      }
    });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
}

router.post('/products/calculate-price', calculatePrice);
router.post('/calculate-price', calculatePrice);

router.get('/promotions', (_req, res) => {
  try {
    const promotions = promotionEngine.getActivePromotions();
    res.json({ success: true, data: promotions });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.post('/products/:id/sync-stock', (req, res) => {
  try {
    const product: any = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: '商品不存在' });

    const t = now();
    const variance = Math.floor(Math.random() * 40) - 20;
    const newStock = Math.max(0, product.stock + variance);
    const batchNo = formatBatchNo(t);

    db.prepare('UPDATE products SET stock = ?, updated_at = ? WHERE id = ?').run(newStock, t, product.id);

    db.prepare(`
      INSERT INTO stock_sync_history (id, product_id, before_stock, after_stock, variance, sync_time, sync_batch)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(generateId(), product.id, product.stock, newStock, variance, t, batchNo);

    const updated: any = db.prepare(`
      SELECT p.*, c.name as category_name, c.icon as category_icon, s.name as supplier_name, s.code as supplier_code
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      WHERE p.id = ?
    `).get(product.id);

    const ch: any[] = db.prepare(`
      SELECT rc.*, s.name as supplier_name, s.code as supplier_code
      FROM recharge_channels rc
      LEFT JOIN suppliers s ON rc.supplier_id = s.id
      WHERE rc.product_id = ?
      ORDER BY rc.priority ASC
    `).all(product.id);
    const activeChannels = ch.filter(c => c.status === 1);
    const inactiveChannels = ch.filter(c => c.status !== 1);
    const hasFallback = ch.length > 1;
    const regionLimits: any[] = db.prepare('SELECT region_code FROM region_limits WHERE product_id = ? AND allow = 1').all(product.id);
    const regionLimited = product.region_limit ? 1 : (regionLimits.length > 0 ? 1 : 0);
    const availableRegions = regionLimits.length > 0 ? regionLimits.map(r => r.region_code) : ['全国'];

    const supplierChannels = ch.filter(c => c.supplier_id === product.supplier_id);
    const supplierSuccessRate = supplierChannels.length > 0
      ? Math.round(supplierChannels.reduce((sum, c) => sum + (c.success_rate || 0), 0) / supplierChannels.length * 100) / 100
      : 0.95;

    const supplier_info = {
      name: updated.supplier_name,
      code: updated.supplier_code,
      success_rate: supplierSuccessRate,
      channel_count: supplierChannels.length
    };

    const syncHistory: any[] = db.prepare(`
      SELECT before_stock as before, after_stock as after, variance, sync_time as time
      FROM stock_sync_history
      WHERE product_id = ?
      ORDER BY sync_time DESC
      LIMIT 3
    `).all(product.id);

    res.json({
      success: true,
      data: {
        ...updated,
        channels: ch,
        channelCount: ch.length,
        activeChannelCount: activeChannels.length,
        hasFallback,
        lastSync: t,
        sync_batch: batchNo,
        region_limited: regionLimited,
        available_regions: availableRegions,
        supplier_info,
        stock_sync_history: syncHistory,
        channelStatus: {
          total: ch.length,
          active: activeChannels.length,
          inactive: inactiveChannels.length,
          successRate: ch.length > 0 ? Math.round(activeChannels.reduce((sum, c) => sum + (c.success_rate || 0), 0) / ch.length * 100) / 100 : 0
        },
        syncResult: {
          before: product.stock,
          after: newStock,
          variance,
          timestamp: t
        }
      }
    });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.get('/products/:id/alternatives', (req, res) => {
  try {
    const product: any = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: '商品不存在' });

    const alternatives: any[] = db.prepare(`
      SELECT p.*, s.name as supplier_name, s.code as supplier_code, s.status as supplier_status
      FROM products p
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      WHERE p.category_id = ? AND p.id != ? AND p.status = 1
      ORDER BY p.supplier_id = ? DESC, p.stock DESC, p.price ASC
      LIMIT 10
    `).all(product.category_id, product.id, product.supplier_id);

    const enriched = alternatives.map((alt: any) => {
      const ch: any[] = db.prepare('SELECT id, priority, success_rate, status FROM recharge_channels WHERE product_id = ? AND status = 1 ORDER BY priority ASC').all(alt.id);
      const priceDiff = alt.price - product.price;
      return {
        ...alt,
        channelCount: ch.length,
        lastSync: alt.updated_at,
        priceDiff,
        priceDiffLabel: priceDiff > 0 ? `贵¥${priceDiff.toFixed(2)}` : priceDiff < 0 ? `省¥${Math.abs(priceDiff).toFixed(2)}` : '同价',
        hasFallback: ch.length > 1,
        successRate: ch.length > 0 ? Math.round(ch.reduce((sum, c) => sum + c.success_rate, 0) / ch.length * 100) : 0
      };
    });

    res.json({
      success: true,
      data: {
        currentSupplier: product.supplier_id,
        alternatives: enriched,
        totalAlternatives: enriched.length,
        hasMultiSupplier: enriched.length > 0
      }
    });
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
