import { Request, Response } from 'express';
import db from '../db';

export const getHeatmapData = (_req: Request, res: Response) => {
  try {
    const data = db.prepare('SELECT * FROM heatmap_data ORDER BY id').all();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch heatmap data' });
  }
};
