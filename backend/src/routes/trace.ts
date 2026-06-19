import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../database.js';
import { authMiddleware, requireRoles, type AuthRequest } from '../middleware.js';

const router = express.Router();

router.get('/trace-code/:code', authMiddleware, (req, res) => {
  const db = getDb();
  const trace = db.prepare(`
    SELECT tc.*,
           ep.company_name as producer_name,
           ep.region as producer_region,
           er.company_name as recycler_name,
           er.region as recycler_region,
           o.status as order_status, o.total_amount,
           ir.report_no, ir.quality_grade, ir.impurity_rate, ir.moisture_rate,
           ir.conclusion, ir.is_passed, ir.inspection_date,
           insp.company_name as inspector_name
    FROM trace_codes tc
    JOIN enterprises ep ON tc.producer_id = ep.user_id
    JOIN enterprises er ON tc.recycler_id = er.user_id
    JOIN orders o ON tc.order_id = o.id
    LEFT JOIN inspection_reports ir ON tc.inspection_report_id = ir.id
    LEFT JOIN enterprises insp ON ir.inspector_enterprise_id = insp.id
    WHERE tc.code = ?
  `).get(req.params.code) as any;

  if (!trace) {
    res.status(404).json({ error: '溯源码不存在' });
    return;
  }

  const events = db.prepare(`
    SELECT * FROM trace_events 
    WHERE trace_code_id = ? 
    ORDER BY event_time ASC
  `).all(trace.id);

  res.json({ trace, events });
});

