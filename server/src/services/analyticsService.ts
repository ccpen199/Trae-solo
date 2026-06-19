import { getDB } from '../models/database';
import dayjs from 'dayjs';

export function getDashboardStats() {
  const db = getDB();

  const totalUsers = (db.prepare('SELECT COUNT(*) as count FROM users').get() as any).count;
  const todayNewUsers = (db.prepare(`
    SELECT COUNT(*) as count FROM users WHERE date(created_at) = date('now')
  `).get() as any).count;

  const todayActiveUsers = (db.prepare(`
    SELECT COUNT(DISTINCT user_id) as count FROM coin_records WHERE date(created_at) = date('now')
  `).get() as any).count;

  const totalCoinsEarned = (db.prepare(`
    SELECT COALESCE(SUM(CASE WHEN change > 0 THEN change ELSE 0 END), 0) as total
    FROM coin_records
  `).get() as any).total;

  const totalWithdrawalAmount = (db.prepare(`
    SELECT COALESCE(SUM(amount), 0) as total FROM withdrawals WHERE status = 'success'
  `).get() as any).total;

  const todayWithdrawalAmount = (db.prepare(`
    SELECT COALESCE(SUM(amount), 0) as total FROM withdrawals
    WHERE status = 'success' AND date(created_at) = date('now')
  `).get() as any).total;

  const totalInvitations = (db.prepare('SELECT COUNT(*) as count FROM invitations WHERE level = 1').get() as any).count;

  return {
    totalUsers,
    todayNewUsers,
    todayActiveUsers,
    totalCoinsEarned,
    totalWithdrawalAmount,
    todayWithdrawalAmount,
    totalInvitations,
    conversionRate: totalUsers > 0 ? ((totalInvitations / totalUsers) * 100).toFixed(2) + '%' : '0%',
  };
}

export function getTaskROI(taskId: number) {
  const db = getDB();
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId) as any;
  if (!task) return null;

  const completionCount = (db.prepare(`
    SELECT COUNT(*) as count FROM user_tasks WHERE task_id = ? AND status = 'completed'
  `).get(taskId) as any).count;

  const uniqueUsers = (db.prepare(`
    SELECT COUNT(DISTINCT user_id) as count FROM user_tasks WHERE task_id = ? AND status = 'completed'
  `).get(taskId) as any).count;

  const totalCoins = (db.prepare(`
    SELECT COALESCE(SUM(reward_coins), 0) as total FROM user_tasks WHERE task_id = ? AND status = 'completed'
  `).get(taskId) as any).total;

  const cost = totalCoins / 10000;

  return {
    taskId,
    taskName: task.name,
    completionCount,
    uniqueUsers,
    totalCoins,
    cost,
    cpa: uniqueUsers > 0 ? (cost / uniqueUsers).toFixed(4) : 0,
  };
}

export function getTaskROIList(page: number = 1, pageSize: number = 20) {
  const db = getDB();
  const tasks = db.prepare('SELECT * FROM tasks ORDER BY id DESC LIMIT ? OFFSET ?')
    .all(pageSize, (page - 1) * pageSize);

  const roiList = tasks.map((task: any) => {
    const completionCount = (db.prepare(`
      SELECT COUNT(*) as count FROM user_tasks WHERE task_id = ? AND status = 'completed'
    `).get(task.id) as any).count;

    const uniqueUsers = (db.prepare(`
      SELECT COUNT(DISTINCT user_id) as count FROM user_tasks WHERE task_id = ? AND status = 'completed'
    `).get(task.id) as any).count;

    const totalCoins = (db.prepare(`
      SELECT COALESCE(SUM(reward_coins), 0) as total FROM user_tasks WHERE task_id = ? AND status = 'completed'
    `).get(task.id) as any).total;

    return {
      taskId: task.id,
      taskName: task.name,
      taskType: task.type,
      completionCount,
      uniqueUsers,
      totalCoins,
      cost: (totalCoins / 10000).toFixed(2),
      cpa: uniqueUsers > 0 ? ((totalCoins / 10000) / uniqueUsers).toFixed(4) : 0,
    };
  });

  const total = (db.prepare('SELECT COUNT(*) as count FROM tasks').get() as any).count;

  return { list: roiList, total, page, pageSize };
}

