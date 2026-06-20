import { Router } from 'express';
import db from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/entrustments', authMiddleware, (req: AuthRequest, res) => {
  const { page = 1, pageSize = 20, status } = req.query;
  const offset = (Number(page) - 1) * Number(pageSize);

  let where = 'WHERE owner_id = ?';
  let params: any[] = [req.user!.id];

  if (status && status !== 'all') {
    where += ' AND status = ?';
    params.push(status);
  }

  const list = db.prepare(
    `SELECT e.*, p.title as property_title, p.images as property_images, p.address as property_address
     FROM owner_entrustments e
     LEFT JOIN properties p ON e.property_id = p.id
     ${where}
     ORDER BY e.created_at DESC
     LIMIT ? OFFSET ?`
  ).all(...params, Number(pageSize), offset);

  const total = db.prepare(
    `SELECT COUNT(*) as count FROM owner_entrustments ${where}`
  ).get(...params) as { count: number };

  res.json({ list, total: total.count, page: Number(page), pageSize: Number(pageSize) });
});

router.post('/entrustments', authMiddleware, (req: AuthRequest, res) => {
  const { propertyId, type, expectedPrice, description, replacementDemand } = req.body;

  if (!type) {
    res.status(400).json({ message: '请选择委托类型' });
    return;
  }

  const result = db.prepare(
    `INSERT INTO owner_entrustments 
     (owner_id, property_id, type, expected_price, description, replacement_demand)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(req.user!.id, propertyId || null, type, expectedPrice || null, description || '', replacementDemand || '');

  res.json({ id: result.lastInsertRowid, message: '委托提交成功' });
});

router.get('/viewing-feedbacks', authMiddleware, (req: AuthRequest, res) => {
  const { page = 1, pageSize = 20 } = req.query;
  const offset = (Number(page) - 1) * Number(pageSize);

  const list = db.prepare(
    `SELECT v.*, p.title as property_title, p.images as property_images,
            u.real_name as customer_name,
            a.real_name as agent_name, a.agency as agent_agency
     FROM viewing_records v
     JOIN properties p ON v.property_id = p.id
     JOIN users u ON v.customer_id = u.id
     JOIN agents a ON v.agent_id = a.id
     WHERE p.owner_id = ?
     ORDER BY v.view_time DESC
     LIMIT ? OFFSET ?`
  ).all(req.user!.id, Number(pageSize), offset);

  const total = db.prepare(
    `SELECT COUNT(*) as count FROM viewing_records v
     JOIN properties p ON v.property_id = p.id
     WHERE p.owner_id = ?`
  ).get(req.user!.id) as { count: number };

  res.json({ list, total: total.count, page: Number(page), pageSize: Number(pageSize) });
});

router.get('/replacement-matches', authMiddleware, (req: AuthRequest, res) => {
  const entrustments = db.prepare(
    `SELECT * FROM owner_entrustments 
     WHERE owner_id = ? AND status = 'active' AND replacement_demand IS NOT NULL
     LIMIT 3`
  ).all(req.user!.id);

  let allMatches: any[] = [];

  entrustments.forEach((e: any) => {
    const demand = e.replacement_demand || '';
    const keywords = demand.split(/[,，、\s]+/).filter(Boolean);
    
    if (keywords.length > 0) {
      const placeholders = keywords.map(() => 'title LIKE ? OR description LIKE ?').join(' OR ');
      const params = keywords.flatMap((k: string) => [`%${k}%`, `%${k}%`]);
      
      const matches = db.prepare(
        `SELECT id, title, price, price_unit, area, district, community, images, type
         FROM properties
         WHERE status = 'active' AND (${placeholders})
         ORDER BY view_count DESC
         LIMIT 5`
      ).all(...params);
      
      allMatches = [...allMatches, ...matches];
    }
  });

  if (allMatches.length === 0) {
    allMatches = db.prepare(
      `SELECT id, title, price, price_unit, area, district, community, images, type
       FROM properties
       WHERE status = 'active'
       ORDER BY view_count DESC
       LIMIT 10`
    ).all();
  }

  const uniqueMatches = Array.from(new Map(allMatches.map(m => [m.id, m])).values()).slice(0, 10);

  res.json({ list: uniqueMatches });
});

export default router;
