import { Request, Response } from 'express';
import { db } from '../config/database.js';
import type { ApiResponse, FilmFestival, FestivalSchedule, DirectorInterview } from '../types/index.js';

export const getFestivals = (req: Request, res: Response): void => {
  try {
    const { status = 'all' } = req.query;
    
    let query = 'SELECT * FROM film_festivals';
    const params: any[] = [];
    
    const now = new Date().toISOString().split('T')[0];
    
    if (status === 'ongoing') {
      query += ' WHERE start_date <= ? AND end_date >= ?';
      params.push(now, now);
    } else if (status === 'upcoming') {
      query += ' WHERE start_date > ?';
      params.push(now);
    } else if (status === 'ended') {
      query += ' WHERE end_date < ?';
      params.push(now);
    }
    
    query += ' ORDER BY start_date DESC';
    
    const festivals = db.prepare(query).all(...params) as FilmFestival[];
    
    const response: ApiResponse = {
      code: 0,
      data: festivals
    };
    
    res.json(response);
  } catch (error) {
    res.status(500).json({
      code: 500,
      data: null,
      message: '获取电影节列表失败'
    });
  }
};

export const getFestivalDetail = (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    
    const festival = db.prepare('SELECT * FROM film_festivals WHERE id = ?').get(id) as FilmFestival;
    
    if (!festival) {
      res.status(404).json({
        code: 404,
        data: null,
        message: '电影节不存在'
      });
      return;
    }
    
    const schedulesStmt = db.prepare(`
      SELECT fs.*, m.title as movie_title, m.poster as movie_poster
      FROM festival_schedules fs
      INNER JOIN movies m ON fs.movie_id = m.id
      WHERE fs.festival_id = ?
      ORDER BY fs.screening_time ASC
    `);
    const schedules = schedulesStmt.all(id) as FestivalSchedule[];
    
    const response: ApiResponse = {
      code: 0,
      data: {
        ...festival,
        schedules
      }
    };
    
    res.json(response);
  } catch (error) {
    res.status(500).json({
      code: 500,
      data: null,
      message: '获取电影节详情失败'
    });
  }
};

export const getFestivalSchedule = (req: Request, res: Response): void => {
  try {
    const { festivalId } = req.params;
    const { date } = req.query;
    
    let query = `
      SELECT fs.*, m.title as movie_title, m.poster as movie_poster, m.duration, m.genre
      FROM festival_schedules fs
      INNER JOIN movies m ON fs.movie_id = m.id
      WHERE fs.festival_id = ?
    `;
    const params: any[] = [festivalId];
    
    if (date) {
      query += ' AND DATE(fs.screening_time) = ?';
      params.push(date);
    }
    
    query += ' ORDER BY fs.screening_time ASC';
    
    const schedules = db.prepare(query).all(...params);
    
    const response: ApiResponse = {
      code: 0,
      data: schedules
    };
    
    res.json(response);
  } catch (error) {
    res.status(500).json({
      code: 500,
      data: null,
      message: '获取排片信息失败'
    });
  }
};

export const getDirectorInterviews = (req: Request, res: Response): void => {
  try {
    const { movieId, page = 1, pageSize = 10 } = req.query;
    
    let query = `
      SELECT di.*, m.title as movie_title
      FROM director_interviews di
      LEFT JOIN movies m ON di.movie_id = m.id
    `;
    const params: any[] = [];
    
    if (movieId) {
      query += ' WHERE di.movie_id = ?';
      params.push(movieId);
    }
    
    query += ' ORDER BY di.publish_date DESC';
    
    const totalStmt = db.prepare(query.replace('SELECT di.*, m.title as movie_title', 'SELECT COUNT(*) as count'));
    const totalResult = totalStmt.get(...params) as { count: number };
    
    query += ' LIMIT ? OFFSET ?';
    params.push(Number(pageSize), (Number(page) - 1) * Number(pageSize));
    
    const interviews = db.prepare(query).all(...params) as DirectorInterview[];
    
    const response: ApiResponse = {
      code: 0,
      data: {
        list: interviews,
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
      message: '获取导演访谈失败'
    });
  }
};

export const getInterviewDetail = (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    
    const interview = db.prepare(`
      SELECT di.*, m.title as movie_title, m.poster as movie_poster
      FROM director_interviews di
      LEFT JOIN movies m ON di.movie_id = m.id
      WHERE di.id = ?
    `).get(id);
    
    if (!interview) {
      res.status(404).json({
        code: 404,
        data: null,
        message: '访谈不存在'
      });
      return;
    }
    
    const response: ApiResponse = {
      code: 0,
      data: interview
    };
    
    res.json(response);
  } catch (error) {
    res.status(500).json({
      code: 500,
      data: null,
      message: '获取访谈详情失败'
    });
  }
};

export const getArtFilms = (req: Request, res: Response): void => {
  try {
    const { page = 1, pageSize = 10 } = req.query;
    
    const stmt = db.prepare(`
      SELECT m.*, 
             (SELECT AVG(score) FROM scores WHERE movie_id = m.id) as avg_score
      FROM movies m
      WHERE m.genre LIKE ? OR m.genre LIKE ?
      ORDER BY avg_score DESC
      LIMIT ? OFFSET ?
    `);
    
    const movies = stmt.all('%文艺%', '%剧情%', Number(pageSize), (Number(page) - 1) * Number(pageSize));
    
    const totalStmt = db.prepare(`
      SELECT COUNT(*) as count FROM movies 
      WHERE genre LIKE ? OR genre LIKE ?
    `);
    const totalResult = totalStmt.get('%文艺%', '%剧情%') as { count: number };
    
    const response: ApiResponse = {
      code: 0,
      data: {
        list: movies,
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
      message: '获取艺术电影列表失败'
    });
  }
};
