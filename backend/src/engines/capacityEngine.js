const db = require('../database/init');
const DispatchEngine = require('./dispatchEngine');
const GeofenceEngine = require('./geofenceEngine');

const CapacityEngine = {
  calculatePathCost(startLat, startLng, endLat, endLng, driverLat, driverLng) {
    const toPickupDistance = DispatchEngine.calculateDistance(
      driverLat, driverLng, startLat, startLng
    );
    const rideDistance = DispatchEngine.calculateDistance(
      startLat, startLng, endLat, endLng
    );
    const totalDistance = toPickupDistance + rideDistance;

    const etaInfo = GeofenceEngine.calculateETA(startLat, startLng, endLat, endLng);
    
    const baseCost = totalDistance * 1.5;
    const timeCost = etaInfo.estimatedMinutes * 0.1;
    const distancePenalty = toPickupDistance > 2.0 ? (toPickupDistance - 2.0) * 1.2 : 0;

    return {
      toPickupDistance,
      rideDistance,
      totalDistance,
      estimatedMinutes: etaInfo.estimatedMinutes,
      baseCost: Math.round(baseCost * 100) / 100,
      timeCost: Math.round(timeCost * 100) / 100,
      distancePenalty: Math.round(distancePenalty * 100) / 100,
      totalCost: Math.round((baseCost + timeCost + distancePenalty) * 100) / 100
    };
  },

  matchCapacity(order) {
    const availableDrivers = DispatchEngine.getAvailableDrivers(
      order.start_lat,
      order.start_lng,
      order.ride_type
    );

    if (availableDrivers.length === 0) {
      return {
        success: false,
        error: '当前区域暂无可用运力'
      };
    }

    const scoredDrivers = availableDrivers.map(driver => {
      const pathCost = this.calculatePathCost(
        order.start_lat,
        order.start_lng,
        order.end_lat,
        order.end_lng,
        driver.current_lat,
        driver.current_lng
      );

      return {
        ...driver,
        pathCost,
        matchScore: driver.score + (1 / (pathCost.totalCost + 1))
      };
    });

    scoredDrivers.sort((a, b) => b.matchScore - a.matchScore);

    return {
      success: true,
      drivers: scoredDrivers,
      bestMatch: scoredDrivers[0]
    };
  },

  getCapacityStats(centerLat, centerLng, radiusKm = 5.0) {
    const allDrivers = db.prepare(`
      SELECT d.*, u.name as driver_name, u.phone
      FROM drivers d
      JOIN users u ON d.user_id = u.id
    `).all();

    const driversInRadius = allDrivers.filter(driver => {
      const distance = DispatchEngine.calculateDistance(
        centerLat, centerLng,
        driver.current_lat, driver.current_lng
      );
      return distance <= radiusKm;
    });

    const stats = {
      total: driversInRadius.length,
      idle: driversInRadius.filter(d => d.status === 'idle').length,
      assigned: driversInRadius.filter(d => d.status === 'assigned').length,
      inRide: driversInRadius.filter(d => d.status === 'in_ride').length,
      offline: driversInRadius.filter(d => d.status === 'offline').length,
      avgRating: driversInRadius.length > 0 
        ? driversInRadius.reduce((sum, d) => sum + d.rating, 0) / driversInRadius.length 
        : 0,
      drivers: driversInRadius
    };

    stats.utilizationRate = stats.total > 0 
      ? (stats.assigned + stats.inRide) / stats.total 
      : 0;

    return stats;
  },

  predictDemand(timeSlot, dayOfWeek) {
    const historicalData = db.prepare(`
      SELECT strftime('%Y-%m-%d', created_at, 'unixepoch') as date,
             COUNT(*) as order_count
      FROM order_main
      WHERE strftime('%w', created_at, 'unixepoch') = ?
      GROUP BY date
    `).all(dayOfWeek);

    const baseDemand = historicalData.length > 0
      ? historicalData.reduce((sum, d) => sum + d.order_count, 0) / historicalData.length
      : 10;

    let multiplier = 1.0;
    if (timeSlot === 'morning_peak') multiplier = 2.5;
    else if (timeSlot === 'evening_peak') multiplier = 2.2;
    else if (timeSlot === 'night') multiplier = 0.8;
    else if (timeSlot === 'weekend') multiplier = 1.5;

    return {
      predictedOrders: Math.round(baseDemand * multiplier),
      multiplier,
      timeSlot,
      dayOfWeek
    };
  },

  optimizeDispatchBatch(orders) {
    if (!orders || orders.length === 0) {
      return { assignments: [], unassigned: [] };
    }

    const assignments = [];
    const unassigned = [];
    const assignedDrivers = new Set();

    for (const order of orders) {
      const matchResult = this.matchCapacity(order);
      
      if (!matchResult.success) {
        unassigned.push({
          orderId: order.id,
          orderNo: order.order_no,
          reason: matchResult.error
        });
        continue;
      }

      const availableDriver = matchResult.drivers.find(d => !assignedDrivers.has(d.id));
      
      if (!availableDriver) {
        unassigned.push({
          orderId: order.id,
          orderNo: order.order_no,
          reason: '所有司机已被分配'
        });
        continue;
      }

      assignedDrivers.add(availableDriver.id);
      assignments.push({
        orderId: order.id,
        orderNo: order.order_no,
        driverId: availableDriver.id,
        driverName: availableDriver.driver_name,
        distance: availableDriver.distance,
        score: availableDriver.matchScore
      });
    }

    return {
      assignments,
      unassigned,
      totalOrders: orders.length,
      assignmentRate: assignments.length / orders.length
    };
  }
};

module.exports = CapacityEngine;
