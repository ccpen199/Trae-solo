import { db } from '../db/database';
import type { LifeIndex, LifeIndexType, IndexParameter, CurrentWeather } from '../../shared/types';

interface WeatherDataForIndex {
  temperature: number;
  humidity: number;
  windSpeed: number;
  weather: string;
  weatherCode: string;
  precipitation: number;
  uvIndex: number;
  visibility: number;
  pressure: number;
  feelsLike: number;
}

function getIndexParamFromDb(indexType: string): IndexParameter | null {
  const param = db.prepare('SELECT * FROM index_parameters WHERE index_type = ?').get(indexType) as any;
  if (!param) return null;
  
  try {
    return {
      indexType: param.index_type,
      indexName: param.index_name,
      parameters: JSON.parse(param.parameters),
      version: param.version || 'v1.0',
      updateTime: param.update_time,
    };
  } catch {
    return null;
  }
}

function getParamValue(params: IndexParameter['parameters'], key: string, defaultValue: number): number {
  const param = params.find(p => p.key === key);
  return param ? param.value : defaultValue;
}

function calculateAqi(weather: WeatherDataForIndex, params: IndexParameter['parameters']): LifeIndex {
  const excellentMax = getParamValue(params, 'excellentMax', 50);
  const goodMax = getParamValue(params, 'goodMax', 100);
  const lightMax = getParamValue(params, 'lightMax', 150);
  const moderateMax = getParamValue(params, 'moderateMax', 200);
  
  const baseAqi = 30 + Math.floor(Math.random() * 80);
  const weatherFactor = weather.weatherCode >= '07' ? -10 : weather.weatherCode === '00' ? 10 : 0;
  const aqi = Math.max(10, Math.min(300, baseAqi + weatherFactor));
  
  let level = '';
  let levelCode = 0;
  let description = '';
  
  if (aqi <= excellentMax) {
    level = '优';
    levelCode = 1;
    description = '空气质量令人满意，基本无空气污染，各类人群可正常活动';
  } else if (aqi <= goodMax) {
    level = '良';
    levelCode = 2;
    description = '空气质量可接受，某些污染物可能对极少数异常敏感人群健康有较弱影响';
  } else if (aqi <= lightMax) {
    level = '轻度污染';
    levelCode = 3;
    description = '易感人群症状有轻度加剧，健康人群出现刺激症状';
  } else if (aqi <= moderateMax) {
    level = '中度污染';
    levelCode = 4;
    description = '进一步加剧易感人群症状，可能对健康人群心脏、呼吸系统有影响';
  } else {
    level = '重度污染';
    levelCode = 5;
    description = '心脏病和肺病患者症状显著加剧，运动耐受力降低，健康人群普遍出现症状';
  }
  
  return {
    type: 'aqi',
    name: '空气质量',
    value: aqi,
    level,
    levelCode,
    description,
    updateTime: new Date().toISOString(),
  };
}

function calculatePm25(weather: WeatherDataForIndex, _params: IndexParameter['parameters']): LifeIndex {
  const basePm25 = 20 + Math.floor(Math.random() * 60);
  const weatherFactor = weather.weatherCode >= '07' ? -15 : weather.weatherCode === '00' ? 10 : 0;
  const pm25 = Math.max(5, Math.min(250, basePm25 + weatherFactor));
  
  let level = '';
  let levelCode = 0;
  let description = '';
  
  if (pm25 <= 35) {
    level = '优';
    levelCode = 1;
    description = 'PM2.5浓度很低，空气质量优秀，适合户外活动';
  } else if (pm25 <= 75) {
    level = '良';
    levelCode = 2;
    description = 'PM2.5浓度适中，空气质量良好，可正常进行户外活动';
  } else if (pm25 <= 115) {
    level = '轻度污染';
    levelCode = 3;
    description = 'PM2.5浓度偏高，敏感人群应减少户外活动';
  } else if (pm25 <= 150) {
    level = '中度污染';
    levelCode = 4;
    description = 'PM2.5浓度较高，建议减少户外活动，外出佩戴口罩';
  } else {
    level = '重度污染';
    levelCode = 5;
    description = 'PM2.5浓度很高，应避免户外活动，关闭门窗';
  }
  
  return {
    type: 'pm25',
    name: 'PM2.5',
    value: pm25,
    level,
    levelCode,
    description,
    updateTime: new Date().toISOString(),
  };
}

