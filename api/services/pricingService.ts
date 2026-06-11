import { dbQueries, type PricingConfig } from '../db/database.js';

export type WeatherCondition = 'sunny' | 'rainy' | 'snowy' | 'foggy' | 'stormy';
export type GoodsType = 'standard' | 'fragile' | 'heavy' | 'perishable' | 'valuable';
export type TimePeriod = 'normal' | 'peak' | 'night';

export interface PricingParams {
  distance: number;
  goods_type: GoodsType;
  goods_weight?: number;
  weather?: WeatherCondition;
  time?: Date;
}

export interface PricingBreakdown {
  base_price: number;
  distance_price: number;
  time_surcharge: number;
  weather_surcharge: number;
  goods_surcharge: number;
  weight_surcharge: number;
  night_surcharge: number;
  total: number;
}

const FRAGILE_GOODS: GoodsType[] = ['fragile', 'valuable'];
const HEAVY_GOODS: GoodsType[] = ['heavy'];
const BAD_WEATHER: WeatherCondition[] = ['rainy', 'snowy', 'foggy', 'stormy'];

function getTimePeriod(date: Date): TimePeriod {
  const hour = date.getHours();
  if (hour >= 7 && hour <= 9) return 'peak';
  if (hour >= 11 && hour <= 13) return 'peak';
  if (hour >= 17 && hour <= 20) return 'peak';
  if (hour >= 22 || hour < 6) return 'night';
  return 'normal';
}

function getPricingConfig(): PricingConfig {
  const config = dbQueries.pricing.getConfig().get() as PricingConfig | undefined;
  if (!config) {
    return {
      id: 1,
      base_price: 5,
      price_per_km: 2,
      peak_hour_multiplier: 1.3,
      bad_weather_multiplier: 1.2,
      fragile_multiplier: 1.5,
      heavy_multiplier: 1.3,
      night_surcharge: 3,
      updated_at: new Date().toISOString(),
    };
  }
  return config;
}

export function updatePricingConfig(updates: Partial<PricingConfig>): PricingConfig {
  const existing = getPricingConfig();
  const updated: PricingConfig = {
    ...existing,
    ...updates,
    id: existing.id,
    updated_at: new Date().toISOString(),
  };
  dbQueries.pricing.updateConfig().run(updated);
  return updated;
}

export function calculatePrice(params: PricingParams): PricingBreakdown {
  const config = getPricingConfig();
  const time = params.time ?? new Date();
  const weather = params.weather ?? 'sunny';
  const weight = params.goods_weight ?? 0;
  const period = getTimePeriod(time);

  const base_price = config.base_price;
  const distance_price = Math.max(0, (params.distance - 1)) * config.price_per_km;

  let time_surcharge = 0;
  if (period === 'peak') {
    time_surcharge = (base_price + distance_price) * (config.peak_hour_multiplier - 1);
  }

  let night_surcharge = 0;
  if (period === 'night') {
    night_surcharge = config.night_surcharge;
  }

  let weather_surcharge = 0;
  if (BAD_WEATHER.includes(weather)) {
    weather_surcharge = (base_price + distance_price) * (config.bad_weather_multiplier - 1);
  }

  let goods_surcharge = 0;
  if (FRAGILE_GOODS.includes(params.goods_type)) {
    goods_surcharge = (base_price + distance_price) * (config.fragile_multiplier - 1);
  }

  let weight_surcharge = 0;
  if (HEAVY_GOODS.includes(params.goods_type) || weight > 10) {
    const heavyWeight = Math.max(0, weight - 10);
    weight_surcharge = (base_price + distance_price) * (config.heavy_multiplier - 1) + heavyWeight * 0.5;
  }

  const subtotal = base_price + distance_price + time_surcharge + weather_surcharge + goods_surcharge + weight_surcharge + night_surcharge;
  const total = Math.round(subtotal * 100) / 100;

  return {
    base_price: Math.round(base_price * 100) / 100,
    distance_price: Math.round(distance_price * 100) / 100,
    time_surcharge: Math.round(time_surcharge * 100) / 100,
    weather_surcharge: Math.round(weather_surcharge * 100) / 100,
    goods_surcharge: Math.round(goods_surcharge * 100) / 100,
    weight_surcharge: Math.round(weight_surcharge * 100) / 100,
    night_surcharge: Math.round(night_surcharge * 100) / 100,
    total,
  };
}

export function getCurrentPricingConfig(): PricingConfig {
  return getPricingConfig();
}

export function estimateDeliveryTime(distance: number, time?: Date): number {
  const period = getTimePeriod(time ?? new Date());
  const baseTimePerKm = 3;
  const pickupDropoff = 10;

  let multiplier = 1;
  if (period === 'peak') multiplier = 1.4;
  if (period === 'night') multiplier = 0.9;

  return Math.round(distance * baseTimePerKm * multiplier + pickupDropoff);
}
