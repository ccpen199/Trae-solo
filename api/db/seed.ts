import { db } from './database';

export function seedDatabase() {
  const cityCount = db.prepare('SELECT COUNT(*) as count FROM cities').get() as { count: number };
  if (cityCount.count > 0) return;

  const cities = [
    { id: '110000', name: '北京', province: '北京市', latitude: 39.9042, longitude: 116.4074, adcode: '110000' },
    { id: '310000', name: '上海', province: '上海市', latitude: 31.2304, longitude: 121.4737, adcode: '310000' },
    { id: '440100', name: '广州', province: '广东省', latitude: 23.1291, longitude: 113.2644, adcode: '440100' },
    { id: '440300', name: '深圳', province: '广东省', latitude: 22.5431, longitude: 114.0579, adcode: '440300' },
    { id: '330100', name: '杭州', province: '浙江省', latitude: 30.2741, longitude: 120.1551, adcode: '330100' },
    { id: '320100', name: '南京', province: '江苏省', latitude: 32.0603, longitude: 118.7969, adcode: '320100' },
    { id: '510100', name: '成都', province: '四川省', latitude: 30.5728, longitude: 104.0668, adcode: '510100' },
    { id: '420100', name: '武汉', province: '湖北省', latitude: 30.5928, longitude: 114.3055, adcode: '420100' },
    { id: '610100', name: '西安', province: '陕西省', latitude: 34.3416, longitude: 108.9398, adcode: '610100' },
    { id: '370100', name: '济南', province: '山东省', latitude: 36.6512, longitude: 117.1201, adcode: '370100' },
    { id: '210100', name: '沈阳', province: '辽宁省', latitude: 41.8057, longitude: 123.4315, adcode: '210100' },
    { id: '230100', name: '哈尔滨', province: '黑龙江省', latitude: 45.8038, longitude: 126.5350, adcode: '230100' },
  ];

  const insertCity = db.prepare(`
    INSERT INTO cities (id, name, province, country, latitude, longitude, adcode)
    VALUES (@id, @name, @province, '中国', @latitude, @longitude, @adcode)
  `);

  const tx = db.transaction(() => {
    for (const city of cities) {
      insertCity.run(city);
    }
  });
  tx();

  const dataSources = [
    { id: 'official-cma', name: '国家气象局API', type: 'official', status: 'online', uptime: 99.8, latency: 120, success_rate: 99.2, quality_score: 96, weight: 0.5 },
    { id: 'radar-satellite', name: '第三方雷达卫星源', type: 'radar', status: 'online', uptime: 99.5, latency: 200, success_rate: 98.5, quality_score: 92, weight: 0.3 },
    { id: 'iot-microstation', name: '城市微站IoT设备', type: 'iot', status: 'online', uptime: 98.9, latency: 80, success_rate: 97.8, quality_score: 88, weight: 0.2 },
  ];

  const insertSource = db.prepare(`
    INSERT INTO data_sources (id, name, type, status, uptime, latency, success_rate, quality_score, weight, last_update)
    VALUES (@id, @name, @type, @status, @uptime, @latency, @success_rate, @quality_score, @weight, DATETIME('now'))
  `);

  const tx2 = db.transaction(() => {
    for (const source of dataSources) {
      insertSource.run(source);
    }
  });
  tx2();

  const qualityRules = [
    { id: 'temp-range', name: '温度范围校验', field: 'temperature', operator: 'range', threshold: '[-40,50]', weight: 1.5, enabled: 1, description: '温度值必须在-40°C到50°C之间' },
    { id: 'humidity-range', name: '湿度范围校验', field: 'humidity', operator: 'range', threshold: '[0,100]', weight: 1.0, enabled: 1, description: '湿度值必须在0%到100%之间' },
    { id: 'wind-speed-max', name: '风速上限校验', field: 'windSpeed', operator: '<=', threshold: '100', weight: 1.2, enabled: 1, description: '风速不得超过100m/s' },
    { id: 'pressure-range', name: '气压范围校验', field: 'pressure', operator: 'range', threshold: '[900,1100]', weight: 1.0, enabled: 1, description: '气压必须在900hPa到1100hPa之间' },
    { id: 'precip-min', name: '降水量非负校验', field: 'precipitation', operator: '>=', threshold: '0', weight: 0.8, enabled: 1, description: '降水量不能为负数' },
  ];

  const insertRule = db.prepare(`
    INSERT INTO quality_rules (id, name, field, operator, threshold, weight, enabled, description)
    VALUES (@id, @name, @field, @operator, @threshold, @weight, @enabled, @description)
  `);

  const tx3 = db.transaction(() => {
    for (const rule of qualityRules) {
      insertRule.run(rule);
    }
  });
  tx3();

  const indexParams = [
    { index_type: 'aqi', index_name: '空气质量指数', parameters: JSON.stringify([
      { key: 'excellentMax', name: '优上限', value: 50, min: 0, max: 100, step: 5, unit: '', description: '空气质量优的上限值' },
      { key: 'goodMax', name: '良上限', value: 100, min: 50, max: 200, step: 5, unit: '', description: '空气质量良的上限值' },
      { key: 'lightMax', name: '轻度污染上限', value: 150, min: 100, max: 300, step: 5, unit: '', description: '轻度污染上限值' },
      { key: 'moderateMax', name: '中度污染上限', value: 200, min: 150, max: 400, step: 5, unit: '', description: '中度污染上限值' },
    ]), version: 'v1.0' },
    { index_type: 'uv', index_name: '紫外线指数', parameters: JSON.stringify([
      { key: 'weakMax', name: '弱上限', value: 2, min: 0, max: 5, step: 1, unit: '', description: '紫外线强度弱的上限' },
      { key: 'moderateMax', name: '中等上限', value: 5, min: 2, max: 8, step: 1, unit: '', description: '紫外线强度中等的上限' },
      { key: 'strongMax', name: '强上限', value: 7, min: 5, max: 10, step: 1, unit: '', description: '紫外线强度强的上限' },
      { key: 'veryStrongMax', name: '很强上限', value: 10, min: 7, max: 15, step: 1, unit: '', description: '紫外线强度很强的上限' },
    ]), version: 'v1.0' },
    { index_type: 'dressing', index_name: '穿衣指数', parameters: JSON.stringify([
      { key: 'hotThreshold', name: '炎热阈值', value: 28, min: 20, max: 35, step: 1, unit: '°C', description: '高于此温度为炎热天气' },
      { key: 'warmThreshold', name: '温暖阈值', value: 20, min: 15, max: 28, step: 1, unit: '°C', description: '高于此温度为温暖天气' },
      { key: 'coolThreshold', name: '凉爽阈值', value: 10, min: 0, max: 20, step: 1, unit: '°C', description: '高于此温度为凉爽天气' },
      { key: 'coldThreshold', name: '寒冷阈值', value: 0, min: -10, max: 10, step: 1, unit: '°C', description: '低于此温度为寒冷天气' },
    ]), version: 'v1.0' },
    { index_type: 'sports', index_name: '运动指数', parameters: JSON.stringify([
      { key: 'optimalTemp', name: '适宜温度', value: 20, min: 10, max: 30, step: 1, unit: '°C', description: '最适宜运动的温度' },
      { key: 'tempTolerance', name: '温度容差', value: 8, min: 2, max: 15, step: 1, unit: '°C', description: '适宜运动的温度偏差范围' },
      { key: 'maxWind', name: '最大风速', value: 5, min: 1, max: 15, step: 1, unit: '级', description: '适宜运动的最大风力' },
      { key: 'maxPrecip', name: '最大降水', value: 0.5, min: 0, max: 5, step: 0.1, unit: 'mm/h', description: '适宜运动的最大降水量' },
    ]), version: 'v1.0' },
  ];

  const insertIndexParam = db.prepare(`
    INSERT INTO index_parameters (index_type, index_name, parameters, version, update_time)
    VALUES (@index_type, @index_name, @parameters, @version, DATETIME('now'))
  `);

  const tx4 = db.transaction(() => {
    for (const param of indexParams) {
      insertIndexParam.run(param);
    }
  });
  tx4();

  const apiKeys = [
    { id: 'key-001', key_name: '默认测试密钥', api_key: 'weather-demo-api-key-2024', status: 'active', rate_limit: 10000 },
  ];

  const insertApiKey = db.prepare(`
    INSERT INTO api_keys (id, key_name, api_key, status, rate_limit, expires_at)
    VALUES (@id, @key_name, @api_key, @status, @rate_limit, DATETIME('now', '+1 year'))
  `);

  const tx5 = db.transaction(() => {
    for (const key of apiKeys) {
      insertApiKey.run(key);
    }
  });
  tx5();

  console.log('Database seeded successfully.');
}
