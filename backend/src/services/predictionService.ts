import { getDb } from '../db';
import { nowTimestamp } from '../utils';

interface PredictionFactors {
  weather: string;
  temperature: number;
  is_holiday: boolean;
  has_promotion: boolean;
  day_of_week: number;
  hour: number;
}

export function predictOrders(
  regionId: number,
  date: string,
  hour: number
): { predicted: number; confidence: number; factors: string } {
  const db = getDb();

  const historicalData = db
    .prepare(
      `SELECT order_count, is_holiday, has_promotion, weather, temperature
       FROM region_order_stats 
       WHERE region_id = ? AND hour = ?
       ORDER BY id DESC LIMIT 30`
    )
    .all(regionId, hour) as any[];

  if (historicalData.length === 0) {
    return { predicted: 50, confidence: 0.3, factors: '数据不足，使用默认值' };
  }

  let baseCount = historicalData.reduce((sum, d) => sum + d.order_count, 0) / historicalData.length;

  const dayOfWeek = new Date(date).getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  if (isWeekend) baseCount *= 1.3;

  const factors: PredictionFactors = {
    weather: 'sunny',
    temperature: 25,
    is_holiday: false,
    has_promotion: false,
    day_of_week: dayOfWeek,
    hour,
  };

  if (factors.weather === 'rain') baseCount *= 1.4;
  else if (factors.weather === 'snow') baseCount *= 1.6;
  else if (factors.weather === 'extreme_heat') baseCount *= 1.2;

  if (factors.is_holiday) baseCount *= 1.5;
  if (factors.has_promotion) baseCount *= 1.8;

  if (hour >= 11 && hour <= 13) baseCount *= 1.5;
  else if (hour >= 17 && hour <= 19) baseCount *= 1.6;
  else if (hour >= 20 && hour <= 22) baseCount *= 1.3;
  else if (hour >= 2 && hour <= 6) baseCount *= 0.2;

  const confidence = Math.min(0.9, 0.5 + historicalData.length * 0.01);

  return {
    predicted: Math.round(baseCount),
    confidence: Math.round(confidence * 100) / 100,
    factors: JSON.stringify({
      weather_factor: factors.weather,
      holiday_factor: factors.is_holiday,
      promotion_factor: factors.has_promotion,
      time_factor: hour,
      weekend_factor: isWeekend,
    }),
  };
}

export function generatePredictions(regionId: number, days: number = 1): number[] {
  const db = getDb();
  const predictions: number[] = [];
  const now = new Date();

  for (let d = 0; d < days; d++) {
    const targetDate = new Date(now);
    targetDate.setDate(targetDate.getDate() + d);
    const dateStr = targetDate.toISOString().slice(0, 10);

    for (let h = 0; h < 24; h++) {
      const result = predictOrders(regionId, dateStr, h);
      predictions.push(result.predicted);

      db.prepare(
        `INSERT OR REPLACE INTO order_predictions 
         (region_id, date, hour, predicted_count, confidence, factors, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      ).run(
        regionId,
        dateStr,
        h,
        result.predicted,
        result.confidence,
        result.factors,
        nowTimestamp()
      );
    }
  }

  return predictions;
}

export function getPredictionTrend(regionId: number, hours: number = 24): {
  time: string;
  predicted: number;
  actual?: number;
}[] {
  const db = getDb();
  const result: { time: string; predicted: number; actual?: number }[] = [];

  const now = new Date();

  for (let i = 0; i < hours; i++) {
    const hourTime = new Date(now.getTime() + i * 3600 * 1000);
    const dateStr = hourTime.toISOString().slice(0, 10);
    const hour = hourTime.getHours();
    const timeStr = hourTime.toISOString().slice(11, 16);

    const prediction = db
      .prepare(
        'SELECT * FROM order_predictions WHERE region_id = ? AND date = ? AND hour = ?'
      )
      .get(regionId, dateStr, hour) as any;

    const actual = db
      .prepare(
        'SELECT order_count FROM region_order_stats WHERE region_id = ? AND date = ? AND hour = ?'
      )
      .get(regionId, dateStr, hour) as any;

    result.push({
      time: timeStr,
      predicted: prediction?.predicted_count || 0,
      actual: actual?.order_count,
    });
  }

  return result;
}

export function getRegionStats(regionId: number): {
  today_orders: number;
  avg_delivery_time: number;
  rider_count: number;
  order_growth_rate: number;
} {
  const db = getDb();
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  const todayStats = db
    .prepare(
      `SELECT SUM(order_count) as total, AVG(avg_delivery_time) as avg_time, 
              MAX(rider_count) as max_riders
       FROM region_order_stats 
       WHERE region_id = ? AND date = ?`
    )
    .get(regionId, today) as any;

  const yesterdayStats = db
    .prepare(
      `SELECT SUM(order_count) as total 
       FROM region_order_stats 
       WHERE region_id = ? AND date = ?`
    )
    .get(regionId, yesterday) as any;

  const todayTotal = todayStats?.total || 0;
  const yesterdayTotal = yesterdayStats?.total || 1;
  const growthRate = ((todayTotal - yesterdayTotal) / yesterdayTotal) * 100;

  return {
    today_orders: todayTotal,
    avg_delivery_time: Math.round(todayStats?.avg_time || 0),
    rider_count: todayStats?.max_riders || 0,
    order_growth_rate: Math.round(growthRate * 10) / 10,
  };
}
