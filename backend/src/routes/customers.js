const express = require('express');
const db = require('../config/database');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const { logOperation } = require('../services/logService');
const { generateCustomerNo } = require('../utils/orderNoGenerator');

const router = express.Router();

router.get('/', authMiddleware, (req, res) => {
  try {
    const { 
      page = 1, 
      pageSize = 10, 
      keyword,
      categoryId,
      region,
      ownerId,
      myCustomers = false,
      subordinateCustomers = false
    } = req.query;

    let whereConditions = ['1=1'];
    let params = [];

    if (keyword) {
      whereConditions.push('(c.name LIKE ? OR c.phone LIKE ? OR c.customer_no LIKE ?)');
      const searchTerm = `%${keyword}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (categoryId) {
      whereConditions.push('c.category_id = ?');
      params.push(categoryId);
    }

    if (region) {
      whereConditions.push('(c.province LIKE ? OR c.city LIKE ? OR c.district LIKE ?)');
      const regionTerm = `%${region}%`;
      params.push(regionTerm, regionTerm, regionTerm);
    }

    if (myCustomers === 'true') {
      whereConditions.push('c.owner_id = ?');
      params.push(req.user.id);
    }

    if (subordinateCustomers === 'true' && !myCustomers) {
      whereConditions.push('c.owner_id IN (SELECT id FROM users WHERE manager_id = ?)');
      params.push(req.user.id);
    }

    if (ownerId) {
      whereConditions.push('c.owner_id = ?');
      params.push(ownerId);
    }

    const whereClause = whereConditions.join(' AND ');
    
    const countSql = `
      SELECT COUNT(*) as total 
      FROM customers c 
      WHERE ${whereClause}
    `;
    
    const listSql = `
      SELECT 
        c.*,
        cc.name as category_name,
        cc.code as category_code,
        u.name as owner_name,
        u.employee_id as owner_employee_id
      FROM customers c
      LEFT JOIN customer_categories cc ON c.category_id = cc.id
      LEFT JOIN users u ON c.owner_id = u.id
      WHERE ${whereClause}
      ORDER BY c.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const countResult = db.prepare(countSql).get(...params);
    const total = countResult.total;

    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    const list = db.prepare(listSql).all(...params, parseInt(pageSize), offset);

    res.json({
      success: true,
      data: {
        list,
        total,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    });
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({
      success: false,
      message: '获取客户列表失败',
      error: error.message
    });
  }
});

router.get('/:id', authMiddleware, (req, res) => {
  try {
    const { id } = req.params;

    const sql = `
      SELECT 
        c.*,
        cc.name as category_name,
        cc.code as category_code,
        u.name as owner_name,
        u.employee_id as owner_employee_id,
        d.name as owner_department_name
      FROM customers c
      LEFT JOIN customer_categories cc ON c.category_id = cc.id
      LEFT JOIN users u ON c.owner_id = u.id
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE c.id = ?
    `;

    const customer = db.prepare(sql).get(id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: '客户不存在'
      });
    }

    const orderCount = db.prepare(
      'SELECT COUNT(*) as count FROM orders WHERE customer_id = ?'
    ).get(id);

    const recentOrders = db.prepare(`
      SELECT 
        o.*,
        u.name as sales_name
      FROM orders o
      LEFT JOIN users u ON o.sales_id = u.id
      WHERE o.customer_id = ?
      ORDER BY o.created_at DESC
      LIMIT 10
    `).all(id);

    res.json({
      success: true,
      data: {
        ...customer,
        orderCount: orderCount.count,
        recentOrders
      }
    });
  } catch (error) {
    console.error('Get customer detail error:', error);
    res.status(500).json({
      success: false,
      message: '获取客户详情失败',
      error: error.message
    });
  }
});

