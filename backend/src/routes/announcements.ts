import { Router } from 'express';
import { getAsync, allAsync, runAsync } from '../database/init';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { gridCode, type, limit } = req.query;
    
    let query = `
      SELECT a.*, g.name as grid_name
      FROM announcements a
      LEFT JOIN grids g ON a.grid_code = g.code
      WHERE a.status = 'active'
    `;
    const params: any[] = [];
    
    if (gridCode) {
      query += ' AND a.grid_code = ?';
      params.push(gridCode);
    }
    
    if (type) {
      query += ' AND a.category = ?';
      params.push(type);
    }
    
    query += ' ORDER BY a.priority DESC, a.created_at DESC';
    
    if (limit) {
      query += ' LIMIT ?';
      params.push(Number(limit));
    }
    
    const announcements = await allAsync(query, params);
    res.json({ success: true, data: announcements });
  } catch (error) {
    console.error('获取公告失败:', error);
    res.status(500).json({ success: false, error: '获取公告失败' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const announcement = await getAsync(`
      SELECT a.*, g.name as grid_name
      FROM announcements a
      LEFT JOIN grids g ON a.grid_code = g.code
      WHERE a.id = ?
    `, [req.params.id]);
    
    res.json({ success: true, data: announcement });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取公告详情失败' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { title, content, gridCode, type, priority, publisher, expireDate } = req.body;
    
    const result = await runAsync(`
      INSERT INTO announcements (title, content, grid_code, category, priority, publisher_name, expire_date)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [title, content, gridCode, type || 'notice', priority || 0, publisher, expireDate]);
    
    res.json({ success: true, data: { id: result.lastID } });
  } catch (error) {
    res.status(500).json({ success: false, error: '发布公告失败' });
  }
});

export default router;
