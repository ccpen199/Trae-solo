import { Router, Request, Response } from 'express';
import Joi from 'joi';
import db from '../database';
import { success, error, getPagination, getPagedResult, logAudit, generateEvidenceHash, parseJsonField, stringifyJsonField } from '../utils/common';
import { auth, requireProvider } from '../middleware/auth';

const router = Router({ mergeParams: true });

const createSubmissionSchema = Joi.object({
  title: Joi.string().min(5).max(200).required(),
  description: Joi.string().optional(),
  files: Joi.array().items(Joi.string()).optional()
});

router.get('/', auth, async (req: Request, res: Response) => {
  try {
    const taskId = req.params.taskId ? Number(req.params.taskId) : null;
    const { page, pageSize, offset, limit } = getPagination(
      Number(req.query.page),
      Number(req.query.pageSize)
    );

    const whereConditions: string[] = [];
    const params: any[] = [];

    if (taskId) {
      whereConditions.push('s.taskId = ?');
      params.push(taskId);
    }

    const whereSql = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const countResult = db.prepare(`
      SELECT COUNT(*) as total FROM submissions s ${whereSql}
    `).get(...params) as { total: number };

    const submissions = db.prepare(`
      SELECT s.*, t.title as taskTitle,
             p.userId as providerUserId, u.name as providerName, u.avatar as providerAvatar
      FROM submissions s
      LEFT JOIN tasks t ON s.taskId = t.id
      LEFT JOIN providers p ON s.providerId = p.id
      LEFT JOIN users u ON p.userId = u.id
      ${whereSql}
      ORDER BY s.version DESC, s.createdAt DESC
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset) as any[];

    const result = submissions.map(sub => ({
      ...sub,
      files: parseJsonField(sub.files, [])
    }));

    res.json(success(getPagedResult(result, countResult.total, page, pageSize), '获取稿件列表成功'));
  } catch (err: any) {
    res.json(error(err.message || '获取稿件列表失败', 500));
  }
});

router.get('/:submissionId', auth, async (req: Request, res: Response) => {
  try {
    const submissionId = Number(req.params.submissionId);

    const submission = db.prepare(`
      SELECT s.*, t.title as taskTitle, t.description as taskDescription,
             p.userId as providerUserId, u.name as providerName, u.avatar as providerAvatar
      FROM submissions s
      LEFT JOIN tasks t ON s.taskId = t.id
      LEFT JOIN providers p ON s.providerId = p.id
      LEFT JOIN users u ON p.userId = u.id
      WHERE s.id = ?
    `).get(submissionId) as any;

    if (!submission) {
      return res.json(error('稿件不存在', 404));
    }

    submission.files = parseJsonField(submission.files, []);

    res.json(success(submission, '获取稿件详情成功'));
  } catch (err: any) {
    res.json(error(err.message || '获取稿件详情失败', 500));
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

    if (task.status !== 'in_progress' && task.status !== 'revision') {
      return res.json(error('当前任务状态不允许提交稿件', 400));
    }

    const provider = db.prepare('SELECT * FROM providers WHERE userId = ?').get(userId) as any;
    if (!provider) {
      return res.json(error('服务商信息不存在', 404));
    }

    if (task.providerId !== provider.id) {
      return res.json(error('您不是此任务的承接服务商', 403));
    }

    const { error: validationError, value } = createSubmissionSchema.validate(req.body);
    if (validationError) {
      return res.json(error(validationError.details[0].message, 400));
    }

    const lastSubmission = db.prepare(`
      SELECT MAX(version) as maxVersion FROM submissions WHERE taskId = ?
    `).get(taskId) as { maxVersion: number };

    const version = (lastSubmission.maxVersion || 0) + 1;

    const hash = generateEvidenceHash({
      taskId,
      providerId: provider.id,
      title: value.title,
      description: value.description,
      files: value.files || [],
      version,
      timestamp: Date.now()
    });

    const result = db.prepare(`
      INSERT INTO submissions (taskId, providerId, version, title, description, files, hash)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      taskId,
      provider.id,
      version,
      value.title,
      value.description || null,
      stringifyJsonField(value.files || []),
      hash
    );

    const submissionId = result.lastInsertRowid as number;

    db.prepare(`
      INSERT INTO ip_certificates (submissionId, taskId, providerId, hash, type, title, description)
      VALUES (?, ?, ?, ?, 'submission', ?, ?)
    `).run(
      submissionId,
      taskId,
      provider.id,
      hash,
      value.title,
      value.description || null
    );

    db.prepare("UPDATE tasks SET status = 'reviewing', updatedAt = CURRENT_TIMESTAMP WHERE id = ?").run(taskId);

    logAudit(userId, 'submission', 'create', {
      targetId: submissionId,
      targetType: 'submission',
      details: { taskId, version, hash },
      ip: req.ip,
      riskLevel: 'medium'
    });

    const submission = db.prepare('SELECT * FROM submissions WHERE id = ?').get(submissionId) as any;
    submission.files = parseJsonField(submission.files, []);

    res.json(success(submission, '稿件提交成功，已自动进行知识产权存证'));
  } catch (err: any) {
    res.json(error(err.message || '稿件提交失败', 500));
  }
});

export default router;
