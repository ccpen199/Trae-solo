import { Router } from 'express';
import db from '../db.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

router.get('/', (req, res) => {
  const { status, engineer_id } = req.query;
  let sql = `
    SELECT s.*, u.name as engineer_name, u.area as engineer_area
    FROM settlements s
    LEFT JOIN users u ON s.engineer_id = u.id
    WHERE 1=1
  `;
  const params = [];

  if (status) {
    sql += ' AND s.status = ?';
    params.push(status);
  }
  if (engineer_id) {
    sql += ' AND s.engineer_id = ?';
    params.push(engineer_id);
  }

  sql += ' ORDER BY s.created_at DESC';
  const settlements = db.prepare(sql).all(...params);
  res.json(settlements);
});

router.post('/generate', roleMiddleware(['finance', 'dispatcher']), (req, res) => {
  const { engineer_id, period_start, period_end, area, service_type } = req.body;
  if (!period_start || !period_end) {
    return res.status(400).json({ error: '结算周期起止日期不能为空' });
  }

  let engineerFilter = '';
  const params = [period_start, period_end];

  if (engineer_id) {
    engineerFilter = ' AND wo.id IN (SELECT order_id FROM dispatch_records WHERE engineer_id = ?)';
    params.push(engineer_id);
  }

  if (area) {
    engineerFilter += ' AND wo.id IN (SELECT order_id FROM dispatch_records dr JOIN users u ON dr.engineer_id = u.id WHERE u.area LIKE ? AND dr.status = ?)';
    params.push(`%${area}%`, 'accepted');
  }

  if (service_type) {
    engineerFilter += ' AND wo.service_type = ?';
    params.push(service_type);
  }

  const orders = db.prepare(`
    SELECT wo.id, wo.service_type
    FROM work_orders wo
    WHERE wo.status = 'completed'
      AND wo.updated_at >= ? AND wo.updated_at <= ?
      ${engineerFilter}
  `).all(...params);

  if (orders.length === 0) {
    return res.status(400).json({ error: '指定条件下无已完成工单' });
  }

  const engineerIds = new Set();
  for (const order of orders) {
    const dr = db.prepare("SELECT engineer_id FROM dispatch_records WHERE order_id = ? AND status = 'accepted'").get(order.id);
    if (dr) engineerIds.add(dr.engineer_id);
  }

  const results = [];
  const transaction = db.transaction(() => {
    for (const eid of engineerIds) {
      const engineerOrders = orders.filter(o => {
        const dr = db.prepare("SELECT engineer_id FROM dispatch_records WHERE order_id = ? AND status = 'accepted' AND engineer_id = ?").get(o.id, eid);
        return !!dr;
      });

      let laborIncome = 0;
      let partsIncome = 0;
      let travelIncome = 0;

      for (const o of engineerOrders) {
        const quote = db.prepare('SELECT * FROM cost_quotes WHERE order_id = ? AND status = ?').get(o.id, 'confirmed');
        if (quote) {
          laborIncome += quote.labor_cost || 0;
          partsIncome += quote.parts_cost || 0;
          travelIncome += quote.travel_cost || 0;
        }
      }

      const travelSubsidy = Math.round(travelIncome * 0.1 * 100) / 100;
      const otherSubsidy = 0;
      const total = laborIncome + partsIncome + travelSubsidy + otherSubsidy;

      const result = db.prepare(`
        INSERT INTO settlements (engineer_id, period_start, period_end, order_count, labor_income, parts_income, travel_subsidy, other_subsidy, total_income)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(eid, period_start, period_end, engineerOrders.length, laborIncome, partsIncome, travelSubsidy, otherSubsidy, total);

      const settlement = db.prepare(`
        SELECT s.*, u.name as engineer_name
        FROM settlements s
        LEFT JOIN users u ON s.engineer_id = u.id
        WHERE s.id = ?
      `).get(result.lastInsertRowid);
      results.push(settlement);
    }
  });

  try {
    transaction();
    res.status(201).json(results);
  } catch (err) {
    res.status(500).json({ error: '生成结算失败' });
  }
});

router.get('/report', roleMiddleware(['finance', 'dispatcher']), (req, res) => {
  const { period_start, period_end, group_by } = req.query;

  let dateFilter = '';
  const params = [];
  if (period_start && period_end) {
    dateFilter = ' AND s.period_start >= ? AND s.period_end <= ?';
    params.push(period_start, period_end);
  }

  if (group_by === 'engineer') {
    const report = db.prepare(`
      SELECT s.engineer_id, u.name as engineer_name, u.area,
        COUNT(s.id) as settlement_count,
        SUM(s.order_count) as total_orders,
        SUM(s.labor_income) as total_labor,
        SUM(s.parts_income) as total_parts,
        SUM(s.travel_subsidy) as total_travel,
        SUM(s.total_income) as total_income
      FROM settlements s
      LEFT JOIN users u ON s.engineer_id = u.id
      WHERE 1=1 ${dateFilter}
      GROUP BY s.engineer_id
      ORDER BY total_income DESC
    `).all(...params);
    return res.json({ group_by: 'engineer', data: report });
  }

  if (group_by === 'area') {
    const report = db.prepare(`
      SELECT u.area,
        COUNT(s.id) as settlement_count,
        SUM(s.order_count) as total_orders,
        SUM(s.labor_income) as total_labor,
        SUM(s.parts_income) as total_parts,
        SUM(s.travel_subsidy) as total_travel,
        SUM(s.total_income) as total_income
      FROM settlements s
      LEFT JOIN users u ON s.engineer_id = u.id
      WHERE 1=1 ${dateFilter}
      GROUP BY u.area
      ORDER BY total_income DESC
    `).all(...params);
    return res.json({ group_by: 'area', data: report });
  }

  if (group_by === 'parts') {
    const report = db.prepare(`
      SELECT pu.part_name, pu.part_code,
        SUM(pu.quantity) as total_quantity,
        SUM(pu.total_price) as total_cost
      FROM parts_usage pu
      LEFT JOIN service_records sr ON pu.service_record_id = sr.id
      LEFT JOIN work_orders wo ON sr.order_id = wo.id
      WHERE wo.status = 'completed'
        ${period_start && period_end ? ' AND wo.updated_at >= ? AND wo.updated_at <= ?' : ''}
      GROUP BY pu.part_code
      ORDER BY total_cost DESC
    `).all(...params);
    return res.json({ group_by: 'parts', data: report });
  }

  const summary = db.prepare(`
    SELECT COUNT(DISTINCT s.engineer_id) as engineer_count,
      SUM(s.order_count) as total_orders,
      SUM(s.labor_income) as total_labor,
      SUM(s.parts_income) as total_parts,
      SUM(s.travel_subsidy) as total_travel,
      SUM(s.total_income) as total_income
    FROM settlements s
    WHERE 1=1 ${dateFilter}
  `).get(...params);

  res.json({ group_by: 'summary', data: summary });
});

router.patch('/:id/confirm', roleMiddleware(['finance']), (req, res) => {
  const { status } = req.body;
  if (!['confirmed', 'paid'].includes(status)) {
    return res.status(400).json({ error: '状态必须为 confirmed 或 paid' });
  }

  const settlement = db.prepare('SELECT * FROM settlements WHERE id = ?').get(req.params.id);
  if (!settlement) {
    return res.status(404).json({ error: '结算记录不存在' });
  }
  if (settlement.status === 'paid') {
    return res.status(400).json({ error: '已支付的结算不能更改状态' });
  }
  if (status === 'paid' && settlement.status !== 'confirmed') {
    return res.status(400).json({ error: '请先确认后再标记为已支付' });
  }

  try {
    db.prepare(`
      UPDATE settlements SET status = ?, confirmed_by = ?, confirmed_at = datetime('now')
      WHERE id = ?
    `).run(status, req.user.id, req.params.id);

    const updated = db.prepare(`
      SELECT s.*, u.name as engineer_name
      FROM settlements s
      LEFT JOIN users u ON s.engineer_id = u.id
      WHERE s.id = ?
    `).get(req.params.id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: '确认结算失败' });
  }
});

export default router;
