import { Router, Request, Response } from 'express';
import Joi from 'joi';
import db from '../database';
import { success, error, getPagination, getPagedResult, logAudit, parseJsonField, stringifyJsonField } from '../utils/common';
import { auth, requireProvider } from '../middleware/auth';

const router = Router();

const createPortfolioSchema = Joi.object({
  title: Joi.string().min(5).max(200).required(),
  description: Joi.string().max(2000).optional(),
  categoryId: Joi.number().integer().positive().optional(),
  images: Joi.array().items(Joi.string()).optional(),
  files: Joi.array().items(Joi.string()).optional(),
  tags: Joi.array().items(Joi.string()).optional()
});

const updatePortfolioSchema = Joi.object({
  title: Joi.string().min(5).max(200).optional(),
  description: Joi.string().max(2000).optional(),
  categoryId: Joi.number().integer().positive().optional(),
  images: Joi.array().items(Joi.string()).optional(),
  files: Joi.array().items(Joi.string()).optional(),
  tags: Joi.array().items(Joi.string()).optional()
});

router.get('/', auth, async (req: Request, res: Response) => {
  try {
    const { page, pageSize, offset, limit } = getPagination(
      Number(req.query.page),
      Number(req.query.pageSize)
    );

    const providerId = req.query.providerId;
    const categoryId = req.query.categoryId;
    const tag = req.query.tag;

    const whereConditions: string[] = [];
    const params: any[] = [];

    if (providerId) {
      whereConditions.push('pi.providerId = ?');
      params.push(Number(providerId));
    }
    if (categoryId) {
      whereConditions.push('pi.categoryId = ?');
      params.push(Number(categoryId));
    }
    if (tag) {
      whereConditions.push('pi.tags LIKE ?');
      params.push(`%${tag}%`);
    }

    const whereSql = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const countResult = db.prepare(`
      SELECT COUNT(*) as total FROM portfolio_items pi ${whereSql}
    `).get(...params) as { total: number };

    const items = db.prepare(`
      SELECT pi.*, c.name as categoryName,
             p.userId as providerUserId, u.name as providerName, u.avatar as providerAvatar
      FROM portfolio_items pi
      LEFT JOIN categories c ON pi.categoryId = c.id
      LEFT JOIN providers p ON pi.providerId = p.id
      LEFT JOIN users u ON p.userId = u.id
      ${whereSql}
      ORDER BY pi.createdAt DESC
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset) as any[];

    const result = items.map(item => ({
      ...item,
      images: parseJsonField(item.images, []),
      files: parseJsonField(item.files, []),
      tags: parseJsonField(item.tags, [])
    }));

    res.json(success(getPagedResult(result, countResult.total, page, pageSize), '获取作品集列表成功'));
  } catch (err: any) {
    res.json(error(err.message || '获取作品集列表失败', 500));
  }
});

router.get('/:id', auth, async (req: Request, res: Response) => {
  try {
    const itemId = Number(req.params.id);

    const item = db.prepare(`
      SELECT pi.*, c.name as categoryName,
             p.userId as providerUserId, u.name as providerName, u.avatar as providerAvatar
      FROM portfolio_items pi
      LEFT JOIN categories c ON pi.categoryId = c.id
      LEFT JOIN providers p ON pi.providerId = p.id
      LEFT JOIN users u ON p.userId = u.id
      WHERE pi.id = ?
    `).get(itemId) as any;

    if (!item) {
      return res.json(error('作品不存在', 404));
    }

    item.images = parseJsonField(item.images, []);
    item.files = parseJsonField(item.files, []);
    item.tags = parseJsonField(item.tags, []);

    res.json(success(item, '获取作品详情成功'));
  } catch (err: any) {
    res.json(error(err.message || '获取作品详情失败', 500));
  }
});

router.post('/', auth, requireProvider, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    const provider = db.prepare('SELECT * FROM providers WHERE userId = ?').get(userId) as any;
    if (!provider) {
      return res.json(error('服务商信息不存在', 404));
    }

    const { error: validationError, value } = createPortfolioSchema.validate(req.body);
    if (validationError) {
      return res.json(error(validationError.details[0].message, 400));
    }

    const result = db.prepare(`
      INSERT INTO portfolio_items (providerId, title, description, categoryId, images, files, tags)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      provider.id,
      value.title,
      value.description || null,
      value.categoryId || null,
      stringifyJsonField(value.images || []),
      stringifyJsonField(value.files || []),
      stringifyJsonField(value.tags || [])
    );

    const itemId = result.lastInsertRowid as number;

    logAudit(userId, 'portfolio', 'create', {
      targetId: itemId,
      targetType: 'portfolio_item',
      details: { title: value.title, categoryId: value.categoryId },
      ip: req.ip
    });

    const item = db.prepare('SELECT * FROM portfolio_items WHERE id = ?').get(itemId) as any;
    item.images = parseJsonField(item.images, []);
    item.files = parseJsonField(item.files, []);
    item.tags = parseJsonField(item.tags, []);

    res.json(success(item, '创建作品成功'));
  } catch (err: any) {
    res.json(error(err.message || '创建作品失败', 500));
  }
});

