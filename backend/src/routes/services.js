const express = require('express');
const db = require('../database/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/local', authenticateToken, (req, res) => {
  const { province, city } = req.query;

  const defaultServices = [
    {
      id: 101,
      service_code: 'subsidy_coal_to_electric',
      name: '煤改电补贴申领',
      description: '农村地区清洁取暖煤改电财政补贴申请',
      icon: 'subsidy',
      category: 'subsidy',
      region_available: ['北京市', '天津市', '河北省', '山西省', '山东省', '河南省'],
      sort_order: 1,
      status: 'active',
      requirement: '已完成煤改电改造，采暖季用电量达标',
      process_days: 15,
      max_amount: 1200
    },
    {
      id: 102,
      service_code: 'pv_grid_application',
      name: '光伏并网申请',
      description: '家庭分布式光伏发电项目并网受理',
      icon: 'pv_application',
      category: 'grid',
      region_available: null,
      sort_order: 2,
      status: 'active',
      requirement: '拥有合法屋顶产权，装机容量不超过50kW',
      process_days: 7,
      max_amount: null
    },
    {
      id: 103,
      service_code: 'charging_pile_application',
      name: '充电桩报装',
      description: '居民小区个人充电桩用电报装',
      icon: 'charging_pile',
      category: 'grid',
      region_available: null,
      sort_order: 3,
      status: 'active',
      requirement: '拥有固定车位，物业同意安装证明',
      process_days: 5,
      max_amount: null
    },
    {
      id: 104,
      service_code: 'energy_diagnosis',
      name: '免费能源诊断',
      description: '专业团队上门开展家庭用能分析与节能建议',
      icon: 'energy_diagnosis',
      category: 'service',
      region_available: ['上海市', '江苏省', '浙江省', '广东省'],
      sort_order: 4,
      status: 'active',
      requirement: '年度用电量超过3000度',
      process_days: 10,
      max_amount: null
    },
    {
      id: 105,
      service_code: 'capacity_expansion',
      name: '用电容量增容',
      description: '居民住宅用电容量升级申请',
      icon: 'capacity_expansion',
      category: 'grid',
      region_available: null,
      sort_order: 5,
      status: 'active',
      requirement: '现有容量不足，需提供房产证明',
      process_days: 3,
      max_amount: null
    },
    {
      id: 106,
      service_code: 'pv_subsidy',
      name: '光伏补贴查询',
      description: '分布式光伏发电国家补贴发放进度查询',
      icon: 'subsidy',
      category: 'subsidy',
      region_available: null,
      sort_order: 6,
      status: 'active',
      requirement: '已并网光伏用户',
      process_days: 1,
      max_amount: null
    }
  ];

  const userProvince = province || req.user.province || '北京市';
  const filteredServices = defaultServices.filter(s =>
    s.region_available === null || s.region_available.includes(userProvince)
  );

  db.all('SELECT * FROM local_services WHERE is_active = 1', (err, dbServices) => {
    const allServices = [...(dbServices || []), ...filteredServices];
    res.json({
      user_region: userProvince,
      region_services_count: filteredServices.length,
      total_services_count: defaultServices.length,
      services: filteredServices
    });
  });
});

router.get('/outage-plans', authenticateToken, (req, res) => {
  const { province, city, district } = req.query;

  let sql = 'SELECT * FROM power_outage_plans WHERE 1=1';
  let params = [];

  if (province) {
    sql += ' AND province = ?';
    params.push(province);
  }

  if (city) {
    sql += ' AND city = ?';
    params.push(city);
  }

  if (district) {
    sql += ' AND district = ?';
    params.push(district);
  }

  sql += ' ORDER BY start_time ASC';

  db.all(sql, params, (err, plans) => {
    if (err) {
      return res.status(500).json({ error: '服务器错误' });
    }
    res.json(plans);
  });
});

router.post('/outage-subscribe', authenticateToken, (req, res) => {
  const { province, city, district } = req.body;

  db.run(
    'INSERT OR REPLACE INTO outage_subscriptions (user_id, province, city, district, is_active) VALUES (?, ?, ?, ?, 1)',
    [req.user.id, province, city, district],
    function (err) {
      if (err) {
        return res.status(500).json({ error: '订阅失败' });
      }
      res.json({ message: '订阅成功' });
    }
  );
});

