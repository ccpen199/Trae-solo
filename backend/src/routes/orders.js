const express = require('express');
const router = express.Router();
const models = require('../models');
const utils = require('../utils');

router.get('/', (req, res) => {
  try {
    const { user_id, status } = req.query;
    let orders;
    
    if (user_id) {
      orders = models.getOrdersByUserId.all(user_id);
    } else {
      const db = require('../config/database');
      let sql = `
        SELECT o.*, s.name as station_name, c.charger_code, c.type as charger_type,
               v.plate_number, u.nickname
        FROM charging_orders o
        LEFT JOIN stations s ON o.station_id = s.id
        LEFT JOIN chargers c ON o.charger_id = c.id
        LEFT JOIN vehicles v ON o.vehicle_id = v.id
        LEFT JOIN users u ON o.user_id = u.id
      `;
      if (status) {
        sql += ` WHERE o.status = '${status}'`;
      }
      sql += ' ORDER BY o.created_at DESC LIMIT 100';
      orders = db.prepare(sql).all();
    }
    
    res.json({
      success: true,
      data: orders,
      total: orders.length
    });
  } catch (err) {
    console.error('获取订单列表失败:', err);
    res.status(500).json({
      success: false,
      message: '获取订单列表失败'
    });
  }
});

router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const order = models.getOrderById.get(id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: '订单不存在'
      });
    }
    
    const powerData = models.getPowerDataByOrderId.all(id);
    
    order.power_data = powerData;
    
    if (order.status === 'charging') {
      const now = new Date();
      const startTime = new Date(order.start_time);
      const elapsedSeconds = Math.floor((now - startTime) / 1000);
      const currentPower = powerData.length > 0 ? powerData[powerData.length - 1].power : 0;
      const energySoFar = powerData.length > 0 ? 
        powerData.reduce((sum, p) => sum + (p.power || 0), 0) / 120 : order.energy;
      
      const vehicle = models.getVehicleById.get(order.vehicle_id);
      if (vehicle && currentPower > 0) {
        const remainingEnergy = vehicle.battery_capacity * (80 - (order.start_soc + (energySoFar / vehicle.battery_capacity * 100))) / 100;
        const estimatedRemainingTime = remainingEnergy / (currentPower * 0.9) * 3600;
        
        order.realtime = {
          elapsed_seconds: elapsedSeconds,
          elapsed_formatted: utils.formatDuration(elapsedSeconds),
          current_power: Math.round(currentPower * 10) / 10,
          energy_so_far: Math.round(energySoFar * 10) / 10,
          estimated_remaining_time: Math.round(estimatedRemainingTime),
          estimated_remaining_formatted: utils.formatDuration(Math.round(estimatedRemainingTime)),
          estimated_end_time: new Date(now.getTime() + estimatedRemainingTime * 1000).toISOString()
        };
      }
    }
    
    res.json({
      success: true,
      data: order
    });
  } catch (err) {
    console.error('获取订单详情失败:', err);
    res.status(500).json({
      success: false,
      message: '获取订单详情失败'
    });
  }
});

