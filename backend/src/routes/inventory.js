const express = require('express');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { requirePermission, requireRole, PERMISSIONS, ROLES } = require('../middleware/auth');
const { logger } = require('../utils/logger');
const { getDB } = require('../database/init');
const InventoryEngine = require('../engines/InventoryEngine');
const TimelineEngine = require('../engines/TimelineEngine');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

router.get('/list', requireRole(ROLES.MERCHANT, ROLES.PLATFORM_ADMIN), asyncHandler(async (req, res) => {
  const { limit = 50, offset = 0 } = req.query;
  const db = getDB();

  let query = 'SELECT * FROM products WHERE 1=1';
  const params = [];

  if (req.user.role === 'merchant') {
    query += ' AND merchant_id = ?';
    params.push(req.user.id);
  }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));

  const products = await new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });

  const total = await new Promise((resolve, reject) => {
    let countQuery = 'SELECT COUNT(*) as count FROM products WHERE 1=1';
    const countParams = [];

    if (req.user.role === 'merchant') {
      countQuery += ' AND merchant_id = ?';
      countParams.push(req.user.id);
    }

    db.get(countQuery, countParams, (err, row) => {
      if (err) reject(err);
      else resolve(row ? row.count : 0);
    });
  });

  res.json({
    success: true,
    data: {
      list: products,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    }
  });
}));

router.get('/:productId', asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const db = getDB();

  const product = await new Promise((resolve, reject) => {
    db.get('SELECT * FROM products WHERE id = ?', [productId], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });

  if (!product) {
    throw new AppError('商品不存在', 404, 'PRODUCT_NOT_FOUND');
  }

  res.json({
    success: true,
    data: product
  });
}));

