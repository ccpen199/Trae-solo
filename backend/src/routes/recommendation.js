const express = require('express');
const router = express.Router();
const db = require('../config/database');
const models = require('../models');
const utils = require('../utils');

router.post('/', (req, res) => {
  try {
    const body = req.body || {};
    const actualLat = body.lat || body.latitude;
    const actualLng = body.lng || body.longitude;
    const actualUserId = body.user_id || body.userId;
    const actualVehicleId = body.vehicle_id || body.vehicleId;
    const actualTargetSoc = body.target_soc || body.targetSoc || 80;
    const actualPreferFast = body.prefer_fast !== false && body.preferFast !== false;
    const actualPreferLowPrice = body.prefer_low_price !== false && body.preferLowPrice !== false;
    const actualMaxDistance = body.max_distance || body.maxDistance || 20;
    const batteryCapacity = body.batteryCapacity;
    const currentSoc = body.currentSoc;
    const current_range = body.current_range;
    const max_range = body.max_range;
    
    if (!actualLat || !actualLng) {
      return res.status(400).json({
        success: false,
        message: '缺少位置信息'
      });
    }
    
    let vehicle;
    if (actualVehicleId) {
      vehicle = models.getVehicleById.get(actualVehicleId);
    }
    if (!vehicle && actualUserId) {
      const vehicles = models.getVehiclesByUserId.all(actualUserId);
      if (vehicles.length > 0) {
        vehicle = vehicles[0];
      }
    }
    if (!vehicle) {
      vehicle = {
        battery_capacity: batteryCapacity || 60,
        current_range: current_range || 200,
        max_range: max_range || 500,
        current_soc: currentSoc || 30
      };
    }
    
    const userLocation = { lat: actualLat, lng: actualLng };
    const vehicleInfo = {
      battery_capacity: batteryCapacity || vehicle.battery_capacity,
      current_soc: currentSoc || vehicle.current_soc || 30,
      current_range: vehicle.current_range,
      max_range: vehicle.max_range
    };
    
    const stations = models.getStations.all();
    const stationsWithDetails = stations.map(station => {
      const chargers = models.getChargersByStationId.all(station.id);
      const pricePeriods = models.getPriceStrategyByStationId.all(station.id);
      return {
        ...station,
        chargers,
        pricePeriods
      };
    });
    
    const recommendations = utils.recommendChargers(stationsWithDetails, userLocation, vehicleInfo, {
      targetSoc: actualTargetSoc,
      preferFast: actualPreferFast,
      preferLowPrice: actualPreferLowPrice,
      maxDistance: actualMaxDistance
    });
    
    res.json({
      success: true,
      data: recommendations,
      total: recommendations.length
    });
  } catch (err) {
    console.error('智能推荐失败:', err);
    res.status(500).json({
      success: false,
      message: '智能推荐失败'
    });
  }
});

router.post('/reserve', (req, res) => {
  try {
    const body = req.body || {};
    const actualUserId = body.user_id || body.userId;
    const actualVehicleId = body.vehicle_id || body.vehicleId;
    const actualChargerId = body.charger_id || body.chargerId;
    const actualStationId = body.station_id || body.stationId;
    const actualScheduledStartTime = body.scheduled_start_time || body.scheduledStartTime;
    const actualScheduledEndTime = body.scheduled_end_time || body.scheduledEndTime;
    const actualTargetSoc = body.target_soc || body.targetSoc || 80;
    
    if (!actualUserId || !actualChargerId || !actualStationId || !actualScheduledStartTime) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数'
      });
    }
    
    const finalVehicleId = actualVehicleId || null;
    const charger = models.getChargerById.get(actualChargerId);
    if (!charger) {
      return res.status(404).json({
        success: false,
        message: '充电桩不存在'
      });
    }
    
    const reservationNo = utils.generateReservationNo();
    
    const result = models.createReservation.run(
      reservationNo,
      actualUserId,
      finalVehicleId,
      actualChargerId,
      actualStationId,
      actualScheduledStartTime,
      actualScheduledEndTime || null,
      actualTargetSoc
    );
    
    const reservation = db.prepare(`
      SELECT r.*, s.name as station_name, s.address, c.charger_code, c.type as charger_type,
             c.power_rating, v.plate_number, v.brand, v.model
      FROM reservations r
      LEFT JOIN stations s ON r.station_id = s.id
      LEFT JOIN chargers c ON r.charger_id = c.id
      LEFT JOIN vehicles v ON r.vehicle_id = v.id
      WHERE r.id = ?
    `).get(result.lastInsertRowid);
    
    res.json({
      success: true,
      message: '预约成功，桩位已锁定',
      data: reservation
    });
  } catch (err) {
    console.error('预约失败:', err);
    res.status(500).json({
      success: false,
      message: '预约失败'
    });
  }
});

router.get('/user/:user_id', (req, res) => {
  try {
    const { user_id } = req.params;
    const reservations = models.getReservationsByUserId.all(user_id);
    
    res.json({
      success: true,
      data: reservations,
      total: reservations.length
    });
  } catch (err) {
    console.error('获取预约列表失败:', err);
    res.status(500).json({
      success: false,
      message: '获取预约列表失败'
    });
  }
});

module.exports = router;
