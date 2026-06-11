import { db } from '../db/database';
import type { WeatherAlert } from '../../shared/types';

interface AlertTypeInfo {
  type: string;
  typeCode: string;
  levels: { level: string; levelCode: number }[];
}

const alertTypes: AlertTypeInfo[] = [
  {
    type: '暴雨预警',
    typeCode: 'BAOYU',
    levels: [
      { level: '蓝色', levelCode: 1 },
      { level: '黄色', levelCode: 2 },
      { level: '橙色', levelCode: 3 },
      { level: '红色', levelCode: 4 },
    ],
  },
  {
    type: '台风预警',
    typeCode: 'TAIFENG',
    levels: [
      { level: '蓝色', levelCode: 1 },
      { level: '黄色', levelCode: 2 },
      { level: '橙色', levelCode: 3 },
      { level: '红色', levelCode: 4 },
    ],
  },
  {
    type: '高温预警',
    typeCode: 'GAOWEN',
    levels: [
      { level: '黄色', levelCode: 2 },
      { level: '橙色', levelCode: 3 },
      { level: '红色', levelCode: 4 },
    ],
  },
  {
    type: '寒潮预警',
    typeCode: 'HANCHAO',
    levels: [
      { level: '蓝色', levelCode: 1 },
      { level: '黄色', levelCode: 2 },
      { level: '橙色', levelCode: 3 },
    ],
  },
  {
    type: '大雾预警',
    typeCode: 'DAWU',
    levels: [
      { level: '黄色', levelCode: 2 },
      { level: '橙色', levelCode: 3 },
      { level: '红色', levelCode: 4 },
    ],
  },
  {
    type: '雷电预警',
    typeCode: 'LEIDIAN',
    levels: [
      { level: '黄色', levelCode: 2 },
      { level: '橙色', levelCode: 3 },
      { level: '红色', levelCode: 4 },
    ],
  },
  {
    type: '冰雹预警',
    typeCode: 'BINGBAO',
    levels: [
      { level: '橙色', levelCode: 3 },
      { level: '红色', levelCode: 4 },
    ],
  },
  {
    type: '霜冻预警',
    typeCode: 'SHUANGDONG',
    levels: [
      { level: '蓝色', levelCode: 1 },
      { level: '黄色', levelCode: 2 },
      { level: '橙色', levelCode: 3 },
    ],
  },
  {
    type: '大风预警',
    typeCode: 'DAFENG',
    levels: [
      { level: '蓝色', levelCode: 1 },
      { level: '黄色', levelCode: 2 },
      { level: '橙色', levelCode: 3 },
      { level: '红色', levelCode: 4 },
    ],
  },
  {
    type: '沙尘暴预警',
    typeCode: 'SHACHENBAO',
    levels: [
      { level: '黄色', levelCode: 2 },
      { level: '橙色', levelCode: 3 },
      { level: '红色', levelCode: 4 },
    ],
  },
  {
    type: '干旱预警',
    typeCode: 'GANHAN',
    levels: [
      { level: '黄色', levelCode: 2 },
      { level: '橙色', levelCode: 3 },
      { level: '红色', levelCode: 4 },
    ],
  },
  {
    type: '道路结冰预警',
    typeCode: 'DAOLUJIEBING',
    levels: [
      { level: '黄色', levelCode: 2 },
      { level: '橙色', levelCode: 3 },
      { level: '红色', levelCode: 4 },
    ],
  },
];