function calculateUv(weather: WeatherDataForIndex, params: IndexParameter['parameters']): LifeIndex {
  const weakMax = getParamValue(params, 'weakMax', 2);
  const moderateMax = getParamValue(params, 'moderateMax', 5);
  const strongMax = getParamValue(params, 'strongMax', 7);
  const veryStrongMax = getParamValue(params, 'veryStrongMax', 10);
  
  const uv = weather.uvIndex;
  
  let level = '';
  let levelCode = 0;
  let description = '';
  
  if (uv <= weakMax) {
    level = '弱';
    levelCode = 1;
    description = '紫外线强度较弱，无需特别防护，可以放心外出';
  } else if (uv <= moderateMax) {
    level = '中等';
    levelCode = 2;
    description = '紫外线强度中等，外出建议涂抹防晒霜，戴遮阳帽';
  } else if (uv <= strongMax) {
    level = '强';
    levelCode = 3;
    description = '紫外线较强，尽量避免10-16点外出，外出做好防晒';
  } else if (uv <= veryStrongMax) {
    level = '很强';
    levelCode = 4;
    description = '紫外线很强，尽量避免外出，外出需全面防护';
  } else {
    level = '极强';
    levelCode = 5;
    description = '紫外线极强，尽量不要外出，务必外出请全副武装';
  }
  
  return {
    type: 'uv',
    name: '紫外线',
    value: uv,
    level,
    levelCode,
    description,
    updateTime: new Date().toISOString(),
  };
}

function calculateFeelsLike(weather: WeatherDataForIndex, _params: IndexParameter['parameters']): LifeIndex {
  const feelsLike = weather.feelsLike;
  
  let level = '';
  let levelCode = 0;
  let description = '';
  
  if (feelsLike >= 35) {
    level = '酷热';
    levelCode = 1;
    description = '体感酷热，注意防暑降温，多补充水分';
  } else if (feelsLike >= 28) {
    level = '炎热';
    levelCode = 2;
    description = '体感炎热，注意防暑，适当使用空调';
  } else if (feelsLike >= 20) {
    level = '舒适';
    levelCode = 3;
    description = '体感舒适，温度适宜，适合户外活动';
  } else if (feelsLike >= 10) {
    level = '凉爽';
    levelCode = 4;
    description = '体感凉爽，早晚温差大，注意适时增减衣物';
  } else if (feelsLike >= 0) {
    level = '寒冷';
    levelCode = 5;
    description = '体感寒冷，注意保暖，外出添加厚衣物';
  } else {
    level = '严寒';
    levelCode = 6;
    description = '体感严寒，注意防寒保暖，避免长时间户外活动';
  }
  
  return {
    type: 'feels_like',
    name: '体感温度',
    value: `${feelsLike}°C`,
    level,
    levelCode,
    description,
    updateTime: new Date().toISOString(),
  };
}

function calculateDressing(weather: WeatherDataForIndex, params: IndexParameter['parameters']): LifeIndex {
  const hotThreshold = getParamValue(params, 'hotThreshold', 28);
  const warmThreshold = getParamValue(params, 'warmThreshold', 20);
  const coolThreshold = getParamValue(params, 'coolThreshold', 10);
  const coldThreshold = getParamValue(params, 'coldThreshold', 0);
  
  const temp = weather.temperature;
  
  let level = '';
  let levelCode = 0;
  let description = '';
  
  if (temp >= hotThreshold) {
    level = '炎热';
    levelCode = 1;
    description = '天气炎热，建议穿着短衫、短裙、短裤等清凉透气的夏季服装';
  } else if (temp >= warmThreshold) {
    level = '温暖';
    levelCode = 2;
    description = '天气温暖，建议穿着长袖衬衫、薄T恤、单裤等春秋装';
  } else if (temp >= coolThreshold) {
    level = '凉爽';
    levelCode = 3;
    description = '天气凉爽，建议穿着风衣、夹克、薄毛衣等秋季服装';
  } else if (temp >= coldThreshold) {
    level = '寒冷';
    levelCode = 4;
    description = '天气寒冷，建议穿着厚外套、毛衣、棉服等冬季服装';
  } else {
    level = '严寒';
    levelCode = 5;
    description = '天气严寒，建议穿着羽绒服、厚棉服、保暖内衣等御寒服装';
  }
  
  return {
    type: 'dressing',
    name: '穿衣',
    value: level,
    level,
    levelCode,
    description,
    updateTime: new Date().toISOString(),
  };
}

