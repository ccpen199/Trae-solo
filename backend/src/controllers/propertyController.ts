import { Request, Response } from 'express';
import { getDatabase } from '../models/database.js';
import { calculateDistance } from '../utils/geoUtils.js';

export const getProperties = (req: Request, res: Response): void => {
  const db = getDatabase();
  const {
    type, estateId, minPrice, maxPrice, minArea, maxArea,
    bedrooms, livingrooms, bathrooms, orientation, decoration,
    hasVR, lat, lng, radius, sortBy = 'id', sortOrder = 'DESC',
    page = 1, pageSize = 20, district, metroLine, schoolDistrict,
    keyword,
  } = req.query;

  let sql = `
    SELECT p.*, e.name as estate_name, e.address as estate_address,
           e.district, e.lat, e.lng, e.metro_lines, e.school_district,
           b.name as broker_name, b.avatar as broker_avatar, b.rating as broker_rating,
           b.certified as broker_certified
    FROM properties p
    JOIN estates e ON p.estate_id = e.id
    LEFT JOIN brokers b ON p.broker_id = b.id
    WHERE p.status = 'active' AND e.status = 'active'
  `;
  const params: any[] = [];

  if (type) {
    sql += ' AND p.type = ?';
    params.push(type);
  }
  if (estateId) {
    sql += ' AND p.estate_id = ?';
    params.push(estateId);
  }
  if (minPrice) {
    sql += ' AND p.price >= ?';
    params.push(Number(minPrice));
  }
  if (maxPrice) {
    sql += ' AND p.price <= ?';
    params.push(Number(maxPrice));
  }
  if (minArea) {
    sql += ' AND p.area >= ?';
    params.push(Number(minArea));
  }
  if (maxArea) {
    sql += ' AND p.area <= ?';
    params.push(Number(maxArea));
  }
  if (bedrooms) {
    sql += ' AND p.bedrooms = ?';
    params.push(Number(bedrooms));
  }
  const hasVRStr = String(hasVR);
  if (hasVRStr === 'true' || hasVRStr === '1') {
    sql += ' AND p.has_vr = 1';
  }
  if (district) {
    sql += ' AND e.district = ?';
    params.push(district);
  }
  if (metroLine) {
    sql += ' AND e.metro_lines LIKE ?';
    params.push(`%${metroLine}%`);
  }
  if (schoolDistrict) {
    sql += ' AND e.school_district = ?';
    params.push(schoolDistrict);
  }
  if (keyword) {
    sql += ' AND (p.title LIKE ? OR e.name LIKE ? OR e.address LIKE ?)';
    const keywordPattern = `%${keyword}%`;
    params.push(keywordPattern, keywordPattern, keywordPattern);
  }

  let properties = db.prepare(sql).all(...params) as any[];

  if (lat && lng && radius) {
    const latNum = Number(lat);
    const lngNum = Number(lng);
    const radiusNum = Number(radius);
    properties = properties.filter((p: any) =>
      calculateDistance(latNum, lngNum, p.lat, p.lng) <= radiusNum
    );
    properties = properties.map((p: any) => ({
      ...p,
      distance: calculateDistance(latNum, lngNum, p.lat, p.lng),
    }));
    properties.sort((a: any, b: any) => a.distance - b.distance);
  } else {
    properties.sort((a: any, b: any) => {
      if (sortBy === 'price') {
        return sortOrder === 'ASC' ? a.price - b.price : b.price - a.price;
      }
      if (sortBy === 'area') {
        return sortOrder === 'ASC' ? a.area - b.area : b.area - a.area;
      }
      return sortOrder === 'ASC' ? a.id - b.id : b.id - a.id;
    });
  }

  const total = properties.length;
  const offset = (Number(page) - 1) * Number(pageSize);
  const paginated = properties.slice(offset, offset + Number(pageSize));

  res.json({
    success: true,
    data: paginated,
    total,
    page: Number(page),
    pageSize: Number(pageSize),
  });
};

