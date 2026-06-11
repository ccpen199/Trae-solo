import { v4 as uuidv4 } from 'uuid';
import { dbQueries, type Compensation, type Order } from '../db/database.js';

export interface CreateCompensationParams {
  order_id: string;
  user_id: string;
  type: Compensation['type'];
  reason: string;
}

export interface AutoDetectResult {
  should_compensate: boolean;
  type: Compensation['type'] | null;
  reason: string;
  amount: number;
}

const TIMEOUT_THRESHOLD_MINUTES = 30;
const LOST_TIMEOUT_HOURS = 24;

function generateVoucherCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'CMP';
  for (let i = 0; i < 9; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function createCompensation(params: CreateCompensationParams): Compensation {
  const now = new Date().toISOString();
  let amount = 0;

  switch (params.type) {
    case 'timeout':
      amount = 10;
      break;
    case 'lost':
      amount = 50;
      break;
    case 'damaged':
      amount = 30;
      break;
  }

  const compensation: Compensation = {
    id: uuidv4(),
    order_id: params.order_id,
    user_id: params.user_id,
    type: params.type,
    amount,
    voucher_code: null,
    status: 'pending',
    reason: params.reason,
    created_at: now,
    processed_at: null,
  };

  dbQueries.compensations.create().run(compensation);
  return compensation;
}

export function getCompensationById(id: string): Compensation | null {
  return dbQueries.compensations.findById().get(id) as Compensation | null || null;
}

export function getCompensationsByOrderId(orderId: string): Compensation[] {
  return dbQueries.compensations.findByOrderId().all(orderId) as Compensation[];
}

export function getCompensationsByUserId(userId: string): Compensation[] {
  return dbQueries.compensations.findByUserId().all(userId) as Compensation[];
}

export function getCompensationsByStatus(status: Compensation['status']): Compensation[] {
  return dbQueries.compensations.findByStatus().all(status) as Compensation[];
}

export function getAllCompensations(): Compensation[] {
  return dbQueries.compensations.findAll().all() as Compensation[];
}

export function approveCompensation(id: string): Compensation | null {
  const existing = getCompensationById(id);
  if (!existing || existing.status !== 'pending') return null;

  const now = new Date().toISOString();
  const voucherCode = generateVoucherCode();

  dbQueries.compensations.update().run({
    ...existing,
    status: 'approved',
    voucher_code: voucherCode,
    processed_at: now,
  });

  return getCompensationById(id);
}

export function rejectCompensation(id: string): Compensation | null {
  const existing = getCompensationById(id);
  if (!existing || existing.status !== 'pending') return null;

  const now = new Date().toISOString();
  dbQueries.compensations.update().run({
    ...existing,
    status: 'rejected',
    processed_at: now,
  });

  return getCompensationById(id);
}

export function issueVoucher(id: string): Compensation | null {
  const existing = getCompensationById(id);
  if (!existing || existing.status !== 'approved') return null;

  const now = new Date().toISOString();
  dbQueries.compensations.update().run({
    ...existing,
    status: 'issued',
    processed_at: now,
  });

  return getCompensationById(id);
}

export function autoDetectTimeout(order: Order): AutoDetectResult {
  if (!order.estimated_delivery_at || order.status === 'completed' || order.status === 'delivered') {
    return { should_compensate: false, type: null, reason: '', amount: 0 };
  }

  const estimated = new Date(order.estimated_delivery_at).getTime();
  const now = Date.now();
  const diffMinutes = (now - estimated) / (1000 * 60);

  if (diffMinutes > TIMEOUT_THRESHOLD_MINUTES) {
    const extraMinutes = diffMinutes - TIMEOUT_THRESHOLD_MINUTES;
    const amount = Math.min(50, 10 + Math.floor(extraMinutes / 10) * 5);
    return {
      should_compensate: true,
      type: 'timeout',
      reason: `配送超时 ${Math.floor(diffMinutes)} 分钟`,
      amount,
    };
  }

  return { should_compensate: false, type: null, reason: '', amount: 0 };
}

export function autoDetectLost(order: Order): AutoDetectResult {
  if (order.status === 'completed') {
    return { should_compensate: false, type: null, reason: '', amount: 0 };
  }

  const lastAction = order.picked_up_at || order.assigned_at || order.created_at;
  const lastActionTime = new Date(lastAction).getTime();
  const hoursPassed = (Date.now() - lastActionTime) / (1000 * 60 * 60);

  if (hoursPassed > LOST_TIMEOUT_HOURS && (order.status === 'picked_up' || order.status === 'delivering')) {
    const amount = Math.min(200, (order.estimated_price || 20) * 2);
    return {
      should_compensate: true,
      type: 'lost',
      reason: `包裹超过 ${LOST_TIMEOUT_HOURS} 小时未完成配送，疑似丢件`,
      amount,
    };
  }

  return { should_compensate: false, type: null, reason: '', amount: 0 };
}

export function processAutomaticCompensation(order: Order): Compensation | null {
  const timeoutResult = autoDetectTimeout(order);
  if (timeoutResult.should_compensate && timeoutResult.type) {
    return createCompensation({
      order_id: order.id,
      user_id: order.user_id,
      type: timeoutResult.type,
      reason: timeoutResult.reason,
    });
  }

  const lostResult = autoDetectLost(order);
  if (lostResult.should_compensate && lostResult.type) {
    return createCompensation({
      order_id: order.id,
      user_id: order.user_id,
      type: lostResult.type,
      reason: lostResult.reason,
    });
  }

  return null;
}