function calculateCarWash(weather: WeatherDataForIndex, _params: IndexParameter['parameters']): LifeIndex {
  let score = 100;
  
  if (weather.precipitation > 0) {
    score -= 60;
  }
  if (weather.weatherCode === '00' || weather.weatherCode === '01') {
    score += 10;
  }
  if (weather.windSpeed > 6) {
    score -= 20;
  }
  if (weather.humidity > 80) {
    score -= 10;
  }
  
  score = Math.max(0, Math.min(100, score));
  
  let level = '';
  let levelCode = 0;
  let description = '';
  
  if (score >= 80) {
    level = '适宜';
    levelCode = 1;
    description = '天气较好，适宜洗车，车辆可保持较长时间清洁';
  } else if (score >= 60) {
    level = '较适宜';
    levelCode = 2;
    description = '天气较好，较适宜洗车，但可能有少量灰尘';
  } else if (score >= 40) {
    level = '一般';
    levelCode = 3;
    description = '洗车条件一般，建议根据实际情况决定';
  } else if (score >= 20) {
    level = '较不宜';
    levelCode = 4;
    description = '天气条件欠佳，不太适宜洗车，可能很快变脏';
  } else {
    level = '不宜';
    levelCode = 5;
    description = '天气不好，不宜洗车，建议等天气转好后再洗';
  }
  
  return {
    type: 'car_wash',
    name: '洗车',
    value: level,
    level,
    levelCode,
    description,
    updateTime: new Date().toISOString(),
  };
}

function calculateSports(weather: WeatherDataForIndex, params: IndexParameter['parameters']): LifeIndex {
  const optimalTemp = getParamValue(params, 'optimalTemp', 20);
  const tempTolerance = getParamValue(params, 'tempTolerance', 8);
  const maxWind = getParamValue(params, 'maxWind', 5);
  const maxPrecip = getParamValue(params, 'maxPrecip', 0.5);
  
  let score = 100;
  
  const tempDiff = Math.abs(weather.temperature - optimalTemp);
  if (tempDiff > tempTolerance) {
    score -= (tempDiff - tempTolerance) * 3;
  }
  
  if (weather.windSpeed > maxWind) {
    score -= (weather.windSpeed - maxWind) * 5;
  }
  
  if (weather.precipitation > maxPrecip) {
    score -= 50;
  }
  
  if (weather.uvIndex > 7) {
    score -= 15;
  }
  
  score = Math.max(0, Math.min(100, score));
  
  let level = '';
  let levelCode = 0;
  let description = '';
  
  if (score >= 80) {
    level = '适宜';
    levelCode = 1;
    description = '天气晴好，非常适宜进行各种户外运动';
  } else if (score >= 60) {
    level = '较适宜';
    levelCode = 2;
    description = '天气较好，比较适宜户外运动，注意适当补充水分';
  } else if (score >= 40) {
    level = '一般';
    levelCode = 3;
    description = '天气条件一般，可以进行轻度运动，建议减少剧烈运动';
  } else if (score >= 20) {
    level = '较不宜';
    levelCode = 4;
    description = '天气条件欠佳，不太适宜户外运动，建议选择室内运动';
  } else {
    level = '不宜';
    levelCode = 5;
    description = '天气不好，不宜进行户外运动，建议在室内活动';
  }
  
  return {
    type: 'sports',
    name: '运动',
    value: level,
    level,
    levelCode,
    description,
    updateTime: new Date().toISOString(),
  };
}

