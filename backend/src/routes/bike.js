const express = require('express');
const router = express.Router();
const db = require('../database');
const { authenticateToken, checkVerification, checkDeposit, checkActiveRide } = require('../middleware/auth');

const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const calculateWalkingTime = (distanceKm) => {
  const walkingSpeed = 5;
  const timeHours = distanceKm / walkingSpeed;
  return Math.ceil(timeHours * 60);
};

router.get('/nearby', authenticateToken, (req, res) => {
  const { latitude, longitude, radius = 2 } = req.query;

  let bikes;
  if (latitude && longitude) {
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    
    bikes = db.prepare(`
      SELECT id, bike_code, plate_number, status, battery, latitude, longitude, max_range
      FROM bikes 
      WHERE status = 'available'
    `).all();

    bikes = bikes.map(bike => {
      const distance = calculateDistance(lat, lng, bike.latitude, bike.longitude);
      return {
        ...bike,
        distance,
        distanceFormatted: distance < 1 
          ? `${Math.round(distance * 1000)}米` 
          : `${distance.toFixed(2)}公里`,
        walkingTime: calculateWalkingTime(distance),
        availableRange: Math.round(bike.max_range * (bike.battery / 100)),
        isNearest: false
      };
    }).filter(bike => bike.distance <= parseFloat(radius));

    if (bikes.length > 0) {
      bikes.sort((a, b) => a.distance - b.distance);
      bikes[0].isNearest = true;
    }
  } else {
    bikes = db.prepare(`
      SELECT id, bike_code, plate_number, status, battery, latitude, longitude, max_range
      FROM bikes 
      WHERE status = 'available'
    `).all().map(bike => ({
      ...bike,
      distance: Math.random() * 2,
      distanceFormatted: `${Math.round(Math.random() * 2000)}米`,
      walkingTime: Math.ceil(Math.random() * 15),
      availableRange: Math.round(bike.max_range * (bike.battery / 100)),
      isNearest: false
    }));
  }

  const parkingZones = db.prepare(`
    SELECT id, name, latitude, longitude, radius, address, type
    FROM parking_zones
    WHERE status = 'active'
  `).all();

  res.json({
    success: true,
    bikes,
    parkingZones,
    totalBikes: bikes.length,
    nearestBike: bikes[0] || null
  });
});

router.get('/:bikeCode', authenticateToken, (req, res) => {
  const { bikeCode } = req.params;

  const bike = db.prepare(`
    SELECT id, bike_code, plate_number, status, battery, latitude, longitude, max_range
    FROM bikes 
    WHERE bike_code = ?
  `).get(bikeCode.toUpperCase());

  if (!bike) {
    return res.status(404).json({ error: '车辆不存在' });
  }

  const availableRange = Math.round(bike.max_range * (bike.battery / 100));
  const canRide = bike.status === 'available' && bike.battery >= 20;

  let unavailableReason = null;
  if (bike.status === 'maintenance') {
    unavailableReason = '该车辆正在维护中';
  } else if (bike.status === 'low_battery' || bike.battery < 20) {
    unavailableReason = '车辆电量不足，请换一辆车';
  } else if (bike.status === 'in_use') {
    unavailableReason = '车辆正在使用中';
  }

  res.json({
    success: true,
    bike: {
      ...bike,
      availableRange,
      canRide,
      unavailableReason,
      batteryStatus: bike.battery < 20 ? 'low' : bike.battery < 50 ? 'medium' : 'high'
    }
  });
});

router.get('/plate/:plateNumber', authenticateToken, (req, res) => {
  const { plateNumber } = req.params;

  const bike = db.prepare(`
    SELECT id, bike_code, plate_number, status, battery, latitude, longitude, max_range
    FROM bikes 
    WHERE plate_number = ?
  `).get(plateNumber.toUpperCase());

  if (!bike) {
    return res.status(404).json({ error: '车牌号不存在' });
  }

  const availableRange = Math.round(bike.max_range * (bike.battery / 100));
  const canRide = bike.status === 'available' && bike.battery >= 20;

  let unavailableReason = null;
  if (bike.status === 'maintenance') {
    unavailableReason = '该车辆正在维护中';
  } else if (bike.status === 'low_battery' || bike.battery < 20) {
    unavailableReason = '车辆电量不足，请换一辆车';
  } else if (bike.status === 'in_use') {
    unavailableReason = '车辆正在使用中';
  }

  res.json({
    success: true,
    bike: {
      ...bike,
      availableRange,
      canRide,
      unavailableReason,
      batteryStatus: bike.battery < 20 ? 'low' : bike.battery < 50 ? 'medium' : 'high'
    }
  });
});

router.post('/:bikeId/ring', authenticateToken, (req, res) => {
  const { bikeId } = req.params;

  const bike = db.prepare('SELECT * FROM bikes WHERE id = ?').get(bikeId);

  if (!bike) {
    return res.status(404).json({ error: '车辆不存在' });
  }

  if (bike.status !== 'available') {
    return res.status(400).json({ error: '车辆不可用，无法响铃' });
  }

  console.log(`[响铃] 车辆 ${bike.bike_code} 响铃成功`);

  res.json({
    success: true,
    message: '响铃成功，车辆已发出提示音',
    bikeCode: bike.bike_code
  });
});

router.get('/pricing/rule', authenticateToken, (req, res) => {
  const rule = db.prepare(`
    SELECT * FROM pricing_rules WHERE is_active = 1 LIMIT 1
  `).get();

  if (!rule) {
    return res.status(500).json({ error: '计费规则未配置' });
  }

  res.json({
    success: true,
    pricing: {
      baseDuration: rule.base_duration,
      basePrice: rule.base_price,
      additionalDuration: rule.additional_duration,
      additionalPrice: rule.additional_price,
      maxDailyPrice: rule.max_daily_price,
      freeProtectionMinutes: rule.free_protection_minutes,
      description: `起步价${rule.base_price}元（${rule.base_duration}分钟），超时后每${rule.additional_duration}分钟${rule.additional_price}元，每日封顶${rule.max_daily_price}元`
    }
  });
});

module.exports = router;
