import { getDb } from '../db';
import { nowTimestamp } from '../utils';
import type { CreditScoreRecord, Rider } from '../types';

export interface CreditAdjustParams {
  order_id?: number;
  complaint_id?: number;
  reason?: string;
}

export function adjustCreditScore(
  riderId: number,
  changeAmount: number,
  changeType: string,
  params?: CreditAdjustParams
): CreditScoreRecord | null {
  const db = getDb();
  const now = nowTimestamp();

  const rider = db.prepare('SELECT * FROM riders WHERE id = ?').get(riderId) as Rider | undefined;
  if (!rider) return null;

  const beforeScore = rider.credit_score;
  let afterScore = beforeScore + changeAmount;
  afterScore = Math.max(0, Math.min(100, afterScore));

  const tx = db.transaction(() => {
    db.prepare(
      `UPDATE riders SET credit_score = ?, updated_at = ? WHERE id = ?`
    ).run(afterScore, now, riderId);

    db.prepare(
      `INSERT INTO credit_score_records 
       (rider_id, change_type, change_amount, before_score, after_score, 
        order_id, complaint_id, reason, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      riderId,
      changeType,
      changeAmount,
      beforeScore,
      afterScore,
      params?.order_id || null,
      params?.complaint_id || null,
      params?.reason || null,
      now
    );
  });

  tx();

  return db
    .prepare(
      'SELECT * FROM credit_score_records WHERE rider_id = ? ORDER BY id DESC LIMIT 1'
    )
    .get(riderId) as CreditScoreRecord;
}

export function getCreditScoreHistory(
  riderId: number,
  page: number = 1,
  pageSize: number = 20
): { list: CreditScoreRecord[]; total: number } {
  const db = getDb();
  const offset = (page - 1) * pageSize;

  const total = db
    .prepare('SELECT COUNT(*) as count FROM credit_score_records WHERE rider_id = ?')
    .get(riderId) as { count: number };

  const list = db
    .prepare(
      'SELECT * FROM credit_score_records WHERE rider_id = ? ORDER BY id DESC LIMIT ? OFFSET ?'
    )
    .all(riderId, pageSize, offset) as CreditScoreRecord[];

  return { list, total: total.count };
}

export function getCreditLevel(score: number): {
  level: string;
  color: string;
  benefits: string[];
} {
  if (score >= 90) {
    return {
      level: 'S级 - 金牌骑士',
      color: '#FFD700',
      benefits: ['优先派单', '高额奖励', '保险补贴', '专属客服'],
    };
  } else if (score >= 80) {
    return {
      level: 'A级 - 优质骑士',
      color: '#C0C0C0',
      benefits: ['优先派单', '奖励加成'],
    };
  } else if (score >= 70) {
    return {
      level: 'B级 - 普通骑士',
      color: '#CD7F32',
      benefits: ['正常派单'],
    };
  } else if (score >= 60) {
    return {
      level: 'C级 - 观察骑士',
      color: '#FF6B6B',
      benefits: ['限制派单数量', '需参加培训'],
    };
  } else {
    return {
      level: 'D级 - 封禁',
      color: '#333',
      benefits: ['暂停接单权限'],
    };
  }
}

export function updateFulfillmentRate(riderId: number, isFulfilled: boolean): void {
  const db = getDb();
  const rider = db.prepare('SELECT * FROM riders WHERE id = ?').get(riderId) as Rider | undefined;
  if (!rider) return;

  const currentRate = rider.fulfillment_rate;
  const alpha = 0.05;
  const newRate = currentRate * (1 - alpha) + (isFulfilled ? 1 : 0) * alpha;

  db.prepare(`UPDATE riders SET fulfillment_rate = ? WHERE id = ?`).run(
    Math.max(0, Math.min(1, newRate)),
    riderId
  );
}

export function rewardOnTimeDelivery(riderId: number, orderId: number): void {
  const db = getDb();
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId) as any;
  if (!order) return;

  adjustCreditScore(riderId, 1, 'on_time_delivery', {
    order_id: orderId,
    reason: '准时送达奖励',
  });

  updateFulfillmentRate(riderId, true);
}
