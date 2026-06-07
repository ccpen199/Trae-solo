import { Router } from 'express';
import { getAsync, allAsync } from '../database/init';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { gridCode, type, status, maxCost } = req.query;
    
    let query = 'SELECT * FROM pois WHERE 1=1';
    const params: any[] = [];
    
    if (gridCode) {
      query += ' AND grid_code = ?';
      params.push(gridCode);
    }
    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }
    if (status) {
      query += ' AND business_status = ?';
      params.push(status);
    }
    if (maxCost) {
      query += ' AND avg_cost <= ?';
      params.push(Number(maxCost));
    }
    
    query += ' ORDER BY created_at DESC';
    
    const pois = await allAsync(query, params);
    res.json({ success: true, data: pois });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取POI列表失败' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const poi = await getAsync('SELECT * FROM pois WHERE id = ?', [Number(req.params.id)]);
    if (!poi) {
      return res.status(404).json({ success: false, error: 'POI不存在' });
    }
    res.json({ success: true, data: poi });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取POI详情失败' });
  }
});

export default router;
