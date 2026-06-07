import { Router } from 'express';
import { getAsync, allAsync } from '../database/init';

const router = Router();

router.get('/overview', async (req, res) => {
  try {
    const { gridCode } = req.query;
    const gridFilter = gridCode ? 'WHERE grid_code = ?' : '';
    const params = gridCode ? [gridCode] : [];
    
    const totalPOIs = await getAsync(`SELECT COUNT(*) as count FROM pois ${gridFilter}`, params);
    const totalDemands = await getAsync(`SELECT COUNT(*) as count FROM demands ${gridFilter}`, params);
    const totalProviders = await getAsync(`SELECT COUNT(*) as count FROM providers ${gridFilter}`, params);
    
    const totalGridsResult = await getAsync('SELECT COUNT(*) as count FROM grids');
    const totalGrids = totalGridsResult.count;
    
    const gridsWithPOIs = await getAsync('SELECT COUNT(DISTINCT grid_code) as count FROM pois');
    const serviceCoverage = totalGrids > 0 ? Math.round((gridsWithPOIs.count / totalGrids) * 100) : 0;
    
    const totalDisputes = await getAsync(`SELECT COUNT(*) as count FROM disputes ${gridFilter}`, params);
    const resolvedDisputes = await getAsync(`SELECT COUNT(*) as count FROM disputes ${gridFilter ? gridFilter + " AND" : "WHERE"} status = 'resolved'`, params);
    const disputeResolutionRate = totalDisputes.count > 0 ? Math.round((resolvedDisputes.count / totalDisputes.count) * 100) : 0;
    
    const pendingSettlements = await getAsync(`SELECT COUNT(*) as count FROM settlements ${gridFilter ? gridFilter + " AND" : "WHERE"} status = 'pending'`, params);
    const pendingDisputes = await getAsync(`SELECT COUNT(*) as count FROM disputes ${gridFilter ? gridFilter + " AND" : "WHERE"} status = 'open'`, params);
    
    res.json({
      success: true,
      data: {
        totalPOIs: totalPOIs.count,
        totalDemands: totalDemands.count,
        totalProviders: totalProviders.count,
        totalGrids,
        serviceCoverage,
        disputeResolutionRate,
        pendingSettlements: pendingSettlements.count,
        pendingDisputes: pendingDisputes.count,
      }
    });
  } catch (error) {
    console.error('获取统计数据失败:', error);
    res.status(500).json({ success: false, error: '获取统计数据失败' });
  }
});

router.get('/top-demands', async (req, res) => {
  try {
    const topDemands = await allAsync(`
      SELECT type, COUNT(*) as count 
      FROM demands 
      GROUP BY type 
      ORDER BY count DESC 
      LIMIT 10
    `);
    
    res.json({ success: true, data: topDemands });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取需求统计失败' });
  }
});

router.get('/town-coverage', async (req, res) => {
  try {
    const townCoverage = await allAsync(`
      SELECT 
        SUBSTR(g.code, 1, 6) as town_code,
        g.name as town_name,
        COUNT(DISTINCT p.id) as poi_count,
        COUNT(DISTINCT pr.id) as provider_count
      FROM grids g
      LEFT JOIN pois p ON g.code = p.grid_code
      LEFT JOIN providers pr ON g.code = pr.grid_code
      GROUP BY town_code, town_name
      ORDER BY poi_count DESC
      LIMIT 20
    `);
    
    res.json({ success: true, data: townCoverage });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取覆盖率失败' });
  }
});

router.get('/settlements', async (req, res) => {
  try {
    const { period, gridCode } = req.query;
    
    let query = `
      SELECT 
        s.*,
        p.name as provider_name,
        p.service_type
      FROM settlements s
      LEFT JOIN providers p ON s.provider_id = p.id
      WHERE 1=1
    `;
    const params: any[] = [];
    
    if (period) {
      query += ' AND s.period = ?';
      params.push(period);
    }
    if (gridCode) {
      query += ' AND s.grid_code = ?';
      params.push(gridCode);
    }
    
    query += ' ORDER BY s.created_at DESC';
    
    const settlements = await allAsync(query, params);
    res.json({ success: true, data: settlements });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取结算数据失败' });
  }
});

router.get('/disputes', async (req, res) => {
  try {
    const disputes = await allAsync(`
      SELECT d.*, 
             c.name as complainant_name,
             r.name as respondent_name
      FROM disputes d
      LEFT JOIN users c ON d.complainant_id = c.id
      LEFT JOIN users r ON d.respondent_id = r.id
      ORDER BY d.created_at DESC
    `);
    
    res.json({ success: true, data: disputes });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取纠纷数据失败' });
  }
});

router.get('/dispute-trend', async (req, res) => {
  try {
    const trend = await allAsync(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as total,
        SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved
      FROM disputes
      WHERE created_at >= DATE('now', '-30 days')
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `);
    
    res.json({ success: true, data: trend });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取纠纷趋势失败' });
  }
});

router.get('/city-overview', async (req, res) => {
  try {
    const cityOverview = await allAsync(`
      SELECT 
        SUBSTR(g.code, 1, 4) as city_code,
        g.province,
        g.city,
        COUNT(DISTINCT g.code) as grid_count,
        COUNT(DISTINCT p.id) as poi_count,
        COUNT(DISTINCT d.id) as demand_count,
        COUNT(DISTINCT pr.id) as provider_count
      FROM grids g
      LEFT JOIN pois p ON g.code = p.grid_code
      LEFT JOIN demands d ON g.code = d.grid_code
      LEFT JOIN providers pr ON g.code = pr.grid_code
      GROUP BY city_code, g.province, g.city
      ORDER BY poi_count DESC
      LIMIT 32
    `);
    
    res.json({ success: true, data: cityOverview });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取地市概览失败' });
  }
});

router.get('/town-coverage-detail', async (req, res) => {
  try {
    const { cityCode } = req.query;
    let filter = '';
    const params: any[] = [];
    
    if (cityCode) {
      filter = 'WHERE SUBSTR(g.code, 1, 4) = ?';
      params.push(cityCode);
    }
    
    const townCoverage = await allAsync(`
      SELECT 
        g.code as grid_code,
        g.name as grid_name,
        g.town as town_name,
        g.city,
        g.province,
        COUNT(DISTINCT p.id) as poi_count,
        COUNT(DISTINCT pr.id) as provider_count,
        COUNT(DISTINCT d.id) as demand_count,
        CASE WHEN COUNT(DISTINCT p.id) > 0 THEN 1 ELSE 0 END as has_service
      FROM grids g
      LEFT JOIN pois p ON g.code = p.grid_code
      LEFT JOIN providers pr ON g.code = pr.grid_code
      LEFT JOIN demands d ON g.code = d.grid_code
      ${filter}
      GROUP BY g.code, g.name, g.town, g.city, g.province
      ORDER BY has_service DESC, poi_count DESC
    `, params);
    
    res.json({ success: true, data: townCoverage });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取覆盖率详情失败' });
  }
});

export default router;
