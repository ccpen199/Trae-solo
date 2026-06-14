import { db } from '../db/index.js';
import { generateId, getTodayString } from '../utils/index.js';
import { addCoins } from './authService.js';

export interface Task {
  id: string;
  title: string;
  description: string;
  category: string;
  type: string;
  reward: number;
  dailyLimit: number;
  maxProgress: number;
  status: string;
  sortOrder: number;
  progress?: number;
  completions?: number;
  userStatus?: string;
  completedAt?: string;
}

function rowToTask(row: any): Task {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category,
    type: row.type,
    reward: parseFloat(row.reward),
    dailyLimit: row.daily_limit,
    maxProgress: row.max_progress,
    status: row.status,
    sortOrder: row.sort_order,
  };
}

export function getAllTasks(): Task[] {
  const rows = db.prepare('SELECT * FROM tasks WHERE status = ? ORDER BY sort_order ASC').all('active') as any[];
  return rows.map(rowToTask);
}

export function getTasksByCategory(category: string): Task[] {
  const rows = db.prepare('SELECT * FROM tasks WHERE status = ? AND category = ? ORDER BY sort_order ASC').all('active', category) as any[];
  return rows.map(rowToTask);
}

export function getTaskById(taskId: string): Task | null {
  const row = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId) as any;
  return row ? rowToTask(row) : null;
}

export function getUserTasks(userId: string): Task[] {
  const today = getTodayString();
  const tasks = getAllTasks();

  return tasks.map(task => {
    const userTask = db.prepare(`
      SELECT * FROM user_tasks 
      WHERE user_id = ? AND task_id = ? AND date = ?
    `).get(userId, task.id, today) as any;

    if (userTask) {
      return {
        ...task,
        progress: userTask.progress,
        completions: userTask.completions,
        userStatus: userTask.status,
        completedAt: userTask.completed_at,
      };
    }

    return {
      ...task,
      progress: 0,
      completions: 0,
      userStatus: 'pending',
    };
  });
}

export function getUserTask(userId: string, taskId: string): Task | null {
  const task = getTaskById(taskId);
  if (!task) return null;

  const today = getTodayString();
  const userTask = db.prepare(`
    SELECT * FROM user_tasks 
    WHERE user_id = ? AND task_id = ? AND date = ?
  `).get(userId, taskId, today) as any;

  if (userTask) {
    return {
      ...task,
      progress: userTask.progress,
      completions: userTask.completions,
      userStatus: userTask.status,
      completedAt: userTask.completed_at,
    };
  }

  return {
    ...task,
    progress: 0,
    completions: 0,
    userStatus: 'pending',
  };
}

export function completeTask(userId: string, taskId: string, progressIncrement: number = 1): {
  success: boolean;
  task?: Task;
  reward?: number;
  message?: string;
  leveledUp?: boolean;
} {
  const task = getTaskById(taskId);
  if (!task) {
    return { success: false, message: '任务不存在' };
  }

  if (task.status !== 'active') {
    return { success: false, message: '任务未激活' };
  }

  const today = getTodayString();
  const trx = db.transaction(() => {
    let userTask = db.prepare(`
      SELECT * FROM user_tasks 
      WHERE user_id = ? AND task_id = ? AND date = ?
    `).get(userId, taskId, today) as any;

    if (!userTask) {
      const utId = generateId('ut-');
      db.prepare(`
        INSERT INTO user_tasks (id, user_id, task_id, progress, max_progress, completions, status, date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(utId, userId, taskId, 0, task.maxProgress, 0, 'pending', today);

      userTask = db.prepare(`
        SELECT * FROM user_tasks WHERE id = ?
      `).get(utId) as any;
    }

    if (userTask.completions >= task.dailyLimit) {
      return { success: false, message: '今日已达完成次数上限' };
    }

    const newProgress = userTask.progress + progressIncrement;
    let newCompletions = userTask.completions;
    let status = userTask.status;
    let reward = 0;

    if (newProgress >= task.maxProgress) {
      newCompletions += 1;
      reward = task.reward;
      status = newCompletions >= task.dailyLimit ? 'completed' : 'in_progress';

      addCoins(userId, task.reward, 'task', `完成任务：${task.title}`);

      distributeInviteRewards(userId, task.reward);

      db.prepare(`
        UPDATE user_tasks 
        SET progress = 0, completions = ?, status = ?, completed_at = ?
        WHERE id = ?
      `).run(newCompletions, status, new Date().toISOString(), userTask.id);
    } else {
      db.prepare(`
        UPDATE user_tasks 
        SET progress = ?, status = 'in_progress'
        WHERE id = ?
      `).run(newProgress, userTask.id);
    }

    const updatedTask = getUserTask(userId, taskId);
    return { success: true, task: updatedTask!, reward };
  });

  return trx();
}

function distributeInviteRewards(userId: string, reward: number): void {
  const relations = db.prepare(`
    SELECT * FROM invite_relations WHERE user_id = ?
  `).all(userId) as any[];

  for (const relation of relations) {
    const commissionRate = relation.level === 1 ? 0.1 : 0.05;
    const commission = Math.floor(reward * commissionRate * 100) / 100;

    if (commission > 0) {
      addCoins(
        relation.inviter_id,
        commission,
        'invite_commission',
        `邀请${relation.level === 1 ? '一级' : '二级'}好友任务分佣`
      );

      db.prepare(`
        UPDATE invite_relations
        SET total_reward = total_reward + ?
        WHERE user_id = ? AND inviter_id = ?
      `).run(commission, userId, relation.inviter_id);
    }
  }
}

export function getRecommendedTasks(): Task[] {
  const tasks = getAllTasks();
  return tasks.slice(0, 4);
}