function calculateCold(weather: WeatherDataForIndex, _params: IndexParameter['parameters']): LifeIndex {
  let risk = 0;
  
  if (weather.temperature < 5) {
    risk += 40;
  } else if (weather.temperature < 10) {
    risk += 25;
  } else if (weather.temperature < 15) {
    risk += 10;
  }
  
  if (weather.temperature < 20 && weather.humidity > 70) {
    risk += 15;
  }
  
  if (weather.windSpeed > 5) {
    risk += 15;
  }
  
  if (weather.weatherCode >= '07' && weather.weatherCode <= '11') {
    risk += 20;
  }
  
  risk = Math.max(0, Math.min(100, risk));
  
  let level = '';
  let levelCode = 0;
  let description = '';
  
  if (risk < 20) {
    level = '低发';
    levelCode = 1;
    description = '感冒低发期，天气舒适，感冒概率较低';
  } else if (risk < 40) {
    level = '少发';
    levelCode = 2;
    description = '感冒少发期，无明显降温，注意适当增减衣物';
  } else if (risk < 60) {
    level = '较易发';
    levelCode = 3;
    description = '感冒较易发生，天气变化较大，注意预防感冒';
  } else if (risk < 80) {
    level = '易发';
    levelCode = 4;
    description = '感冒易发生，天气寒冷潮湿，容易感冒，注意保暖';
  } else {
    level = '极易发';
    levelCode = 5;
    description = '感冒极易发生，天气恶劣，请注意防寒保暖，预防感冒';
  }
  
  return {
    type: 'cold',
    name: '感冒',
    value: level,
    level,
    levelCode,
    description,
    updateTime: new Date().toISOString(),
  };
}

function calculateDrying(weather: WeatherDataForIndex, _params: IndexParameter['parameters']): LifeIndex {
  let score = 100;
  
  if (weather.precipitation > 0) {
    score -= 60;
  }
  
  if (weather.humidity > 80) {
    score -= 25;
  } else if (weather.humidity > 60) {
    score -= 10;
  }
  
  if (weather.windSpeed < 2) {
    score -= 15;
  } else if (weather.windSpeed > 4) {
    score += 10;
  }
  
  if (weather.weatherCode === '00') {
    score += 15;
  }
  
  score = Math.max(0, Math.min(100, score));
  
  let level = '';
  let levelCode = 0;
  let description = '';
  
  if (score >= 80) {
    level = '适宜';
    levelCode = 1;
    description = '天气晴好，非常适宜晾晒，衣物容易干透';
  } else if (score >= 60) {
    level = '较适宜';
    levelCode = 2;
    description = '天气较好，比较适宜晾晒，衣物干得较快';
  } else if (score >= 40) {
    level = '一般';
    levelCode = 3;
    description = '晾晒条件一般，衣物可能需要较长时间才能干透';
  } else if (score >= 20) {
    level = '较不宜';
    levelCode = 4;
    description = '晾晒条件欠佳，不太适宜晾晒，建议选择室内晾晒';
  } else {
    level = '不宜';
    levelCode = 5;
    description = '天气不好，不宜晾晒，建议不要洗衣服';
  }
  
  return {
    type: 'drying',
    name: '晾晒',
    value: level,
    level,
    levelCode,
    description,
    updateTime: new Date().toISOString(),
  };
}

function calculateTravel(weather: WeatherDataForIndex, _params: IndexParameter['parameters']): LifeIndex {
  let score = 100;
  
  if (weather.precipitation > 5) {
    score -= 40;
  } else if (weather.precipitation > 0) {
    score -= 20;
  }
  
  if (weather.weatherCode === '00' || weather.weatherCode === '01') {
    score += 10;
  } else if (weather.weatherCode >= '07' && weather.weatherCode <= '11') {
    score -= 15;
  }
  
  if (weather.temperature > 35 || weather.temperature < 0) {
    score -= 25;
  } else if (weather.temperature > 30 || weather.temperature < 10) {
    score -= 10;
  }
  
  if (weather.windSpeed > 8) {
    score -= 20;
  }
  
  if (weather.visibility < 5) {
    score -= 15;
  }
  
  score = Math.max(0, Math.min(100, score));
  
  let level = '';
  let levelCode = 0;
  let description = '';
  
  if (score >= 80) {
    level = '适宜';
    levelCode = 1;
    description = '天气晴好，非常适宜出游，是旅游观光的好天气';
  } else if (score >= 60) {
    level = '较适宜';
    levelCode = 2;
    description = '天气较好，比较适宜出游，注意备好雨具';
  } else if (score >= 40) {
    level = '一般';
    levelCode = 3;
    description = '天气条件一般，可以出游，但要注意天气变化';
  } else if (score >= 20) {
    level = '较不宜';
    levelCode = 4;
    description = '天气条件欠佳，不太适宜出游，建议选择室内活动';
  } else {
    level = '不宜';
    levelCode = 5;
    description = '天气不好，不宜出游，建议改天再安排行程';
  }
  
  return {
    type: 'travel',
    name: '旅游',
    value: level,
    level,
    levelCode,
    description,
    updateTime: new Date().toISOString(),
  };
}

