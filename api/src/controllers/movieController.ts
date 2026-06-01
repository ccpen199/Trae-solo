import { Request, Response } from 'express';
import { db } from '../config/database.js';
import * as movieService from '../services/movieService.js';
import type { ApiResponse, Session } from '../types/index.js';

export const getMovies = (req: Request, res: Response): void => {
  try {
    const { genre, sort = 'heat', page = 1, pageSize = 10 } = req.query;
    
    let movies = movieService.getAllMoviesWithScores();
    
    if (genre) {
      movies = movies.filter(m => m.genre.includes(genre as string));
    }
    
    if (sort === 'score') {
      movies.sort((a, b) => b.fused_score - a.fused_score);
    } else if (sort === 'heat') {
      movies.sort((a, b) => b.current_heat - a.current_heat);
    } else if (sort === 'date') {
      movies.sort((a, b) => new Date(b.release_date).getTime() - new Date(a.release_date).getTime());
    }
    
    const total = movies.length;
    const startIndex = (Number(page) - 1) * Number(pageSize);
    const paginatedMovies = movies.slice(startIndex, startIndex + Number(pageSize));
    
    const response: ApiResponse = {
      code: 0,
      data: {
        list: paginatedMovies,
        total,
        page: Number(page),
        pageSize: Number(pageSize)
      }
    };
    
    res.json(response);
  } catch (error) {
    res.status(500).json({
      code: 500,
      data: null,
      message: '获取电影列表失败'
    });
  }
};

export const getMovieDetail = (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const movie = movieService.getMovieWithDetails(id);
    
    if (!movie) {
      res.status(404).json({
        code: 404,
        data: null,
        message: '电影不存在'
      });
      return;
    }
    
    const cast = movieService.getCastMembers(id);
    const sessionsStmt = db.prepare(`
      SELECT id, movie_id, cinema_name, start_time, hall_type
      FROM sessions
      WHERE movie_id = ?
      ORDER BY start_time ASC
    `);
    const sessions = sessionsStmt.all(id) as Session[];
    
    const response: ApiResponse = {
      code: 0,
      data: {
        ...movie,
        cast,
        sessions
      }
    };
    
    res.json(response);
  } catch (error) {
    res.status(500).json({
      code: 500,
      data: null,
      message: '获取电影详情失败'
    });
  }
};

export const getMovieScores = (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const { fused_score, sources } = movieService.fuseMovieScores(id);
    
    const response: ApiResponse = {
      code: 0,
      data: {
        movie_id: id,
        fused_score,
        sources
      }
    };
    
    res.json(response);
  } catch (error) {
    res.status(500).json({
      code: 500,
      data: null,
      message: '获取评分失败'
    });
  }
};

export const getHeatTrend = (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const trends = movieService.getHeatTrend(id);
    const currentHeat = movieService.calculateCurrentHeat(id);
    
    const response: ApiResponse = {
      code: 0,
      data: {
        movie_id: id,
        current_heat: currentHeat,
        trends
      }
    };
    
    res.json(response);
  } catch (error) {
    res.status(500).json({
      code: 500,
      data: null,
      message: '获取热度趋势失败'
    });
  }
};

export const getMovieSessions = (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const { date } = req.query;
    
    let query = `
      SELECT s.*, m.title as movie_title, m.poster as movie_poster
      FROM sessions s
      INNER JOIN movies m ON s.movie_id = m.id
      WHERE s.movie_id = ?
    `;
    const params: any[] = [id];
    
    if (date) {
      query += ' AND DATE(s.start_time) = ?';
      params.push(date);
    }
    
    query += ' ORDER BY s.start_time ASC';
    
    const stmt = db.prepare(query);
    const sessions = stmt.all(...params);
    
    const response: ApiResponse = {
      code: 0,
      data: sessions
    };
    
    res.json(response);
  } catch (error) {
    res.status(500).json({
      code: 500,
      data: null,
      message: '获取场次失败'
    });
  }
};
