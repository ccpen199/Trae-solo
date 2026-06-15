import { db } from '../database';
import { generateId, generateOrderNo, now } from '../utils';
import { supplierManager } from './suppliers';
import { riskEngine } from './risk';
import { promotionEngine, CalculateInput } from './promotion';
import { commissionService } from './commission';
import { cardPoolService } from './cardPool';
import { rechargeDiagnosticService } from './diagnostic';

interface CreateOrderInput {
  userId: string;
  productId: string;
  rechargeAccount: string;
  quantity: number;
  ip: string;
  region: string;
}

interface OrderResult {
  success: boolean;
  order?: any;
  error?: string;
  riskBlocked?: boolean;
}

class OrderService {
  async createOrder(input: CreateOrderInput): Promise<OrderResult> {
    const product: any = db.prepare('SELECT * FROM products WHERE id = ? AND status = 1').get(input.productId);
    if (!product) return { success: false, error: '商品不存在或已下架' };
    if (product.stock < input.quantity && product.sku_type === 'card') {
      return { success: false, error: '商品库存不足' };
    }

    const user: any = db.prepare('SELECT * FROM users WHERE id = ?').get(input.userId);
    if (!user) return { success: false, error: '用户不存在' };

    const riskResult = riskEngine.check({
      userId: input.userId,
      ip: input.ip,
      region: input.region,
      productId: input.productId,
      action: 'create_order',
      amount: product.price * input.quantity,
      account: input.rechargeAccount
    });

    if (!riskResult.passed || riskResult.blocked) {
      return { success: false, error: riskResult.reason || '风控校验未通过', riskBlocked: true };
    }

    const calcInput: CalculateInput = {
      items: [{
        productId: product.id,
        productName: product.name,
        unitPrice: product.price,
        quantity: input.quantity,
        categoryId: product.category_id
      }],
      userId: input.userId
    };
    const priceResult = promotionEngine.calculate(calcInput);

    const originalAmount = priceResult.originalAmount;
    const finalAmount = priceResult.finalAmount;
    const discountAmount = priceResult.totalDiscount;
    const commissionAmount = Math.round(finalAmount * (product.commission_rate || 0.05) * 100) / 100;

    const orderId = generateId();
    const orderNo = generateOrderNo();
    const t = now();

    const tx = db.transaction(() => {
      db.prepare(`
        INSERT INTO orders (id, user_id, product_id, product_name, supplier_id, order_no, recharge_account,
          quantity, face_value, unit_price, original_amount, discount_amount, final_amount, commission_amount,
          status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)
      `).run(orderId, input.userId, product.id, product.name, product.supplier_id, orderNo,
        input.rechargeAccount, input.quantity, product.face_value, product.price,
        originalAmount, discountAmount, finalAmount, commissionAmount, t, t);

      if (product.sku_type === 'card') {
        for (let i = 0; i < input.quantity; i++) {
          const card = cardPoolService.consumeCard(orderId, product.id, product.supplier_id);
          if (!card) throw new Error('卡密占用失败');
        }
      }
    });

    try {
      tx();
    } catch (e: any) {
      return { success: false, error: e.message || '创建订单失败' };
    }

    return {
      success: true,
      order: {
        id: orderId,
        orderNo,
        finalAmount,
        originalAmount,
        discountAmount,
        commissionAmount,
        discountDetails: priceResult.discountDetails,
        cashbackAmount: priceResult.cashbackAmount
      }
    };
  }

  async payOrder(orderId: string, userId: string): Promise<{ success: boolean; order?: any; error?: string }> {
    const order: any = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(orderId, userId);
    if (!order) return { success: false, error: '订单不存在' };
    if (order.status !== 'pending') return { success: false, error: '订单状态不允许支付' };

    const user: any = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    if (!user || user.balance < order.final_amount) {
      return { success: false, error: '余额不足，请充值' };
    }

    const t = now();
    const tx = db.transaction(() => {
      db.prepare('UPDATE users SET balance = balance - ? WHERE id = ?').run(order.final_amount, userId);
      db.prepare(`UPDATE orders SET status = 'paid', pay_time = ?, updated_at = ? WHERE id = ?`)
        .run(t, t, orderId);
    });

    try {
      tx();
    } catch (e: any) {
      return { success: false, error: e.message || '支付失败' };
    }

    setTimeout(() => this.executeRecharge(orderId), 500);

    return { success: true, order: { ...order, status: 'paid' } };
  }

