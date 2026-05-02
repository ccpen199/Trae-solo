const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const { authenticateToken, requireOwnerOrInvestor } = require('../middleware/auth');
const { createStationValidation, updateStationValidation, stationIdParamValidation, paginationValidation } = require('../middleware/validation');
const AuditService = require('../services/audit.service');
const PREfficiencyEngine = require('../engines/pr-efficiency.engine');

router.get('/', authenticateToken, paginationValidation, (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const totalResult = db.prepare('SELECT COUNT(*) as count FROM stations').get();
    const total = totalResult.count;

    const stations = db.prepare(`
      SELECT s.*, 
             (SELECT COUNT(*) FROM inverters WHERE station_id = s.id) as inverter_count,
             (SELECT COUNT(*) FROM faults WHERE station_id = s.id AND status NOT IN ('resolved', 'false_alarm')) as active_fault_count,
             o.name as owner_name,
             inv.name as investor_name
      FROM stations s
      LEFT JOIN users o ON s.owner_id = o.id
      LEFT JOIN users inv ON s.investor_id = inv.id
      ORDER BY s.created_at DESC
      LIMIT ? OFFSET ?
    `).all(parseInt(limit), offset);

    res.json({
      data: stations,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error('Get stations error:', err);
    res.status(500).json({ error: '获取电站列表失败' });
  }
});

router.get('/map', authenticateToken, (req, res) => {
  try {
    const stations = db.prepare(`
      SELECT s.id, s.name, s.code, s.latitude, s.longitude, 
             s.capacity_kw, s.status, s.health_level,
             (SELECT COUNT(*) FROM faults WHERE station_id = s.id AND status NOT IN ('resolved', 'false_alarm')) as active_faults,
             (SELECT SUM(actual_generation_kwh) FROM generation_records 
              WHERE station_id = s.id AND record_date = date('now')) as today_generation
      FROM stations s
      WHERE s.status = 'operating'
    `).all();

    res.json({ data: stations });
  } catch (err) {
    console.error('Get stations map error:', err);
    res.status(500).json({ error: '获取电站地图数据失败' });
  }
});

router.get('/:stationId', authenticateToken, stationIdParamValidation, (req, res) => {
  try {
    const { stationId } = req.params;

    const station = db.prepare(`
      SELECT s.*, 
             o.name as owner_name,
             inv.name as investor_name
      FROM stations s
      LEFT JOIN users o ON s.owner_id = o.id
      LEFT JOIN users inv ON s.investor_id = inv.id
      WHERE s.id = ?
    `).get(stationId);

    if (!station) {
      return res.status(404).json({ error: '电站不存在' });
    }

    const inverters = db.prepare(`
      SELECT * FROM inverters WHERE station_id = ?
    `).all(stationId);

    const efficiencyTrend = PREfficiencyEngine.getStationEfficiencyTrend(stationId, 30);

    res.json({
      station,
      inverters,
      efficiency_trend: efficiencyTrend
    });
  } catch (err) {
    console.error('Get station error:', err);
    res.status(500).json({ error: '获取电站详情失败' });
  }
});

router.post('/', authenticateToken, requireOwnerOrInvestor, createStationValidation, (req, res) => {
  try {
    const { name, code, capacity_kw, address, latitude, longitude, installed_date, status, pr_target } = req.body;

    const existing = db.prepare('SELECT id FROM stations WHERE code = ?').get(code);
    if (existing) {
      return res.status(400).json({ error: '电站编号已存在' });
    }

    const id = uuidv4();
    const ownerId = req.user.role === 'admin' ? req.user.id : req.user.id;

    db.prepare(`
      INSERT INTO stations (
        id, name, code, capacity_kw, address, latitude, longitude,
        installed_date, owner_id, status, pr_target
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, name, code, capacity_kw, address, latitude, longitude,
      installed_date, ownerId, status || 'operating', pr_target || 0.85
    );

    const newStation = db.prepare('SELECT * FROM stations WHERE id = ?').get(id);
    AuditService.logCreate(req, 'station', 'station', id, newStation, '创建新电站');

    res.status(201).json({ message: '电站创建成功', station: newStation });
  } catch (err) {
    console.error('Create station error:', err);
    res.status(500).json({ error: '创建电站失败' });
  }
});

router.put('/:stationId', authenticateToken, requireOwnerOrInvestor, updateStationValidation, (req, res) => {
  try {
    const { stationId } = req.params;
    const { name, capacity_kw, status, health_level } = req.body;

    const oldStation = db.prepare('SELECT * FROM stations WHERE id = ?').get(stationId);
    if (!oldStation) {
      return res.status(404).json({ error: '电站不存在' });
    }

    db.prepare(`
      UPDATE stations SET
        name = COALESCE(?, name),
        capacity_kw = COALESCE(?, capacity_kw),
        status = COALESCE(?, status),
        health_level = COALESCE(?, health_level),
        updated_at = datetime('now')
      WHERE id = ?
    `).run(name, capacity_kw, status, health_level, stationId);

    const updatedStation = db.prepare('SELECT * FROM stations WHERE id = ?').get(stationId);
    AuditService.logUpdate(req, 'station', 'station', stationId, oldStation, updatedStation, '更新电站信息');

    res.json({ message: '电站更新成功', station: updatedStation });
  } catch (err) {
    console.error('Update station error:', err);
    res.status(500).json({ error: '更新电站失败' });
  }
});

router.get('/:stationId/efficiency', authenticateToken, (req, res) => {
  try {
    const { stationId } = req.params;
    const { days = 30 } = req.query;

    const trend = PREfficiencyEngine.getStationEfficiencyTrend(stationId, parseInt(days));
    const station = db.prepare('SELECT name, capacity_kw, pr_target FROM stations WHERE id = ?').get(stationId);

    if (!station) {
      return res.status(404).json({ error: '电站不存在' });
    }

    const avgPR = trend.length > 0 
      ? trend.reduce((sum, t) => sum + (t.pr_value || 0), 0) / trend.length 
      : station.pr_target;

    res.json({
      station: {
        id: stationId,
        name: station.name,
        capacity_kw: station.capacity_kw,
        pr_target: station.pr_target
      },
      current_avg_pr: avgPR,
      efficiency_trend: trend
    });
  } catch (err) {
    console.error('Get efficiency error:', err);
    res.status(500).json({ error: '获取效率数据失败' });
  }
});

module.exports = router;
