import { getDB } from '../models/database';
import { addCoins } from './coinService';
import { config } from '../config';
import dayjs from 'dayjs';

export function checkin(userId: number) {
  const db = getDB();
  const today = dayjs().format('YYYY-MM-DD');

  const existing = db.prepare('SELECT * FROM checkins WHERE user_id = ? AND checkin_date = ?')
    .get(userId, today);

  if (existing) {
    throw new Error('今日已签到');
  }

  const lastCheckin = db.prepare(`
    SELECT * FROM checkins WHERE user_id = ? ORDER BY checkin_date DESC LIMIT 1
  `).get(userId) as any;

  let continuousDays = 1;
  if (lastCheckin) {
    const lastDate = dayjs(lastCheckin.checkin_date);
    const diffDays = dayjs(today).diff(lastDate, 'day');
    if (diffDays === 1) {
      continuousDays = lastCheckin.continuous_days + 1;
    }
  }

  const baseReward = config.rewards.checkinRewardCoins;
  const bonusMultiplier = Math.min(continuousDays, 7);
  const rewardCoins = Math.floor(baseReward * (1 + (bonusMultiplier - 1) * 0.1));

  db.prepare(`
    INSERT INTO checkins (user_id, checkin_date, continuous_days, reward_coins)
    VALUES (?, ?, ?, ?)
  `).run(userId, today, continuousDays, rewardCoins);

  addCoins(userId, rewardCoins, 'checkin', undefined, 'checkin', `${continuousDays}天连续签到奖励`);

  return {
    checkinDate: today,
    continuousDays,
    rewardCoins,
  };
}

export function getCheckinStatus(userId: number) {
  const db = getDB();
  const today = dayjs().format('YYYY-MM-DD');

  const todayCheckin = db.prepare('SELECT * FROM checkins WHERE user_id = ? AND checkin_date = ?')
    .get(userId, today);

  const lastCheckin = db.prepare(`
    SELECT * FROM checkins WHERE user_id = ? ORDER BY checkin_date DESC LIMIT 1
  `).get(userId) as any;

  const weekRecords = db.prepare(`
    SELECT * FROM checkins WHERE user_id = ? AND checkin_date >= date('now', '-6 days')
    ORDER BY checkin_date ASC
  `).all(userId);

  return {
    hasCheckedIn: !!todayCheckin,
    continuousDays: lastCheckin?.continuous_days || 0,
    todayReward: todayCheckin ? (todayCheckin as any).reward_coins : 0,
    weekRecords,
  };
}
