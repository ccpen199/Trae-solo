const express = require('express');
const router = express.Router();
const models = require('../models');
const utils = require('../utils');
const db = require('../config/database');

router.get('/', (req, res) => {
  try {
    const { station_id, status } = req.query;
    
    let sql = `
      SELECT c.*, s.name as station_name, s.city, s.address
      FROM chargers c
      LEFT JOIN stations s ON c.station_id = s.id
      WHERE 1=1
    `;
    if (station_id) {
      sql += ` AND c.station_id = ${station_id}`;
    }
    if (status) {
      sql += ` AND c.status = '${status}'`;
    }
    sql += ' ORDER BY c.id';
    
    const chargers = db.prepare(sql).all();
    
    res.json({
      success: true,
      data: chargers,
      total: chargers.length
    });
  } catch (err) {
    console.error('获取充电桩列表失败:', err);
    res.status(500).json({
      success: false,
      message: '获取充电桩列表失败'
    });
  }
});

router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const charger = models.getChargerById.get(id);
    
    if (!charger) {
      return res.status(404).json({
        success: false,
        message: '充电桩不存在'
      });
    }
    
    res.json({
      success: true,
      data: charger
    });
  } catch (err) {
    console.error('获取充电桩详情失败:', err);
    res.status(500).json({
      success: false,
      message: '获取充电桩详情失败'
    });
  }
});

router.get('/code/:code', (req, res) => {
  try {
    const { code } = req.params;
    const charger = models.getChargerByCode.get(code);
    
    if (!charger) {
      return res.status(404).json({
        success: false,
        message: '充电桩不存在'
      });
    }
    
    res.json({
      success: true,
      data: charger
    });
  } catch (err) {
    console.error('获取充电桩详情失败:', err);
    res.status(500).json({
      success: false,
      message: '获取充电桩详情失败'
    });
  }
});

router.post('/:id/status', (req, res) => {
  try {
    const { id } = req.params;
    const {
      voltage, current, power, temperature, soc,
      fault_code, fault_message, occupied_duration,
      is_occupied, is_charging, is_offline
    } = req.body;
    
    const charger = models.getChargerById.get(id);
    if (!charger) {
      return res.status(404).json({
        success: false,
        message: '充电桩不存在'
      });
    }
    
    models.insertChargerStatus.run(
      id,
      voltage ?? null,
      current ?? null,
      power ?? null,
      temperature ?? null,
      soc ?? null,
      fault_code ?? null,
      fault_message ?? null,
      occupied_duration ?? 0,
      is_occupied ? 1 : 0,
      is_charging ? 1 : 0,
      is_offline ? 1 : 0
    );
    
    const newStatus = is_offline ? 'offline' : is_occupied ? (is_charging ? 'charging' : 'occupied') : 'available';
    models.updateChargerStatus.run(newStatus, id);
    
    const activeOrder = models.getActiveOrderByChargerId.get(id);
    if (activeOrder && is_charging) {
      models.insertPowerData.run(
        activeOrder.id,
        id,
        voltage ?? null,
        current ?? null,
        power ?? null,
        soc ?? null,
        temperature ?? null
      );
    }
    
    const wsClients = req.app.get('wsClients');
    if (wsClients && wsClients.size > 0) {
      const statusUpdate = {
        type: 'charger_status',
        data: {
          charger_id: id,
          charger_code: charger.charger_code,
          voltage, current, power, temperature, soc,
          is_occupied, is_charging, is_offline,
          timestamp: new Date().toISOString()
        }
      };
      wsClients.forEach(client => {
        if (client.readyState === 1) {
          client.send(JSON.stringify(statusUpdate));
        }
      });
    }
    
    res.json({
      success: true,
      message: '状态同步成功',
      data: {
        charger_id: id,
        status: newStatus,
        timestamp: new Date().toISOString()
      }
    });
  } catch (err) {
    console.error('同步充电桩状态失败:', err);
    res.status(500).json({
      success: false,
      message: '同步充电桩状态失败'
    });
  }
});

router.get('/:id/orders', (req, res) => {
  try {
    const { id } = req.params;
    const activeOrder = models.getActiveOrderByChargerId.get(id);
    
    res.json({
      success: true,
      data: activeOrder || null
    });
  } catch (err) {
    console.error('获取充电订单失败:', err);
    res.status(500).json({
      success: false,
      message: '获取充电订单失败'
    });
  }
});

router.get('/:id/health', (req, res) => {
  try {
    const { id } = req.params;
    const charger = models.getChargerById.get(id);
    
    if (!charger) {
      return res.status(404).json({
        success: false,
        message: '充电桩不存在'
      });
    }
    
    const db = require('../config/database');
    const statusHistory = db.prepare(`
      SELECT * FROM charger_status 
      WHERE charger_id = ? 
      ORDER BY timestamp DESC 
      LIMIT 100
    `).all(id);
    
    const healthAnalysis = utils.analyzeChargerHealth(charger, statusHistory);
    
    res.json({
      success: true,
      data: {
        charger: {
          id: charger.id,
          charger_code: charger.charger_code,
          type: charger.type,
          power_rating: charger.power_rating,
          health_score: charger.health_score,
          last_maintenance_date: charger.last_maintenance_date,
          total_charging_count: charger.total_charging_count,
          total_energy: charger.total_energy
        },
        health_analysis: healthAnalysis,
        recent_status: statusHistory.slice(0, 10)
      }
    });
  } catch (err) {
    console.error('获取充电桩健康诊断失败:', err);
    res.status(500).json({
      success: false,
      message: '获取充电桩健康诊断失败'
    });
  }
});

router.get('/:id/ocpp-messages', (req, res) => {
  try {
    const { id } = req.params;
    const charger = models.getChargerById.get(id);
    
    if (!charger) {
      return res.status(404).json({
        success: false,
        message: '充电桩不存在'
      });
    }
    
    const messages = models.getOcppMessages.all(charger.charger_code);
    
    res.json({
      success: true,
      data: messages,
      total: messages.length
    });
  } catch (err) {
    console.error('获取OCPP消息失败:', err);
    res.status(500).json({
      success: false,
      message: '获取OCPP消息失败'
    });
  }
});

router.get('/health/list', (req, res) => {
  try {
    const chargers = models.getChargerHealthStats.all();
    
    const summary = {
      total: chargers.length,
      excellent: chargers.filter(c => c.health_level === 'excellent').length,
      good: chargers.filter(c => c.health_level === 'good').length,
      fair: chargers.filter(c => c.health_level === 'fair').length,
      poor: chargers.filter(c => c.health_level === 'poor').length,
      offline: chargers.filter(c => c.is_offline).length,
      faulty: chargers.filter(c => c.fault_code).length
    };
    
    res.json({
      success: true,
      data: chargers,
      summary,
      total: chargers.length
    });
  } catch (err) {
    console.error('获取充电桩健康列表失败:', err);
    res.status(500).json({
      success: false,
      message: '获取充电桩健康列表失败'
    });
  }
});

module.exports = router;
