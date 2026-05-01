const Redis = require('ioredis');
const { v4: uuidv4 } = require('uuid');
const { logger } = require('../utils/logger');
const { getDB } = require('../database/init');
const InventoryEngine = require('./InventoryEngine');
const TimelineEngine = require('./TimelineEngine');

class FlashSaleEngine {
  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      }
    });

    this.redis.on('connect', () => {
      logger.info('FlashSaleEngine: Redis 连接成功');
    });

    this.redis.on('error', (err) => {
      logger.warn('FlashSaleEngine: Redis 连接失败，使用内存模式', err.message);
      this.useMemoryFallback = true;
      this.memoryQueue = new Map();
      this.memoryStock = new Map();
    });

    this.concurrency = parseInt(process.env.FLASH_SALE_CONCURRENCY) || 1000;
  }

  getFlashSaleKey(flashSaleId) {
    return `flash_sale:${flashSaleId}`;
  }

  getQueueKey(flashSaleId) {
    return `flash_sale:queue:${flashSaleId}`;
  }

  getResultKey(flashSaleId, userId) {
    return `flash_sale:result:${flashSaleId}:${userId}`;
  }

  async initializeFlashSale(flashSale) {
    const key = this.getFlashSaleKey(flashSale.id);
    const queueKey = this.getQueueKey(flashSale.id);

    if (this.useMemoryFallback) {
      this.memoryStock.set(key, flashSale.total_stock);
      this.memoryQueue.set(queueKey, []);
    } else {
      await this.redis.set(key, flashSale.total_stock);
      await this.redis.del(queueKey);
    }

    logger.info('秒杀活动已初始化', {
      flashSaleId: flashSale.id,
      totalStock: flashSale.total_stock
    });
  }

  async enqueueRequest(flashSaleId, userId, quantity = 1) {
    const requestId = uuidv4();
    const queueKey = this.getQueueKey(flashSaleId);

    const request = {
      id: requestId,
      flashSaleId,
      userId,
      quantity,
      timestamp: Date.now(),
      status: 'pending'
    };

    if (this.useMemoryFallback) {
      let queue = this.memoryQueue.get(queueKey) || [];
      queue.push(request);
      this.memoryQueue.set(queueKey, queue);
    } else {
      await this.redis.lpush(queueKey, JSON.stringify(request));
    }

    await TimelineEngine.recordEvent({
      eventType: 'FLASH_SALE_REQUEST',
      liveStreamId: request.flashSaleId,
      userId,
      data: JSON.stringify({
        flashSaleId,
        quantity,
        requestId
      })
    });

    logger.debug('秒杀请求已入队', { requestId, flashSaleId, userId });
    return request;
  }

  async processQueue(flashSaleId) {
    const queueKey = this.getQueueKey(flashSaleId);
    const stockKey = this.getFlashSaleKey(flashSaleId);

    while (true) {
      let requestData;
      
      if (this.useMemoryFallback) {
        const queue = this.memoryQueue.get(queueKey) || [];
        if (queue.length === 0) break;
        requestData = queue.pop();
        this.memoryQueue.set(queueKey, queue);
      } else {
        const result = await this.redis.rpop(queueKey);
        if (!result) break;
        requestData = JSON.parse(result);
      }

      try {
        await this.processRequest(requestData, stockKey);
      } catch (error) {
        logger.error('处理秒杀请求失败:', error);
        await this.setResult(requestData.flashSaleId, requestData.userId, {
          success: false,
          message: '系统繁忙，请稍后再试',
          code: 'PROCESS_ERROR'
        });
      }
    }
  }

  async processRequest(request, stockKey) {
    const { flashSaleId, userId, quantity } = request;

    let remainingStock;
    if (this.useMemoryFallback) {
      remainingStock = this.memoryStock.get(stockKey) || 0;
      if (remainingStock >= quantity) {
        this.memoryStock.set(stockKey, remainingStock - quantity);
      }
    } else {
      remainingStock = await this.redis.decrby(stockKey, quantity);
    }

    if (remainingStock < 0) {
      if (!this.useMemoryFallback) {
        await this.redis.incrby(stockKey, quantity);
      } else {
        const current = this.memoryStock.get(stockKey) || 0;
        this.memoryStock.set(stockKey, current + quantity);
      }

      await this.setResult(flashSaleId, userId, {
        success: false,
        message: '商品已售罄',
        code: 'SOLD_OUT'
      });

      await TimelineEngine.recordEvent({
        eventType: 'FLASH_SALE_FAILED',
        liveStreamId: flashSaleId,
        userId,
        data: JSON.stringify({ flashSaleId, reason: 'SOLD_OUT' })
      });

      return;
    }

    try {
      const db = getDB();
      const flashSale = await new Promise((resolve, reject) => {
        db.get('SELECT * FROM flash_sales WHERE id = ?', [flashSaleId], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });

      if (!flashSale) {
        throw new Error('秒杀活动不存在');
      }

      const lockResult = await InventoryEngine.lockStock(
        flashSale.product_id,
        quantity,
        userId,
        flashSaleId
      );

      if (!lockResult.success) {
        if (!this.useMemoryFallback) {
          await this.redis.incrby(stockKey, quantity);
        } else {
          const current = this.memoryStock.get(stockKey) || 0;
          this.memoryStock.set(stockKey, current + quantity);
        }

        await this.setResult(flashSaleId, userId, {
          success: false,
          message: lockResult.message || '库存锁定失败',
          code: lockResult.code || 'LOCK_FAILED'
        });
        return;
      }

      const orderNo = `ORD${Date.now()}${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
      const orderId = uuidv4();
      const now = Date.now();

      const product = await new Promise((resolve, reject) => {
        db.get('SELECT * FROM products WHERE id = ?', [flashSale.product_id], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });

      const liveProduct = await new Promise((resolve, reject) => {
        db.get('SELECT * FROM live_products WHERE id = ?', [flashSale.live_product_id], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });

      const unitPrice = liveProduct?.flash_price || product.price;
      const totalAmount = unitPrice * quantity;

      await new Promise((resolve, reject) => {
        db.run(`
          INSERT INTO orders (id, order_no, user_id, product_id, live_stream_id, flash_sale_id, quantity, unit_price, total_amount, status, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [orderId, orderNo, userId, flashSale.product_id, flashSale.live_stream_id, flashSaleId, quantity, unitPrice, totalAmount, 'pending_payment', now, now], (err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      await new Promise((resolve, reject) => {
        db.run(`
          UPDATE flash_sales SET sold_count = sold_count + ? WHERE id = ?
        `, [quantity, flashSaleId], (err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      await this.setResult(flashSaleId, userId, {
        success: true,
        message: '秒杀成功，请尽快支付',
        code: 'SUCCESS',
        data: {
          orderId,
          orderNo,
          totalAmount,
          quantity,
          productId: flashSale.product_id,
          expireTime: Date.now() + 30 * 60 * 1000
        }
      });

      await TimelineEngine.recordEvent({
        eventType: 'FLASH_SALE_SUCCESS',
        liveStreamId: flashSale.live_stream_id,
        userId,
        productId: flashSale.product_id,
        flashSaleId,
        data: JSON.stringify({ orderId, orderNo, quantity, totalAmount })
      });

      logger.info('秒杀成功', {
        flashSaleId,
        userId,
        orderId,
        quantity
      });

    } catch (error) {
      logger.error('处理秒杀请求时出错:', error);

      if (!this.useMemoryFallback) {
        await this.redis.incrby(stockKey, quantity);
      } else {
        const current = this.memoryStock.get(stockKey) || 0;
        this.memoryStock.set(stockKey, current + quantity);
      }

      await this.setResult(flashSaleId, userId, {
        success: false,
        message: '秒杀失败，请稍后重试',
        code: 'PROCESS_ERROR'
      });
    }
  }

  async setResult(flashSaleId, userId, result) {
    const key = this.getResultKey(flashSaleId, userId);
    const resultWithTimestamp = {
      ...result,
      timestamp: Date.now()
    };

    if (this.useMemoryFallback) {
      this.memoryQueue.set(key, resultWithTimestamp);
    } else {
      await this.redis.setex(key, 3600, JSON.stringify(resultWithTimestamp));
    }
  }

  async getResult(flashSaleId, userId) {
    const key = this.getResultKey(flashSaleId, userId);

    if (this.useMemoryFallback) {
      return this.memoryQueue.get(key) || null;
    } else {
      const result = await this.redis.get(key);
      return result ? JSON.parse(result) : null;
    }
  }

  async getRemainingStock(flashSaleId) {
    const key = this.getFlashSaleKey(flashSaleId);

    if (this.useMemoryFallback) {
      return this.memoryStock.get(key) || 0;
    } else {
      const stock = await this.redis.get(key);
      return stock ? parseInt(stock) : 0;
    }
  }

  async cancelFlashSale(flashSaleId) {
    const key = this.getFlashSaleKey(flashSaleId);
    const queueKey = this.getQueueKey(flashSaleId);

    if (this.useMemoryFallback) {
      this.memoryStock.delete(key);
      this.memoryQueue.delete(queueKey);
    } else {
      await this.redis.del(key);
      await this.redis.del(queueKey);
    }

    logger.info('秒杀活动已取消', { flashSaleId });
  }
}

module.exports = new FlashSaleEngine();
