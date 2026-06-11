import { Router, Request, Response } from 'express';
import Joi from 'joi';
import db from '../database';
import { success, error, getPagination, getPagedResult, logAudit } from '../utils/common';
import { auth, requireAdmin } from '../middleware/auth';

const router = Router();

const createDisputeSchema = Joi.object({
  taskId: Joi.number().integer().positive().required(),
  type: Joi.string().required(),
  title: Joi.string().min(10).max(200).required(),
  description: Joi.string().min(20).required(),
  evidence: Joi.array().items(Joi.string()).optional()
});

const defenseSchema = Joi.object({
  content: Joi.string().min(20).required(),
  evidence: Joi.array().items(Joi.string()).optional()
});

const arbitrationSchema = Joi.object({
  result: Joi.string().required(),
  winner: Joi.string().valid('complainant', 'respondent').required(),
  refundAmount: Joi.number().min(0).optional()
});

router.post('/', auth, async (req: Request, res: Response) => {
  try {
    const complainantId = req.user!.id;

    const { error: validationError, value } = createDisputeSchema.validate(req.body);
    if (validationError) {
      return res.json(error(validationError.details[0].message, 400));
    }

    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(value.taskId) as any;
    if (!task) {
      return res.json(error('任务不存在', 404));
    }

    let respondentId: number;
    if (task.employerId === complainantId) {
      const provider = db.prepare('SELECT userId FROM providers WHERE id = ?').get(task.providerId) as { userId: number } | undefined;
      if (!provider) {
        return res.json(error('服务商信息不存在', 404));
      }
      respondentId = provider.userId;
    } else if (task.providerId) {
      const provider = db.prepare('SELECT * FROM providers WHERE id = ? AND userId = ?').get(task.providerId, complainantId);
      if (provider) {
        respondentId = task.employerId;
      } else {
        return res.json(error('您不是此任务的参与方', 403));
      }
    } else {
      return res.json(error('您不是此任务的参与方', 403));
    }

    if (complainantId === respondentId) {
      return res.json(error('不能对自己发起申诉', 400));
    }

    if (!['in_progress', 'reviewing', 'revision', 'completed'].includes(task.status)) {
      return res.json(error('当前任务状态不允许发起申诉', 400));
    }

    const result = db.prepare(`
      INSERT INTO disputes (taskId, complainantId, respondentId, type, title, description, evidence, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
    `).run(
      value.taskId,
      complainantId,
      respondentId,
      value.type,
      value.title,
      value.description,
      value.evidence ? JSON.stringify(value.evidence) : null
    );

    const disputeId = result.lastInsertRowid as number;

    db.prepare("UPDATE tasks SET status = 'disputed', updatedAt = CURRENT_TIMESTAMP WHERE id = ?").run(value.taskId);

    logAudit(complainantId, 'dispute', 'create', {
      targetId: disputeId,
      targetType: 'dispute',
      details: { taskId: value.taskId, type: value.type, title: value.title },
      ip: req.ip,
      riskLevel: 'high'
    });

    const dispute = db.prepare('SELECT * FROM disputes WHERE id = ?').get(disputeId);

    res.json(success(dispute, '申诉已提交，等待处理'));
  } catch (err: any) {
    res.json(error(err.message || '发起申诉失败', 500));
  }
});

