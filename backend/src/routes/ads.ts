import { Router, Request, Response } from 'express';
import db from '../database';

const router = Router();

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
}

router.get('/:type', (req: Request, res: Response) => {
  try {
    const { type } = req.params;
    const { videoId } = req.query;

    const ads = db.prepare(`
      SELECT * FROM advertisements 
      WHERE type = ? AND status = 'active'
      ORDER BY position ASC, RANDOM()
      LIMIT 1
    `).all(type);

    if (ads.length > 0) {
      db.prepare(`
        INSERT INTO ad_impressions (ad_id, user_id, type, client_ip)
        VALUES (?, ?, ?, ?)
      `).run(ads[0].id, null, type, req.ip);
    }

    res.json({ success: true, data: ads[0] || null } as ApiResponse);
  } catch (error) {
    res.status(500).json({ success: false, message: '获取广告失败' } as ApiResponse);
  }
});

router.post('/:id/click', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    db.prepare(`
      UPDATE ad_impressions 
      SET is_clicked = 1 
      WHERE ad_id = ? AND user_id = ?
      ORDER BY created_at DESC 
      LIMIT 1
    `).run(id, userId || null);

    res.json({ success: true, message: '广告点击已记录' } as ApiResponse);
  } catch (error) {
    res.status(500).json({ success: false, message: '记录广告点击失败' } as ApiResponse);
  }
});

router.get('/mid/:videoId', (req: Request, res: Response) => {
  try {
    const { videoId } = req.params;

    const ads = db.prepare(`
      SELECT * FROM advertisements 
      WHERE type = 'mid' AND status = 'active'
      ORDER BY position ASC, RANDOM()
      LIMIT 1
    `).all();

    res.json({ success: true, data: ads[0] || null } as ApiResponse);
  } catch (error) {
    res.status(500).json({ success: false, message: '获取中插广告失败' } as ApiResponse);
  }
});

export default router;
