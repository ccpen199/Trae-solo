const { v4: uuidv4 } = require('uuid');
const db = require('../database/init');
const GeofenceEngine = require('../engines/geofenceEngine');
const StateSyncService = require('./stateSyncService');

const ExceptionService = {
  EXCEPTION_TYPES: {
    LOCATION_DRIFT: 'location_drift',
    ROUTE_DEVIATION: 'route_deviation',
    DRIVER_REJECT: 'driver_reject',
    ARRIVAL_NOT_CONFIRMED: 'arrival_not_confirmed',
    MAP_CALLBACK_DELAY: 'map_callback_delay',
    PAYMENT_FAILED: 'payment_failed',
    TIMEOUT: 'timeout',
    OTHER: 'other'
  },

  createException(orderId, exceptionType, description, originalData = {}) {
    const exceptionId = uuidv4();
    
    db.prepare(`
      INSERT INTO exceptions (id, order_id, exception_type, description, original_data, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(exceptionId, orderId, exceptionType, description, 
           JSON.stringify(originalData), 'pending');

    const riskUsers = db.prepare(`
      SELECT * FROM users WHERE role = 'risk_control'
    `).all();
    
    riskUsers.forEach(user => {
      StateSyncService.createNotification(
        user.id, 'risk_control', orderId,
        '订单异常告警',
        `订单 ${orderId} 发生异常: ${this.getExceptionTypeName(exceptionType)}`,
        'exception'
      );
      
      StateSyncService.createTodo(
        user.id, 'risk_control', orderId,
        'handle_exception', 'high'
      );
    });

    const csUsers = db.prepare(`
      SELECT * FROM users WHERE role = 'customer_service'
    `).all();
    
    csUsers.forEach(user => {
      StateSyncService.createNotification(
        user.id, 'customer_service', orderId,
        '订单异常',
        `订单 ${orderId} 需要客服介入: ${description}`,
        'exception'
      );
    });

    StateSyncService.createAuditLog(
      null, 'system', 'exception_created',
      'order', orderId,
      null, { exceptionType, description }
    );

    return exceptionId;
  },

  handleException(exceptionId, handlerId, handlerRole, action, comment = '') {
    const exception = db.prepare(`
      SELECT * FROM exceptions WHERE id = ?
    `).get(exceptionId);

    if (!exception) {
      return { success: false, error: '异常记录不存在' };
    }

    const now = Math.floor(Date.now() / 1000);
    
    db.prepare(`
      UPDATE exceptions 
      SET status = ?, handled_by = ?, handled_at = ?, description = description || ?
      WHERE id = ?
    `).run('handled', handlerId, now, `\n处理备注: ${comment}`, exceptionId);

    const order = db.prepare(`
      SELECT * FROM order_main WHERE id = ?
    `).get(exception.order_id);

    if (order) {
      if (order.status === 'exception') {
        db.prepare(`
          UPDATE order_main 
          SET status = 'in_progress', updated_at = strftime('%s', 'now')
          WHERE id = ?
        `).run(exception.order_id);
      }

      StateSyncService.createOrderDetail(exception.order_id, 'exception_handled', {
        exceptionId,
        handlerId,
        handlerRole,
        action,
        comment,
        timestamp: Date.now()
      });
    }

    StateSyncService.createAuditLog(
      handlerId, handlerRole, 'exception_handled',
      'exception', exceptionId,
      { status: 'pending' }, { status: 'handled', action, comment }
    );

    return { success: true, exceptionId };
  },

  checkAndCreateLocationDriftException(order, currentLocations) {
    if (GeofenceEngine.checkLocationDrift(currentLocations)) {
      const lastLocations = currentLocations.slice(-5);
      return this.createException(
        order.id,
        this.EXCEPTION_TYPES.LOCATION_DRIFT,
        '检测到位置漂移，连续5个点波动超过阈值',
        {
          locations: lastLocations.map(l => ({
            lat: l.lat,
            lng: l.lng,
            timestamp: l.created_at
          })),
          thresholdMeters: 500
        }
      );
    }
    return null;
  },

  checkAndCreateRouteDeviationException(order, currentLocation, previousLocation) {
    const deviation = GeofenceEngine.checkRouteDeviation(
      currentLocation.lat, currentLocation.lng,
      previousLocation.lat, previousLocation.lng,
      order.start_lat, order.start_lng,
      order.end_lat, order.end_lng
    );

    if (deviation.isDeviating) {
      return this.createException(
        order.id,
        this.EXCEPTION_TYPES.ROUTE_DEVIATION,
        `检测到路线偏离，偏离距离: ${deviation.deviationDistance.toFixed(2)}公里`,
        {
          currentPosition: deviation.currentPosition,
          previousPosition: deviation.previousPosition,
          deviationDistance: deviation.deviationDistance,
          maxDeviationKm: 2.0
        }
      );
    }
    return null;
  },

  handleDriverReject(order, driverId, reason) {
    return this.createException(
      order.id,
      this.EXCEPTION_TYPES.DRIVER_REJECT,
      `司机拒单，原因: ${reason}`,
      {
        driverId,
        reason,
        timestamp: Date.now()
      }
    );
  },

  handleArrivalNotConfirmed(order, expectedArrivalTime) {
    const now = Math.floor(Date.now() / 1000);
    const delayMinutes = (now - expectedArrivalTime) / 60;

    if (delayMinutes > 15) {
      return this.createException(
        order.id,
        this.EXCEPTION_TYPES.ARRIVAL_NOT_CONFIRMED,
        `到达未确认，预计到达时间已过 ${Math.round(delayMinutes)} 分钟`,
        {
          expectedArrivalTime,
          actualTime: now,
          delayMinutes: Math.round(delayMinutes)
        }
      );
    }
    return null;
  },

  handleMapCallbackDelay(order, callbackDelaySeconds) {
    if (callbackDelaySeconds > 30) {
      return this.createException(
        order.id,
        this.EXCEPTION_TYPES.MAP_CALLBACK_DELAY,
        `第三方地图回调延迟 ${callbackDelaySeconds} 秒`,
        {
          callbackDelaySeconds,
          thresholdSeconds: 30
        }
      );
    }
    return null;
  },

  getPendingExceptions() {
    return db.prepare(`
      SELECT e.*, 
             om.order_no,
             om.start_address,
             om.end_address,
             om.status as order_status,
             p_user.name as passenger_name,
             d_user.name as driver_name
      FROM exceptions e
      JOIN order_main om ON e.order_id = om.id
      LEFT JOIN passengers p ON om.passenger_id = p.id
      LEFT JOIN users p_user ON p.user_id = p_user.id
      LEFT JOIN drivers d ON om.driver_id = d.id
      LEFT JOIN users d_user ON d.user_id = d_user.id
      WHERE e.status = 'pending'
      ORDER BY e.created_at DESC
    `).all();
  },

  getExceptionsByOrder(orderId) {
    return db.prepare(`
      SELECT * FROM exceptions 
      WHERE order_id = ? 
      ORDER BY created_at DESC
    `).all(orderId);
  },

  getExceptionTypeName(type) {
    const typeMap = {
      [this.EXCEPTION_TYPES.LOCATION_DRIFT]: '位置漂移',
      [this.EXCEPTION_TYPES.ROUTE_DEVIATION]: '路线偏离',
      [this.EXCEPTION_TYPES.DRIVER_REJECT]: '司机拒单',
      [this.EXCEPTION_TYPES.ARRIVAL_NOT_CONFIRMED]: '到达未确认',
      [this.EXCEPTION_TYPES.MAP_CALLBACK_DELAY]: '地图回调延迟',
      [this.EXCEPTION_TYPES.PAYMENT_FAILED]: '支付失败',
      [this.EXCEPTION_TYPES.TIMEOUT]: '超时',
      [this.EXCEPTION_TYPES.OTHER]: '其他异常'
    };
    return typeMap[type] || type;
  },

  recordOrderTrack(orderId, driverId, lat, lng, accuracy = null, speed = null, heading = null) {
    const trackId = uuidv4();
    
    db.prepare(`
      INSERT INTO order_tracks (id, order_id, driver_id, lat, lng, accuracy, speed, heading)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(trackId, orderId, driverId, lat, lng, accuracy, speed, heading);

    return trackId;
  },

  getOrderTracks(orderId) {
    return db.prepare(`
      SELECT * FROM order_tracks 
      WHERE order_id = ? 
      ORDER BY created_at ASC
    `).all(orderId);
  }
};

module.exports = ExceptionService;
