const { ROUTE_TYPES, EXCEPTION_TYPES } = require('../utils/constants');

class RouteEngine {
  constructor() {
    this.deviationThreshold = 100;
    this.maxDeviationPoints = 5;
  }

  calculateRoutes(origin, destination, options = {}) {
    const routes = [];
    const routeTypes = options.routeTypes || Object.values(ROUTE_TYPES);

    for (const routeType of routeTypes) {
      const route = this.calculateSingleRoute(origin, destination, routeType);
      routes.push(route);
    }

    return {
      routes,
      recommended: routes[0],
      totalRoutes: routes.length,
    };
  }

  calculateSingleRoute(origin, destination, routeType) {
    const baseDistance = this.estimateDistance(origin, destination);
    const baseDuration = this.estimateDuration(baseDistance, routeType);

    let multiplier = 1;
    let name = '';

    switch (routeType) {
      case ROUTE_TYPES.FASTEST:
        multiplier = 0.9;
        name = '最快路线';
        break;
      case ROUTE_TYPES.SHORTEST:
        multiplier = 0.85;
        name = '最短路线';
        break;
      case ROUTE_TYPES.NO_HIGHWAY:
        multiplier = 1.3;
        name = '不走高速';
        break;
      case ROUTE_TYPES.AVOID_TRAFFIC:
        multiplier = 1.1;
        name = '躲避拥堵';
        break;
    }

    const waypoints = this.generateWaypoints(origin, destination, routeType);

    return {
      routeType,
      name,
      distance: Math.round(baseDistance * multiplier),
      duration: Math.round(baseDuration * multiplier),
      eta: Math.round(baseDuration * multiplier),
      waypoints,
      polyline: this.generatePolyline(waypoints),
      trafficCondition: this.estimateTraffic(routeType),
      tolls: routeType === ROUTE_TYPES.NO_HIGHWAY ? 0 : Math.round(baseDistance * 0.05),
      highwayDistance: routeType === ROUTE_TYPES.NO_HIGHWAY ? 0 : Math.round(baseDistance * 0.7),
    };
  }

  estimateDistance(origin, destination) {
    if (!origin || !destination) return 0;

    const latDiff = Math.abs(origin.lat - destination.lat);
    const lngDiff = Math.abs(origin.lng - destination.lng);

    const latDistance = latDiff * 111000;
    const lngDistance = lngDiff * 111000 * Math.cos(origin.lat * Math.PI / 180);

    return Math.round(Math.sqrt(latDistance * latDistance + lngDistance * lngDistance));
  }

  estimateDuration(distance, routeType) {
    let avgSpeed = 40;

    switch (routeType) {
      case ROUTE_TYPES.FASTEST:
        avgSpeed = 60;
        break;
      case ROUTE_TYPES.SHORTEST:
        avgSpeed = 35;
        break;
      case ROUTE_TYPES.NO_HIGHWAY:
        avgSpeed = 30;
        break;
      case ROUTE_TYPES.AVOID_TRAFFIC:
        avgSpeed = 45;
        break;
    }

    return Math.round((distance / 1000) / avgSpeed * 3600);
  }

  generateWaypoints(origin, destination, routeType) {
    const numPoints = 10;
    const waypoints = [];

    for (let i = 0; i <= numPoints; i++) {
      const ratio = i / numPoints;
      const jitter = routeType === ROUTE_TYPES.SHORTEST ? 0 : 
                     (Math.random() - 0.5) * 0.01;

      waypoints.push({
        lat: origin.lat + (destination.lat - origin.lat) * ratio + jitter,
        lng: origin.lng + (destination.lng - origin.lng) * ratio + jitter,
        sequence: i,
      });
    }

    return waypoints;
  }

  generatePolyline(waypoints) {
    if (!waypoints || waypoints.length === 0) return '';

    return waypoints.map(wp => `${wp.lat.toFixed(6)},${wp.lng.toFixed(6)}`).join(';');
  }