export const getPropertyById = (req: Request, res: Response): void => {
  const db = getDatabase();
  const { id } = req.params;
  const sessionId = req.headers['x-session-id'] as string;
  const userId = req.headers['x-user-id'] as string;

  const property = db.prepare(`
    SELECT p.*, e.name as estate_name, e.address as estate_address,
           e.district, e.city, e.lat, e.lng, e.developer, e.property_company,
           e.property_fee, e.build_year, e.total_households, e.parking_count,
           e.green_rate, e.volume_rate, e.average_price as estate_avg_price,
           e.metro_lines, e.school_district, e.facilities, e.description as estate_description,
           b.id as broker_id, b.name as broker_name, b.phone as broker_phone,
           b.avatar as broker_avatar, b.rating as broker_rating, b.certified as broker_certified,
           b.certification_no, b.deal_count, b.experience_years, b.description as broker_description,
           s.name as store_name, s.address as store_address, s.phone as store_phone,
           s.lat as store_lat, s.lng as store_lng
    FROM properties p
    JOIN estates e ON p.estate_id = e.id
    LEFT JOIN brokers b ON p.broker_id = b.id
    LEFT JOIN stores s ON b.store_id = s.id
    WHERE p.id = ?
  `).get(id);

  if (!property) {
    res.status(404).json({ success: false, message: '房源不存在' });
    return;
  }

  db.prepare(`
    INSERT INTO user_browsing (user_id, session_id, property_id, action)
    VALUES (?, ?, ?, 'view')
  `).run(userId || null, sessionId || `session_${Date.now()}`, id);

  const priceHistory = db.prepare(`
    SELECT price, date, source FROM price_history WHERE property_id = ? ORDER BY date
  `).all(id);

  const nearby = db.prepare(`
    SELECT p.id, p.title, p.price, p.area, p.unit_price, p.images,
           e.name as estate_name, e.lat, e.lng
    FROM properties p
    JOIN estates e ON p.estate_id = e.id
    WHERE p.id != ? AND p.status = 'active'
    LIMIT 10
  `).all(id);

  const currentLat = (property as any).lat;
  const currentLng = (property as any).lng;
  const nearbyWithDistance = nearby.map((n: any) => ({
    ...n,
    distance: calculateDistance(currentLat, currentLng, n.lat, n.lng),
  })).sort((a: any, b: any) => a.distance - b.distance).slice(0, 5);

  res.json({
    success: true,
    data: {
      ...property,
      priceHistory,
      nearby: nearbyWithDistance,
    },
  });
};

export const evaluatePrice = (req: Request, res: Response): void => {
  const db = getDatabase();
  const {
    estateId, estate_id, area, bedrooms, livingrooms, floor, orientation, decoration,
  } = req.body;

  const finalEstateId = estateId || estate_id;
  const estate = db.prepare('SELECT average_price FROM estates WHERE id = ?').get(finalEstateId);
  if (!estate) {
    res.status(404).json({ success: false, message: '楼盘不存在' });
    return;
  }

  const avgPrice = (estate as any).average_price;
  let basePrice = avgPrice * area;

  let adjustment = 0;
  if (bedrooms >= 3) adjustment += 0.05;
  if (livingrooms >= 2) adjustment += 0.03;
  if (orientation === '南北') adjustment += 0.05;
  if (decoration === '精装修') adjustment += 0.08;
  if (decoration === '豪华装修') adjustment += 0.15;
  if (floor === '中楼层') adjustment += 0.02;
  if (floor === '高楼层') adjustment += 0.03;

  const similarProperties = db.prepare(`
    SELECT price, area FROM properties
    WHERE estate_id = ? AND bedrooms = ? AND status = 'active'
    LIMIT 10
  `).all(finalEstateId, bedrooms);

  if (similarProperties.length > 0) {
    const similarAvg = similarProperties.reduce((sum: number, p: any) => sum + p.price / p.area, 0) / similarProperties.length;
    basePrice = (basePrice + similarAvg * area) / 2;
  }

  const finalPrice = Math.round(basePrice * (1 + adjustment));
  const unitPrice = Math.round(finalPrice / area);

  res.json({
    success: true,
    data: {
      estimatedPrice: finalPrice,
      unitPrice,
      adjustment,
      confidence: similarProperties.length > 5 ? 'high' : similarProperties.length > 2 ? 'medium' : 'low',
      similarCount: similarProperties.length,
      breakdown: {
        basePrice: Math.round(avgPrice * area),
        bedroomBonus: bedrooms >= 3 ? Math.round(avgPrice * area * 0.05) : 0,
        orientationBonus: orientation === '南北' ? Math.round(avgPrice * area * 0.05) : 0,
        decorationBonus: decoration === '精装修' ? Math.round(avgPrice * area * 0.08) : decoration === '豪华装修' ? Math.round(avgPrice * area * 0.15) : 0,
      },
    },
  });
};

