import { Router, Request, Response } from 'express';
import Joi from 'joi';
import db from '../database';
import { success, error, getPagination, getPagedResult, generateRequestNo, logAudit, stringifyJsonField, normalizeTask } from '../utils/common';
import { auth, requireEmployer, requireAdmin } from '../middleware/auth';

const router = Router();

const createTaskSchema = Joi.object({
  title: Joi.string().min(2).max(200).required(),
  description: Joi.string().min(5).required(),
  categoryId: Joi.number().integer().positive().optional(),
  category: Joi.string().optional(),
  budgetMin: Joi.number().min(0).default(0),
  budgetMax: Joi.number().min(0).default(0),
  deadline: Joi.string().optional(),
  skills: Joi.array().items(Joi.string()).optional(),
  skillsRequired: Joi.array().items(Joi.string()).optional(),
  deliveryDays: Joi.number().integer().min(1).optional(),
  attachments: Joi.array().items(Joi.string()).optional()
});

const updateTaskSchema = Joi.object({
  title: Joi.string().min(2).max(200).optional(),
  description: Joi.string().min(5).optional(),
  categoryId: Joi.number().integer().positive().optional(),
  category: Joi.string().optional(),
  budgetMin: Joi.number().min(0).optional(),
  budgetMax: Joi.number().min(0).optional(),
  deadline: Joi.string().optional(),
  skills: Joi.array().items(Joi.string()).optional(),
  skillsRequired: Joi.array().items(Joi.string()).optional(),
  deliveryDays: Joi.number().integer().min(1).optional(),
  attachments: Joi.array().items(Joi.string()).optional()
});

const statusSchema = Joi.object({
  status: Joi.string().valid('draft', 'pending_review', 'published', 'bidding', 'in_progress', 'reviewing', 'revision', 'completed', 'cancelled', 'disputed').required(),
  remark: Joi.string().optional()
});

const toDbStatus = (status: any) => {
  if (status === 'pending') return 'pending_review';
  if (status === 'revising') return 'revision';
  return status;
};

router.get('/', auth, async (req: Request, res: Response) => {
  try {
    const { page, pageSize, offset, limit } = getPagination(
      Number(req.query.page),
      Number(req.query.pageSize)
    );

    const categoryId = req.query.categoryId;
    const status = toDbStatus(req.query.status);
    const budgetMin = req.query.budgetMin;
    const budgetMax = req.query.budgetMax;
    const keyword = req.query.keyword;
    const employerId = req.query.employerId;
    const providerId = req.query.providerId;

    const whereConditions: string[] = [];
    const params: any[] = [];

    if (categoryId) {
      whereConditions.push('t.categoryId = ?');
      params.push(Number(categoryId));
    }
    if (status) {
      whereConditions.push('t.status = ?');
      params.push(status);
    }
    if (budgetMin) {
      whereConditions.push('t.budgetMax >= ?');
      params.push(Number(budgetMin));
    }
    if (budgetMax) {
      whereConditions.push('t.budgetMin <= ?');
      params.push(Number(budgetMax));
    }
    if (keyword) {
      whereConditions.push('(t.title LIKE ? OR t.description LIKE ?)');
      params.push(`%${keyword}%`, `%${keyword}%`);
    }
    if (employerId) {
      whereConditions.push('t.employerId = ?');
      params.push(Number(employerId));
    }
    if (providerId) {
      whereConditions.push('t.providerId = ?');
      params.push(Number(providerId));
    }

    const whereSql = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const countResult = db.prepare(`
      SELECT COUNT(*) as total FROM tasks t ${whereSql}
    `).get(...params) as { total: number };

    const tasks = db.prepare(`
      SELECT t.*, c.name as categoryName,
             u.name as employerName, u.avatar as employerAvatar,
             p.userId as providerUserId, pu.name as providerName, pu.avatar as providerAvatar,
             (SELECT COUNT(*) FROM bids b WHERE b.taskId = t.id) as bidCount,
             0 as viewCount
      FROM tasks t
      LEFT JOIN categories c ON t.categoryId = c.id
      LEFT JOIN users u ON t.employerId = u.id
      LEFT JOIN providers p ON t.providerId = p.id
      LEFT JOIN users pu ON p.userId = pu.id
      ${whereSql}
      ORDER BY t.createdAt DESC
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset) as any[];

    const result = tasks.map(normalizeTask);

    res.json(success(getPagedResult(result, countResult.total, page, pageSize), '获取任务列表成功'));
  } catch (err: any) {
    res.json(error(err.message || '获取任务列表失败', 500));
  }
});

router.get('/my', auth, async (req: Request, res: Response) => {
  try {
    const { page, pageSize, offset, limit } = getPagination(
      Number(req.query.page),
      Number(req.query.pageSize)
    );
    const status = toDbStatus(req.query.status);
    const whereConditions = ['t.employerId = ?'];
    const params: any[] = [req.user!.id];

    if (status) {
      whereConditions.push('t.status = ?');
      params.push(status);
    }

    const whereSql = `WHERE ${whereConditions.join(' AND ')}`;
    const total = (db.prepare(`SELECT COUNT(*) as total FROM tasks t ${whereSql}`).get(...params) as { total: number }).total;
    const tasks = db.prepare(`
      SELECT t.*, c.name as categoryName,
             u.name as employerName, u.avatar as employerAvatar,
             p.userId as providerUserId, pu.name as providerName, pu.avatar as providerAvatar,
             (SELECT COUNT(*) FROM bids b WHERE b.taskId = t.id) as bidCount,
             0 as viewCount
      FROM tasks t
      LEFT JOIN categories c ON t.categoryId = c.id
      LEFT JOIN users u ON t.employerId = u.id
      LEFT JOIN providers p ON t.providerId = p.id
      LEFT JOIN users pu ON p.userId = pu.id
      ${whereSql}
      ORDER BY t.createdAt DESC
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset) as any[];

    res.json(success(getPagedResult(tasks.map(normalizeTask), total, page, pageSize), '获取我的任务成功'));
  } catch (err: any) {
    res.json(error(err.message || '获取我的任务失败', 500));
  }
});

