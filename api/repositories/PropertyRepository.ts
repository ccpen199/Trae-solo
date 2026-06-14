import { v4 as uuidv4 } from 'uuid';
import { run, get, all } from '../data/database.js';
import type {
  Property,
  PropertyType,
  SearchFilters,
  MapBounds,
  MapSearchParams,
  MetroSearchParams,
  PropertyRight,
  SchoolDistrict,
  MetroInfo,
  Verification,
  Agent,
} from '../../shared/types.js';

interface PropertyRow {
  id: string;
  type: PropertyType;
  title: string;
  price: number;
  unit_price: number;
  area: number;
  rooms: number;
  halls: number;
  bathrooms: number;
  floor: string;
  orientation: string;
  decoration: string;
  build_year: number;
  address: string;
  district: string;
  city: string;
  lat: number;
  lng: number;
  description: string;
  owner_id: string;
  agent_id: string;
  publish_time: string;
  listing_weight: number;
}

interface PropertyRightRow {
  id: string;
  property_id: string;
  right_type: string;
  status: 'normal' | 'mortgaged' | 'sealed';
  ownership_years: number;
  is_five_years: number;
  is_only_one: number;
}

interface SchoolDistrictRow {
  id: string;
  property_id: string;
  name: string;
  level: 'primary' | 'middle' | 'high';
  quality: 'key' | 'ordinary';
  distance: number;
  enrollment_policy: string;
}

interface MetroInfoRow {
  id: string;
  property_id: string;
  nearest_station: string;
  line: string;
  distance: number;
  walk_time: number;
}

interface VerificationRow {
  id: string;
  property_id: string;
  owner_verified: number;
  agent_verified: number;
  anti_fraud_passed: number;
  verify_time: string;
  listing_days: number;
  decay_weight: number;
}

interface AgentRow {
  id: string;
  user_id: string;
  license_number: string;
  company: string;
  deal_count: number;
  rating: number;
  is_verified: number;
}

interface UserRow {
  id: string;
  phone: string;
  name: string;
  role: string;
  avatar: string;
  created_at: string;
}

interface ImageRow {
  id: string;
  property_id: string;
  url: string;
  type: string;
  sort_order: number;
}

function mapPropertyRow(row: PropertyRow): Omit<Property, 'images' | 'propertyRight' | 'schoolDistrict' | 'metroInfo' | 'verification' | 'agent' | 'tags'> {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    price: row.price,
    unitPrice: row.unit_price,
    area: row.area,
    rooms: row.rooms,
    halls: row.halls,
    bathrooms: row.bathrooms,
    floor: row.floor,
    orientation: row.orientation,
    decoration: row.decoration,
    buildYear: row.build_year,
    address: row.address,
    district: row.district,
    city: row.city,
    lat: row.lat,
    lng: row.lng,
    description: row.description,
    ownerId: row.owner_id,
    publishTime: row.publish_time,
    listingWeight: row.listing_weight,
  };
}

function mapPropertyRightRow(row: PropertyRightRow): PropertyRight {
  return {
    type: row.right_type,
    status: row.status,
    ownershipYears: row.ownership_years,
    isFiveYears: row.is_five_years === 1,
    isOnlyOne: row.is_only_one === 1,
  };
}

function mapSchoolDistrictRow(row: SchoolDistrictRow): SchoolDistrict {
  return {
    name: row.name,
    level: row.level,
    quality: row.quality,
    distance: row.distance,
    enrollmentPolicy: row.enrollment_policy,
  };
}

function mapMetroInfoRow(row: MetroInfoRow): MetroInfo {
  return {
    nearestStation: row.nearest_station,
    line: row.line,
    distance: row.distance,
    walkTime: row.walk_time,
  };
}

function mapVerificationRow(row: VerificationRow): Verification {
  return {
    ownerVerified: row.owner_verified === 1,
    agentVerified: row.agent_verified === 1,
    antiFraudPassed: row.anti_fraud_passed === 1,
    verifyTime: row.verify_time,
    listingDays: row.listing_days,
    decayWeight: row.decay_weight,
  };
}

function mapAgentRow(agentRow: AgentRow, userRow: UserRow): Agent {
  return {
    id: agentRow.id,
    name: userRow.name,
    phone: userRow.phone,
    company: agentRow.company,
    licenseNumber: agentRow.license_number,
    avatar: userRow.avatar,
    dealCount: agentRow.deal_count,
    rating: agentRow.rating,
    isVerified: agentRow.is_verified === 1,
  };
}

