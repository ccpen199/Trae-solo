import { Request, Response } from 'express';
import db from '../db';

export const getHealth = (_req: Request, res: Response) => {
  try {
    db.prepare('SELECT 1').get();
    res.json({
      status: 'ok',
      message: 'Service is healthy',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Database connection failed',
    });
  }
};
