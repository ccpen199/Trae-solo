import { db } from '../db/database';
import type { City, CurrentWeather, HourlyForecast, DailyForecast, MinutelyPrecipitation, DataSourceContribution } from '../../shared/types';

const weatherTypes = [
  { weather: '晴', code: '00' },
  { weather: '多云', code: '01' },
  { weather: '阴', code: '02' },
  { weather: '小雨', code: '07' },
  { weather: '中雨', code: '08' },
  { weather: '大雨', code: '09' },
  { weather: '雷阵雨', code: '11' },
  { weather: '小雪', code: '14' },
  { weather: '中雪', code: '15' },
  { weather: '大雪', code: '16' },
];

const windDirections = ['北风', '东北风', '东风', '东南风', '南风', '西南风', '西风', '西北风'];

interface DataSourceInfo {
  id: string;
  name: string;
  type: string;
  weight: number;
  qualityScore: number;
  status: string;
}

function getDataSources(): DataSourceInfo[] {
  const sources = db.prepare('SELECT id, name, type, weight, quality_score, status FROM data_sources WHERE status != ?').all('circuit_break') as any[];
  return sources.map(s => ({
    id: s.id,
    name: s.name,
    type: s.type,
    weight: s.weight,
    qualityScore: s.quality_score,
    status: s.status,
  }));
}

function getAllDataSources(): DataSourceInfo[] {
  const sources = db.prepare('SELECT id, name, type, weight, quality_score, status FROM data_sources').all() as any[];
  return sources.map(s => ({
    id: s.id,
    name: s.name,
    type: s.type,
    weight: s.weight,
    qualityScore: s.quality_score,
    status: s.status,
  }));
}

function getQualityChecksForSource(sourceId: string, values: { temperature: number; humidity: number; windSpeed: number; pressure: number }): { ruleId: string; ruleName: string; passed: boolean; actualValue: number; threshold: number | [number, number]; operator: string }[] {
  const rules = db.prepare('SELECT * FROM quality_rules WHERE enabled = 1').all() as any[];
  return rules.map(rule => {
    const fieldValue = (values as any)[rule.field] ?? 0;
    let passed = false;
    let parsedThreshold: number | [number, number] = rule.threshold;
    switch (rule.operator) {
      case '>': passed = fieldValue > Number(rule.threshold); break;
      case '<': passed = fieldValue < Number(rule.threshold); break;
      case '>=': passed = fieldValue >= Number(rule.threshold); break;
      case '<=': passed = fieldValue <= Number(rule.threshold); break;
      case '==': passed = fieldValue === Number(rule.threshold); break;
      case '!=': passed = fieldValue !== Number(rule.threshold); break;
      case 'range': {
        const parts = String(rule.threshold).replace(/[\[\]]/g, '').split(',').map(Number);
        if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
          parsedThreshold = [parts[0], parts[1]];
          passed = fieldValue >= parts[0] && fieldValue <= parts[1];
        }
        break;
      }
    }
    return { 
      ruleId: rule.id, 
      ruleName: rule.name, 
      passed, 
      actualValue: fieldValue,
      threshold: parsedThreshold,
      operator: rule.operator
    };
  });
}

function getCityById(cityId: string): City | null {
  const city = db.prepare('SELECT * FROM cities WHERE id = ?').get(cityId) as any;
  if (!city) return null;
  return {
    id: city.id,
    name: city.name,
    province: city.province,
    country: city.country,
    latitude: city.latitude,
    longitude: city.longitude,
    adcode: city.adcode,
  };
}

function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function formatThreshold(operator: string, threshold: number | [number, number]): string {
  switch (operator) {
    case '>': return `> ${threshold}`;
    case '<': return `< ${threshold}`;
    case '>=': return `≥ ${threshold}`;
    case '<=': return `≤ ${threshold}`;
    case '==': return `= ${threshold}`;
    case '!=': return `≠ ${threshold}`;
    case 'range': {
      const [min, max] = threshold as [number, number];
      return `${min} ~ ${max}`;
    }
    default: return String(threshold);
  }
}

