const { v4: uuidv4 } = require('uuid');

class RulesEngine {
  constructor(db) {
    this.db = db;
  }

  validateSchedule(scheduleData) {
    const errors = [];

    if (!scheduleData.route_id) {
      errors.push('线路不能为空');
    }
    if (!scheduleData.departure_time) {
      errors.push('发车时间不能为空');
    }
    if (!scheduleData.driver_id) {
      errors.push('司机不能为空');
    }
    if (!scheduleData.vehicle_id) {
      errors.push('车辆不能为空');
    }

    if (errors.length > 0) {
      return { valid: false, errors };
    }

    const route = this.db.prepare('SELECT * FROM routes WHERE route_id = ?').get(scheduleData.route_id);
    if (!route) {
      errors.push('所选线路不存在');
    }

    const driver = this.db.prepare('SELECT * FROM drivers WHERE driver_id = ?').get(scheduleData.driver_id);
    if (!driver) {
      errors.push('所选司机不存在');
    }

    const vehicle = this.db.prepare('SELECT * FROM vehicles WHERE vehicle_id = ?').get(scheduleData.vehicle_id);
    if (!vehicle) {
      errors.push('所选车辆不存在');
    }

    if (scheduleData.expected_completion_time) {
      const departure = new Date(scheduleData.departure_time);
      const expected = new Date(scheduleData.expected_completion_time);
      if (expected <= departure) {
        errors.push('期望完成时间必须晚于发车时间');
      }
    }

    return { valid: errors.length === 0, errors };
  }

  checkDuplicateSchedule(scheduleData) {
    const existingSchedule = this.db.prepare(`
      SELECT * FROM schedules 
      WHERE route_id = ? 
      AND driver_id = ? 
      AND vehicle_id = ? 
      AND date(departure_time) = date(?)
      AND status NOT IN ('cancelled', 'completed')
    `).get(
      scheduleData.route_id,
      scheduleData.driver_id,
      scheduleData.vehicle_id,
      scheduleData.departure_time
    );

    return !!existingSchedule;
  }

  calculateArrivalETA(routeId, departureTime, currentLocation = null) {
    const route = this.db.prepare('SELECT * FROM routes WHERE route_id = ?').get(routeId);
    if (!route) {
      throw new Error('线路不存在');
    }

    const stations = this.db.prepare(`
      SELECT * FROM stations 
      WHERE station_id IN (${route.station_order.split(',').map(() => '?').join(',')})
      ORDER BY order_index
    `).all(...route.station_order.split(','));

    const departure = new Date(departureTime);
    const predictions = [];

    const totalMinutes = route.estimated_duration_min;
    const stationCount = stations.length;
    const minutesPerStation = totalMinutes / stationCount;

    stations.forEach((station, index) => {
      const predictedArrival = new Date(departure.getTime() + index * minutesPerStation * 60000);
      
      predictions.push({
        prediction_id: uuidv4(),
        station_id: station.station_id,
        station_name: station.station_name,
        predicted_arrival_time: predictedArrival.toISOString(),
        confidence: 0.85,
        prediction_source: 'rules_engine',
        latitude: station.latitude,
        longitude: station.longitude
      });
    });

    return {
      route_id: routeId,
      route_name: route.route_name,
      total_distance_km: route.distance_km,
      estimated_duration_min: route.estimated_duration_min,
      predictions
    };
  }