  async executeRecharge(orderId: string): Promise<void> {
    const order: any = db.prepare(`
      SELECT o.*, p.sku_type as product_type, p.recharge_type, s.code as supplier_code
      FROM orders o
      JOIN products p ON o.product_id = p.id
      LEFT JOIN suppliers s ON o.supplier_id = s.id
      WHERE o.id = ?
    `).get(orderId);

    if (!order || order.status !== 'paid') return;

    const t = now();
    db.prepare(`UPDATE orders SET status = 'recharging', updated_at = ? WHERE id = ?`).run(t, orderId);

    if (order.product_type === 'card') {
      this.completeCardOrder(orderId);
      return;
    }

    const supplier = supplierManager.getSupplier(order.supplier_code);
    if (!supplier) {
      this.markOrderFailed(orderId, 'SUPPLIER_NOT_FOUND', '供应商服务不可用');
      return;
    }

    try {
      const result = await supplierManager.rechargeWithFallback({
        orderId,
        productId: order.product_id,
        supplierProductId: order.supplier_product_id || '',
        account: order.recharge_account,
        quantity: order.quantity,
        amount: order.final_amount,
        currentSupplierCode: order.supplier_code
      });

      if (result.success) {
        const finalizeT = now();
        db.prepare(`UPDATE orders SET status = 'completed', supplier_order_id = ?,
          recharge_time = ?, finish_time = ?, updated_at = ? WHERE id = ?`)
          .run(result.supplierOrderId, finalizeT, finalizeT, finalizeT, orderId);

        this.postOrderSuccess(orderId);
      } else {
        this.markOrderFailed(orderId, result.errorCode || 'RECHARGE_FAIL', result.errorMessage || '充值失败');
      }
    } catch (e: any) {
      this.markOrderFailed(orderId, 'EXCEPTION', e.message || '充值异常');
    }
  }

  private completeCardOrder(orderId: string) {
    const t = now();
    db.prepare(`UPDATE orders SET status = 'completed', recharge_time = ?, finish_time = ?, updated_at = ? WHERE id = ?`)
      .run(t, t, t, orderId);
    this.postOrderSuccess(orderId);
  }

  private markOrderFailed(orderId: string, errorCode: string, errorMessage: string) {
    const order: any = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
    if (!order) return;

    const t = now();
    const newRetryCount = (order.retry_count || 0) + 1;

    db.prepare(`UPDATE orders SET status = 'failed', fail_reason = ?, supplier_code = ?,
      retry_count = ?, updated_at = ? WHERE id = ?`)
      .run(`${errorCode}:${errorMessage}`, order.supplier_code, newRetryCount, t, orderId);

    const diagnostic = rechargeDiagnosticService.diagnose(orderId);
    rechargeDiagnosticService.performAutoActions(diagnostic);

    setTimeout(() => {
      if (diagnostic.switchChannel) {
        this.switchChannelAndRetry(orderId);
      } else if (diagnostic.retryable && newRetryCount < 3) {
        const delay = Math.pow(2, newRetryCount) * 30 * 1000;
        setTimeout(() => this.executeRecharge(orderId), delay);
      }
    }, 1000);
  }

  private async switchChannelAndRetry(orderId: string) {
    const order: any = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
    if (!order) return;

    const channels: any[] = db.prepare(`
      SELECT rc.*, s.code as supplier_code
      FROM recharge_channels rc
      JOIN suppliers s ON rc.supplier_id = s.id
      WHERE rc.product_id = ? AND rc.status = 1 AND rc.supplier_id != ?
      ORDER BY rc.priority DESC, rc.success_rate DESC
      LIMIT 1
    `).all(order.product_id, order.supplier_id);

    if (channels.length > 0) {
      const channel = channels[0];
      db.prepare(`UPDATE orders SET supplier_id = ?, supplier_code = ?, channel_switched = 1, updated_at = ? WHERE id = ?`)
        .run(channel.supplier_id, channel.supplier_code, now(), orderId);
    }

    this.executeRecharge(orderId);
  }

