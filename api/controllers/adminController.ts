import { type Request, type Response } from 'express';
import db from '../db/index.js';
import type { ApiResponse, DashboardStats, Property, Ticket, CommissionRule } from '../types/index.js';

export const getDashboardStats = (req: Request, res: Response): void => {
  try {
    const totalProperties = db.prepare('SELECT COUNT(*) as count FROM properties').get() as { count: number };
    const availableProperties = db.prepare("SELECT COUNT(*) as count FROM properties WHERE status = 'available'").get() as { count: number };
    const soldProperties = db.prepare("SELECT COUNT(*) as count FROM properties WHERE status = 'sold'").get() as { count: number };

    const totalOrders = db.prepare('SELECT COUNT(*) as count FROM orders').get() as { count: number };
    const pendingOrders = db.prepare("SELECT COUNT(*) as count FROM orders WHERE status IN ('eligibility_pending', 'subscribed')").get() as { count: number };
    const completedOrders = db.prepare("SELECT COUNT(*) as count FROM orders WHERE status = 'completed'").get() as { count: number };

    const totalUsers = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'customer'").get() as { count: number };

    const totalRevenueRow = db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM orders WHERE status IN ('signed', 'fund_supervised', 'loan_pending', 'completed')").get() as { total: number };

    const pendingTickets = db.prepare("SELECT COUNT(*) as count FROM tickets WHERE status = 'pending'").get() as { count: number };

    const stats: DashboardStats = {
      totalProperties: totalProperties.count,
      availableProperties: availableProperties.count,
      soldProperties: soldProperties.count,
      totalOrders: totalOrders.count,
      pendingOrders: pendingOrders.count,
      completedOrders: completedOrders.count,
      totalUsers: totalUsers.count,
      totalRevenue: totalRevenueRow.total,
      pendingTickets: pendingTickets.count
    };

    res.json({
      code: 200,
      message: '获取成功',
      data: stats
    } as ApiResponse<DashboardStats>);
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '获取统计数据失败：' + (error as Error).message,
      data: null
    } as ApiResponse);
  }
};

