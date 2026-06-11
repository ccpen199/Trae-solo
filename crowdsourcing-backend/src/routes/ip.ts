import { Router, Request, Response } from 'express';
import Joi from 'joi';
import db from '../database';
import { success, error, getPagination, getPagedResult, logAudit, generateEvidenceHash } from '../utils/common';
import { auth, requireProvider } from '../middleware/auth';

const router = Router();

const depositSchema = Joi.object({
  submissionId: Joi.number().integer().positive().optional(),
  taskId: Joi.number().integer().positive().optional(),
  title: Joi.string().min(5).max(200).required(),
  description: Joi.string().max(2000).optional(),
  evidence: Joi.array().items(Joi.string()).optional(),
  type: Joi.string().valid('submission', 'copyright', 'trademark', 'patent').required()
});

const copyrightSchema = Joi.object({
  submissionId: Joi.number().integer().positive().required(),
  title: Joi.string().min(5).max(200).required(),
  description: Joi.string().max(2000).optional(),
  workType: Joi.string().required(),
  creationDate: Joi.string().isoDate().required()
});

router.post('/deposit', auth, requireProvider, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    const { error: validationError, value } = depositSchema.validate(req.body);
    if (validationError) {
      return res.json(error(validationError.details[0].message, 400));
    }

    const provider = db.prepare('SELECT * FROM providers WHERE userId = ?').get(userId) as any;
    if (!provider) {
      return res.json(error('服务商信息不存在', 404));
    }

    const hash = generateEvidenceHash({
      title: value.title,
      description: value.description,
      evidence: value.evidence,
      timestamp: Date.now(),
      providerId: provider.id
    });

    const result = db.prepare(`
      INSERT INTO ip_certificates (submissionId, taskId, providerId, hash, type, title, description, evidence)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      value.submissionId || null,
      value.taskId || null,
      provider.id,
      hash,
      value.type,
      value.title,
      value.description || null,
      value.evidence ? JSON.stringify(value.evidence) : null
    );

    const certId = result.lastInsertRowid as number;

    logAudit(userId, 'ip', 'deposit', {
      targetId: certId,
      targetType: 'ip_certificate',
      details: { type: value.type, title: value.title, hash },
      ip: req.ip,
      riskLevel: 'medium'
    });

    const cert = db.prepare('SELECT * FROM ip_certificates WHERE id = ?').get(certId) as Record<string, any>;

    res.json(success({ ...cert, hash }, '存证提交成功，证据哈希已生成'));
  } catch (err: any) {
    res.json(error(err.message || '存证提交失败', 500));
  }
});

router.get('/', auth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    const { page, pageSize, offset, limit } = getPagination(
      Number(req.query.page),
      Number(req.query.pageSize)
    );

    const type = req.query.type;
    const status = req.query.status;
    const taskId = req.query.taskId;

    const provider = db.prepare('SELECT id FROM providers WHERE userId = ?').get(userId) as any;

    const whereConditions: string[] = [];
    const params: any[] = [];

    if (provider && req.user!.userType === 'provider') {
      whereConditions.push('ip.providerId = ?');
      params.push(provider.id);
    }

    if (type) {
      whereConditions.push('ip.type = ?');
      params.push(type);
    }
    if (status) {
      whereConditions.push('ip.status = ?');
      params.push(status);
    }
    if (taskId) {
      whereConditions.push('ip.taskId = ?');
      params.push(Number(taskId));
    }

    const whereSql = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const countResult = db.prepare(`
      SELECT COUNT(*) as total FROM ip_certificates ip ${whereSql}
    `).get(...params) as { total: number };

    const certificates = db.prepare(`
      SELECT ip.*,
             t.title as taskTitle,
             p.userId as providerUserId, u.name as providerName
      FROM ip_certificates ip
      LEFT JOIN tasks t ON ip.taskId = t.id
      LEFT JOIN providers p ON ip.providerId = p.id
      LEFT JOIN users u ON p.userId = u.id
      ${whereSql}
      ORDER BY ip.createdAt DESC
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset);

    res.json(success(getPagedResult(certificates, countResult.total, page, pageSize), '获取存证列表成功'));
  } catch (err: any) {
    res.json(error(err.message || '获取存证列表失败', 500));
  }
});