router.post('/', authMiddleware, roleMiddleware('super_admin', 'sales'), (req, res) => {
  try {
    const {
      name,
      phone,
      telephone,
      email,
      address,
      province,
      city,
      district,
      categoryId,
      remark
    } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: '客户姓名不能为空'
      });
    }

    const customerNo = generateCustomerNo();

    const insertCustomer = db.prepare(`
      INSERT INTO customers 
      (customer_no, name, phone, telephone, email, address, province, city, district, category_id, owner_id, remark)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = insertCustomer.run(
      customerNo,
      name,
      phone,
      telephone,
      email,
      address,
      province,
      city,
      district,
      categoryId,
      req.user.id,
      remark
    );

    logOperation({
      user: req.user,
      module: '客户管理',
      action: '添加客户',
      targetType: 'customer',
      targetId: result.lastInsertRowid,
      detail: { name, phone, customerNo },
      ip: req.ip
    });

    res.json({
      success: true,
      message: '添加客户成功',
      data: {
        id: result.lastInsertRowid,
        customerNo
      }
    });
  } catch (error) {
    console.error('Add customer error:', error);
    res.status(500).json({
      success: false,
      message: '添加客户失败',
      error: error.message
    });
  }
});

router.put('/:id', authMiddleware, roleMiddleware('super_admin', 'sales'), (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      phone,
      telephone,
      email,
      address,
      province,
      city,
      district,
      categoryId,
      remark,
      status
    } = req.body;

    const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: '客户不存在'
      });
    }

    if (req.user.roleCode !== 'super_admin' && customer.owner_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: '只能修改自己的客户'
      });
    }

    const updateFields = [];
    const updateValues = [];

    if (name !== undefined) { updateFields.push('name = ?'); updateValues.push(name); }
    if (phone !== undefined) { updateFields.push('phone = ?'); updateValues.push(phone); }
    if (telephone !== undefined) { updateFields.push('telephone = ?'); updateValues.push(telephone); }
    if (email !== undefined) { updateFields.push('email = ?'); updateValues.push(email); }
    if (address !== undefined) { updateFields.push('address = ?'); updateValues.push(address); }
    if (province !== undefined) { updateFields.push('province = ?'); updateValues.push(province); }
    if (city !== undefined) { updateFields.push('city = ?'); updateValues.push(city); }
    if (district !== undefined) { updateFields.push('district = ?'); updateValues.push(district); }
    if (categoryId !== undefined) { updateFields.push('category_id = ?'); updateValues.push(categoryId); }
    if (remark !== undefined) { updateFields.push('remark = ?'); updateValues.push(remark); }
    if (status !== undefined) { updateFields.push('status = ?'); updateValues.push(status); }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: '没有需要更新的字段'
      });
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    updateValues.push(id);

    const sql = `UPDATE customers SET ${updateFields.join(', ')} WHERE id = ?`;
    db.prepare(sql).run(...updateValues);

    logOperation({
      user: req.user,
      module: '客户管理',
      action: '修改客户',
      targetType: 'customer',
      targetId: id,
      detail: { updateFields },
      ip: req.ip
    });

    res.json({
      success: true,
      message: '更新客户成功'
    });
  } catch (error) {
    console.error('Update customer error:', error);
    res.status(500).json({
      success: false,
      message: '更新客户失败',
      error: error.message
    });
  }
});

router.delete('/:id', authMiddleware, roleMiddleware('super_admin'), (req, res) => {
  try {
    const { id } = req.params;

    const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: '客户不存在'
      });
    }

    const orderCount = db.prepare(
      'SELECT COUNT(*) as count FROM orders WHERE customer_id = ?'
    ).get(id);

    if (orderCount.count > 0) {
      return res.status(400).json({
        success: false,
        message: '该客户存在订单，无法删除'
      });
    }

    db.prepare('DELETE FROM customers WHERE id = ?').run(id);

    logOperation({
      user: req.user,
      module: '客户管理',
      action: '删除客户',
      targetType: 'customer',
      targetId: id,
      detail: { name: customer.name, customerNo: customer.customer_no },
      ip: req.ip
    });

    res.json({
      success: true,
      message: '删除客户成功'
    });
  } catch (error) {
    console.error('Delete customer error:', error);
    res.status(500).json({
      success: false,
      message: '删除客户失败',
      error: error.message
    });
  }
});

router.post('/:id/follow', authMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: '客户不存在'
      });
    }

    db.prepare(`
      UPDATE customers SET last_follow_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(id);

    logOperation({
      user: req.user,
      module: '客户管理',
      action: '跟进客户',
      targetType: 'customer',
      targetId: id,
      detail: { content },
      ip: req.ip
    });

    res.json({
      success: true,
      message: '跟进记录已保存'
    });
  } catch (error) {
    console.error('Follow customer error:', error);
    res.status(500).json({
      success: false,
      message: '跟进客户失败',
      error: error.message
    });
  }
});

module.exports = router;