export const getSalesTrend = (req: Request, res: Response): void => {
  try {
    const days = parseInt((req.query.days as string) || '30');

    const result = db.prepare(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as orders,
        COALESCE(SUM(amount), 0) as revenue
      FROM orders
      WHERE created_at >= DATE('now', ?)
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `).all(`-${days} days`) as any[];

    res.json({
      code: 200,
      message: '获取成功',
      data: result
    } as ApiResponse);
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '获取销售趋势失败：' + (error as Error).message,
      data: null
    } as ApiResponse);
  }
};

export const getTickets = (req: Request, res: Response): void => {
  try {
    const { status, riskLevel, page = 1, pageSize = 20 } = req.query;

    const pageNum = parseInt(page as string);
    const size = parseInt(pageSize as string);
    const offset = (pageNum - 1) * size;

    const where: string[] = [];
    const params: any[] = [];

    if (status) {
      where.push('t.status = ?');
      params.push(status);
    }
    if (riskLevel) {
      where.push('t.risk_level = ?');
      params.push(riskLevel);
    }

    const whereClause = where.length > 0 ? 'WHERE ' + where.join(' AND ') : '';

    const countSql = `SELECT COUNT(*) as total FROM tickets t ${whereClause}`;
    const totalRow = db.prepare(countSql).get(...params) as { total: number };

    const listSql = `
      SELECT t.*, 
             p.project_name, p.address, p.city,
             u.name as handler_name
      FROM tickets t
      LEFT JOIN properties p ON t.property_id = p.id
      LEFT JOIN users u ON t.handler_id = u.id
      ${whereClause}
      ORDER BY t.created_at DESC
      LIMIT ? OFFSET ?
    `;
    const tickets = db.prepare(listSql).all(...params, size, offset) as any[];

    res.json({
      code: 200,
      message: '获取成功',
      data: {
        list: tickets,
        total: totalRow.total,
        page: pageNum,
        pageSize: size
      }
    } as ApiResponse);
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '获取工单列表失败：' + (error as Error).message,
      data: null
    } as ApiResponse);
  }
};

export const processTicket = (req: Request, res: Response): void => {
  try {
    const handlerId = req.user?.userId;
    const { id } = req.params;
    const { status, note } = req.body;

    if (!status) {
      res.status(400).json({ code: 400, message: '请提供状态', data: null } as ApiResponse);
      return;
    }

    const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(id);
    if (!ticket) {
      res.status(404).json({ code: 404, message: '工单不存在', data: null } as ApiResponse);
      return;
    }

    db.prepare(`
      UPDATE tickets SET status = ?, handler_id = ? WHERE id = ?
    `).run(status, handlerId, id);

    const updatedTicket = db.prepare(`
      SELECT t.*, 
             p.project_name, p.address,
             u.name as handler_name
      FROM tickets t
      LEFT JOIN properties p ON t.property_id = p.id
      LEFT JOIN users u ON t.handler_id = u.id
      WHERE t.id = ?
    `).get(id);

    res.json({
      code: 200,
      message: '工单处理成功',
      data: updatedTicket
    } as ApiResponse);
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '处理工单失败：' + (error as Error).message,
      data: null
    } as ApiResponse);
  }
};

export const getProperties = (req: Request, res: Response): void => {
  try {
    const { page = 1, pageSize = 20, city, status } = req.query;

    const pageNum = parseInt(page as string);
    const size = parseInt(pageSize as string);
    const offset = (pageNum - 1) * size;

    const where: string[] = [];
    const params: any[] = [];

    if (city) {
      where.push('city = ?');
      params.push(city);
    }
    if (status) {
      where.push('status = ?');
      params.push(status);
    }

    const whereClause = where.length > 0 ? 'WHERE ' + where.join(' AND ') : '';

    const countSql = `SELECT COUNT(*) as total FROM properties ${whereClause}`;
    const totalRow = db.prepare(countSql).get(...params) as { total: number };

    const listSql = `SELECT * FROM properties ${whereClause} ORDER BY updated_at DESC LIMIT ? OFFSET ?`;
    const properties = db.prepare(listSql).all(...params, size, offset) as Property[];

    res.json({
      code: 200,
      message: '获取成功',
      data: {
        list: properties,
        total: totalRow.total,
        page: pageNum,
        pageSize: size
      }
    } as ApiResponse);
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '获取房源列表失败：' + (error as Error).message,
      data: null
    } as ApiResponse);
  }
};

export const createProperty = (req: Request, res: Response): void => {
  try {
    const {
      project_name, city, district, address, status = 'available',
      price, area, bedrooms, bathrooms, floor, orientation, decoration,
      discount = 100, promotion = '',
      vr_showroom_url = '', vr_sales_office_url = '', vr_panorama_url = '', vr_street_view_url = ''
    } = req.body;

    if (!project_name || !city || !district || !address || !price || !area || !bedrooms || !bathrooms) {
      res.status(400).json({ code: 400, message: '必填字段不能为空', data: null } as ApiResponse);
      return;
    }

    const result = db.prepare(`
      INSERT INTO properties (
        project_name, city, district, address, status, price, area,
        bedrooms, bathrooms, floor, orientation, decoration, discount,
        promotion, vr_showroom_url, vr_sales_office_url, vr_panorama_url, vr_street_view_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      project_name, city, district, address, status, price, area,
      bedrooms, bathrooms, floor, orientation, decoration, discount,
      promotion, vr_showroom_url, vr_sales_office_url, vr_panorama_url, vr_street_view_url
    );

    const property = db.prepare('SELECT * FROM properties WHERE id = ?').get(result.lastInsertRowid) as Property;

    res.status(201).json({
      code: 200,
      message: '创建成功',
      data: property
    } as ApiResponse<Property>);
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '创建房源失败：' + (error as Error).message,
      data: null
    } as ApiResponse);
  }
};

