import { db } from '../config/database.js';
import crypto from 'crypto';
import type { VipPoints, Coupon, User } from '../types/index.js';

export function getUserPoints(userId: string): { total: number; details: VipPoints[] } {
  const stmt = db.prepare(`
    SELECT id, user_id, points, source, expired_at, created_at
    FROM vip_points
    WHERE user_id = ? AND (expired_at IS NULL OR expired_at > ?)
    ORDER BY created_at DESC
  `);
  
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
  const points = stmt.all(userId, now) as VipPoints[];
  
  const total = points.reduce((sum, p) => sum + p.points, 0);
  
  return { total, details: points };
}

export function addPoints(userId: string, points: number, source: string): boolean {
  const userStmt = db.prepare(`
    SELECT id, is_vip, vip_level FROM users WHERE id = ?
  `);
  const user = userStmt.get(userId) as User;
  
  if (!user) return false;
  
  const bonusMultiplier = user.is_vip ? 1 + user.vip_level * 0.1 : 1;
  const finalPoints = Math.floor(points * bonusMultiplier);
  
  const insertStmt = db.prepare(`
    INSERT INTO vip_points (id, user_id, points, source, expired_at)
    VALUES (?, ?, ?, ?, ?)
  `);
  
  const expiredAt = new Date();
  expiredAt.setMonth(expiredAt.getMonth() + 3);
  
  const result = insertStmt.run(
    crypto.randomUUID(),
    userId,
    finalPoints,
    source,
    expiredAt.toISOString().slice(0, 19).replace('T', ' ')
  );
  
  return result.changes > 0;
}

export function usePoints(userId: string, points: number): boolean {
  const { total } = getUserPoints(userId);
  
  if (total < points) return false;
  
  const transaction = db.transaction(() => {
    const stmt = db.prepare(`
      SELECT id, points FROM vip_points
      WHERE user_id = ? AND (expired_at IS NULL OR expired_at > ?)
      ORDER BY created_at ASC
    `);
    
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const pointRecords = stmt.all(userId, now) as VipPoints[];
    
    let remaining = points;
    const deductStmt = db.prepare(`
      UPDATE vip_points SET points = points - ? WHERE id = ?
    `);
    
    for (const record of pointRecords) {
      if (remaining <= 0) break;
      
      const deduct = Math.min(record.points, remaining);
      deductStmt.run(deduct, record.id);
      remaining -= deduct;
    }
    
    const deleteStmt = db.prepare(`
      DELETE FROM vip_points WHERE points = 0
    `);
    deleteStmt.run();
    
    return remaining === 0;
  });
  
  try {
    return transaction();
  } catch (error) {
    console.error('Use points error:', error);
    return false;
  }
}

export function getUserCoupons(userId: string): Coupon[] {
  const stmt = db.prepare(`
    SELECT id, user_id, type, value, is_used, expired_at, created_at
    FROM coupons
    WHERE user_id = ?
    ORDER BY created_at DESC
  `);
  return stmt.all(userId) as Coupon[];
}

export function issueBuy1Get1Coupon(userId: string): Coupon | null {
  const userStmt = db.prepare(`
    SELECT id, is_vip, vip_level FROM users WHERE id = ?
  `);
  const user = userStmt.get(userId) as User;
  
  if (!user || !user.is_vip) return null;
  
  const existingCouponStmt = db.prepare(`
    SELECT COUNT(*) as count FROM coupons
    WHERE user_id = ? AND type = 'buy1get1' AND is_used = 0 AND (expired_at IS NULL OR expired_at > ?)
  `);
  
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
  const result = existingCouponStmt.get(userId, now) as { count: number };
  
  if (result.count >= 2) return null;
  
  const couponId = crypto.randomUUID();
  const expiredAt = new Date();
  expiredAt.setMonth(expiredAt.getMonth() + 1);
  
  const insertStmt = db.prepare(`
    INSERT INTO coupons (id, user_id, type, value, is_used, expired_at)
    VALUES (?, ?, 'buy1get1', 1, 0, ?)
  `);
  
  const insertResult = insertStmt.run(
    couponId,
    userId,
    expiredAt.toISOString().slice(0, 19).replace('T', ' ')
  );
  
  if (insertResult.changes > 0) {
    return {
      id: couponId,
      user_id: userId,
      type: 'buy1get1',
      value: 1,
      is_used: 0,
      expired_at: expiredAt.toISOString().slice(0, 19).replace('T', ' '),
      created_at: new Date().toISOString()
    };
  }
  
  return null;
}

