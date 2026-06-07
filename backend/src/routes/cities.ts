import { Router, Response } from 'express';
import { db } from '../database';
import { AuthRequest, authenticateToken } from '../middleware/auth';

const router = Router();

router.get('/', (_req: any, res: Response) => {
  try {
    const cities = db.prepare('SELECT * FROM cities ORDER BY id').all();
    res.json({ cities });
  } catch (error) {
    res.status(500).json({ error: '获取城市列表失败' });
  }
});

router.get('/:id', (req: any, res: Response) => {
  try {
    const city: any = db.prepare('SELECT * FROM cities WHERE id = ?').get(req.params.id);
    if (!city) {
      res.status(404).json({ error: '城市不存在' });
      return;
    }
    const districts = db.prepare('SELECT * FROM districts WHERE city_id = ?').all(req.params.id);
    const streets = db.prepare(`
      SELECT s.* FROM streets s 
      JOIN districts d ON s.district_id = d.id 
      WHERE d.city_id = ?
    `).all(req.params.id);
    
    const postCount = db.prepare('SELECT COUNT(*) as count FROM posts WHERE city_id = ? AND is_deleted = 0').get(req.params.id) as { count: number };
    const merchantCount = db.prepare('SELECT COUNT(*) as count FROM merchants WHERE city_id = ?').get(req.params.id) as { count: number };
    
    res.json({ city, districts, streets, stats: { postCount: postCount.count, merchantCount: merchantCount.count } });
  } catch (error) {
    res.status(500).json({ error: '获取城市详情失败' });
  }
});

router.get('/:id/districts', (req: any, res: Response) => {
  try {
    const districts = db.prepare('SELECT * FROM districts WHERE city_id = ?').all(req.params.id);
    res.json({ districts });
  } catch (error) {
    res.status(500).json({ error: '获取区县列表失败' });
  }
});

router.get('/:cityId/districts/:districtId/streets', (req: any, res: Response) => {
  try {
    const streets = db.prepare('SELECT * FROM streets WHERE district_id = ?').all(req.params.districtId);
    res.json({ streets });
  } catch (error) {
    res.status(500).json({ error: '获取街道列表失败' });
  }
});

export default router;
