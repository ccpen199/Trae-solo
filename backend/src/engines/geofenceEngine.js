const db = require('../database/init');
const DispatchEngine = require('./dispatchEngine');

const GeofenceEngine = {
  checkPointInGeofence(lat, lng, geofence) {
    const distance = DispatchEngine.calculateDistance(
      lat, lng,
      geofence.center_lat, geofence.center_lng
    );
    return distance <= geofence.radius / 1000;
  },

  getGeofencesForPoint(lat, lng) {
    const geofences = db.prepare(`
      SELECT * FROM geofences WHERE status = 'active'
    `).all();

    return geofences.filter(gf => this.checkPointInGeofence(lat, lng, gf));
  },

  getActiveGeofences() {
    return db.prepare(`
      SELECT * FROM geofences WHERE status = 'active'
    `).all();
  },

  calculateETA(startLat, startLng, endLat, endLng, trafficFactor = 1.0) {
    const distance = DispatchEngine.calculateDistance(startLat, startLng, endLat, endLng);
    
    const avgSpeed = 30.0;
    const baseMinutes = (distance / avgSpeed) * 60;
    const adjustedMinutes = baseMinutes * trafficFactor;

    const startGeofences = this.getGeofencesForPoint(startLat, startLng);
    const endGeofences = this.getGeofencesForPoint(endLat, endLng);

    let geofenceAdjustment = 0;
    startGeofences.forEach(gf => {
      if (gf.type === 'airport') geofenceAdjustment += 10;
      if (gf.type === 'business') geofenceAdjustment += 5;
      if (gf.type === 'transport') geofenceAdjustment += 3;
    });
    endGeofences.forEach(gf => {
      if (gf.type === 'airport') geofenceAdjustment += 10;
      if (gf.type === 'business') geofenceAdjustment += 5;
      if (gf.type === 'transport') geofenceAdjustment += 3;
    });

    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay();

    let timeAdjustment = 1.0;
    if (day >= 1 && day <= 5) {
      if (hour >= 7 && hour < 9) timeAdjustment = 1.5;
      if (hour >= 17 && hour < 19) timeAdjustment = 1.4;
    }
    if (hour >= 23 || hour < 6) {
      timeAdjustment = 0.8;
    }

    const finalETA = Math.round((adjustedMinutes + geofenceAdjustment) * timeAdjustment);

    return {
      distance: Math.round(distance * 100) / 100,
      estimatedMinutes: finalETA,
      baseMinutes: Math.round(baseMinutes),
      trafficAdjustment: trafficFactor,
      geofenceAdjustment,
      timeAdjustment,
      startGeofences: startGeofences.map(g => g.name),
      endGeofences: endGeofences.map(g => g.name)
    };
  },

  checkArrival(driverLat, driverLng, endLat, endLng, thresholdMeters = 50) {
    const distance = DispatchEngine.calculateDistance(
      driverLat, driverLng, endLat, endLng
    );
    return distance * 1000 <= thresholdMeters;
  },

  checkRouteDeviation(currentLat, currentLng, previousLat, previousLng, 
                       startLat, startLng, endLat, endLng, maxDeviationKm = 2.0) {
    const idealDistance = DispatchEngine.calculateDistance(startLat, startLng, endLat, endLng);
    const toEndDistance = DispatchEngine.calculateDistance(currentLat, currentLng, endLat, endLng);
    const toStartDistance = DispatchEngine.calculateDistance(currentLat, currentLng, startLat, startLng);
    
    const routeProgress = (idealDistance - toEndDistance) / idealDistance;
    
    if (routeProgress < 0.9 && toStartDistance > maxDeviationKm && toEndDistance > maxDeviationKm) {
      const pathDistance = DispatchEngine.calculateDistance(previousLat, previousLng, currentLat, currentLng);
      const straightToEndDistance = DispatchEngine.calculateDistance(previousLat, previousLng, endLat, endLng);
      
      if (pathDistance > 0 && toEndDistance > straightToEndDistance + 1.0) {
        return {
          isDeviating: true,
          deviationDistance: toEndDistance - straightToEndDistance,
          currentPosition: { lat: currentLat, lng: currentLng },
          previousPosition: { lat: previousLat, lng: previousLng }
        };
      }
    }

    return {
      isDeviating: false
    };
  },

  checkLocationDrift(locations, thresholdMeters = 500) {
    if (locations.length < 3) return false;

    const recentLocations = locations.slice(-5);
    const avgLat = recentLocations.reduce((sum, l) => sum + l.lat, 0) / recentLocations.length;
    const avgLng = recentLocations.reduce((sum, l) => sum + l.lng, 0) / recentLocations.length;

    let driftCount = 0;
    recentLocations.forEach(loc => {
      const dist = DispatchEngine.calculateDistance(loc.lat, loc.lng, avgLat, avgLng) * 1000;
      if (dist > thresholdMeters) driftCount++;
    });

    return driftCount >= 2;
  },

  recordDriverLocation(driverId, lat, lng, accuracy = null, speed = null, heading = null) {
    const { v4: uuidv4 } = require('uuid');
    
    const locationId = uuidv4();
    db.prepare(`
      INSERT INTO driver_locations (id, driver_id, lat, lng, accuracy, speed, heading)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(locationId, driverId, lat, lng, accuracy, speed, heading);

    db.prepare(`
      UPDATE drivers 
      SET current_lat = ?, current_lng = ?, updated_at = strftime('%s', 'now')
      WHERE id = ?
    `).run(lat, lng, driverId);

    return {
      id: locationId,
      driverId,
      lat,
      lng,
      timestamp: Date.now()
    };
  },

  getRecentDriverLocations(driverId, limit = 100) {
    return db.prepare(`
      SELECT * FROM driver_locations 
      WHERE driver_id = ? 
      ORDER BY created_at DESC 
      LIMIT ?
    `).all(driverId, limit);
  }
};

module.exports = GeofenceEngine;
