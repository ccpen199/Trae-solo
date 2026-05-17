import { Request, Response } from 'express';
import Joi from 'joi';
import db from '../database';
import logger from '../utils/logger';

const createMomentSchema = Joi.object({
  content: Joi.string().max(1000),
  media_ids: Joi.array().items(Joi.number()),
  visibility: Joi.string().valid('family', 'public', 'private').default('family')
});

const addCommentSchema = Joi.object({
  content: Joi.string().required().max(500),
  reply_to: Joi.number()
});

export async function getMoments(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;
    const { page = 1, limit = 20, visibility } = req.query;

    let query = `
      SELECT m.*, u.nickname, u.avatar,
             (SELECT COUNT(*) FROM moment_likes ml WHERE ml.moment_id = m.id) as like_count,
             (SELECT COUNT(*) FROM comments c WHERE c.moment_id = m.id) as comment_count,
             EXISTS(SELECT 1 FROM moment_likes ml WHERE ml.moment_id = m.id AND ml.user_id = ?) as is_liked
      FROM moments m
      JOIN users u ON m.user_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [userId];

    if (visibility) {
      query += ' AND m.visibility = ?';
      params.push(visibility);
    } else {
      query += ' AND (m.visibility = "public" OR m.visibility = "family" OR m.user_id = ?)';
      params.push(userId);
    }

    query += ' ORDER BY m.created_at DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), (Number(page) - 1) * Number(limit));

    const moments = db.prepare(query).all(...params);

    const countQuery = 'SELECT COUNT(*) as total FROM moments WHERE visibility IN ("public", "family") OR user_id = ?';
    const { total } = db.prepare(countQuery).get(userId) as any;

    res.json({
      success: true,
      data: {
        list: moments,
        total,
        page: Number(page),
        limit: Number(limit)
      }
    });
  } catch (error) {
    logger.error('获取动态列表错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
}

export async function createMoment(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;
    const { error, value } = createMomentSchema.validate(req.body);

    if (error) {
      res.status(400).json({ success: false, message: error.details[0].message });
      return;
    }

    const { content, media_ids, visibility } = value;
    const mediaIdsJson = media_ids ? JSON.stringify(media_ids) : null;

    const result = db.prepare(`
      INSERT INTO moments (user_id, content, media_ids, visibility)
      VALUES (?, ?, ?, ?)
    `).run(userId, content || '', mediaIdsJson, visibility);

    res.json({
      success: true,
      message: '发布成功',
      data: { id: result.lastInsertRowid }
    });
  } catch (error) {
    logger.error('创建动态错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
}

export async function getMomentDetail(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const userId = (req as any).userId;

    const moment = db.prepare(`
      SELECT m.*, u.nickname, u.avatar,
             (SELECT COUNT(*) FROM moment_likes ml WHERE ml.moment_id = m.id) as like_count,
             (SELECT COUNT(*) FROM comments c WHERE c.moment_id = m.id) as comment_count,
             EXISTS(SELECT 1 FROM moment_likes ml WHERE ml.moment_id = m.id AND ml.user_id = ?) as is_liked
      FROM moments m
      JOIN users u ON m.user_id = u.id
      WHERE m.id = ?
    `).get(userId, id);

    if (!moment) {
      res.status(404).json({ success: false, message: '动态不存在' });
      return;
    }

    res.json({
      success: true,
      data: moment
    });
  } catch (error) {
    logger.error('获取动态详情错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
}

export async function deleteMoment(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const userId = (req as any).userId;

    const moment = db.prepare('SELECT * FROM moments WHERE id = ? AND user_id = ?').get(id, userId);
    if (!moment) {
      res.status(404).json({ success: false, message: '动态不存在' });
      return;
    }

    db.prepare('DELETE FROM moments WHERE id = ?').run(id);

    res.json({
      success: true,
      message: '删除成功'
    });
  } catch (error) {
    logger.error('删除动态错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
}

export async function likeMoment(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const userId = (req as any).userId;

    const moment = db.prepare('SELECT * FROM moments WHERE id = ?').get(id);
    if (!moment) {
      res.status(404).json({ success: false, message: '动态不存在' });
      return;
    }

    const existing = db.prepare('SELECT * FROM moment_likes WHERE moment_id = ? AND user_id = ?').get(id, userId);
    
    if (existing) {
      db.prepare('DELETE FROM moment_likes WHERE moment_id = ? AND user_id = ?').run(id, userId);
      res.json({ success: true, message: '取消点赞', data: { is_liked: false } });
    } else {
      db.prepare('INSERT INTO moment_likes (moment_id, user_id) VALUES (?, ?)').run(id, userId);
      res.json({ success: true, message: '点赞成功', data: { is_liked: true } });
    }
  } catch (error) {
    logger.error('点赞动态错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
}

export async function getComments(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const comments = db.prepare(`
      SELECT c.*, u.nickname, u.avatar
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.moment_id = ?
      ORDER BY c.created_at ASC
    `).all(id);

    res.json({
      success: true,
      data: comments
    });
  } catch (error) {
    logger.error('获取评论列表错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
}

export async function addComment(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const userId = (req as any).userId;
    const { error, value } = addCommentSchema.validate(req.body);

    if (error) {
      res.status(400).json({ success: false, message: error.details[0].message });
      return;
    }

    const moment = db.prepare('SELECT * FROM moments WHERE id = ?').get(id);
    if (!moment) {
      res.status(404).json({ success: false, message: '动态不存在' });
      return;
    }

    const result = db.prepare(`
      INSERT INTO comments (moment_id, user_id, content, reply_to)
      VALUES (?, ?, ?, ?)
    `).run(id, userId, value.content, value.reply_to || null);

    res.json({
      success: true,
      message: '评论成功',
      data: { id: result.lastInsertRowid }
    });
  } catch (error) {
    logger.error('添加评论错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
}
