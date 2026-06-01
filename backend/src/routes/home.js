const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateUser } = require('../middleware/auth');

const resolveCityCode = (regionCode) => {
  const region = db.prepare('SELECT code, name, level, parent_code FROM admin_regions WHERE code = ?').get(regionCode);
  if (!region) return null;

  if (region.level === 2) {
    return { cityCode: region.code, displayName: getCityDisplayName(region) };
  }

  if (region.level === 3) {
    if (region.parent_code) {
      const parent = db.prepare('SELECT code, name, parent_code FROM admin_regions WHERE code = ?').get(region.parent_code);
      if (parent) {
        return { cityCode: parent.code, displayName: getCityDisplayName(parent) };
      }
    }
    return null;
  }

  if (region.level === 1) {
    const child = db.prepare('SELECT code, name, parent_code FROM admin_regions WHERE parent_code = ? AND level = 2 LIMIT 1').get(region.code);
    if (child) {
      return { cityCode: child.code, displayName: getCityDisplayName(child) };
    }
  }

  return null;
};

const getCityDisplayName = (cityRegion) => {
  if (cityRegion.parent_code) {
    const parent = db.prepare('SELECT name FROM admin_regions WHERE code = ?').get(cityRegion.parent_code);
    if (parent) return parent.name;
  }
  return cityRegion.name;
};

const CITY_REGION_SUBQUERY = 'SELECT code FROM admin_regions WHERE parent_code = ? OR code = ?';

const getSortedServices = (cityCode, limit = 10) => {
  const cityRegion = db.prepare('SELECT code, name, poi_density FROM admin_regions WHERE code = ?').get(cityCode);
  if (!cityRegion) return { jobs: [], properties: [], used_cars: [], news: [], densityFactor: 0.5 };
  const densityFactor = (cityRegion.poi_density || 5000) / 10000;

  const jobs = db.prepare(`
    SELECT j.*, r.name as region_name, r.poi_density,
      (j.verified * 0.3 + (j.status = 1) * 0.2 + r.poi_density / 10000 * 0.5) as score
    FROM jobs j
    JOIN admin_regions r ON j.region_code = r.code
    WHERE r.code IN (${CITY_REGION_SUBQUERY}) AND j.status = 1
    ORDER BY score DESC
    LIMIT ?
  `).all(cityCode, cityCode, limit);

  const properties = db.prepare(`
    SELECT p.*, r.name as region_name, r.poi_density,
      (p.property_verified * 0.3 + p.landlord_id_verified * 0.2 + (p.status = 1) * 0.2 + r.poi_density / 10000 * 0.3) as score
    FROM properties p
    JOIN admin_regions r ON p.region_code = r.code
    WHERE r.code IN (${CITY_REGION_SUBQUERY}) AND p.status = 1
    ORDER BY score DESC
    LIMIT ?
  `).all(cityCode, cityCode, limit);

  const cars = db.prepare(`
    SELECT c.*, r.name as region_name, r.poi_density,
      (c.vin_verified * 0.3 + (c.status = 1) * 0.2 + r.poi_density / 10000 * 0.5) as score
    FROM used_cars c
    JOIN admin_regions r ON c.region_code = r.code
    WHERE r.code IN (${CITY_REGION_SUBQUERY}) AND c.status = 1
    ORDER BY score DESC
    LIMIT ?
  `).all(cityCode, cityCode, limit);

  const news = db.prepare(`
    SELECT n.*, r.name as region_name,
      (n.is_hot * 0.4 + n.views / 1000 * 0.3 + (n.status = 2) * 0.3) as score
    FROM news n
    LEFT JOIN admin_regions r ON n.region_code = r.code
    WHERE (n.region_code IN (${CITY_REGION_SUBQUERY}) OR n.region_code = '110000') AND n.status = 2
    ORDER BY score DESC
    LIMIT ?
  `).all(cityCode, cityCode, limit);

  return {
    jobs: jobs.map(j => ({ ...j, category: 'job' })),
    properties: properties.map(p => ({ ...p, category: p.type === 'rent' ? 'rent' : 'secondhand' })),
    used_cars: cars.map(c => ({ ...c, category: 'used_car' })),
    news: news.map(n => ({ ...n, category: 'news' })),
    densityFactor
  };
};

const getGlobalStats = (cityCode) => {
  const p = [cityCode, cityCode];
  const jobCount = db.prepare(`SELECT COUNT(*) as c FROM jobs WHERE status = 1 AND region_code IN (${CITY_REGION_SUBQUERY})`).get(...p).c;
  const rentCount = db.prepare(`SELECT COUNT(*) as c FROM properties WHERE status = 1 AND type = 'rent' AND region_code IN (${CITY_REGION_SUBQUERY})`).get(...p).c;
  const secondhandCount = db.prepare(`SELECT COUNT(*) as c FROM properties WHERE status = 1 AND type = 'secondhand' AND region_code IN (${CITY_REGION_SUBQUERY})`).get(...p).c;
  const carCount = db.prepare(`SELECT COUNT(*) as c FROM used_cars WHERE status = 1 AND region_code IN (${CITY_REGION_SUBQUERY})`).get(...p).c;
  const newsCount = db.prepare(`SELECT COUNT(*) as c FROM news WHERE status = 2 AND region_code IN (${CITY_REGION_SUBQUERY})`).get(...p).c;
  return {
    job_count: jobCount,
    rent_count: rentCount,
    secondhand_count: secondhandCount,
    used_car_count: carCount,
    news_count: newsCount
  };
};

router.get('/', authenticateUser, (req, res) => {
  const regionCode = req.user.region_code;
  const resolved = resolveCityCode(regionCode);
  if (!resolved) {
    return res.status(400).json({ error: '无法识别用户所在城市' });
  }
  const { cityCode, displayName } = resolved;
  const services = getSortedServices(cityCode);
  const allItems = [
    ...services.jobs,
    ...services.properties,
    ...services.used_cars,
    ...services.news
  ].sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, 20);
  const region = db.prepare('SELECT code, name, poi_density FROM admin_regions WHERE code = ?').get(regionCode);
  const globalStats = getGlobalStats(cityCode);
  res.json({
    region,
    userRegion: { code: regionCode, name: region?.name },
    cityRegion: { code: cityCode, name: displayName },
    densityFactor: services.densityFactor,
    recommended: allItems,
    stats: globalStats,
    categorized: services
  });
});

router.get('/guest/:regionCode', (req, res) => {
  const regionCode = req.params.regionCode;
  const resolved = resolveCityCode(regionCode);
  if (!resolved) {
    return res.status(404).json({ error: '区域不存在' });
  }
  const { cityCode, displayName } = resolved;
  const services = getSortedServices(cityCode);
  const allItems = [
    ...services.jobs,
    ...services.properties,
    ...services.used_cars,
    ...services.news
  ].sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, 20);
  const region = db.prepare('SELECT code, name, poi_density FROM admin_regions WHERE code = ?').get(regionCode);
  const globalStats = getGlobalStats(cityCode);
  res.json({
    region,
    userRegion: null,
    cityRegion: { code: cityCode, name: displayName },
    densityFactor: services.densityFactor,
    recommended: allItems,
    stats: globalStats,
    categorized: services
  });
});

module.exports = router;
