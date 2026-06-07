import { Request, Response } from 'express';
import { getDatabase } from '../models/database.js';
import { calculateDistance, generateCommutePolygon } from '../utils/geoUtils.js';

const categoryMap: Record<string, string[]> = {
  school: ['大学', '小学', '中学', '学校'],
  hospital: ['医院'],
  mall: ['商场'],
  subway: ['地铁站'],
  park: ['公园'],
  landmark: ['景点'],
  education: ['大学', '小学', '中学', '学校'],
  shopping: ['商场'],
  metro: ['地铁站'],
};

export const getPOIs = (req: Request, res: Response): void => {
  const db = getDatabase();
  const { type, category, lat, lng, radius, limit = 100 } = req.query;

  let sql = 'SELECT * FROM pois WHERE 1=1';
  const params: any[] = [];

  if (type) {
    sql += ' AND type = ?';
    params.push(type);
  }
  if (category) {
    const catStr = String(category);
    const mappedCategories = categoryMap[catStr] || [catStr];
    const placeholders = mappedCategories.map(() => '?').join(',');
    sql += ` AND category IN (${placeholders})`;
    params.push(...mappedCategories);
  }

  let pois = db.prepare(sql).all(...params) as any[];

  if (lat && lng && radius) {
    const latNum = Number(lat);
    const lngNum = Number(lng);
    const radiusNum = Number(radius);
    pois = pois.filter((p: any) =>
      calculateDistance(latNum, lngNum, p.lat, p.lng) <= radiusNum
    );
    pois = pois.map((p: any) => ({
      ...p,
      distance: calculateDistance(latNum, lngNum, p.lat, p.lng),
    }));
    pois.sort((a: any, b: any) => a.distance - b.distance);
  }

  if (limit) {
    pois = pois.slice(0, Number(limit));
  }

  res.json({
    success: true,
    data: pois,
    total: pois.length,
  });
};

export const getMetroLines = (req: Request, res: Response): void => {
  const db = getDatabase();

  const lines = db.prepare(`
    SELECT ml.*, COUNT(DISTINCT e.id) as estate_count
    FROM metro_lines ml
    LEFT JOIN estates e ON e.metro_lines LIKE '%' || ml.line_name || '%'
    GROUP BY ml.id
    ORDER BY ml.id
  `).all();

  const result = lines.map((line: any) => ({
    ...line,
    stations: typeof line.stations === 'string' ? JSON.parse(line.stations) : line.stations,
  }));

  res.json({
    success: true,
    data: result,
  });
};

export const getSchoolDistricts = (req: Request, res: Response): void => {
  const db = getDatabase();
  const { type, level } = req.query;

  let sql = 'SELECT * FROM school_districts WHERE 1=1';
  const params: any[] = [];

  if (type) {
    sql += ' AND type = ?';
    params.push(type);
  }
  if (level) {
    sql += ' AND level = ?';
    params.push(level);
  }

  const schools = db.prepare(sql).all(...params);

  const result = schools.map((school: any) => ({
    ...school,
    boundary: typeof school.boundary === 'string' ? JSON.parse(school.boundary) : school.boundary,
  }));

  res.json({
    success: true,
    data: result,
  });
};

export const calculateCommute = (req: Request, res: Response): void => {
  const db = getDatabase();
  const { startLat, startLng, endLat, endLng, mode = 'driving' } = req.body;

  const distance = calculateDistance(
    Number(startLat),
    Number(startLng),
    Number(endLat),
    Number(endLng)
  );

  const trafficFactors: Record<string, number> = {
    driving: 1.2,
    transit: 1.5,
    walking: 3.0,
    cycling: 0.8,
  };

  const avgSpeeds: Record<string, number> = {
    driving: 30,
    transit: 25,
    walking: 5,
    cycling: 15,
  };

  const factor = trafficFactors[mode] || 1.0;
  const speed = avgSpeeds[mode] || 30;
  const time = (distance / speed) * 60 * factor;

  res.json({
    success: true,
    data: {
      distance: Math.round(distance * 1000),
      distanceKm: Math.round(distance * 100) / 100,
      timeMinutes: Math.round(time),
      mode,
      trafficFactor: factor,
    },
  });
};