export const updateProperty = (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const {
      project_name, city, district, address, status,
      price, area, bedrooms, bathrooms, floor, orientation, decoration,
      discount, promotion,
      vr_showroom_url, vr_sales_office_url, vr_panorama_url, vr_street_view_url
    } = req.body;

    const property = db.prepare('SELECT * FROM properties WHERE id = ?').get(id);
    if (!property) {
      res.status(404).json({ code: 404, message: '房源不存在', data: null } as ApiResponse);
      return;
    }

    const fields: string[] = [];
    const params: any[] = [];

    if (project_name !== undefined) { fields.push('project_name = ?'); params.push(project_name); }
    if (city !== undefined) { fields.push('city = ?'); params.push(city); }
    if (district !== undefined) { fields.push('district = ?'); params.push(district); }
    if (address !== undefined) { fields.push('address = ?'); params.push(address); }
    if (status !== undefined) { fields.push('status = ?'); params.push(status); }
    if (price !== undefined) { fields.push('price = ?'); params.push(price); }
    if (area !== undefined) { fields.push('area = ?'); params.push(area); }
    if (bedrooms !== undefined) { fields.push('bedrooms = ?'); params.push(bedrooms); }
    if (bathrooms !== undefined) { fields.push('bathrooms = ?'); params.push(bathrooms); }
    if (floor !== undefined) { fields.push('floor = ?'); params.push(floor); }
    if (orientation !== undefined) { fields.push('orientation = ?'); params.push(orientation); }
    if (decoration !== undefined) { fields.push('decoration = ?'); params.push(decoration); }
    if (discount !== undefined) { fields.push('discount = ?'); params.push(discount); }
    if (promotion !== undefined) { fields.push('promotion = ?'); params.push(promotion); }
    if (vr_showroom_url !== undefined) { fields.push('vr_showroom_url = ?'); params.push(vr_showroom_url); }
    if (vr_sales_office_url !== undefined) { fields.push('vr_sales_office_url = ?'); params.push(vr_sales_office_url); }
    if (vr_panorama_url !== undefined) { fields.push('vr_panorama_url = ?'); params.push(vr_panorama_url); }
    if (vr_street_view_url !== undefined) { fields.push('vr_street_view_url = ?'); params.push(vr_street_view_url); }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    const sql = `UPDATE properties SET ${fields.join(', ')} WHERE id = ?`;
    db.prepare(sql).run(...params);

    const updatedProperty = db.prepare('SELECT * FROM properties WHERE id = ?').get(id) as Property;

    res.json({
      code: 200,
      message: '更新成功',
      data: updatedProperty
    } as ApiResponse<Property>);
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '更新房源失败：' + (error as Error).message,
      data: null
    } as ApiResponse);
  }
};

export const deleteProperty = (req: Request, res: Response): void => {
  try {
    const { id } = req.params;

    const property = db.prepare('SELECT * FROM properties WHERE id = ?').get(id);
    if (!property) {
      res.status(404).json({ code: 404, message: '房源不存在', data: null } as ApiResponse);
      return;
    }

    const tx = db.transaction(() => {
      db.prepare('DELETE FROM price_schedule WHERE property_id = ?').run(id);
      db.prepare('DELETE FROM promotions WHERE property_id = ?').run(id);
      db.prepare('DELETE FROM tickets WHERE property_id = ?').run(id);
      db.prepare('DELETE FROM chat_sessions WHERE property_id = ?').run(id);
      db.prepare(`
        DELETE FROM eligibility_checks WHERE property_id = ?
      `).run(id);
      db.prepare(`
        DELETE FROM orders WHERE property_id = ?
      `).run(id);
      db.prepare('DELETE FROM properties WHERE id = ?').run(id);
    });

    tx();

    res.json({
      code: 200,
      message: '删除成功',
      data: null
    } as ApiResponse);
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '删除房源失败：' + (error as Error).message,
      data: null
    } as ApiResponse);
  }
};

export const getCommissionRules = (req: Request, res: Response): void => {
  try {
    const rules = db.prepare('SELECT * FROM commission_rules ORDER BY city').all() as CommissionRule[];

    res.json({
      code: 200,
      message: '获取成功',
      data: rules
    } as ApiResponse<CommissionRule[]>);
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '获取分佣规则失败：' + (error as Error).message,
      data: null
    } as ApiResponse);
  }
};

export const updateCommissionRule = (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const { city, base_rate, bonus_rate, conditions } = req.body;

    const rule = db.prepare('SELECT * FROM commission_rules WHERE id = ?').get(id);
    if (!rule) {
      res.status(404).json({ code: 404, message: '规则不存在', data: null } as ApiResponse);
      return;
    }

    db.prepare(`
      UPDATE commission_rules 
      SET city = ?, base_rate = ?, bonus_rate = ?, conditions = ?
      WHERE id = ?
    `).run(city, base_rate, bonus_rate, conditions, id);

    const updatedRule = db.prepare('SELECT * FROM commission_rules WHERE id = ?').get(id) as CommissionRule;

    res.json({
      code: 200,
      message: '更新成功',
      data: updatedRule
    } as ApiResponse<CommissionRule>);
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '更新分佣规则失败：' + (error as Error).message,
      data: null
    } as ApiResponse);
  }
};

