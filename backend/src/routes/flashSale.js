const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { requirePermission, requireRole, PERMISSIONS, ROLES } = require('../middleware/auth');
const { logger } = require('../utils/logger');
const { getDB } = require('../database/init');
const FlashSaleEngine = require('../engines/FlashSaleEngine');
const TimelineEngine = require('../engines/TimelineEngine');
const LiveInteractionEngine = require('../engines/LiveInteractionEngine');

const router = express.Router();

router.post('/create', requireRole(ROLES.STREAMER), requirePermission(PERMISSIONS.START_FLASH_SALE), asyncHandler(async (req, res) => {
  const { liveStreamId, liveProductId, flashPrice, flashStock } = req.body;

  if (!liveStreamId || !liveProductId || !flashPrice || !flashStock) {
    throw new AppError('参数不完整', 400, 'MISSING_PARAMS');
  }

  if (flashPrice <= 0) {
    throw new AppError('秒杀价格必须大于0', 400, 'INVALID_PRICE');
  }

  if (flashStock <= 0) {
    throw new AppError('秒杀库存必须大于0', 400, 'INVALID_STOCK');
  }

  const db = getDB();

  const liveStream = await new Promise((resolve, reject) => {
    db.get('SELECT * FROM live_streams WHERE id = ?', [liveStreamId], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });

  if (!liveStream) {
    throw new AppError('直播间不存在', 404, 'LIVE_STREAM_NOT_FOUND');
  }

  if (liveStream.streamer_id !== req.user.id) {
    throw new AppError('无权限操作此直播间', 403, 'FORBIDDEN');
  }

  if (liveStream.status !== 'live') {
    throw new AppError('直播未在进行中', 400, 'NOT_LIVE');
  }

  const liveProduct = await new Promise((resolve, reject) => {
    db.get(`
      SELECT lp.*, p.name, p.stock as total_stock, p.merchant_id
      FROM live_products lp
      LEFT JOIN products p ON lp.product_id = p.id
      WHERE lp.id = ?
    `, [liveProductId], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });

  if (!liveProduct) {
    throw new AppError('商品不存在', 404, 'PRODUCT_NOT_FOUND');
  }

  if (liveProduct.total_stock < flashStock) {
    throw new AppError('库存不足', 400, 'INSUFFICIENT_STOCK');
  }

  const activeFlashSale = await new Promise((resolve, reject) => {
    db.get(`
      SELECT * FROM flash_sales 
      WHERE live_stream_id = ? AND live_product_id = ? AND status = ?
    `, [liveStreamId, liveProductId, 'active'], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });

  if (activeFlashSale) {
    throw new AppError('该商品已有正在进行的秒杀活动', 400, 'ACTIVE_FLASH_SALE_EXISTS');
  }

  const flashSaleId = uuidv4();
  const now = Date.now();

  await new Promise((resolve, reject) => {
    db.run(`
      INSERT INTO flash_sales (id, live_stream_id, product_id, live_product_id, status, start_time, total_stock, sold_count, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      flashSaleId,
      liveStreamId,
      liveProduct.product_id,
      liveProductId,
      'active',
      now,
      flashStock,
      0,
      now
    ], (err) => {
      if (err) reject(err);
      else resolve();
    });
  });

  await new Promise((resolve, reject) => {
    db.run(`
      UPDATE live_products SET flash_price = ?, flash_stock = ? WHERE id = ?
    `, [flashPrice, flashStock, liveProductId], (err) => {
      if (err) reject(err);
      else resolve();
    });
  });

  await FlashSaleEngine.initializeFlashSale({
    id: flashSaleId,
    total_stock: flashStock
  });

  const flashSaleData = {
    id: flashSaleId,
    liveStreamId,
    productId: liveProduct.product_id,
    liveProductId,
    productName: liveProduct.name,
    flashPrice,
    flashStock,
    status: 'active',
    startTime: now
  };

  await LiveInteractionEngine.broadcastFlashSaleStart(liveStreamId, flashSaleData);

  logger.info('秒杀活动创建成功', {
    flashSaleId,
    liveStreamId,
    productId: liveProduct.product_id,
    flashPrice,
    flashStock
  });

  res.status(201).json({
    success: true,
    data: flashSaleData
  });
}));

router.post('/request', requireRole(ROLES.VIEWER), requirePermission(PERMISSIONS.PLACE_ORDER), asyncHandler(async (req, res) => {
  const { flashSaleId, quantity = 1 } = req.body;

  if (!flashSaleId) {
    throw new AppError('参数不完整', 400, 'MISSING_PARAMS');
  }

  const db = getDB();

  const flashSale = await new Promise((resolve, reject) => {
    db.get(`
      SELECT fs.*, lp.flash_price, p.name, p.image_url
      FROM flash_sales fs
      LEFT JOIN live_products lp ON fs.live_product_id = lp.id
      LEFT JOIN products p ON fs.product_id = p.id
      WHERE fs.id = ?
    `, [flashSaleId], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });

  if (!flashSale) {
    throw new AppError('秒杀活动不存在', 404, 'FLASH_SALE_NOT_FOUND');
  }

  if (flashSale.status !== 'active') {
    throw new AppError('秒杀活动未开始或已结束', 400, 'FLASH_SALE_NOT_ACTIVE');
  }

  const existingOrder = await new Promise((resolve, reject) => {
    db.get(`
      SELECT * FROM orders WHERE flash_sale_id = ? AND user_id = ? AND status != ?
    `, [flashSaleId, req.user.id, 'cancelled'], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });

  if (existingOrder) {
    throw new AppError('您已参与过本次秒杀活动', 400, 'ALREADY_PARTICIPATED');
  }

  const request = await FlashSaleEngine.enqueueRequest(flashSaleId, req.user.id, quantity);

  logger.info('秒杀请求已入队', {
    flashSaleId,
    userId: req.user.id,
    requestId: request.id
  });

  setImmediate(async () => {
    try {
      await FlashSaleEngine.processQueue(flashSaleId);
    } catch (error) {
      logger.error('处理秒杀队列失败:', error);
    }
  });

  res.json({
    success: true,
    data: {
      requestId: request.id,
      message: '请求已提交，请等待处理结果'
    }
  });
}));

router.get('/result/:flashSaleId', requireRole(ROLES.VIEWER), asyncHandler(async (req, res) => {
  const { flashSaleId } = req.params;
  const userId = req.user.id;

  const result = await FlashSaleEngine.getResult(flashSaleId, userId);

  if (!result) {
    throw new AppError('结果不存在或已过期', 404, 'RESULT_NOT_FOUND');
  }

  res.json({
    success: true,
    data: result
  });
}));

router.get('/:flashSaleId/stock', asyncHandler(async (req, res) => {
  const { flashSaleId } = req.params;

  const remainingStock = await FlashSaleEngine.getRemainingStock(flashSaleId);

  const db = getDB();
  const flashSale = await new Promise((resolve, reject) => {
    db.get('SELECT * FROM flash_sales WHERE id = ?', [flashSaleId], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });

  if (!flashSale) {
    throw new AppError('秒杀活动不存在', 404, 'FLASH_SALE_NOT_FOUND');
  }

  res.json({
    success: true,
    data: {
      flashSaleId,
      totalStock: flashSale.total_stock,
      soldCount: flashSale.sold_count,
      remainingStock
    }
  });
}));

router.post('/:flashSaleId/end', requireRole(ROLES.STREAMER), asyncHandler(async (req, res) => {
  const { flashSaleId } = req.params;
  const db = getDB();

  const flashSale = await new Promise((resolve, reject) => {
    db.get(`
      SELECT fs.*, ls.streamer_id
      FROM flash_sales fs
      LEFT JOIN live_streams ls ON fs.live_stream_id = ls.id
      WHERE fs.id = ?
    `, [flashSaleId], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });

  if (!flashSale) {
    throw new AppError('秒杀活动不存在', 404, 'FLASH_SALE_NOT_FOUND');
  }

  if (flashSale.streamer_id !== req.user.id && req.user.role !== 'platform_admin') {
    throw new AppError('无权限操作', 403, 'FORBIDDEN');
  }

  const now = Date.now();

  await new Promise((resolve, reject) => {
    db.run(`
      UPDATE flash_sales SET status = ?, end_time = ? WHERE id = ?
    `, ['ended', now, flashSaleId], (err) => {
      if (err) reject(err);
      else resolve();
    });
  });

  await FlashSaleEngine.cancelFlashSale(flashSaleId);
  await LiveInteractionEngine.broadcastFlashSaleEnd(flashSale.live_stream_id, flashSaleId);

  logger.info('秒杀活动已结束', { flashSaleId });

  res.json({
    success: true,
    data: {
      flashSaleId,
      status: 'ended',
      endTime: now
    }
  });
}));

router.get('/live/:liveStreamId', asyncHandler(async (req, res) => {
  const { liveStreamId } = req.params;
  const db = getDB();

  const flashSales = await new Promise((resolve, reject) => {
    db.all(`
      SELECT 
        fs.*,
        p.name,
        p.image_url,
        lp.flash_price
      FROM flash_sales fs
      LEFT JOIN products p ON fs.product_id = p.id
      LEFT JOIN live_products lp ON fs.live_product_id = lp.id
      WHERE fs.live_stream_id = ?
      ORDER BY fs.created_at DESC
    `, [liveStreamId], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });

  const result = [];
  for (const fs of flashSales) {
    const remainingStock = await FlashSaleEngine.getRemainingStock(fs.id);
    result.push({
      ...fs,
      remainingStock
    });
  }

  res.json({
    success: true,
    data: result
  });
}));

module.exports = router;
