const { EXCEPTION_TYPES, EXCEPTION_SEVERITY, generateId } = require('./stateMachine');

function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const locationRules = {
  validateLocation: (lat, lng) => {
    const errors = [];
    
    if (lat === undefined || lat === null) {
      errors.push('纬度不能为空');
    } else if (lat < -90 || lat > 90) {
      errors.push('纬度必须在 -90 到 90 之间');
    }
    
    if (lng === undefined || lng === null) {
      errors.push('经度不能为空');
    } else if (lng < -180 || lng > 180) {
      errors.push('经度必须在 -180 到 180 之间');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  },

  checkDrift: (currentLat, currentLng, expectedLat, expectedLng, thresholdMeters = 100) => {
    const distance = calculateDistance(currentLat, currentLng, expectedLat, expectedLng);
    const isDrifted = distance > thresholdMeters;
    
    return {
      isDrifted,
      distance,
      thresholdMeters,
      exceptionType: isDrifted ? EXCEPTION_TYPES.LOCATION_DRIFT : null,
      severity: isDrifted ? (distance > 500 ? EXCEPTION_SEVERITY.HIGH : EXCEPTION_SEVERITY.MEDIUM) : null
    };
  },

  calculateETA: (distanceMeters, averageSpeedKmh = 40) => {
    const speedMs = (averageSpeedKmh * 1000) / 3600;
    const etaSeconds = Math.round(distanceMeters / speedMs);
    
    return {
      distanceMeters,
      averageSpeedKmh,
      etaSeconds,
      etaFormatted: formatDuration(etaSeconds)
    };
  },

  adjustETA: (baseETA, trafficFactor = 1.0, weatherFactor = 1.0, roadConditionFactor = 1.0) => {
    const adjustedETA = Math.round(baseETA * trafficFactor * weatherFactor * roadConditionFactor);
    
    return {
      baseETA,
      adjustedETA,
      factors: {
        trafficFactor,
        weatherFactor,
        roadConditionFactor
      },
      adjustmentSeconds: adjustedETA - baseETA
    };
  }
};

const routeRules = {
  planRoute: (originLat, originLng, destLat, destLng, options = {}) => {
    const distance = calculateDistance(originLat, originLng, destLat, destLng);
    const baseETA = locationRules.calculateETA(distance, options.averageSpeedKmh);
    
    const routeTypes = ['fastest', 'shortest', 'no_toll', 'avoid_highway'];
    const routes = routeTypes.map((type, index) => {
      const distanceFactor = type === 'shortest' ? 0.95 : type === 'no_toll' ? 1.1 : type === 'avoid_highway' ? 1.2 : 1;
      const timeFactor = type === 'fastest' ? 0.9 : type === 'shortest' ? 1.0 : type === 'no_toll' ? 1.2 : type === 'avoid_highway' ? 1.3 : 1;
      
      return {
        routeId: generateId(),
        routeType: type,
        distanceMeters: Math.round(distance * distanceFactor),
        durationSeconds: Math.round(baseETA.etaSeconds * timeFactor),
        trafficLevel: ['light', 'moderate', 'heavy', 'severe'][Math.floor(Math.random() * 4)],
        routeSummary: generateRouteSummary(type, distance),
        steps: generateRouteSteps(originLat, originLng, destLat, destLng, index)
      };
    });
    
    return {
      origin: { lat: originLat, lng: originLng },
      destination: { lat: destLat, lng: destLng },
      routes,
      recommendedRouteIndex: 0
    };
  },

  checkRouteDeviation: (currentLat, currentLng, routePath, thresholdMeters = 50) => {
    if (!routePath || routePath.length < 2) {
      return { isDeviated: false, reason: '路线数据不完整' };
    }
    
    let minDistance = Infinity;
    for (let i = 0; i < routePath.length - 1; i++) {
      const p1 = routePath[i];
      const p2 = routePath[i + 1];
      const dist = pointToLineDistance(currentLat, currentLng, p1.lat, p1.lng, p2.lat, p2.lng);
      minDistance = Math.min(minDistance, dist);
    }
    
    const isDeviated = minDistance > thresholdMeters;
    
    return {
      isDeviated,
      distanceFromRoute: minDistance,
      thresholdMeters,
      exceptionType: isDeviated ? EXCEPTION_TYPES.ROUTE_DEVIATION : null,
      severity: isDeviated ? (minDistance > 200 ? EXCEPTION_SEVERITY.HIGH : EXCEPTION_SEVERITY.MEDIUM) : null
    };
  }
};

const poiRules = {
  validatePOI: (poi) => {
    const errors = [];
    
    if (!poi.name || poi.name.trim() === '') {
      errors.push('POI名称不能为空');
    }
    
    const locationValidation = locationRules.validateLocation(poi.lat, poi.lng);
    if (!locationValidation.valid) {
      errors.push(...locationValidation.errors);
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  },

  checkPOIConflict: (poiId, existingPOIs, radiusMeters = 50) => {
    const targetPOI = existingPOIs.find(p => p.poi_id === poiId);
    if (!targetPOI) {
      return { hasConflict: false, reason: '目标POI不存在' };
    }
    
    const conflicts = existingPOIs.filter(p => {
      if (p.poi_id === poiId) return false;
      const distance = calculateDistance(targetPOI.lat, targetPOI.lng, p.lat, p.lng);
      return distance < radiusMeters;
    });
    
    return {
      hasConflict: conflicts.length > 0,
      conflicts,
      radiusMeters
    };
  },

  canLockPOI: (poi, orderNo) => {
    if (!poi) {
      return { canLock: false, reason: 'POI不存在' };
    }
    
    if (poi.is_locked === 1) {
      if (poi.locked_by_order === orderNo) {
        return { canLock: true, reason: '已被当前订单锁定' };
      }
      return { canLock: false, reason: `POI已被订单 ${poi.locked_by_order} 锁定` };
    }
    
    return { canLock: true, reason: '可以锁定' };
  },

  checkNearbyPOIs: (lat, lng, pois, radiusMeters = 1000) => {
    return pois
      .map(poi => ({
        ...poi,
        distance: calculateDistance(lat, lng, poi.lat, poi.lng)
      }))
      .filter(poi => poi.distance <= radiusMeters)
      .sort((a, b) => a.distance - b.distance);
  }
};

const etaCorrectionRules = {
  correctETA: (currentLat, currentLng, destLat, destLng, originalETA, historicalData = {}) => {
    const remainingDistance = calculateDistance(currentLat, currentLng, destLat, destLng);
    const remainingETA = locationRules.calculateETA(remainingDistance);
    
    const averageSpeed = historicalData.averageSpeedKmh || 40;
    const trafficMultiplier = historicalData.trafficMultiplier || 1.0;
    
    const correctedETA = Math.round(remainingETA.etaSeconds * trafficMultiplier);
    
    const progress = {
      originalETA,
      remainingDistance,
      remainingETA: remainingETA.etaSeconds,
      correctedETA,
      adjustment: correctedETA - remainingETA.etaSeconds,
      progressPercentage: originalETA > 0 ? Math.max(0, Math.min(100, ((originalETA - remainingETA.etaSeconds) / originalETA) * 100)) : 0
    };
    
    return {
      ...progress,
      factors: {
        averageSpeed,
        trafficMultiplier,
        ...historicalData
      }
    };
  },

  checkGeofence: (currentLat, currentLng, centerLat, centerLng, radiusMeters = 100) => {
    const distance = calculateDistance(currentLat, currentLng, centerLat, centerLng);
    const isInside = distance <= radiusMeters;
    
    return {
      isInside,
      distance,
      radiusMeters,
      boundaryCrossed: isInside ? null : (distance > radiusMeters ? 'outside' : 'inside')
    };
  },

  predictArrival: (trajectories, destLat, destLng) => {
    if (!trajectories || trajectories.length < 2) {
      return { error: '轨迹数据不足，无法预测' };
    }
    
    const latestTraj = trajectories[trajectories.length - 1];
    const previousTraj = trajectories[trajectories.length - 2];
    
    const distanceSinceLast = calculateDistance(
      previousTraj.lat, previousTraj.lng,
      latestTraj.lat, latestTraj.lng
    );
    const timeSinceLast = (new Date(latestTraj.timestamp) - new Date(previousTraj.timestamp)) / 1000;
    
    const currentSpeedKmh = timeSinceLast > 0 ? (distanceSinceLast / 1000) / (timeSinceLast / 3600) : 0;
    
    const distanceToDest = calculateDistance(latestTraj.lat, latestTraj.lng, destLat, destLng);
    const estimatedTimeToDest = currentSpeedKmh > 0 
      ? (distanceToDest / 1000) / (currentSpeedKmh / 3600)
      : locationRules.calculateETA(distanceToDest).etaSeconds;
    
    return {
      currentLocation: { lat: latestTraj.lat, lng: latestTraj.lng },
      currentSpeedKmh: Math.round(currentSpeedKmh * 10) / 10,
      distanceToDestination: Math.round(distanceToDest),
      estimatedTimeToDestination: Math.round(estimatedTimeToDest),
      estimatedArrivalTime: new Date(Date.now() + estimatedTimeToDest * 1000).toISOString()
    };
  }
};

function pointToLineDistance(pointLat, pointLng, lineLat1, lineLng1, lineLat2, lineLng2) {
  const A = pointLat - lineLat1;
  const B = pointLng - lineLng1;
  const C = lineLat2 - lineLat1;
  const D = lineLng2 - lineLng1;
  
  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;
  
  if (lenSq !== 0) {
    param = dot / lenSq;
  }
  
  let xx, yy;
  
  if (param < 0) {
    xx = lineLat1;
    yy = lineLng1;
  } else if (param > 1) {
    xx = lineLat2;
    yy = lineLng2;
  } else {
    xx = lineLat1 + param * C;
    yy = lineLng1 + param * D;
  }
  
  return calculateDistance(pointLat, pointLng, xx, yy);
}

function formatDuration(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}小时${minutes}分钟${secs}秒`;
  } else if (minutes > 0) {
    return `${minutes}分钟${secs}秒`;
  } else {
    return `${secs}秒`;
  }
}

function generateRouteSummary(type, distance) {
  const summaries = {
    fastest: `最快路线，距离约 ${(distance / 1000).toFixed(1)} 公里，预计红绿灯较少`,
    shortest: `最短路线，距离约 ${(distance / 1000).toFixed(1)} 公里，可能经过小路`,
    no_toll: `无收费路线，距离约 ${(distance / 1000).toFixed(1)} 公里，避开收费站`,
    avoid_highway: `不走高速，距离约 ${(distance / 1000).toFixed(1)} 公里，优先选择地面道路`
  };
  return summaries[type] || `路线距离约 ${(distance / 1000).toFixed(1)} 公里`;
}

function generateRouteSteps(originLat, originLng, destLat, destLng, variant) {
  const latDiff = destLat - originLat;
  const lngDiff = destLng - originLng;
  
  return [
    {
      instruction: '从起点出发',
      distance: 100 + variant * 50,
      duration: 30 + variant * 10,
      maneuver: 'start'
    },
    {
      instruction: latDiff > 0 ? '向北行驶' : '向南行驶',
      distance: Math.abs(latDiff * 111000 * 0.3),
      duration: Math.abs(latDiff * 111000 * 0.3 / 11),
      maneuver: 'straight'
    },
    {
      instruction: lngDiff > 0 ? '向东转' : '向西转',
      distance: Math.abs(lngDiff * 111000 * 0.4),
      duration: Math.abs(lngDiff * 111000 * 0.4 / 11),
      maneuver: 'turn'
    },
    {
      instruction: '继续直行',
      distance: Math.abs(latDiff * 111000 * 0.3 + lngDiff * 111000 * 0.3),
      duration: Math.abs((latDiff * 111000 * 0.3 + lngDiff * 111000 * 0.3) / 11),
      maneuver: 'straight'
    },
    {
      instruction: '到达目的地',
      distance: 50,
      duration: 20,
      maneuver: 'end'
    }
  ].map(step => ({
    ...step,
    distance: Math.round(step.distance),
    duration: Math.round(step.duration)
  }));
}

module.exports = {
  locationRules,
  routeRules,
  poiRules,
  etaCorrectionRules,
  calculateDistance
};
