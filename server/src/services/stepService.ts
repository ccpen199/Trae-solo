import { getDB } from '../models/database';
import { addCoins } from './coinService';
import { config } from '../config';
import dayjs from 'dayjs';

export function uploadSteps(userId: number, steps: number, source?: string) {
  const db = getDB();
  const today = dayjs().format('YYYY-MM-DD');

  if (steps < 0) throw new Error('步数不能为负');
  if (steps > 100000) throw new Error('步数异常');

  const existing = db.prepare('SELECT * FROM step_records WHERE user_id = ? AND step_date = ?')
    .get(userId, today) as any;

  let finalSteps = steps;
  if (existing && existing.steps > steps) {
    finalSteps = existing.steps;
  }

  const rewardCoins = Math.floor(Math.min(finalSteps, config.rewards.dailyStepGoal) / config.rewards.stepCoinRate);

  if (existing) {
    db.prepare(`
      UPDATE step_records SET steps = ?, reward_coins = ?, source = ?
      WHERE id = ?
    `).run(finalSteps, rewardCoins, source || existing.source, existing.id);
  } else {
    db.prepare(`
      INSERT INTO step_records (user_id, step_date, steps, reward_coins, source)
      VALUES (?, ?, ?, ?, ?)
    `).run(userId, today, finalSteps, rewardCoins, source || 'healthkit');
  }

  return {
    steps: finalSteps,
    rewardCoins,
    goal: config.rewards.dailyStepGoal,
    is_claimed: existing?.is_claimed || 0,
  };
}

export function getTodaySteps(userId: number) {
  const db = getDB();
  const today = dayjs().format('YYYY-MM-DD');

  const record = db.prepare('SELECT * FROM step_records WHERE user_id = ? AND step_date = ?')
    .get(userId, today) as any;

  return {
    steps: record?.steps || 0,
    rewardCoins: record?.reward_coins || 0,
    goal: config.rewards.dailyStepGoal,
    is_claimed: record?.is_claimed || 0,
  };
}

export function claimStepReward(userId: number) {
  const db = getDB();
  const today = dayjs().format('YYYY-MM-DD');

  const record = db.prepare('SELECT * FROM step_records WHERE user_id = ? AND step_date = ?')
    .get(userId, today) as any;

  if (!record) throw new Error('今日暂无步数记录');
  if (record.is_claimed) throw new Error('今日步数奖励已领取');

  const rewardCoins = record.reward_coins;
  if (rewardCoins <= 0) throw new Error('暂无可领取奖励');

  addCoins(userId, rewardCoins, 'steps', record.id, 'steps', '步数奖励');

  db.prepare('UPDATE step_records SET is_claimed = 1 WHERE id = ?').run(record.id);

  return { rewardCoins };
}

export function getStepRecords(userId: number, page: number = 1, pageSize: number = 30) {
  const db = getDB();
  const offset = (page - 1) * pageSize;

  const list = db.prepare(`
    SELECT * FROM step_records WHERE user_id = ?
    ORDER BY step_date DESC LIMIT ? OFFSET ?
  `).all(userId, pageSize, offset);

  const total = (db.prepare('SELECT COUNT(*) as count FROM step_records WHERE user_id = ?').get(userId) as any).count;

  return { list, total, page, pageSize };
}
