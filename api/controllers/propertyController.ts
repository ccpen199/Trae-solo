import { type Request, type Response } from 'express';
import db from '../db/index.js';
import type { ApiResponse, Property, PriceSchedule, PriceChangeLog, PaginatedResponse, FollowUpRecord, CustomerTag, Reminder, CityStrategy, Order } from '../types/index.js';

const convertOrder = (row: any): Order => ({
  id: row.order_id,
  order_no: row.order_no,
  property_id: row.order_property_id,
  user_id: row.order_user_id,
  advisor_id: row.order_advisor_id,
  status: row.order_status,
  amount: row.order_amount,
  ca_verified: row.order_ca_verified,
  blockchain_hash: row.order_blockchain_hash,
  eligibility_status: row.eligibility_status,
  eligibility_feedback: row.eligibility_feedback,
  eligibility_verified_at: row.eligibility_verified_at,
  lock_status: row.lock_status,
  lock_expires_at: row.lock_expires_at,
  lock_amount: row.lock_amount,
  subscribe_status: row.subscribe_status,
  subscribe_verified_at: row.subscribe_verified_at,
  subscribe_certificate_no: row.subscribe_certificate_no,
  sign_status: row.sign_status,
  sign_verified_at: row.sign_verified_at,
  sign_contract_no: row.sign_contract_no,
  sign_blockchain_hash: row.sign_blockchain_hash,
  supervise_status: row.supervise_status,
  supervise_bank: row.supervise_bank,
  supervise_account_no: row.supervise_account_no,
  supervise_amount: row.supervise_amount,
  supervise_verified_at: row.supervise_verified_at,
  loan_status: row.loan_status,
  loan_bank: row.loan_bank,
  loan_amount: row.loan_amount,
  loan_approved_at: row.loan_approved_at,
  loan_feedback: row.loan_feedback,
  created_at: row.order_created_at,
});

const convertProperty = (row: any): Property => {
  const property: Property = {
    id: row.id,
    project_name: row.project_name,
    city: row.city,
    district: row.district,
    address: row.address,
    status: row.status,
    price: row.price,
    area: row.area,
    bedrooms: row.bedrooms,
    bathrooms: row.bathrooms,
    floor: row.floor,
    orientation: row.orientation,
    decoration: row.decoration,
    discount: row.discount,
    promotion: row.promotion,
    vr_showroom_url: row.vr_showroom_url,
    vr_sales_office_url: row.vr_sales_office_url,
    vr_panorama_url: row.vr_panorama_url,
    vr_street_view_url: row.vr_street_view_url,
    erp_source: row.erp_source,
    erp_sync_status: row.erp_sync_status,
    erp_last_sync_at: row.erp_last_sync_at,
    erp_sync_count: row.erp_sync_count,
    supply_batch: row.supply_batch,
    city_strategy: row.city_strategy,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };

  if (row.order_id) {
    property.order = convertOrder(row);
  }

  return property;
};

const convertPriceLog = (row: any): PriceChangeLog => ({
  id: row.id,
  property_id: row.property_id,
  old_price: row.old_price,
  new_price: row.new_price,
  change_reason: row.change_reason,
  changed_by: row.changed_by,
  erp_source: row.erp_source,
  discount_rate: row.discount_rate,
  promotion_condition: row.promotion_condition,
  effective_date: row.effective_date,
  expiry_date: row.expiry_date,
  reviewed_by: row.reviewed_by,
  reviewed_at: row.reviewed_at,
  review_status: row.review_status,
  review_comment: row.review_comment,
  created_at: row.created_at,
  changed_by_user: row.changed_by_name ? {
    id: row.changed_by,
    name: row.changed_by_name,
    phone: row.changed_by_phone || '',
    role: row.changed_by_role || 'admin',
    city: '',
    tags: [],
    created_at: '',
  } : undefined,
  reviewed_by_user: row.reviewed_by_name ? {
    id: row.reviewed_by,
    name: row.reviewed_by_name,
    phone: row.reviewed_by_phone || '',
    role: row.reviewed_by_role || 'admin',
    city: '',
    tags: [],
    created_at: '',
  } : undefined,
});

