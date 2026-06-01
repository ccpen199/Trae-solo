import { Router, Response } from 'express';
import { getOne, getAll, runQuery } from '../database';
import { AuthRequest, authenticate } from '../middleware/auth';

const router = Router();

router.get('/stats', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const [todayStats, totalStats] = await Promise.all([
      getOne(`
        SELECT 
          COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as today_income,
          COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as today_expense
        FROM transactions 
        WHERE user_id = ? AND DATE(transaction_date) = ?
      `, [req.user!.id, today]),
      getOne(`
        SELECT 
          COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as total_income,
          COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as total_expense
        FROM transactions 
        WHERE user_id = ?
      `, [req.user!.id])
    ]);

    res.json({
      success: true,
      data: {
        today: {
          income: todayStats?.today_income || 0,
          expense: todayStats?.today_expense || 0
        },
        total: {
          income: totalStats?.total_income || 0,
          expense: totalStats?.total_expense || 0
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/medals', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const medals = await getAll('SELECT * FROM medals WHERE user_id = ? ORDER BY unlocked_at DESC', [req.user!.id]);
    res.json({ success: true, data: medals });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/favorites', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const favorites = await getAll(`
      SELECT cm.*, ct.name as contact_name 
      FROM chat_messages cm 
      LEFT JOIN contacts ct ON cm.contact_id = ct.id
      WHERE cm.user_id = ? AND cm.is_favorited = 1 
      ORDER BY cm.created_at DESC
    `, [req.user!.id]);
    res.json({ success: true, data: favorites });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;