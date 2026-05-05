const express = require('express');
const db = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/customer-categories', authMiddleware, (req, res) => {
  try {
    const categories = db.prepare(`
      SELECT id, name, code, description, sort_order
      FROM customer_categories
      WHERE 1=1
      ORDER BY sort_order ASC, id ASC
    `).all();

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Get customer categories error:', error);
    res.status(500).json({
      success: false,
      message: '获取客户分类失败',
      error: error.message
    });
  }
});

router.get('/product-categories', authMiddleware, (req, res) => {
  try {
    const categories = db.prepare(`
      SELECT id, name, code, description, sort_order
      FROM product_categories
      WHERE 1=1
      ORDER BY sort_order ASC, id ASC
    `).all();

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Get product categories error:', error);
    res.status(500).json({
      success: false,
      message: '获取产品分类失败',
      error: error.message
    });
  }
});

router.get('/brands', authMiddleware, (req, res) => {
  try {
    const brands = db.prepare(`
      SELECT id, name, code, logo, description, status
      FROM brands
      WHERE status = 1
      ORDER BY name ASC
    `).all();

    res.json({
      success: true,
      data: brands
    });
  } catch (error) {
    console.error('Get brands error:', error);
    res.status(500).json({
      success: false,
      message: '获取品牌列表失败',
      error: error.message
    });
  }
});

router.get('/warehouses', authMiddleware, (req, res) => {
  try {
    const { active } = req.query;
    
    let sql = `
      SELECT 
        w.id, w.name, w.code, w.address, w.manager_id, w.capacity, w.description, w.status,
        u.name as manager_name
      FROM warehouses w
      LEFT JOIN users u ON w.manager_id = u.id
      WHERE 1=1
    `;
    let params = [];

    if (active === 'true' || active === true) {
      sql += ' AND w.status = 1';
    }

    sql += ' ORDER BY w.name ASC';

    const warehouses = db.prepare(sql).all(...params);

    res.json({
      success: true,
      data: warehouses
    });
  } catch (error) {
    console.error('Get warehouses error:', error);
    res.status(500).json({
      success: false,
      message: '获取仓库列表失败',
      error: error.message
    });
  }
});

router.get('/payment-methods', authMiddleware, (req, res) => {
  try {
    const methods = db.prepare(`
      SELECT id, name, code, description, status
      FROM payment_methods
      WHERE status = 1
      ORDER BY id ASC
    `).all();

    res.json({
      success: true,
      data: methods
    });
  } catch (error) {
    console.error('Get payment methods error:', error);
    res.status(500).json({
      success: false,
      message: '获取支付方式失败',
      error: error.message
    });
  }
});

router.get('/logistics-companies', authMiddleware, (req, res) => {
  try {
    const companies = db.prepare(`
      SELECT id, name, code, tracking_url, status
      FROM logistics_companies
      WHERE status = 1
      ORDER BY name ASC
    `).all();

    res.json({
      success: true,
      data: companies
    });
  } catch (error) {
    console.error('Get logistics companies error:', error);
    res.status(500).json({
      success: false,
      message: '获取物流公司失败',
      error: error.message
    });
  }
});

router.get('/departments', authMiddleware, (req, res) => {
  try {
    const departments = db.prepare(`
      SELECT d.id, d.name, d.code, d.parent_id, d.manager_id,
             m.name as manager_name
      FROM departments d
      LEFT JOIN users m ON d.manager_id = m.id
      ORDER BY d.id ASC
    `).all();

    res.json({
      success: true,
      data: departments
    });
  } catch (error) {
    console.error('Get departments error:', error);
    res.status(500).json({
      success: false,
      message: '获取部门列表失败',
      error: error.message
    });
  }
});

router.get('/users', authMiddleware, (req, res) => {
  try {
    const { roleCode, departmentId, keyword } = req.query;

    let whereConditions = ['1=1'];
    let params = [];

    if (roleCode) {
      whereConditions.push('r.code = ?');
      params.push(roleCode);
    }

    if (departmentId) {
      whereConditions.push('u.department_id = ?');
      params.push(departmentId);
    }

    if (keyword) {
      whereConditions.push('(u.name LIKE ? OR u.username LIKE ? OR u.employee_id LIKE ?)');
      const searchTerm = `%${keyword}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    const whereClause = whereConditions.join(' AND ');

    const users = db.prepare(`
      SELECT 
        u.id, u.username, u.name, u.employee_id, u.phone, u.email, u.status,
        r.id as role_id, r.name as role_name, r.code as role_code,
        d.id as department_id, d.name as department_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE ${whereClause}
      ORDER BY u.id ASC
    `).all(...params);

    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: '获取用户列表失败',
      error: error.message
    });
  }
});

router.get('/roles', authMiddleware, (req, res) => {
  try {
    const roles = db.prepare(`
      SELECT id, name, code, description
      FROM roles
      ORDER BY id ASC
    `).all();

    res.json({
      success: true,
      data: roles
    });
  } catch (error) {
    console.error('Get roles error:', error);
    res.status(500).json({
      success: false,
      message: '获取角色列表失败',
      error: error.message
    });
  }
});

module.exports = router;
