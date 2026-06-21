const express = require('express');
const router = express.Router();
const models = require('../models');
const db = require('../config/database');

router.get('/', (req, res) => {
  try {
    const { station_id } = req.query;
    
    let sql = `
      SELECT DISTINCT ps.*, s.name as station_name, s.city
      FROM price_strategies ps
      LEFT JOIN stations s ON ps.station_id = s.id
      WHERE 1=1
    `;
    if (station_id) {
      sql += ` AND ps.station_id = ${station_id}`;
    }
    sql += ' ORDER BY ps.is_active DESC, ps.created_at DESC';
    
    const strategies = db.prepare(sql).all();
    
    const strategiesWithPeriods = strategies.map(strategy => {
      const periods = db.prepare(`
        SELECT * FROM price_periods 
        WHERE strategy_id = ? 
        ORDER BY period_type = 'peak' DESC, period_type = 'flat' DESC, start_time
      `).all(strategy.id);
      return {
        ...strategy,
        periods: periods.map(p => ({
          ...p,
          total_price: p.electricity_price + p.service_price
        }))
      };
    });
    
    res.json({
      success: true,
      data: strategiesWithPeriods,
      total: strategiesWithPeriods.length
    });
  } catch (err) {
    console.error('获取电价策略失败:', err);
    res.status(500).json({
      success: false,
      message: '获取电价策略失败'
    });
  }
});

router.post('/', (req, res) => {
  try {
    const { station_id, name, type, effective_date, expire_date, periods } = req.body;
    
    if (!name || !periods || !Array.isArray(periods) || periods.length === 0) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数'
      });
    }
    
    const tx = db.transaction(() => {
      db.prepare(`UPDATE price_strategies SET is_active = 0 WHERE station_id = ?`).run(station_id);
      
      const strategyResult = models.createPriceStrategy.run(
        station_id || null,
        name,
        type || 'time_of_use',
        effective_date || null,
        expire_date || null
      );
      
      const strategyId = strategyResult.lastInsertRowid;
      
      periods.forEach(period => {
        models.insertPricePeriod.run(
          strategyId,
          period.period_type,
          period.start_time,
          period.end_time,
          period.electricity_price,
          period.service_price
        );
      });
      
      return strategyId;
    });
    
    const strategyId = tx();
    
    const newStrategy = db.prepare(`
      SELECT ps.*, s.name as station_name
      FROM price_strategies ps
      LEFT JOIN stations s ON ps.station_id = s.id
      WHERE ps.id = ?
    `).get(strategyId);
    
    const newPeriods = db.prepare(`
      SELECT * FROM price_periods WHERE strategy_id = ?
    `).all(strategyId);
    
    newStrategy.periods = newPeriods;
    
    res.json({
      success: true,
      message: '电价策略创建成功',
      data: newStrategy
    });
  } catch (err) {
    console.error('创建电价策略失败:', err);
    res.status(500).json({
      success: false,
      message: '创建电价策略失败'
    });
  }
});

router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, type, effective_date, expire_date, is_active, periods } = req.body;
    
    const strategy = db.prepare(`SELECT * FROM price_strategies WHERE id = ?`).get(id);
    if (!strategy) {
      return res.status(404).json({
        success: false,
        message: '电价策略不存在'
      });
    }
    
    const tx = db.transaction(() => {
      db.prepare(`
        UPDATE price_strategies 
        SET name = COALESCE(?, name), 
            type = COALESCE(?, type),
            effective_date = COALESCE(?, effective_date),
            expire_date = COALESCE(?, expire_date),
            is_active = COALESCE(?, is_active)
        WHERE id = ?
      `).run(name, type, effective_date, expire_date, is_active, id);
      
      if (periods && Array.isArray(periods) && periods.length > 0) {
        models.deletePricePeriods.run(id);
        periods.forEach(period => {
          models.insertPricePeriod.run(
            id,
            period.period_type,
            period.start_time,
            period.end_time,
            period.electricity_price,
            period.service_price
          );
        });
      }
    });
    
    tx();
    
    const updatedStrategy = db.prepare(`
      SELECT ps.*, s.name as station_name
      FROM price_strategies ps
      LEFT JOIN stations s ON ps.station_id = s.id
      WHERE ps.id = ?
    `).get(id);
    
    const updatedPeriods = db.prepare(`
      SELECT * FROM price_periods WHERE strategy_id = ?
    `).all(id);
    
    updatedStrategy.periods = updatedPeriods;
    
    res.json({
      success: true,
      message: '电价策略更新成功',
      data: updatedStrategy
    });
  } catch (err) {
    console.error('更新电价策略失败:', err);
    res.status(500).json({
      success: false,
      message: '更新电价策略失败'
    });
  }
});

module.exports = router;