function calculateTraffic(weather: WeatherDataForIndex, _params: IndexParameter['parameters']): LifeIndex {
  let score = 100;
  
  if (weather.precipitation > 10) {
    score -= 50;
  } else if (weather.precipitation > 2) {
    score -= 30;
  } else if (weather.precipitation > 0) {
    score -= 15;
  }
  
  if (weather.visibility < 1) {
    score -= 40;
  } else if (weather.visibility < 3) {
    score -= 20;
  } else if (weather.visibility < 5) {
    score -= 10;
  }
  
  if (weather.windSpeed > 10) {
    score -= 25;
  } else if (weather.windSpeed > 6) {
    score -= 10;
  }
  
  if (weather.weatherCode === '15' || weather.weatherCode === '16') {
    score -= 40;
  }
  
  if (weather.weatherCode === '11') {
    score -= 30;
  }
  
  score = Math.max(0, Math.min(100, score));
  
  let level = '';
  let levelCode = 0;
  let description = '';
  
  if (score >= 80) {
    level = '良好';
    levelCode = 1;
    description = '天气晴好，交通条件良好，出行顺畅';
  } else if (score >= 60) {
    level = '较好';
    levelCode = 2;
    description = '天气较好，交通条件较好，注意行车安全';
  } else if (score >= 40) {
    level = '一般';
    levelCode = 3;
    description = '交通条件一般，可能受天气影响，建议减速慢行';
  } else if (score >= 20) {
    level = '较差';
    levelCode = 4;
    description = '交通条件较差，受天气影响较大，建议谨慎驾驶';
  } else {
    level = '很差';
    levelCode = 5;
    description = '交通条件很差，恶劣天气严重影响出行，建议减少外出';
  }
  
  return {
    type: 'traffic',
    name: '交通',
    value: level,
    level,
    levelCode,
    description,
    updateTime: new Date().toISOString(),
  };
}

function calculateComfort(weather: WeatherDataForIndex, _params: IndexParameter['parameters']): LifeIndex {
  let score = 100;
  
  const temp = weather.temperature;
  if (temp > 28) {
    score -= (temp - 28) * 3;
  } else if (temp < 10) {
    score -= (10 - temp) * 2;
  }
  
  const humidity = weather.humidity;
  if (temp > 25 && humidity > 70) {
    score -= (humidity - 70) * 0.5;
  }
  
  if (weather.windSpeed > 6) {
    score -= (weather.windSpeed - 6) * 2;
  }
  
  if (weather.precipitation > 0) {
    score -= 10;
  }
  
  score = Math.max(0, Math.min(100, score));
  
  let level = '';
  let levelCode = 0;
  let description = '';
  
  if (score >= 85) {
    level = '非常舒适';
    levelCode = 1;
    description = '天气非常舒适，温度湿度适宜，心情愉悦';
  } else if (score >= 70) {
    level = '舒适';
    levelCode = 2;
    description = '天气舒适，整体感觉良好，适合户外活动';
  } else if (score >= 55) {
    level = '较舒适';
    levelCode = 3;
    description = '天气较舒适，部分人可能感觉稍热或稍冷';
  } else if (score >= 40) {
    level = '一般';
    levelCode = 4;
    description = '舒适度一般，可能感觉不太舒服，注意调节';
  } else {
    level = '不舒适';
    levelCode = 5;
    description = '天气不舒适，温度湿度不适宜，注意防范';
  }
  
  return {
    type: 'comfort',
    name: '舒适度',
    value: level,
    level,
    levelCode,
    description,
    updateTime: new Date().toISOString(),
  };
}

const indexCalculators: Record<LifeIndexType, (weather: WeatherDataForIndex, params: IndexParameter['parameters']) => LifeIndex> = {
  aqi: calculateAqi,
  pm25: calculatePm25,
  uv: calculateUv,
  feels_like: calculateFeelsLike,
  dressing: calculateDressing,
  car_wash: calculateCarWash,
  sports: calculateSports,
  cold: calculateCold,
  drying: calculateDrying,
  travel: calculateTravel,
  traffic: calculateTraffic,
  comfort: calculateComfort,
};

const defaultIndexNames: Record<LifeIndexType, string> = {
  aqi: '空气质量',
  pm25: 'PM2.5',
  uv: '紫外线',
  feels_like: '体感温度',
  dressing: '穿衣',
  car_wash: '洗车',
  sports: '运动',
  cold: '感冒',
  drying: '晾晒',
  travel: '旅游',
  traffic: '交通',
  comfort: '舒适度',
};

