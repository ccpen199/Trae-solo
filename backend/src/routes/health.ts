import { Router, Response } from 'express';
import { success } from '../utils/response';
import db from '../database';

const router = Router();

router.get('/', (req, res: Response) => {
  try {
    db.prepare('SELECT 1').get();
    success(res, {
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: 'connected'
    });
  } catch (e) {
    res.status(500).json({
      code: 500,
      message: '数据库连接失败',
      data: { status: 'error', timestamp: new Date().toISOString() }
    });
  }
});

export default router;