const defenseGuides: Record<string, string[]> = {
  BAOYU: [
    '政府及相关部门按照职责做好防暴雨准备工作',
    '学校、幼儿园采取适当措施，保证学生和幼儿安全',
    '驾驶人员应当注意道路积水和交通阻塞，确保安全',
    '检查城市、农田、鱼塘排水系统，做好排涝准备',
  ],
  TAIFENG: [
    '政府及相关部门按照职责做好防台风抢险应急工作',
    '相关水域水上作业和过往船舶应当回港避风，加固港口设施',
    '停止室内外大型集会和高空等户外危险作业',
    '加固或者拆除易被风吹动的搭建物，人员切勿随意外出',
  ],
  GAOWEN: [
    '有关部门和单位按照职责做好防暑降温准备工作',
    '午后尽量减少户外活动',
    '对老、弱、病、幼人群提供防暑降温指导',
    '高温条件下作业和白天需要长时间进行户外露天作业的人员应当采取必要的防护措施',
  ],
  HANCHAO: [
    '政府及有关部门按照职责做好防寒潮准备工作',
    '注意添衣保暖',
    '对热带作物、水产品采取一定的防护措施',
    '做好防风准备工作',
  ],
  DAWU: [
    '有关部门和单位按照职责做好防雾准备工作',
    '机场、高速公路、轮渡码头等单位加强交通管理，保障安全',
    '驾驶人员注意雾的变化，小心驾驶',
    '户外活动注意安全',
  ],
  LEIDIAN: [
    '政府及相关部门按照职责做好防雷工作',
    '密切关注天气，尽量避免户外活动',
    '不要在树下、电杆下、塔吊下避雨',
    '不要使用金属工具，不要接打手机',
  ],
  BINGBAO: [
    '政府及相关部门按照职责做好防冰雹的应急工作',
    '气象部门做好人工防雹作业准备并择机进行作业',
    '户外行人立即到安全的地方暂避',
    '驱赶家禽、牲畜进入有顶蓬的场所，妥善保护易受冰雹袭击的汽车等室外物品或者设备',
  ],
  SHUANGDONG: [
    '政府及农林主管部门按照职责做好防霜冻准备工作',
    '对农作物、蔬菜、花卉、瓜果、林业育种要采取一定的防护措施',
    '农村基层组织和农户要关注当地霜冻预警信息，以便采取措施加强防护',
  ],
  DAFENG: [
    '政府及相关部门按照职责做好防大风工作',
    '关好门窗，加固围板、棚架、广告牌等易被风吹动的搭建物',
    '行人注意尽量少骑自行车，刮风时不要在广告牌、临时搭建物等下面逗留',
    '有关部门和单位注意森林、草原等防火',
  ],
  SHACHENBAO: [
    '政府及相关部门按照职责做好防沙尘暴工作',
    '关好门窗，加固围板、棚架、广告牌等易被风吹动的搭建物',
    '人员要佩戴口罩、纱巾等防尘用品，以免沙尘对眼睛和呼吸道造成损伤',
    '呼吸道疾病患者、对风沙较敏感人员不要到室外活动',
  ],
  GANHAN: [
    '有关部门和单位按照职责做好防御干旱的应急工作',
    '有关部门启用应急备用水源，调度辖区内一切可用水源，优先保障城乡居民生活用水和牲畜饮水',
    '压减农业灌溉供水，压减工业供水量，限制生产用水',
    '限制非生产性高耗水及服务业用水，限制排放工业污水',
  ],
  DAOLUJIEBING: [
    '交通运输、公安等部门按照职责做好道路结冰应对准备工作',
    '驾驶人员应当注意路况，安全行驶',
    '行人外出尽量少骑自行车，注意防滑',
    '相关部门做好道路融冰除雪工作',
  ],
};

function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function getCityName(cityId: string): string {
  const city = db.prepare('SELECT name FROM cities WHERE id = ?').get(cityId) as any;
  return city?.name || '';
}

function mapDbAlertToWeatherAlert(dbAlert: any, cityName?: string): WeatherAlert {
  return {
    id: dbAlert.id,
    cityId: dbAlert.city_id,
    cityName: cityName || getCityName(dbAlert.city_id),
    type: dbAlert.type,
    typeCode: dbAlert.type_code || '',
    level: dbAlert.level,
    levelCode: dbAlert.level_code,
    title: dbAlert.title || '',
    content: dbAlert.content || '',
    defenseGuide: dbAlert.defense_guide || '',
    startTime: dbAlert.start_time || '',
    endTime: dbAlert.end_time || '',
    publishTime: dbAlert.publish_time || '',
    source: dbAlert.source || '国家气象局',
  };
}

