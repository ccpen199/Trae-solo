import { Router } from 'express';
import { db } from '../database';
import { authMiddleware } from '../middleware';

const router = Router();

router.get('/', authMiddleware, (req, res) => {
  const { style, store_id } = req.query;
  let query = `
    SELECT m.*, s.name as store_name, s.city as store_city
    FROM showroom_models m
    LEFT JOIN stores s ON m.store_id = s.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (style) {
    query += ' AND m.style = ?';
    params.push(style);
  }
  if (store_id) {
    query += ' AND m.store_id = ?';
    params.push(store_id);
  }

  query += ' ORDER BY m.created_at DESC';
  const models = db.prepare(query).all(...params);
  res.json(models);
});

router.get('/styles', authMiddleware, (req, res) => {
  const styles = db.prepare('SELECT DISTINCT style FROM showroom_models WHERE style IS NOT NULL').all() as { style: string }[];
  res.json(styles.map(s => s.style));
});

router.get('/:id', authMiddleware, (req, res) => {
  const { id } = req.params;
  const model = db.prepare(`
    SELECT m.*, s.name as store_name, s.city as store_city, s.address as store_address
    FROM showroom_models m
    LEFT JOIN stores s ON m.store_id = s.id
    WHERE m.id = ?
  `).get(id);

  if (!model) {
    return res.status(404).json({ error: '样板间不存在' });
  }

  res.json(model);
});

export default router;
