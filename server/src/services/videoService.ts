import { getDB } from '../models/database';
import { addCoins } from './coinService';
import { config } from '../config';
import dayjs from 'dayjs';

export function reportVideoWatch(userId: number, videoId: string, duration: number, watchDuration: number) {
  const db = getDB();
  const today = dayjs().format('YYYY-MM-DD');

  const todayCount = (db.prepare(`
    SELECT COUNT(*) as count FROM video_records
    WHERE user_id = ? AND date(created_at) = ? AND is_completed = 1
  `).get(userId, today) as any).count;

  const isCompleted = watchDuration >= duration * 0.9 && duration >= 5;
  const rewardCoins = isCompleted ? config.rewards.videoRewardCoins : 0;

  if (isCompleted && todayCount >= 10) {
    return { isCompleted: false, rewardCoins: 0, message: '今日观看奖励已达上限' };
  }

  db.prepare(`
    INSERT INTO video_records (user_id, video_id, duration, watch_duration, is_completed, reward_coins)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(userId, videoId, duration, watchDuration, isCompleted ? 1 : 0, rewardCoins);

  if (rewardCoins > 0) {
    addCoins(userId, rewardCoins, 'video', undefined, 'video', '观看视频奖励');
  }

  return { isCompleted, rewardCoins, todayCount: todayCount + (isCompleted ? 1 : 0) };
}

export function getTodayVideoStats(userId: number) {
  const db = getDB();
  const today = dayjs().format('YYYY-MM-DD');

  const stats = db.prepare(`
    SELECT
      COUNT(*) as total_count,
      SUM(CASE WHEN is_completed = 1 THEN 1 ELSE 0 END) as completed_count,
      SUM(reward_coins) as total_reward
    FROM video_records
    WHERE user_id = ? AND date(created_at) = ?
  `).get(userId, today) as any;

  return {
    totalCount: stats.total_count || 0,
    completedCount: stats.completed_count || 0,
    totalReward: stats.total_reward || 0,
    dailyLimit: 10,
  };
}
