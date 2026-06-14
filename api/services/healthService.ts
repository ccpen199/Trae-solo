import { db } from '../db/index.js';
import { generateId, getTodayString } from '../utils/index.js';

export interface WaterRecord {
  id: string;
  userId: string;
  amount: number;
  date: string;
  createdAt: string;
}

export interface StepsRecord {
  id: string;
  userId: string;
  steps: number;
  date: string;
  createdAt: string;
}

const DAILY_WATER_GOAL = 2000;
const WATER_CUP_SIZE = 250;
const DAILY_STEPS_GOAL = 10000;

export function getTodayWaterRecord(userId: string): {
  totalAmount: number;
  goal: number;
  cupSize: number;
  cups: number;
  records: WaterRecord[];
  completed: boolean;
} {
  const today = getTodayString();
  const rows = db.prepare(`
    SELECT * FROM water_records 
    WHERE user_id = ? AND date = ?
    ORDER BY created_at DESC
  `).all(userId, today) as any[];

  const totalAmount = rows.reduce((sum: number, row: any) => sum + row.amount, 0);

  return {
    totalAmount,
    goal: DAILY_WATER_GOAL,
    cupSize: WATER_CUP_SIZE,
    cups: Math.floor(totalAmount / WATER_CUP_SIZE),
    records: rows.map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      amount: row.amount,
      date: row.date,
      createdAt: row.created_at,
    })),
    completed: totalAmount >= DAILY_WATER_GOAL,
  };
}

export function addWaterRecord(userId: string, amount?: number): {
  success: boolean;
  totalAmount: number;
  completed: boolean;
  message?: string;
} {
  const waterAmount = amount || WATER_CUP_SIZE;
  const today = getTodayString();

  const recordId = generateId('wr-');
  db.prepare(`
    INSERT INTO water_records (id, user_id, amount, date)
    VALUES (?, ?, ?, ?)
  `).run(recordId, userId, waterAmount, today);

  const result = getTodayWaterRecord(userId);

  return {
    success: true,
    totalAmount: result.totalAmount,
    completed: result.completed,
  };
}

export function getTodayStepsRecord(userId: string): {
  steps: number;
  goal: number;
  progress: number;
  completed: boolean;
  record?: StepsRecord;
} {
  const today = getTodayString();
  const row = db.prepare(`
    SELECT * FROM steps_records 
    WHERE user_id = ? AND date = ?
    LIMIT 1
  `).get(userId, today) as any;

  const steps = row ? row.steps : 0;

  return {
    steps,
    goal: DAILY_STEPS_GOAL,
    progress: Math.min((steps / DAILY_STEPS_GOAL) * 100, 100),
    completed: steps >= DAILY_STEPS_GOAL,
    record: row ? {
      id: row.id,
      userId: row.user_id,
      steps: row.steps,
      date: row.date,
      createdAt: row.created_at,
    } : undefined,
  };
}

export function syncSteps(userId: string, steps: number): {
  success: boolean;
  steps: number;
  progress: number;
  completed: boolean;
  message?: string;
} {
  const today = getTodayString();
  const existing = db.prepare(`
    SELECT * FROM steps_records 
    WHERE user_id = ? AND date = ?
  `).get(userId, today) as any;

  if (existing) {
    if (steps > existing.steps) {
      db.prepare(`
        UPDATE steps_records 
        SET steps = ?
        WHERE id = ?
      `).run(steps, existing.id);
    }
  } else {
    const recordId = generateId('sr-');
    db.prepare(`
      INSERT INTO steps_records (id, user_id, steps, date)
      VALUES (?, ?, ?, ?)
    `).run(recordId, userId, steps, today);
  }

  const result = getTodayStepsRecord(userId);

  return {
    success: true,
    steps: result.steps,
    progress: result.progress,
    completed: result.completed,
  };
}