router.post('/create', requireRole(ROLES.MERCHANT, ROLES.PLATFORM_ADMIN), requirePermission(PERMISSIONS.MANAGE_INVENTORY), asyncHandler(async (req, res) => {
  const { name, description, price, originalPrice, imageUrl, stock, status = 'active' } = req.body;

  if (!name || price === undefined) {
    throw new AppError('商品名称和价格为必填项', 400, 'MISSING_PARAMS');
  }

  if (price <= 0) {
    throw new AppError('价格必须大于0', 400, 'INVALID_PRICE');
  }

  const db = getDB();
  const productId = uuidv4();
  const now = Date.now();
  const merchantId = req.user.role === 'merchant' ? req.user.id : (req.body.merchantId || req.user.id);

  await new Promise((resolve, reject) => {
    db.run(`
      INSERT INTO products (
        id, name, description, price, original_price, image_url, merchant_id,
        stock, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      productId, name, description || '', price, originalPrice || price, imageUrl || '', merchantId,
      stock || 0, status, now, now
    ], (err) => {
      if (err) reject(err);
      else resolve();
    });
  });

  if (stock && stock > 0) {
    await InventoryEngine.addStock(productId, stock, req.user.id, '商品创建时初始化库存');
  }

  logger.info('商品创建成功', {
    productId,
    name,
    price,
    stock,
    merchantId
  });

  res.status(201).json({
    success: true,
    data: {
      id: productId,
      name,
      description,
      price,
      originalPrice: originalPrice || price,
      imageUrl,
      merchantId,
      stock: stock || 0,
      status
    }
  });
}));

router.put('/:productId', requireRole(ROLES.MERCHANT, ROLES.PLATFORM_ADMIN), requirePermission(PERMISSIONS.MANAGE_INVENTORY), asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { name, description, price, originalPrice, imageUrl, stock, status } = req.body;

  const db = getDB();

  const product = await new Promise((resolve, reject) => {
    db.get('SELECT * FROM products WHERE id = ?', [productId], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });

  if (!product) {
    throw new AppError('商品不存在', 404, 'PRODUCT_NOT_FOUND');
  }

  if (req.user.role === 'merchant' && product.merchant_id !== req.user.id) {
    throw new AppError('无权限操作此商品', 403, 'FORBIDDEN');
  }

  const updates = [];
  const params = [];
  const now = Date.now();

  if (name !== undefined) {
    updates.push('name = ?');
    params.push(name);
  }

  if (description !== undefined) {
    updates.push('description = ?');
    params.push(description);
  }

  if (price !== undefined) {
    if (price <= 0) {
      throw new AppError('价格必须大于0', 400, 'INVALID_PRICE');
    }
    updates.push('price = ?');
    params.push(price);
  }

  if (originalPrice !== undefined) {
    updates.push('original_price = ?');
    params.push(originalPrice);
  }

  if (imageUrl !== undefined) {
    updates.push('image_url = ?');
    params.push(imageUrl);
  }

  if (status !== undefined) {
    updates.push('status = ?');
    params.push(status);
  }

  if (updates.length === 0) {
    throw new AppError('没有需要更新的字段', 400, 'NOTHING_TO_UPDATE');
  }

  updates.push('updated_at = ?');
  params.push(now, productId);

  await new Promise((resolve, reject) => {
    db.run(`UPDATE products SET ${updates.join(', ')} WHERE id = ?`, params, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });

  if (stock !== undefined && stock !== product.stock) {
    const stockChange = stock - product.stock;
    if (stockChange > 0) {
      await InventoryEngine.addStock(productId, stockChange, req.user.id, '手动调整库存');
    } else if (stockChange < 0 && stock >= 0) {
      const lockResult = await InventoryEngine.lockStock(productId, Math.abs(stockChange), req.user.id);
      if (!lockResult.success) {
        throw new AppError('库存调整失败', 400, 'STOCK_ADJUST_FAILED');
      }
    }
  }

  const updatedProduct = await new Promise((resolve, reject) => {
    db.get('SELECT * FROM products WHERE id = ?', [productId], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });

  logger.info('商品更新成功', { productId });

  res.json({
    success: true,
    data: updatedProduct
  });
}));

router.post('/:productId/add-stock', requireRole(ROLES.MERCHANT, ROLES.PLATFORM_ADMIN), requirePermission(PERMISSIONS.MANAGE_INVENTORY), asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { quantity, reason = '补充库存' } = req.body;

  if (!quantity || quantity <= 0) {
    throw new AppError('请输入有效的库存数量', 400, 'INVALID_QUANTITY');
  }

  const db = getDB();
  const product = await new Promise((resolve, reject) => {
    db.get('SELECT * FROM products WHERE id = ?', [productId], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });

  if (!product) {
    throw new AppError('商品不存在', 404, 'PRODUCT_NOT_FOUND');
  }

  if (req.user.role === 'merchant' && product.merchant_id !== req.user.id) {
    throw new AppError('无权限操作此商品', 403, 'FORBIDDEN');
  }

  const result = await InventoryEngine.addStock(productId, quantity, req.user.id, reason);

  if (!result.success) {
    throw new AppError(result.message, 400, result.code);
  }

  logger.info('库存补充成功', {
    productId,
    quantity,
    reason
  });

  res.json({
    success: true,
    data: result
  });
}));

router.get('/:productId/logs', requireRole(ROLES.MERCHANT, ROLES.PLATFORM_ADMIN), asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { limit = 50 } = req.query;

  const logs = await InventoryEngine.getInventoryLogs(productId, parseInt(limit));

  res.json({
    success: true,
    data: logs
  });
}));

router.get('/:productId/stats', requireRole(ROLES.MERCHANT, ROLES.PLATFORM_ADMIN), asyncHandler(async (req, res) => {
  const { productId } = req.params;

  const stats = await InventoryEngine.getInventoryStats(productId);

  if (!stats) {
    throw new AppError('商品不存在', 404, 'PRODUCT_NOT_FOUND');
  }

  res.json({
    success: true,
    data: stats
  });
}));

module.exports = router;
