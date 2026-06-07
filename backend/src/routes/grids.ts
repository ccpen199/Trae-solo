import { Router } from 'express';
import { getAsync, allAsync } from '../database/init';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { provinceCode, cityCode, townCode } = req.query;
    
    let query = 'SELECT * FROM grids WHERE 1=1';
    const params: any[] = [];
    
    if (provinceCode) {
      query += ' AND province_code = ?';
      params.push(provinceCode);
    }
    
    if (cityCode) {
      query += ' AND city_code = ?';
      params.push(cityCode);
    }
    
    if (townCode) {
      query += ' AND town_code = ?';
      params.push(townCode);
    }
    
    query += ' ORDER BY code';
    
    const grids = await allAsync(query, params);
    res.json({ success: true, data: grids });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取网格列表失败' });
  }
});

router.get('/:code', async (req, res) => {
  try {
    const grid = await getAsync('SELECT * FROM grids WHERE code = ?', [req.params.code]);
    
    if (!grid) {
      return res.status(404).json({ success: false, message: '网格不存在' });
    }
    
    res.json({ success: true, data: grid });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取网格详情失败' });
  }
});

router.get('/:code/pois', async (req, res) => {
  try {
    const pois = await allAsync('SELECT * FROM pois WHERE grid_code = ?', [req.params.code]);
    res.json({ success: true, data: pois });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取POI失败' });
  }
});

router.get('/:code/providers', async (req, res) => {
  try {
    const providers = await allAsync('SELECT * FROM providers WHERE grid_code = ?', [req.params.code]);
    res.json({ success: true, data: providers });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取服务商失败' });
  }
});

router.get('/:code/demands', async (req, res) => {
  try {
    const demands = await allAsync('SELECT * FROM demands WHERE grid_code = ?', [req.params.code]);
    res.json({ success: true, data: demands });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取需求失败' });
  }
});

export default router;
