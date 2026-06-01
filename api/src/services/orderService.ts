import { db } from '../config/database.js';
import crypto from 'crypto';
import type { Order, TicketContract, Seat } from '../types/index.js';

function generateBlockchainHash(orderId: string, seatId: string, userId: string, timestamp: number): string {
  const data = `${orderId}:${seatId}:${userId}:${timestamp}:${crypto.randomBytes(32).toString('hex')}`;
  return crypto.createHash('sha256').update(data).digest('hex');
}

function generateWatermarkSeed(orderId: string, userId: string): string {
  const data = `${orderId}:${userId}:${Date.now()}:${crypto.randomBytes(16).toString('hex')}`;
  return crypto.createHash('md5').update(data).digest('hex');
}

export function createOrder(
  userId: string,
  sessionId: string,
  seatIds: string[],
  couponId?: string
): { order: Order; contracts: TicketContract[] } | null {
  const checkSeatsStmt = db.prepare(`
    SELECT id, session_id, row_num, col_num, status, seat_type, view_angle, price
    FROM seats 
    WHERE id IN (${seatIds.map(() => '?').join(', ')}) AND status = 'available'
  `);
  
  const seats = checkSeatsStmt.all(...seatIds) as Seat[];
  
  if (seats.length !== seatIds.length) {
    return null;
  }
  
  if (seats.some(s => s.session_id !== sessionId)) {
    return null;
  }
  
  const totalAmount = seats.reduce((sum, seat) => sum + seat.price, 0);
  
  let discountAmount = 0;
  if (couponId) {
    const couponStmt = db.prepare(`
      SELECT id, user_id, type, value, is_used, expired_at
      FROM coupons 
      WHERE id = ? AND user_id = ? AND is_used = 0
    `);
    const coupon = couponStmt.get(couponId, userId);
    
    if (coupon) {
      if ((coupon as { expired_at: string }).expired_at && new Date((coupon as { expired_at: string }).expired_at) < new Date()) {
        return null;
      }
      
      if ((coupon as { type: string }).type === 'discount') {
        discountAmount = (coupon as { value: number }).value;
      } else if ((coupon as { type: string }).type === 'buy1get1') {
        const minPrice = Math.min(...seats.map(s => s.price));
        discountAmount = minPrice;
      }
    }
  }
  
  const finalAmount = Math.max(0, Math.round((totalAmount - discountAmount) * 100) / 100);
  const orderId = crypto.randomUUID();
  const timestamp = Date.now();
  
  const transaction = db.transaction(() => {
    const insertOrderStmt = db.prepare(`
      INSERT INTO orders (id, user_id, session_id, total_amount, status, coupon_id)
      VALUES (?, ?, ?, ?, 'pending', ?)
    `);
    insertOrderStmt.run(orderId, userId, sessionId, finalAmount, couponId || null);
    
    if (couponId) {
      const updateCouponStmt = db.prepare(`
        UPDATE coupons SET is_used = 1 WHERE id = ?
      `);
      updateCouponStmt.run(couponId);
    }
    
    const updateSeatStmt = db.prepare(`
      UPDATE seats SET status = 'locked' WHERE id = ?
    `);
    
    const insertContractStmt = db.prepare(`
      INSERT INTO ticket_contracts (id, order_id, seat_id, seat_number, blockchain_hash, transfer_restricted, refund_policy, watermark_seed)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const contracts: TicketContract[] = [];
    
    for (const seat of seats) {
      updateSeatStmt.run(seat.id);
      
      const contractId = crypto.randomUUID();
      const seatNumber = `${seat.row_num}排${seat.col_num}座`;
      const blockchainHash = generateBlockchainHash(orderId, seat.id, userId, timestamp);
      const watermarkSeed = generateWatermarkSeed(orderId, userId);
      const refundPolicy = '开场前24小时可退票，收取10%手续费；开场前2小时可改签；开场后不可退改';
      
      insertContractStmt.run(
        contractId,
        orderId,
        seat.id,
        seatNumber,
        blockchainHash,
        1,
        refundPolicy,
        watermarkSeed
      );
      
      contracts.push({
        id: contractId,
        order_id: orderId,
        seat_id: seat.id,
        seat_number: seatNumber,
        blockchain_hash: blockchainHash,
        transfer_restricted: 1,
        refund_policy: refundPolicy,
        watermark_seed: watermarkSeed,
        created_at: new Date().toISOString()
      });
    }
    
    const orderStmt = db.prepare(`
      SELECT id, user_id, session_id, total_amount, status, coupon_id, created_at
      FROM orders WHERE id = ?
    `);
    const order = orderStmt.get(orderId) as Order;
    
    return { order, contracts };
  });
  
  try {
    return transaction();
  } catch (error) {
    console.error('Create order error:', error);
    return null;
  }
}

export function confirmOrder(orderId: string): boolean {
  const transaction = db.transaction(() => {
    const orderStmt = db.prepare(`
      SELECT id, status FROM orders WHERE id = ?
    `);
    const order = orderStmt.get(orderId);
    
    if (!order || (order as { status: string }).status !== 'pending') {
      return false;
    }
    
    const updateOrderStmt = db.prepare(`
      UPDATE orders SET status = 'paid' WHERE id = ?
    `);
    updateOrderStmt.run(orderId);
    
    const contractStmt = db.prepare(`
      SELECT seat_id FROM ticket_contracts WHERE order_id = ?
    `);
    const contracts = contractStmt.all(orderId) as Array<{ seat_id: string }>;
    
    const updateSeatStmt = db.prepare(`
      UPDATE seats SET status = 'sold' WHERE id = ?
    `);
    
    for (const contract of contracts) {
      updateSeatStmt.run(contract.seat_id);
    }
    
    const orderForPointsStmt = db.prepare(`
      SELECT user_id, total_amount FROM orders WHERE id = ?
    `);
    const orderForPoints = orderForPointsStmt.get(orderId) as { user_id: string; total_amount: number };
    
    if (orderForPoints) {
      const points = Math.floor(orderForPoints.total_amount);
      const insertPointsStmt = db.prepare(`
        INSERT INTO vip_points (id, user_id, points, source, expired_at)
        VALUES (?, ?, ?, '购票奖励', ?)
      `);
      
      const expiredAt = new Date();
      expiredAt.setMonth(expiredAt.getMonth() + 3);
      
      insertPointsStmt.run(
        crypto.randomUUID(),
        orderForPoints.user_id,
        points,
        expiredAt.toISOString().slice(0, 19).replace('T', ' ')
      );
    }
    
    return true;
  });
  
  try {
    return transaction();
  } catch (error) {
    console.error('Confirm order error:', error);
    return false;
  }
}

export function getOrderById(orderId: string): (Order & { contracts: TicketContract[] }) | null {
  const orderStmt = db.prepare(`
    SELECT id, user_id, session_id, total_amount, status, coupon_id, created_at
    FROM orders WHERE id = ?
  `);
  const order = orderStmt.get(orderId) as Order;
  
  if (!order) return null;
  
  const contractStmt = db.prepare(`
    SELECT id, order_id, seat_id, seat_number, blockchain_hash, transfer_restricted, refund_policy, watermark_seed, created_at
    FROM ticket_contracts WHERE order_id = ?
  `);
  const contracts = contractStmt.all(orderId) as TicketContract[];
  
  return { ...order, contracts };
}

export function getUserOrders(userId: string): Order[] {
  const stmt = db.prepare(`
    SELECT id, user_id, session_id, total_amount, status, coupon_id, created_at
    FROM orders WHERE user_id = ?
    ORDER BY created_at DESC
  `);
  return stmt.all(userId) as Order[];
}

export function cancelOrder(orderId: string): boolean {
  const transaction = db.transaction(() => {
    const orderStmt = db.prepare(`
      SELECT id, status, coupon_id FROM orders WHERE id = ?
    `);
    const order = orderStmt.get(orderId);
    
    if (!order || (order as { status: string }).status !== 'pending') {
      return false;
    }
    
    const updateOrderStmt = db.prepare(`
      UPDATE orders SET status = 'cancelled' WHERE id = ?
    `);
    updateOrderStmt.run(orderId);
    
    if ((order as { coupon_id: string }).coupon_id) {
      const updateCouponStmt = db.prepare(`
        UPDATE coupons SET is_used = 0 WHERE id = ?
      `);
      updateCouponStmt.run((order as { coupon_id: string }).coupon_id);
    }
    
    const contractStmt = db.prepare(`
      SELECT seat_id FROM ticket_contracts WHERE order_id = ?
    `);
    const contracts = contractStmt.all(orderId) as Array<{ seat_id: string }>;
    
    const updateSeatStmt = db.prepare(`
      UPDATE seats SET status = 'available' WHERE id = ?
    `);
    
    for (const contract of contracts) {
      updateSeatStmt.run(contract.seat_id);
    }
    
    const deleteContractStmt = db.prepare(`
      DELETE FROM ticket_contracts WHERE order_id = ?
    `);
    deleteContractStmt.run(orderId);
    
    return true;
  });
  
  try {
    return transaction();
  } catch (error) {
    console.error('Cancel order error:', error);
    return false;
  }
}