  private postOrderSuccess(orderId: string) {
    const order: any = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
    if (!order) return;

    commissionService.calculateCommission(orderId, order.user_id, order.final_amount);

    const user: any = db.prepare('SELECT balance FROM users WHERE id = ?').get(order.user_id);
  }

  retryOrder(orderId: string, userId: string): { success: boolean; error?: string } {
    const order: any = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(orderId, userId);
    if (!order) return { success: false, error: '订单不存在' };
    if (!['failed', 'retrying'].includes(order.status)) {
      return { success: false, error: '订单状态不允许重试' };
    }

    setTimeout(() => this.executeRecharge(orderId), 100);
    return { success: true };
  }

  getUserOrders(userId: string, status?: string, page: number = 1, pageSize: number = 20): { list: any[]; total: number; hasMore: boolean } {
    const wheres: string[] = ['o.user_id = ?'];
    const params: any[] = [userId];

    if (status && status !== 'all') {
      wheres.push('o.status = ?');
      params.push(status);
    }

    const whereSql = 'WHERE ' + wheres.join(' AND ');
    const totalRow: any = db.prepare(`SELECT COUNT(*) as cnt FROM orders o ${whereSql}`).get(...params);

    const offset = (page - 1) * pageSize;
    params.push(pageSize + 1, offset);

    const rows = db.prepare(`
      SELECT o.id, o.order_no, o.product_name, o.quantity, o.unit_price, o.original_amount,
             o.discount_amount, o.final_amount, o.status, o.recharge_account,
             o.fail_reason, o.created_at, o.finish_time, o.diagnostic_result,
             p.image, p.sku_type
      FROM orders o
      LEFT JOIN products p ON o.product_id = p.id
      ${whereSql}
      ORDER BY o.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params);

    const hasMore = rows.length > pageSize;
    const list = rows.slice(0, pageSize).map(row => {
      const r: any = { ...row };
      if (r.diagnostic_result) {
        try { r.diagnostic_result = JSON.parse(r.diagnostic_result); } catch { }
      }
      return r;
    });

    return { list, total: totalRow.cnt, hasMore };
  }

  getOrderDetail(orderId: string, userId?: string): any | null {
    const sql = userId
      ? `SELECT o.*, p.image, p.sku_type, p.description, s.name as supplier_name
         FROM orders o LEFT JOIN products p ON o.product_id = p.id
         LEFT JOIN suppliers s ON o.supplier_id = s.id
         WHERE o.id = ? AND o.user_id = ?`
      : `SELECT o.*, p.image, p.sku_type, p.description, s.name as supplier_name
         FROM orders o LEFT JOIN products p ON o.product_id = p.id
         LEFT JOIN suppliers s ON o.supplier_id = s.id
         WHERE o.id = ?`;

    const params = userId ? [orderId, userId] : [orderId];
    const order: any = db.prepare(sql).get(...params);
    if (!order) return null;

    if (order.sku_type === 'card') {
      const cards: any[] = db.prepare('SELECT * FROM card_pool WHERE order_id = ?').all(orderId);
      order.cards = cards.map(c => {
        try {
          return cardPoolService.decryptCard(c.id);
        } catch { return null; }
      }).filter(Boolean);
    }

    if (order.diagnostic_result) {
      try { order.diagnostic_result = JSON.parse(order.diagnostic_result); } catch { }
    }

    return order;
  }

  getOrderCards(orderId: string, userId: string): { cardNumber: string; cardPassword: string }[] | null {
    const order: any = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(orderId, userId);
    if (!order || order.status !== 'completed') return null;

    const cards: any[] = db.prepare('SELECT id FROM card_pool WHERE order_id = ?').all(orderId);
    return cards.map(c => cardPoolService.decryptCard(c.id)).filter(Boolean) as any;
  }
}

export const orderService = new OrderService();