type PropertyRelations = {
  images: string[];
  propertyRight: PropertyRight;
  schoolDistrict?: SchoolDistrict;
  metroInfo?: MetroInfo;
  verification: Verification;
  agent?: Agent;
};

async function getPropertyRelations(propertyId: string): Promise<PropertyRelations> {
  const [images, rightRow, schoolRow, metroRow, verifyRow, agentRow] = await Promise.all([
    all<ImageRow>('SELECT url FROM property_images WHERE property_id = ? ORDER BY sort_order', [propertyId]),
    get<PropertyRightRow>('SELECT * FROM property_rights WHERE property_id = ?', [propertyId]),
    get<SchoolDistrictRow>('SELECT * FROM school_districts WHERE property_id = ?', [propertyId]),
    get<MetroInfoRow>('SELECT * FROM metro_infos WHERE property_id = ?', [propertyId]),
    get<VerificationRow>('SELECT * FROM verifications WHERE property_id = ?', [propertyId]),
    get<{ agent: AgentRow; user: UserRow }>(
      `SELECT a.*, u.* FROM agents a
       JOIN users u ON a.user_id = u.id
       WHERE a.id = (SELECT agent_id FROM properties WHERE id = ?)`,
      [propertyId]
    ),
  ]);

  const result: PropertyRelations = {
    images: images.map((img) => img.url),
    propertyRight: mapPropertyRightRow(rightRow!),
    verification: mapVerificationRow(verifyRow!),
  };

  if (schoolRow) {
    result.schoolDistrict = mapSchoolDistrictRow(schoolRow);
  }

  if (metroRow) {
    result.metroInfo = mapMetroInfoRow(metroRow);
  }

  if (agentRow && 'id' in agentRow) {
    result.agent = mapAgentRow(agentRow as unknown as AgentRow, agentRow as unknown as UserRow);
  }

  return result;
}

async function buildFullProperty(row: PropertyRow): Promise<Property> {
  const relations = await getPropertyRelations(row.id);
  return {
    ...mapPropertyRow(row),
    ...relations,
    tags: [],
  };
}

function buildFilterQuery(filters: SearchFilters): { query: string; params: unknown[] } {
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (filters.type) {
    conditions.push('p.type = ?');
    params.push(filters.type);
  }

  if (filters.priceMin !== undefined) {
    conditions.push('p.price >= ?');
    params.push(filters.priceMin);
  }

  if (filters.priceMax !== undefined) {
    conditions.push('p.price <= ?');
    params.push(filters.priceMax);
  }

  if (filters.areaMin !== undefined) {
    conditions.push('p.area >= ?');
    params.push(filters.areaMin);
  }

  if (filters.areaMax !== undefined) {
    conditions.push('p.area <= ?');
    params.push(filters.areaMax);
  }

  if (filters.rooms && filters.rooms.length > 0) {
    conditions.push(`p.rooms IN (${filters.rooms.map(() => '?').join(',')})`);
    params.push(...filters.rooms);
  }

  if (filters.orientation && filters.orientation.length > 0) {
    conditions.push(`p.orientation IN (${filters.orientation.map(() => '?').join(',')})`);
    params.push(...filters.orientation);
  }

  if (filters.decoration && filters.decoration.length > 0) {
    conditions.push(`p.decoration IN (${filters.decoration.map(() => '?').join(',')})`);
    params.push(...filters.decoration);
  }

  if (filters.district && filters.district.length > 0) {
    conditions.push(`p.district IN (${filters.district.map(() => '?').join(',')})`);
    params.push(...filters.district);
  }

  if (filters.nearMetro) {
    conditions.push('EXISTS (SELECT 1 FROM metro_infos m WHERE m.property_id = p.id)');
  }

  if (filters.schoolDistrict) {
    conditions.push('EXISTS (SELECT 1 FROM school_districts s WHERE s.property_id = p.id)');
  }

  if (filters.verifiedOnly) {
    conditions.push('v.owner_verified = 1 AND v.agent_verified = 1 AND v.anti_fraud_passed = 1');
  }

  let query = `
    SELECT DISTINCT p.*
    FROM properties p
    LEFT JOIN verifications v ON v.property_id = p.id
  `;

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  if (filters.sortBy) {
    const sortMap: Record<string, string> = {
      'price': 'p.price ASC',
      'price-desc': 'p.price DESC',
      'area': 'p.area DESC',
      'time': 'p.publish_time DESC',
      'weight': 'p.listing_weight DESC',
    };
    query += ' ORDER BY ' + (sortMap[filters.sortBy] || 'p.publish_time DESC');
  }

  return { query, params };
}