router.get('/warnings', authenticateToken, (req, res) => {
  const { unread_only } = req.query;

  let sql = 'SELECT * FROM warning_records WHERE user_id = ?';
  let params = [req.user.id];

  if (unread_only === 'true') {
    sql += ' AND is_read = 0';
  }

  sql += ' ORDER BY created_at DESC LIMIT 50';

  db.all(sql, params, (err, warnings) => {
    if (err) {
      return res.status(500).json({ error: '服务器错误' });
    }
    res.json(warnings);
  });
});

router.put('/warnings/:id/read', authenticateToken, (req, res) => {
  db.run(
    'UPDATE warning_records SET is_read = 1 WHERE id = ? AND user_id = ?',
    [req.params.id, req.user.id],
    function (err) {
      if (err) {
        return res.status(500).json({ error: '操作失败' });
      }
      res.json({ message: '标记成功' });
    }
  );
});

router.get('/subscriptions/status', authenticateToken, (req, res) => {
  db.get(
    'SELECT * FROM outage_subscriptions WHERE user_id = ?',
    [req.user.id],
    (err, subscription) => {
      res.json({
        outage_subscribed: subscription?.is_active === 1,
        subscription_info: subscription || null,
        warning_enabled: true,
        business_env_submitted: false,
        last_warning_check: new Date().toISOString()
      });
    }
  );
});

router.get('/business-env/reports', authenticateToken, (req, res) => {
  const reports = [
    {
      id: 1,
      report_type: '营商环境满意度调查',
      period: '2026年第1季度',
      status: 'not_submitted',
      deadline: '2026-06-30',
      submitted_at: null
    },
    {
      id: 2,
      report_type: '获得电力便利化评估',
      period: '2026年上半年',
      status: 'not_submitted',
      deadline: '2026-07-15',
      submitted_at: null
    },
    {
      id: 3,
      report_type: '用户满意度回访',
      period: '2026年5月',
      status: 'submitted',
      deadline: '2026-05-31',
      submitted_at: '2026-05-28 10:30:00'
    }
  ];

  res.json({
    total: reports.length,
    pending_count: reports.filter(r => r.status === 'not_submitted').length,
    reports
  });
});

router.post('/business-env/submit', authenticateToken, (req, res) => {
  const { report_id, answers } = req.body;

  res.json({
    message: '报送成功',
    report_id,
    submitted_at: new Date().toISOString(),
    points_earned: 50
  });
});

router.get('/analysis/usage-trend', authenticateToken, (req, res) => {
  const { account_id, days = 30 } = req.query;

  if (!account_id) {
    return res.status(400).json({ error: '请选择户号' });
  }

  db.get('SELECT id FROM accounts WHERE id = ? AND user_id = ?', [account_id, req.user.id], (err, account) => {
    if (err || !account) {
      return res.status(404).json({ error: '户号不存在' });
    }

    db.all(
      `SELECT 
        date, kwh, amount,
        LAG(kwh, 7) OVER (ORDER BY date) as week_ago_kwh
       FROM usage_records 
       WHERE account_id = ? 
       ORDER BY date DESC 
       LIMIT ?`,
      [account_id, parseInt(days)],
      (err, records) => {
        if (err) {
          return res.status(500).json({ error: '服务器错误' });
        }

        const totalKwh = records.reduce((sum, r) => sum + r.kwh, 0);
        const totalAmount = records.reduce((sum, r) => sum + (r.amount || 0), 0);
        const avgKwh = totalKwh / records.length;

        let abnormalCount = 0;
        records.forEach((r, i) => {
          if (r.week_ago_kwh && r.kwh > r.week_ago_kwh * 1.5) {
            abnormalCount++;
          }
        });

        res.json({
          records,
          summary: {
            total_kwh: totalKwh.toFixed(2),
            total_amount: totalAmount.toFixed(2),
            avg_kwh: avgKwh.toFixed(2),
            abnormal_count: abnormalCount
          }
        });
      }
    );
  });
});

module.exports = router;