export const IndexService = {
  calculateAllIndices(cityId: string, weatherData: CurrentWeather): LifeIndex[] {
    const indices: LifeIndex[] = [];
    
    const weather: WeatherDataForIndex = {
      temperature: weatherData.temperature,
      humidity: weatherData.humidity,
      windSpeed: weatherData.windSpeed,
      weather: weatherData.weather,
      weatherCode: weatherData.weatherCode,
      precipitation: weatherData.precipitation,
      uvIndex: weatherData.uvIndex,
      visibility: weatherData.visibility,
      pressure: weatherData.pressure,
      feelsLike: weatherData.feelsLike,
    };
    
    const indexTypes: LifeIndexType[] = [
      'aqi', 'pm25', 'uv', 'feels_like', 'dressing', 'car_wash',
      'sports', 'cold', 'drying', 'travel', 'traffic', 'comfort'
    ];
    
    for (const type of indexTypes) {
      const param = getIndexParamFromDb(type);
      const params = param?.parameters || [];
      const calculator = indexCalculators[type];
      
      if (calculator) {
        const index = calculator(weather, params);
        indices.push(index);
      }
    }
    
    const now = new Date().toISOString();
    for (const index of indices) {
      db.prepare(`
        INSERT OR REPLACE INTO life_indices (city_id, index_type, index_name, value, level, level_code, description, update_time)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(cityId, index.type, index.name, String(index.value), index.level, index.levelCode, index.description, now);
    }
    
    return indices;
  },

  getIndexParameters(indexType: string): IndexParameter | null {
    return getIndexParamFromDb(indexType);
  },

  getAllIndexParameters(): IndexParameter[] {
    const params = db.prepare('SELECT * FROM index_parameters ORDER BY index_type').all() as any[];
    return params
      .map(p => {
        try {
          return {
            indexType: p.index_type,
            indexName: p.index_name,
            parameters: JSON.parse(p.parameters),
            version: p.version || 'v1.0',
            updateTime: p.update_time,
          } as IndexParameter;
        } catch {
          return null;
        }
      })
      .filter((p): p is IndexParameter => p !== null);
  },

  updateIndexParameter(indexType: string, params: IndexParameter['parameters']): IndexParameter | null {
    const existing = db.prepare('SELECT index_type FROM index_parameters WHERE index_type = ?').get(indexType) as any;
    const paramsJson = JSON.stringify(params);
    const now = new Date().toISOString();
    
    if (existing) {
      db.prepare(`
        UPDATE index_parameters 
        SET parameters = ?, update_time = ?
        WHERE index_type = ?
      `).run(paramsJson, now, indexType);
    } else {
      db.prepare(`
        INSERT INTO index_parameters (index_type, index_name, parameters, version, update_time)
        VALUES (?, ?, ?, 'v1.0', ?)
      `).run(indexType, defaultIndexNames[indexType as LifeIndexType] || indexType, paramsJson, now);
    }
    
    return getIndexParamFromDb(indexType);
  },

  getLifeIndicesByCity(cityId: string): LifeIndex[] {
    const indices = db.prepare(`
      SELECT * FROM life_indices 
      WHERE city_id = ? 
      ORDER BY update_time DESC
    `).all(cityId) as any[];
    
    return indices.map(i => ({
      type: i.index_type as LifeIndexType,
      name: i.index_name,
      value: i.value,
      level: i.level,
      levelCode: i.level_code,
      description: i.description,
      updateTime: i.update_time,
    }));
  },

  calculateSingleIndex(indexType: LifeIndexType, weatherData: CurrentWeather): LifeIndex | null {
    const calculator = indexCalculators[indexType];
    if (!calculator) return null;
    
    const param = getIndexParamFromDb(indexType);
    const params = param?.parameters || [];
    
    const weather: WeatherDataForIndex = {
      temperature: weatherData.temperature,
      humidity: weatherData.humidity,
      windSpeed: weatherData.windSpeed,
      weather: weatherData.weather,
      weatherCode: weatherData.weatherCode,
      precipitation: weatherData.precipitation,
      uvIndex: weatherData.uvIndex,
      visibility: weatherData.visibility,
      pressure: weatherData.pressure,
      feelsLike: weatherData.feelsLike,
    };
    
    return calculator(weather, params);
  },
};
