const { db } = require('../models/db');

function calculatePrice({ weight, volume = 0, itemType = 'standard', insuredValue = 0, timeline = 'standard', courier = null }) {
  let query = 'SELECT * FROM courier_prices WHERE max_weight >= ?';
  const params = [weight];
  
  if (courier) {
    query += ' AND courier = ?';
    params.push(courier);
  }
  
  query += ' ORDER BY max_weight ASC LIMIT 1';
  
  const priceConfig = db.prepare(query).get(...params);
  
  if (!priceConfig) {
    const fallbackConfig = db.prepare('SELECT * FROM courier_prices ORDER BY max_weight DESC LIMIT 1').get();
    if (!fallbackConfig) {
      return calculateFallbackPrice(weight, volume, insuredValue, timeline);
    }
    return calculateWithConfig(fallbackConfig, weight, volume, insuredValue, timeline);
  }
  
  return calculateWithConfig(priceConfig, weight, volume, insuredValue, timeline);
}

function calculateWithConfig(config, weight, volume, insuredValue, timeline) {
  const weightCharge = config.base_price + (weight * config.price_per_kg);
  
  let volumeMultiplier = 1;
  if (volume > 0.1) {
    volumeMultiplier = 1 + Math.min((volume - 0.1) * 0.5, 2);
  }
  
  let timelineMultiplier = 1;
  const timelineMap = {
    'economy': 0.8,
    'standard': 1,
    'express': 1.5,
    'same_day': 2.5
  };
  timelineMultiplier = timelineMap[timeline] || 1;
  
  const insuranceFee = insuredValue > 0 ? insuredValue * 0.01 : 0;
  
  const totalPrice = Math.round((weightCharge * volumeMultiplier * timelineMultiplier + insuranceFee) * 100) / 100;
  
  return {
    courier: config.courier,
    timeline: config.timeline,
    weight: weight,
    volume: volume,
    base_price: config.base_price,
    weight_charge: Math.round(weightCharge * 100) / 100,
    volume_multiplier: volumeMultiplier,
    timeline_multiplier: timelineMultiplier,
    insurance_fee: Math.round(insuranceFee * 100) / 100,
    total_price: totalPrice,
    breakdown: {
      '基础运费': config.base_price,
      '续重费用': Math.round(weight * config.price_per_kg * 100) / 100,
      '体积附加费': volume > 0.1 ? Math.round(weightCharge * (volumeMultiplier - 1) * 100) / 100 : 0,
      '时效附加费': Math.round(weightCharge * volumeMultiplier * (timelineMultiplier - 1) * 100) / 100,
      '保价费': Math.round(insuranceFee * 100) / 100
    }
  };
}

function calculateFallbackPrice(weight, volume, insuredValue, timeline) {
  const basePrice = 12;
  const pricePerKg = 5;
  
  const weightCharge = basePrice + (weight * pricePerKg);
  
  let volumeMultiplier = 1;
  if (volume > 0.1) {
    volumeMultiplier = 1 + Math.min((volume - 0.1) * 0.5, 2);
  }
  
  let timelineMultiplier = 1;
  const timelineMap = {
    'economy': 0.8,
    'standard': 1,
    'express': 1.5,
    'same_day': 2.5
  };
  timelineMultiplier = timelineMap[timeline] || 1;
  
  const insuranceFee = insuredValue > 0 ? insuredValue * 0.01 : 0;
  
  const totalPrice = Math.round((weightCharge * volumeMultiplier * timelineMultiplier + insuranceFee) * 100) / 100;
  
  return {
    courier: '标准快递',
    timeline: timeline,
    weight: weight,
    volume: volume,
    base_price: basePrice,
    weight_charge: Math.round(weightCharge * 100) / 100,
    volume_multiplier: volumeMultiplier,
    timeline_multiplier: timelineMultiplier,
    insurance_fee: Math.round(insuranceFee * 100) / 100,
    total_price: totalPrice,
    breakdown: {
      '基础运费': basePrice,
      '续重费用': Math.round(weight * pricePerKg * 100) / 100,
      '体积附加费': volume > 0.1 ? Math.round(weightCharge * (volumeMultiplier - 1) * 100) / 100 : 0,
      '时效附加费': Math.round(weightCharge * volumeMultiplier * (timelineMultiplier - 1) * 100) / 100,
      '保价费': Math.round(insuranceFee * 100) / 100
    }
  };
}

function getAllCourierPrices() {
  return db.prepare('SELECT * FROM courier_prices ORDER BY courier, max_weight').all();
}

module.exports = { calculatePrice, getAllCourierPrices };