export const PropertyRepository = {
  async create(property: Omit<Property, 'id'>): Promise<Property> {
    const id = uuidv4();
    const now = new Date().toISOString();

    await run(
      `INSERT INTO properties (id, type, title, price, unit_price, area, rooms, halls, bathrooms, floor, orientation, decoration, build_year, address, district, city, lat, lng, description, owner_id, agent_id, publish_time, listing_weight) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        property.type,
        property.title,
        property.price,
        property.unitPrice,
        property.area,
        property.rooms,
        property.halls,
        property.bathrooms,
        property.floor,
        property.orientation,
        property.decoration,
        property.buildYear,
        property.address,
        property.district,
        property.city,
        property.lat,
        property.lng,
        property.description,
        property.ownerId,
        property.agent?.id,
        property.publishTime || now,
        property.listingWeight,
      ]
    );

    if (property.images && property.images.length > 0) {
      for (let i = 0; i < property.images.length; i++) {
        await run(
          'INSERT INTO property_images (id, property_id, url, type, sort_order) VALUES (?, ?, ?, ?, ?)',
          [uuidv4(), id, property.images[i], 'normal', i]
        );
      }
    }

    await run(
      'INSERT INTO property_rights (id, property_id, right_type, status, ownership_years, is_five_years, is_only_one) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        uuidv4(),
        id,
        property.propertyRight.type,
        property.propertyRight.status,
        property.propertyRight.ownershipYears,
        property.propertyRight.isFiveYears ? 1 : 0,
        property.propertyRight.isOnlyOne ? 1 : 0,
      ]
    );

    if (property.schoolDistrict) {
      await run(
        'INSERT INTO school_districts (id, property_id, name, level, quality, distance, enrollment_policy) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [
          uuidv4(),
          id,
          property.schoolDistrict.name,
          property.schoolDistrict.level,
          property.schoolDistrict.quality,
          property.schoolDistrict.distance,
          property.schoolDistrict.enrollmentPolicy,
        ]
      );
    }

    if (property.metroInfo) {
      await run(
        'INSERT INTO metro_infos (id, property_id, nearest_station, line, distance, walk_time) VALUES (?, ?, ?, ?, ?, ?)',
        [
          uuidv4(),
          id,
          property.metroInfo.nearestStation,
          property.metroInfo.line,
          property.metroInfo.distance,
          property.metroInfo.walkTime,
        ]
      );
    }

    await run(
      'INSERT INTO verifications (id, property_id, owner_verified, agent_verified, anti_fraud_passed, verify_time, listing_days, decay_weight) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [
        uuidv4(),
        id,
        property.verification.ownerVerified ? 1 : 0,
        property.verification.agentVerified ? 1 : 0,
        property.verification.antiFraudPassed ? 1 : 0,
        property.verification.verifyTime,
        property.verification.listingDays,
        property.verification.decayWeight,
      ]
    );

    const created = await this.findById(id);
    if (!created) {
      throw new Error('Failed to create property');
    }
    return created;
  },

  async findById(id: string): Promise<Property | undefined> {
    const row = await get<PropertyRow>('SELECT * FROM properties WHERE id = ?', [id]);
    if (!row) return undefined;
    return buildFullProperty(row);
  },

  async findAll(filters: SearchFilters = {}, limit = 50, offset = 0): Promise<Property[]> {
    const { query, params } = buildFilterQuery(filters);
    const limitedQuery = query + ' LIMIT ? OFFSET ?';
    const allParams = [...params, limit, offset];

    const rows = await all<PropertyRow>(limitedQuery, allParams);
    return Promise.all(rows.map((row) => buildFullProperty(row)));
  },

  async count(filters: SearchFilters = {}): Promise<number> {
    const { query, params } = buildFilterQuery(filters);
    const countQuery = query.replace('SELECT DISTINCT p.*', 'SELECT COUNT(DISTINCT p.id) as count');
    const result = await get<{ count: number }>(countQuery, params);
    return result?.count || 0;
  },

  async update(id: string, updates: Partial<Property>): Promise<Property | undefined> {
    const existing = await this.findById(id);
    if (!existing) return undefined;

    const fields: string[] = [];
    const params: unknown[] = [];

    const fieldMap: Record<keyof Property, string> = {
      id: 'id',
      type: 'type',
      title: 'title',
      price: 'price',
      unitPrice: 'unit_price',
      area: 'area',
      rooms: 'rooms',
      halls: 'halls',
      bathrooms: 'bathrooms',
      floor: 'floor',
      orientation: 'orientation',
      decoration: 'decoration',
      buildYear: 'build_year',
      address: 'address',
      district: 'district',
      city: 'city',
      lat: 'lat',
      lng: 'lng',
      images: 'images',
      vrUrl: 'vr_url',
      floorPlan: 'floor_plan',
      description: 'description',
      propertyRight: 'property_right',
      schoolDistrict: 'school_district',
      metroInfo: 'metro_info',
      verification: 'verification',
      agent: 'agent',
      ownerId: 'owner_id',
      publishTime: 'publish_time',
      listingWeight: 'listing_weight',
      tags: 'tags',
    };

    for (const [key, column] of Object.entries(fieldMap)) {
      if (updates[key as keyof Property] !== undefined) {
        fields.push(`${column} = ?`);
        params.push(updates[key as keyof Property]);
      }
    }

    if (fields.length > 0) {
      params.push(id);
      await run(`UPDATE properties SET ${fields.join(', ')} WHERE id = ?`, params);
    }

    return this.findById(id);
  },

  async delete(id: string): Promise<boolean> {
    const result = await run('DELETE FROM properties WHERE id = ?', [id]);
    return result.changes ? result.changes > 0 : false;
  },

  async searchByMapBounds(params: MapSearchParams): Promise<Property[]> {
    const { bounds, filters } = params;
    const { query, params: filterParams } = buildFilterQuery(filters);

    const locationCondition = 'p.lat >= ? AND p.lat <= ? AND p.lng >= ? AND p.lng <= ?';
    const locationParams = [
      bounds.southWest.lat,
      bounds.northEast.lat,
      bounds.southWest.lng,
      bounds.northEast.lng,
    ];

    let finalQuery = query;
    let finalParams = [...locationParams, ...filterParams];

    if (query.includes('WHERE')) {
      finalQuery = query.replace('WHERE', `WHERE ${locationCondition} AND`);
    } else {
      finalQuery = query + ` WHERE ${locationCondition}`;
    }

    const rows = await all<PropertyRow>(finalQuery, finalParams);
    return Promise.all(rows.map((row) => buildFullProperty(row)));
  },

  async searchByMetroStation(params: MetroSearchParams): Promise<Property[]> {
    const { stationName, radius, filters } = params;
    const { query, params: filterParams } = buildFilterQuery(filters);

    const earthRadius = 6371;
    const distanceCondition = `
      EXISTS (
        SELECT 1 FROM metro_infos m
        WHERE m.property_id = p.id
          AND m.nearest_station LIKE ?
          AND m.distance <= ?
      )
    `;

    let finalQuery = query;
    const stationParam = `%${stationName}%`;
    let finalParams = [stationParam, radius, ...filterParams];

    if (query.includes('WHERE')) {
      finalQuery = query.replace('WHERE', `WHERE ${distanceCondition} AND`);
    } else {
      finalQuery = query + ` WHERE ${distanceCondition}`;
    }

    const rows = await all<PropertyRow>(finalQuery, finalParams);
    const properties = await Promise.all(rows.map((row) => buildFullProperty(row)));

    return properties.sort((a, b) => {
      const distA = a.metroInfo?.distance || Infinity;
      const distB = b.metroInfo?.distance || Infinity;
      return distA - distB;
    });
  },

  async findByAgent(agentId: string): Promise<Property[]> {
    const rows = await all<PropertyRow>('SELECT * FROM properties WHERE agent_id = ? ORDER BY publish_time DESC', [agentId]);
    return Promise.all(rows.map((row) => buildFullProperty(row)));
  },

  async findByOwner(ownerId: string): Promise<Property[]> {
    const rows = await all<PropertyRow>('SELECT * FROM properties WHERE owner_id = ? ORDER BY publish_time DESC', [ownerId]);
    return Promise.all(rows.map((row) => buildFullProperty(row)));
  },
};