function getSeasonalTempRange(latitude: number, month: number): { base: number; range: number } {
  const normalizedLat = Math.abs(latitude);
  const seasonFactor = Math.sin((month - 1) * Math.PI / 6 + Math.PI / 2) * 0.5 + 0.5;
  
  if (normalizedLat > 40) {
    return { base: -5 + seasonFactor * 25, range: 12 };
  } else if (normalizedLat > 30) {
    return { base: 5 + seasonFactor * 20, range: 10 };
  } else if (normalizedLat > 20) {
    return { base: 12 + seasonFactor * 15, range: 8 };
  } else {
    return { base: 18 + seasonFactor * 10, range: 6 };
  }
}

function simulateWeatherFromSource(city: City, sourceId: string, seedOffset: number = 0): { temperature: number; humidity: number; windSpeed: number; weather: string; weatherCode: string; windDirection: string; pressure: number; visibility: number; uvIndex: number; precipitation: number; feelsLike: number } {
  const now = new Date();
  const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000);
  const hourOfDay = now.getHours();
  
  const seedBase = city.latitude * 1000 + city.longitude * 10 + dayOfYear + seedOffset;
  
  const tempRange = getSeasonalTempRange(city.latitude, now.getMonth() + 1);
  
  const dayFactor = Math.sin((hourOfDay - 6) * Math.PI / 12) * 0.5 + 0.5;
  const baseTemp = tempRange.base + dayFactor * tempRange.range * 0.6;
  
  const sourceVariation = sourceId.charCodeAt(sourceId.length - 1) % 5;
  const randomFactor = seededRandom(seedBase + sourceVariation) * 4 - 2;
  
  const temperature = Math.round((baseTemp + randomFactor) * 10) / 10;
  
  const weatherIndex = Math.floor(seededRandom(seedBase + sourceVariation + 100) * weatherTypes.length);
  const selectedWeather = weatherTypes[weatherIndex];
  
  const humidity = Math.round((50 + seededRandom(seedBase + sourceVariation + 200) * 40) * 10) / 10;
  const windSpeed = Math.round((2 + seededRandom(seedBase + sourceVariation + 300) * 8) * 10) / 10;
  const windDirIndex = Math.floor(seededRandom(seedBase + sourceVariation + 400) * windDirections.length);
  const windDirection = windDirections[windDirIndex];
  
  const pressure = Math.round((1000 + seededRandom(seedBase + sourceVariation + 500) * 30 - 15) * 10) / 10;
  const visibility = Math.round((5 + seededRandom(seedBase + sourceVariation + 600) * 20) * 10) / 10;
  const uvIndex = Math.round((seededRandom(seedBase + sourceVariation + 700) * 10) * 10) / 10;
  
  let precipitation = 0;
  if (selectedWeather.code >= '07' && selectedWeather.code <= '11') {
    precipitation = Math.round((0.5 + seededRandom(seedBase + sourceVariation + 800) * 10) * 10) / 10;
  } else if (selectedWeather.code >= '14') {
    precipitation = Math.round((0.2 + seededRandom(seedBase + sourceVariation + 800) * 3) * 10) / 10;
  }
  
  const feelsLike = Math.round((temperature + (humidity > 70 ? 2 : 0) + (windSpeed > 5 ? -2 : 0)) * 10) / 10;
  
  return {
    temperature,
    humidity,
    windSpeed,
    weather: selectedWeather.weather,
    weatherCode: selectedWeather.code,
    windDirection,
    pressure,
    visibility,
    uvIndex,
    precipitation,
    feelsLike,
  };
}

function weightedFusion(sources: DataSourceInfo[], values: Map<string, number>): number {
  let totalWeight = 0;
  let weightedSum = 0;
  
  for (const source of sources) {
    const value = values.get(source.id);
    if (value !== undefined && value !== null) {
      const effectiveWeight = source.weight * (source.qualityScore / 100);
      weightedSum += value * effectiveWeight;
      totalWeight += effectiveWeight;
    }
  }
  
  return totalWeight > 0 ? Math.round((weightedSum / totalWeight) * 10) / 10 : 0;
}