router.put('/:id', auth, requireProvider, async (req: Request, res: Response) => {
  try {
    const itemId = Number(req.params.id);
    const userId = req.user!.id;

    const provider = db.prepare('SELECT * FROM providers WHERE userId = ?').get(userId) as any;
    if (!provider) {
      return res.json(error('服务商信息不存在', 404));
    }

    const item = db.prepare('SELECT * FROM portfolio_items WHERE id = ?').get(itemId) as any;
    if (!item) {
      return res.json(error('作品不存在', 404));
    }

    if (item.providerId !== provider.id && req.user!.userType !== 'admin') {
      return res.json(error('无权修改此作品', 403));
    }

    const { error: validationError, value } = updatePortfolioSchema.validate(req.body);
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
    if (value.images !== undefined) {
      fields.push('images = ?');
      params.push(stringifyJsonField(value.images));
    }
    if (value.files !== undefined) {
      fields.push('files = ?');
      params.push(stringifyJsonField(value.files));
    }
    if (value.tags !== undefined) {
      fields.push('tags = ?');
      params.push(stringifyJsonField(value.tags));
    }

    if (fields.length === 0) {
      return res.json(success(item, '没有需要更新的内容'));
    }

    fields.push('updatedAt = CURRENT_TIMESTAMP');
    params.push(itemId);

    db.prepare(`UPDATE portfolio_items SET ${fields.join(', ')} WHERE id = ?`).run(...params);

    logAudit(userId, 'portfolio', 'update', {
      targetId: itemId,
      targetType: 'portfolio_item',
      details: value,
      ip: req.ip
    });

    const updatedItem = db.prepare('SELECT * FROM portfolio_items WHERE id = ?').get(itemId) as any;
    updatedItem.images = parseJsonField(updatedItem.images, []);
    updatedItem.files = parseJsonField(updatedItem.files, []);
    updatedItem.tags = parseJsonField(updatedItem.tags, []);

    res.json(success(updatedItem, '更新作品成功'));
  } catch (err: any) {
    res.json(error(err.message || '更新作品失败', 500));
  }
});

router.delete('/:id', auth, requireProvider, async (req: Request, res: Response) => {
  try {
    const itemId = Number(req.params.id);
    const userId = req.user!.id;

    const provider = db.prepare('SELECT * FROM providers WHERE userId = ?').get(userId) as any;
    if (!provider) {
      return res.json(error('服务商信息不存在', 404));
    }

    const item = db.prepare('SELECT * FROM portfolio_items WHERE id = ?').get(itemId) as any;
    if (!item) {
      return res.json(error('作品不存在', 404));
    }

    if (item.providerId !== provider.id && req.user!.userType !== 'admin') {
      return res.json(error('无权删除此作品', 403));
    }

    db.prepare('DELETE FROM portfolio_items WHERE id = ?').run(itemId);

    logAudit(userId, 'portfolio', 'delete', {
      targetId: itemId,
      targetType: 'portfolio_item',
      details: { title: item.title },
      ip: req.ip,
      riskLevel: 'medium'
    });

    res.json(success(null, '删除作品成功'));
  } catch (err: any) {
    res.json(error(err.message || '删除作品失败', 500));
  }
});

export default router;
