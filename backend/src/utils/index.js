function generateOrderNo() {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `ORD-${date}-${random}`;
}

function generateReservationNo() {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `RES-${date}-${random}`;
}

function generateWorkOrderNo() {
  const now = new Date();
  const date = now.toISOString().slice(0, 7).replace(/-/g, '');
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ALARM-${date}-${random}`;
}

function formatDuration(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function getCurrentTimeStr() {
  const now = new Date();
  return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
}

function isTimeInRange(currentTime, startTime, endTime) {
  if (startTime <= endTime) {
    return currentTime >= startTime && currentTime < endTime;
  } else {
    return currentTime >= startTime || currentTime < endTime;
  }
}

function getPeriodTypeForTime(timeStr, pricePeriods) {
  for (const period of pricePeriods) {
    if (isTimeInRange(timeStr, period.start_time, period.end_time)) {
      return period;
    }
  }
  return pricePeriods.find(p => p.period_type === 'flat') || pricePeriods[0];
}

function calculateChargingCost(energy, startTime, endTime, pricePeriods) {
  const result = {
    peak_energy: 0,
    flat_energy: 0,
    valley_energy: 0,
    peak_cost: 0,
    flat_cost: 0,
    valley_cost: 0,
    service_fee: 0,
    total_amount: 0
  };

  const start = new Date(startTime);
  const end = new Date(endTime);
  const totalSeconds = (end - start) / 1000;
  
  if (totalSeconds <= 0) return result;

  const avgPowerPerSecond = energy / totalSeconds;
  const avgServiceFeePerKwh = 0.6;
  
  let currentTime = new Date(start);
  
  while (currentTime < end) {
    const nextHour = new Date(currentTime);
    nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0);
    const segmentEnd = new Date(Math.min(nextHour.getTime(), end.getTime()));
    const segmentSeconds = (segmentEnd - currentTime) / 1000;
    const segmentEnergy = avgPowerPerSecond * segmentSeconds;
    
    const timeStr = `${currentTime.getHours().toString().padStart(2, '0')}:${currentTime.getMinutes().toString().padStart(2, '0')}`;
    const period = getPeriodTypeForTime(timeStr, pricePeriods);
    
    if (period.period_type === 'peak') {
      result.peak_energy += segmentEnergy;
      result.peak_cost += segmentEnergy * (period.electricity_price + period.service_price);
    } else if (period.period_type === 'valley') {
      result.valley_energy += segmentEnergy;
      result.valley_cost += segmentEnergy * (period.electricity_price + period.service_price);
    } else {
      result.flat_energy += segmentEnergy;
      result.flat_cost += segmentEnergy * (period.electricity_price + period.service_price);
    }
    
    result.service_fee += segmentEnergy * avgServiceFeePerKwh;
    currentTime = segmentEnd;
  }
  
  result.total_amount = result.peak_cost + result.flat_cost + result.valley_cost + result.service_fee;
  return result;
}

function estimateChargingTime(startSoc, targetSoc, batteryCapacity, powerRating) {
  const energyNeeded = batteryCapacity * (targetSoc - startSoc) / 100;
  const efficiency = 0.9;
  const hours = energyNeeded / (powerRating * efficiency);
  return Math.round(hours * 3600);
}

function recommendChargers(stations, userLocation, vehicle, preferences = {}) {
  const {
    targetSoc = 80,
    preferFast = true,
    preferLowPrice = true,
    maxDistance = 20
  } = preferences;

  const currentTimeStr = getCurrentTimeStr();
  const currentTime = new Date();

  const recommendations = [];

  stations.forEach(station => {
    const distance = calculateDistance(
      userLocation.lat, userLocation.lng,
      station.lat, station.lng
    );

    if (distance > maxDistance) return;

    const driveTime = distance / 0.5;

    const chargers = station.chargers || [];
    const availableChargers = chargers.filter(c => !c.is_occupied && !c.is_offline);
    const suitableChargers = availableChargers.filter(c => 
      preferFast ? c.type === 'fast' : true
    );

    if (suitableChargers.length === 0) return;

    const bestCharger = suitableChargers[0];
    const pricePeriods = station.pricePeriods || [];
    const currentPeriod = getPeriodTypeForTime(currentTimeStr, pricePeriods);
    
    const estimatedEnergy = vehicle.battery_capacity * (targetSoc - vehicle.current_soc) / 100;
    const estimatedDuration = estimateChargingTime(
      vehicle.current_soc, targetSoc, vehicle.battery_capacity, bestCharger.power_rating
    );
    
    const estimatedEndTime = new Date(currentTime.getTime() + driveTime * 1000 + estimatedDuration * 1000);
    const cost = calculateChargingCost(
      estimatedEnergy,
      new Date(currentTime.getTime() + driveTime * 1000),
      estimatedEndTime,
      pricePeriods
    );

    let score = 100;
    score -= distance * 2;
    score -= suitableChargers.length < 2 ? 20 : 0;
    score -= currentPeriod.period_type === 'peak' && preferLowPrice ? 30 : 0;
    score -= currentPeriod.period_type === 'valley' && preferLowPrice ? -20 : 0;
    score -= bestCharger.type === 'slow' && preferFast ? 25 : 0;
    score = Math.max(0, Math.min(100, score));

    recommendations.push({
      station: {
        id: station.id,
        name: station.name,
        address: station.address,
        city: station.city,
        lat: station.lat,
        lng: station.lng,
        distance: Math.round(distance * 10) / 10,
        driveTime: Math.round(driveTime / 60)
      },
      charger: {
        id: bestCharger.id,
        charger_code: bestCharger.charger_code,
        type: bestCharger.type,
        power_rating: bestCharger.power_rating,
        protocol: bestCharger.protocol,
        available_count: suitableChargers.length
      },
      price: {
        current_period: currentPeriod.period_type,
        electricity_price: currentPeriod.electricity_price,
        service_price: currentPeriod.service_price,
        total_price: currentPeriod.electricity_price + currentPeriod.service_price
      },
      estimate: {
        energy: Math.round(estimatedEnergy * 10) / 10,
        duration: estimatedDuration,
        duration_formatted: formatDuration(estimatedDuration),
        end_time: estimatedEndTime.toISOString(),
        cost: Math.round(cost.total_amount * 100) / 100,
        cost_detail: {
          electricity: Math.round((cost.peak_cost + cost.flat_cost + cost.valley_cost) * 100) / 100,
          service_fee: Math.round(cost.service_fee * 100) / 100,
          peak_cost: Math.round(cost.peak_cost * 100) / 100,
          flat_cost: Math.round(cost.flat_cost * 100) / 100,
          valley_cost: Math.round(cost.valley_cost * 100) / 100
        }
      },
      score: Math.round(score),
      recommendation_reason: generateRecommendationReason(distance, currentPeriod, suitableChargers.length, bestCharger.type, preferFast, preferLowPrice)
    });
  });

  recommendations.sort((a, b) => b.score - a.score);
  return recommendations;
}

function generateRecommendationReason(distance, period, availableCount, chargerType, preferFast, preferLowPrice) {
  const reasons = [];
  
  if (distance < 2) reasons.push('距离最近');
  else if (distance < 5) reasons.push('距离适中');
  
  if (period.period_type === 'valley' && preferLowPrice) reasons.push('当前为谷时电价，最省钱');
  else if (period.period_type === 'flat') reasons.push('当前为平时电价');
  else if (period.period_type === 'peak') reasons.push('建议错峰充电更优惠');
  
  if (chargerType === 'fast' && preferFast) reasons.push('直流快充，节省时间');
  if (availableCount >= 3) reasons.push('空闲桩位充足');
  
  return reasons.join('，') + '。';
}

function analyzeChargerHealth(charger, statusHistory) {
  let score = 100;
  const issues = [];
  const recommendations = [];

  if (charger.health_score < 70) {
    score -= 20;
    issues.push('设备健康评分偏低');
    recommendations.push('建议安排预防性维护检查');
  }

  const offlineCount = statusHistory.filter(s => s.is_offline).length;
  if (offlineCount > statusHistory.length * 0.1) {
    score -= 15;
    issues.push('离线频率偏高');
    recommendations.push('检查网络连接和通信模块');
  }

  const highTempCount = statusHistory.filter(s => s.temperature > 55).length;
  if (highTempCount > 0) {
    score -= 25;
    issues.push('多次出现过温现象');
    recommendations.push('检查散热系统和充电枪连接器');
  }

  const faultCount = statusHistory.filter(s => s.fault_code).length;
  if (faultCount > 0) {
    score -= 30;
    issues.push(`存在${faultCount}次故障记录`);
    recommendations.push('排查故障代码并修复');
  }

  const now = new Date();
  const lastMaintenance = charger.last_maintenance ? new Date(charger.last_maintenance) : null;
  if (!lastMaintenance || (now - lastMaintenance) / (1000 * 60 * 60 * 24 * 30) > 6) {
    score -= 10;
    issues.push('已超过6个月未维护');
    recommendations.push('建议安排定期维护');
  }

  return {
    health_score: Math.max(0, Math.min(100, score)),
    health_level: score >= 90 ? 'excellent' : score >= 75 ? 'good' : score >= 60 ? 'fair' : 'poor',
    issues,
    recommendations,
    maintenance_priority: score >= 90 ? 'low' : score >= 75 ? 'medium' : score >= 60 ? 'high' : 'urgent'
  };
}

module.exports = {
  generateOrderNo,
  generateReservationNo,
  generateWorkOrderNo,
  formatDuration,
  calculateDistance,
  getCurrentTimeStr,
  isTimeInRange,
  getPeriodTypeForTime,
  calculateChargingCost,
  estimateChargingTime,
  recommendChargers,
  analyzeChargerHealth
};