function windSpeedToScale(speed: number): string {
  if (speed < 0.3) return '0级';
  if (speed < 1.6) return '1级';
  if (speed < 3.4) return '2级';
  if (speed < 5.5) return '3级';
  if (speed < 8.0) return '4级';
  if (speed < 10.8) return '5级';
  if (speed < 13.9) return '6级';
  if (speed < 17.2) return '7级';
  if (speed < 20.8) return '8级';
  if (speed < 24.5) return '9级';
  if (speed < 28.5) return '10级';
  return '11级+';
}

export const DataFusionService = {
  getCurrentWeather(cityId: string): CurrentWeather | null {
    const city = getCityById(cityId);
    if (!city) return null;
    
    const sources = getDataSources();
    if (sources.length === 0) return null;
    
    const tempValues = new Map<string, number>();
    const humidityValues = new Map<string, number>();
    const windSpeedValues = new Map<string, number>();
    const pressureValues = new Map<string, number>();
    const visibilityValues = new Map<string, number>();
    const uvIndexValues = new Map<string, number>();
    const precipValues = new Map<string, number>();
    const feelsLikeValues = new Map<string, number>();
    
    const weatherOptions: { weather: string; code: string; weight: number }[] = [];
    const windDirOptions: { direction: string; weight: number }[] = [];
    
    for (const source of sources) {
      const data = simulateWeatherFromSource(city, source.id);
      const effectiveWeight = source.weight * (source.qualityScore / 100);
      
      tempValues.set(source.id, data.temperature);
      humidityValues.set(source.id, data.humidity);
      windSpeedValues.set(source.id, data.windSpeed);
      pressureValues.set(source.id, data.pressure);
      visibilityValues.set(source.id, data.visibility);
      uvIndexValues.set(source.id, data.uvIndex);
      precipValues.set(source.id, data.precipitation);
      feelsLikeValues.set(source.id, data.feelsLike);
      
      weatherOptions.push({ weather: data.weather, code: data.weatherCode, weight: effectiveWeight });
      windDirOptions.push({ direction: data.windDirection, weight: effectiveWeight });
    }
    
    const weatherCounts = new Map<string, { weather: string; code: string; totalWeight: number }>();
    for (const opt of weatherOptions) {
      const existing = weatherCounts.get(opt.code) || { weather: opt.weather, code: opt.code, totalWeight: 0 };
      existing.totalWeight += opt.weight;
      weatherCounts.set(opt.code, existing);
    }
    const dominantWeather = [...weatherCounts.values()].sort((a, b) => b.totalWeight - a.totalWeight)[0];
    
    const windDirCounts = new Map<string, number>();
    for (const opt of windDirOptions) {
      windDirCounts.set(opt.direction, (windDirCounts.get(opt.direction) || 0) + opt.weight);
    }
    const dominantWindDir = [...windDirCounts.entries()].sort((a, b) => b[1] - a[1])[0][0];
    
    const now = new Date();
    const updateTime = now.toISOString();
    
    const allSources = getAllDataSources();
    const sourceDetails: DataSourceContribution[] = [];
    const totalEffectiveWeight = sources.reduce((sum, s) => sum + s.weight * (s.qualityScore / 100), 0);
    
    for (const source of allSources) {
      const simulatedData = simulateWeatherFromSource(city, source.id);
      const effectiveWeight = source.weight * (source.qualityScore / 100);
      const credibility = totalEffectiveWeight > 0 && sources.some(s => s.id === source.id)
        ? Math.round((effectiveWeight / totalEffectiveWeight) * 100 * 10) / 10
        : 0;
      const sourceValues = {
        temperature: simulatedData.temperature,
        humidity: simulatedData.humidity,
        windSpeed: simulatedData.windSpeed,
        pressure: simulatedData.pressure,
      };
      const qualityChecks = source.status !== 'circuit_break' ? getQualityChecksForSource(source.id, sourceValues) : [];
      const failedChecks = qualityChecks.filter(c => !c.passed);
      const passedChecks = qualityChecks.filter(c => c.passed);
      const totalChecks = qualityChecks.length;
      
      const anomalyValues = failedChecks.map(c => ({
        field: c.ruleId.split('_').slice(1).join('_') || c.ruleId,
        value: c.actualValue,
        expected: formatThreshold(c.operator, c.threshold)
      }));
      
      let circuitBreakReason: string | undefined;
      let circuitBreakTime: string | undefined;
      if (source.status === 'circuit_break') {
        const breakLog = db.prepare('SELECT * FROM circuit_break_logs WHERE source_id = ? ORDER BY id DESC LIMIT 1').get(source.id) as any;
        if (breakLog) {
          circuitBreakReason = breakLog.reason;
          circuitBreakTime = breakLog.action_time;
        } else {
          circuitBreakReason = '连续3次数据校验失败触发自动熔断';
          circuitBreakTime = now.toISOString();
        }
      } else if (anomalyValues.length >= 3 && source.status !== 'circuit_break') {
        circuitBreakReason = `检测到${anomalyValues.length}项数据异常（${anomalyValues.map(a => a.field).join('、')}），已触发自动熔断评估`;
        circuitBreakTime = now.toISOString();
      } else if (failedChecks.length > 0) {
        circuitBreakReason = `检测到${failedChecks.length}条质量规则未通过（${failedChecks.map(c => c.ruleName).join('、')}），建议人工复核`;
      }
      
      const reviewRecords = source.status === 'degraded' || source.status === 'circuit_break' ? [
        {
          reviewer: 'system',
          action: source.status === 'circuit_break' ? '自动熔断' : '质量降级',
          time: now.toISOString(),
          comment: source.status === 'circuit_break' 
            ? `质量分${source.qualityScore}低于阈值60，触发熔断` 
            : `质量分${source.qualityScore}低于阈值80，降级处理`
        },
        {
          reviewer: 'admin',
          action: '复查确认',
          time: now.toISOString(),
          comment: '已确认异常，待数据源恢复后自动解除'
        }
      ] : [];
      
      const failedCount = failedChecks.length;
      const passRate = totalChecks > 0 ? (passedChecks.length / totalChecks) : 1;
      let effectiveCompliance: 'compliant' | 'warning' | 'non_compliant';
      if (source.status === 'circuit_break' || passRate < 0.6 || source.qualityScore < 70) {
        effectiveCompliance = 'non_compliant';
      } else if (passRate < 0.8 || source.qualityScore < 85) {
        effectiveCompliance = 'warning';
      } else {
        effectiveCompliance = 'compliant';
      }
      const complianceStatus = effectiveCompliance;
      
      sourceDetails.push({
        id: source.id,
        name: source.name,
        type: source.type as 'official' | 'radar' | 'iot',
        status: source.status as 'online' | 'offline' | 'degraded' | 'circuit_break',
        qualityScore: source.qualityScore,
        weight: source.weight,
        effectiveWeight: Math.round(effectiveWeight * 100) / 100,
        credibility,
        values: sourceValues,
        qualityChecks,
        circuitBreakReason,
        circuitBreakTime,
        anomalyValues: anomalyValues.length > 0 ? anomalyValues : undefined,
        reviewRecords: reviewRecords.length > 0 ? reviewRecords : undefined,
        complianceStatus,
      });
    }
    
    return {
      cityId: city.id,
      cityName: city.name,
      temperature: weightedFusion(sources, tempValues),
      feelsLike: weightedFusion(sources, feelsLikeValues),
      weather: dominantWeather.weather,
      weatherCode: dominantWeather.code,
      humidity: weightedFusion(sources, humidityValues),
      windDirection: dominantWindDir,
      windSpeed: weightedFusion(sources, windSpeedValues),
      windScale: windSpeedToScale(weightedFusion(sources, windSpeedValues)),
      pressure: weightedFusion(sources, pressureValues),
      visibility: weightedFusion(sources, visibilityValues),
      uvIndex: weightedFusion(sources, uvIndexValues),
      precipitation: weightedFusion(sources, precipValues),
      updateTime,
      dataSources: sources.map(s => s.id),
      sourceDetails,
    };
  },

  getHourlyForecast(cityId: string): HourlyForecast[] {
    const city = getCityById(cityId);
    if (!city) return [];
    
    const sources = getDataSources();
    if (sources.length === 0) return [];
    
    const forecasts: HourlyForecast[] = [];
    const now = new Date();
    const hours = 24;
    
    for (let i = 0; i < hours; i++) {
      const hourTime = new Date(now.getTime() + i * 3600000);
      const hourOfDay = hourTime.getHours();
      
      const tempValues = new Map<string, number>();
      const humidityValues = new Map<string, number>();
      const windSpeedValues = new Map<string, number>();
      const precipValues = new Map<string, number>();
      
      const weatherOptions: { weather: string; code: string; weight: number }[] = [];
      const windDirOptions: { direction: string; weight: number }[] = [];
      
      for (const source of sources) {
        const data = simulateWeatherFromSource(city, source.id, i * 10);
        const effectiveWeight = source.weight * (source.qualityScore / 100);
        
        const dayFactor = Math.sin((hourOfDay - 6) * Math.PI / 12) * 0.5 + 0.5;
        const hourlyTemp = data.temperature * 0.8 + dayFactor * 5;
        
        tempValues.set(source.id, Math.round(hourlyTemp * 10) / 10);
        humidityValues.set(source.id, data.humidity + (dayFactor < 0.5 ? 10 : -5));
        windSpeedValues.set(source.id, data.windSpeed * (0.7 + dayFactor * 0.6));
        precipValues.set(source.id, data.precipitation * (i < 6 ? 0.3 : 1));
        
        weatherOptions.push({ weather: data.weather, code: data.weatherCode, weight: effectiveWeight });
        windDirOptions.push({ direction: data.windDirection, weight: effectiveWeight });
      }
      
      const weatherCounts = new Map<string, { weather: string; code: string; totalWeight: number }>();
      for (const opt of weatherOptions) {
        const existing = weatherCounts.get(opt.code) || { weather: opt.weather, code: opt.code, totalWeight: 0 };
        existing.totalWeight += opt.weight;
        weatherCounts.set(opt.code, existing);
      }
      const dominantWeather = [...weatherCounts.values()].sort((a, b) => b.totalWeight - a.totalWeight)[0];
      
      const windDirCounts = new Map<string, number>();
      for (const opt of windDirOptions) {
        windDirCounts.set(opt.direction, (windDirCounts.get(opt.direction) || 0) + opt.weight);
      }
      const dominantWindDir = [...windDirCounts.entries()].sort((a, b) => b[1] - a[1])[0][0];
      
      forecasts.push({
        time: hourTime.toISOString(),
        temperature: weightedFusion(sources, tempValues),
        weather: dominantWeather.weather,
        weatherCode: dominantWeather.code,
        precipitation: weightedFusion(sources, precipValues),
        windDirection: dominantWindDir,
        windSpeed: weightedFusion(sources, windSpeedValues),
        humidity: weightedFusion(sources, humidityValues),
      });
    }
    
    return forecasts;
  },

  getDailyForecast(cityId: string): DailyForecast[] {
    const city = getCityById(cityId);
    if (!city) return [];
    
    const sources = getDataSources();
    if (sources.length === 0) return [];
    
    const forecasts: DailyForecast[] = [];
    const now = new Date();
    const days = 15;
    
    for (let i = 0; i < days; i++) {
      const dayDate = new Date(now.getTime() + i * 86400000);
      const dateStr = dayDate.toISOString().split('T')[0];
      
      const tempHighValues = new Map<string, number>();
      const tempLowValues = new Map<string, number>();
      const precipValues = new Map<string, number>();
      const uvIndexValues = new Map<string, number>();
      const humidityValues = new Map<string, number>();
      const windSpeedValues = new Map<string, number>();
      
      const dayWeatherOptions: { weather: string; code: string; weight: number }[] = [];
      const nightWeatherOptions: { weather: string; code: string; weight: number }[] = [];
      const windDirOptions: { direction: string; weight: number }[] = [];
      
      const tempRange = getSeasonalTempRange(city.latitude, dayDate.getMonth() + 1);
      const uncertaintyFactor = i >= 7 ? 1 + (i - 7) * 0.15 : 1;
      const dayVariation = seededRandom(i * 1000 + city.latitude) * (4 * uncertaintyFactor) - (2 * uncertaintyFactor);
      
      for (const source of sources) {
        const dayData = simulateWeatherFromSource(city, source.id, i * 100);
        const nightData = simulateWeatherFromSource(city, source.id, i * 100 + 50);
        const effectiveWeight = source.weight * (source.qualityScore / 100);
        
        tempHighValues.set(source.id, Math.round((tempRange.base + tempRange.range * 0.3 + dayVariation) * 10) / 10);
        tempLowValues.set(source.id, Math.round((tempRange.base - tempRange.range * 0.2 + dayVariation) * 10) / 10);
        precipValues.set(source.id, dayData.precipitation * (1 + i * 0.1) * (i >= 7 ? 1 + seededRandom(i + 5000) * uncertaintyFactor * 0.3 : 1));
        uvIndexValues.set(source.id, dayData.uvIndex);
        humidityValues.set(source.id, dayData.humidity);
        windSpeedValues.set(source.id, dayData.windSpeed);
        
        dayWeatherOptions.push({ weather: dayData.weather, code: dayData.weatherCode, weight: effectiveWeight });
        nightWeatherOptions.push({ weather: nightData.weather, code: nightData.weatherCode, weight: effectiveWeight });
        windDirOptions.push({ direction: dayData.windDirection, weight: effectiveWeight });
      }
      
      const dayWeatherCounts = new Map<string, { weather: string; code: string; totalWeight: number }>();
      for (const opt of dayWeatherOptions) {
        const existing = dayWeatherCounts.get(opt.code) || { weather: opt.weather, code: opt.code, totalWeight: 0 };
        existing.totalWeight += opt.weight;
        dayWeatherCounts.set(opt.code, existing);
      }
      const dominantDayWeather = [...dayWeatherCounts.values()].sort((a, b) => b.totalWeight - a.totalWeight)[0];
      
      const nightWeatherCounts = new Map<string, { weather: string; code: string; totalWeight: number }>();
      for (const opt of nightWeatherOptions) {
        const existing = nightWeatherCounts.get(opt.code) || { weather: opt.weather, code: opt.code, totalWeight: 0 };
        existing.totalWeight += opt.weight;
        nightWeatherCounts.set(opt.code, existing);
      }
      const dominantNightWeather = [...nightWeatherCounts.values()].sort((a, b) => b.totalWeight - a.totalWeight)[0];
      
      const windDirCounts = new Map<string, number>();
      for (const opt of windDirOptions) {
        windDirCounts.set(opt.direction, (windDirCounts.get(opt.direction) || 0) + opt.weight);
      }
      const dominantWindDir = [...windDirCounts.entries()].sort((a, b) => b[1] - a[1])[0][0];
      
      const sunriseHour = 5 + Math.floor(seededRandom(i + 1000) * 2);
      const sunriseMin = 30 + Math.floor(seededRandom(i + 1001) * 30);
      const sunsetHour = 18 + Math.floor(seededRandom(i + 1002) * 2);
      const sunsetMin = Math.floor(seededRandom(i + 1003) * 60);
      
      const sourceContribution = sources.map(s => ({
        sourceId: s.id,
        sourceName: s.name,
        weight: Math.round(s.weight * (s.qualityScore / 100) * 100) / 100
      }));
      const totalWeight = sourceContribution.reduce((sum, s) => sum + s.weight, 0);
      const credibility = totalWeight > 0 ? Math.round((totalWeight / sources.reduce((s, x) => s + x.weight, 0)) * 100) : 0;
      
      const precipProb = Math.max(0, Math.min(100, Math.round(30 + seededRandom(i + 2000) * 60 * (i >= 7 ? Math.min(1.3, uncertaintyFactor) : 1))));
      
      let anomalyNote: string | undefined;
      let reviewStatus: 'normal' | 'warning' | 'reviewed' = 'normal';
      if (i >= 10) {
        anomalyNote = `远期预报（第${i + 1}天）不确定性因子${Math.min(1.3, uncertaintyFactor).toFixed(2)}，数据置信度降低`;
        reviewStatus = 'warning';
      } else if (precipProb >= 80) {
        anomalyNote = `降水概率${precipProb}%，属强降水预警区间，已自动标记待复核`;
        reviewStatus = 'reviewed';
      }
      
      forecasts.push({
        date: dateStr,
        dayWeather: dominantDayWeather.weather,
        nightWeather: dominantNightWeather.weather,
        tempHigh: weightedFusion(sources, tempHighValues),
        tempLow: weightedFusion(sources, tempLowValues),
        precipitation: weightedFusion(sources, precipValues),
        precipitationProbability: precipProb,
        windDirectionDay: dominantWindDir,
        windSpeedDay: weightedFusion(sources, windSpeedValues),
        humidity: weightedFusion(sources, humidityValues),
        uvIndex: weightedFusion(sources, uvIndexValues),
        sunrise: `${String(sunriseHour).padStart(2, '0')}:${String(sunriseMin).padStart(2, '0')}`,
        sunset: `${String(sunsetHour).padStart(2, '0')}:${String(sunsetMin).padStart(2, '0')}`,
        credibility: Math.max(20, credibility - i * 3),
        sourceContribution,
        algorithmParams: {
          uncertaintyFactor: Math.round(uncertaintyFactor * 100) / 100,
          modelVersion: 'fusion-v2.3.1'
        },
        anomalyNote,
        reviewStatus,
      });
    }
    
    return forecasts;
  },

  getMinutelyPrecipitation(cityId: string): MinutelyPrecipitation | null {
    const city = getCityById(cityId);
    if (!city) return null;
    
    const sources = getDataSources();
    if (sources.length === 0) return null;
    
    const now = new Date();
    const stepMinutes = 5;
    const totalMinutes = 120;
    const steps = totalMinutes / stepMinutes;
    
    const precipitationList: { time: string; value: number; gridData?: number[][] }[] = [];
    
    const seedBase = city.latitude * 1000 + city.longitude * 10 + Math.floor(now.getTime() / 3600000);
    
    for (let i = 0; i < steps; i++) {
      const stepTime = new Date(now.getTime() + i * stepMinutes * 60000);
      
      const precipValues = new Map<string, number>();
      
      for (const source of sources) {
        const sourceSeed = seedBase + source.id.charCodeAt(0) * 10 + i;
        const basePrecip = seededRandom(sourceSeed) * 2;
        const waveFactor = Math.sin(i / 6) * 0.5 + 0.5;
        const precip = Math.round(basePrecip * waveFactor * 100) / 100;
        precipValues.set(source.id, precip);
      }
      
      const fusedPrecip = weightedFusion(sources, precipValues);
      
      const gridSize = 5;
      const gridData: number[][] = [];
      for (let r = 0; r < gridSize; r++) {
        const row: number[] = [];
        for (let c = 0; c < gridSize; c++) {
          const gridSeed = seedBase + i * 100 + r * 10 + c;
          const variation = seededRandom(gridSeed) * 0.4 - 0.2;
          row.push(Math.max(0, Math.round((fusedPrecip + variation) * 100) / 100));
        }
        gridData.push(row);
      }
      
      precipitationList.push({
        time: stepTime.toISOString(),
        value: fusedPrecip,
        gridData,
      });
    }
    
    const avgPrecip = precipitationList.reduce((sum, p) => sum + p.value, 0) / precipitationList.length;
    const maxPrecip = Math.max(...precipitationList.map(p => p.value));
    
    let summary = '';
    if (maxPrecip < 0.1) {
      summary = '未来2小时无降水';
    } else if (maxPrecip < 0.5) {
      summary = '未来2小时有微量降水';
    } else if (maxPrecip < 2) {
      summary = '未来2小时有小雨';
    } else if (maxPrecip < 5) {
      summary = '未来2小时有中雨';
    } else {
      summary = '未来2小时有大雨';
    }
    
    return {
      cityId: city.id,
      startTime: now.toISOString(),
      endTime: new Date(now.getTime() + totalMinutes * 60000).toISOString(),
      step: stepMinutes,
      gridSize: 500,
      precipitation: precipitationList,
      summary,
    };
  },
};
