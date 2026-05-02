const { v4: uuidv4 } = require('uuid');
const db = require('../database/init');

const DispatchEngine = {
  DISPATCH_RULES: {
    MAX_DISTANCE: 3.0,
    MAX_WAIT_TIME: 120,
    RATING_THRESHOLD: 4.0,
    ORDER_BALANCE_WEIGHT: 0.3,
    DISTANCE_WEIGHT: 0.4,
    RATING_WEIGHT: 0.2,
    WAIT_TIME_WEIGHT: 0.1
  },

  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  },

  getAvailableDrivers(startLat, startLng, rideType = 'standard') {
    const drivers = db.prepare(`
      SELECT d.*, u.name as driver_name, u.phone
      FROM drivers d
      JOIN users u ON d.user_id = u.id
      WHERE d.status = 'idle'
      ORDER BY d.rating DESC
    `).all();

    const availableDrivers = drivers.map(driver => {
      const distance = this.calculateDistance(
        startLat, startLng,
        driver.current_lat, driver.current_lng
      );
      
      return {
        ...driver,
        distance,
        score: this.calculateDriverScore(driver, distance)
      };
    }).filter(driver => driver.distance <= this.DISPATCH_RULES.MAX_DISTANCE);

    return availableDrivers.sort((a, b) => b.score - a.score);
  },

  calculateDriverScore(driver, distance) {
    const normalizedDistance = 1 - Math.min(distance / this.DISPATCH_RULES.MAX_DISTANCE, 1);
    const normalizedRating = (driver.rating - 3) / 2;
    const normalizedOrderCount = 1 - Math.min(driver.order_count / 100, 1);
    
    return (
      normalizedDistance * this.DISPATCH_RULES.DISTANCE_WEIGHT +
      normalizedRating * this.DISPATCH_RULES.RATING_WEIGHT +
      normalizedOrderCount * this.DISPATCH_RULES.ORDER_BALANCE_WEIGHT
    );
  },

  dispatchOrder(order, driver = null) {
    const availableDrivers = this.getAvailableDrivers(
      order.start_lat,
      order.start_lng,
      order.ride_type
    );

    if (availableDrivers.length === 0) {
      return {
        success: false,
        error: '当前暂无可用司机',
        retryAfter: 30
      };
    }

    const selectedDriver = driver 
      ? availableDrivers.find(d => d.id === driver.id)
      : availableDrivers[0];

    if (!selectedDriver) {
      return {
        success: false,
        error: '指定司机不可用',
        retryAfter: 30
      };
    }

    db.prepare(`
      UPDATE drivers 
      SET status = 'assigned', updated_at = strftime('%s', 'now')
      WHERE id = ?
    `).run(selectedDriver.id);

    db.prepare(`
      UPDATE order_main 
      SET driver_id = ?, status = 'driver_assigned', updated_at = strftime('%s', 'now')
      WHERE id = ?
    `).run(selectedDriver.id, order.id);

    return {
      success: true,
      driver: selectedDriver,
      eta: Math.round(selectedDriver.distance * 4)
    };
  },

  checkDuplicateOrder(passengerId) {
    const fiveMinutesAgo = Math.floor(Date.now() / 1000) - 300;
    const existingOrder = db.prepare(`
      SELECT id FROM order_main 
      WHERE passenger_id = ? 
      AND status IN ('pending', 'driver_assigned', 'driver_accepted', 'in_progress')
      AND created_at > ?
      LIMIT 1
    `).get(passengerId, fiveMinutesAgo);

    return !!existingOrder;
  },

  validateOrderFields(orderData) {
    const errors = [];
    
    if (!orderData.start_address || orderData.start_address.trim() === '') {
      errors.push('出发地址不能为空');
    }
    if (!orderData.end_address || orderData.end_address.trim() === '') {
      errors.push('目的地地址不能为空');
    }
    if (orderData.start_lat === undefined || orderData.start_lng === undefined) {
      errors.push('出发地坐标不能为空');
    }
    if (orderData.end_lat === undefined || orderData.end_lng === undefined) {
      errors.push('目的地坐标不能为空');
    }
    if (!orderData.passenger_id) {
      errors.push('乘客信息不能为空');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
};

module.exports = DispatchEngine;
