import { Router } from 'express';
import db from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

router.post('/behavior', authMiddleware, (req: AuthRequest, res) => {
  const { propertyId, action, duration = 0 } = req.body;
  
  if (!propertyId || !action) {
    res.status(400).json({ message: '缺少必要参数' });
    return;
  }

  db.prepare(
    'INSERT INTO user_behavior (user_id, property_id, action, duration) VALUES (?, ?, ?, ?)'
  ).run(req.user!.id, propertyId, action, duration);

  res.json({ message: '记录成功' });
});

router.get('/favorites', authMiddleware, (req: AuthRequest, res) => {
  const { page = 1, pageSize = 20 } = req.query;
  const offset = (Number(page) - 1) * Number(pageSize);

  const total = db.prepare(
    'SELECT COUNT(*) as count FROM favorites WHERE user_id = ?'
  ).get(req.user!.id) as { count: number };

  const list = db.prepare(
    `SELECT f.id as fav_id, f.created_at as fav_time, p.*
     FROM favorites f
     JOIN properties p ON f.property_id = p.id
     WHERE f.user_id = ?
     ORDER BY f.created_at DESC
     LIMIT ? OFFSET ?`
  ).all(req.user!.id, Number(pageSize), offset);

  res.json({ list, total: total.count, page: Number(page), pageSize: Number(pageSize) });
});

router.post('/favorites', authMiddleware, (req: AuthRequest, res) => {
  const { propertyId } = req.body;
  
  if (!propertyId) {
    res.status(400).json({ message: '缺少房源ID' });
    return;
  }

  try {
    db.prepare('INSERT INTO favorites (user_id, property_id) VALUES (?, ?)').run(req.user!.id, propertyId);
    db.prepare('UPDATE properties SET favorite_count = favorite_count + 1 WHERE id = ?').run(propertyId);
    res.json({ message: '收藏成功' });
  } catch (e: any) {
    if (e.message.includes('UNIQUE')) {
      res.status(400).json({ message: '已收藏该房源' });
    } else {
      res.status(500).json({ message: '操作失败' });
    }
  }
});

router.delete('/favorites/:id', authMiddleware, (req: AuthRequest, res) => {
  const result = db.prepare('DELETE FROM favorites WHERE id = ? AND user_id = ?').run(req.params.id, req.user!.id);
  
  if (result.changes > 0) {
    res.json({ message: '取消收藏成功' });
  } else {
    res.status(404).json({ message: '收藏记录不存在' });
  }
});

router.get('/consultations', authMiddleware, (req: AuthRequest, res) => {
  const { page = 1, pageSize = 20 } = req.query;
  const offset = (Number(page) - 1) * Number(pageSize);

  const total = db.prepare(
    'SELECT COUNT(*) as count FROM consultations WHERE user_id = ?'
  ).get(req.user!.id) as { count: number };

  const list = db.prepare(
    `SELECT c.*, p.title as property_title, p.images as property_images,
            a.real_name as agent_name, a.phone as agent_phone
     FROM consultations c
     JOIN properties p ON c.property_id = p.id
     LEFT JOIN agents a ON c.agent_id = a.id
     WHERE c.user_id = ?
     ORDER BY c.created_at DESC
     LIMIT ? OFFSET ?`
  ).all(req.user!.id, Number(pageSize), offset);

  res.json({ list, total: total.count, page: Number(page), pageSize: Number(pageSize) });
});

router.post('/consultations', authMiddleware, (req: AuthRequest, res) => {
  const { propertyId, content, agentId } = req.body;
  
  if (!propertyId || !content) {
    res.status(400).json({ message: '缺少必要参数' });
    return;
  }

  db.prepare(
    'INSERT INTO consultations (user_id, property_id, content, agent_id) VALUES (?, ?, ?, ?)'
  ).run(req.user!.id, propertyId, content, agentId || null);

  res.json({ message: '咨询提交成功' });
});

router.get('/recommendations', authMiddleware, (req: AuthRequest, res) => {
  const { limit = 10 } = req.query;

  const behaviors = db.prepare(
    `SELECT property_id, COUNT(*) as score
     FROM user_behavior
     WHERE user_id = ? AND action IN ('view', 'favorite', 'consult')
     GROUP BY property_id
     ORDER BY score DESC
     LIMIT 20`
  ).all(req.user!.id);

  let propertyIds: number[] = [];
  
  if (behaviors.length > 0) {
    const sampleProp = behaviors[0] as any;
    const property = db.prepare('SELECT type, district, room_count FROM properties WHERE id = ?').get(sampleProp.property_id) as any;
    
    if (property) {
      const similar = db.prepare(
        `SELECT id FROM properties 
         WHERE status = 'active' AND type = ? AND district = ?
         AND id NOT IN (${behaviors.map(() => '?').join(',')})
         ORDER BY RANDOM()
         LIMIT ?`
      ).all(property.type, property.district, ...behaviors.map((b: any) => b.property_id), Number(limit));
      
      propertyIds = similar.map((p: any) => p.id);
    }
  }

  if (propertyIds.length < Number(limit)) {
    const hot = db.prepare(
      `SELECT id FROM properties 
       WHERE status = 'active'
       ${propertyIds.length ? `AND id NOT IN (${propertyIds.map(() => '?').join(',')})` : ''}
       ORDER BY view_count DESC
       LIMIT ?`
    ).all(...propertyIds, Number(limit) - propertyIds.length);
    
    propertyIds = [...propertyIds, ...hot.map((p: any) => p.id)];
  }

  if (propertyIds.length === 0) {
    const hot = db.prepare(
      "SELECT id FROM properties WHERE status = 'active' ORDER BY view_count DESC LIMIT ?"
    ).all(Number(limit));
    propertyIds = hot.map((p: any) => p.id);
  }

  const list = db.prepare(
    `SELECT id, title, type, price, price_unit, area, district, community, 
            room_count, hall_count, images, view_count, favorite_count
     FROM properties WHERE id IN (${propertyIds.map(() => '?').join(',')})`
  ).all(...propertyIds);

  res.json({ list });
});

export default router;