export const getCommutePolygon = (req: Request, res: Response): void => {
  const { lat, lng, maxTime = 30 } = req.query;

  const polygon = generateCommutePolygon(
    Number(lat),
    Number(lng),
    Number(maxTime),
    36
  );

  const db = getDatabase();
  const estates = db.prepare(`
    SELECT e.*, COUNT(p.id) as property_count, MIN(p.price) as min_price
    FROM estates e
    LEFT JOIN properties p ON e.id = p.estate_id AND p.status = 'active'
    WHERE e.status = 'active'
    GROUP BY e.id
  `).all() as any[];

  const latNum = Number(lat);
  const lngNum = Number(lng);
  const maxTimeNum = Number(maxTime);
  const avgSpeed = 30;
  const maxRadius = (maxTimeNum / 60) * avgSpeed;

  const estatesInPolygon = estates
    .filter((e: any) => {
      const dist = calculateDistance(latNum, lngNum, e.lat, e.lng);
      return dist <= maxRadius;
    })
    .map((e: any) => ({
      ...e,
      distance: calculateDistance(latNum, lngNum, e.lat, e.lng),
      commuteTime: (calculateDistance(latNum, lngNum, e.lat, e.lng) / avgSpeed) * 60,
    }))
    .sort((a: any, b: any) => a.commuteTime - b.commuteTime);

  res.json({
    success: true,
    data: {
      polygon,
      center: [latNum, lngNum],
      maxTime: maxTimeNum,
      maxRadius,
      estates: estatesInPolygon,
    },
  });
};

export const getEstatesByMetro = (req: Request, res: Response): void => {
  const db = getDatabase();
  const { lineName, stationName } = req.query;

  let sql = `
    SELECT e.*, COUNT(p.id) as property_count, MIN(p.price) as min_price,
           GROUP_CONCAT(DISTINCT m.line_name) as metro_lines
    FROM estates e
    LEFT JOIN properties p ON e.id = p.estate_id AND p.status = 'active'
    LEFT JOIN metro_lines m ON e.metro_lines LIKE '%' || m.line_name || '%'
    WHERE e.status = 'active'
  `;
  const params: any[] = [];

  if (lineName) {
    sql += ' AND e.metro_lines LIKE ?';
    params.push(`%${lineName}%`);
  }

  sql += ' GROUP BY e.id HAVING metro_lines IS NOT NULL ORDER BY e.id DESC';

  const estates = db.prepare(sql).all(...params);

  const metroStations = db.prepare('SELECT * FROM pois WHERE type = ?').all('metro');

  res.json({
    success: true,
    data: {
      estates,
      metroStations,
    },
  });
};

export const getMapTiles = (req: Request, res: Response): void => {
  res.json({
    success: true,
    data: {
      tileProvider: 'OpenStreetMap',
      tileUrl: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '&copy; OpenStreetMap contributors',
      minZoom: 3,
      maxZoom: 19,
    },
  });
};

export const getNearbyEverything = (req: Request, res: Response): void => {
  const db = getDatabase();
  const { lat, lng, radius = 2 } = req.query;

  const latNum = Number(lat);
  const lngNum = Number(lng);
  const radiusNum = Number(radius);

  const [estates, pois, metroStations, schools, brokers] = db.transaction(() => {
    const e = db.prepare(`
      SELECT e.*, COUNT(p.id) as property_count, MIN(p.price) as min_price
      FROM estates e
      LEFT JOIN properties p ON e.id = p.estate_id AND p.status = 'active'
      WHERE e.status = 'active'
      GROUP BY e.id
    `).all() as any[];

    const p = db.prepare('SELECT * FROM pois').all() as any[];
    const m = db.prepare("SELECT * FROM pois WHERE type = 'metro'").all() as any[];
    const s = db.prepare('SELECT * FROM school_districts').all() as any[];
    const b = db.prepare(`
      SELECT b.*, s.name as store_name, s.address as store_address, s.lat as store_lat, s.lng as store_lng
      FROM brokers b
      LEFT JOIN stores s ON b.store_id = s.id
      WHERE b.certified = 1
    `).all() as any[];

    return [e, p, m, s, b];
  })();

  const filterByDistance = <T extends { lat: number; lng: number }>(items: T[]): (T & { distance: number })[] => {
    return items
      .filter(item => item.lat && item.lng)
      .map(item => ({
        ...item,
        distance: calculateDistance(latNum, lngNum, item.lat, item.lng),
      }))
      .filter(item => item.distance <= radiusNum)
      .sort((a, b) => a.distance - b.distance);
  };

  const filterByStoreDistance = <T extends { store_lat?: number; store_lng?: number }>(items: T[]): (T & { distance: number })[] => {
    return items
      .filter(item => item.store_lat && item.store_lng)
      .map(item => ({
        ...item,
        distance: calculateDistance(latNum, lngNum, item.store_lat!, item.store_lng!),
      }))
      .filter(item => item.distance <= radiusNum * 2)
      .sort((a, b) => a.distance - b.distance);
  };

  res.json({
    success: true,
    data: {
      center: { lat: latNum, lng: lngNum },
      radius: radiusNum,
      estates: filterByDistance(estates).slice(0, 20),
      pois: filterByDistance(pois).slice(0, 30),
      metroStations: filterByDistance(metroStations).slice(0, 10),
      schools: filterByDistance(schools).slice(0, 10),
      brokers: filterByStoreDistance(brokers).slice(0, 10),
    },
  });
};
