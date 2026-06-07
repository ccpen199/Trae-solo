/**
 * Property service - includes valuation model
 */
import db from '../db.js';
import type { Property } from '../../shared/types.js';

const DECORATION_INDEX: Record<string, number> = {
  rough: 0.85,
  simple: 1.0,
  medium: 1.08,
  luxury: 1.15
};

const COMMUNITY_AVG_PRICES: Record<string, number> = {
  '阳光花园': 46000,
  '绿城公寓': 11000,
  '中央公园': 42000,
  '保利香槟国际': 9500,
  '万科城市花园': 78000
};

function calcFloorCoefficient(floor: number, totalFloor: number): number {
  if (!totalFloor) return 1.0;
  const ratio = floor / totalFloor;
  if (ratio < 0.33) return 0.97;
  if (ratio > 0.8) return 0.98;
  return 1.03;
}

export function listProperties(filters: any, page = 1, limit = 20) {
  const where: string[] = [];
  const args: any[] = [];
  if (filters.type) { where.push('type = ?'); args.push(filters.type); }
  if (filters.status) { where.push('status = ?'); args.push(filters.status); }
  if (filters.community) { where.push('community LIKE ?'); args.push(`%${filters.community}%`); }
  if (filters.minPrice) { where.push('price >= ?'); args.push(filters.minPrice); }
  if (filters.maxPrice) { where.push('price <= ?'); args.push(filters.maxPrice); }
  const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';
  const count = (db.prepare(`SELECT COUNT(*) as c FROM properties ${whereClause}`).get(...args) as any).c;
  const offset = (page - 1) * limit;
  const list = db.prepare(`
    SELECT p.*,
           o.name as owner_name,
           a.name as agent_name,
           c.status as contract_status,
           c.sign_hash as contract_hash,
           c.signed_at as contract_signed_at,
           c.template_type as contract_type
    FROM properties p
    LEFT JOIN users o ON p.owner_id = o.id
    LEFT JOIN users a ON p.agent_id = a.id
    LEFT JOIN contracts c ON p.id = c.property_id
    ${whereClause}
    GROUP BY p.id
    ORDER BY p.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...args, limit, offset);
  return { list, total: count, page, limit };
}

export function getPropertyDetail(id: number) {
  const property = db.prepare(`
    SELECT p.*,
           o.name as owner_name, o.phone as owner_phone,
           a.name as agent_name, a.phone as agent_phone
    FROM properties p
    LEFT JOIN users o ON p.owner_id = o.id
    LEFT JOIN users a ON p.agent_id = a.id
    WHERE p.id = ?
  `).get(id) as any;
  if (!property) return null;
  const valuation = db.prepare('SELECT * FROM valuations WHERE property_id = ? ORDER BY created_at DESC LIMIT 1').get(id);
  const contract = db.prepare('SELECT * FROM contracts WHERE property_id = ? ORDER BY created_at DESC LIMIT 1').get(id);
  return { property, valuation, contract };
}

export function createProperty(data: any) {
  const info = db.prepare(`
    INSERT INTO properties (name, type, address, area, price, owner_id, agent_id, status, vr_url, floor_plan_json, floor, total_floor, decoration_level, community, rooms, halls, description)
    VALUES (@name, @type, @address, @area, @price, @owner_id, @agent_id, @status, @vr_url, @floor_plan_json, @floor, @total_floor, @decoration_level, @community, @rooms, @halls, @description)
  `).run({
    status: 'pending',
    ...data
  });
  return { id: Number(info.lastInsertRowid) };
}

export function updateProperty(id: number, data: any) {
  const fields = Object.keys(data).map(k => `${k} = @${k}`).join(', ');
  db.prepare(`UPDATE properties SET ${fields}, updated_at = datetime('now') WHERE id = @id`)
    .run({ ...data, id });
  return { updated: true };
}

export function deleteProperty(id: number) {
  db.prepare('DELETE FROM properties WHERE id = ?').run(id);
  return { success: true };
}

export function estimateValue(propertyId: number) {
  const prop = db.prepare('SELECT * FROM properties WHERE id = ?').get(propertyId) as Property;
  if (!prop) throw new Error('房源不存在');
  const communityAvg = COMMUNITY_AVG_PRICES[prop.community || ''] || 40000;
  const decorationIndex = DECORATION_INDEX[prop.decoration_level || 'simple'];
  const floorCoefficient = calcFloorCoefficient(prop.floor || 1, prop.total_floor || 10);
  const area = prop.area || 80;

  let basePrice: number;
  if (prop.type === 'second_hand') {
    basePrice = communityAvg * area;
  } else if (prop.type === 'apartment') {
    basePrice = communityAvg * area;
  } else {
    basePrice = communityAvg * area;
  }

  const estimated = Math.round(basePrice * decorationIndex * floorCoefficient);

  const info = db.prepare(`
    INSERT INTO valuations (property_id, base_price, decoration_index, floor_coefficient, community_avg, estimated_price)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(propertyId, basePrice, decorationIndex, floorCoefficient, communityAvg, estimated);

  return {
    id: Number(info.lastInsertRowid),
    basePrice,
    communityAvg,
    decorationIndex,
    floorCoefficient,
    estimatedPrice: estimated,
    area,
    unitPrice: Math.round(estimated / area),
    breakdown: {
      '小区均价': `${communityAvg.toLocaleString()} 元/㎡`,
      '面积': `${area} ㎡`,
      '基础总价': `${basePrice.toLocaleString()} 元`,
      '装修指数': `×${decorationIndex} (${prop.decoration_level || 'simple'})`,
      '楼层系数': `×${floorCoefficient.toFixed(2)}`,
      '智能估价': `${estimated.toLocaleString()} 元`
    }
  };
}

export function createContract(propertyId: number, templateType: string) {
  const prop = db.prepare('SELECT * FROM properties WHERE id = ?').get(propertyId) as any;
  if (!prop) throw new Error('房源不存在');
  const hash = '0x' + Array.from({ length: 64 }, () =>
    Math.floor(Math.random() * 16).toString(16)).join('');
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
  const info = db.prepare(`
    INSERT INTO contracts (property_id, owner_id, agent_id, template_type, sign_hash, status, signed_at)
    VALUES (?, ?, ?, ?, ?, 'signed', ?)
  `).run(propertyId, prop.owner_id, prop.agent_id, templateType, hash, now);
  db.prepare(`UPDATE properties SET status = 'contracted', updated_at = datetime('now') WHERE id = ?`).run(propertyId);
  return {
    id: Number(info.lastInsertRowid),
    signHash: hash,
    signedAt: now,
    templateType
  };
}
