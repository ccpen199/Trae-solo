import { FishingIndex, IndexFactor, EnvironmentData, FishSpecies, FishingMethod, HeatmapDataPoint } from '@/types';
import { getHours, getMonth } from 'date-fns';

function gaussianScore(value: number, mean: number, std: number): number {
  const exponent = -Math.pow(value - mean, 2) / (2 * Math.pow(std, 2));
  return Math.exp(exponent) * 100;
}

function normalize(value: number, min: number, max: number): number {
  return Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
}

function getPressureScore(pressure: number, trend: string): { score: number; description: string } {
  let baseScore = normalize(pressure, 990, 1030);
  
  let trendBonus = 0;
  let trendDesc = '';
  if (trend === 'rising') {
    trendBonus = 15;
    trendDesc = '气压上升，鱼口活跃';
  } else if (trend === 'falling') {
    trendBonus = -20;
    trendDesc = '气压下降，鱼口较差';
  } else {
    trendDesc = '气压稳定，鱼口一般';
  }
  
  const score = Math.max(0, Math.min(100, baseScore + trendBonus));
  
  if (pressure < 1000) {
    return { score: Math.min(score, 40), description: '气压过低，鱼类活跃度低' };
  }
  if (pressure > 1025) {
    return { score: Math.min(score, 95), description: '高气压环境，鱼类活跃' };
  }
  
  return { score, description: trendDesc };
}

function getWaterTempScore(waterTemp: number, species: FishSpecies): { score: number; description: string } {
  const [minTemp, maxTemp] = species.optimalTemp;
  const optimal = (minTemp + maxTemp) / 2;
  const range = (maxTemp - minTemp) / 2;
  
  const score = gaussianScore(waterTemp, optimal, range * 0.8);
  
  if (waterTemp < minTemp - 5) {
    return { score: Math.min(score, 20), description: `水温过低，${species.name}活跃度低` };
  }
  if (waterTemp > maxTemp + 5) {
    return { score: Math.min(score, 30), description: `水温过高，${species.name}食欲下降` };
  }
  if (waterTemp >= minTemp && waterTemp <= maxTemp) {
    return { score, description: `水温适宜，${species.name}摄食积极` };
  }
  
  return { score, description: `水温偏${waterTemp < optimal ? '低' : '高'}` };
}

function getDissolvedOxygenScore(doLevel: number, species: FishSpecies): { score: number; description: string } {
  const oxygenHabit = species.habits.find(h => h.type === 'oxygen');
  const sensitivity = oxygenHabit ? oxygenHabit.value / 100 : 0.5;
  
  let baseScore = normalize(doLevel, 2, 12);
  
  if (doLevel < 3) {
    return { score: 15 + sensitivity * 10, description: '溶氧严重不足，鱼类浮头' };
  }
  if (doLevel < 5) {
    return { score: 40 + sensitivity * 20, description: '溶氧偏低，鱼口一般' };
  }
  if (doLevel >= 8) {
    return { score: 95, description: '溶氧充足，鱼类活跃' };
  }
  
  return { score: baseScore, description: `溶氧${doLevel.toFixed(1)}mg/L` };
}

function getTideScore(tideType?: string, tideHeight?: number): { score: number; description: string } {
  if (!tideType || tideHeight === undefined) {
    return { score: 50, description: '非海水钓场，潮汐影响不明显' };
  }
  
  switch (tideType) {
    case 'rising':
      return { score: 80, description: '涨潮期，鱼群随潮水涌入觅食' };
    case 'falling':
      return { score: 75, description: '落潮期，鱼群随潮撤退，咬口积极' };
    case 'high':
      return { score: 50, description: '满潮平流期，鱼口较慢' };
    case 'low':
      return { score: 40, description: '干潮期，水位低，鱼少' };
    default:
      return { score: 50, description: '潮汐影响一般' };
  }
}

