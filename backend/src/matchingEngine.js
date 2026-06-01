const geolib = require('geolib');
const db = require('./database');

const WEIGHTS = {
  distance: 0.35,
  onTimeRate: 0.25,
  loadCapacity: 0.15,
  categorySkill: 0.25
};

function calculateDistanceScore(distance) {
  const maxDistance = 5000;
  const normalized = Math.max(0, 1 - distance / maxDistance);
  return normalized * 100;
}

function calculateOnTimeScore(rate) {
  return Math.min(100, rate);
}

function calculateLoadScore(loadCapacity, orderWeight) {
  if (orderWeight > loadCapacity) return 0;
  const ratio = orderWeight / loadCapacity;
  return (1 - ratio * 0.5) * 100;
}

function calculateSkillScore(proficiency) {
  return proficiency * 100;
}

function findMatchingRiders(order) {
  const startTime = process.hrtime.bigint();

  const { pickup_lat, pickup_lng, category, weight } = order;

  const onlineRiders = db.prepare(`
    SELECT r.*, 
           GROUP_CONCAT(rs.category || ':' || rs.proficiency) as skills
    FROM riders r
    LEFT JOIN rider_skills rs ON r.id = rs.rider_id
    WHERE r.status = 'online'
    GROUP BY r.id
  `).all();

  const scoredRiders = onlineRiders.map(rider => {
    const distance = geolib.getDistance(
      { latitude: rider.latitude, longitude: rider.longitude },
      { latitude: pickup_lat, longitude: pickup_lng }
    );

    const skills = {};
    if (rider.skills) {
      rider.skills.split(',').forEach(s => {
        const [cat, prof] = s.split(':');
        skills[cat] = parseFloat(prof);
      });
    }

    const distanceScore = calculateDistanceScore(distance);
    const onTimeScore = calculateOnTimeScore(rider.on_time_rate);
    const loadScore = calculateLoadScore(rider.load_capacity, weight || 0);
    const skillScore = calculateSkillScore(skills[category] || 0.3);

    const totalScore = 
      distanceScore * WEIGHTS.distance +
      onTimeScore * WEIGHTS.onTimeRate +
      loadScore * WEIGHTS.loadCapacity +
      skillScore * WEIGHTS.categorySkill;

    return {
      ...rider,
      distance,
      distanceScore,
      onTimeScore,
      loadScore,
      skillScore,
      totalScore
    };
  }).sort((a, b) => b.totalScore - a.totalScore);

  const endTime = process.hrtime.bigint();
  const durationMs = Number(endTime - startTime) / 1e6;

  return {
    riders: scoredRiders,
    durationMs,
    bestMatch: scoredRiders[0] || null
  };
}

function matchOrderToRider(orderId, isBackup = false) {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  if (!order) {
    return { success: false, error: '订单不存在' };
  }
  
  if (!isBackup && order.status !== 'pending') {
    return { success: false, error: '订单不可匹配' };
  }
  
  if (isBackup && !['matched', 'picking'].includes(order.status)) {
    return { success: false, error: '订单不可触发替补' };
  }

  const result = findMatchingRiders(order);
  
  let rider = result.bestMatch;
  if (isBackup && rider && order.rider_id === rider.id) {
    rider = result.riders.find(r => r.id !== order.rider_id) || null;
  }
  
  if (!rider) {
    return { success: false, error: '无可用骑手', durationMs: result.durationMs };
  }
  
  db.prepare(`
    UPDATE orders 
    SET status = 'matched', rider_id = ?, matched_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(rider.id, orderId);

  return {
    success: true,
    orderId,
    rider: {
      id: rider.id,
      name: rider.name,
      phone: rider.phone
    },
    score: rider.totalScore,
    distance: rider.distance,
    durationMs: result.durationMs,
    isBackup,
    allCandidates: result.riders.slice(0, 5).map(r => ({
      id: r.id,
      name: r.name,
      totalScore: r.totalScore,
      distanceScore: r.distanceScore,
      onTimeScore: r.onTimeScore,
      loadScore: r.loadScore,
      skillScore: r.skillScore,
      distance: r.distance,
      skills: r.skills
    }))
  };
}

module.exports = {
  findMatchingRiders,
  matchOrderToRider
};