router.get('/:id', auth, async (req: Request, res: Response) => {
  try {
    const certId = Number(req.params.id);

    const cert = db.prepare(`
      SELECT ip.*,
             t.title as taskTitle, t.requestNo as taskRequestNo,
             s.title as submissionTitle, s.version as submissionVersion, s.hash as submissionHash,
             p.userId as providerUserId, u.name as providerName, u.avatar as providerAvatar
      FROM ip_certificates ip
      LEFT JOIN tasks t ON ip.taskId = t.id
      LEFT JOIN submissions s ON ip.submissionId = s.id
      LEFT JOIN providers p ON ip.providerId = p.id
      LEFT JOIN users u ON p.userId = u.id
      WHERE ip.id = ?
    `).get(certId) as any;

    if (!cert) {
      return res.json(error('存证不存在', 404));
    }

    if (cert.evidence) {
      try {
        cert.evidence = JSON.parse(cert.evidence);
      } catch {
        cert.evidence = [];
      }
    }

    res.json(success(cert, '获取存证详情成功'));
  } catch (err: any) {
    res.json(error(err.message || '获取存证详情失败', 500));
  }
});

router.post('/copyright', auth, requireProvider, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    const { error: validationError, value } = copyrightSchema.validate(req.body);
    if (validationError) {
      return res.json(error(validationError.details[0].message, 400));
    }

    const provider = db.prepare('SELECT * FROM providers WHERE userId = ?').get(userId) as any;
    if (!provider) {
      return res.json(error('服务商信息不存在', 404));
    }

    const submission = db.prepare('SELECT * FROM submissions WHERE id = ?').get(value.submissionId) as any;
    if (!submission) {
      return res.json(error('稿件不存在', 404));
    }

    if (submission.providerId !== provider.id) {
      return res.json(error('您不是此稿件的创作者', 403));
    }

    const hash = generateEvidenceHash({
      submissionId: value.submissionId,
      workType: value.workType,
      creationDate: value.creationDate,
      title: value.title,
      timestamp: Date.now()
    });

    const registrationNo = `CR${Date.now()}${Math.floor(1000 + Math.random() * 9000)}`;

    const result = db.prepare(`
      INSERT INTO ip_certificates (submissionId, taskId, providerId, hash, type, title, description, registrationNo, status)
      VALUES (?, ?, ?, ?, 'copyright', ?, ?, ?, 'registered')
    `).run(
      value.submissionId,
      submission.taskId,
      provider.id,
      hash,
      value.title,
      value.description || null,
      registrationNo
    );

    const certId = result.lastInsertRowid as number;

    logAudit(userId, 'ip', 'copyright_register', {
      targetId: certId,
      targetType: 'ip_certificate',
      details: { submissionId: value.submissionId, workType: value.workType, registrationNo, hash },
      ip: req.ip,
      riskLevel: 'high'
    });

    const cert = db.prepare('SELECT * FROM ip_certificates WHERE id = ?').get(certId) as Record<string, any>;

    res.json(success({ ...cert, hash, registrationNo }, '版权登记申请已提交'));
  } catch (err: any) {
    res.json(error(err.message || '版权登记申请失败', 500));
  }
});

router.get('/verify/:hash', async (req: Request, res: Response) => {
  try {
    const hash = req.params.hash;

    const cert = db.prepare(`
      SELECT ip.*,
             t.title as taskTitle,
             u.name as providerName
      FROM ip_certificates ip
      LEFT JOIN providers p ON ip.providerId = p.id
      LEFT JOIN users u ON p.userId = u.id
      LEFT JOIN tasks t ON ip.taskId = t.id
      WHERE ip.hash = ?
    `).get(hash) as any;

    if (!cert) {
      return res.json(error('未找到对应存证记录', 404));
    }

    res.json(success({
      verified: true,
      certificate: cert,
      verifiedAt: new Date().toISOString()
    }, '存证验证成功'));
  } catch (err: any) {
    res.json(error(err.message || '存证验证失败', 500));
  }
});

export default router;