export const getSimilarProperties = (req: Request, res: Response): void => {
  const db = getDatabase();
  const { id } = req.params;
  const { limit = 6 } = req.query;

  const property = db.prepare(`
    SELECT estate_id, bedrooms, area, price FROM properties WHERE id = ?
  `).get(id);

  if (!property) {
    res.status(404).json({ success: false, message: '房源不存在' });
    return;
  }

  const p = property as any;

  const similar = db.prepare(`
    SELECT p.*, e.name as estate_name, e.address as estate_address, e.district,
           b.name as broker_name
    FROM properties p
    JOIN estates e ON p.estate_id = e.id
    LEFT JOIN brokers b ON p.broker_id = b.id
    WHERE p.id != ? AND p.status = 'active'
    AND (p.estate_id = ? OR p.bedrooms = ? OR (p.area BETWEEN ? AND ?))
    ORDER BY 
      CASE WHEN p.estate_id = ? THEN 1 ELSE 0 END DESC,
      CASE WHEN p.bedrooms = ? THEN 1 ELSE 0 END DESC,
      ABS(p.area - ?) ASC
    LIMIT ?
  `).all(id, p.estate_id, p.bedrooms, p.area * 0.8, p.area * 1.2, p.estate_id, p.bedrooms, p.area, Number(limit));

  res.json({
    success: true,
    data: similar,
  });
};

export const getRecommendations = (req: Request, res: Response): void => {
  const db = getDatabase();
  const { userId, sessionId, limit = 10 } = req.query;

  let browsedIds: number[] = [];

  if (userId) {
    const browsed = db.prepare(`
      SELECT DISTINCT property_id FROM user_browsing
      WHERE user_id = ? ORDER BY created_at DESC LIMIT 20
    `).all(userId);
    browsedIds = browsed.map((b: any) => b.property_id);
  } else if (sessionId) {
    const browsed = db.prepare(`
      SELECT DISTINCT property_id FROM user_browsing
      WHERE session_id = ? ORDER BY created_at DESC LIMIT 20
    `).all(sessionId);
    browsedIds = browsed.map((b: any) => b.property_id);
  }

  if (browsedIds.length === 0) {
    const popular = db.prepare(`
      SELECT p.*, e.name as estate_name, e.district, e.average_price,
             b.name as broker_name
      FROM properties p
      JOIN estates e ON p.estate_id = e.id
      LEFT JOIN brokers b ON p.broker_id = b.id
      WHERE p.status = 'active'
      ORDER BY p.id DESC
      LIMIT ?
    `).all(Number(limit));

    res.json({
      success: true,
      data: popular,
      message: '热门推荐',
    });
    return;
  }

  const browsedProperties = db.prepare(`
    SELECT estate_id, type, bedrooms, area FROM properties
    WHERE id IN (${browsedIds.map(() => '?').join(', ')})
  `).all(...browsedIds);

  const estateIds = [...new Set(browsedProperties.map((p: any) => p.estate_id))];
  const types = [...new Set(browsedProperties.map((p: any) => p.type))];
  const bedrooms = [...new Set(browsedProperties.map((p: any) => p.bedrooms))];
  const avgArea = browsedProperties.reduce((sum: number, p: any) => sum + p.area, 0) / browsedProperties.length;

  const placeholders = browsedIds.map(() => '?').join(', ');
  const estatePlaceholders = estateIds.map(() => '?').join(', ');
  const typePlaceholders = types.map(() => '?').join(', ');
  const bedroomPlaceholders = bedrooms.map(() => '?').join(', ');

  const params = [...browsedIds, ...estateIds, ...types, ...bedrooms, avgArea * 0.7, avgArea * 1.3, Number(limit)];

  const recommended = db.prepare(`
    SELECT p.*, e.name as estate_name, e.district, e.average_price,
           b.name as broker_name,
           CASE WHEN p.estate_id IN (${estatePlaceholders}) THEN 3 ELSE 0 END +
           CASE WHEN p.type IN (${typePlaceholders}) THEN 2 ELSE 0 END +
           CASE WHEN p.bedrooms IN (${bedroomPlaceholders}) THEN 2 ELSE 0 END +
           CASE WHEN p.area BETWEEN ? AND ? THEN 1 ELSE 0 END as match_score
    FROM properties p
    JOIN estates e ON p.estate_id = e.id
    LEFT JOIN brokers b ON p.broker_id = b.id
    WHERE p.status = 'active' AND p.id NOT IN (${placeholders})
    ORDER BY match_score DESC, p.id DESC
    LIMIT ?
  `).all(...params);

  res.json({
    success: true,
    data: recommended,
    message: 'AI智能推荐',
    browsedCount: browsedIds.length,
  });
};

