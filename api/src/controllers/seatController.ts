import { Request, Response } from 'express';
import { db } from '../config/database.js';
import * as movieService from '../services/movieService.js';
import type { ApiResponse, Seat } from '../types/index.js';

export const getSessionSeats = (req: Request, res: Response): void => {
  try {
    const { sessionId } = req.params;
    
    const stmt = db.prepare(`
      SELECT id, session_id, row_num, col_num, status, seat_type, view_angle, price
      FROM seats
      WHERE session_id = ?
      ORDER BY row_num, col_num
    `);
    const seats = stmt.all(sessionId) as Seat[];
    
    const sessionStmt = db.prepare(`
      SELECT s.*, m.title as movie_title, m.poster as movie_poster
      FROM sessions s
      LEFT JOIN movies m ON s.movie_id = m.id
      WHERE s.id = ?
    `);
    const session = sessionStmt.get(sessionId);
    
    const response: ApiResponse = {
      code: 0,
      data: {
        session,
        seats
      }
    };
    
    res.json(response);
  } catch (error) {
    res.status(500).json({
      code: 500,
      data: null,
      message: '获取座位信息失败'
    });
  }
};

export const getSeatRecommendation = (req: Request, res: Response): void => {
  try {
    const { sessionId } = req.params;
    const { count = 2, type } = req.query;
    
    const recommendations = movieService.recommendConsecutiveSeats(
      sessionId,
      Number(count),
      type as string
    );
    
    const response: ApiResponse = {
      code: 0,
      data: recommendations
    };
    
    res.json(response);
  } catch (error) {
    res.status(500).json({
      code: 500,
      data: null,
      message: '获取推荐座位失败'
    });
  }
};

export const lockSeat = (req: Request, res: Response): void => {
  try {
    const { seatId } = req.params;
    const { userId } = req.body;
    
    const checkStmt = db.prepare(`
      SELECT id, status FROM seats WHERE id = ?
    `);
    const seat = checkStmt.get(seatId) as Seat;
    
    if (!seat) {
      res.status(404).json({
        code: 404,
        data: null,
        message: '座位不存在'
      });
      return;
    }
    
    if (seat.status !== 'available') {
      res.status(400).json({
        code: 400,
        data: null,
        message: '座位不可用'
      });
      return;
    }
    
    const updateStmt = db.prepare(`
      UPDATE seats SET status = 'locked' WHERE id = ?
    `);
    const result = updateStmt.run(seatId);
    
    if (result.changes > 0) {
      res.json({
        code: 0,
        data: { success: true },
        message: '座位锁定成功'
      });
    } else {
      res.status(500).json({
        code: 500,
        data: null,
        message: '座位锁定失败'
      });
    }
  } catch (error) {
    res.status(500).json({
      code: 500,
      data: null,
      message: '座位锁定失败'
    });
  }
};

export const unlockSeat = (req: Request, res: Response): void => {
  try {
    const { seatId } = req.params;
    
    const checkStmt = db.prepare(`
      SELECT id, status FROM seats WHERE id = ?
    `);
    const seat = checkStmt.get(seatId) as Seat;
    
    if (!seat) {
      res.status(404).json({
        code: 404,
        data: null,
        message: '座位不存在'
      });
      return;
    }
    
    if (seat.status !== 'locked') {
      res.status(400).json({
        code: 400,
        data: null,
        message: '座位状态不允许解锁'
      });
      return;
    }
    
    const updateStmt = db.prepare(`
      UPDATE seats SET status = 'available' WHERE id = ?
    `);
    const result = updateStmt.run(seatId);
    
    if (result.changes > 0) {
      res.json({
        code: 0,
        data: { success: true },
        message: '座位解锁成功'
      });
    } else {
      res.status(500).json({
        code: 500,
        data: null,
        message: '座位解锁失败'
      });
    }
  } catch (error) {
    res.status(500).json({
      code: 500,
      data: null,
      message: '座位解锁失败'
    });
  }
};
