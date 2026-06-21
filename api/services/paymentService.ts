import db from '../db/database.js';
import { RechargeRecord, PaymentChannel, PaymentStatus } from '../../shared/types.js';
import { generateId } from '../utils/hash.js';
import { updateStudentBalance } from './studentService.js';

function rowToRecharge(row: {
  id: string; student_id: string; amount: number; channel: string;
  status: string; external_transaction_id: string | null;
  created_at: number; paid_at: number | null;
}): RechargeRecord {
  return {
    id: row.id,
    studentId: row.student_id,
    amount: row.amount,
    channel: row.channel as PaymentChannel,
    status: row.status as PaymentStatus,
    externalTransactionId: row.external_transaction_id,
    createdAt: row.created_at,
    paidAt: row.paid_at,
  };
}

export function createRecharge(
  studentId: string,
  amount: number,
  channel: PaymentChannel
): RechargeRecord {
  const id = generateId('rc');
  const createdAt = Date.now();

  db.prepare(`
    INSERT INTO recharge_records (id, student_id, amount, channel, status, created_at)
    VALUES (?, ?, ?, ?, 'pending', ?)
  `).run(id, studentId, amount, channel, createdAt);

  return {
    id,
    studentId,
    amount,
    channel,
    status: 'pending',
    externalTransactionId: null,
    createdAt,
    paidAt: null,
  };
}

export function processPayment(rechargeId: string): RechargeRecord | null {
  const record = db.prepare('SELECT * FROM recharge_records WHERE id = ?').get(rechargeId) as any;
  if (!record || record.status !== 'pending') return null;

  const externalTransactionId = `${record.channel === 'alipay' ? 'ALI' : 'WX'}${generateId('ext').slice(0, 20)}`;
  const paidAt = Date.now();

  db.prepare(`
    UPDATE recharge_records SET 
      status = 'success', external_transaction_id = ?, paid_at = ?
    WHERE id = ?
  `).run(externalTransactionId, paidAt, rechargeId);

  updateStudentBalance(record.student_id, record.amount);

  const result = db.prepare('SELECT * FROM recharge_records WHERE id = ?').get(rechargeId) as any;
  return rowToRecharge(result);
}

export function getRechargeRecords(studentId: string, limit = 20): RechargeRecord[] {
  const rows = db.prepare(`
    SELECT * FROM recharge_records WHERE student_id = ?
    ORDER BY created_at DESC LIMIT ?
  `).all(studentId, limit) as any[];
  return rows.map(rowToRecharge);
}
