import db from '../db/database.js';
import { Task, TaskCreateRequest, TaskListQuery, Bid, BidCreateRequest, UserRole, UserStatus, ApiResponse, TaskStatus } from '../../shared/types.js';

function parseUser(row: Record<string, unknown>) {
  if (!row) return undefined;
  return {
    id: row.id as number,
    email: row.email as string,
    phone: (row.phone as string) || '',
    name: row.name as string,
    avatar: (row.avatar as string) || null,
    role: row.role as UserRole,
    status: row.status as UserStatus,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function parseBid(row: Record<string, unknown>): Bid {
  return {
    id: row.id as number,
    taskId: row.task_id as number,
    providerId: row.provider_id as number,
    proposal: row.proposal as string,
    budget: row.budget as number,
    durationDays: row.duration_days as number,
    status: row.status as Bid['status'],
    createdAt: row.created_at as string,
  };
}

export function parseTask(row: Record<string, unknown>): Task {
  return {
    id: row.id as number,
    employerId: row.employer_id as number,
    providerId: row.provider_id as number | null,
    title: row.title as string,
    description: row.description as string,
    type: row.type as Task['type'],
    budgetMin: row.budget_min as number,
    budgetMax: row.budget_max as number,
    finalBudget: row.final_budget as number | null,
    durationDays: row.duration_days as number,
    status: row.status as TaskStatus,
    tags: row.tags ? JSON.parse(row.tags as string) : [],
    deliveryStandards: (row.delivery_standards as string) || '',
    reviewNodes: row.review_nodes ? JSON.parse(row.review_nodes as string) : [],
    milestones: row.milestones ? JSON.parse(row.milestones as string) : [],
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export class TaskService {
  async getTaskList(query: TaskListQuery, userId: number, role: UserRole): Promise<ApiResponse<Task[]>> {
    const page = query.page || 1;
    const pageSize = query.pageSize || 10;
    const offset = (page - 1) * pageSize;

    const conditions: string[] = [];
    const params: unknown[] = [];

    if (query.status) {
      conditions.push('t.status = ?');
      params.push(query.status);
    }

    if (query.type) {
      conditions.push('t.type = ?');
      params.push(query.type);
    }

    if (role === 'employer') {
      conditions.push('t.employer_id = ?');
      params.push(userId);
    } else if (role === 'provider') {
      conditions.push('(t.provider_id = ? OR EXISTS (SELECT 1 FROM bids b WHERE b.task_id = t.id AND b.provider_id = ?))');
      params.push(userId, userId);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRow = db.prepare(`
      SELECT COUNT(*) as total FROM tasks t ${whereClause}
    `).get(...params) as { total: number };

    const rows = db.prepare(`
      SELECT t.* FROM tasks t ${whereClause}
      ORDER BY t.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, pageSize, offset) as Record<string, unknown>[];

    const tasks = rows.map(row => parseTask(row));

    return {
      success: true,
      data: tasks,
      total: countRow.total,
      page,
      pageSize,
    };
  }

  async getTaskById(id: number, userId: number, role: UserRole): Promise<ApiResponse<Task>> {
    const row = db.prepare(`
      SELECT t.* FROM tasks t WHERE t.id = ?
    `).get(id) as Record<string, unknown> | undefined;

    if (!row) {
      return {
        success: false,
        message: '任务不存在',
      };
    }

    const task = parseTask(row);

    if (role !== 'admin' && task.employerId !== userId && task.providerId !== userId) {
      const hasBid = db.prepare(`
        SELECT 1 FROM bids WHERE task_id = ? AND provider_id = ?
      `).get(id, userId);
      if (!hasBid) {
        return {
          success: false,
          message: '无权访问此任务',
        };
      }
    }

    const employerRow = db.prepare(`
      SELECT * FROM users WHERE id = ?
    `).get(task.employerId) as Record<string, unknown> | undefined;
    task.employer = parseUser(employerRow);

    if (task.providerId) {
      const providerRow = db.prepare(`
        SELECT * FROM users WHERE id = ?
      `).get(task.providerId) as Record<string, unknown> | undefined;
      task.provider = parseUser(providerRow);
    }

    const bidRows = db.prepare(`
      SELECT b.* FROM bids b WHERE b.task_id = ?
      ORDER BY b.created_at DESC
    `).all(id) as Record<string, unknown>[];
    task.bids = bidRows.map(row => {
      const bid = parseBid(row);
      const providerRow = db.prepare(`
        SELECT * FROM users WHERE id = ?
      `).get(bid.providerId) as Record<string, unknown> | undefined;
      bid.provider = parseUser(providerRow);
      return bid;
    });

    return {
      success: true,
      data: task,
    };
  }

  async createTask(data: TaskCreateRequest, employerId: number): Promise<ApiResponse<Task>> {
    const result = db.prepare(`
      INSERT INTO tasks (employer_id, title, description, type, budget_min, budget_max, duration_days, status, tags, delivery_standards, review_nodes, milestones)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'draft', ?, ?, ?, ?)
    `).run(
      employerId,
      data.title,
      data.description,
      data.type,
      data.budgetMin,
      data.budgetMax,
      data.durationDays,
      JSON.stringify(data.tags),
      data.deliveryStandards,
      JSON.stringify(data.reviewNodes),
      JSON.stringify(data.milestones)
    );

    const row = db.prepare(`
      SELECT * FROM tasks WHERE id = ?
    `).get(result.lastInsertRowid) as Record<string, unknown>;

    return {
      success: true,
      message: '任务创建成功',
      data: parseTask(row),
    };
  }

  async updateTask(id: number, data: Partial<TaskCreateRequest>, userId: number): Promise<ApiResponse<Task>> {
    const row = db.prepare(`
      SELECT * FROM tasks WHERE id = ?
    `).get(id) as Record<string, unknown> | undefined;

    if (!row) {
      return {
        success: false,
        message: '任务不存在',
      };
    }

    const task = parseTask(row);

    if (task.employerId !== userId) {
      return {
        success: false,
        message: '无权修改此任务',
      };
    }

    if (task.status !== 'draft') {
      return {
        success: false,
        message: '只能修改草稿状态的任务',
      };
    }

    const fields: string[] = [];
    const params: unknown[] = [];

    if (data.title !== undefined) {
      fields.push('title = ?');
      params.push(data.title);
    }
    if (data.description !== undefined) {
      fields.push('description = ?');
      params.push(data.description);
    }
    if (data.type !== undefined) {
      fields.push('type = ?');
      params.push(data.type);
    }
    if (data.budgetMin !== undefined) {
      fields.push('budget_min = ?');
      params.push(data.budgetMin);
    }
    if (data.budgetMax !== undefined) {
      fields.push('budget_max = ?');
      params.push(data.budgetMax);
    }
    if (data.durationDays !== undefined) {
      fields.push('duration_days = ?');
      params.push(data.durationDays);
    }
    if (data.tags !== undefined) {
      fields.push('tags = ?');
      params.push(JSON.stringify(data.tags));
    }
    if (data.deliveryStandards !== undefined) {
      fields.push('delivery_standards = ?');
      params.push(data.deliveryStandards);
    }
    if (data.reviewNodes !== undefined) {
      fields.push('review_nodes = ?');
      params.push(JSON.stringify(data.reviewNodes));
    }
    if (data.milestones !== undefined) {
      fields.push('milestones = ?');
      params.push(JSON.stringify(data.milestones));
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    db.prepare(`
      UPDATE tasks SET ${fields.join(', ')} WHERE id = ?
    `).run(...params);

    const updatedRow = db.prepare(`
      SELECT * FROM tasks WHERE id = ?
    `).get(id) as Record<string, unknown>;

    return {
      success: true,
      message: '任务更新成功',
      data: parseTask(updatedRow),
    };
  }

  async deleteTask(id: number, userId: number): Promise<ApiResponse<void>> {
    const row = db.prepare(`
      SELECT * FROM tasks WHERE id = ?
    `).get(id) as Record<string, unknown> | undefined;

    if (!row) {
      return {
        success: false,
        message: '任务不存在',
      };
    }

    const task = parseTask(row);

    if (task.employerId !== userId) {
      return {
        success: false,
        message: '无权删除此任务',
      };
    }

    if (task.status !== 'draft') {
      return {
        success: false,
        message: '只能删除草稿状态的任务',
      };
    }

    db.prepare(`DELETE FROM tasks WHERE id = ?`).run(id);

    return {
      success: true,
      message: '任务删除成功',
    };
  }

  async publishTask(id: number, userId: number): Promise<ApiResponse<Task>> {
    const row = db.prepare(`
      SELECT * FROM tasks WHERE id = ?
    `).get(id) as Record<string, unknown> | undefined;

    if (!row) {
      return {
        success: false,
        message: '任务不存在',
      };
    }

    const task = parseTask(row);

    if (task.employerId !== userId) {
      return {
        success: false,
        message: '无权发布此任务',
      };
    }

    if (task.status !== 'draft') {
      return {
        success: false,
        message: '只能发布草稿状态的任务',
      };
    }

    db.prepare(`
      UPDATE tasks SET status = 'published', updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(id);

    const updatedRow = db.prepare(`
      SELECT * FROM tasks WHERE id = ?
    `).get(id) as Record<string, unknown>;

    return {
      success: true,
      message: '任务发布成功',
      data: parseTask(updatedRow),
    };
  }

  async selectProvider(taskId: number, providerId: number, bidId: number, employerId: number): Promise<ApiResponse<Task>> {
    const taskRow = db.prepare(`
      SELECT * FROM tasks WHERE id = ?
    `).get(taskId) as Record<string, unknown> | undefined;

    if (!taskRow) {
      return {
        success: false,
        message: '任务不存在',
      };
    }

    const task = parseTask(taskRow);

    if (task.employerId !== employerId) {
      return {
        success: false,
        message: '无权操作此任务',
      };
    }

    if (task.status !== 'bidding' && task.status !== 'published') {
      return {
        success: false,
        message: '当前任务状态无法选择服务商',
      };
    }

    const bidRow = db.prepare(`
      SELECT * FROM bids WHERE id = ? AND task_id = ? AND provider_id = ?
    `).get(bidId, taskId, providerId) as Record<string, unknown> | undefined;

    if (!bidRow) {
      return {
        success: false,
        message: '投标不存在',
      };
    }

    const bid = parseBid(bidRow);

    db.prepare(`
      UPDATE bids SET status = 'rejected' WHERE task_id = ? AND id != ?
    `).run(taskId, bidId);

    db.prepare(`
      UPDATE bids SET status = 'accepted' WHERE id = ?
    `).run(bidId);

    db.prepare(`
      UPDATE tasks SET provider_id = ?, final_budget = ?, status = 'selected', updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(providerId, bid.budget, taskId);

    const updatedRow = db.prepare(`
      SELECT * FROM tasks WHERE id = ?
    `).get(taskId) as Record<string, unknown>;

    return {
      success: true,
      message: '服务商选择成功',
      data: parseTask(updatedRow),
    };
  }

  async createBid(taskId: number, data: BidCreateRequest, providerId: number): Promise<ApiResponse<Bid>> {
    const taskRow = db.prepare(`
      SELECT * FROM tasks WHERE id = ?
    `).get(taskId) as Record<string, unknown> | undefined;

    if (!taskRow) {
      return {
        success: false,
        message: '任务不存在',
      };
    }

    const task = parseTask(taskRow);

    if (task.status !== 'published' && task.status !== 'bidding') {
      return {
        success: false,
        message: '当前任务状态无法投标',
      };
    }

    if (task.employerId === providerId) {
      return {
        success: false,
        message: '不能对自己发布的任务投标',
      };
    }

    const existingBid = db.prepare(`
      SELECT 1 FROM bids WHERE task_id = ? AND provider_id = ?
    `).get(taskId, providerId);

    if (existingBid) {
      return {
        success: false,
        message: '已经对该任务投过标',
      };
    }

    const result = db.prepare(`
      INSERT INTO bids (task_id, provider_id, proposal, budget, duration_days, status)
      VALUES (?, ?, ?, ?, ?, 'pending')
    `).run(taskId, providerId, data.proposal, data.budget, data.durationDays);

    db.prepare(`
      UPDATE tasks SET status = 'bidding', updated_at = CURRENT_TIMESTAMP WHERE id = ? AND status = 'published'
    `).run(taskId);

    const row = db.prepare(`
      SELECT * FROM bids WHERE id = ?
    `).get(result.lastInsertRowid) as Record<string, unknown>;

    return {
      success: true,
      message: '投标成功',
      data: parseBid(row),
    };
  }
}

export default new TaskService();
