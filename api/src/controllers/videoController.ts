import { Request, Response } from 'express';
import { db } from '../config/database.js';
import type { ApiResponse, Video } from '../types/index.js';

export const getVideos = (req: Request, res: Response): void => {
  try {
    const { movieId, sort = 'views', page = 1, pageSize = 10 } = req.query;
    
    let query = `
      SELECT v.*, m.title as movie_title
      FROM videos v
      LEFT JOIN movies m ON v.movie_id = m.id
    `;
    const params: any[] = [];
    
    if (movieId) {
      query += ' WHERE v.movie_id = ?';
      params.push(movieId);
    }
    
    if (sort === 'views') {
      query += ' ORDER BY v.views DESC';
    } else if (sort === 'likes') {
      query += ' ORDER BY v.likes DESC';
    } else if (sort === 'newest') {
      query += ' ORDER BY v.publish_time DESC';
    } else if (sort === 'completion') {
      query += ' ORDER BY v.completion_rate DESC';
    }
    
    const totalStmt = db.prepare(query.replace('SELECT v.*, m.title as movie_title', 'SELECT COUNT(*) as count'));
    const totalResult = totalStmt.get(...params) as { count: number };
    
    query += ' LIMIT ? OFFSET ?';
    params.push(Number(pageSize), (Number(page) - 1) * Number(pageSize));
    
    const videos = db.prepare(query).all(...params) as Video[];
    
    const response: ApiResponse = {
      code: 0,
      data: {
        list: videos,
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
      message: '获取视频列表失败'
    });
  }
};

export const getVideoDetail = (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    
    const video = db.prepare(`
      SELECT v.*, m.title as movie_title, m.poster as movie_poster
      FROM videos v
      LEFT JOIN movies m ON v.movie_id = m.id
      WHERE v.id = ?
    `).get(id) as Video;
    
    if (!video) {
      res.status(404).json({
        code: 404,
        data: null,
        message: '视频不存在'
      });
      return;
    }
    
    db.prepare('UPDATE videos SET views = views + 1 WHERE id = ?').run(id);
    
    const updatedVideo = db.prepare(`
      SELECT v.*, m.title as movie_title, m.poster as movie_poster
      FROM videos v
      LEFT JOIN movies m ON v.movie_id = m.id
      WHERE v.id = ?
    `).get(id);
    
    const response: ApiResponse = {
      code: 0,
      data: updatedVideo
    };
    
    res.json(response);
  } catch (error) {
    res.status(500).json({
      code: 500,
      data: null,
      message: '获取视频详情失败'
    });
  }
};

export const likeVideo = (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    
    const video = db.prepare('SELECT id FROM videos WHERE id = ?').get(id);
    
    if (!video) {
      res.status(404).json({
        code: 404,
        data: null,
        message: '视频不存在'
      });
      return;
    }
    
    db.prepare('UPDATE videos SET likes = likes + 1 WHERE id = ?').run(id);
    
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

export const shareVideo = (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    
    const video = db.prepare('SELECT id FROM videos WHERE id = ?').get(id);
    
    if (!video) {
      res.status(404).json({
        code: 404,
        data: null,
        message: '视频不存在'
      });
      return;
    }
    
    db.prepare('UPDATE videos SET shares = shares + 1 WHERE id = ?').run(id);
    
    res.json({
      code: 0,
      data: { success: true },
      message: '分享成功'
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      data: null,
      message: '分享失败'
    });
  }
};

export const updateCompletionRate = (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const { completionRate } = req.body;
    
    if (completionRate === undefined || completionRate < 0 || completionRate > 100) {
      res.status(400).json({
        code: 400,
        data: null,
        message: '完成率参数无效'
      });
      return;
    }
    
    const video = db.prepare('SELECT id, completion_rate, views FROM videos WHERE id = ?').get(id) as Video;
    
    if (!video) {
      res.status(404).json({
        code: 404,
        data: null,
        message: '视频不存在'
      });
      return;
    }
    
    const newViews = video.views + 1;
    const newCompletionRate = (video.completion_rate * video.views + completionRate) / newViews;
    
    db.prepare(`
      UPDATE videos 
      SET completion_rate = ?, views = ? 
      WHERE id = ?
    `).run(Math.round(newCompletionRate * 10) / 10, newViews, id);
    
    res.json({
      code: 0,
      data: { success: true },
      message: '播放进度更新成功'
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      data: null,
      message: '播放进度更新失败'
    });
  }
};