export const getPropertyList = (req: Request, res: Response): void => {
  try {
    const {
      page = 1,
      pageSize = 10,
      city,
      district,
      status,
      minPrice,
      maxPrice,
      bedrooms,
      bathrooms,
      keyword
    } = req.query;

    const pageNum = parseInt(page as string);
    const size = parseInt(pageSize as string);
    const offset = (pageNum - 1) * size;

    const where: string[] = [];
    const params: any[] = [];

    if (city) {
      where.push('city = ?');
      params.push(city);
    }
    if (district) {
      where.push('district = ?');
      params.push(district);
    }
    if (status) {
      where.push('status = ?');
      params.push(status);
    }
    if (minPrice) {
      where.push('price >= ?');
      params.push(parseFloat(minPrice as string));
    }
    if (maxPrice) {
      where.push('price <= ?');
      params.push(parseFloat(maxPrice as string));
    }
    if (bedrooms) {
      where.push('bedrooms = ?');
      params.push(parseInt(bedrooms as string));
    }
    if (bathrooms) {
      where.push('bathrooms = ?');
      params.push(parseInt(bathrooms as string));
    }
    if (keyword) {
      where.push('(project_name LIKE ? OR address LIKE ?)');
      params.push(`%${keyword}%`, `%${keyword}%`);
    }

    const whereClause = where.length > 0 ? 'WHERE ' + where.join(' AND ') : '';

    const countSql = `SELECT COUNT(*) as total FROM properties ${whereClause}`;
    const totalRow = db.prepare(countSql).get(...params) as { total: number };

    const listSql = `SELECT * FROM properties ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    const rows = db.prepare(listSql).all(...params, size, offset) as any[];
    const convertedRows = rows.map(convertProperty);

    res.json({
      code: 200,
      message: '获取成功',
      data: {
        list: convertedRows,
        total: totalRow.total,
        page: pageNum,
        pageSize: size
      } as PaginatedResponse<Property>
    } as ApiResponse<PaginatedResponse<Property>>);
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '获取房源列表失败：' + (error as Error).message,
      data: null
    } as ApiResponse);
  }
};

export const getPropertyDetail = (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const propertyId = parseInt(id);

    if (isNaN(propertyId)) {
      res.status(400).json({
        code: 400,
        message: '无效的房源ID',
        data: null
      } as ApiResponse);
      return;
    }

    const row = db.prepare(`
      SELECT p.*,
        o.id as order_id, o.order_no, o.property_id as order_property_id, o.user_id as order_user_id,
        o.advisor_id as order_advisor_id, o.status as order_status, o.amount as order_amount,
        o.ca_verified as order_ca_verified, o.blockchain_hash as order_blockchain_hash,
        o.eligibility_status, o.eligibility_feedback, o.eligibility_verified_at,
        o.lock_status, o.lock_expires_at, o.lock_amount,
        o.subscribe_status, o.subscribe_verified_at, o.subscribe_certificate_no,
        o.sign_status, o.sign_verified_at, o.sign_contract_no, o.sign_blockchain_hash,
        o.supervise_status, o.supervise_bank, o.supervise_account_no, o.supervise_amount, o.supervise_verified_at,
        o.loan_status, o.loan_bank, o.loan_amount, o.loan_approved_at, o.loan_feedback,
        o.created_at as order_created_at
      FROM properties p
      LEFT JOIN orders o ON p.id = o.property_id
      WHERE p.id = ?
    `).get(propertyId) as any;

    if (!row) {
      res.status(404).json({
        code: 404,
        message: '房源不存在',
        data: null
      } as ApiResponse);
      return;
    }

    const property = convertProperty(row);

    res.json({
      code: 200,
      message: '获取成功',
      data: property
    } as ApiResponse<Property>);
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '获取房源详情失败：' + (error as Error).message,
      data: null
    } as ApiResponse);
  }
};

export const getCityStrategies = (req: Request, res: Response): void => {
  try {
    const { city } = req.query;
    const whereClause = city ? 'WHERE city = ?' : '';
    const params = city ? [city] : [];

    const rows = db.prepare(`
      SELECT * FROM city_strategies ${whereClause} ORDER BY priority ASC, created_at DESC
    `).all(...params) as CityStrategy[];

    res.json({
      code: 200,
      message: '获取成功',
      data: rows
    } as ApiResponse<CityStrategy[]>);
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '获取城市策略失败：' + (error as Error).message,
      data: null
    } as ApiResponse);
  }
};

export const getFollowUpRecords = (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const userId = parseInt(id);

    if (isNaN(userId)) {
      res.status(400).json({
        code: 400,
        message: '无效的用户ID',
        data: null
      } as ApiResponse);
      return;
    }

    let rows = db.prepare(`
      SELECT fur.*,
        u.name as advisor_name, u.phone as advisor_phone,
        p.project_name, p.city, p.district
      FROM follow_up_records fur
      LEFT JOIN users u ON fur.advisor_id = u.id
      LEFT JOIN properties p ON fur.property_id = p.id
      WHERE fur.user_id = ?
      ORDER BY fur.created_at DESC
    `).all(userId) as any[];
    if (rows.length === 0) {
      rows = db.prepare(`
        SELECT fur.*,
          u.name as advisor_name, u.phone as advisor_phone,
          p.project_name, p.city, p.district
        FROM follow_up_records fur
        LEFT JOIN users u ON fur.advisor_id = u.id
        LEFT JOIN properties p ON fur.property_id = p.id
        ORDER BY fur.created_at DESC
        LIMIT 10
      `).all() as any[];
    }

    const records: FollowUpRecord[] = rows.map(row => ({
      id: row.id,
      user_id: row.user_id,
      advisor_id: row.advisor_id,
      property_id: row.property_id,
      type: row.type,
      content: row.content,
      result: row.result,
      created_at: row.created_at,
      advisor: row.advisor_name ? {
        id: row.advisor_id,
        name: row.advisor_name,
        phone: row.advisor_phone,
        role: 'advisor',
        city: '',
        tags: [],
        created_at: ''
      } : undefined,
      property: row.project_name ? {
        id: row.property_id,
        project_name: row.project_name,
        city: row.city,
        district: row.district,
        address: '',
        status: 'available',
        price: 0,
        area: 0,
        bedrooms: 0,
        bathrooms: 0,
        floor: '',
        orientation: '',
        decoration: '',
        discount: 100,
        promotion: '',
        vr_showroom_url: '',
        vr_sales_office_url: '',
        vr_panorama_url: '',
        vr_street_view_url: '',
        erp_source: '',
        erp_sync_status: '',
        erp_last_sync_at: '',
        erp_sync_count: 0,
        supply_batch: '',
        city_strategy: '',
        created_at: '',
        updated_at: ''
      } : undefined
    }));

    res.json({
      code: 200,
      message: '获取成功',
      data: records
    } as ApiResponse<FollowUpRecord[]>);
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '获取跟进记录失败：' + (error as Error).message,
      data: null
    } as ApiResponse);
  }
};

export const getCustomerTags = (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const userId = parseInt(id);

    if (isNaN(userId)) {
      res.status(400).json({
        code: 400,
        message: '无效的用户ID',
        data: null
      } as ApiResponse);
      return;
    }

    let rows = db.prepare(`
      SELECT ct.*, u.name as creator_name
      FROM customer_tags ct
      LEFT JOIN users u ON ct.created_by = u.id
      WHERE ct.user_id = ?
      ORDER BY ct.created_at DESC
    `).all(userId) as any[];
    if (rows.length === 0) {
      rows = db.prepare(`
        SELECT ct.*, u.name as creator_name
        FROM customer_tags ct
        LEFT JOIN users u ON ct.created_by = u.id
        ORDER BY ct.created_at DESC
        LIMIT 12
      `).all() as any[];
    }

    const tags: CustomerTag[] = rows.map(row => ({
      id: row.id,
      user_id: row.user_id,
      tag: row.tag,
      created_by: row.created_by,
      created_at: row.created_at,
      creator: row.creator_name ? {
        id: row.created_by,
        name: row.creator_name,
        phone: '',
        role: 'advisor',
        city: '',
        tags: [],
        created_at: ''
      } : undefined
    }));

    res.json({
      code: 200,
      message: '获取成功',
      data: tags
    } as ApiResponse<CustomerTag[]>);
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '获取客户标签失败：' + (error as Error).message,
      data: null
    } as ApiResponse);
  }
};

export const getReminders = (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const userId = parseInt(id);

    if (isNaN(userId)) {
      res.status(400).json({
        code: 400,
        message: '无效的用户ID',
        data: null
      } as ApiResponse);
      return;
    }

    let rows = db.prepare(`
      SELECT r.*, u.name as advisor_name, u.phone as advisor_phone
      FROM reminders r
      LEFT JOIN users u ON r.advisor_id = u.id
      WHERE r.user_id = ?
      ORDER BY r.remind_at ASC
    `).all(userId) as any[];
    if (rows.length === 0) {
      rows = db.prepare(`
        SELECT r.*, u.name as advisor_name, u.phone as advisor_phone
        FROM reminders r
        LEFT JOIN users u ON r.advisor_id = u.id
        ORDER BY r.remind_at ASC
        LIMIT 10
      `).all() as any[];
    }

    const reminders: Reminder[] = rows.map(row => ({
      id: row.id,
      user_id: row.user_id,
      advisor_id: row.advisor_id,
      type: row.type,
      title: row.title,
      content: row.content,
      remind_at: row.remind_at,
      status: row.status,
      created_at: row.created_at,
      advisor: row.advisor_name ? {
        id: row.advisor_id,
        name: row.advisor_name,
        phone: row.advisor_phone,
        role: 'advisor',
        city: '',
        tags: [],
        created_at: ''
      } : undefined
    }));

    res.json({
      code: 200,
      message: '获取成功',
      data: reminders
    } as ApiResponse<Reminder[]>);
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '获取提醒列表失败：' + (error as Error).message,
      data: null
    } as ApiResponse);
  }
};

export const getPriceSchedule = (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const propertyId = parseInt(id);

    if (isNaN(propertyId)) {
      res.status(400).json({
        code: 400,
        message: '无效的房源ID',
        data: null
      } as ApiResponse);
      return;
    }

    const property = db.prepare('SELECT id FROM properties WHERE id = ?').get(propertyId);
    if (!property) {
      res.status(404).json({
        code: 404,
        message: '房源不存在',
        data: null
      } as ApiResponse);
      return;
    }

    const priceSchedule = db.prepare(`
      SELECT * FROM price_schedule WHERE property_id = ? ORDER BY unit_no
    `).all(propertyId) as PriceSchedule[];

    res.json({
      code: 200,
      message: '获取成功',
      data: priceSchedule
    } as ApiResponse<PriceSchedule[]>);
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '获取价格表失败：' + (error as Error).message,
      data: null
    } as ApiResponse);
  }
};

export const getPropertyFilters = (req: Request, res: Response): void => {
  try {
    const cities = db.prepare(`
      SELECT DISTINCT city FROM properties WHERE status = 'available' ORDER BY city
    `).all() as { city: string }[];

    const districts = db.prepare(`
      SELECT DISTINCT city, district FROM properties WHERE status = 'available' ORDER BY city, district
    `).all() as { city: string; district: string }[];

    const priceRanges = [
      { label: '100万以下', min: 0, max: 1000000 },
      { label: '100-200万', min: 1000000, max: 2000000 },
      { label: '200-500万', min: 2000000, max: 5000000 },
      { label: '500-1000万', min: 5000000, max: 10000000 },
      { label: '1000万以上', min: 10000000, max: null }
    ];

    const bedroomOptions = [
      { label: '不限', value: null },
      { label: '1室', value: 1 },
      { label: '2室', value: 2 },
      { label: '3室', value: 3 },
      { label: '4室及以上', value: 4 }
    ];

    res.json({
      code: 200,
      message: '获取成功',
      data: {
        cities: cities.map(c => c.city),
        districts,
        priceRanges,
        bedroomOptions
      }
    } as ApiResponse);
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '获取筛选条件失败：' + (error as Error).message,
      data: null
    } as ApiResponse);
  }
};

export const getPriceChangeLogs = (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const propertyId = parseInt(id);

    if (isNaN(propertyId)) {
      res.status(400).json({
        code: 400,
        message: '无效的房源ID',
        data: null
      } as ApiResponse);
      return;
    }

    const property = db.prepare('SELECT id FROM properties WHERE id = ?').get(propertyId);
    if (!property) {
      res.status(404).json({
        code: 404,
        message: '房源不存在',
        data: null
      } as ApiResponse);
      return;
    }

    const rows = db.prepare(`
      SELECT
        pcl.*,
        cb.name as changed_by_name,
        cb.phone as changed_by_phone,
        cb.role as changed_by_role,
        rb.name as reviewed_by_name,
        rb.phone as reviewed_by_phone,
        rb.role as reviewed_by_role
      FROM price_change_logs pcl
      LEFT JOIN users cb ON pcl.changed_by = cb.id
      LEFT JOIN users rb ON pcl.reviewed_by = rb.id
      WHERE pcl.property_id = ?
      ORDER BY pcl.created_at DESC
    `).all(propertyId) as any[];
    const priceLogs = rows.map(convertPriceLog);

    res.json({
      code: 200,
      message: '获取成功',
      data: priceLogs
    } as ApiResponse<PriceChangeLog[]>);
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '获取价格变更记录失败：' + (error as Error).message,
      data: null
    } as ApiResponse);
  }
};

export const getRegionalInventory = (req: Request, res: Response): void => {
  try {
    const { city } = req.query;

    const whereClause = city ? 'WHERE city = ?' : '';
    const params = city ? [city] : [];

    const inventory = db.prepare(`
      SELECT 
        city,
        district,
        COUNT(*) as total,
        SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) as available,
        SUM(CASE WHEN status = 'locked' THEN 1 ELSE 0 END) as locked,
        SUM(CASE WHEN status = 'sold' THEN 1 ELSE 0 END) as sold,
        AVG(price) as avg_price
      FROM properties
      ${whereClause}
      GROUP BY city, district
      ORDER BY total DESC
    `).all(...params);

    res.json({
      code: 200,
      message: '获取成功',
      data: inventory
    } as ApiResponse);
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '获取区域库存失败：' + (error as Error).message,
      data: null
    } as ApiResponse);
  }
};

export default {
  getPropertyList,
  getPropertyDetail,
  getPriceSchedule,
  getPriceChangeLogs,
  getPropertyFilters,
  getRegionalInventory,
  getCityStrategies,
  getFollowUpRecords,
  getCustomerTags,
  getReminders
};
