import { Router, Request, Response } from 'express';
import db from '../db/init';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  try {
    const row = db.prepare('SELECT 1').get();
    res.json({ code: 0, data: { status: 'ok', timestamp: new Date().toISOString(), db: row ? 'connected' : 'disconnected' }, message: 'success' });
  } catch (error: any) {
    res.json({ code: -1, data: { status: 'error', timestamp: new Date().toISOString(), db: 'disconnected' }, message: error.message });
  }
});

export default router;
