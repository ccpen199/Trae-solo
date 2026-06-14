import { Router, Request, Response } from 'express';
import Joi from 'joi';
import db from '../database';
import { success, error, logAudit, generateTransactionNo } from '../utils/common';
import { auth, requireEmployer } from '../middleware/auth';

const router = Router({ mergeParams: true });

const reviewSchema = Joi.object({
  submissionId: Joi.number().integer().positive().required(),
  content: Joi.string().min(5).required(),
  rating: Joi.number().integer().min(1).max(5).optional()
});

const acceptSchema = Joi.object({
  submissionId: Joi.number().integer().positive().required(),
  content: Joi.string().optional(),
  rating: Joi.number().integer().min(1).max(5).optional(),
  amount: Joi.number().positive().optional()
});

const rejectSchema = Joi.object({
  submissionId: Joi.number().integer().positive().required(),
  content: Joi.string().min(5).required()
});

router.post('/', auth, requireEmployer, async (req: Request, res: Response) => {
  try {
    const taskId = Number(req.params.taskId);
    const userId = req.user!.id;

    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId) as any;
    if (!task) {
      return res.json(error('任务不存在', 404));
    }

    if (task.employerId !== userId && req.user!.userType !== 'admin') {
      return res.json(error('无权操作此任务', 403));
    }

    if (task.status !== 'reviewing') {
      return res.json(error('当前任务状态不允许评审', 400));
    }

    const { error: validationError, value } = reviewSchema.validate(req.body);
    if (validationError) {
      return res.json(error(validationError.details[0].message, 400));
    }

    const submission = db.prepare('SELECT * FROM submissions WHERE id = ? AND taskId = ?').get(value.submissionId, taskId);
    if (!submission) {
      return res.json(error('稿件不存在', 404));
    }

    const result = db.prepare(`
      INSERT INTO review_comments (taskId, submissionId, reviewerId, content, rating, status)
      VALUES (?, ?, ?, ?, ?, 'comment')
    `).run(taskId, value.submissionId, userId, value.content, value.rating || null);

    const reviewId = result.lastInsertRowid as number;

    logAudit(userId, 'review', 'create', {
      targetId: reviewId,
      targetType: 'review_comment',
      details: { taskId, submissionId: value.submissionId },
      ip: req.ip
    });

    const review = db.prepare(`
      SELECT rc.*, u.name as reviewerName, u.avatar as reviewerAvatar
      FROM review_comments rc
      LEFT JOIN users u ON rc.reviewerId = u.id
      WHERE rc.id = ?
    `).get(reviewId);

    res.json(success(review, '评审意见提交成功'));
  } catch (err: any) {
    res.json(error(err.message || '提交评审意见失败', 500));
  }
});

router.post('/accept', auth, requireEmployer, async (req: Request, res: Response) => {
  try {
    const taskId = Number(req.params.taskId);
    const userId = req.user!.id;

    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId) as any;
    if (!task) {
      return res.json(error('任务不存在', 404));
    }

    if (task.employerId !== userId && req.user!.userType !== 'admin') {
      return res.json(error('无权操作此任务', 403));
    }

    if (task.status !== 'reviewing') {
      return res.json(error('当前任务状态不允许验收', 400));
    }

    const { error: validationError, value } = acceptSchema.validate(req.body);
    if (validationError) {
      return res.json(error(validationError.details[0].message, 400));
    }

    const submission = db.prepare('SELECT * FROM submissions WHERE id = ? AND taskId = ?').get(value.submissionId, taskId) as any;
    if (!submission) {
      return res.json(error('稿件不存在', 404));
    }

    const provider = db.prepare('SELECT userId FROM providers WHERE id = ?').get(task.providerId) as any;
    if (!provider) {
      return res.json(error('服务商信息不存在', 404));
    }

    const transactionNo = generateTransactionNo();
    const amount = value.amount || task.budgetMax;

    const insertReviewStmt = db.prepare(`
      INSERT INTO review_comments (taskId, submissionId, reviewerId, content, rating, status)
      VALUES (?, ?, ?, ?, ?, 'accepted')
    `);

    const insertPaymentStmt = db.prepare(`
      INSERT INTO payments (transactionNo, taskId, payerId, payeeId, amount, type, status)
      VALUES (?, ?, ?, ?, ?, 'release', 'completed')
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

    const insertRatingStmt = db.prepare(`
      INSERT OR REPLACE INTO ratings (taskId, raterId, rateeId, score, content)
      VALUES (?, ?, ?, ?, ?)
    `);

    const transaction = db.transaction(() => {
      insertReviewStmt.run(taskId, value.submissionId, userId, value.content || '验收通过', value.rating || 5);
      insertPaymentStmt.run(transactionNo, taskId, userId, provider.userId, amount);
      updateTaskStmt.run(taskId);
      updateProviderStmt.run(amount, task.providerId);
      if (value.rating) {
        insertRatingStmt.run(taskId, userId, provider.userId, value.rating, value.content || null);
      }
    });

    transaction();

    logAudit(userId, 'review', 'accept', {
      targetId: value.submissionId,
      targetType: 'submission',
      details: { taskId, amount, rating: value.rating },
      ip: req.ip,
      riskLevel: 'high'
    });

    const updatedTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId);

    res.json(success({ task: updatedTask, transactionNo, amount }, '验收通过，款项已打款给服务商'));
  } catch (err: any) {
    res.json(error(err.message || '验收失败', 500));
  }
});

router.post('/reject', auth, requireEmployer, async (req: Request, res: Response) => {
  try {
    const taskId = Number(req.params.taskId);
    const userId = req.user!.id;

    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId) as any;
    if (!task) {
      return res.json(error('任务不存在', 404));
    }

    if (task.employerId !== userId && req.user!.userType !== 'admin') {
      return res.json(error('无权操作此任务', 403));
    }

    if (task.status !== 'reviewing') {
      return res.json(error('当前任务状态不允许驳回', 400));
    }

    const { error: validationError, value } = rejectSchema.validate(req.body);
    if (validationError) {
      return res.json(error(validationError.details[0].message, 400));
    }

    const submission = db.prepare('SELECT * FROM submissions WHERE id = ? AND taskId = ?').get(value.submissionId, taskId);
    if (!submission) {
      return res.json(error('稿件不存在', 404));
    }

    const insertReviewStmt = db.prepare(`
      INSERT INTO review_comments (taskId, submissionId, reviewerId, content, status)
      VALUES (?, ?, ?, ?, 'rejected')
    `);

    const updateTaskStmt = db.prepare(`
      UPDATE tasks SET status = 'revision', updatedAt = CURRENT_TIMESTAMP WHERE id = ?
    `);

    const transaction = db.transaction(() => {
      insertReviewStmt.run(taskId, value.submissionId, userId, value.content);
      updateTaskStmt.run(taskId);
    });

    transaction();

    logAudit(userId, 'review', 'reject', {
      targetId: value.submissionId,
      targetType: 'submission',
      details: { taskId, reason: value.content },
      ip: req.ip,
      riskLevel: 'medium'
    });

    const updatedTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId);

    res.json(success({ task: updatedTask }, '已驳回，等待服务商修改后重新提交'));
  } catch (err: any) {
    res.json(error(err.message || '驳回失败', 500));
  }
});

export default router;
