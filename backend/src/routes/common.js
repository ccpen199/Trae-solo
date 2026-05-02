const express = require('express');
const router = express.Router();
const priceIndex = require('../engines/PriceIndex');
const lbsPickUp = require('../engines/LBSPickUp');
const carbonModel = require('../engines/CarbonModel');
const db = require('../database');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

router.get('/price-rules', async (req, res) => {
  try {
    const prices = await priceIndex.getAllActivePrices();
    res.json({ success: true, data: prices });
  } catch (error) {
    res.status(500).json({ success: false, message: '查询价格规则失败', error: error.message });
  }
});

router.get('/centers', async (req, res) => {
  try {
    const centers = await lbsPickUp.getAllCenters();
    res.json({ success: true, data: centers });
  } catch (error) {
    res.status(500).json({ success: false, message: '查询集散中心失败', error: error.message });
  }
});

router.get('/nearest-center', async (req, res) => {
  try {
    const { latitude, longitude } = req.query;
    if (!latitude || !longitude) {
      return res.status(400).json({ success: false, message: '位置信息为必填项' });
    }

    const center = await lbsPickUp.findNearestCenter(
      parseFloat(latitude),
      parseFloat(longitude)
    );

    res.json({ success: true, data: center });
  } catch (error) {
    res.status(500).json({ success: false, message: '查询最近集散中心失败', error: error.message });
  }
});

router.get('/platform-stats', authMiddleware, roleMiddleware('operator'), async (req, res) => {
  try {
    const carbonStats = await carbonModel.getPlatformCarbonStats();

    db.get(
      `SELECT 
        (SELECT COUNT(*) FROM users WHERE role = 'resident') as resident_count,
        (SELECT COUNT(*) FROM users WHERE role = 'rider') as rider_count,
        (SELECT COUNT(*) FROM centers) as center_count,
        (SELECT COUNT(*) FROM orders) as total_orders,
        (SELECT COUNT(*) FROM orders WHERE status = 'completed') as completed_orders`,
      (err, stats) => {
        if (err) {
          return res.status(500).json({ success: false, message: '查询统计数据失败', error: err.message });
        }

        res.json({
          success: true,
          data: {
            user_stats: stats,
            carbon_stats: carbonStats
          }
        });
      }
    );
  } catch (error) {
    res.status(500).json({ success: false, message: '查询平台统计失败', error: error.message });
  }
});

router.get('/disputes', authMiddleware, roleMiddleware('operator'), (req, res) => {
  try {
    const { status = 'pending', limit = 20, offset = 0 } = req.query;

    db.all(
      `SELECT wd.*, o.order_no, o.category, o.resident_id, o.rider_id,
       ur.name as resident_name, ur.phone as resident_phone,
       r.name as rider_name, r.phone as rider_phone
       FROM weight_differences wd
       JOIN orders o ON wd.order_id = o.id
       JOIN users ur ON o.resident_id = ur.id
       LEFT JOIN users r ON o.rider_id = r.id
       WHERE wd.status = ?
       ORDER BY wd.created_at DESC
       LIMIT ? OFFSET ?`,
      [status, parseInt(limit), parseInt(offset)],
      (err, disputes) => {
        if (err) {
          return res.status(500).json({ success: false, message: '查询异议记录失败', error: err.message });
        }

        res.json({ success: true, data: disputes });
      }
    );
  } catch (error) {
    res.status(500).json({ success: false, message: '查询异议记录失败', error: error.message });
  }
});

router.get('/audit-logs', authMiddleware, roleMiddleware('operator'), (req, res) => {
  try {
    const { limit = 50, offset = 0, user_id, action } = req.query;

    let query = `SELECT al.*, u.name as user_name
                 FROM audit_logs al
                 LEFT JOIN users u ON al.user_id = u.id
                 WHERE 1=1`;
    const params = [];

    if (user_id) {
      query += ` AND al.user_id = ?`;
      params.push(user_id);
    }
    if (action) {
      query += ` AND al.action = ?`;
      params.push(action);
    }

    query += ` ORDER BY al.created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    db.all(query, params, (err, logs) => {
      if (err) {
        return res.status(500).json({ success: false, message: '查询审计日志失败', error: err.message });
      }

      res.json({ success: true, data: logs });
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '查询审计日志失败', error: error.message });
  }
});

router.post('/init-data', authMiddleware, roleMiddleware('operator'), async (req, res) => {
  try {
    await priceIndex.initializeDefaultRules();

    const centers = [
      { id: 'center-001', name: '城东集散中心', address: '东城区环保路100号', latitude: 39.91, longitude: 116.41 },
      { id: 'center-002', name: '城西集散中心', address: '西城区回收街88号', latitude: 39.92, longitude: 116.35 },
      { id: 'center-003', name: '城南集散中心', address: '南城区绿色大道66号', latitude: 39.86, longitude: 116.39 }
    ];

    for (const center of centers) {
      db.run(
        `INSERT OR IGNORE INTO centers (id, name, address, latitude, longitude)
         VALUES (?, ?, ?, ?, ?)`,
        [center.id, center.name, center.address, center.latitude, center.longitude]
      );
    }

    res.json({
      success: true,
      message: '初始化数据完成',
      data: {
        price_rules_initialized: true,
        centers_added: centers.length
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '初始化数据失败', error: error.message });
  }
});

module.exports = router;