function getMoonScore(moonPhase: number, moonIllumination: number, species: FishSpecies): { score: number; description: string } {
  const nocturnalHabit = species.habits.find(h => h.type === 'nocturnal');
  const isNocturnal = nocturnalHabit ? nocturnalHabit.value > 50 : false;
  
  if (isNocturnal) {
    const score = 50 + moonIllumination * 0.4;
    if (moonIllumination > 70) {
      return { score: Math.min(95, score), description: '月光充足，夜行性鱼类活跃' };
    }
    return { score, description: '月相影响夜行性鱼类' };
  } else {
    const score = 60 - Math.abs(moonPhase - 0.5) * 40;
    return { score: Math.max(40, score), description: '月相对日行性鱼类影响较小' };
  }
}

function getTimeOfDayScore(hour: number, species: FishSpecies): { score: number; description: string } {
  let score = 50;
  let description = '普通时段';
  
  const isNocturnal = species.habits.some(h => h.type === 'nocturnal' && h.value > 50);
  const isPhototaxis = species.habits.some(h => h.type === 'phototaxis' && h.value > 50);
  
  if (hour >= 5 && hour <= 7) {
    score = 90;
    description = '清晨黄金时段，鱼口最佳';
  } else if (hour >= 17 && hour <= 19) {
    score = 85;
    description = '黄昏黄金时段，摄食积极';
  } else if (hour >= 11 && hour <= 14) {
    score = 40;
    description = '中午高温时段，鱼躲深水区';
  } else if (hour >= 22 || hour <= 4) {
    if (isNocturnal) {
      score = 80;
      description = '夜间活跃时段';
    } else {
      score = 35;
      description = '夜间休息，鱼口差';
    }
  }
  
  if (isPhototaxis && hour >= 9 && hour <= 16) {
    score = Math.min(100, score + 15);
    description = '趋光性鱼类白天活跃';
  }
  
  return { score, description };
}

function getWindScore(windSpeed: number, method: FishingMethod): { score: number; description: string } {
  if (method.type === 'sea') {
    if (windSpeed < 3) {
      return { score: 90, description: '风平浪静，适合海钓' };
    } else if (windSpeed < 6) {
      return { score: 75, description: '微风，海钓条件良好' };
    } else if (windSpeed < 10) {
      return { score: 50, description: '风力较大，注意安全' };
    } else {
      return { score: 20, description: '风力过大，不建议出海' };
    }
  }
  
  if (windSpeed < 2) {
    return { score: 70, description: '无风，水面平静' };
  } else if (windSpeed < 4) {
    return { score: 85, description: '微风，溶氧增加，鱼口好' };
  } else if (windSpeed < 6) {
    return { score: 70, description: '和风，抛竿稍有影响' };
  } else if (windSpeed < 8) {
    return { score: 50, description: '风力较大，抛竿困难' };
  } else {
    return { score: 25, description: '风力过大，不适合垂钓' };
  }
}

function getSeasonBonus(date: Date, species: FishSpecies): number {
  const month = getMonth(date) + 1;
  const tempHabit = species.habits.find(h => h.type === 'temperature');
  
  if (!tempHabit) return 0;
  
  if (tempHabit.value > 60) {
    if (month >= 6 && month <= 8) {
      return 10;
    }
    if (month <= 2 || month >= 12) {
      return -15;
    }
  }
  
  if (species.optimalTemp[0] < 10) {
    if (month >= 3 && month <= 5) return 5;
    if (month >= 9 && month <= 11) return 5;
  }
  
  return 0;
}

function getLevelAndName(score: number): { level: string; levelName: string } {
  if (score >= 80) return { level: 'excellent', levelName: '极佳' };
  if (score >= 65) return { level: 'good', levelName: '良好' };
  if (score >= 45) return { level: 'fair', levelName: '一般' };
  return { level: 'poor', levelName: '较差' };
}

