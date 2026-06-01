import { Request, Response } from 'express';
import { db } from '../config/database.js';
import crypto from 'crypto';
import type { ApiResponse, UGCPost } from '../types/index.js';

export const getPosts = (req: Request, res: Response): void => {
  try {
    const { movieId, userId, sort = 'hot', page = 1, pageSize = 10 } = req.query;
    
    let query = `
      SELECT p.*, u.nickname, u.avatar, m.title as movie_title
      FROM ugc_posts p
      INNER JOIN users u ON p.user_id = u.id
      LEFT JOIN movies m ON p.movie_id = m.id
    `;
    const params: any[] = [];
    const whereClauses: string[] = [];
    
    if (movieId) {
      whereClauses.push('p.movie_id = ?');
      params.push(movieId);
    }
    if (userId) {
      whereClauses.push('p.user_id = ?');
      params.push(userId);
    }
    
    if (whereClauses.length > 0) {
      query += ' WHERE ' + whereClauses.join(' AND ');
    }
    
    if (sort === 'hot') {
      query += ' ORDER BY (p.likes_count * 2 + p.comments_count * 3) DESC';
    } else if (sort === 'newest') {
      query += ' ORDER BY p.created_at DESC';
    } else if (sort === 'quality') {
      query += ' ORDER BY p.quality_score DESC';
    }
    
    const totalStmt = db.prepare(query.replace('SELECT p.*, u.nickname, u.avatar, m.title as movie_title', 'SELECT COUNT(*) as count'));
    const totalResult = totalStmt.get(...params) as { count: number };
    
    query += ' LIMIT ? OFFSET ?';
    params.push(Number(pageSize), (Number(page) - 1) * Number(pageSize));
    
    const posts = db.prepare(query).all(...params) as UGCPost[];
    
    const response: ApiResponse = {
      code: 0,
      data: {
        list: posts,
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
      message: '获取帖子列表失败'
    });
  }
};

export const getPostDetail = (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    
    const post = db.prepare(`
      SELECT p.*, u.nickname, u.avatar, m.title as movie_title, m.poster as movie_poster
      FROM ugc_posts p
      INNER JOIN users u ON p.user_id = u.id
      LEFT JOIN movies m ON p.movie_id = m.id
      WHERE p.id = ?
    `).get(id);
    
    if (!post) {
      res.status(404).json({
        code: 404,
        data: null,
        message: '帖子不存在'
      });
      return;
    }
    
    const response: ApiResponse = {
      code: 0,
      data: post
    };
    
    res.json(response);
  } catch (error) {
    res.status(500).json({
      code: 500,
      data: null,
      message: '获取帖子详情失败'
    });
  }
};

export const createPost = (req: Request, res: Response): void => {
  try {
    const { userId, movieId, title, content } = req.body;
    
    if (!userId || !title || !content) {
      res.status(400).json({
        code: 400,
        data: null,
        message: '参数不完整'
      });
      return;
    }
    
    const postId = crypto.randomUUID();
    const qualityScore = 50 + Math.random() * 40;
    
    db.prepare(`
      INSERT INTO ugc_posts (id, user_id, movie_id, title, content, quality_score)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(postId, userId, movieId || null, title, content, Math.round(qualityScore * 10) / 10);
    
    const post = db.prepare(`
      SELECT p.*, u.nickname, u.avatar
      FROM ugc_posts p
      INNER JOIN users u ON p.user_id = u.id
      WHERE p.id = ?
    `).get(postId);
    
    const response: ApiResponse = {
      code: 0,
      data: post,
      message: '发布成功'
    };
    
    res.json(response);
  } catch (error) {
    res.status(500).json({
      code: 500,
      data: null,
      message: '发布失败'
    });
  }
};

export const likePost = (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    
    const post = db.prepare('SELECT id FROM ugc_posts WHERE id = ?').get(id);
    
    if (!post) {
      res.status(404).json({
        code: 404,
        data: null,
        message: '帖子不存在'
      });
      return;
    }
    
    db.prepare('UPDATE ugc_posts SET likes_count = likes_count + 1 WHERE id = ?').run(id);
    
    res.json({
      code: 0,
      data: { success: true },
      message: '点赞成功'
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      data: null,
      message: '点赞失败'
    });
  }
};

export const deletePost = (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    
    const post = db.prepare('SELECT id, user_id FROM ugc_posts WHERE id = ?').get(id) as { id: string; user_id: string };
    
    if (!post) {
      res.status(404).json({
        code: 404,
        data: null,
        message: '帖子不存在'
      });
      return;
    }
    
    if (post.user_id !== userId) {
      res.status(403).json({
        code: 403,
        data: null,
        message: '无权限删除'
      });
      return;
    }
    
    db.prepare('DELETE FROM ugc_posts WHERE id = ?').run(id);
    
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