export const AlertService = {
  getAlerts(cityId: string): WeatherAlert[] {
    const cityName = getCityName(cityId);
    if (!cityName) return [];
    
    const alerts = db.prepare(`
      SELECT * FROM weather_alerts 
      WHERE city_id = ? 
      AND end_time > DATETIME('now')
      ORDER BY level_code DESC, publish_time DESC
    `).all(cityId) as any[];
    
    if (alerts.length === 0) {
      return this.generateMockAlerts(cityId);
    }
    
    return alerts.map(a => mapDbAlertToWeatherAlert(a, cityName));
  },

  getAlertById(id: string): WeatherAlert | null {
    const alert = db.prepare('SELECT * FROM weather_alerts WHERE id = ?').get(id) as any;
    if (!alert) return null;
    return mapDbAlertToWeatherAlert(alert);
  },

  generateMockAlerts(cityId: string): WeatherAlert[] {
    const city = db.prepare('SELECT * FROM cities WHERE id = ?').get(cityId) as any;
    if (!city) return [];
    
    const now = new Date();
    const seedBase = city.latitude * 1000 + city.longitude * 10 + Math.floor(now.getTime() / 86400000);
    
    const alertCount = Math.floor(seededRandom(seedBase) * 3);
    
    if (alertCount === 0) {
      return [];
    }
    
    const alerts: WeatherAlert[] = [];
    const usedTypes = new Set<number>();
    
    for (let i = 0; i < alertCount; i++) {
      let typeIndex: number;
      do {
        typeIndex = Math.floor(seededRandom(seedBase + i * 100) * alertTypes.length);
      } while (usedTypes.has(typeIndex) && usedTypes.size < alertTypes.length);
      usedTypes.add(typeIndex);
      
      const alertType = alertTypes[typeIndex];
      const levelIndex = Math.floor(seededRandom(seedBase + i * 100 + 50) * alertType.levels.length);
      const level = alertType.levels[levelIndex];
      
      const startTime = new Date(now.getTime() + Math.floor(seededRandom(seedBase + i * 100 + 10) * 2) * 3600000);
      const durationHours = 6 + Math.floor(seededRandom(seedBase + i * 100 + 20) * 18);
      const endTime = new Date(startTime.getTime() + durationHours * 3600000);
      
      const alertId = `alert-${cityId}-${alertType.typeCode}-${level.levelCode}-${Math.floor(now.getTime() / 86400000)}`;
      
      const guides = defenseGuides[alertType.typeCode] || ['注意防范', '关注天气变化'];
      const defenseGuideText = guides.join('\n');
      
      const content = `预计${startTime.toLocaleString('zh-CN')}起，${city.name}地区将出现${level.level}${alertType.type}，请相关部门和市民注意防范。`;
      
      const alert: WeatherAlert = {
        id: alertId,
        cityId: city.id,
        cityName: city.name,
        type: alertType.type,
        typeCode: alertType.typeCode,
        level: level.level,
        levelCode: level.levelCode,
        title: `${city.name}发布${level.level}${alertType.type}信号`,
        content,
        defenseGuide: defenseGuideText,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        publishTime: now.toISOString(),
        source: '国家气象局',
      };
      
      alerts.push(alert);
      
      db.prepare(`
        INSERT OR REPLACE INTO weather_alerts 
        (id, city_id, type, type_code, level, level_code, title, content, defense_guide, start_time, end_time, publish_time, source)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        alert.id,
        alert.cityId,
        alert.type,
        alert.typeCode,
        alert.level,
        alert.levelCode,
        alert.title,
        alert.content,
        alert.defenseGuide,
        alert.startTime,
        alert.endTime,
        alert.publishTime,
        alert.source
      );
    }
    
    return alerts.sort((a, b) => b.levelCode - a.levelCode);
  },

  getAllActiveAlerts(): WeatherAlert[] {
    const alerts = db.prepare(`
      SELECT wa.*, c.name as city_name
      FROM weather_alerts wa
      JOIN cities c ON wa.city_id = c.id
      WHERE wa.end_time > DATETIME('now')
      ORDER BY wa.level_code DESC, wa.publish_time DESC
    `).all() as any[];
    
    return alerts.map(a => ({
      ...mapDbAlertToWeatherAlert(a, a.city_name),
    }));
  },

  createAlert(alert: Omit<WeatherAlert, 'id' | 'publishTime'> & { id?: string }): WeatherAlert {
    const alertId = alert.id || `alert-${Date.now()}`;
    const now = new Date().toISOString();
    
    db.prepare(`
      INSERT INTO weather_alerts 
      (id, city_id, type, type_code, level, level_code, title, content, defense_guide, start_time, end_time, publish_time, source)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      alertId,
      alert.cityId,
      alert.type,
      alert.typeCode,
      alert.level,
      alert.levelCode,
      alert.title,
      alert.content,
      alert.defenseGuide,
      alert.startTime,
      alert.endTime,
      now,
      alert.source || '管理员发布'
    );
    
    const result = this.getAlertById(alertId);
    return result!;
  },

  dismissAlert(alertId: string): boolean {
    const result = db.prepare(`
      UPDATE weather_alerts 
      SET end_time = DATETIME('now')
      WHERE id = ?
    `).run(alertId);
    return result.changes > 0;
  },

  deleteAlert(alertId: string): boolean {
    const result = db.prepare('DELETE FROM weather_alerts WHERE id = ?').run(alertId);
    return result.changes > 0;
  },

  getAlertLevels(): { type: string; typeCode: string; levels: { level: string; levelCode: number }[] }[] {
    return alertTypes;
  },
};
