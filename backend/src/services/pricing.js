export function calculatePricing(orderParams, systemConfigs) {
  const {
    distance = 0,
    item_weight = 0,
    time_sensitivity = 'standard',
    is_rain = false,
  } = orderParams;

  const base_price = parseFloat(systemConfigs.base_price) || 8;
  const price_per_km = parseFloat(systemConfigs.price_per_km) || 1.5;
  const price_per_kg = parseFloat(systemConfigs.price_per_kg) || 0.5;
  const express_surcharge = parseFloat(systemConfigs.express_surcharge) || 5;
  const lightning_surcharge = parseFloat(systemConfigs.lightning_surcharge) || 10;
  const night_surcharge_rate = parseFloat(systemConfigs.night_surcharge_rate) || 0.3;
  const rain_surcharge_rate = parseFloat(systemConfigs.rain_surcharge_rate) || 0.5;

  const base = base_price;
  const distance_fee = distance * price_per_km;
  const weight_fee = item_weight * price_per_kg;

  let time_surcharge = 0;
  if (time_sensitivity === 'express') {
    time_surcharge = express_surcharge;
  } else if (time_sensitivity === 'lightning') {
    time_surcharge = lightning_surcharge;
  }

  const now = new Date();
  const hour = now.getHours();
  const isNight = hour >= 22 || hour < 6;
  const night_surcharge = isNight ? (base + distance_fee) * night_surcharge_rate : 0;
  const rain_surcharge = is_rain ? (base + distance_fee) * rain_surcharge_rate : 0;

  const total = base + distance_fee + weight_fee + time_surcharge + night_surcharge + rain_surcharge;

  return {
    base: Math.round(base * 100) / 100,
    distance_fee: Math.round(distance_fee * 100) / 100,
    weight_fee: Math.round(weight_fee * 100) / 100,
    time_surcharge: Math.round(time_surcharge * 100) / 100,
    night_surcharge: Math.round(night_surcharge * 100) / 100,
    rain_surcharge: Math.round(rain_surcharge * 100) / 100,
    total: Math.round(total * 100) / 100,
  };
}
