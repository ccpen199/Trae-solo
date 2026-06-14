import { Router, Request, Response } from 'express';
import Joi from 'joi';
import db from '../database';
import { success, error, getPagination, getPagedResult, logAudit, parseJsonField, stringifyJsonField, normalizeProvider } from '../utils/common';
import { auth, requireProvider, requireAdmin } from '../middleware/auth';

const router = Router();

const updateProviderSchema = Joi.object({
  categoryId: Joi.number().integer().positive().optional(),
  bio: Joi.string().max(1000).optional(),
  skills: Joi.array().items(Joi.string()).optional(),
  location: Joi.string().max(100).optional()
});

const verifySchema = Joi.object({
  type: Joi.string().required(),
  title: Joi.string().required(),
  fileUrl: Joi.string().required()
});

router.get('/', auth, async (req: Request, res: Response) => {
  try {
    const { page, pageSize, offset, limit } = getPagination(
      Number(req.query.page),
      Number(req.query.pageSize)
    );

    const categoryId = req.query.categoryId;
    const skill = req.query.skill;
    const minRating = req.query.minRating;
    const minLevel = req.query.minLevel;
    const keyword = req.query.keyword;
    const location = req.query.location;

    const whereConditions: string[] = [];
    const params: any[] = [];

    whereConditions.push("p.verificationStatus = 'verified'");

    if (categoryId) {
      whereConditions.push('p.categoryId = ?');
      params.push(Number(categoryId));
    }
    if (skill) {
      whereConditions.push('p.skills LIKE ?');
      params.push(`%${skill}%`);
    }
    if (minRating) {
      whereConditions.push('p.rating >= ?');
      params.push(Number(minRating));
    }
    if (minLevel) {
      whereConditions.push('p.level >= ?');
      params.push(Number(minLevel));
    }
    if (keyword) {
      whereConditions.push('u.name LIKE ?');
      params.push(`%${keyword}%`);
    }
    if (location) {
      whereConditions.push('p.location LIKE ?');
      params.push(`%${location}%`);
    }

    const whereSql = `WHERE ${whereConditions.join(' AND ')}`;

    const countResult = db.prepare(`
      SELECT COUNT(*) as total FROM providers p
      LEFT JOIN users u ON p.userId = u.id
      ${whereSql}
    `).get(...params) as { total: number };

    const providers = db.prepare(`
      SELECT p.*, u.name, u.email, u.avatar, c.name as categoryName
      FROM providers p
      LEFT JOIN users u ON p.userId = u.id
      LEFT JOIN categories c ON p.categoryId = c.id
      ${whereSql}
      ORDER BY p.rating DESC, p.level DESC, p.completedTasks DESC
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset) as any[];

    const result = providers.map(normalizeProvider);

    res.json(success(getPagedResult(result, countResult.total, page, pageSize), '获取服务商列表成功'));
  } catch (err: any) {
    res.json(error(err.message || '获取服务商列表失败', 500));
  }
});

router.get('/me', auth, requireProvider, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    const provider = db.prepare(`
      SELECT p.*, u.name, u.email, u.avatar, u.phone, u.realNameVerified,
             c.name as categoryName
      FROM providers p
      LEFT JOIN users u ON p.userId = u.id
      LEFT JOIN categories c ON p.categoryId = c.id
      WHERE p.userId = ?
    `).get(userId) as any;

    if (!provider) {
      return res.json(error('服务商信息不存在', 404));
    }

    res.json(success(normalizeProvider(provider), '获取服务商信息成功'));
  } catch (err: any) {
    res.json(error(err.message || '获取服务商信息失败', 500));
  }
});

router.get('/:id', auth, async (req: Request, res: Response) => {
  try {
    const providerId = Number(req.params.id);

    const provider = db.prepare(`
      SELECT p.*, u.name, u.email, u.avatar, c.name as categoryName
      FROM providers p
      LEFT JOIN users u ON p.userId = u.id
      LEFT JOIN categories c ON p.categoryId = c.id
      WHERE p.id = ?
    `).get(providerId) as any;

    if (!provider) {
      return res.json(error('服务商不存在', 404));
    }

    const normalizedProvider = normalizeProvider(provider);

    const portfolio = db.prepare(`
      SELECT * FROM portfolio_items WHERE providerId = ? ORDER BY createdAt DESC LIMIT 6
    `).all(providerId) as any[];

    const portfolioResult = portfolio.map(item => ({
      ...item,
      images: parseJsonField(item.images, []),
      files: parseJsonField(item.files, []),
      tags: parseJsonField(item.tags, [])
    }));

    const ratings = db.prepare(`
      SELECT r.*, u.name as raterName, u.avatar as raterAvatar, t.title as taskTitle
      FROM ratings r
      LEFT JOIN users u ON r.raterId = u.id
      LEFT JOIN tasks t ON r.taskId = t.id
      WHERE r.rateeId = (SELECT userId FROM providers WHERE id = ?)
      ORDER BY r.createdAt DESC LIMIT 10
    `).all(providerId);

    res.json(success({
      ...normalizedProvider,
      portfolio: portfolioResult,
      recentRatings: ratings
    }, '获取服务商详情成功'));
  } catch (err: any) {
    res.json(error(err.message || '获取服务商详情失败', 500));
  }
});

router.put('/me', auth, requireProvider, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    const provider = db.prepare('SELECT * FROM providers WHERE userId = ?').get(userId) as any;
    if (!provider) {
      return res.json(error('服务商信息不存在', 404));
    }

    const { error: validationError, value } = updateProviderSchema.validate(req.body);
    if (validationError) {
      return res.json(error(validationError.details[0].message, 400));
    }

    const fields = [];
    const params = [];

    if (value.categoryId !== undefined) {
      fields.push('categoryId = ?');
      params.push(value.categoryId);
    }
    if (value.bio !== undefined) {
      fields.push('bio = ?');
      params.push(value.bio);
    }
    if (value.skills !== undefined) {
      fields.push('skills = ?');
      params.push(stringifyJsonField(value.skills));
    }
    if (value.location !== undefined) {
      fields.push('location = ?');
      params.push(value.location);
    }

    if (fields.length === 0) {
      return res.json(success(provider, '没有需要更新的内容'));
    }

    fields.push('updatedAt = CURRENT_TIMESTAMP');
    params.push(provider.id);

    db.prepare(`UPDATE providers SET ${fields.join(', ')} WHERE id = ?`).run(...params);

    logAudit(userId, 'provider', 'update', {
      targetId: provider.id,
      targetType: 'provider',
      details: value,
      ip: req.ip
    });

    const updatedProvider = db.prepare(`
      SELECT p.*, u.name, u.email, u.avatar
      FROM providers p
      LEFT JOIN users u ON p.userId = u.id
      WHERE p.id = ?
    `).get(provider.id) as any;
    res.json(success(normalizeProvider(updatedProvider), '更新服务商信息成功'));
  } catch (err: any) {
    res.json(error(err.message || '更新服务商信息失败', 500));
  }
});

router.post('/verify', auth, requireProvider, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    const provider = db.prepare('SELECT * FROM providers WHERE userId = ?').get(userId) as any;
    if (!provider) {
      return res.json(error('服务商信息不存在', 404));
    }

    const { error: validationError, value } = verifySchema.validate(req.body);
    if (validationError) {
      return res.json(error(validationError.details[0].message, 400));
    }

    const result = db.prepare(`
      INSERT INTO verification_docs (providerId, type, title, fileUrl)
      VALUES (?, ?, ?, ?)
    `).run(provider.id, value.type, value.title, value.fileUrl);

    const docId = result.lastInsertRowid as number;

    logAudit(userId, 'provider', 'submit_verification', {
      targetId: docId,
      targetType: 'verification_doc',
      details: { type: value.type, title: value.title },
      ip: req.ip,
      riskLevel: 'medium'
    });

    const doc = db.prepare('SELECT * FROM verification_docs WHERE id = ?').get(docId);

    res.json(success(doc, '资质认证提交成功'));
  } catch (err: any) {
    res.json(error(err.message || '资质认证提交失败', 500));
  }
});

router.get('/:id/level', auth, async (req: Request, res: Response) => {
  try {
    const providerId = Number(req.params.id);

    const provider = db.prepare('SELECT level, rating, completedTasks, totalEarnings FROM providers WHERE id = ?').get(providerId) as any;
    if (!provider) {
      return res.json(error('服务商不存在', 404));
    }

    const levelInfo = {
      currentLevel: provider.level,
      nextLevel: provider.level + 1,
      currentRating: provider.rating,
      requiredRating: 4.5,
      completedTasks: provider.completedTasks,
      requiredTasks: provider.level * 5,
      totalEarnings: provider.totalEarnings,
      requiredEarnings: provider.level * 10000,
      progress: {
        tasks: Math.min(100, Math.round((provider.completedTasks / (provider.level * 5)) * 100)),
        rating: Math.min(100, Math.round((provider.rating / 4.5) * 100)),
        earnings: Math.min(100, Math.round((provider.totalEarnings / (provider.level * 10000)) * 100))
      }
    };

    res.json(success(levelInfo, '获取等级信息成功'));
  } catch (err: any) {
    res.json(error(err.message || '获取等级信息失败', 500));
  }
});

router.post('/:id/verify/process', auth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const docId = Number(req.params.id);
    const userId = req.user!.id;

    const { status, remark } = req.body;

    if (!['verified', 'rejected'].includes(status)) {
      return res.json(error('无效的状态值', 400));
    }

    const doc = db.prepare('SELECT * FROM verification_docs WHERE id = ?').get(docId) as any;
    if (!doc) {
      return res.json(error('认证文档不存在', 404));
    }

    db.prepare(`
      UPDATE verification_docs SET
        status = ?,
        remark = ?,
        verifiedBy = ?,
        verifiedAt = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(status, remark || null, userId, docId);

    if (status === 'verified') {
      const pendingDocs = db.prepare(`
        SELECT COUNT(*) as count FROM verification_docs
        WHERE providerId = ? AND status = 'pending'
      `).get(doc.providerId) as { count: number };

      if (pendingDocs.count === 0) {
        db.prepare("UPDATE providers SET verificationStatus = 'verified', updatedAt = CURRENT_TIMESTAMP WHERE id = ?").run(doc.providerId);
      }
    }

    logAudit(userId, 'provider', 'process_verification', {
      targetId: docId,
      targetType: 'verification_doc',
      details: { providerId: doc.providerId, status, remark },
      ip: req.ip,
      riskLevel: 'high'
    });

    res.json(success(null, `资质认证已${status === 'verified' ? '通过' : '拒绝'}`));
  } catch (err: any) {
    res.json(error(err.message || '处理资质认证失败', 500));
  }
});

export default router;