  detectAnomaly(trackPoint, previousTrack, route) {
    const anomalies = [];

    if (previousTrack) {
      const distance = this.calculateDistance(
        previousTrack.latitude, previousTrack.longitude,
        trackPoint.latitude, trackPoint.longitude
      );
      
      const timeDiff = (new Date(trackPoint.track_time) - new Date(previousTrack.track_time)) / 1000;
      const speed = (distance * 1000) / timeDiff * 3.6;

      if (speed > 100) {
        anomalies.push({
          type: 'drift',
          message: `定位漂移: 速度 ${speed.toFixed(1)} km/h 超出正常范围`,
          severity: 'high'
        });
      }

      if (speed < 1 && timeDiff > 300) {
        anomalies.push({
          type: 'abnormal_stop',
          message: '异常停留: 车辆停留超过5分钟',
          severity: 'medium'
        });
      }
    }

    if (route) {
      const stations = this.db.prepare(`
        SELECT * FROM stations 
        WHERE station_id IN (${route.station_order.split(',').map(() => '?').join(',')})
        ORDER BY order_index
      `).all(...route.station_order.split(','));

      const isNearRoute = stations.some(station => {
        const dist = this.calculateDistance(
          station.latitude, station.longitude,
          trackPoint.latitude, trackPoint.longitude
        );
        return dist < 0.5;
      });

      if (!isNearRoute && previousTrack) {
        anomalies.push({
          type: 'route_deviation',
          message: '路线偏离: 车辆远离预定路线',
          severity: 'high'
        });
      }
    }

    return anomalies;
  }

  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  matchCapacity(routeId, passengerCount, vehicleId) {
    const route = this.db.prepare('SELECT * FROM routes WHERE route_id = ?').get(routeId);
    const vehicle = this.db.prepare('SELECT * FROM vehicles WHERE vehicle_id = ?').get(vehicleId);

    if (!route || !vehicle) {
      return { matched: false, message: '线路或车辆不存在' };
    }

    const utilization = (passengerCount / vehicle.capacity) * 100;

    return {
      matched: true,
      vehicle_capacity: vehicle.capacity,
      passenger_count: passengerCount,
      utilization: utilization.toFixed(1),
      recommendation: utilization > 85 ? '建议增加班次' : '运力充足'
    };
  }

  generateMainOrderNo() {
    const now = new Date();
    const dateStr = now.getFullYear().toString() + 
                   (now.getMonth() + 1).toString().padStart(2, '0') +
                   now.getDate().toString().padStart(2, '0');
    
    const lastOrder = this.db.prepare(`
      SELECT main_order_no FROM main_orders 
      WHERE main_order_no LIKE ?
      ORDER BY main_order_no DESC
      LIMIT 1
    `).get(`BUS${dateStr}%`);

    let sequence = 1;
    if (lastOrder) {
      const lastSeq = parseInt(lastOrder.main_order_no.slice(-4));
      sequence = lastSeq + 1;
    }

    return `BUS${dateStr}${sequence.toString().padStart(4, '0')}`;
  }

  lockStation(stationId, mainOrderNo, operatorId, durationMinutes = 30) {
    const activeLock = this.db.prepare(`
      SELECT * FROM station_locks 
      WHERE station_id = ? AND is_released = 0 AND expires_at > CURRENT_TIMESTAMP
    `).get(stationId);

    if (activeLock) {
      throw new Error(`站点已被锁定: ${activeLock.main_order_no}`);
    }

    const expiresAt = new Date(Date.now() + durationMinutes * 60000);
    
    const insertLock = this.db.prepare(`
      INSERT INTO station_locks (lock_id, station_id, main_order_no, locked_by, expires_at)
      VALUES (?, ?, ?, ?, ?)
    `);

    const lockId = uuidv4();
    insertLock.run(lockId, stationId, mainOrderNo, operatorId, expiresAt.toISOString());

    return {
      lock_id: lockId,
      station_id: stationId,
      main_order_no: mainOrderNo,
      locked_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString()
    };
  }

  releaseStation(lockId, operatorId) {
    const updateLock = this.db.prepare(`
      UPDATE station_locks 
      SET is_released = 1, released_at = CURRENT_TIMESTAMP
      WHERE lock_id = ? AND is_released = 0
    `);

    const result = updateLock.run(lockId);
    return result.changes > 0;
  }

  addToExceptionQueue(exceptionType, originalData, mainOrderNo = null, vehicleId = null, trackId = null) {
    const insertQueue = this.db.prepare(`
      INSERT INTO exception_queue (queue_id, exception_type, main_order_no, vehicle_id, track_id, original_data)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const queueId = uuidv4();
    insertQueue.run(
      queueId,
      exceptionType,
      mainOrderNo,
      vehicleId,
      trackId,
      JSON.stringify(originalData)
    );

    const insertAlarm = this.db.prepare(`
      INSERT INTO alarms (alarm_id, alarm_type, alarm_level, main_order_no, vehicle_id, message)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const alarmLevels = {
      drift: 'high',
      route_deviation: 'high',
      abnormal_stop: 'medium',
      driver_refuse: 'high',
      arrival_unconfirmed: 'medium',
      map_callback_delay: 'low'
    };

    insertAlarm.run(
      uuidv4(),
      exceptionType,
      alarmLevels[exceptionType] || 'medium',
      mainOrderNo,
      vehicleId,
      `异常队列: ${exceptionType}`
    );

    return queueId;
  }
}

module.exports = RulesEngine;
