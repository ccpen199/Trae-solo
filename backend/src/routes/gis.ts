import { Router } from 'express';
import { db } from '../database';
import { authMiddleware } from '../middleware';
import { CityData, Store } from '../types';

const router = Router();

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

router.get('/cities', authMiddleware, (req, res) => {
  const { province, has_store } = req.query;
  let query = 'SELECT * FROM cities WHERE 1=1';
  const params: any[] = [];

  if (province) {
    query += ' AND province = ?';
    params.push(province);
  }
  if (has_store === 'true') {
    query += ' AND store_count > 0';
  }

  query += ' ORDER BY store_count DESC, name ASC';
  const cities = db.prepare(query).all(...params) as CityData[];

  const allCities = [
    '北京', '上海', '广州', '深圳', '杭州', '南京', '成都', '武汉', '西安', '重庆',
    '天津', '苏州', '郑州', '长沙', '青岛', '沈阳', '大连', '宁波', '厦门', '福州',
    '济南', '哈尔滨', '长春', '石家庄', '太原', '合肥', '南昌', '南宁', '昆明', '贵阳',
    '兰州', '银川', '西宁', '呼和浩特', '乌鲁木齐', '拉萨', '海口', '三亚', '珠海', '东莞',
    '佛山', '中山', '惠州', '温州', '泉州', '烟台', '潍坊', '淄博', '常州', '南通',
    '徐州', '无锡', '扬州', '镇江', '泰州', '淮安', '盐城', '连云港', '宿迁', '湖州',
    '嘉兴', '绍兴', '金华', '衢州', '舟山', '台州', '丽水', '芜湖', '蚌埠', '淮南',
    '马鞍山', '淮北', '铜陵', '安庆', '黄山', '滁州', '阜阳', '宿州', '六安', '亳州',
    '池州', '宣城', '赣州', '上饶', '九江', '吉安', '抚州', '宜春', '景德镇', '萍乡',
    '新余', '鹰潭', '淄博', '枣庄', '东营', '烟台', '潍坊', '济宁', '泰安', '威海', '日照',
    '临沂', '德州', '聊城', '滨州', '菏泽', '洛阳', '开封', '平顶山', '安阳', '鹤壁',
    '新乡', '焦作', '濮阳', '许昌', '漯河', '三门峡', '南阳', '商丘', '信阳', '周口', '驻马店',
    '株洲', '湘潭', '衡阳', '邵阳', '岳阳', '常德', '张家界', '益阳', '郴州', '永州',
    '怀化', '娄底', '江门', '湛江', '茂名', '肇庆', '惠州', '梅州', '汕尾', '河源',
    '阳江', '清远', '东莞', '中山', '潮州', '揭阳', '云浮', '柳州', '桂林', '梧州',
    '北海', '防城港', '钦州', '贵港', '玉林', '百色', '贺州', '河池', '来宾', '崇左',
    '绵阳', '自贡', '攀枝花', '泸州', '德阳', '广元', '遂宁', '内江', '乐山', '南充',
    '眉山', '宜宾', '广安', '达州', '雅安', '巴中', '资阳', '六盘水', '遵义', '安顺',
    '曲靖', '玉溪', '保山', '昭通', '丽江', '普洱', '临沧', '咸阳', '铜川', '宝鸡',
    '渭南', '延安', '汉中', '榆林', '安康', '商洛', '嘉峪关', '金昌', '白银', '天水',
    '武威', '张掖', '平凉', '酒泉', '庆阳', '定西', '陇南', '石嘴山', '吴忠', '固原',
    '中卫', '西宁', '海东', '包头', '乌海', '赤峰', '通辽', '鄂尔多斯', '呼伦贝尔', '巴彦淖尔',
    '乌兰察布', '昌吉', '博尔塔拉', '巴音郭楞', '阿克苏', '克孜勒苏', '喀什', '和田', '伊犁', '塔城',
    '阿勒泰', '日喀则', '昌都', '林芝', '山南', '那曲', '阿里'
  ];

  if (cities.length < 50) {
    const existingNames = new Set(cities.map(c => c.name));
    const missingCities = allCities.filter(c => !existingNames.has(c));
    for (const cityName of missingCities.slice(0, 100)) {
      const lat = 30 + Math.random() * 15;
      const lng = 105 + Math.random() * 20;
      db.prepare(`
        INSERT OR IGNORE INTO cities (id, name, province, longitude, latitude, store_count)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        `city-${cityName}`,
        cityName,
        '省份',
        lng,
        lat,
        Math.random() > 0.7 ? 1 : 0
      );
    }
  }

  const finalCities = db.prepare(query).all(...params);
  res.json(finalCities);
});

router.get('/stores/nearby', authMiddleware, (req, res) => {
  const { city, longitude, latitude, radius = 50 } = req.query;

  let stores: (Store & { distance: number })[] = [];

  if (city) {
    stores = db.prepare(`
      SELECT s.*, u.real_name as manager_name, u.phone as manager_phone, 0 as distance
      FROM stores s
      LEFT JOIN users u ON s.manager_id = u.id
      WHERE s.city = ? AND s.status = 'active'
      ORDER BY s.name
    `).all(city as string) as any[];
  } else if (longitude && latitude) {
    const allStores = db.prepare(`
      SELECT s.*, u.real_name as manager_name, u.phone as manager_phone
      FROM stores s
      LEFT JOIN users u ON s.manager_id = u.id
      WHERE s.status = 'active'
    `).all() as Store[];

    stores = allStores.map(store => ({
      ...store,
      distance: calculateDistance(
        parseFloat(latitude as string),
        parseFloat(longitude as string),
        store.latitude,
        store.longitude
      )
    })).filter(s => s.distance <= parseFloat(radius as string))
      .sort((a, b) => a.distance - b.distance);
  }

  res.json(stores);
});

router.get('/stores', authMiddleware, (req, res) => {
  const { city, status } = req.query;
  let query = `
    SELECT s.*, u.real_name as manager_name, u.phone as manager_phone
    FROM stores s
    LEFT JOIN users u ON s.manager_id = u.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (city) {
    query += ' AND s.city = ?';
    params.push(city);
  }
  if (status) {
    query += ' AND s.status = ?';
    params.push(status);
  }

  query += ' ORDER BY s.city, s.name';
  const stores = db.prepare(query).all(...params);
  res.json(stores);
});

router.get('/coverage', authMiddleware, (req, res) => {
  const coverage = db.prepare(`
    SELECT
      c.province,
      c.name as city,
      c.longitude,
      c.latitude,
      COUNT(s.id) as store_count,
      GROUP_CONCAT(s.name) as store_names,
      MAX(s.service_radius) as max_radius
    FROM cities c
    LEFT JOIN stores s ON c.name = s.city
    GROUP BY c.id
    HAVING store_count > 0
    ORDER BY store_count DESC
  `).all();

  res.json({
    total_cities: coverage.length,
    total_stores: coverage.reduce((sum, c) => sum + (c as any).store_count, 0),
    coverage
  });
});

export default router;
