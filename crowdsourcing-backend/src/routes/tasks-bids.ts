import { Router, Request, Response } from 'express';
import Joi from 'joi';
import db from '../database';
import { success, error, getPagination, getPagedResult, logAudit } from '../utils/common';
import { auth, requireProvider, requireEmployer } from '../middleware/auth';

const router = Router({ mergeParams: true });

const createBidSchema = Joi.object({
  bidAmount: Joi.number().positive().optional(),
  price: Joi.number().positive().optional(),
  deliveryDays: Joi.number().integer().positive().required(),
  proposal: Joi.string().min(10).optional(),
  coverLetter: Joi.string().min(10).optional()
}).or('bidAmount', 'price').or('proposal', 'coverLetter');

router.get('/', auth, async (req: Request, res: Response) => {
  try {
    const taskId = req.params.taskId ? Number(req.params.taskId) : null;
    const { page, pageSize, offset, limit } = getPagination(
      Number(req.query.page),
      Number(req.query.pageSize)
    );

    const status = req.query.status;
    const providerId = req.query.providerId;

    const whereConditions: string[] = [];
    const params: any[] = [];

    if (taskId) {
      whereConditions.push('b.taskId = ?');
      params.push(taskId);
    }
    if (status) {
      whereConditions.push('b.status = ?');
      params.push(status);
    }
    if (providerId) {
      whereConditions.push('b.providerId = ?');
      params.push(Number(providerId));
    }

    const whereSql = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const countResult = db.prepare(`
      SELECT COUNT(*) as total FROM bids b ${whereSql}
    `).get(...params) as { total: number };

    const bids = db.prepare(`
      SELECT b.*, t.title as taskTitle, t.budgetMin, t.budgetMax,
             p.userId as providerUserId, u.name as providerName,
             u.avatar as providerAvatar, p.rating as providerRating,
             p.level as providerLevel
      FROM bids b
      LEFT JOIN tasks t ON b.taskId = t.id
      LEFT JOIN providers p ON b.providerId = p.id
      LEFT JOIN users u ON p.userId = u.id
      ${whereSql}
      ORDER BY b.createdAt DESC
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset);

    res.json(success(getPagedResult(bids, countResult.total, page, pageSize), '获取投标列表成功'));
  } catch (err: any) {
    res.json(error(err.message || '获取投标列表失败', 500));
  }
});

router.get('/my', auth, requireProvider, async (req: Request, res: Response) => {
  try {
    const { page, pageSize, offset, limit } = getPagination(
      Number(req.query.page),
      Number(req.query.pageSize)
    );
    const provider = db.prepare('SELECT id FROM providers WHERE userId = ?').get(req.user!.id) as any;
    if (!provider) {
      return res.json(success(getPagedResult([], 0, page, pageSize), '获取我的投标成功'));
    }

    const total = (db.prepare('SELECT COUNT(*) as total FROM bids WHERE providerId = ?').get(provider.id) as { total: number }).total;
    const bids = db.prepare(`
      SELECT b.*, b.bidAmount as price, b.proposal as coverLetter,
             t.title as taskTitle, t.requestNo as taskNo, t.budgetMin, t.budgetMax,
             c.name as taskCategory,
             p.userId as providerUserId, u.name as providerName,
             u.avatar as providerAvatar, p.rating as providerRating,
             0 as providerReviewCount, 1 as providerVerified
      FROM bids b
      LEFT JOIN tasks t ON b.taskId = t.id
      LEFT JOIN categories c ON t.categoryId = c.id
      LEFT JOIN providers p ON b.providerId = p.id
      LEFT JOIN users u ON p.userId = u.id
      WHERE b.providerId = ?
      ORDER BY b.createdAt DESC
      LIMIT ? OFFSET ?
    `).all(provider.id, limit, offset);

    res.json(success(getPagedResult(bids, total, page, pageSize), '获取我的投标成功'));
  } catch (err: any) {
    res.json(error(err.message || '获取我的投标失败', 500));
  }
});

router.post('/', auth, requireProvider, async (req: Request, res: Response) => {
  try {
    const taskId = Number(req.params.taskId);
    const userId = req.user!.id;

    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId) as any;
    if (!task) {
      return res.json(error('任务不存在', 404));
    }

    if (task.status !== 'published' && task.status !== 'bidding') {
      return res.json(error('当前任务状态不允许投标', 400));
    }

    const provider = db.prepare('SELECT * FROM providers WHERE userId = ?').get(userId) as any;
    if (!provider) {
      return res.json(error('服务商信息不存在', 404));
    }

    const existingBid = db.prepare('SELECT * FROM bids WHERE taskId = ? AND providerId = ?').get(taskId, provider.id);
    if (existingBid) {
      return res.json(error('您已对此任务提交过投标', 409));
    }

    const { error: validationError, value } = createBidSchema.validate(req.body);
    if (validationError) {
      return res.json(error(validationError.details[0].message, 400));
    }

    const bidAmount = value.bidAmount ?? value.price;
    const proposal = value.proposal ?? value.coverLetter;

    const result = db.prepare(`
      INSERT INTO bids (taskId, providerId, bidAmount, deliveryDays, proposal)
      VALUES (?, ?, ?, ?, ?)
    `).run(taskId, provider.id, bidAmount, value.deliveryDays, proposal);

    const bidId = result.lastInsertRowid as number;

    if (task.status === 'published') {
      db.prepare("UPDATE tasks SET status = 'bidding', updatedAt = CURRENT_TIMESTAMP WHERE id = ?").run(taskId);
    }

    logAudit(userId, 'bid', 'create', {
      targetId: bidId,
      targetType: 'bid',
      details: { taskId, bidAmount },
      ip: req.ip
    });

    const bid = db.prepare(`
      SELECT b.*, u.name as providerName, u.avatar as providerAvatar
      FROM bids b
      LEFT JOIN providers p ON b.providerId = p.id
      LEFT JOIN users u ON p.userId = u.id
      WHERE b.id = ?
    `).get(bidId);

    res.json(success(bid, '投标成功'));
  } catch (err: any) {
    res.json(error(err.message || '投标失败', 500));
  }
});

router.post('/:bidId/accept', auth, requireEmployer, async (req: Request, res: Response) => {
  try {
    const taskId = Number(req.params.taskId);
    const bidId = Number(req.params.bidId);
    const userId = req.user!.id;

    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId) as any;
    if (!task) {
      return res.json(error('任务不存在', 404));
    }

    if (task.employerId !== userId && req.user!.userType !== 'admin') {
      return res.json(error('无权操作此任务', 403));
    }

    if (task.status !== 'bidding') {
      return res.json(error('当前任务状态不允许接受投标', 400));
    }

    const bid = db.prepare('SELECT * FROM bids WHERE id = ? AND taskId = ?').get(bidId, taskId) as any;
    if (!bid) {
      return res.json(error('投标不存在', 404));
    }

    if (bid.status !== 'pending') {
      return res.json(error('此投标已被处理', 400));
    }

    const updateBidStmt = db.prepare("UPDATE bids SET status = 'accepted', updatedAt = CURRENT_TIMESTAMP WHERE id = ?");
    const rejectOtherBidsStmt = db.prepare("UPDATE bids SET status = 'rejected', updatedAt = CURRENT_TIMESTAMP WHERE taskId = ? AND id != ?");
    const updateTaskStmt = db.prepare("UPDATE tasks SET providerId = ?, status = 'in_progress', updatedAt = CURRENT_TIMESTAMP WHERE id = ?");

    const transaction = db.transaction(() => {
      updateBidStmt.run(bidId);
      rejectOtherBidsStmt.run(taskId, bidId);
      updateTaskStmt.run(bid.providerId, taskId);
    });

    transaction();

    logAudit(userId, 'bid', 'accept', {
      targetId: bidId,
      targetType: 'bid',
      details: { taskId, providerId: bid.providerId, bidAmount: bid.bidAmount },
      ip: req.ip,
      riskLevel: 'medium'
    });

    const updatedBid = db.prepare('SELECT * FROM bids WHERE id = ?').get(bidId);

    res.json(success(updatedBid, '已接受投标，任务开始进行'));
  } catch (err: any) {
    res.json(error(err.message || '接受投标失败', 500));
  }
});

router.post('/:bidId/reject', auth, requireEmployer, async (req: Request, res: Response) => {
  try {
    const taskId = Number(req.params.taskId);
    const bidId = Number(req.params.bidId);
    const userId = req.user!.id;

    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId) as any;
    if (!task) {
      return res.json(error('任务不存在', 404));
    }

    if (task.employerId !== userId && req.user!.userType !== 'admin') {
      return res.json(error('无权操作此任务', 403));
    }

    if (task.status !== 'bidding') {
      return res.json(error('当前任务状态不允许拒绝投标', 400));
    }

    const bid = db.prepare('SELECT * FROM bids WHERE id = ? AND taskId = ?').get(bidId, taskId) as any;
    if (!bid) {
      return res.json(error('投标不存在', 404));
    }

    if (bid.status !== 'pending') {
      return res.json(error('此投标已被处理', 400));
    }

    db.prepare("UPDATE bids SET status = 'rejected', updatedAt = CURRENT_TIMESTAMP WHERE id = ?").run(bidId);

    logAudit(userId, 'bid', 'reject', {
      targetId: bidId,
      targetType: 'bid',
      details: { taskId, providerId: bid.providerId },
      ip: req.ip
    });

    const updatedBid = db.prepare('SELECT * FROM bids WHERE id = ?').get(bidId);

    res.json(success(updatedBid, '已拒绝此投标'));
  } catch (err: any) {
    res.json(error(err.message || '拒绝投标失败', 500));
  }
});

export default router;
