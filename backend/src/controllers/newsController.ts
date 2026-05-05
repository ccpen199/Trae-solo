import { Request, Response } from 'express';
import pool from '../config/database';
import { ApiResponse } from '../types';

export const getNews = async (req: Request, res: Response): Promise<void> => {
  try {
    const { type, isScroll, limit = 10 } = req.query;

    let query = `
      SELECT * FROM news WHERE is_active = true
    `;
    const values: any[] = [];
    let paramIndex = 1;

    if (type) {
      query += ` AND type = $${paramIndex}`;
      values.push(type);
      paramIndex++;
    }

    if (isScroll === 'true') {
      query += ` AND is_scroll = true`;
    }

    query += ` ORDER BY sort_order ASC, created_at DESC`;

    if (limit) {
      query += ` LIMIT $${paramIndex}`;
      values.push(parseInt(limit as string));
    }

    const result = await pool.query(query, values);

    res.json({
      success: true,
      data: result.rows
    } as ApiResponse);
  } catch (error) {
    console.error('Get news error:', error);
    res.status(500).json({
      success: false,
      message: '获取新闻列表失败',
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
};

export const getNewsById = async (req: Request, res: Response): Promise<void> => {
  try {
    const newsId = req.params.id;

    const result = await pool.query(
      'SELECT * FROM news WHERE id = $1 AND is_active = true',
      [newsId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: '新闻不存在'
      } as ApiResponse);
      return;
    }

    res.json({
      success: true,
      data: result.rows[0]
    } as ApiResponse);
  } catch (error) {
    console.error('Get news error:', error);
    res.status(500).json({
      success: false,
      message: '获取新闻详情失败',
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
};
