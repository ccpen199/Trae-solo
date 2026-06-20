import { EnvironmentData } from '@/types';
import { addHours, startOfDay, getHours, getMonth, getDay } from 'date-fns';

function generatePressure(base: number, hour: number, trend: 'rising' | 'falling' | 'stable'): number {
  const diurnal = Math.sin((hour - 3) * Math.PI / 12) * 2;
  let trendOffset = 0;
  if (trend === 'rising') trendOffset = hour * 0.3;
  if (trend === 'falling') trendOffset = -hour * 0.3;
  return Math.round(base + diurnal + trendOffset + (Math.random() - 0.5) * 1);
}

function generateWaterTemp(airTemp: number, depth: number): number {
  const surfaceFactor = Math.min(1, depth / 5);
  return Math.round((airTemp - 2 + (4 - depth) * 0.5) * 10) / 10;
}

function generateDissolvedOxygen(waterTemp: number, hour: number): number {
  const tempFactor = Math.max(5, 14 - waterTemp * 0.3);
  const hourFactor = Math.sin((hour - 6) * Math.PI / 12) * 2 + 8;
  return Math.round(Math.min(14, Math.max(4, (tempFactor + hourFactor) / 2)) * 10) / 10;
}

function getMoonPhaseName(phase: number): string {
  if (phase < 0.125 || phase > 0.875) return '新月';
  if (phase < 0.375) return '上弦月';
  if (phase < 0.625) return '满月';
  return '下弦月';
}

function getWindDirectionName(deg: number): string {
  const directions = ['北风', '东北风', '东风', '东南风', '南风', '西南风', '西风', '西北风'];
  const index = Math.round(deg / 45) % 8;
  return directions[index];
}

function getTideTypeName(type: string): string {
  const names: Record<string, string> = {
    high: '满潮',
    low: '干潮',
    rising: '涨潮',
    falling: '落潮',
  };
  return names[type] || type;
}

function calculateMoonPhase(date: Date): number {
  const knownNewMoon = new Date(2024, 0, 11, 11, 57, 0).getTime();
  const lunarCycle = 29.530588853 * 24 * 60 * 60 * 1000;
  const diff = date.getTime() - knownNewMoon;
  const phase = (diff % lunarCycle) / lunarCycle;
  return phase < 0 ? phase + 1 : phase;
}

export function generateEnvironmentData(
  spotId: string,
  date: Date,
  baseTemp: number = 20,
  isSea: boolean = false
): EnvironmentData[] {
  const data: EnvironmentData[] = [];
  const startDate = startOfDay(date);
  
  const pressureTrend: 'rising' | 'falling' | 'stable' = 
    Math.random() > 0.6 ? 'rising' : Math.random() > 0.5 ? 'falling' : 'stable';
  const basePressure = 1005 + Math.random() * 15;
  
  const moonPhase = calculateMoonPhase(date);
  const moonIllumination = Math.round((1 - Math.cos(moonPhase * 2 * Math.PI)) / 2 * 100);
  
  const sunriseHour = 5 + Math.random() * 2;
  const sunsetHour = 18 + Math.random() * 3;
  
  for (let h = 0; h < 24; h++) {
    const hourDate = addHours(startDate, h);
    const tempVariation = Math.sin((h - 6) * Math.PI / 12) * 8;
    const temperature = Math.round((baseTemp + tempVariation + (Math.random() - 0.5) * 1) * 10) / 10;
    
    const humidity = Math.round((70 - tempVariation * 2 + (Math.random() - 0.5) * 10));
    
    const pressure = generatePressure(basePressure, h, pressureTrend);
    
    const windSpeed = Math.round((3 + Math.random() * 5 + Math.sin(h / 4) * 2) * 10) / 10;
    const windDirection = Math.round(90 + Math.sin(h / 6) * 60 + (Math.random() - 0.5) * 30);
    
    const waterTemp = generateWaterTemp(temperature, 3);
    const dissolvedOxygen = generateDissolvedOxygen(waterTemp, h);
    
    let tideType: string | undefined;
    let tideHeight: number | undefined;
    if (isSea) {
      const tidePhase = ((h + 3) % 12) / 12;
      if (tidePhase < 0.1 || tidePhase > 0.9) {
        tideType = 'high';
        tideHeight = 2.5 + Math.random() * 0.5;
      } else if (tidePhase > 0.4 && tidePhase < 0.6) {
        tideType = 'low';
        tideHeight = 0.5 + Math.random() * 0.3;
      } else if (tidePhase < 0.5) {
        tideType = 'falling';
        tideHeight = 2.5 - tidePhase * 4;
      } else {
        tideType = 'rising';
        tideHeight = (tidePhase - 0.5) * 4 + 0.5;
      }
    }
    
    const uvIndex = Math.max(0, Math.round((Math.sin((h - 6) * Math.PI / 8) * 10) * 10) / 10);
    const visibility = Math.round((10 + Math.random() * 5) * 10) / 10;
    
    const sunrise = addHours(startDate, sunriseHour).getTime();
    const sunset = addHours(startDate, sunsetHour).getTime();
    
    const moonrise = addHours(startDate, 18 - moonPhase * 12).getTime();
    const moonset = addHours(startDate, 6 - moonPhase * 12).getTime();
    
    data.push({
      timestamp: hourDate.getTime(),
      spotId,
      source: 'mock-data',
      temperature,
      humidity,
      pressure,
      pressureTrend,
      windSpeed,
      windDirection,
      windDirectionName: getWindDirectionName(windDirection),
      waterTemp,
      dissolvedOxygen,
      waterLevel: 0,
      ...(isSea && { tideType: tideType as any, tideTypeName: getTideTypeName(tideType!), tideHeight }),
      sunrise,
      sunset,
      moonrise,
      moonset,
      moonPhase,
      moonPhaseName: getMoonPhaseName(moonPhase),
      moonIllumination,
      uvIndex,
      visibility,
    });
  }
  
  return data;
}

export function generate14DayEnvironmentData(
  spotId: string,
  startDate: Date = new Date(),
  isSea: boolean = false
): EnvironmentData[] {
  const allData: EnvironmentData[] = [];
  
  const baseTemp = 15 + getMonth(startDate) * 2 + Math.random() * 5;
  
  for (let day = 0; day < 14; day++) {
    const dayDate = new Date(startDate);
    dayDate.setDate(dayDate.getDate() + day);
    
    const dayTempVariation = Math.sin(day / 3) * 3 + (Math.random() - 0.5) * 2;
    
    const dayData = generateEnvironmentData(
      spotId,
      dayDate,
      baseTemp + dayTempVariation,
      isSea
    );
    
    allData.push(...dayData);
  }
  
  return allData;
}

export function getCurrentEnvironmentData(
  spotId: string,
  isSea: boolean = false
): EnvironmentData {
  const now = new Date();
  const todayData = generateEnvironmentData(spotId, now, 22, isSea);
  const currentHour = getHours(now);
  return todayData[currentHour];
}