router.get('/', auth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    const { page, pageSize, offset, limit } = getPagination(
      Number(req.query.page),
      Number(req.query.pageSize)
    );

    const status = req.query.status;
    const type = req.query.type;
    const taskId = req.query.taskId;

    const whereConditions: string[] = ['(d.complainantId = ? OR d.respondentId = ?)'];
    const params: any[] = [userId, userId];

    if (req.user!.userType === 'admin') {
      whereConditions.pop();
      params.pop();
      params.pop();
    }

    if (status) {
      whereConditions.push('d.status = ?');
      params.push(status);
    }
    if (type) {
      whereConditions.push('d.type = ?');
      params.push(type);
    }
    if (taskId) {
      whereConditions.push('d.taskId = ?');
      params.push(Number(taskId));
    }

    const whereSql = `WHERE ${whereConditions.join(' AND ')}`;

    const countResult = db.prepare(`
      SELECT COUNT(*) as total FROM disputes d ${whereSql}
    `).get(...params) as { total: number };

    const disputes = db.prepare(`
      SELECT d.*,
             t.title as taskTitle, t.requestNo as taskRequestNo,
             cu.name as complainantName,
             ru.name as respondentName,
             a.name as arbitratorName
      FROM disputes d
      LEFT JOIN tasks t ON d.taskId = t.id
      LEFT JOIN users cu ON d.complainantId = cu.id
      LEFT JOIN users ru ON d.respondentId = ru.id
      LEFT JOIN users a ON d.arbitratorId = a.id
      ${whereSql}
      ORDER BY d.createdAt DESC
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset);

    res.json(success(getPagedResult(disputes, countResult.total, page, pageSize), '获取争议列表成功'));
  } catch (err: any) {
    res.json(error(err.message || '获取争议列表失败', 500));
  }
});

router.get('/:id', auth, async (req: Request, res: Response) => {
  try {
    const disputeId = Number(req.params.id);
    const userId = req.user!.id;

    const dispute = db.prepare(`
      SELECT d.*,
             t.title as taskTitle, t.requestNo as taskRequestNo,
             t.description as taskDescription,
             cu.name as complainantName, cu.email as complainantEmail,
             ru.name as respondentName, ru.email as respondentEmail,
             a.name as arbitratorName
      FROM disputes d
      LEFT JOIN tasks t ON d.taskId = t.id
      LEFT JOIN users cu ON d.complainantId = cu.id
      LEFT JOIN users ru ON d.respondentId = ru.id
      LEFT JOIN users a ON d.arbitratorId = a.id
      WHERE d.id = ?
    `).get(disputeId) as any;

    if (!dispute) {
      return res.json(error('争议不存在', 404));
    }

    if (req.user!.userType !== 'admin' &&
        dispute.complainantId !== userId &&
        dispute.respondentId !== userId) {
      return res.json(error('无权查看此争议详情', 403));
    }

    if (dispute.evidence) {
      try {
        dispute.evidence = JSON.parse(dispute.evidence);
      } catch {
        dispute.evidence = [];
      }
    }

    res.json(success(dispute, '获取争议详情成功'));
  } catch (err: any) {
    res.json(error(err.message || '获取争议详情失败', 500));
  }
});

router.post('/:id/defense', auth, async (req: Request, res: Response) => {
  try {
    const disputeId = Number(req.params.id);
    const userId = req.user!.id;

    const dispute = db.prepare('SELECT * FROM disputes WHERE id = ?').get(disputeId) as any;
    if (!dispute) {
      return res.json(error('争议不存在', 404));
    }

    if (dispute.respondentId !== userId) {
      return res.json(error('您不是此争议的被申诉方', 403));
    }

    if (dispute.status !== 'pending' && dispute.status !== 'processing') {
      return res.json(error('当前争议状态不允许提交申辩', 400));
    }

    const { error: validationError, value } = defenseSchema.validate(req.body);
    if (validationError) {
      return res.json(error(validationError.details[0].message, 400));
    }

    db.prepare(`
      UPDATE disputes SET
        description = description || '\n\n--- 申辩内容 ---\n' || ?,
        evidence = COALESCE(evidence, '[]') || ?,
        status = 'processing',
        updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      value.content,
      value.evidence ? JSON.stringify(value.evidence) : '[]',
      disputeId
    );

    logAudit(userId, 'dispute', 'defense', {
      targetId: disputeId,
      targetType: 'dispute',
      details: { taskId: dispute.taskId },
      ip: req.ip
    });

    const updatedDispute = db.prepare('SELECT * FROM disputes WHERE id = ?').get(disputeId);

    res.json(success(updatedDispute, '申辩提交成功'));
  } catch (err: any) {
    res.json(error(err.message || '提交申辩失败', 500));
  }
});

router.post('/:id/arbitrate', auth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const disputeId = Number(req.params.id);
    const arbitratorId = req.user!.id;

    const dispute = db.prepare('SELECT * FROM disputes WHERE id = ?').get(disputeId) as any;
    if (!dispute) {
      return res.json(error('争议不存在', 404));
    }

    if (dispute.status !== 'processing') {
      return res.json(error('当前争议状态不允许仲裁', 400));
    }

    const { error: validationError, value } = arbitrationSchema.validate(req.body);
    if (validationError) {
      return res.json(error(validationError.details[0].message, 400));
    }

    const updateDisputeStmt = db.prepare(`
      UPDATE disputes SET
        status = 'resolved',
        arbitratorId = ?,
        arbitrationResult = ?,
        resolvedAt = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    const updateTaskStmt = db.prepare(`
      UPDATE tasks SET status = 'completed', updatedAt = CURRENT_TIMESTAMP WHERE id = ?
    `);

    const transaction = db.transaction(() => {
      updateDisputeStmt.run(arbitratorId, JSON.stringify(value), disputeId);
      updateTaskStmt.run(dispute.taskId);
    });

    transaction();

    logAudit(arbitratorId, 'dispute', 'arbitrate', {
      targetId: disputeId,
      targetType: 'dispute',
      details: { taskId: dispute.taskId, winner: value.winner, result: value.result },
      ip: req.ip,
      riskLevel: 'high'
    });

    res.json(success({ winner: value.winner, result: value.result }, '仲裁处理完成'));
  } catch (err: any) {
    res.json(error(err.message || '仲裁处理失败', 500));
  }
});

router.post('/:id/execute', auth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const disputeId = Number(req.params.id);
    const userId = req.user!.id;
    const { amount } = req.body;

    const dispute = db.prepare('SELECT * FROM disputes WHERE id = ?').get(disputeId) as any;
    if (!dispute) {
      return res.json(error('争议不存在', 404));
    }

    if (dispute.status !== 'resolved') {
      return res.json(error('只有已裁决的争议才能执行', 400));
    }

    const arbitrationResult = JSON.parse(dispute.arbitrationResult || '{}');

    if (arbitrationResult.winner === 'complainant' && amount > 0) {
      const { generateTransactionNo } = require('../utils/common');
      const transactionNo = generateTransactionNo();

      db.prepare(`
        INSERT INTO payments (transactionNo, taskId, payerId, payeeId, amount, type, status, remark)
        VALUES (?, ?, ?, ?, ?, 'refund', 'completed', '争议裁决执行退款')
      `).run(transactionNo, dispute.taskId, dispute.respondentId, dispute.complainantId, amount);
    }

    db.prepare("UPDATE disputes SET status = 'closed', updatedAt = CURRENT_TIMESTAMP WHERE id = ?").run(disputeId);

    logAudit(userId, 'dispute', 'execute', {
      targetId: disputeId,
      targetType: 'dispute',
      details: { taskId: dispute.taskId, amount, winner: arbitrationResult.winner },
      ip: req.ip,
      riskLevel: 'high'
    });

    res.json(success(null, '裁决已执行'));
  } catch (err: any) {
    res.json(error(err.message || '执行裁决失败', 500));
  }
});

export default router;