router.post('/', (req, res) => {
  try {
    const body = req.body || {};
    const actualUserId = body.user_id || body.userId;
    const actualVehicleId = body.vehicle_id || body.vehicleId;
    const actualChargerId = body.charger_id || body.chargerId;
    const actualStationId = body.station_id || body.stationId;
    const actualStartSoc = body.start_soc || body.startSoc || 20;
    const vin = body.vin;
    
    if (!actualUserId || !actualChargerId) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数'
      });
    }
    
    const charger = models.getChargerById.get(actualChargerId);
    if (!charger) {
      return res.status(404).json({
        success: false,
        message: '充电桩不存在'
      });
    }
    
    const finalStationId = actualStationId || charger.station_id;
    let finalUserId = actualUserId;
    let finalVehicleId = actualVehicleId;
    
    if (typeof finalUserId === 'string') {
      const match = finalUserId.match(/user_?(\d+)/i);
      if (match) {
        finalUserId = parseInt(match[1], 10);
      } else if (!isNaN(parseInt(finalUserId, 10))) {
        finalUserId = parseInt(finalUserId, 10);
      }
    }
    
    if (!finalVehicleId) {
      const db = require('../config/database');
      
      let user = db.prepare(`SELECT * FROM users WHERE id = ?`).get(finalUserId);
      if (!user) {
        const userResult = db.prepare(`
          INSERT INTO users (phone, nickname, balance)
          VALUES (?, ?, ?)
        `).run('138' + Date.now().toString().slice(-8), '临时用户', 0);
        finalUserId = userResult.lastInsertRowid;
      }
      
      const existingVehicle = db.prepare(`SELECT * FROM vehicles WHERE user_id = ? ORDER BY id LIMIT 1`).get(finalUserId);
      if (existingVehicle) {
        finalVehicleId = existingVehicle.id;
      } else {
        const vehicleResult = db.prepare(`
          INSERT INTO vehicles (user_id, plate_number, brand, model, battery_capacity, max_range)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(finalUserId, 'DEFAULT', '默认品牌', '默认车型', 60, 500);
        finalVehicleId = vehicleResult.lastInsertRowid;
      }
    }
    
    if (charger.is_occupied || charger.is_offline) {
      return res.status(400).json({
        success: false,
        message: '充电桩不可用'
      });
    }
    
    const activeOrder = models.getActiveOrderByChargerId.get(actualChargerId);
    if (activeOrder) {
      return res.status(400).json({
        success: false,
        message: '该充电桩已有正在进行的订单'
      });
    }
    
    const orderNo = utils.generateOrderNo();
    const startTime = new Date().toISOString();
    
    const result = models.createOrder.run(
      orderNo, actualUserId, finalVehicleId, actualChargerId, finalStationId,
      startTime, actualStartSoc
    );
    
    const orderId = result.lastInsertRowid;
    
    models.insertChargerStatus.run(
      actualChargerId,
      0, 0, 0, 25, actualStartSoc,
      null, null, 0, 1, 0, 0
    );
    models.updateChargerStatus.run('occupied', actualChargerId);
    
    const order = models.getOrderById.get(orderId);
    
    res.json({
      success: true,
      message: '订单创建成功，即插即充已启动',
      data: order
    });
  } catch (err) {
    console.error('创建订单失败:', err);
    res.status(500).json({
      success: false,
      message: '创建订单失败'
    });
  }
});

router.post('/:id/stop', (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body || {};
    const actualEndSoc = body.end_soc || body.endSoc || 80;
    
    const order = models.getOrderById.get(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: '订单不存在'
      });
    }
    
    if (order.status !== 'charging') {
      return res.status(400).json({
        success: false,
        message: '订单状态不正确'
      });
    }
    
    const endTime = new Date();
    const startTime = new Date(order.start_time);
    const duration = Math.floor((endTime - startTime) / 1000);
    
    const powerData = models.getPowerDataByOrderId.all(id);
    const energy = powerData.length > 0 ? 
      powerData.reduce((sum, p) => sum + (p.power || 0), 0) / 120 : 30;
    
    const priceStrategy = models.getPriceStrategyByStationId.all(order.station_id);
    const cost = utils.calculateChargingCost(energy, startTime, endTime, priceStrategy);
    
    models.updateOrder.run(
      endTime.toISOString(),
      actualEndSoc,
      Math.round(energy * 100) / 100,
      duration,
      Math.round(cost.peak_energy * 100) / 100,
      Math.round(cost.flat_energy * 100) / 100,
      Math.round(cost.valley_energy * 100) / 100,
      Math.round(cost.peak_cost * 100) / 100,
      Math.round(cost.flat_cost * 100) / 100,
      Math.round(cost.valley_cost * 100) / 100,
      Math.round(cost.service_fee * 100) / 100,
      Math.round(cost.total_amount * 100) / 100,
      'completed',
      id
    );
    
    models.insertChargerStatus.run(
      order.charger_id,
      0, 0, 0, 25, actualEndSoc,
      null, null, 0, 0, 0, 0
    );
    models.updateChargerStatus.run('available', order.charger_id);
    
    const updatedOrder = models.getOrderById.get(id);
    
    res.json({
      success: true,
      message: '充电已结束',
      data: updatedOrder
    });
  } catch (err) {
    console.error('结束充电失败:', err);
    res.status(500).json({
      success: false,
      message: '结束充电失败'
    });
  }
});

router.get('/:id/power-data', (req, res) => {
  try {
    const { id } = req.params;
    const powerData = models.getPowerDataByOrderId.all(id);
    
    const chartData = powerData.map((d, i) => ({
      x: i,
      time: d.timestamp,
      power: Math.round((d.power || 0) * 10) / 10,
      voltage: Math.round((d.voltage || 0) * 10) / 10,
      current: Math.round((d.current || 0) * 10) / 10,
      soc: Math.round((d.soc || 0) * 10) / 10,
      temperature: Math.round((d.temperature || 0) * 10) / 10
    }));
    
    res.json({
      success: true,
      data: chartData,
      total: chartData.length
    });
  } catch (err) {
    console.error('获取功率数据失败:', err);
    res.status(500).json({
      success: false,
      message: '获取功率数据失败'
    });
  }
});

module.exports = router;
