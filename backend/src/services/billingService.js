const { getDb, saveDb } = require('../database');
const dayjs = require('dayjs');

const PRICING_RULES = {
  peak: {
    timeRange: ['09:00', '12:00', '18:00', '23:00'],
    pricePerKwh: 1.80,
    serviceFee: 0.60
  },
  normal: {
    timeRange: ['07:00', '09:00', '12:00', '18:00', '23:00', '23:30'],
    pricePerKwh: 1.20,
    serviceFee: 0.50
  },
  valley: {
    timeRange: ['23:30', '07:00'],
    pricePerKwh: 0.60,
    serviceFee: 0.40
  }
};

function getPricingForTime(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes;

  const isBetween = (start, end, current) => {
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);
    const startTotal = startH * 60 + startM;
    const endTotal = endH * 60 + endM;

    if (startTotal <= endTotal) {
      return current >= startTotal && current < endTotal;
    } else {
      return current >= startTotal || current < endTotal;
    }
  };

  if (isBetween(PRICING_RULES.peak.timeRange[0], PRICING_RULES.peak.timeRange[1], totalMinutes) ||
      isBetween(PRICING_RULES.peak.timeRange[2], PRICING_RULES.peak.timeRange[3], totalMinutes)) {
    return PRICING_RULES.peak;
  }

  if (isBetween(PRICING_RULES.normal.timeRange[0], PRICING_RULES.normal.timeRange[1], totalMinutes) ||
      isBetween(PRICING_RULES.normal.timeRange[2], PRICING_RULES.normal.timeRange[3], totalMinutes) ||
      isBetween(PRICING_RULES.normal.timeRange[4], PRICING_RULES.normal.timeRange[5], totalMinutes)) {
    return PRICING_RULES.normal;
  }

  return PRICING_RULES.valley;
}

function calculateChargingCost(startTime, endTime, startEnergy, endEnergy) {
  const totalEnergy = endEnergy - startEnergy;
  
  if (totalEnergy <= 0) {
    return {
      totalEnergy: 0,
      totalAmount: 0,
      electricityFee: 0,
      serviceFee: 0,
      details: []
    };
  }

  const start = dayjs(startTime);
  const end = dayjs(endTime);
  const details = [];
  
  let currentTime = start.clone();
  let currentEnergy = startEnergy;
  let totalElectricityFee = 0;
  let totalServiceFee = 0;

  while (currentTime.isBefore(end)) {
    const nextHour = currentTime.clone().add(1, 'hour');
    const segmentEnd = nextHour.isBefore(end) ? nextHour : end;
    
    const timeStr = currentTime.format('HH:mm');
    const pricing = getPricingForTime(timeStr);
    
    const durationMinutes = segmentEnd.diff(currentTime, 'minute');
    const totalDurationMinutes = end.diff(start, 'minute');
    const energyRatio = totalDurationMinutes > 0 ? durationMinutes / totalDurationMinutes : 0;
    const segmentEnergy = totalEnergy * energyRatio;
    
    const segmentElectricityFee = segmentEnergy * pricing.pricePerKwh;
    const segmentServiceFee = segmentEnergy * pricing.serviceFee;
    
    totalElectricityFee += segmentElectricityFee;
    totalServiceFee += segmentServiceFee;
    
    details.push({
      timeRange: `${currentTime.format('HH:mm')} - ${segmentEnd.format('HH:mm')}`,
      energy: Number(segmentEnergy.toFixed(2)),
      pricePerKwh: pricing.pricePerKwh,
      serviceFeePerKwh: pricing.serviceFee,
      electricityFee: Number(segmentElectricityFee.toFixed(2)),
      serviceFee: Number(segmentServiceFee.toFixed(2))
    });
    
    currentTime = segmentEnd;
  }

  return {
    totalEnergy: Number(totalEnergy.toFixed(2)),
    totalAmount: Number((totalElectricityFee + totalServiceFee).toFixed(2)),
    electricityFee: Number(totalElectricityFee.toFixed(2)),
    serviceFee: Number(totalServiceFee.toFixed(2)),
    details
  };
}

function estimateCost(energy, currentTimeStr) {
  const pricing = getPricingForTime(currentTimeStr || dayjs().format('HH:mm'));
  const electricityFee = energy * pricing.pricePerKwh;
  const serviceFee = energy * pricing.serviceFee;
  
  return {
    pricePerKwh: pricing.pricePerKwh,
    serviceFeePerKwh: pricing.serviceFee,
    estimatedElectricityFee: Number(electricityFee.toFixed(2)),
    estimatedServiceFee: Number(serviceFee.toFixed(2)),
    estimatedTotal: Number((electricityFee + serviceFee).toFixed(2))
  };
}

module.exports = {
  calculateChargingCost,
  estimateCost,
  getPricingForTime,
  PRICING_RULES
};
