import { Request, Response } from 'express';
import Joi from 'joi';
import db from '../database';
import logger from '../utils/logger';

const createCourseSchema = Joi.object({
  title: Joi.string().required().max(200),
  description: Joi.string(),
  cover_image: Joi.string().uri(),
  instructor: Joi.string().max(100),
  price: Joi.number().min(0)
});

export async function getStats(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;
    
    const user = db.prepare('SELECT role FROM users WHERE id = ?').get(userId) as any;
    if (!user || user.role !== 'admin') {
      res.status(403).json({ success: false, message: '无权限' });
      return;
    }

    const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get() as any;
    const totalBabies = db.prepare('SELECT COUNT(*) as count FROM babies').get() as any;
    const totalMedia = db.prepare('SELECT COUNT(*) as count FROM media').get() as any;
    const totalMoments = db.prepare('SELECT COUNT(*) as count FROM moments').get() as any;
    const totalStorage = db.prepare('SELECT SUM(storage_used) as total FROM users').get() as any;

    res.json({
      success: true,
      data: {
        total_users: totalUsers.count,
        total_babies: totalBabies.count,
        total_media: totalMedia.count,
        total_moments: totalMoments.count,
        total_storage: totalStorage.total || 0
      }
    });
  } catch (error) {
    logger.error('获取统计数据错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
}

export async function getUsers(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;
    
    const user = db.prepare('SELECT role FROM users WHERE id = ?').get(userId) as any;
    if (!user || user.role !== 'admin') {
      res.status(403).json({ success: false, message: '无权限' });
      return;
    }

    const { page = 1, limit = 20 } = req.query;

    const users = db.prepare(`
      SELECT id, phone, nickname, avatar, role, storage_used, storage_limit, created_at
      FROM users
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).all(Number(limit), (Number(page) - 1) * Number(limit));

    const { total } = db.prepare('SELECT COUNT(*) as total FROM users').get() as any;

    res.json({
      success: true,
      data: {
        list: users,
        total,
        page: Number(page),
        limit: Number(limit)
      }
    });
  } catch (error) {
    logger.error('获取用户列表错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
}

export async function deleteUser(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;
    
    const user = db.prepare('SELECT role FROM users WHERE id = ?').get(userId) as any;
    if (!user || user.role !== 'admin') {
      res.status(403).json({ success: false, message: '无权限' });
      return;
    }

    if (Number(id) === userId) {
      res.status(400).json({ success: false, message: '不能删除自己' });
      return;
    }

    db.prepare('DELETE FROM users WHERE id = ?').run(id);

    res.json({
      success: true,
      message: '删除成功'
    });
  } catch (error) {
    logger.error('删除用户错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
}

export async function getCourses(req: Request, res: Response) {
  try {
    const { page = 1, limit = 20 } = req.query;

    const courses = db.prepare(`
      SELECT * FROM courses
      WHERE status = "published"
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).all(Number(limit), (Number(page) - 1) * Number(limit));

    const { total } = db.prepare('SELECT COUNT(*) as total FROM courses WHERE status = "published"').get() as any;

    res.json({
      success: true,
      data: {
        list: courses,
        total,
        page: Number(page),
        limit: Number(limit)
      }
    });
  } catch (error) {
    logger.error('获取课程列表错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
}

export async function createCourse(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;
    
    const user = db.prepare('SELECT role FROM users WHERE id = ?').get(userId) as any;
    if (!user || user.role !== 'admin') {
      res.status(403).json({ success: false, message: '无权限' });
      return;
    }

    const { error, value } = createCourseSchema.validate(req.body);
    if (error) {
      res.status(400).json({ success: false, message: error.details[0].message });
      return;
    }

    const result = db.prepare(`
      INSERT INTO courses (title, description, cover_image, instructor, price, status)
      VALUES (?, ?, ?, ?, ?, "published")
    `).run(
      value.title,
      value.description || '',
      value.cover_image || '',
      value.instructor || '',
      value.price || 0
    );

    res.json({
      success: true,
      message: '创建成功',
      data: { id: result.lastInsertRowid }
    });
  } catch (error) {
    logger.error('创建课程错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
}
