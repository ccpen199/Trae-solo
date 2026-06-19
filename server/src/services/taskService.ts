import { getDB } from '../models/database';
import { addCoins } from './coinService';
import { config } from '../config';
import dayjs from 'dayjs';

export function getTaskList(userId: number, region?: string) {
  const db = getDB();
  const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
  const today = dayjs().format('YYYY-MM-DD');

  let tasks: any[] = db.prepare(`
    SELECT * FROM tasks
    WHERE is_active = 1
      AND (start_time IS NULL OR start_time <= ?)
      AND (end_time IS NULL OR end_time >= ?)
    ORDER BY sort_order ASC, id DESC
  `).all(now, now);

  tasks = tasks.filter(task => {
    if (task.target_user_level && (db.prepare('SELECT level FROM users WHERE id = ?').get(userId) as any)?.level < task.target_user_level) {
      return false;
    }
    if (task.target_regions && region) {
      const regions = task.target_regions.split(',');
      return regions.some((r: string) => region.includes(r));
    }
    return true;
  });

  const userTasks: any[] = db.prepare(`
    SELECT ut.*, t.type as task_type
    FROM user_tasks ut
    JOIN tasks t ON ut.task_id = t.id
    WHERE ut.user_id = ? AND ut.task_date = ?
  `).all(userId, today);

  const userTaskMap = new Map(userTasks.map(ut => [ut.task_id, ut]));

  const tasksWithProgress = tasks.map(task => {
    const userTask = userTaskMap.get(task.id);
    return {
      ...task,
      user_progress: userTask || null,
      completed_today: userTask?.status === 'completed',
      claimed: userTask?.claimed_at ? true : false,
    };
  });

  return tasksWithProgress;
}

export function completeTask(userId: number, taskId: number, extra?: any) {
  const db = getDB();
  const today = dayjs().format('YYYY-MM-DD');

  const task = db.prepare('SELECT * FROM tasks WHERE id = ? AND is_active = 1').get(taskId) as any;
  if (!task) throw new Error('任务不存在或已下架');

  const existing = db.prepare(`
    SELECT * FROM user_tasks
    WHERE user_id = ? AND task_id = ? AND task_date = ?
  `).get(userId, taskId, today) as any;

  if (existing && existing.status === 'completed') {
    throw new Error('今日已完成该任务');
  }

  if (task.daily_limit > 0) {
    const todayCount = (db.prepare(`
      SELECT COUNT(*) as count FROM user_tasks
      WHERE user_id = ? AND task_id = ? AND task_date = ? AND status = 'completed'
    `).get(userId, taskId, today) as any).count;

    if (todayCount >= task.daily_limit) {
      throw new Error('今日任务已达上限');
    }
  }

  if (task.total_limit > 0) {
    const totalCount = (db.prepare(`
      SELECT COUNT(*) as count FROM user_tasks
      WHERE task_id = ? AND status = 'completed'
    `).get(taskId) as any).count;

    if (totalCount >= task.total_limit) {
      throw new Error('任务总名额已满');
    }
  }

  let rewardCoins = task.reward_coins;

  if (task.type === 'steps') {
    const steps = extra?.steps || 0;
    rewardCoins = Math.floor(Math.min(steps, config.rewards.dailyStepGoal) / config.rewards.stepCoinRate);
  }

  if (existing) {
    db.prepare(`
      UPDATE user_tasks SET status = 'completed', progress = target,
        reward_coins = ?, completed_at = datetime('now')
      WHERE id = ?
    `).run(rewardCoins, existing.id);
  } else {
    db.prepare(`
      INSERT INTO user_tasks (user_id, task_id, task_date, status, progress, target, reward_coins, reward_cash, completed_at)
      VALUES (?, ?, ?, 'completed', 1, 1, ?, ?, datetime('now'))
    `).run(userId, taskId, today, rewardCoins, task.reward_cash || 0);
  }

  return { taskId, rewardCoins, rewardCash: task.reward_cash || 0 };
}

export function claimTaskReward(userId: number, taskId: number) {
  const db = getDB();
  const today = dayjs().format('YYYY-MM-DD');

  const userTask = db.prepare(`
    SELECT ut.*, t.name as task_name
    FROM user_tasks ut
    JOIN tasks t ON ut.task_id = t.id
    WHERE ut.user_id = ? AND ut.task_id = ? AND ut.task_date = ?
  `).get(userId, taskId, today) as any;

  if (!userTask) throw new Error('任务记录不存在');
  if (userTask.status !== 'completed') throw new Error('任务未完成');
  if (userTask.claimed_at) throw new Error('奖励已领取');

  const rewardCoins = userTask.reward_coins || 0;

  if (rewardCoins > 0) {
    addCoins(userId, rewardCoins, 'task', userTask.id, userTask.task_type, `${userTask.task_name}任务奖励`);
  }

  db.prepare("UPDATE user_tasks SET claimed_at = datetime('now') WHERE id = ?").run(userTask.id);

  return { rewardCoins, rewardCash: userTask.reward_cash || 0 };
}

export function createTask(data: any) {
  const db = getDB();
  const stmt = db.prepare(`
    INSERT INTO tasks (name, description, type, reward_coins, reward_cash, daily_limit,
      total_limit, start_time, end_time, target_regions, target_user_level, is_active, is_hot, sort_order, ext_config)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    data.name,
    data.description || '',
    data.type,
    data.reward_coins || 0,
    data.reward_cash || 0,
    data.daily_limit || 1,
    data.total_limit || 0,
    data.start_time || null,
    data.end_time || null,
    data.target_regions || null,
    data.target_user_level || 0,
    data.is_active ?? 1,
    data.is_hot ?? 0,
    data.sort_order || 0,
    data.ext_config ? JSON.stringify(data.ext_config) : null,
  );

  return db.prepare('SELECT * FROM tasks WHERE id = ?').get(result.lastInsertRowid);
}

export function updateTask(id: number, data: any) {
  const db = getDB();
  const fields = Object.keys(data).filter(k => k !== 'id').map(k => `${k} = ?`).join(', ');
  const values = Object.values(data).filter((_, i) => Object.keys(data)[i] !== 'id');
  values.push(id);

  db.prepare(`UPDATE tasks SET ${fields}, updated_at = datetime('now') WHERE id = ?`).run(...values);
  return db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
}

export function getAdminTaskList(page: number = 1, pageSize: number = 20) {
  const db = getDB();
  const offset = (page - 1) * pageSize;

  const list = db.prepare(`
    SELECT * FROM tasks ORDER BY sort_order ASC, id DESC LIMIT ? OFFSET ?
  `).all(pageSize, offset);

  const total = (db.prepare('SELECT COUNT(*) as count FROM tasks').get() as any).count;

  return { list, total, page, pageSize };
}
