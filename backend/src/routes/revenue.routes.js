const express = require('express');
const router = express.Router();
const db = require('../config/database');
const moment = require('moment');
const { authenticateToken, requireOwnerOrInvestor } = require('../middleware/auth');
const { settlementDateValidation, paginationValidation, stationIdParamValidation } = require('../middleware/validation');
const RevenueSplitEngine = require('../engines/revenue-split.engine');
const AuditService = require('../services/audit.service');

router.get('/settlements', authenticateToken, paginationValidation, (req, res) => {
  try {
    const { page = 1, limit = 20, station_id, start_date, end_date, status } = req.query;
    const offset = (page - 1) * limit;

    let whereClauses = ['1=1'];
    const params = [];

    if (station_id) {
      whereClauses.push('ds.station_id = ?');
      params.push(station_id);
    }
    if (start_date) {
      whereClauses.push('ds.settlement_date >= ?');
      params.push(start_date);
    }
    if (end_date) {
      whereClauses.push('ds.settlement_date <= ?');
      params.push(end_date);
    }
    if (status) {
      whereClauses.push('ds.status = ?');
      params.push(status);
    }

    if (req.user.role === 'investor') {
      whereClauses.push('s.investor_id = ?');
      params.push(req.user.id);
    }

    const countSql = `
      SELECT COUNT(*) as count 
      FROM daily_settlements ds
      JOIN stations s ON ds.station_id = s.id
      WHERE ${whereClauses.join(' AND ')}
    `;
    const totalResult = db.prepare(countSql).get(...params);
    const total = totalResult.count;

    const dataSql = `
      SELECT ds.*, 
             s.name as station_name,
             s.code as station_code
      FROM daily_settlements ds
      JOIN stations s ON ds.station_id = s.id
      WHERE ${whereClauses.join(' AND ')}
      ORDER BY ds.settlement_date DESC
      LIMIT ? OFFSET ?
    `;

    const settlements = db.prepare(dataSql).all(...params, parseInt(limit), offset);

    res.json({
      data: settlements,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error('Get settlements error:', err);
    res.status(500).json({ error: '获取结算记录失败' });
  }
});

router.get('/settlements/:settlementId', authenticateToken, (req, res) => {
  try {
    const { settlementId } = req.params;

    const settlement = db.prepare(`
      SELECT ds.*, 
             s.name as station_name,
             s.code as station_code,
             s.capacity_kw
      FROM daily_settlements ds
      JOIN stations s ON ds.station_id = s.id
      WHERE ds.id = ?
    `).get(settlementId);

    if (!settlement) {
      return res.status(404).json({ error: '结算记录不存在' });
    }

    const auditHistory = AuditService.getObjectHistory('daily_settlement', settlementId);

    res.json({
      settlement,
      audit_history: auditHistory
    });
  } catch (err) {
    console.error('Get settlement error:', err);
    res.status(500).json({ error: '获取结算详情失败' });
  }
});

router.post('/settlements/:stationId/generate', authenticateToken, requireOwnerOrInvestor, stationIdParamValidation, (req, res) => {
  try {
    const { stationId } = req.params;
    const { settlement_date } = req.body;

    const settlementDate = settlement_date || moment().subtract(1, 'days').format('YYYY-MM-DD');

    const settlement = RevenueSplitEngine.createDailySettlement(stationId, settlementDate);
    
    AuditService.logCreate(req, 'revenue', 'daily_settlement', settlement.id, settlement, '生成日结算');

    res.json({ message: '结算记录生成成功', settlement });
  } catch (err) {
    console.error('Generate settlement error:', err);
    res.status(400).json({ error: err.message });
  }
});

router.post('/settlements/:settlementId/confirm', authenticateToken, requireOwnerOrInvestor, (req, res) => {
  try {
    const { settlementId } = req.params;

    const oldSettlement = db.prepare('SELECT * FROM daily_settlements WHERE id = ?').get(settlementId);
    if (!oldSettlement) {
      return res.status(404).json({ error: '结算记录不存在' });
    }

    const updatedSettlement = RevenueSplitEngine.confirmSettlement(settlementId);
    
    AuditService.logSettle(req, settlementId, updatedSettlement);

    res.json({ message: '结算已确认', settlement: updatedSettlement });
  } catch (err) {
    console.error('Confirm settlement error:', err);
    res.status(400).json({ error: err.message });
  }
});

router.post('/settlements/batch-run', authenticateToken, requireOwnerOrInvestor, (req, res) => {
  try {
    const settlements = RevenueSplitEngine.runDailySettlementBatch();

    res.json({
      message: `批量结算完成，共处理 ${settlements.length} 条记录`,
      settlements
    });
  } catch (err) {
    console.error('Batch settlement error:', err);
    res.status(500).json({ error: '批量结算失败' });
  }
});

router.get('/investor/summary', authenticateToken, (req, res) => {
  try {
    const investorId = req.user.role === 'investor' ? req.user.id : req.query.investor_id;
    const { start_date, end_date, period_type = 'monthly' } = req.query;

    if (!investorId) {
      return res.status(400).json({ error: '需要指定投资人ID' });
    }

    const startDate = start_date || moment().subtract(3, 'months').format('YYYY-MM-DD');
    const endDate = end_date || moment().format('YYYY-MM-DD');

    const summary = RevenueSplitEngine.getInvestorRevenueSummary(
      investorId, startDate, endDate, period_type
    );

    res.json(summary);
  } catch (err) {
    console.error('Investor summary error:', err);
    res.status(500).json({ error: '获取投资人收益汇总失败' });
  }
});

router.get('/investor/irr', authenticateToken, (req, res) => {
  try {
    const { station_id } = req.query;

    if (!station_id) {
      const stations = db.prepare(`
        SELECT s.id, s.name, s.code, s.capacity_kw
        FROM stations s
        WHERE s.investor_id = ? OR ? IN ('admin', 'station_owner')
      `).all(req.user.id, req.user.role);

      const irrResults = [];
      for (const station of stations) {
        try {
          const irr = RevenueSplitEngine.calculateIRR(station.id);
          irrResults.push({
            station_id: station.id,
            station_name: station.name,
            station_code: station.code,
            capacity_kw: station.capacity_kw,
            irr_percent: irr.irr_percent,
            payback_period_months: irr.payback_period_months,
            total_expected_revenue: irr.total_expected_revenue
          });
        } catch (e) {
          console.error(`IRR calculation error for station ${station.id}:`, e);
        }
      }

      return res.json({
        investor_id: req.user.id,
        stations_count: irrResults.length,
        stations_irr: irrResults
      });
    }

    const station = db.prepare('SELECT * FROM stations WHERE id = ?').get(station_id);
    if (!station) {
      return res.status(404).json({ error: '电站不存在' });
    }

    const irr = RevenueSplitEngine.calculateIRR(station_id);
    const trend = RevenueSplitEngine.getIRRTrend(station_id, 12);

    res.json({
      station: {
        id: station.id,
        name: station.name,
        code: station.code,
        capacity_kw: station.capacity_kw
      },
      current_irr: irr,
      monthly_trend: trend
    });
  } catch (err) {
    console.error('IRR calculation error:', err);
    res.status(500).json({ error: 'IRR计算失败' });
  }
});

router.get('/dashboard/summary', authenticateToken, (req, res) => {
  try {
    const { station_id, days = 30 } = req.query;

    let stationCondition = '';
    const params = [];

    if (station_id) {
      stationCondition = 'AND station_id = ?';
      params.push(station_id);
    }

    const totalGeneration = db.prepare(`
      SELECT SUM(grid_generation_kwh) as total
      FROM daily_settlements
      WHERE settlement_date >= date('now', '-' || ? || ' days')
      ${stationCondition}
    `).get(parseInt(days), ...params);

    const totalRevenue = db.prepare(`
      SELECT SUM(total_revenue) as total
      FROM daily_settlements
      WHERE settlement_date >= date('now', '-' || ? || ' days')
      ${stationCondition}
    `).get(parseInt(days), ...params);

    const todayGeneration = db.prepare(`
      SELECT SUM(grid_generation_kwh) as total
      FROM daily_settlements
      WHERE settlement_date = date('now')
      ${stationCondition}
    `).get(...params);

    const pendingSettlements = db.prepare(`
      SELECT COUNT(*) as count
      FROM daily_settlements
      WHERE status = 'pending'
      ${stationCondition}
    `).get(...params);

    res.json({
      period_days: parseInt(days),
      total_generation_kwh: totalGeneration?.total || 0,
      total_revenue: totalRevenue?.total || 0,
      today_generation_kwh: todayGeneration?.total || 0,
      pending_settlements_count: pendingSettlements?.count || 0
    });
  } catch (err) {
    console.error('Revenue dashboard error:', err);
    res.status(500).json({ error: '获取收益看板数据失败' });
  }
});

module.exports = router;
