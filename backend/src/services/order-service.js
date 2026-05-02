import { v4 as uuidv4 } from 'uuid';
import db from '../config/database.js';
import eventStore, { EventTypes, AggregateTypes } from '../core/event-store.js';
import riskProfilingEngine from '../engines/risk-profiling-engine.js';
import netValueEngine from '../engines/net-value-engine.js';
import clearingDistributionEngine from '../engines/clearing-distribution-engine.js';
import assetTrackEngine from '../engines/asset-track-engine.js';

class OrderService {
  createPurchase(userId, productId, amount) {
    const now = new Date().toISOString();
    const orderId = uuidv4();

    const product = this.getProduct(productId);
    if (!product) {
      throw new Error('产品不存在');
    }

    const eligibility = riskProfilingEngine.checkPurchaseEligibility(userId, product.risk_level);
    if (!eligibility.eligible) {
      throw new Error(eligibility.reason);
    }

    const feeCalculation = clearingDistributionEngine.calculatePurchaseFee(amount);
    const netAmount = feeCalculation.netAmount;
    const shareCalculation = netValueEngine.calculateShares(netAmount, productId);

    const order = {
      id: orderId,
      user_id: userId,
      product_id: productId,
      order_type: 'purchase',
      amount,
      shares: shareCalculation.shares,
      nav: shareCalculation.nav,
      fee_amount: feeCalculation.feeAmount,
      status: 'pending',
      payment_status: 'pending',
      submitted_at: now,
      created_at: now,
      updated_at: now
    };

    eventStore.append(
      AggregateTypes.ORDER,
      orderId,
      EventTypes.PURCHASE_SUBMITTED,
      {
        userId,
        productId,
        productName: product.name,
        amount,
        netAmount,
        shares: shareCalculation.shares,
        nav: shareCalculation.nav,
        feeAmount: feeCalculation.feeAmount,
        feeRate: feeCalculation.rate,
        submittedAt: now
      },
      { source: 'OrderService' }
    );

    const stmt = db.prepare(`
      INSERT INTO orders (id, user_id, product_id, order_type, amount, shares, nav, fee_amount, status, payment_status, submitted_at, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      orderId, userId, productId, 'purchase', amount, order.shares, order.nav, feeCalculation.feeAmount, 
      'pending', 'pending', now, now, now
    );

    return {
      ...order,
      product_name: product.name,
      product_code: product.code,
      risk_level: product.risk_level
    };
  }

  confirmPayment(orderId) {
    const now = new Date().toISOString();
    const order = this.getOrder(orderId);
    
    if (!order) {
      throw new Error('订单不存在');
    }
    
    if (order.status !== 'pending') {
      throw new Error('订单状态不允许确认支付');
    }

    eventStore.append(
      AggregateTypes.ORDER,
      orderId,
      EventTypes.PAYMENT_CONFIRMED,
      {
        orderId,
        userId: order.user_id,
        amount: order.amount,
        confirmedAt: now
      },
      { source: 'OrderService' }
    );

    eventStore.append(
      AggregateTypes.ORDER,
      orderId,
      EventTypes.PURCHASE_LOCKED,
      {
        orderId,
        lockedAt: now
      },
      { source: 'OrderService' }
    );

    const stmt = db.prepare(`
      UPDATE orders SET payment_status = ?, status = ?, confirmed_at = ?, updated_at = ? WHERE id = ?
    `);
    stmt.run('confirmed', 'locked', now, now, orderId);

    return {
      orderId,
      status: 'locked',
      paymentStatus: 'confirmed',
      confirmedAt: now
    };
  }

  completePurchase(orderId) {
    const now = new Date().toISOString();
    const order = this.getOrder(orderId);
    
    if (!order) {
      throw new Error('订单不存在');
    }
    
    if (order.status !== 'locked') {
      throw new Error('订单状态不允许完成');
    }

    const navData = netValueEngine.getLatestNav(order.product_id);
    const currentNav = navData.nav;
    
    const netAmount = order.amount - order.fee_amount;
    const shares = Math.floor((netAmount / currentNav) * 10000) / 10000;

    eventStore.append(
      AggregateTypes.ORDER,
      orderId,
      EventTypes.SHARE_CALCULATED,
      {
        orderId,
        shares,
        nav: currentNav,
        netAmount
      },
      { source: 'OrderService' }
    );

    assetTrackEngine.addPurchase(
      order.user_id,
      order.product_id,
      shares,
      currentNav,
      netAmount,
      currentNav
    );

    eventStore.append(
      AggregateTypes.ORDER,
      orderId,
      EventTypes.PURCHASE_COMPLETED,
      {
        orderId,
        completedAt: now
      },
      { source: 'OrderService' }
    );

    const stmt = db.prepare(`
      UPDATE orders SET status = ?, shares = ?, nav = ?, completed_at = ?, updated_at = ? WHERE id = ?
    `);
    stmt.run('completed', shares, currentNav, now, now, orderId);

    return {
      orderId,
      status: 'completed',
      shares,
      nav: currentNav,
      completedAt: now
    };
  }

  createRedemption(userId, productId, shares) {
    const now = new Date().toISOString();
    const orderId = uuidv4();

    const asset = assetTrackEngine.getAsset(userId, productId);
    if (!asset || asset.available_shares < shares) {
      throw new Error('可用份额不足');
    }

    const product = this.getProduct(productId);
    if (!product) {
      throw new Error('产品不存在');
    }

    const navData = netValueEngine.getLatestNav(productId);
    const amount = shares * navData.nav;

    const order = {
      id: orderId,
      user_id: userId,
      product_id: productId,
      order_type: 'redemption',
      amount,
      shares,
      nav: navData.nav,
      status: 'pending',
      submitted_at: now,
      created_at: now,
      updated_at: now
    };

    eventStore.append(
      AggregateTypes.ORDER,
      orderId,
      EventTypes.REDEMPTION_SUBMITTED,
      {
        userId,
        productId,
        productName: product.name,
        shares,
        amount,
        nav: navData.nav,
        submittedAt: now
      },
      { source: 'OrderService' }
    );

    assetTrackEngine.freezeShares(userId, productId, shares);

    const stmt = db.prepare(`
      INSERT INTO orders (id, user_id, product_id, order_type, amount, shares, nav, status, submitted_at, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(orderId, userId, productId, 'redemption', amount, shares, navData.nav, 'pending', now, now, now);

    return {
      ...order,
      product_name: product.name
    };
  }

  confirmRedemption(orderId) {
    const now = new Date().toISOString();
    const order = this.getOrder(orderId);
    
    if (!order) {
      throw new Error('订单不存在');
    }
    
    if (order.order_type !== 'redemption') {
      throw new Error('不是赎回订单');
    }
    
    if (order.status !== 'pending') {
      throw new Error('订单状态不允许确认');
    }

    const asset = assetTrackEngine.getAsset(order.user_id, order.product_id);
    const holdDays = clearingDistributionEngine.calculateHoldDays(asset.created_at, now);
    
    const feeCalculation = clearingDistributionEngine.clearRedemption(
      orderId,
      order.user_id,
      order.product_id,
      order.amount,
      order.shares,
      holdDays
    );

    eventStore.append(
      AggregateTypes.ORDER,
      orderId,
      EventTypes.REDEMPTION_CONFIRMED,
      {
        orderId,
        holdDays,
        feeAmount: feeCalculation.feeAmount,
        netAmount: feeCalculation.netAmount,
        confirmedAt: now
      },
      { source: 'OrderService' }
    );

    const stmt = db.prepare(`
      UPDATE orders SET status = ?, fee_amount = ?, confirmed_at = ?, updated_at = ? WHERE id = ?
    `);
    stmt.run('confirmed', feeCalculation.feeAmount, now, now, orderId);

    return {
      orderId,
      status: 'confirmed',
      feeAmount: feeCalculation.feeAmount,
      netAmount: feeCalculation.netAmount,
      holdDays
    };
  }

  completeRedemption(orderId) {
    const now = new Date().toISOString();
    const order = this.getOrder(orderId);
    
    if (!order) {
      throw new Error('订单不存在');
    }
    
    if (order.order_type !== 'redemption') {
      throw new Error('不是赎回订单');
    }
    
    if (!['confirmed', 'locked'].includes(order.status)) {
      throw new Error('订单状态不允许完成');
    }

    const netAmount = order.amount - (order.fee_amount || 0);

    assetTrackEngine.unfreezeShares(order.user_id, order.product_id, order.shares);
    
    assetTrackEngine.addRedemption(
      order.user_id,
      order.product_id,
      order.shares,
      netAmount,
      order.fee_amount || 0
    );

    eventStore.append(
      AggregateTypes.ORDER,
      orderId,
      EventTypes.REDEMPTION_COMPLETED,
      {
        orderId,
        netAmount,
        completedAt: now
      },
      { source: 'OrderService' }
    );

    const stmt = db.prepare(`
      UPDATE orders SET status = ?, completed_at = ?, updated_at = ? WHERE id = ?
    `);
    stmt.run('completed', now, now, orderId);

    return {
      orderId,
      status: 'completed',
      netAmount,
      completedAt: now
    };
  }

  rejectOrder(orderId, reason) {
    const now = new Date().toISOString();
    const order = this.getOrder(orderId);
    
    if (!order) {
      throw new Error('订单不存在');
    }

    if (order.order_type === 'redemption' && order.status === 'pending') {
      assetTrackEngine.unfreezeShares(order.user_id, order.product_id, order.shares);
    }

    eventStore.append(
      AggregateTypes.ORDER,
      orderId,
      EventTypes.ORDER_REJECTED,
      {
        orderId,
        reason,
        rejectedAt: now
      },
      { source: 'OrderService' }
    );

    const stmt = db.prepare(`
      UPDATE orders SET status = ?, rejected_at = ?, rejected_reason = ?, updated_at = ? WHERE id = ?
    `);
    stmt.run('rejected', now, reason, now, orderId);

    return {
      orderId,
      status: 'rejected',
      rejectedAt: now,
      rejectedReason: reason
    };
  }

  retryOrder(orderId) {
    const now = new Date().toISOString();
    const order = this.getOrder(orderId);
    
    if (!order) {
      throw new Error('订单不存在');
    }
    
    if (!['rejected', 'failed'].includes(order.status)) {
      throw new Error('只有被拒绝或失败的订单才能重试');
    }

    eventStore.append(
      AggregateTypes.ORDER,
      orderId,
      EventTypes.ORDER_RETRIED,
      {
        orderId,
        retriedAt: now
      },
      { source: 'OrderService' }
    );

    const stmt = db.prepare(`
      UPDATE orders SET status = ?, updated_at = ? WHERE id = ?
    `);
    stmt.run('pending', now, orderId);

    return {
      orderId,
      status: 'pending',
      retriedAt: now
    };
  }

  closeOrder(orderId) {
    const now = new Date().toISOString();
    const order = this.getOrder(orderId);
    
    if (!order) {
      throw new Error('订单不存在');
    }

    eventStore.append(
      AggregateTypes.ORDER,
      orderId,
      EventTypes.ORDER_CLOSED,
      {
        orderId,
        closedAt: now
      },
      { source: 'OrderService' }
    );

    const stmt = db.prepare(`
      UPDATE orders SET status = ?, updated_at = ? WHERE id = ?
    `);
    stmt.run('closed', now, orderId);

    return {
      orderId,
      status: 'closed',
      closedAt: now
    };
  }

  getOrder(orderId) {
    const stmt = db.prepare(`
      SELECT o.*, fp.name as product_name, fp.code as product_code, fp.risk_level
      FROM orders o
      LEFT JOIN fund_products fp ON o.product_id = fp.id
      WHERE o.id = ?
    `);
    return stmt.get(orderId);
  }

  getUserOrders(userId, filters = {}) {
    let sql = `SELECT o.*, fp.name as product_name, fp.code as product_code, fp.risk_level
               FROM orders o
               LEFT JOIN fund_products fp ON o.product_id = fp.id
               WHERE o.user_id = ?`;
    const params = [userId];

    if (filters.order_type) {
      sql += ` AND o.order_type = ?`;
      params.push(filters.order_type);
    }
    if (filters.status) {
      sql += ` AND o.status = ?`;
      params.push(filters.status);
    }

    sql += ` ORDER BY o.created_at DESC`;

    const stmt = db.prepare(sql);
    return stmt.all(...params);
  }

  getProduct(productId) {
    const stmt = db.prepare(`SELECT * FROM fund_products WHERE id = ?`);
    return stmt.get(productId);
  }

  getAllProducts(filters = {}) {
    let sql = `SELECT * FROM fund_products WHERE 1=1`;
    const params = [];

    if (filters.status) {
      sql += ` AND status = ?`;
      params.push(filters.status);
    }
    if (filters.type) {
      sql += ` AND type = ?`;
      params.push(filters.type);
    }
    if (filters.risk_level) {
      sql += ` AND risk_level <= ?`;
      params.push(filters.risk_level);
    }

    sql += ` ORDER BY created_at DESC`;

    const stmt = db.prepare(sql);
    return stmt.all(...params);
  }
}

export default new OrderService();
