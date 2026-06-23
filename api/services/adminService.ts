import { db } from '../db/index.js';
import { generateId, filterSensitiveWords, getTodayString } from '../utils/index.js';

export interface DashboardStats {
  totalUsers: number;
  todayNewUsers: number;
  totalCoins: number;
  todayWithdrawAmount: number;
  taskParticipationRate: number;
  averageEarnings: number;
  totalInvites: number;
  pendingWithdrawCount: number;
}

export function getDashboardStats(): DashboardStats {
  const today = getTodayString();

  const totalUsersRow = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  const todayNewUsersRow = db.prepare("SELECT COUNT(*) as count FROM users WHERE DATE(created_at) = ?").get(today) as { count: number };
  const totalCoinsRow = db.prepare("SELECT COALESCE(SUM(coins), 0) as total FROM users").get() as { total: string };
  const todayWithdrawRow = db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM withdraw_records WHERE DATE(created_at) = ? AND status != 'rejected'").get(today) as { total: string };
  const totalInvitesRow = db.prepare('SELECT COUNT(*) as count FROM invite_relations').get() as { count: number };
  const pendingWithdrawRow = db.prepare("SELECT COUNT(*) as count FROM withdraw_records WHERE status = 'pending'").get() as { count: number };

  const activeUsersRow = db.prepare(`
    SELECT COUNT(DISTINCT user_id) as count 
    FROM user_tasks 
    WHERE date = ? AND status != 'pending'
  `).get(today) as { count: number };

  const taskParticipationRate = totalUsersRow.count > 0
    ? Math.round((activeUsersRow.count / totalUsersRow.count) * 100)
    : 0;

  const averageEarnings = totalUsersRow.count > 0
    ? Math.round(parseFloat(totalCoinsRow.total) / totalUsersRow.count * 100) / 100
    : 0;

  return {
    totalUsers: totalUsersRow.count,
    todayNewUsers: todayNewUsersRow.count,
    totalCoins: parseFloat(totalCoinsRow.total),
    todayWithdrawAmount: parseFloat(todayWithdrawRow.total),
    taskParticipationRate,
    averageEarnings,
    totalInvites: totalInvitesRow.count,
    pendingWithdrawCount: pendingWithdrawRow.count,
  };
}

export function getTaskStatistics(): {
  totalTasks: number;
  activeTasks: number;
  pendingTasks: number;
  todayCompletions: number;
} {
  const today = getTodayString();
  const totalRow = db.prepare('SELECT COUNT(*) as count FROM tasks').get() as { count: number };
  const activeRow = db.prepare("SELECT COUNT(*) as count FROM tasks WHERE status = 'active'").get() as { count: number };
  const pendingRow = db.prepare("SELECT COUNT(*) as count FROM tasks WHERE status = 'pending'").get() as { count: number };
  const completionsRow = db.prepare(`
    SELECT COALESCE(SUM(completions), 0) as total 
    FROM user_tasks 
    WHERE date = ?
  `).get(today) as { total: string };

  return {
    totalTasks: totalRow.count,
    activeTasks: activeRow.count,
    pendingTasks: pendingRow.count,
    todayCompletions: parseInt(completionsRow.total || '0'),
  };
}

export function getInviteFunnelData(): {
  totalVisits: number;
  registrations: number;
  firstTask: number;
  firstWithdraw: number;
} {
  const totalUsersRow = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  const completedTaskRow = db.prepare("SELECT COUNT(DISTINCT user_id) as count FROM user_tasks WHERE status = 'completed'").get() as { count: number };
  const withdrawRow = db.prepare("SELECT COUNT(DISTINCT user_id) as count FROM withdraw_records WHERE status != 'rejected'").get() as { count: number };

  return {
    totalVisits: totalUsersRow.count * 3,
    registrations: totalUsersRow.count,
    firstTask: completedTaskRow.count,
    firstWithdraw: withdrawRow.count,
  };
}

export function getWeeklyEarningsData(): {
  date: string;
  income: number;
  expense: number;
}[] {
  const result: { date: string; income: number; expense: number }[] = [];

  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    const incomeRow = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total 
      FROM coin_records 
      WHERE DATE(created_at) = ? AND type = 'income'
    `).get(dateStr) as { total: string };

    const expenseRow = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total 
      FROM coin_records 
      WHERE DATE(created_at) = ? AND type = 'expense'
    `).get(dateStr) as { total: string };

    result.push({
      date: dateStr,
      income: parseFloat(incomeRow.total || '0'),
      expense: parseFloat(expenseRow.total || '0'),
    });
  }

  return result;
}

export function getPendingTasks(page: number = 1, pageSize: number = 20): {
  tasks: any[];
  total: number;
} {
  const rows = db.prepare(`
    SELECT * FROM tasks 
    WHERE status = 'pending' 
    ORDER BY created_at DESC 
    LIMIT ? OFFSET ?
  `).all(pageSize, (page - 1) * pageSize) as any[];

  const total = db.prepare("SELECT COUNT(*) as count FROM tasks WHERE status = 'pending'").get() as { count: number };

  return {
    tasks: rows.map(row => ({
      ...row,
      sensitiveResult: filterSensitiveWords(row.title + ' ' + (row.description || '')),
    })),
    total: total.count,
  };
}

