const { v4: uuidv4 } = require('uuid');
const { logger } = require('../utils/logger');
const { getDB } = require('../database/init');
const TimelineEngine = require('./TimelineEngine');

class InventoryEngine {
  constructor() {
    this.lockTimeout = parseInt(process.env.INVENTORY_LOCK_TIMEOUT) || 300000;
  }

  async getProductStock(productId) {
    const db = getDB();
    return new Promise((resolve, reject) => {
      db.get('SELECT stock, id FROM products WHERE id = ?', [productId], (err, row) => {
        if (err) reject(err);
        else resolve(row ? row.stock : 0);
      });
    });
  }

  async lockStock(productId, quantity, userId, flashSaleId = null) {
    const db = getDB();

    try {
      const product = await new Promise((resolve, reject) => {
        db.get('SELECT * FROM products WHERE id = ?', [productId], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });

      if (!product) {
        return { success: false, message: '商品不存在', code: 'PRODUCT_NOT_FOUND' };
      }

      if (product.status !== 'active') {
        return { success: false, message: '商品已下架', code: 'PRODUCT_INACTIVE' };
      }

      if (product.stock < quantity) {
        return { success: false, message: '库存不足', code: 'INSUFFICIENT_STOCK' };
      }

      const stockBefore = product.stock;
      const stockAfter = stockBefore - quantity;

      await new Promise((resolve, reject) => {
        db.run(
          'UPDATE products SET stock = ?, updated_at = ? WHERE id = ? AND stock >= ?',
          [stockAfter, Date.now(), productId, quantity],
          function(err) {
            if (err) reject(err);
            else if (this.changes === 0) reject(new Error('库存更新失败'));
            else resolve();
          }
        );
      });

      await this.recordInventoryLog({
        productId,
        userId,
        flashSaleId,
        changeType: 'LOCK',
        quantityBefore: stockBefore,
        quantityChange: -quantity,
        quantityAfter: stockAfter,
        reason: flashSaleId ? '秒杀库存锁定' : '普通订单库存锁定'
      });

      logger.info('库存锁定成功', {
        productId,
        quantity,
        userId,
        flashSaleId,
        stockBefore,
        stockAfter
      });

      return {
        success: true,
        stockBefore,
        stockAfter,
        lockedQuantity: quantity
      };

    } catch (error) {
      logger.error('库存锁定失败:', error);
      return { success: false, message: error.message, code: 'LOCK_FAILED' };
    }
  }

  async unlockStock(productId, quantity, userId, flashSaleId = null, reason = '订单取消') {
    const db = getDB();

    try {
      const product = await new Promise((resolve, reject) => {
        db.get('SELECT * FROM products WHERE id = ?', [productId], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });

      if (!product) {
        return { success: false, message: '商品不存在', code: 'PRODUCT_NOT_FOUND' };
      }

      const stockBefore = product.stock;
      const stockAfter = stockBefore + quantity;

      await new Promise((resolve, reject) => {
        db.run(
          'UPDATE products SET stock = ?, updated_at = ? WHERE id = ?',
          [stockAfter, Date.now(), productId],
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });

      await this.recordInventoryLog({
        productId,
        userId,
        flashSaleId,
        changeType: 'UNLOCK',
        quantityBefore: stockBefore,
        quantityChange: quantity,
        quantityAfter: stockAfter,
        reason
      });

      logger.info('库存解锁成功', {
        productId,
        quantity,
        userId,
        flashSaleId,
        stockBefore,
        stockAfter
      });

      return {
        success: true,
        stockBefore,
        stockAfter,
        unlockedQuantity: quantity
      };

    } catch (error) {
      logger.error('库存解锁失败:', error);
      return { success: false, message: error.message, code: 'UNLOCK_FAILED' };
    }
  }

  async deductStock(productId, quantity, userId, orderId) {
    const db = getDB();

    try {
      const product = await new Promise((resolve, reject) => {
        db.get('SELECT * FROM products WHERE id = ?', [productId], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });

      if (!product) {
        return { success: false, message: '商品不存在', code: 'PRODUCT_NOT_FOUND' };
      }

      const stockBefore = product.stock;
      const stockAfter = stockBefore - quantity;

      await this.recordInventoryLog({
        productId,
        userId,
        orderId,
        changeType: 'DEDUCT',
        quantityBefore: stockBefore,
        quantityChange: -quantity,
        quantityAfter: stockAfter,
        reason: '订单支付确认扣减库存'
      });

      await TimelineEngine.recordEvent({
        eventType: 'INVENTORY_DEDUCT',
        userId,
        productId,
        orderId,
        data: JSON.stringify({
          quantity,
          stockBefore,
          stockAfter
        })
      });

      logger.info('库存扣减成功', {
        productId,
        quantity,
        userId,
        orderId,
        stockBefore,
        stockAfter
      });

      return {
        success: true,
        stockBefore,
        stockAfter,
        deductedQuantity: quantity
      };

    } catch (error) {
      logger.error('库存扣减失败:', error);
      return { success: false, message: error.message, code: 'DEDUCT_FAILED' };
    }
  }

  async addStock(productId, quantity, userId, reason = '库存补充') {
    const db = getDB();

    try {
      const product = await new Promise((resolve, reject) => {
        db.get('SELECT * FROM products WHERE id = ?', [productId], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });

      if (!product) {
        return { success: false, message: '商品不存在', code: 'PRODUCT_NOT_FOUND' };
      }

      const stockBefore = product.stock;
      const stockAfter = stockBefore + quantity;

      await new Promise((resolve, reject) => {
        db.run(
          'UPDATE products SET stock = ?, updated_at = ? WHERE id = ?',
          [stockAfter, Date.now(), productId],
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });

      await this.recordInventoryLog({
        productId,
        userId,
        changeType: 'ADD',
        quantityBefore: stockBefore,
        quantityChange: quantity,
        quantityAfter: stockAfter,
        reason
      });

      await TimelineEngine.recordEvent({
        eventType: 'INVENTORY_ADD',
        userId,
        productId,
        data: JSON.stringify({
          quantity,
          stockBefore,
          stockAfter,
          reason
        })
      });

      logger.info('库存增加成功', {
        productId,
        quantity,
        userId,
        stockBefore,
        stockAfter
      });

      return {
        success: true,
        stockBefore,
        stockAfter,
        addedQuantity: quantity
      };

    } catch (error) {
      logger.error('库存增加失败:', error);
      return { success: false, message: error.message, code: 'ADD_FAILED' };
    }
  }

  async recordInventoryLog(logData) {
    const db = getDB();
    const logId = uuidv4();
    const now = Date.now();

    return new Promise((resolve, reject) => {
      db.run(`
        INSERT INTO inventory_logs (
          id, product_id, live_stream_id, flash_sale_id, order_id, user_id,
          change_type, quantity_before, quantity_change, quantity_after, reason, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        logId,
        logData.productId,
        logData.liveStreamId || null,
        logData.flashSaleId || null,
        logData.orderId || null,
        logData.userId || null,
        logData.changeType,
        logData.quantityBefore,
        logData.quantityChange,
        logData.quantityAfter,
        logData.reason || '',
        now
      ], (err) => {
        if (err) reject(err);
        else resolve(logId);
      });
    });
  }

  async getInventoryLogs(productId, limit = 50) {
    const db = getDB();
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT * FROM inventory_logs 
        WHERE product_id = ? 
        ORDER BY created_at DESC 
        LIMIT ?
      `, [productId, limit], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  async getInventoryStats(productId) {
    const db = getDB();
    const product = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM products WHERE id = ?', [productId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!product) {
      return null;
    }

    const logs = await this.getInventoryLogs(productId, 1000);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTimestamp = today.getTime();

    const todayLogs = logs.filter(log => log.created_at >= todayTimestamp);
    
    const todayDeducted = todayLogs
      .filter(log => log.change_type === 'DEDUCT')
      .reduce((sum, log) => sum + Math.abs(log.quantity_change), 0);

    const todayLocked = todayLogs
      .filter(log => log.change_type === 'LOCK')
      .reduce((sum, log) => sum + Math.abs(log.quantity_change), 0);

    return {
      productId: product.id,
      productName: product.name,
      currentStock: product.stock,
      todayDeducted,
      todayLocked,
      totalDeducted: logs
        .filter(log => log.change_type === 'DEDUCT')
        .reduce((sum, log) => sum + Math.abs(log.quantity_change), 0)
    };
  }
}

module.exports = new InventoryEngine();
