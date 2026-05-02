const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken, requireOwnerOrInvestor } = require('../middleware/auth');
const AssetValuationEngine = require('../engines/asset-valuation.engine');
const AuditService = require('../services/audit.service');

router.get('/valuations', authenticateToken, (req, res) => {
  try {
    const valuations = AssetValuationEngine.getAllStationValuations();
    res.json({ data: valuations });
  } catch (err) {
    console.error('Get valuations error:', err);
    res.status(500).json({ error: '获取估值记录失败' });
  }
});

router.get('/stations/:stationId/valuation', authenticateToken, stationIdParamValidation, (req, res) => {
  try {
    const { stationId } = req.params;

    const valuation = AssetValuationEngine.calculateAssetValue(stationId);
    
    res.json({ valuation });
  } catch (err) {
    console.error('Get valuation error:', err);
    res.status(400).json({ error: err.message });
  }
});

router.get('/stations/:stationId/quality', authenticateToken, stationIdParamValidation, (req, res) => {
  try {
    const { stationId } = req.params;

    const quality = AssetValuationEngine.evaluateStationQuality(stationId);
    
    res.json({ quality });
  } catch (err) {
    console.error('Get quality error:', err);
    res.status(400).json({ error: err.message });
  }
});

router.post('/stations/:stationId/report', authenticateToken, requireOwnerOrInvestor, stationIdParamValidation, (req, res) => {
  try {
    const { stationId } = req.params;

    const report = AssetValuationEngine.generateQualityReport(stationId);
    
    AuditService.logGenerateReport(req, stationId, report);

    res.json({ 
      message: '质量评估报告生成成功',
      report
    });
  } catch (err) {
    console.error('Generate report error:', err);
    res.status(400).json({ error: err.message });
  }
});

router.get('/stations/:stationId/history', authenticateToken, stationIdParamValidation, (req, res) => {
  try {
    const { stationId } = req.params;
    const { limit = 20 } = req.query;

    const history = db.prepare(`
      SELECT av.*, s.name as station_name
      FROM asset_valuations av
      JOIN stations s ON av.station_id = s.id
      WHERE av.station_id = ?
      ORDER BY av.valuation_date DESC
      LIMIT ?
    `).all(stationId, parseInt(limit));

    res.json({ history });
  } catch (err) {
    console.error('Get valuation history error:', err);
    res.status(500).json({ error: '获取估值历史失败' });
  }
});

router.get('/portfolio/summary', authenticateToken, requireOwnerOrInvestor, (req, res) => {
  try {
    let investorCondition = '';
    const params = [];

    if (req.user.role === 'investor') {
      investorCondition = 'AND s.investor_id = ?';
      params.push(req.user.id);
    } else if (req.user.role === 'station_owner') {
      investorCondition = 'AND s.owner_id = ?';
      params.push(req.user.id);
    }

    const stations = db.prepare(`
      SELECT s.id, s.name, s.code, s.capacity_kw, s.status, s.health_level
      FROM stations s
      WHERE 1=1 ${investorCondition}
    `).all(...params);

    const portfolio = {
      total_stations: stations.length,
      total_capacity_kw: 0,
      total_estimated_value: 0,
      avg_health_score: 0,
      stations: []
    };

    let totalHealthScore = 0;
    let healthCount = 0;

    for (const station of stations) {
      try {
        const valuation = AssetValuationEngine.calculateAssetValue(station.id);
        
        portfolio.total_capacity_kw += station.capacity_kw;
        portfolio.total_estimated_value += valuation.estimated_market_value;
        
        if (valuation.health_score !== undefined) {
          totalHealthScore += valuation.health_score;
          healthCount++;
        }

        portfolio.stations.push({
          station_id: station.id,
          station_name: station.name,
          station_code: station.code,
          capacity_kw: station.capacity_kw,
          status: station.status,
          health_level: station.health_level,
          health_score: valuation.health_score,
          quality_level: valuation.quality_level,
          estimated_value: valuation.estimated_market_value,
          estimated_remaining_life_years: valuation.estimated_remaining_life_years
        });
      } catch (e) {
        console.error(`Portfolio station error ${station.id}:`, e);
      }
    }

    if (healthCount > 0) {
      portfolio.avg_health_score = totalHealthScore / healthCount;
    }

    portfolio.stations.sort((a, b) => (b.health_score || 0) - (a.health_score || 0));

    res.json({ portfolio });
  } catch (err) {
    console.error('Portfolio summary error:', err);
    res.status(500).json({ error: '获取资产组合汇总失败' });
  }
});

module.exports = router;