export function issueDiscountCoupon(userId: string, value: number): Coupon | null {
  const userStmt = db.prepare(`
    SELECT id, is_vip FROM users WHERE id = ?
  `);
  const user = userStmt.get(userId) as User;
  
  if (!user || !user.is_vip) return null;
  
  const couponId = crypto.randomUUID();
  const expiredAt = new Date();
  expiredAt.setMonth(expiredAt.getMonth() + 1);
  
  const insertStmt = db.prepare(`
    INSERT INTO coupons (id, user_id, type, value, is_used, expired_at)
    VALUES (?, ?, 'discount', ?, 0, ?)
  `);
  
  const insertResult = insertStmt.run(
    couponId,
    userId,
    value,
    expiredAt.toISOString().slice(0, 19).replace('T', ' ')
  );
  
  if (insertResult.changes > 0) {
    return {
      id: couponId,
      user_id: userId,
      type: 'discount',
      value,
      is_used: 0,
      expired_at: expiredAt.toISOString().slice(0, 19).replace('T', ' '),
      created_at: new Date().toISOString()
    };
  }
  
  return null;
}

export function getVipInfo(userId: string): {
  user: User;
  points_total: number;
  coupons_count: number;
  vip_benefits: string[];
} | null {
  const userStmt = db.prepare(`
    SELECT id, phone, nickname, avatar, is_vip, vip_level, view_history_vector, content_quality_score, created_at
    FROM users WHERE id = ?
  `);
  const user = userStmt.get(userId) as User;
  
  if (!user) return null;
  
  const { total: pointsTotal } = getUserPoints(userId);
  
  const couponCountStmt = db.prepare(`
    SELECT COUNT(*) as count FROM coupons
    WHERE user_id = ? AND is_used = 0 AND (expired_at IS NULL OR expired_at > ?)
  `);
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
  const couponResult = couponCountStmt.get(userId, now) as { count: number };
  
  const benefits: string[] = [];
  if (user.is_vip) {
    benefits.push('积分加速获取');
    benefits.push('专享优惠价格');
    if (user.vip_level >= 1) benefits.push('买一赠一券');
    if (user.vip_level >= 2) benefits.push('优先选座');
    if (user.vip_level >= 3) benefits.push('专属客服');
  }
  
  return {
    user,
    points_total: pointsTotal,
    coupons_count: couponResult.count,
    vip_benefits: benefits
  };
}

export function checkIn(userId: string): { success: boolean; points: number; consecutive_days: number } {
  const today = new Date().toISOString().split('T')[0];
  
  const checkStmt = db.prepare(`
    SELECT id FROM vip_points
    WHERE user_id = ? AND source = '签到奖励' AND DATE(created_at) = ?
  `);
  const existing = checkStmt.get(userId, today);
  
  if (existing) {
    return { success: false, points: 0, consecutive_days: 0 };
  }
  
  const historyStmt = db.prepare(`
    SELECT DISTINCT DATE(created_at) as date
    FROM vip_points
    WHERE user_id = ? AND source = '签到奖励'
    ORDER BY created_at DESC
    LIMIT 7
  `);
  const history = historyStmt.all(userId) as Array<{ date: string }>;
  
  let consecutiveDays = 1;
  for (let i = 0; i < history.length; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(checkDate.getDate() - (i + 1));
    const checkDateStr = checkDate.toISOString().split('T')[0];
    
    if (history[i].date === checkDateStr) {
      consecutiveDays++;
    } else {
      break;
    }
  }
  
  const basePoints = 10;
  const bonusPoints = consecutiveDays > 1 ? Math.min(consecutiveDays - 1, 6) * 5 : 0;
  const totalPoints = basePoints + bonusPoints;
  
  const result = addPoints(userId, totalPoints, '签到奖励');
  
  return {
    success: result,
    points: result ? totalPoints : 0,
    consecutive_days: consecutiveDays
  };
}
