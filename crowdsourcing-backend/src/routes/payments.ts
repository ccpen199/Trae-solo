import { Router, Request, Response } from 'express';
import Joi from 'joi';
import db from '../database';
import { success, error, getPagination, getPagedResult, logAudit, generateTransactionNo } from '../utils/common';
import { auth, requireEmployer, requireAdmin } from '../middleware/auth';

const router = Router();

const escrowSchema = Joi.object({
  taskId: Joi.number().integer().positive().required(),
  amount: Joi.number().positive().required(),
  milestone: Joi.string().optional()
});

const milestoneSchema = Joi.object({
  taskId: Joi.number().integer().positive().required(),
  amount: Joi.number().positive().required(),
  milestone: Joi.string().required()
});

const releaseSchema = Joi.object({
  taskId: Joi.number().integer().positive().required(),
  amount: Joi.number().positive().required(),
  remark: Joi.string().optional()
});

const refundSchema = Joi.object({
  taskId: Joi.number().integer().positive().required(),
  reason: Joi.string().min(10).required()
});

router.post('/escrow', auth, requireEmployer, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    const { error: validationError, value } = escrowSchema.validate(req.body);
    if (validationError) {
      return res.json(error(validationError.details[0].message, 400));
    }

    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(value.taskId) as any;
    if (!task) {
      return res.json(error('任务不存在', 404));
    }

    if (task.employerId !== userId && req.user!.userType !== 'admin') {
      return res.json(error('无权操作此任务', 403));
    }

    if (task.status !== 'in_progress') {
      return res.json(error('只有进行中的任务才能进行资金托管', 400));
    }

    const provider = db.prepare('SELECT userId FROM providers WHERE id = ?').get(task.providerId) as any;
    if (!provider) {
      return res.json(error('服务商信息不存在', 404));
    }

    const transactionNo = generateTransactionNo();

    const result = db.prepare(`
      INSERT INTO payments (transactionNo, taskId, payerId, payeeId, amount, type, status, milestone)
      VALUES (?, ?, ?, ?, ?, 'escrow', 'completed', ?)
    `).run(transactionNo, value.taskId, userId, provider.userId, value.amount, value.milestone || '项目启动款');

    const paymentId = result.lastInsertRowid as number;

    logAudit(userId, 'payment', 'escrow', {
      targetId: paymentId,
      targetType: 'payment',
      details: { taskId: value.taskId, amount: value.amount, transactionNo },
      ip: req.ip,
      riskLevel: 'high'
    });

    const payment = db.prepare('SELECT * FROM payments WHERE id = ?').get(paymentId);

    res.json(success(payment, '资金托管成功'));
  } catch (err: any) {
    res.json(error(err.message || '资金托管失败', 500));
  }
});

router.post('/milestone', auth, requireEmployer, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    const { error: validationError, value } = milestoneSchema.validate(req.body);
    if (validationError) {
      return res.json(error(validationError.details[0].message, 400));
    }

    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(value.taskId) as any;
    if (!task) {
      return res.json(error('任务不存在', 404));
    }

    if (task.employerId !== userId && req.user!.userType !== 'admin') {
      return res.json(error('无权操作此任务', 403));
    }

    if (task.status !== 'in_progress') {
      return res.json(error('只有进行中的任务才能进行里程碑付款', 400));
    }

    const provider = db.prepare('SELECT userId FROM providers WHERE id = ?').get(task.providerId) as any;
    if (!provider) {
      return res.json(error('服务商信息不存在', 404));
    }

    const transactionNo = generateTransactionNo();

    const result = db.prepare(`
      INSERT INTO payments (transactionNo, taskId, payerId, payeeId, amount, type, status, milestone)
      VALUES (?, ?, ?, ?, ?, 'milestone', 'completed', ?)
    `).run(transactionNo, value.taskId, userId, provider.userId, value.amount, value.milestone);

    const paymentId = result.lastInsertRowid as number;

    logAudit(userId, 'payment', 'milestone', {
      targetId: paymentId,
      targetType: 'payment',
      details: { taskId: value.taskId, amount: value.amount, milestone: value.milestone, transactionNo },
      ip: req.ip,
      riskLevel: 'high'
    });

    const payment = db.prepare('SELECT * FROM payments WHERE id = ?').get(paymentId);

    res.json(success(payment, '里程碑付款成功'));
  } catch (err: any) {
    res.json(error(err.message || '里程碑付款失败', 500));
  }
});