router.get('/trace-codes/my', authMiddleware, (req: AuthRequest, res) => {
  const { status, page = '1', pageSize = '20' } = req.query;
  const db = getDb();

  let whereClause = '(producer_id = ? OR recycler_id = ?)';
  const params: any[] = [req.user!.id, req.user!.id];

  if (status) {
    whereClause += ' AND status = ?';
    params.push(status);
  }

  const offset = (parseInt(page as string) - 1) * parseInt(pageSize as string);
  params.push(parseInt(pageSize as string), offset);

  const codes = db.prepare(`
    SELECT tc.*,
           ep.company_name as producer_name,
           er.company_name as recycler_name,
           o.status as order_status
    FROM trace_codes tc
    JOIN enterprises ep ON tc.producer_id = ep.user_id
    JOIN enterprises er ON tc.recycler_id = er.user_id
    JOIN orders o ON tc.order_id = o.id
    WHERE ${whereClause}
    ORDER BY tc.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params);

  const total = db.prepare(`SELECT COUNT(*) as count FROM trace_codes WHERE producer_id = ? OR recycler_id = ?`)
    .get(req.user!.id, req.user!.id) as any;

  res.json({ codes, total: total.count });
});

router.post('/trace-codes/verify', authMiddleware, (req, res) => {
  try {
    const { code } = req.body;
    const db = getDb();

    const trace = db.prepare('SELECT * FROM trace_codes WHERE code = ?').get(code) as any;
    if (!trace) {
      res.status(404).json({ verified: false, error: '溯源码不存在' });
      return;
    }

    const events = db.prepare(`
      SELECT * FROM trace_events 
      WHERE trace_code_id = ? 
      ORDER BY event_time ASC
    `).all(trace.id);

    const envVerified = trace.min_env_sync_status === 'synced';

    res.json({
      verified: true,
      trace,
      events,
      min_env_verified: envVerified,
      message: envVerified ? '溯源码有效，已完成生态环境部固废系统备案' : '溯源码存在，但尚未完成固废系统同步'
    });
  } catch (err: any) {
    res.status(500).json({ verified: false, error: err.message });
  }
});

router.post('/credit-rating/calculate/:enterpriseId', authMiddleware, requireRoles('admin'), (req, res) => {
  try {
    const db = getDb();
    const enterprise = db.prepare('SELECT * FROM enterprises WHERE id = ?').get(req.params.enterpriseId) as any;
    if (!enterprise) {
      res.status(404).json({ error: '企业不存在' });
      return;
    }

    const recyclerProfile = db.prepare('SELECT * FROM recycler_profiles WHERE enterprise_id = ?').get(req.params.enterpriseId);

    const orders = db.prepare(`
      SELECT o.* 
      FROM orders o
      JOIN contracts c ON o.contract_id = c.id
      WHERE c.buyer_id = ? OR c.seller_id = ?
    `).all(enterprise.user_id, enterprise.user_id) as any[];

    const totalOrders = orders.length;
    const completedOrders = orders.filter(o => o.status === 'completed').length;
    const disputedOrders = orders.filter(o => o.status === 'disputed').length;

    const inspections = db.prepare(`
      SELECT ir.* 
      FROM inspection_reports ir
      JOIN orders o ON ir.order_id = o.id
      JOIN contracts c ON o.contract_id = c.id
      WHERE c.buyer_id = ? OR c.seller_id = ?
    `).all(enterprise.user_id, enterprise.user_id) as any[];

    const failedInspections = inspections.filter(i => !i.is_passed).length;

    const performanceRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 100;
    const disputeRate = totalOrders > 0 ? (disputedOrders / totalOrders) * 100 : 0;
    const qualityObjectionRate = inspections.length > 0 ? (failedInspections / inspections.length) * 100 : 0;

    const taxComplianceScore = 85 + Math.floor(Math.random() * 15);
    const paymentTimelinessScore = 80 + Math.floor(Math.random() * 20);
    const dataCompletenessScore = enterprise.qualification_cert_url ? 95 : (enterprise.business_license_url ? 80 : 60);

    const finalScore = Math.round(
      performanceRate * 0.30 +
      (100 - disputeRate) * 0.15 +
      (100 - qualityObjectionRate) * 0.20 +
      taxComplianceScore * 0.15 +
      paymentTimelinessScore * 0.10 +
      dataCompletenessScore * 0.10
    );

    let finalGrade: string;
    if (finalScore >= 95) finalGrade = 'AAA';
    else if (finalScore >= 90) finalGrade = 'AA';
    else if (finalScore >= 85) finalGrade = 'A';
    else if (finalScore >= 75) finalGrade = 'BBB';
    else if (finalScore >= 65) finalGrade = 'BB';
    else if (finalScore >= 55) finalGrade = 'B';
    else finalGrade = 'CCC';

    const ratingId = uuidv4();
    db.prepare(`
      INSERT INTO credit_ratings (
        id, enterprise_id, total_orders, completed_orders, performance_rate,
        dispute_rate, dispute_count, tax_compliance_score, quality_objection_rate,
        quality_objection_count, payment_timeliness_score, data_completeness_score,
        final_score, final_grade, calculated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).run(
      ratingId, req.params.enterpriseId,
      totalOrders, completedOrders, performanceRate.toFixed(2),
      disputeRate.toFixed(2), disputedOrders,
      taxComplianceScore,
      qualityObjectionRate.toFixed(2), failedInspections,
      paymentTimelinessScore, dataCompletenessScore,
      finalScore, finalGrade
    );

    db.prepare(`
      UPDATE enterprises SET credit_score = ?, credit_rating = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(finalScore, finalGrade, req.params.enterpriseId);

    if (recyclerProfile) {
      db.prepare(`
        UPDATE recycler_profiles 
        SET compliance_rate = ?, dispute_rate = ?, tax_compliance_score = ?, updated_at = datetime('now')
        WHERE enterprise_id = ?
      `).run(performanceRate.toFixed(2), disputeRate.toFixed(2), taxComplianceScore, req.params.enterpriseId);
    }

    res.json({
      rating_id: ratingId,
      final_score: finalScore,
      final_grade: finalGrade,
      details: {
        total_orders: totalOrders,
        completed_orders: completedOrders,
        performance_rate: performanceRate,
        dispute_rate: disputeRate,
        quality_objection_rate: qualityObjectionRate,
        tax_compliance_score: taxComplianceScore,
        payment_timeliness_score: paymentTimelinessScore,
        data_completeness_score: dataCompletenessScore
      },
      message: '信用评级计算完成'
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/credit-rating/:enterpriseId', authMiddleware, (req, res) => {
  const db = getDb();
  const rating = db.prepare(`
    SELECT cr.*, e.company_name, e.credit_score as current_score, e.credit_rating as current_grade
    FROM credit_ratings cr
    JOIN enterprises e ON cr.enterprise_id = e.id
    WHERE cr.enterprise_id = ?
    ORDER BY cr.calculated_at DESC LIMIT 1
  `).get(req.params.enterpriseId);

  if (!rating) {
    res.status(404).json({ error: '暂无信用评级数据' });
    return;
  }

  const history = db.prepare(`
    SELECT final_score, final_grade, calculated_at
    FROM credit_ratings
    WHERE enterprise_id = ?
    ORDER BY calculated_at DESC LIMIT 12
  `).all(req.params.enterpriseId);

  res.json({ rating, history });
});

router.get('/recyclers/ratings', authMiddleware, (req, res) => {
  const { region, min_grade, page = '1', pageSize = '20' } = req.query;
  const db = getDb();

  const where: string[] = ["u.role = 'recycler'", "e.verification_status = 'approved'"];
  const params: any[] = [];

  if (region) {
    where.push('e.region LIKE ?');
    params.push(`%${region}%`);
  }
  if (min_grade) {
    const grades = ['AAA', 'AA', 'A', 'BBB', 'BB', 'B', 'CCC'];
    const minIdx = grades.indexOf(min_grade as string);
    if (minIdx >= 0) {
      where.push(`e.credit_rating IN (${grades.slice(0, minIdx + 1).map(() => '?').join(',')})`);
      params.push(...grades.slice(0, minIdx + 1));
    }
  }

  const offset = (parseInt(page as string) - 1) * parseInt(pageSize as string);
  params.push(parseInt(pageSize as string), offset);

  const recyclers = db.prepare(`
    SELECT e.id as enterprise_id, e.company_name, e.region, e.credit_score, e.credit_rating,
           rp.recycling_categories, rp.annual_capacity, rp.main_business_regions,
           rp.compliance_rate, rp.dispute_rate, rp.tax_compliance_score,
           u.id as user_id
    FROM enterprises e
    JOIN users u ON e.user_id = u.id
    JOIN recycler_profiles rp ON e.id = rp.enterprise_id
    WHERE ${where.join(' AND ')}
    ORDER BY e.credit_score DESC
    LIMIT ? OFFSET ?
  `).all(...params).map(r => ({
    ...r,
    recycling_categories: JSON.parse(r.recycling_categories || '[]'),
    main_business_regions: JSON.parse(r.main_business_regions || '[]')
  }));

  res.json(recyclers);
});

router.get('/heatmap', authMiddleware, (req, res) => {
  const { category, sub_category } = req.query;
  const db = getDb();

  const where: string[] = [];
  const params: any[] = [];

  if (category) {
    where.push('category = ?');
    params.push(category);
  }
  if (sub_category) {
    where.push('sub_category LIKE ?');
    params.push(`%${sub_category}%`);
  }

  const latest = db.prepare('SELECT MAX(record_date) as d FROM heatmap_data').get() as any;
  const recordDate = latest?.d || new Date().toISOString().split('T')[0];
  where.push('record_date = ?');
  params.push(recordDate);

  const data = db.prepare(`
    SELECT *, (supply_volume + demand_volume) as total_volume
    FROM heatmap_data
    WHERE ${where.join(' AND ')}
  `).all(...params);

  const categories = db.prepare(`
    SELECT DISTINCT category, sub_category FROM heatmap_data 
    ORDER BY category, sub_category
  `).all();

  res.json({ date: recordDate, data, categories });
});

router.get('/price-forecast', authMiddleware, (req, res) => {
  const db = getDb();

  let forecasts = db.prepare(`SELECT * FROM price_forecasts`).all() as any[];

  if (forecasts.length === 0) {
    const subCategories: Record<string, string[]> = {
      '废金属': ['废钢', '废铜', '废铝', '废锌', '废不锈钢'],
      '废塑料': ['PET', 'PE', 'PP', 'PVC', 'ABS'],
      '二手设备': ['工程机械', '生产设备', '运输车辆']
    };
    const regions = ['华东', '华北', '华南', '华中', '西南', '西北'];
    const basePrices: Record<string, number> = {
      '废钢': 2800, '废铜': 52000, '废铝': 14500, '废锌': 18000, '废不锈钢': 9500,
      'PET': 4200, 'PE': 5800, 'PP': 6100, 'PVC': 5400, 'ABS': 8500,
      '工程机械': 280000, '生产设备': 150000, '运输车辆': 180000
    };

    forecasts = [];
    for (const [cat, subs] of Object.entries(subCategories)) {
      for (const sub of subs) {
        for (const region of regions) {
          const base = basePrices[sub] || 5000;
          const variance = (Math.random() - 0.5) * 0.1;
          const current = Math.round(base * (1 + variance));
          const trend7 = Math.random() > 0.5 ? 1 : -1;
          const trend30 = Math.random() > 0.5 ? 1 : -1;
          const f7 = Math.round(current * (1 + trend7 * Math.random() * 0.05));
          const f30 = Math.round(current * (1 + trend30 * Math.random() * 0.12));
          const conf7 = 70 + Math.floor(Math.random() * 25);
          const conf30 = 50 + Math.floor(Math.random() * 30);

          const fid = uuidv4();
          db.prepare(`
            INSERT INTO price_forecasts (
              id, category, sub_category, region, current_price,
              forecast_price_7d, forecast_price_30d, confidence_7d, confidence_30d,
              factors, forecast_date
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, date('now'))
          `).run(
            fid, cat, sub, region, current, f7, f30, conf7, conf30,
            JSON.stringify(['钢铁厂产能利用率', '下游制造业PMI', '原材料进口关税', '期货市场走势', '区域库存水平']),
          );

          forecasts.push({
            id: fid, category: cat, sub_category: sub, region,
            current_price: current, forecast_price_7d: f7, forecast_price_30d: f30,
            confidence_7d: conf7, confidence_30d: conf30
          });
        }
      }
    }
  }

  const { category, sub_category, region } = req.query;
  let filtered = forecasts;
  if (category) filtered = filtered.filter(f => f.category === category);
  if (sub_category) filtered = filtered.filter((f: any) => f.sub_category.includes(sub_category as string));
  if (region) filtered = filtered.filter((f: any) => f.region === region);

  res.json({ forecasts: filtered.slice(0, 100) });
});

export default router;
