const db = require('../models/database');

const PARKING_FENCE = {
  centerLat: 39.9042,
  centerLng: 116.4074,
  radius: 500
};

const GATES = {
  'main_gate': { lat: 39.9045, lng: 116.4070, name: '主入口' },
  'side_gate': { lat: 39.9040, lng: 116.4078, name: '侧入口' },
  'exit_gate': { lat: 39.9038, lng: 116.4072, name: '出口' }
};

const haversineDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c;
};

const isInsideGeofence = (lat, lng, fence = PARKING_FENCE) => {
  const distance = haversineDistance(lat, lng, fence.centerLat, fence.centerLng);
  return distance <= fence.radius;
};

const findNearestGate = (lat, lng) => {
  let nearest = null;
  let minDistance = Infinity;
  
  for (const [key, gate] of Object.entries(GATES)) {
    const distance = haversineDistance(lat, lng, gate.lat, gate.lng);
    if (distance < minDistance) {
      minDistance = distance;
      nearest = { id: key, ...gate, distance: minDistance };
    }
  }
  
  return nearest;
};

const calculateETA = (currentLat, currentLng, targetLat, targetLng, avgSpeed = 30) => {
  const distance = haversineDistance(currentLat, currentLng, targetLat, targetLng);
  const speedMetersPerSecond = avgSpeed * 1000 / 3600;
  const etaSeconds = distance / speedMetersPerSecond;
  
  return Math.ceil(etaSeconds);
};

const correctETAWithTrajectory = (orderId, currentLat, currentLng, targetLat, targetLng) => {
  const trajectories = db.prepare(`
    SELECT * FROM trajectories 
    WHERE order_id = ? 
    ORDER BY recorded_at DESC 
    LIMIT 10
  `).all(orderId);

  let avgSpeed = 30;
  
  if (trajectories.length >= 2) {
    let totalDistance = 0;
    let totalTime = 0;
    
    for (let i = 1; i < trajectories.length; i++) {
      const distance = haversineDistance(
        trajectories[i-1].lat, trajectories[i-1].lng,
        trajectories[i].lat, trajectories[i].lng
      );
      
      const timeDiff = (new Date(trajectories[i-1].recorded_at) - new Date(trajectories[i].recorded_at)) / 1000;
      
      totalDistance += distance;
      totalTime += timeDiff;
    }
    
    if (totalTime > 0) {
      const speedMps = totalDistance / totalTime;
      avgSpeed = speedMps * 3.6;
    }
  }

  const eta = calculateETA(currentLat, currentLng, targetLat, targetLng, avgSpeed);
  
  const originalETA = calculateETA(currentLat, currentLng, targetLat, targetLng);
  const correctionFactor = Math.min(1.5, Math.max(0.5, eta / originalETA));
  const correctedETA = Math.ceil(eta * correctionFactor);
  
  return {
    originalETA,
    correctedETA,
    avgSpeed,
    correctionFactor,
    trajectoryPoints: trajectories.length
  };
};

const recordTrajectory = (orderId, lat, lng, speed = null, direction = null, accuracy = null, source = 'gps') => {
  const stmt = db.prepare(`
    INSERT INTO trajectories (order_id, lat, lng, speed, direction, accuracy, source)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  
  const result = stmt.run(orderId, lat, lng, speed, direction, accuracy, source);
  
  return result.lastInsertRowid;
};

const checkLocationDrift = (orderId, newLat, newLng, threshold = 200) => {
  const lastTrajectory = db.prepare(`
    SELECT * FROM trajectories 
    WHERE order_id = ? 
    ORDER BY recorded_at DESC 
    LIMIT 1
  `).get(orderId);

  if (!lastTrajectory) {
    return { isDrift: false, distance: 0 };
  }

  const distance = haversineDistance(
    lastTrajectory.lat, lastTrajectory.lng,
    newLat, newLng
  );

  const timeDiff = (new Date() - new Date(lastTrajectory.recorded_at)) / 1000;
  const expectedMaxDistance = timeDiff * 50;

  const isDrift = distance > Math.max(threshold, expectedMaxDistance);

  return {
    isDrift,
    distance,
    threshold: Math.max(threshold, expectedMaxDistance),
    timeDiff
  };
};

module.exports = {
  PARKING_FENCE,
  GATES,
  haversineDistance,
  isInsideGeofence,
  findNearestGate,
  calculateETA,
  correctETAWithTrajectory,
  recordTrajectory,
  checkLocationDrift
};