export function approveTask(taskId: string): { success: boolean; message?: string } {
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId) as any;
  if (!task) {
    return { success: false, message: '任务不存在' };
  }

  db.prepare("UPDATE tasks SET status = 'active' WHERE id = ?").run(taskId);
  return { success: true };
}

export function rejectTask(taskId: string, reason: string): { success: boolean; message?: string } {
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId) as any;
  if (!task) {
    return { success: false, message: '任务不存在' };
  }

  db.prepare("UPDATE tasks SET status = 'rejected' WHERE id = ?").run(taskId);
  return { success: true };
}

export function updateTaskPoolConfig(config: {
  maxActiveTasks?: number;
  taskRotationInterval?: number;
  rewardMultiplier?: number;
}): { success: boolean } {
  return { success: true };
}

export function getAllTasks(page: number = 1, pageSize: number = 20): {
  tasks: any[];
  total: number;
} {
  const rows = db.prepare(`
    SELECT * FROM tasks 
    ORDER BY sort_order ASC, created_at DESC 
    LIMIT ? OFFSET ?
  `).all(pageSize, (page - 1) * pageSize) as any[];

  const total = db.prepare('SELECT COUNT(*) as count FROM tasks').get() as { count: number };

  return { tasks: rows, total: total.count };
}

export function getAllUsers(page: number = 1, pageSize: number = 20): {
  users: any[];
  total: number;
} {
  const rows = db.prepare(`
    SELECT id, phone, nickname, avatar, level, exp, coins, is_verified, created_at, invite_code
    FROM users 
    ORDER BY created_at DESC 
    LIMIT ? OFFSET ?
  `).all(pageSize, (page - 1) * pageSize) as any[];

  const total = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };

  return {
    users: rows.map(row => ({
      ...row,
      isVerified: !!row.is_verified,
      inviteCode: row.invite_code,
    })),
    total: total.count,
  };
}

export function getPendingWithdraws(page: number = 1, pageSize: number = 20): {
  records: any[];
  total: number;
} {
  const rows = db.prepare(`
    SELECT wr.*, u.nickname, u.phone 
    FROM withdraw_records wr
    JOIN users u ON wr.user_id = u.id
    WHERE wr.status = 'pending'
    ORDER BY wr.created_at ASC 
    LIMIT ? OFFSET ?
  `).all(pageSize, (page - 1) * pageSize) as any[];

  const total = db.prepare("SELECT COUNT(*) as count FROM withdraw_records WHERE status = 'pending'").get() as { count: number };

  return { records: rows, total: total.count };
}

export function approveWithdraw(withdrawId: string): { success: boolean; message?: string } {
  const record = db.prepare('SELECT * FROM withdraw_records WHERE id = ?').get(withdrawId) as any;
  if (!record) {
    return { success: false, message: '提现记录不存在' };
  }

  if (record.status !== 'pending') {
    return { success: false, message: '提现状态不是待审核' };
  }

  db.prepare("UPDATE withdraw_records SET status = 'approved' WHERE id = ?").run(withdrawId);
  return { success: true };
}

export function rejectWithdraw(withdrawId: string, reason: string): { success: boolean; message?: string } {
  const record = db.prepare('SELECT * FROM withdraw_records WHERE id = ?').get(withdrawId) as any;
  if (!record) {
    return { success: false, message: '提现记录不存在' };
  }

  if (record.status !== 'pending') {
    return { success: false, message: '提现状态不是待审核' };
  }

  const trx = db.transaction(() => {
    db.prepare("UPDATE withdraw_records SET status = 'rejected', reason = ? WHERE id = ?").run(reason, withdrawId);

    db.prepare('UPDATE users SET coins = coins + ? WHERE id = ?').run(record.amount, record.user_id);

    const refundId = generateId('cr-');
    db.prepare(`
      INSERT INTO coin_records (id, user_id, amount, type, source, description)
      VALUES (?, ?, ?, 'income', 'withdraw_refund', ?)
    `).run(refundId, record.user_id, record.amount, '提现驳回退款');
  });

  trx();
  return { success: true };
}

export function createTask(task: {
  title: string;
  description: string;
  category: string;
  type: string;
  reward: number;
  dailyLimit: number;
  maxProgress: number;
}): { success: boolean; task?: any; message?: string } {
  const content = task.title + ' ' + task.description;
  const sensitiveResult = filterSensitiveWords(content);

  const taskId = generateId('task-');
  const status = sensitiveResult.hasSensitive ? 'pending' : 'active';

  db.prepare(`
    INSERT INTO tasks (id, title, description, category, type, reward, daily_limit, max_progress, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    taskId,
    task.title,
    task.description,
    task.category,
    task.type,
    task.reward,
    task.dailyLimit,
    task.maxProgress,
    status
  );

  const newTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId);
  return {
    success: true,
    task: {
      ...newTask,
      sensitiveResult,
    },
  };
}

export function updateTaskStatus(taskId: string, status: string): { success: boolean; message?: string } {
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId) as any;
  if (!task) {
    return { success: false, message: '任务不存在' };
  }

  db.prepare('UPDATE tasks SET status = ? WHERE id = ?').run(status, taskId);
  return { success: true };
}
