import { Request, Response } from 'express';
import Joi from 'joi';
import fs from 'fs';
import path from 'path';
import db from '../database';
import logger from '../utils/logger';

const updateMediaSchema = Joi.object({
  caption: Joi.string().max(500),
  taken_at: Joi.string().isoDate(),
  location: Joi.string().max(255),
  baby_id: Joi.number()
});

export async function getMediaList(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;
    const { babyId, type, page = 1, limit = 20 } = req.query;

    let query = `
      SELECT m.*, b.name as baby_name
      FROM media m
      LEFT JOIN babies b ON m.baby_id = b.id
      WHERE m.user_id = ?
    `;
    const params: any[] = [userId];

    if (babyId) {
      query += ' AND m.baby_id = ?';
      params.push(babyId);
    }

    if (type && ['photo', 'video'].includes(type as string)) {
      query += ' AND m.type = ?';
      params.push(type);
    }

    query += ' ORDER BY m.taken_at DESC, m.created_at DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), (Number(page) - 1) * Number(limit));

    const media = db.prepare(query).all(...params);

    const countQuery = `
      SELECT COUNT(*) as total
      FROM media
      WHERE user_id = ?
      ${babyId ? ' AND baby_id = ?' : ''}
      ${type ? ' AND type = ?' : ''}
    `;
    const countParams = [userId];
    if (babyId) countParams.push(babyId);
    if (type) countParams.push(type);
    
    const { total } = db.prepare(countQuery).get(...countParams) as any;

    res.json({
      success: true,
      data: {
        list: media,
        total,
        page: Number(page),
        limit: Number(limit)
      }
    });
  } catch (error) {
    logger.error('获取媒体列表错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
}

export async function uploadMedia(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;
    const { babyId, caption, takenAt, type } = req.body;

    if (!req.file) {
      res.status(400).json({ success: false, message: '请选择要上传的文件' });
      return;
    }

    if (!babyId) {
      fs.unlinkSync(req.file.path);
      res.status(400).json({ success: false, message: '请选择宝宝' });
      return;
    }

    const baby = db.prepare('SELECT id FROM babies WHERE id = ? AND user_id = ?').get(babyId, userId);
    if (!baby) {
      fs.unlinkSync(req.file.path);
      res.status(404).json({ success: false, message: '宝宝不存在' });
      return;
    }

    const filePath = `/uploads/${req.file.filename}`;
    const fileSize = req.file.size;

    const result = db.prepare(`
      INSERT INTO media (baby_id, user_id, type, file_path, file_size, caption, taken_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      babyId,
      userId,
      type || (req.file.mimetype.startsWith('video') ? 'video' : 'photo'),
      filePath,
      fileSize,
      caption || '',
      takenAt || new Date().toISOString()
    );

    db.prepare('UPDATE users SET storage_used = storage_used + ? WHERE id = ?').run(fileSize, userId);

    const media = db.prepare('SELECT * FROM media WHERE id = ?').get(result.lastInsertRowid);

    res.json({
      success: true,
      message: '上传成功',
      data: media
    });
  } catch (error) {
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (e) {}
    }
    logger.error('上传媒体错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
}

export async function getMediaDetail(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const userId = (req as any).userId;

    const media = db.prepare(`
      SELECT m.*, b.name as baby_name
      FROM media m
      LEFT JOIN babies b ON m.baby_id = b.id
      WHERE m.id = ? AND m.user_id = ?
    `).get(id, userId);

    if (!media) {
      res.status(404).json({ success: false, message: '媒体不存在' });
      return;
    }

    res.json({
      success: true,
      data: media
    });
  } catch (error) {
    logger.error('获取媒体详情错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
}

export async function updateMedia(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const userId = (req as any).userId;
    const { error, value } = updateMediaSchema.validate(req.body);

    if (error) {
      res.status(400).json({ success: false, message: error.details[0].message });
      return;
    }

    const media = db.prepare('SELECT * FROM media WHERE id = ? AND user_id = ?').get(id, userId);
    if (!media) {
      res.status(404).json({ success: false, message: '媒体不存在' });
      return;
    }

    const fields = Object.keys(value).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(value), id];

    if (fields) {
      db.prepare(`UPDATE media SET ${fields} WHERE id = ?`).run(...values);
    }

    res.json({
      success: true,
      message: '更新成功'
    });
  } catch (error) {
    logger.error('更新媒体错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
}

export async function deleteMedia(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const userId = (req as any).userId;

    const media = db.prepare('SELECT * FROM media WHERE id = ? AND user_id = ?').get(id, userId) as any;
    if (!media) {
      res.status(404).json({ success: false, message: '媒体不存在' });
      return;
    }

    const filePath = path.join(__dirname, '../../', media.file_path);
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (e) {}

    db.prepare('DELETE FROM media WHERE id = ?').run(id);
    db.prepare('UPDATE users SET storage_used = MAX(0, storage_used - ?) WHERE id = ?').run(media.file_size || 0, userId);

    res.json({
      success: true,
      message: '删除成功'
    });
  } catch (error) {
    logger.error('删除媒体错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
}

export async function toggleFavorite(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const userId = (req as any).userId;

    const media = db.prepare('SELECT * FROM media WHERE id = ? AND user_id = ?').get(id, userId) as any;
    if (!media) {
      res.status(404).json({ success: false, message: '媒体不存在' });
      return;
    }

    const newStatus = media.is_favorite ? 0 : 1;
    db.prepare('UPDATE media SET is_favorite = ? WHERE id = ?').run(newStatus, id);

    res.json({
      success: true,
      message: newStatus ? '已收藏' : '已取消收藏',
      data: { is_favorite: newStatus }
    });
  } catch (error) {
    logger.error('切换收藏错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
}
