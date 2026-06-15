const db = require('../db/database');

function enrichPlatform(platform) {
  const completionRate = platform.completion_rate ??
    Math.max(0, Math.min(1, 1 - (platform.loss_rate * 2 + platform.complaint_rate)));

  return {
    ...platform,
    completion_rate: Number(completionRate.toFixed(4))
  };
}

function calculatePlatformFee(platform, distance, weight) {
  const baseFee = platform.base_price;
  const distanceFee = platform.per_km_price * Math.max(0, distance - 2);
  const weightFee = platform.per_kg_price * Math.max(0, weight - 1);
  return baseFee + distanceFee + weightFee;
}

function calculateDeliveryTime(platform, distance) {
  const baseTime = platform.min_delivery_time;
  const additionalTime = Math.ceil(distance / 3) * 10;
  return Math.min(platform.max_delivery_time, baseTime + additionalTime);
}

function calculateScore(platform, distance, weight, urgency, expectedTime) {
  platform = enrichPlatform(platform);
  const fee = calculatePlatformFee(platform, distance, weight);
  const deliveryTime = calculateDeliveryTime(platform, distance);
  const meetsDeadline = expectedTime ? deliveryTime <= expectedTime : true;
  const timeScore = expectedTime
    ? Math.max(0, Math.min(1, (expectedTime - deliveryTime + 30) / expectedTime))
    : Math.max(0.35, 1 - (deliveryTime / 180));

  const saturationPenalty = platform.capacity_saturation > 0.8 ? 0.2 :
                             platform.capacity_saturation > 0.6 ? 0.1 : 0;
  const qualityScore = platform.on_time_rate * 0.5 +
                       (1 - platform.loss_rate) * 0.3 +
                       (1 - platform.complaint_rate) * 0.2;

  const urgencyWeight = urgency === 'urgent' ? 0.4 : urgency === 'normal' ? 0.25 : 0.15;
  const feeWeight = urgency === 'urgent' ? 0.2 : urgency === 'normal' ? 0.35 : 0.5;
  const qualityWeight = 0.25;
  const saturationWeight = 0.15;

  const maxFee = 100;
  const feeScore = Math.max(0, 1 - (fee / maxFee));
  const saturationScore = 1 - platform.capacity_saturation;

  const score = (feeScore * feeWeight) +
                (timeScore * urgencyWeight) +
                (qualityScore * qualityWeight) +
                (saturationScore * saturationWeight) -
                saturationPenalty;

  const scoreDetail = {
    price_score: Number(feeScore.toFixed(3)),
    time_score: Number(timeScore.toFixed(3)),
    quality_score: Number(qualityScore.toFixed(3)),
    saturation_score: Number(saturationScore.toFixed(3))
  };

  return {
    score: Math.max(0, Math.min(1, score)),
    fee: parseFloat(fee.toFixed(2)),
    deliveryTime,
    meetsDeadline,
    scoreDetail,
    reason: buildRouteReason({
      platform,
      fee,
      deliveryTime,
      meetsDeadline,
      scoreDetail,
      urgency,
      expectedTime
    }),
    platform
  };
}

function buildRouteReason(result) {
  const parts = [];
  const saturation = result.platform.capacity_saturation;

  if (result.meetsDeadline) {
    parts.push(result.expectedTime ? `满足${result.expectedTime}分钟时效` : '时效稳定');
  } else {
    parts.push(`预计${result.deliveryTime}分钟，存在超时风险`);
  }

  if (saturation < 0.5) {
    parts.push('运力充足');
  } else if (saturation < 0.75) {
    parts.push('运力可承接');
  } else {
    parts.push('高峰饱和需关注');
  }

  if (result.platform.on_time_rate >= 0.96) {
    parts.push(`历史准时率${(result.platform.on_time_rate * 100).toFixed(1)}%`);
  } else {
    parts.push(`准时率${(result.platform.on_time_rate * 100).toFixed(1)}%`);
  }

  parts.push(`费用¥${result.fee.toFixed(2)}`);
  return parts.join('，');
}

function getOptimalPlatform(distance, weight, urgency, expectedTime, preferredPlatforms = []) {
  const platforms = db.prepare(`
    SELECT * FROM platforms WHERE status = 'active'
  `).all();

  const results = platforms.map(p =>
    calculateScore(p, distance, weight, urgency, expectedTime)
  );

  results.sort((a, b) => {
    if (preferredPlatforms.length > 0) {
      const aPreferred = preferredPlatforms.includes(a.platform.code) ? 1 : 0;
      const bPreferred = preferredPlatforms.includes(b.platform.code) ? 1 : 0;
      if (aPreferred !== bPreferred) return bPreferred - aPreferred;
    }
    if (a.meetsDeadline !== b.meetsDeadline) return b.meetsDeadline - a.meetsDeadline;
    return b.score - a.score;
  });

  return results;
}

function getCheapestPlatform(distance, weight) {
  const platforms = db.prepare(`
    SELECT * FROM platforms WHERE status = 'active'
  `).all();

  const results = platforms.map(p => ({
    platform: enrichPlatform(p),
    fee: parseFloat(calculatePlatformFee(p, distance, weight).toFixed(2)),
    deliveryTime: calculateDeliveryTime(p, distance)
  }));

  results.sort((a, b) => a.fee - b.fee);
  return results;
}

module.exports = {
  calculatePlatformFee,
  calculateDeliveryTime,
  getOptimalPlatform,
  getCheapestPlatform,
  calculateScore,
  buildRouteReason
};