router.post('/release', auth, requireEmployer, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    const { error: validationError, value } = releaseSchema.validate(req.body);
    if (validationError) {
      return res.json(error(validationError.details[0].message, 400));
    }

    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(value.taskId) as any;
    if (!task) {
      return res.json(error('任务不存在', 404));
    }

    if (task.employerId !== userId && req.user!.userType !== 'admin') {
      return res.json(error('无权操作此任务', 403));
    }

    if (task.status !== 'reviewing') {
      return res.json(error('只有评审中的任务才能进行验收打款', 400));
    }

    const provider = db.prepare('SELECT userId FROM providers WHERE id = ?').get(task.providerId) as any;
    if (!provider) {
      return res.json(error('服务商信息不存在', 404));
    }

    const transactionNo = generateTransactionNo();

    const updatePaymentStmt = db.prepare(`
      INSERT INTO payments (transactionNo, taskId, payerId, payeeId, amount, type, status, remark)
      VALUES (?, ?, ?, ?, ?, 'release', 'completed', ?)
    `);

    const updateTaskStmt = db.prepare(`
      UPDATE tasks SET status = 'completed', updatedAt = CURRENT_TIMESTAMP WHERE id = ?
    `);

    const updateProviderStmt = db.prepare(`
      UPDATE providers SET
        completedTasks = completedTasks + 1,
        totalEarnings = totalEarnings + ?,
        updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    const transaction = db.transaction(() => {
      updatePaymentStmt.run(transactionNo, value.taskId, userId, provider.userId, value.amount, value.remark || '项目验收完成');
      updateTaskStmt.run(value.taskId);
      updateProviderStmt.run(value.amount, task.providerId);
    });

    transaction();

    logAudit(userId, 'payment', 'release', {
      targetId: value.taskId,
      targetType: 'task',
      details: { taskId: value.taskId, amount: value.amount, transactionNo },
      ip: req.ip,
      riskLevel: 'high'
    });

    const payment = db.prepare('SELECT * FROM payments WHERE transactionNo = ?').get(transactionNo);

    res.json(success({ payment, transactionNo }, '验收打款成功'));
  } catch (err: any) {
    res.json(error(err.message || '验收打款失败', 500));
  }
});

router.post('/refund', auth, requireEmployer, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    const { error: validationError, value } = refundSchema.validate(req.body);
    if (validationError) {
      return res.json(error(validationError.details[0].message, 400));
    }

    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(value.taskId) as any;
    if (!task) {
      return res.json(error('任务不存在', 404));
    }

    if (task.employerId !== userId && req.user!.userType !== 'admin') {
      return res.json(error('无权操作此任务', 403));
    }

    if (!['bidding', 'in_progress', 'disputed'].includes(task.status)) {
      return res.json(error('当前任务状态不允许申请退款', 400));
    }

    const provider = db.prepare('SELECT userId FROM providers WHERE id = ?').get(task.providerId) as any;
    if (!provider) {
      return res.json(error('服务商信息不存在', 404));
    }

    const totalPaid = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total FROM payments
      WHERE taskId = ? AND status = 'completed' AND type IN ('escrow', 'milestone')
    `).get(value.taskId) as { total: number };

    if (totalPaid.total <= 0) {
      return res.json(error('没有可退款的金额', 400));
    }

    const transactionNo = generateTransactionNo();
    const refundAmount = totalPaid.total * 0.8;

    db.prepare(`
      INSERT INTO payments (transactionNo, taskId, payerId, payeeId, amount, type, status, remark)
      VALUES (?, ?, ?, ?, ?, 'refund', 'pending', ?)
    `).run(transactionNo, value.taskId, provider.userId, userId, refundAmount, `退款原因：${value.reason}`);

    logAudit(userId, 'payment', 'refund_request', {
      targetId: value.taskId,
      targetType: 'task',
      details: { taskId: value.taskId, amount: refundAmount, reason: value.reason, transactionNo },
      ip: req.ip,
      riskLevel: 'high'
    });

    res.json(success({ transactionNo, amount: refundAmount }, '退款申请已提交，等待审核'));
  } catch (err: any) {
    res.json(error(err.message || '退款申请失败', 500));
  }
});

