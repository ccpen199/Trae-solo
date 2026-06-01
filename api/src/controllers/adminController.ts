import { Request, Response } from 'express';
import { db } from '../config/database.js';
import type { ApiResponse } from '../types/index.js';

export const getDashboardStats = (req: Request, res: Response): void => {
  try {
    const stats = {
      total_users: (db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }).count,
      total_movies: (db.prepare('SELECT COUNT(*) as count FROM movies').get() as { count: number }).count,
      total_orders: (db.prepare('SELECT COUNT(*) as count FROM orders').get() as { count: number }).count,
      total_revenue: (db.prepare('SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE status = ?').get('paid') as { total: number }).total,
      total_posts: (db.prepare('SELECT COUNT(*) as count FROM ugc_posts').get() as { count: number }).count,
      total_videos: (db.prepare('SELECT COUNT(*) as count FROM videos').get() as { count: number }).count,
      vip_users: (db.prepare('SELECT COUNT(*) as count FROM users WHERE is_vip = 1').get() as { count: number }).count,
      today_orders: (db.prepare('SELECT COUNT(*) as count FROM orders WHERE DATE(created_at) = DATE()').get() as { count: number }).count
    };
    
    const response: ApiResponse = {
      code: 0,
      data: stats
    };
    
    res.json(response);
  } catch (error) {
    res.status(500).json({
      code: 500,
      data: null,
      message: '获取统计数据失败'
    });
  }
};

export const getUserList = (req: Request, res: Response): void => {
  try {
    const { page = 1, pageSize = 20, keyword } = req.query;
    
    let query = `
      SELECT id, phone, nickname, avatar, is_vip, vip_level, content_quality_score, created_at
      FROM users
    `;
    const params: any[] = [];
    
    if (keyword) {
      query += ' WHERE nickname LIKE ? OR phone LIKE ?';
      params.push(`%${keyword}%`, `%${keyword}%`);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const totalStmt = db.prepare(query.replace('SELECT id, phone, nickname, avatar, is_vip, vip_level, content_quality_score, created_at', 'SELECT COUNT(*) as count'));
    const totalResult = totalStmt.get(...params) as { count: number };
    
    query += ' LIMIT ? OFFSET ?';
    params.push(Number(pageSize), (Number(page) - 1) * Number(pageSize));
    
    const users = db.prepare(query).all(...params);
    
    const response: ApiResponse = {
      code: 0,
      data: {
        list: users,
        total: totalResult.count,
        page: Number(page),
        pageSize: Number(pageSize)
      }
    };
    
    res.json(response);
  } catch (error) {
    res.status(500).json({
      code: 500,
      data: null,
      message: '获取用户列表失败'
    });
  }
};

export const updateUserVip = (req: Request, res: Response): void => {
  try {
    const { userId } = req.params;
    const { is_vip, vip_level } = req.body;
    
    const user = db.prepare('SELECT id FROM users WHERE id = ?').get(userId);
    
    if (!user) {
      res.status(404).json({
        code: 404,
        data: null,
        message: '用户不存在'
      });
      return;
    }
    
    db.prepare('UPDATE users SET is_vip = ?, vip_level = ? WHERE id = ?').run(is_vip ? 1 : 0, vip_level || 0, userId);
    
    res.json({
      code: 0,
      data: { success: true },
      message: '更新成功'
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      data: null,
      message: '更新失败'
    });
  }
};

export const getOrderList = (req: Request, res: Response): void => {
  try {
    const { page = 1, pageSize = 20, status } = req.query;
    
    let query = `
      SELECT o.*, u.nickname, u.phone, m.title as movie_title
      FROM orders o
      INNER JOIN users u ON o.user_id = u.id
      INNER JOIN sessions s ON o.session_id = s.id
      INNER JOIN movies m ON s.movie_id = m.id
    `;
    const params: any[] = [];
    
    if (status) {
      query += ' WHERE o.status = ?';
      params.push(status);
    }
    
    query += ' ORDER BY o.created_at DESC';
    
    const totalStmt = db.prepare(query.replace('SELECT o.*, u.nickname, u.phone, m.title as movie_title', 'SELECT COUNT(*) as count'));
    const totalResult = totalStmt.get(...params) as { count: number };
    
    query += ' LIMIT ? OFFSET ?';
    params.push(Number(pageSize), (Number(page) - 1) * Number(pageSize));
    
    const orders = db.prepare(query).all(...params);
    
    const response: ApiResponse = {
      code: 0,
      data: {
        list: orders,
        total: totalResult.count,
        page: Number(page),
        pageSize: Number(pageSize)
      }
    };
    
    res.json(response);
  } catch (error) {
    res.status(500).json({
      code: 500,
      data: null,
      message: '获取订单列表失败'
    });
  }
};

export const manageMovie = (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const { title, poster, description, duration, release_date, genre } = req.body;
    
    if (id) {
      const movie = db.prepare('SELECT id FROM movies WHERE id = ?').get(id);
      if (!movie) {
        res.status(404).json({
          code: 404,
          data: null,
          message: '电影不存在'
        });
        return;
      }
      
      db.prepare(`
        UPDATE movies 
        SET title = ?, poster = ?, description = ?, duration = ?, release_date = ?, genre = ?
        WHERE id = ?
      `).run(title, poster, description, duration, release_date, genre, id);
      
      res.json({
        code: 0,
        data: { success: true },
        message: '更新成功'
      });
    } else {
      const crypto = require('crypto');
      const movieId = crypto.randomUUID();
      
      db.prepare(`
        INSERT INTO movies (id, title, poster, description, duration, release_date, genre)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(movieId, title, poster, description, duration, release_date, genre);
      
      res.json({
        code: 0,
        data: { id: movieId, success: true },
        message: '创建成功'
      });
    }
  } catch (error) {
    res.status(500).json({
      code: 500,
      data: null,
      message: '操作失败'
    });
  }
};

export const deleteMovie = (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    
    const movie = db.prepare('SELECT id FROM movies WHERE id = ?').get(id);
    
    if (!movie) {
      res.status(404).json({
        code: 404,
        data: null,
        message: '电影不存在'
      });
      return;
    }
    
    db.prepare('DELETE FROM movies WHERE id = ?').run(id);
    
    res.json({
      code: 0,
      data: { success: true },
      message: '删除成功'
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      data: null,
      message: '删除失败'
    });
  }
};
