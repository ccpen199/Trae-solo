const express = require('express');
const router = express.Router();
const models = require('../models');

router.get('/', (req, res) => {
  try {
    const { city } = req.query;
    let stations = models.getStations.all();
    
    if (city) {
      stations = stations.filter(s => s.city.includes(city));
    }
    
    res.json({
      success: true,
      data: stations,
      total: stations.length
    });
  } catch (err) {
    console.error('获取充电站列表失败:', err);
    res.status(500).json({
      success: false,
      message: '获取充电站列表失败'
    });
  }
});

router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const station = models.getStationById.get(id);
    
    if (!station) {
      return res.status(404).json({
        success: false,
        message: '充电站不存在'
      });
    }
    
    const chargers = models.getChargersByStationId.all(id);
    const priceStrategy = models.getPriceStrategyByStationId.all(id);
    
    const periods = priceStrategy.map(p => ({
      id: p.period_id,
      period_type: p.period_type,
      start_time: p.start_time,
      end_time: p.end_time,
      electricity_price: p.electricity_price,
      service_price: p.service_price,
      total_price: p.electricity_price + p.service_price
    }));
    
    station.chargers = chargers;
    station.price_strategy = priceStrategy.length > 0 ? {
      id: priceStrategy[0].id,
      name: priceStrategy[0].name,
      type: priceStrategy[0].type,
      effective_date: priceStrategy[0].effective_date,
      expire_date: priceStrategy[0].expire_date,
      periods
    } : null;
    
    res.json({
      success: true,
      data: station
    });
  } catch (err) {
    console.error('获取充电站详情失败:', err);
    res.status(500).json({
      success: false,
      message: '获取充电站详情失败'
    });
  }
});

router.get('/:id/chargers', (req, res) => {
  try {
    const { id } = req.params;
    const chargers = models.getChargersByStationId.all(id);
    
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

router.get('/:id/price', (req, res) => {
  try {
    const { id } = req.params;
    const priceStrategy = models.getPriceStrategyByStationId.all(id);
    
    if (priceStrategy.length === 0) {
      return res.json({
        success: true,
        data: null
      });
    }
    
    const periods = priceStrategy.map(p => ({
      id: p.period_id,
      period_type: p.period_type,
      start_time: p.start_time,
      end_time: p.end_time,
      electricity_price: p.electricity_price,
      service_price: p.service_price,
      total_price: p.electricity_price + p.service_price
    }));
    
    res.json({
      success: true,
      data: {
        id: priceStrategy[0].id,
        name: priceStrategy[0].name,
        type: priceStrategy[0].type,
        effective_date: priceStrategy[0].effective_date,
        expire_date: priceStrategy[0].expire_date,
        periods
      }
    });
  } catch (err) {
    console.error('获取电价策略失败:', err);
    res.status(500).json({
      success: false,
      message: '获取电价策略失败'
    });
  }
});

module.exports = router;
