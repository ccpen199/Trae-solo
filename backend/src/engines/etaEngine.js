class ETAEngine {
  constructor() {
    this.baseSpeed = 40;
    this.trafficFactors = {
      clear: 1.0,
      light: 1.1,
      moderate: 1.3,
      heavy: 1.6,
    };
    this.weatherFactors = {
      normal: 1.0,
      rain: 1.2,
      snow: 1.4,
      fog: 1.3,
    };
    this.geofenceBuffer = 50;
  }

  calculateETA(origin, destination, options = {}) {
    const distance = this.calculateDistance(
      origin.lat,
      origin.lng,
      destination.lat,
      destination.lng
    );

    const traffic = options.traffic || 'clear';
    const weather = options.weather || 'normal';
    const routeType = options.routeType || 'FASTEST';

    let baseSpeed = this.baseSpeed;
    switch (routeType) {
      case 'FASTEST':
        baseSpeed = 60;
        break;
      case 'SHORTEST':
        baseSpeed = 35;
        break;
      case 'NO_HIGHWAY':
        baseSpeed = 30;
        break;
      case 'AVOID_TRAFFIC':
        baseSpeed = 45;
        break;
    }

    const trafficFactor = this.trafficFactors[traffic] || 1.0;
    const weatherFactor = this.weatherFactors[weather] || 1.0;

    const effectiveSpeed = baseSpeed / (trafficFactor * weatherFactor);
    const etaSeconds = Math.round((distance / 1000) / effectiveSpeed * 3600);

    const now = new Date();
    const estimatedArrival = new Date(now.getTime() + etaSeconds * 1000);

    return {
      distance,
      distanceText: this.formatDistance(distance),
      etaSeconds,
      etaText: this.formatDuration(etaSeconds),
      estimatedArrival: estimatedArrival.toISOString(),
      traffic,
      weather,
      effectiveSpeed,
      breakdown: {
        baseDuration: Math.round((distance / 1000) / baseSpeed * 3600),
        trafficDelay: Math.round(((distance / 1000) / baseSpeed * 3600) * (trafficFactor - 1)),
        weatherDelay: Math.round(((distance / 1000) / baseSpeed * 3600) * (weatherFactor - 1)),
      },
    };
  }

  updateETA(currentLocation, destination, remainingDistance, options = {}) {
    const realTimeFactor = options.realTimeFactor || 1.0;
    const currentSpeed = options.currentSpeed;

    let effectiveSpeed = currentSpeed || this.baseSpeed;
    
    if (options.recentSpeeds && options.recentSpeeds.length > 0) {
      const avgSpeed = options.recentSpeeds.reduce((a, b) => a + b, 0) / options.recentSpeeds.length;
      effectiveSpeed = (effectiveSpeed + avgSpeed) / 2;
    }

    const remainingETA = Math.round((remainingDistance / 1000) / effectiveSpeed * 3600);
    const progress = options.totalDistance 
      ? (1 - remainingDistance / options.totalDistance) * 100 
      : 0;

    return {
      remainingDistance,
      remainingDistanceText: this.formatDistance(remainingDistance),
      remainingETA,
      remainingETAText: this.formatDuration(remainingETA),
      progress: Math.round(progress),
      effectiveSpeed,
      lastUpdated: new Date().toISOString(),
    };
  }

  checkGeofenceArrival(currentLocation, destination, geofenceRadius = 100) {
    const distance = this.calculateDistance(
      currentLocation.lat,
      currentLocation.lng,
      destination.lat,
      destination.lng
    );

    const bufferRadius = geofenceRadius + this.geofenceBuffer;

    return {
      isArrived: distance <= geofenceRadius,
      isInBufferZone: distance <= bufferRadius,
      distanceToDestination: distance,
      geofenceRadius,
      bufferRadius,
      zone: distance <= geofenceRadius 
        ? 'ARRIVAL_ZONE' 
        : distance <= bufferRadius 
          ? 'BUFFER_ZONE' 
          : 'OUTSIDE_ZONE',
    };
  }

  calculateRealTimeETA(
    currentLocation, 
    destination, 
    routeWaypoints,
    historicalData = {}
  ) {
    if (!routeWaypoints || routeWaypoints.length === 0) {
      return this.calculateETA(currentLocation, destination);
    }

    const passedWaypoints = routeWaypoints.filter(wp => 
      this.calculateDistance(currentLocation.lat, currentLocation.lng, wp.lat, wp.lng) < 100
    );

    const remainingWaypoints = routeWaypoints.slice(passedWaypoints.length);

    let remainingDistance = 0;
    let prevPoint = currentLocation;

    for (const wp of remainingWaypoints) {
      remainingDistance += this.calculateDistance(prevPoint.lat, prevPoint.lng, wp.lat, wp.lng);
      prevPoint = wp;
    }

    remainingDistance += this.calculateDistance(
      prevPoint.lat,
      prevPoint.lng,
      destination.lat,
      destination.lng
    );

    const totalDistance = this.calculateTotalRouteDistance(routeWaypoints, currentLocation, destination);
    
    let avgSpeedFactor = 1.0;
    if (historicalData.averageSpeed) {
      avgSpeedFactor = this.baseSpeed / historicalData.averageSpeed;
    }

    const baseETA = Math.round((remainingDistance / 1000) / this.baseSpeed * 3600);
    const adjustedETA = Math.round(baseETA * avgSpeedFactor);

    const progress = totalDistance > 0 
      ? Math.round((1 - remainingDistance / totalDistance) * 100) 
      : 0;

    return {
      remainingDistance,
      remainingDistanceText: this.formatDistance(remainingDistance),
      totalDistance,
      totalDistanceText: this.formatDistance(totalDistance),
      etaSeconds: adjustedETA,
      etaText: this.formatDuration(adjustedETA),
      progress,
      passedWaypoints: passedWaypoints.length,
      remainingWaypoints: remainingWaypoints.length,
      currentWaypointIndex: passedWaypoints.length,
      avgSpeedFactor,
    };
  }

  calculateTotalRouteDistance(waypoints, origin, destination) {
    if (!waypoints || waypoints.length === 0) {
      return this.calculateDistance(origin.lat, origin.lng, destination.lat, destination.lng);
    }

    let totalDistance = 0;
    let prevPoint = origin;

    for (const wp of waypoints) {
      totalDistance += this.calculateDistance(prevPoint.lat, prevPoint.lng, wp.lat, wp.lng);
      prevPoint = wp;
    }

    totalDistance += this.calculateDistance(
      prevPoint.lat,
      prevPoint.lng,
      destination.lat,
      destination.lng
    );

    return totalDistance;
  }

  correctETA(originalETA, correctionFactors = {}) {
    let correctionMultiplier = 1.0;

    if (correctionFactors.trafficDelay) {
      correctionMultiplier += correctionFactors.trafficDelay / 100;
    }

    if (correctionFactors.weatherDelay) {
      correctionMultiplier += correctionFactors.weatherDelay / 100;
    }

    if (correctionFactors.accidentDelay) {
      correctionMultiplier += correctionFactors.accidentDelay / 100;
    }

    if (correctionFactors.roadWorkDelay) {
      correctionMultiplier += correctionFactors.roadWorkDelay / 100;
    }

    if (correctionFactors.customDelay) {
      correctionMultiplier += correctionFactors.customDelay / 100;
    }

    const correctedETA = Math.round(originalETA * correctionMultiplier);

    return {
      originalETA,
      originalETAText: this.formatDuration(originalETA),
      correctedETA,
      correctedETAText: this.formatDuration(correctedETA),
      delay: correctedETA - originalETA,
      delayText: this.formatDuration(correctedETA - originalETA),
      correctionMultiplier,
      correctionFactors,
      isDelayed: correctedETA > originalETA,
      correctionReason: this.getCorrectionReason(correctionFactors),
    };
  }

  getCorrectionReason(factors) {
    const reasons = [];

    if (factors.trafficDelay) reasons.push(`交通拥堵 (+${factors.trafficDelay}%)`);
    if (factors.weatherDelay) reasons.push(`天气影响 (+${factors.weatherDelay}%)`);
    if (factors.accidentDelay) reasons.push(`事故延误 (+${factors.accidentDelay}%)`);
    if (factors.roadWorkDelay) reasons.push(`道路施工 (+${factors.roadWorkDelay}%)`);
    if (factors.customDelay) reasons.push(`自定义调整 (+${factors.customDelay}%)`);

    return reasons.length > 0 ? reasons.join('、') : '无特殊调整';
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
    
    return Math.round(R * c);
  }

  toRad(deg) {
    return deg * (Math.PI / 180);
  }

  formatDistance(meters) {
    if (meters < 1000) {
      return `${meters}米`;
    }
    return `${(meters / 1000).toFixed(1)}公里`;
  }

  formatDuration(seconds) {
    if (seconds < 60) {
      return `${seconds}秒`;
    }
    if (seconds < 3600) {
      return `${Math.round(seconds / 60)}分钟`;
    }
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.round((seconds % 3600) / 60);
    return `${hours}小时${minutes}分钟`;
  }

  generateETAUpdate(trackPoints, destination, routeInfo) {
    if (!trackPoints || trackPoints.length < 2) {
      return null;
    }

    const lastPoint = trackPoints[trackPoints.length - 1];
    const previousPoint = trackPoints[trackPoints.length - 2];

    const distanceSinceLast = this.calculateDistance(
      previousPoint.lat,
      previousPoint.lng,
      lastPoint.lat,
      lastPoint.lng
    );

    const timeSinceLast = (new Date(lastPoint.timestamp) - new Date(previousPoint.timestamp)) / 1000;
    const currentSpeed = timeSinceLast > 0 ? (distanceSinceLast / 1000) / (timeSinceLast / 3600) : 0;

    const recentSpeeds = [];
    for (let i = 1; i < Math.min(trackPoints.length, 5); i++) {
      const dist = this.calculateDistance(
        trackPoints[i - 1].lat,
        trackPoints[i - 1].lng,
        trackPoints[i].lat,
        trackPoints[i].lng
      );
      const time = (new Date(trackPoints[i].timestamp) - new Date(trackPoints[i - 1].timestamp)) / 1000;
      if (time > 0) {
        recentSpeeds.push((dist / 1000) / (time / 3600));
      }
    }

    return this.updateETA(
      { lat: lastPoint.lat, lng: lastPoint.lng },
      destination,
      routeInfo?.remainingDistance || 0,
      {
        currentSpeed,
        recentSpeeds,
        totalDistance: routeInfo?.totalDistance,
      }
    );
  }
}

module.exports = new ETAEngine();