function getSuggestion(score: number, factors: IndexFactor[], speciesName: string): string {
  if (score >= 80) {
    return `今天是钓${speciesName}的绝佳时机！建议尽早出发，抓住黄金时段。${factors[0]?.description || ''}`;
  }
  if (score >= 65) {
    return `钓${speciesName}条件不错，可以出钓。注意选择合适的时段和钓位。`;
  }
  if (score >= 45) {
    return `钓${speciesName}条件一般，可以试试早晚时段，或者换个目标鱼种。`;
  }
  return `今天不太适合钓${speciesName}，建议改天再钓，或者选择其他适应性强的鱼种。`;
}

export function calculateFishingIndex(
  envData: EnvironmentData,
  species: FishSpecies,
  method: FishingMethod
): FishingIndex {
  const hour = getHours(new Date(envData.timestamp));
  const date = new Date(envData.timestamp);
  
  const pressureResult = getPressureScore(envData.pressure, envData.pressureTrend);
  const waterTempResult = getWaterTempScore(envData.waterTemp, species);
  const doResult = getDissolvedOxygenScore(envData.dissolvedOxygen, species);
  const tideResult = getTideScore(envData.tideType, envData.tideHeight);
  const moonResult = getMoonScore(envData.moonPhase, envData.moonIllumination, species);
  const timeResult = getTimeOfDayScore(hour, species);
  const windResult = getWindScore(envData.windSpeed, method);
  const seasonBonus = getSeasonBonus(date, species);
  
  const factors: IndexFactor[] = [
    { name: '气压', key: 'pressure', score: pressureResult.score, weight: 20, description: pressureResult.description },
    { name: '水温', key: 'waterTemp', score: waterTempResult.score, weight: 18, description: waterTempResult.description },
    { name: '溶解氧', key: 'dissolvedOxygen', score: doResult.score, weight: 15, description: doResult.description },
    { name: '时段', key: 'time', score: timeResult.score, weight: 15, description: timeResult.description },
    { name: '潮汐', key: 'tide', score: tideResult.score, weight: envData.tideType ? 12 : 5, description: tideResult.description },
    { name: '月相', key: 'moon', score: moonResult.score, weight: 8, description: moonResult.description },
    { name: '风力', key: 'wind', score: windResult.score, weight: 10, description: windResult.description },
  ];
  
  const totalWeight = factors.reduce((sum, f) => sum + f.weight, 0);
  const weightedScore = factors.reduce((sum, f) => sum + f.score * f.weight, 0) / totalWeight;
  const overallScore = Math.max(0, Math.min(100, Math.round(weightedScore + seasonBonus)));
  
  const { level, levelName } = getLevelAndName(overallScore);
  const suggestion = getSuggestion(overallScore, factors, species.name);
  
  const bestDepth = `${species.optimalDepth[0]}-${species.optimalDepth[1]}米`;
  const baits = ['蚯蚓', '红虫', '玉米粒', '商品饵', '螺蛳'];
  const bestBait = baits[Math.floor(Math.random() * baits.length)];
  
  return {
    spotId: envData.spotId,
    speciesId: species.id,
    methodId: method.id,
    timestamp: envData.timestamp,
    overallScore,
    level: level as any,
    levelName,
    factors,
    suggestion,
    bestBait,
    bestDepth,
  };
}

export function generateHeatmapData(
  envDataList: EnvironmentData[],
  species: FishSpecies,
  method: FishingMethod
): HeatmapDataPoint[] {
  const data: HeatmapDataPoint[] = [];
  
  for (let i = 0; i < envDataList.length; i++) {
    const envData = envDataList[i];
    const index = calculateFishingIndex(envData, species, method);
    const date = new Date(envData.timestamp);
    const startOfPeriod = new Date(envDataList[0].timestamp);
    const dayOffset = Math.floor((date.getTime() - startOfPeriod.getTime()) / (24 * 60 * 60 * 1000));
    
    data.push({
      day: dayOffset,
      hour: date.getHours(),
      score: index.overallScore,
      timestamp: envData.timestamp,
    });
  }
  
  return data;
}

export function findBestFishingTimes(
  heatmapData: HeatmapDataPoint[],
  count: number = 5
): HeatmapDataPoint[] {
  return [...heatmapData]
    .sort((a, b) => b.score - a.score)
    .slice(0, count);
}