router.get('/', auth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    const { page, pageSize, offset, limit } = getPagination(
      Number(req.query.page),
      Number(req.query.pageSize)
    );

    const taskId = req.query.taskId;
    const type = req.query.type;
    const status = req.query.status;
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;

    const whereConditions: string[] = ['(p.payerId = ? OR p.payeeId = ?)'];
    const params: any[] = [userId, userId];

    if (taskId) {
      whereConditions.push('p.taskId = ?');
      params.push(Number(taskId));
    }
    if (type) {
      whereConditions.push('p.type = ?');
      params.push(type);
    }
    if (status) {
      whereConditions.push('p.status = ?');
      params.push(status);
    }
    if (startDate) {
      whereConditions.push('p.createdAt >= ?');
      params.push(startDate);
    }
    if (endDate) {
      whereConditions.push('p.createdAt <= ?');
      params.push(endDate);
    }

    const whereSql = `WHERE ${whereConditions.join(' AND ')}`;

    const countResult = db.prepare(`
      SELECT COUNT(*) as total FROM payments p ${whereSql}
    `).get(...params) as { total: number };

    const payments = db.prepare(`
      SELECT p.*,
             t.title as taskTitle,
             pu.name as payerName,
             ey.name as payeeName
      FROM payments p
      LEFT JOIN tasks t ON p.taskId = t.id
      LEFT JOIN users pu ON p.payerId = pu.id
      LEFT JOIN users ey ON p.payeeId = ey.id
      ${whereSql}
      ORDER BY p.createdAt DESC
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset);

    const stats = db.prepare(`
      SELECT
        type,
        COUNT(*) as count,
        COALESCE(SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END), 0) as totalAmount
      FROM payments
      WHERE (payerId = ? OR payeeId = ?)
      GROUP BY type
    `).all(userId, userId);

    res.json(success({
      ...getPagedResult(payments, countResult.total, page, pageSize),
      stats
    }, '获取交易流水成功'));
  } catch (err: any) {
    res.json(error(err.message || '获取交易流水失败', 500));
  }
});

router.post('/refund/:id/process', auth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const paymentId = Number(req.params.id);
    const userId = req.user!.id;
    const { status } = req.body;

    if (!['completed', 'rejected'].includes(status)) {
      return res.json(error('无效的状态值', 400));
    }

    const payment = db.prepare('SELECT * FROM payments WHERE id = ? AND type = ?').get(paymentId, 'refund') as any;
    if (!payment) {
      return res.json(error('退款记录不存在', 404));
    }

    if (payment.status !== 'pending') {
      return res.json(error('此退款已处理', 400));
    }

    db.prepare(`
      UPDATE payments SET status = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?
    `).run(status, paymentId);

    if (status === 'completed') {
      db.prepare("UPDATE tasks SET status = 'cancelled', updatedAt = CURRENT_TIMESTAMP WHERE id = ?").run(payment.taskId);
    }

    logAudit(userId, 'payment', 'process_refund', {
      targetId: paymentId,
      targetType: 'payment',
      details: { paymentId, status, amount: payment.amount },
      ip: req.ip,
      riskLevel: 'high'
    });

    res.json(success(null, `退款已${status === 'completed' ? '完成' : '拒绝'}`));
  } catch (err: any) {
    res.json(error(err.message || '处理退款失败', 500));
  }
});

export default router;