export function getUserLtvPrediction(userId: number): number {
  const db = getDB();
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any;
  if (!user) return 0;

  const registrationDays = Math.max(1, dayjs().diff(dayjs(user.created_at), 'day'));
  const totalEarned = user.total_earned_coins || 0;
  const dailyAverage = totalEarned / registrationDays;

  const retentionFactor = user.last_login_at
    ? Math.max(0, 1 - dayjs().diff(dayjs(user.last_login_at), 'day') / 30)
    : 0.5;

  const levelBonus = (user.level || 1) * 0.1;

  const predictedDays = 30;
  const predictedCoins = dailyAverage * predictedDays * (0.5 + retentionFactor * 0.5) * (1 + levelBonus);

  return predictedCoins / 10000;
}

export function getRetentionStats() {
  const db = getDB();

  const stats: any = {};
  const days = [1, 3, 7, 14, 30];

  for (const day of days) {
    const date = dayjs().subtract(day, 'day').format('YYYY-MM-DD');

    const newUsers = (db.prepare(`
      SELECT COUNT(*) as count FROM users WHERE date(created_at) = ?
    `).get(date) as any).count;

    const retainedUsers = (db.prepare(`
      SELECT COUNT(DISTINCT u.id) as count
      FROM users u
      JOIN coin_records cr ON u.id = cr.user_id
      WHERE date(u.created_at) = ? AND date(cr.created_at) = date('now')
    `).get(date) as any).count;

    stats[`day${day}`] = {
      newUsers,
      retainedUsers,
      rate: newUsers > 0 ? ((retainedUsers / newUsers) * 100).toFixed(2) + '%' : '0%',
    };
  }

  return stats;
}

export function getDailyStats(days: number = 7) {
  const db = getDB();
  const stats: any[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const date = dayjs().subtract(i, 'day').format('YYYY-MM-DD');

    const newUsers = (db.prepare(`
      SELECT COUNT(*) as count FROM users WHERE date(created_at) = ?
    `).get(date) as any).count;

    const activeUsers = (db.prepare(`
      SELECT COUNT(DISTINCT user_id) as count FROM coin_records WHERE date(created_at) = ?
    `).get(date) as any).count;

    const coinsEarned = (db.prepare(`
      SELECT COALESCE(SUM(CASE WHEN change > 0 THEN change ELSE 0 END), 0) as total
      FROM coin_records WHERE date(created_at) = ?
    `).get(date) as any).total;

    const withdrawalAmount = (db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total FROM withdrawals
      WHERE status = 'success' AND date(created_at) = ?
    `).get(date) as any).total;

    stats.push({ date, newUsers, activeUsers, coinsEarned, withdrawalAmount });
  }

  return stats;
}

export function getUserList(page: number = 1, pageSize: number = 20, keyword?: string) {
  const db = getDB();
  const offset = (page - 1) * pageSize;

  let query = 'SELECT * FROM users';
  let countQuery = 'SELECT COUNT(*) as count FROM users';
  const params: any[] = [];

  if (keyword) {
    query += ' WHERE nickname LIKE ? OR phone LIKE ?';
    countQuery += ' WHERE nickname LIKE ? OR phone LIKE ?';
    params.push(`%${keyword}%`, `%${keyword}%`);
  }

  query += ' ORDER BY id DESC LIMIT ? OFFSET ?';

  const list = db.prepare(query).all(...params, pageSize, offset);
  const total = (db.prepare(countQuery).get(...params) as any).count;

  return { list, total, page, pageSize };
}