router.get('/provider', auth, async (req: Request, res: Response) => {
  try {
    const { page, pageSize, offset, limit } = getPagination(
      Number(req.query.page),
      Number(req.query.pageSize)
    );
    const provider = db.prepare('SELECT id FROM providers WHERE userId = ?').get(req.user!.id) as any;
    if (!provider) {
      return res.json(success(getPagedResult([], 0, page, pageSize), '获取服务商任务成功'));
    }

    const status = toDbStatus(req.query.status);
    const whereConditions = ['t.providerId = ?'];
    const params: any[] = [provider.id];
    if (status) {
      whereConditions.push('t.status = ?');
      params.push(status);
    }

    const whereSql = `WHERE ${whereConditions.join(' AND ')}`;
    const total = (db.prepare(`SELECT COUNT(*) as total FROM tasks t ${whereSql}`).get(...params) as { total: number }).total;
    const tasks = db.prepare(`
      SELECT t.*, c.name as categoryName,
             u.name as employerName, u.avatar as employerAvatar,
             p.userId as providerUserId, pu.name as providerName, pu.avatar as providerAvatar,
             (SELECT COUNT(*) FROM bids b WHERE b.taskId = t.id) as bidCount,
             0 as viewCount
      FROM tasks t
      LEFT JOIN categories c ON t.categoryId = c.id
      LEFT JOIN users u ON t.employerId = u.id
      LEFT JOIN providers p ON t.providerId = p.id
      LEFT JOIN users pu ON p.userId = pu.id
      ${whereSql}
      ORDER BY t.createdAt DESC
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset) as any[];

    res.json(success(getPagedResult(tasks.map(normalizeTask), total, page, pageSize), '获取服务商任务成功'));
  } catch (err: any) {
    res.json(error(err.message || '获取服务商任务失败', 500));
  }
});

router.get('/audit', auth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { page, pageSize, offset, limit } = getPagination(
      Number(req.query.page),
      Number(req.query.pageSize)
    );
    const total = (db.prepare("SELECT COUNT(*) as total FROM tasks WHERE status = 'pending_review'").get() as { total: number }).total;
    const tasks = db.prepare(`
      SELECT t.*, c.name as categoryName,
             u.name as employerName, u.avatar as employerAvatar,
             (SELECT COUNT(*) FROM bids b WHERE b.taskId = t.id) as bidCount,
             0 as viewCount
      FROM tasks t
      LEFT JOIN categories c ON t.categoryId = c.id
      LEFT JOIN users u ON t.employerId = u.id
      WHERE t.status = 'pending_review'
      ORDER BY t.createdAt DESC
      LIMIT ? OFFSET ?
    `).all(limit, offset) as any[];

    res.json(success(getPagedResult(tasks.map(normalizeTask), total, page, pageSize), '获取审核任务成功'));
  } catch (err: any) {
    res.json(error(err.message || '获取审核任务失败', 500));
  }
});

router.get('/:id', auth, async (req: Request, res: Response) => {
  try {
    const taskId = Number(req.params.id);

    const task = db.prepare(`
      SELECT t.*, c.name as categoryName,
             u.name as employerName, u.avatar as employerAvatar, u.email as employerEmail,
             p.userId as providerUserId, pu.name as providerName, pu.avatar as providerAvatar, pu.email as providerEmail,
             (SELECT COUNT(*) FROM bids b WHERE b.taskId = t.id) as bidCount,
             0 as viewCount
      FROM tasks t
      LEFT JOIN categories c ON t.categoryId = c.id
      LEFT JOIN users u ON t.employerId = u.id
      LEFT JOIN providers p ON t.providerId = p.id
      LEFT JOIN users pu ON p.userId = pu.id
      WHERE t.id = ?
    `).get(taskId) as any;

    if (!task) {
      return res.json(error('任务不存在', 404));
    }

    res.json(success(normalizeTask(task), '获取任务详情成功'));
  } catch (err: any) {
    res.json(error(err.message || '获取任务详情失败', 500));
  }
});

router.post('/', auth, requireEmployer, async (req: Request, res: Response) => {
  try {
    const { error: validationError, value } = createTaskSchema.validate(req.body);
    if (validationError) {
      return res.json(error(validationError.details[0].message, 400));
    }

    if (!value.categoryId && value.category) {
      const catRow = db.prepare('SELECT id FROM categories WHERE name = ?').get(value.category) as any;
      if (catRow) {
        value.categoryId = catRow.id;
      }
    }

    if (!value.deadline) {
      const defaultDeadline = new Date();
      defaultDeadline.setDate(defaultDeadline.getDate() + 30);
      value.deadline = defaultDeadline.toISOString();
    }

    if (!value.skillsRequired && value.skills) {
      value.skillsRequired = value.skills;
    }

    const employerId = req.user!.id;
    const requestNo = generateRequestNo();

    const hasDeliveryDays = db.prepare("PRAGMA table_info(tasks)").all().some((col: any) => col.name === 'deliveryDays');

    let result;
    if (hasDeliveryDays) {
      result = db.prepare(`
        INSERT INTO tasks (requestNo, title, description, categoryId, employerId,
                          budgetMin, budgetMax, deadline, skillsRequired, attachments, deliveryDays)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        requestNo,
        value.title,
        value.description,
        value.categoryId || null,
        employerId,
        value.budgetMin,
        value.budgetMax,
        value.deadline,
        stringifyJsonField(value.skillsRequired || []),
        stringifyJsonField(value.attachments || []),
        value.deliveryDays || null
      );
    } else {
      result = db.prepare(`
        INSERT INTO tasks (requestNo, title, description, categoryId, employerId,
                          budgetMin, budgetMax, deadline, skillsRequired, attachments)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        requestNo,
        value.title,
        value.description,
        value.categoryId || null,
        employerId,
        value.budgetMin,
        value.budgetMax,
        value.deadline,
        stringifyJsonField(value.skillsRequired || []),
        stringifyJsonField(value.attachments || [])
      );
    }

    const taskId = result.lastInsertRowid as number;

    logAudit(employerId, 'task', 'create', {
      targetId: taskId,
      targetType: 'task',
      details: { title: value.title, categoryId: value.categoryId },
      ip: req.ip
    });

    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId);

    res.json(success(normalizeTask(task), '创建任务成功'));
  } catch (err: any) {
    res.json(error(err.message || '创建任务失败', 500));
  }
});

router.put('/:id', auth, requireEmployer, async (req: Request, res: Response) => {
  try {
    const taskId = Number(req.params.id);
    const userId = req.user!.id;

    const existingTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId) as any;
    if (!existingTask) {
      return res.json(error('任务不存在', 404));
    }

    if (existingTask.employerId !== userId && req.user!.userType !== 'admin') {
      return res.json(error('无权修改此任务', 403));
    }

    const { error: validationError, value } = updateTaskSchema.validate(req.body);
    if (validationError) {
      return res.json(error(validationError.details[0].message, 400));
    }

    const fields = [];
    const params = [];

    if (value.title !== undefined) {
      fields.push('title = ?');
      params.push(value.title);
    }
    if (value.description !== undefined) {
      fields.push('description = ?');
      params.push(value.description);
    }
    if (value.categoryId !== undefined) {
      fields.push('categoryId = ?');
      params.push(value.categoryId);
    }
    if (value.budgetMin !== undefined) {
      fields.push('budgetMin = ?');
      params.push(value.budgetMin);
    }
    if (value.budgetMax !== undefined) {
      fields.push('budgetMax = ?');
      params.push(value.budgetMax);
    }
    if (value.deadline !== undefined) {
      fields.push('deadline = ?');
      params.push(value.deadline);
    }
    if (value.skillsRequired !== undefined) {
      fields.push('skillsRequired = ?');
      params.push(stringifyJsonField(value.skillsRequired));
    }
    if (value.attachments !== undefined) {
      fields.push('attachments = ?');
      params.push(stringifyJsonField(value.attachments));
    }

    if (fields.length === 0) {
      return res.json(success(existingTask, '没有需要更新的内容'));
    }

    fields.push('updatedAt = CURRENT_TIMESTAMP');
    params.push(taskId);

    db.prepare(`UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`).run(...params);

    logAudit(userId, 'task', 'update', {
      targetId: taskId,
      targetType: 'task',
      details: value,
      ip: req.ip
    });

    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId);

    res.json(success(normalizeTask(task), '更新任务成功'));
  } catch (err: any) {
    res.json(error(err.message || '更新任务失败', 500));
  }
});

router.delete('/:id', auth, requireEmployer, async (req: Request, res: Response) => {
  try {
    const taskId = Number(req.params.id);
    const userId = req.user!.id;

    const existingTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId) as any;
    if (!existingTask) {
      return res.json(error('任务不存在', 404));
    }

    if (existingTask.employerId !== userId && req.user!.userType !== 'admin') {
      return res.json(error('无权删除此任务', 403));
    }

    if (!['draft', 'pending_review'].includes(existingTask.status)) {
      return res.json(error('只能删除草稿或待审核状态的任务', 400));
    }

    db.prepare('DELETE FROM tasks WHERE id = ?').run(taskId);

    logAudit(userId, 'task', 'delete', {
      targetId: taskId,
      targetType: 'task',
      details: { title: existingTask.title },
      ip: req.ip,
      riskLevel: 'medium'
    });

    res.json(success(null, '删除任务成功'));
  } catch (err: any) {
    res.json(error(err.message || '删除任务失败', 500));
  }
});

router.post('/:id/submit-review', auth, requireEmployer, async (req: Request, res: Response) => {
  try {
    const taskId = Number(req.params.id);
    const userId = req.user!.id;

    const existingTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId) as any;
    if (!existingTask) {
      return res.json(error('任务不存在', 404));
    }

    if (existingTask.employerId !== userId && req.user!.userType !== 'admin') {
      return res.json(error('无权操作此任务', 403));
    }

    if (existingTask.status !== 'draft') {
      return res.json(error('只有草稿状态的任务才能提交审核', 400));
    }

    db.prepare(`
      UPDATE tasks SET status = 'pending_review', updatedAt = CURRENT_TIMESTAMP WHERE id = ?
    `).run(taskId);

    logAudit(userId, 'task', 'submit_review', {
      targetId: taskId,
      targetType: 'task',
      details: { title: existingTask.title },
      ip: req.ip,
      riskLevel: 'medium'
    });

    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId);

    res.json(success(normalizeTask(task), '任务已提交审核'));
  } catch (err: any) {
    res.json(error(err.message || '提交审核失败', 500));
  }
});

router.post('/:id/status', auth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const taskId = Number(req.params.id);
    const userId = req.user!.id;

    const existingTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId) as any;
    if (!existingTask) {
      return res.json(error('任务不存在', 404));
    }

    const { error: validationError, value } = statusSchema.validate(req.body);
    if (validationError) {
      return res.json(error(validationError.details[0].message, 400));
    }

    db.prepare(`
      UPDATE tasks SET
        status = ?,
        reviewRemark = ?,
        reviewBy = ?,
        reviewAt = CURRENT_TIMESTAMP,
        updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(value.status, value.remark || null, userId, taskId);

    logAudit(userId, 'task', 'status_change', {
      targetId: taskId,
      targetType: 'task',
      details: { from: existingTask.status, to: value.status, remark: value.remark },
      ip: req.ip,
      riskLevel: 'medium'
    });

    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId);

    res.json(success(normalizeTask(task), '任务状态已更新'));
  } catch (err: any) {
    res.json(error(err.message || '更新任务状态失败', 500));
  }
});

router.post('/:id/audit', auth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const taskId = Number(req.params.id);
    const userId = req.user!.id;
    const existingTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId) as any;
    if (!existingTask) {
      return res.json(error('任务不存在', 404));
    }

    const approved = Boolean(req.body.approved);
    const nextStatus = approved ? 'published' : 'draft';
    db.prepare(`
      UPDATE tasks SET
        status = ?,
        reviewRemark = ?,
        reviewBy = ?,
        reviewAt = CURRENT_TIMESTAMP,
        updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(nextStatus, req.body.remark || null, userId, taskId);

    logAudit(userId, 'task', approved ? 'audit_approve' : 'audit_reject', {
      targetId: taskId,
      targetType: 'task',
      details: { from: existingTask.status, to: nextStatus, remark: req.body.remark },
      ip: req.ip,
      riskLevel: 'medium'
    });

    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId);
    res.json(success(normalizeTask(task), approved ? '任务审核通过' : '任务已驳回'));
  } catch (err: any) {
    res.json(error(err.message || '审核任务失败', 500));
  }
});

export default router;