export const createCommissionRule = (req: Request, res: Response): void => {
  try {
    const { city, base_rate, bonus_rate = 0, conditions = '' } = req.body;

    if (!city || !base_rate) {
      res.status(400).json({ code: 400, message: '城市和基础佣金比例不能为空', data: null } as ApiResponse);
      return;
    }

    const existing = db.prepare('SELECT id FROM commission_rules WHERE city = ?').get(city);
    if (existing) {
      res.status(400).json({ code: 400, message: '该城市已有分佣规则', data: null } as ApiResponse);
      return;
    }

    const result = db.prepare(`
      INSERT INTO commission_rules (city, base_rate, bonus_rate, conditions)
      VALUES (?, ?, ?, ?)
    `).run(city, base_rate, bonus_rate, conditions);

    const rule = db.prepare('SELECT * FROM commission_rules WHERE id = ?').get(result.lastInsertRowid) as CommissionRule;

    res.status(201).json({
      code: 200,
      message: '创建成功',
      data: rule
    } as ApiResponse<CommissionRule>);
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '创建分佣规则失败：' + (error as Error).message,
      data: null
    } as ApiResponse);
  }
};

export const deleteCommissionRule = (req: Request, res: Response): void => {
  try {
    const { id } = req.params;

    const rule = db.prepare('SELECT * FROM commission_rules WHERE id = ?').get(id);
    if (!rule) {
      res.status(404).json({ code: 404, message: '规则不存在', data: null } as ApiResponse);
      return;
    }

    db.prepare('DELETE FROM commission_rules WHERE id = ?').run(id);

    res.json({
      code: 200,
      message: '删除成功',
      data: null
    } as ApiResponse);
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '删除分佣规则失败：' + (error as Error).message,
      data: null
    } as ApiResponse);
  }
};

export const getOrders = (req: Request, res: Response): void => {
  try {
    const { page = 1, pageSize = 20, status } = req.query;

    const pageNum = parseInt(page as string);
    const size = parseInt(pageSize as string);
    const offset = (pageNum - 1) * size;

    const where: string[] = [];
    const params: any[] = [];

    if (status) {
      where.push('o.status = ?');
      params.push(status);
    }

    const whereClause = where.length > 0 ? 'WHERE ' + where.join(' AND ') : '';

    const countSql = `SELECT COUNT(*) as total FROM orders o ${whereClause}`;
    const totalRow = db.prepare(countSql).get(...params) as { total: number };

    const listSql = `
      SELECT o.*, 
             p.project_name, p.address, p.city,
             u.name as user_name, u.phone as user_phone,
             a.name as advisor_name
      FROM orders o
      LEFT JOIN properties p ON o.property_id = p.id
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN users a ON o.advisor_id = a.id
      ${whereClause}
      ORDER BY o.created_at DESC
      LIMIT ? OFFSET ?
    `;
    const orders = db.prepare(listSql).all(...params, size, offset) as any[];

    const result = orders.map(o => ({
      ...o,
      ca_verified: o.ca_verified === 1 || o.ca_verified === true
    }));

    res.json({
      code: 200,
      message: '获取成功',
      data: {
        list: result,
        total: totalRow.total,
        page: pageNum,
        pageSize: size
      }
    } as ApiResponse);
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '获取订单列表失败：' + (error as Error).message,
      data: null
    } as ApiResponse);
  }
};

export const getUsers = (req: Request, res: Response): void => {
  try {
    const { page = 1, pageSize = 20, role, city } = req.query;

    const pageNum = parseInt(page as string);
    const size = parseInt(pageSize as string);
    const offset = (pageNum - 1) * size;

    const where: string[] = [];
    const params: any[] = [];

    if (role) {
      where.push('role = ?');
      params.push(role);
    }
    if (city) {
      where.push('city = ?');
      params.push(city);
    }

    const whereClause = where.length > 0 ? 'WHERE ' + where.join(' AND ') : '';

    const countSql = `SELECT COUNT(*) as total FROM users ${whereClause}`;
    const totalRow = db.prepare(countSql).get(...params) as { total: number };

    const listSql = `
      SELECT id, phone, name, role, city, tags, created_at
      FROM users ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;
    const users = db.prepare(listSql).all(...params, size, offset) as any[];

    const result = users.map(u => ({
      ...u,
      tags: u.tags ? JSON.parse(u.tags) : []
    }));

    res.json({
      code: 200,
      message: '获取成功',
      data: {
        list: result,
        total: totalRow.total,
        page: pageNum,
        pageSize: size
      }
    } as ApiResponse);
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '获取用户列表失败：' + (error as Error).message,
      data: null
    } as ApiResponse);
  }
};

export default {
  getDashboardStats,
  getSalesTrend,
  getTickets,
  processTicket,
  getProperties,
  createProperty,
  updateProperty,
  deleteProperty,
  getCommissionRules,
  createCommissionRule,
  updateCommissionRule,
  deleteCommissionRule,
  getOrders,
  getUsers
};