  estimateTraffic(routeType) {
    const conditions = ['clear', 'light', 'moderate', 'heavy'];
    const weights = {
      [ROUTE_TYPES.FASTEST]: [0.3, 0.4, 0.2, 0.1],
      [ROUTE_TYPES.SHORTEST]: [0.2, 0.3, 0.3, 0.2],
      [ROUTE_TYPES.NO_HIGHWAY]: [0.1, 0.3, 0.4, 0.2],
      [ROUTE_TYPES.AVOID_TRAFFIC]: [0.5, 0.3, 0.15, 0.05],
    };

    const weight = weights[routeType] || weights[ROUTE_TYPES.FASTEST];
    const random = Math.random();
    let cumulative = 0;

    for (let i = 0; i < conditions.length; i++) {
      cumulative += weight[i];
      if (random < cumulative) {
        return conditions[i];
      }
    }

    return 'clear';
  }

  checkRouteDeviation(currentLocation, routeWaypoints) {
    if (!routeWaypoints || routeWaypoints.length === 0) {
      return { isDeviating: false, message: '无路线数据' };
    }

    const minDistance = Math.min(
      ...routeWaypoints.map(wp => 
        this.calculateDistance(currentLocation.lat, currentLocation.lng, wp.lat, wp.lng)
      )
    );

    const result = {
      isDeviating: minDistance > this.deviationThreshold,
      distanceToRoute: minDistance,
      threshold: this.deviationThreshold,
    };

    if (result.isDeviating) {
      result.closestWaypoint = this.findClosestWaypoint(currentLocation, routeWaypoints);
      result.suggestedAction = 'RETURN_TO_ROUTE';
      result.exceptionType = EXCEPTION_TYPES.ROUTE_DEVIATION;
    }

    return result;
  }

  findClosestWaypoint(location, waypoints) {
    let closest = null;
    let minDistance = Infinity;

    for (const wp of waypoints) {
      const distance = this.calculateDistance(location.lat, location.lng, wp.lat, wp.lng);
      if (distance < minDistance) {
        minDistance = distance;
        closest = wp;
      }
    }

    return closest ? { ...closest, distance: minDistance } : null;
  }

  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371000;
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    return R * c;
  }

  toRad(deg) {
    return deg * (Math.PI / 180);
  }

  analyzeDeviationPattern(deviationPoints) {
    if (!deviationPoints || deviationPoints.length < 3) {
      return { hasPattern: false };
    }

    const deviationCounts = deviationPoints.filter(dp => dp.isDeviating).length;
    const deviationRatio = deviationCounts / deviationPoints.length;

    if (deviationRatio > 0.6) {
      return {
        hasPattern: true,
        pattern: 'SIGNIFICANT_DEVIATION',
        severity: 'HIGH',
        suggestion: '建议联系司机确认是否需要重新规划路线',
        exceptionType: EXCEPTION_TYPES.ROUTE_DEVIATION,
      };
    }

    let consecutiveDeviations = 0;
    let maxConsecutive = 0;

    for (const point of deviationPoints) {
      if (point.isDeviating) {
        consecutiveDeviations++;
        maxConsecutive = Math.max(maxConsecutive, consecutiveDeviations);
      } else {
        consecutiveDeviations = 0;
      }
    }

    if (maxConsecutive >= this.maxDeviationPoints) {
      return {
        hasPattern: true,
        pattern: 'CONSECUTIVE_DEVIATION',
        severity: 'MEDIUM',
        maxConsecutive,
        suggestion: '建议检查是否需要重新规划路线',
        exceptionType: EXCEPTION_TYPES.ROUTE_DEVIATION,
      };
    }

    return { hasPattern: false };
  }

  recalculateRoute(currentLocation, destination, originalRoute) {
    const newRoute = this.calculateSingleRoute(currentLocation, destination, originalRoute.routeType);

    return {
      ...newRoute,
      isRecalculated: true,
      originalDistance: originalRoute.distance,
      additionalDistance: newRoute.distance > originalRoute.distance 
        ? newRoute.distance - originalRoute.distance 
        : 0,
      additionalTime: newRoute.duration > originalRoute.duration 
        ? newRoute.duration - originalRoute.duration 
        : 0,
    };
  }
}

module.exports = new RouteEngine();
