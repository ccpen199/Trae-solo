import db from '../db/database.ts';
import { createException, autoReassign } from './circuitBreaker.ts';

type CreditChangeType = 'service_score' | 'violation' | 'bonus' | 'penalty';

const CREDIT_RULES = {
  ON_TIME_DELIVERY: { amount: 2, type: 'service_score' as CreditChangeType, reason: 'On-time delivery' },
  LATE_DELIVERY: { amount: -5, type: 'service_score' as CreditChangeType, reason: 'Late delivery' },
  PICKUP_TIMEOUT: { amount: -10, type: 'violation' as CreditChangeType, reason: 'Pickup timeout' },
  DELIVERY_TIMEOUT: { amount: -15, type: 'violation' as CreditChangeType, reason: 'Delivery timeout' },
  COMPLAINT: { amount: -20, type: 'violation' as CreditChangeType, reason: 'Customer complaint' },
  CONSECUTIVE_10_ONTIME: { amount: 5, type: 'bonus' as CreditChangeType, reason: '10 consecutive on-time deliveries' },
};

const MIN_SCORE = 0;
const MAX_SCORE = 200;

function logCreditChange(
  knightId: number,
  changeAmount: number,
  oldScore: number,
  newScore: number,
  reason: string,
  type: CreditChangeType,
  waybillId?: number
) {
  db.prepare(`
    INSERT INTO knight_credit_logs (knight_id, change_amount, old_score, new_score, reason, type, waybill_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(knightId, changeAmount, oldScore, newScore, reason, type, waybillId || null);
}

export function adjustCreditScore(
  knightId: number,
  changeAmount: number,
  reason: string,
  type: CreditChangeType,
  waybillId?: number
): { newScore: number; suspended: boolean } {
  const knight = db.prepare('SELECT credit_score, status FROM knights WHERE id = ?').get(knightId) as { credit_score: number; status: string };

  if (!knight) {
    throw new Error('Knight not found');
  }

  const oldScore = knight.credit_score;
  const newScore = Math.max(MIN_SCORE, Math.min(MAX_SCORE, oldScore + changeAmount));
  let suspended = false;

  db.prepare('UPDATE knights SET credit_score = ? WHERE id = ?').run(newScore, knightId);
  logCreditChange(knightId, changeAmount, oldScore, newScore, reason, type, waybillId);

  if (newScore <= 0 && knight.status !== 'suspended') {
    db.prepare("UPDATE knights SET status = 'suspended', current_load = 0 WHERE id = ?").run(knightId);
    suspended = true;

    const activeWaybills = db.prepare(`
      SELECT id FROM waybills
      WHERE knight_id = ? AND status IN ('accepted', 'picked_up', 'delivering')
    `).all(knightId) as { id: number }[];

    activeWaybills.forEach((w: { id: number }) => {
      const exception = createException(w.id, 'knight_offline', knightId);
      autoReassign(exception.id);
    });
  }

  return { newScore, suspended };
}

export function recordOnTimeDelivery(knightId: number, waybillId: number) {
  const result = adjustCreditScore(
    knightId,
    CREDIT_RULES.ON_TIME_DELIVERY.amount,
    CREDIT_RULES.ON_TIME_DELIVERY.reason,
    CREDIT_RULES.ON_TIME_DELIVERY.type,
    waybillId
  );

  const completedCount = db.prepare(`
    SELECT COUNT(*) as count FROM waybill_status_log
    WHERE to_status IN ('signed', 'completed')
    AND waybill_id IN (
      SELECT id FROM waybills WHERE knight_id = ?
    )
    ORDER BY created_at DESC
    LIMIT 10
  `).get(knightId) as { count: number };

  if (completedCount.count >= 10) {
    adjustCreditScore(
      knightId,
      CREDIT_RULES.CONSECUTIVE_10_ONTIME.amount,
      CREDIT_RULES.CONSECUTIVE_10_ONTIME.reason,
      CREDIT_RULES.CONSECUTIVE_10_ONTIME.type,
      waybillId
    );
  }

  return result;
}

export function recordLateDelivery(knightId: number, waybillId: number) {
  return adjustCreditScore(
    knightId,
    CREDIT_RULES.LATE_DELIVERY.amount,
    CREDIT_RULES.LATE_DELIVERY.reason,
    CREDIT_RULES.LATE_DELIVERY.type,
    waybillId
  );
}

export function recordPickupTimeout(knightId: number, waybillId: number) {
  return adjustCreditScore(
    knightId,
    CREDIT_RULES.PICKUP_TIMEOUT.amount,
    CREDIT_RULES.PICKUP_TIMEOUT.reason,
    CREDIT_RULES.PICKUP_TIMEOUT.type,
    waybillId
  );
}

export function recordDeliveryTimeout(knightId: number, waybillId: number) {
  return adjustCreditScore(
    knightId,
    CREDIT_RULES.DELIVERY_TIMEOUT.amount,
    CREDIT_RULES.DELIVERY_TIMEOUT.reason,
    CREDIT_RULES.DELIVERY_TIMEOUT.type,
    waybillId
  );
}

export function recordComplaint(knightId: number, waybillId: number) {
  return adjustCreditScore(
    knightId,
    CREDIT_RULES.COMPLAINT.amount,
    CREDIT_RULES.COMPLAINT.reason,
    CREDIT_RULES.COMPLAINT.type,
    waybillId
  );
}

export function getCreditHistory(knightId: number, limit: number = 50, offset: number = 0) {
  const logs = db.prepare(`
    SELECT kcl.*, w.order_no
    FROM knight_credit_logs kcl
    LEFT JOIN waybills w ON kcl.waybill_id = w.id
    WHERE kcl.knight_id = ?
    ORDER BY kcl.created_at DESC
    LIMIT ? OFFSET ?
  `).all(knightId, limit, offset).map((row: any) => ({
    ...row,
    score_change: row.change_amount,
    score_after: row.new_score,
    score_before: row.old_score,
  }));

  const total = db.prepare('SELECT COUNT(*) as count FROM knight_credit_logs WHERE knight_id = ?').get(knightId) as { count: number };

  return { logs, total: total.count };
}