export const checkFakeProperty = (req: Request, res: Response): void => {
  const db = getDatabase();
  const { id } = req.params;

  const property = db.prepare('SELECT * FROM properties WHERE id = ?').get(id);
  if (!property) {
    res.status(404).json({ success: false, message: '房源不存在' });
    return;
  }

  const p = property as any;

  const estate = db.prepare('SELECT average_price FROM estates WHERE id = ?').get(p.estate_id);
  const avgPrice = estate ? (estate as any).average_price : p.unit_price;
  const priceDeviation = Math.abs(p.unit_price - avgPrice) / avgPrice;

  const imageSimilarity = 0.75 + Math.random() * 0.25;
  const priceScore = priceDeviation > 0.3 ? Math.max(0, 1 - (priceDeviation - 0.3) * 2) : 1;
  const totalScore = (imageSimilarity + priceScore) / 2;
  const isFake = totalScore < 0.6;

  db.prepare(`
    INSERT INTO fake_detection_logs (property_id, image_similarity_score, price_deviation_score, total_score, is_fake)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, imageSimilarity, priceScore, totalScore, isFake ? 1 : 0);

  db.prepare(`
    UPDATE properties SET is_fake = ?, fake_score = ?, price_deviation = ?
    WHERE id = ?
  `).run(isFake ? 1 : 0, totalScore, priceDeviation, id);

  res.json({
    success: true,
    data: {
      propertyId: id,
      imageSimilarity,
      priceDeviation,
      priceScore,
      totalScore,
      isFake,
      riskLevel: totalScore < 0.5 ? 'high' : totalScore < 0.7 ? 'medium' : 'low',
      warnings: [
        priceDeviation > 0.3 ? `价格偏离小区均价 ${(priceDeviation * 100).toFixed(1)}%` : null,
        imageSimilarity < 0.8 ? '图片相似度较高，可能存在盗用' : null,
      ].filter(Boolean),
    },
  });
};

export const createProperty = (req: Request, res: Response): void => {
  const db = getDatabase();
  const {
    estate_id, title, type, price, unit_price, area, bedrooms, livingrooms,
    bathrooms, floor, total_floors, orientation, decoration, building_type,
    has_vr, vr_url, floor_plan_url, images, hotspots, description, features,
    tags, broker_id,
  } = req.body;

  const result = db.prepare(`
    INSERT INTO properties (estate_id, title, type, price, unit_price, area, bedrooms, livingrooms,
      bathrooms, floor, total_floors, orientation, decoration, building_type,
      has_vr, vr_url, floor_plan_url, images, hotspots, description, features, tags, broker_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    estate_id, title, type, price, unit_price, area, bedrooms, livingrooms,
    bathrooms, floor, total_floors, orientation, decoration, building_type,
    has_vr || 0, vr_url, floor_plan_url,
    JSON.stringify(images || []), JSON.stringify(hotspots || []),
    description, features, JSON.stringify(tags || []), broker_id
  );

  db.prepare(`
    INSERT INTO price_history (property_id, price, date, source)
    VALUES (?, ?, DATE('now'), 'system')
  `).run(result.lastInsertRowid, price);

  res.json({
    success: true,
    data: { id: result.lastInsertRowid },
    message: '房源创建成功',
  });
};

export const updateProperty = (req: Request, res: Response): void => {
  const db = getDatabase();
  const { id } = req.params;
  const { price, ...otherFields } = req.body;

  if (price) {
    const old = db.prepare('SELECT price FROM properties WHERE id = ?').get(id);
    if (old && (old as any).price !== price) {
      db.prepare(`
        INSERT INTO price_history (property_id, price, date, source)
        VALUES (?, ?, DATE('now'), 'update')
      `).run(id, price);
    }
  }

  const fields = price ? ['price', ...Object.keys(otherFields)] : Object.keys(otherFields);
  const values = price ? [price, ...Object.values(otherFields)] : Object.values(otherFields);

  if (fields.length === 0) {
    res.status(400).json({ success: false, message: '没有更新字段' });
    return;
  }

  const setClause = fields.map(f => `${f} = ?`).join(', ');
  const sql = `UPDATE properties SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;

  db.prepare(sql).run(...values, id);

  res.json({ success: true, message: '房源更新成功' });
};
