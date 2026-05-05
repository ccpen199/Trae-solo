const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const { User, Order, OrderItem, Product } = require('../models');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// 用户管理

// 获取用户列表
router.get(
  '/users',
  authenticate,
  requireAdmin,
  [
    query('page').optional().isInt({ min: 1 }).withMessage('页码必须大于 0'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('每页数量必须在 1-100 之间'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: '验证失败',
          errors: errors.array(),
        });
      }

      const { page = 1, limit = 10, search, role, status } = req.query;
      const offset = (page - 1) * limit;

      const whereClause = {};
      if (role) whereClause.role = role;
      if (status) whereClause.status = status;
      if (search) {
        whereClause[require('sequelize').Op.or] = [
          { username: { [require('sequelize').Op.like]: `%${search}%` } },
          { email: { [require('sequelize').Op.like]: `%${search}%` } },
        ];
      }

      const { count, rows: users } = await User.findAndCountAll({
        where: whereClause,
        attributes: { exclude: ['password'] },
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['createdAt', 'DESC']],
      });

      res.json({
        success: true,
        data: {
          users,
          pagination: {
            total: count,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(count / limit),
          },
        },
      });
    } catch (error) {
      console.error('获取用户列表错误:', error);
      res.status(500).json({
        success: false,
        message: '服务器错误',
        error: error.message,
      });
    }
  }
);

// 获取用户详情
router.get(
  '/users/:id',
  authenticate,
  requireAdmin,
  [param('id').isUUID().withMessage('无效的用户ID')],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: '验证失败',
          errors: errors.array(),
        });
      }

      const { id } = req.params;

      const user = await User.findByPk(id, {
        attributes: { exclude: ['password'] },
        include: [
          {
            model: Order,
            as: 'orders',
            limit: 10,
            order: [['createdAt', 'DESC']],
          },
        ],
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: '用户不存在',
        });
      }

      res.json({
        success: true,
        data: {
          user,
        },
      });
    } catch (error) {
      console.error('获取用户详情错误:', error);
      res.status(500).json({
        success: false,
        message: '服务器错误',
        error: error.message,
      });
    }
  }
);

// 管理员添加用户
router.post(
  '/users',
  authenticate,
  requireAdmin,
  [
    body('username').isLength({ min: 2, max: 50 }).withMessage('用户名长度应在 2-50 个字符'),
    body('email').isEmail().withMessage('请输入有效的邮箱地址'),
    body('password').isLength({ min: 6 }).withMessage('密码至少 6 个字符'),
    body('role').optional().isIn(['user', 'admin']).withMessage('角色只能是 user 或 admin'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: '验证失败',
          errors: errors.array(),
        });
      }

      const { username, email, password, phone, role = 'user' } = req.body;

      const existingUser = await User.findOne({
        where: {
          [require('sequelize').Op.or]: [{ email }, { username }],
        },
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: '用户名或邮箱已存在',
        });
      }

      const user = await User.create({
        username,
        email,
        password,
        phone,
        role,
        status: 'active',
      });

      const userData = user.toJSON();
      delete userData.password;

      res.status(201).json({
        success: true,
        message: '用户创建成功',
        data: {
          user: userData,
        },
      });
    } catch (error) {
      console.error('创建用户错误:', error);
      res.status(500).json({
        success: false,
        message: '服务器错误',
        error: error.message,
      });
    }
  }
);

// 更新用户状态
router.put(
  '/users/:id/status',
  authenticate,
  requireAdmin,
  [
    param('id').isUUID().withMessage('无效的用户ID'),
    body('status').isIn(['active', 'inactive', 'banned']).withMessage('状态值无效'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: '验证失败',
          errors: errors.array(),
        });
      }

      const { id } = req.params;
      const { status } = req.body;

      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: '用户不存在',
        });
      }

      if (user.role === 'admin' && status === 'banned') {
        return res.status(400).json({
          success: false,
          message: '不能禁用管理员账户',
        });
      }

      await user.update({ status });

      const userData = user.toJSON();
      delete userData.password;

      res.json({
        success: true,
        message: '用户状态更新成功',
        data: {
          user: userData,
        },
      });
    } catch (error) {
      console.error('更新用户状态错误:', error);
      res.status(500).json({
        success: false,
        message: '服务器错误',
        error: error.message,
      });
    }
  }
);

// 删除用户
router.delete(
  '/users/:id',
  authenticate,
  requireAdmin,
  [param('id').isUUID().withMessage('无效的用户ID')],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: '验证失败',
          errors: errors.array(),
        });
      }

      const { id } = req.params;

      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: '用户不存在',
        });
      }

      if (user.role === 'admin') {
        return res.status(400).json({
          success: false,
          message: '不能删除管理员账户',
        });
      }

      const pendingOrders = await Order.count({
        where: { userId: id, status: { [require('sequelize').Op.in]: ['pending', 'paid', 'shipped'] } },
      });

      if (pendingOrders > 0) {
        return res.status(400).json({
          success: false,
          message: '该用户有未完成的订单，无法删除',
        });
      }

      await user.destroy();

      res.json({
        success: true,
        message: '用户删除成功',
      });
    } catch (error) {
      console.error('删除用户错误:', error);
      res.status(500).json({
        success: false,
        message: '服务器错误',
        error: error.message,
      });
    }
  }
);

// 订单管理

// 获取所有订单
router.get(
  '/orders',
  authenticate,
  requireAdmin,
  [
    query('page').optional().isInt({ min: 1 }).withMessage('页码必须大于 0'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('每页数量必须在 1-100 之间'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: '验证失败',
          errors: errors.array(),
        });
      }

      const { page = 1, limit = 10, status, orderNo } = req.query;
      const offset = (page - 1) * limit;

      const whereClause = {};
      if (status) whereClause.status = status;
      if (orderNo) whereClause.orderNo = { [require('sequelize').Op.like]: `%${orderNo}%` };

      const { count, rows: orders } = await Order.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'email', 'phone'],
          },
          {
            model: OrderItem,
            as: 'orderItems',
          },
        ],
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['createdAt', 'DESC']],
      });

      res.json({
        success: true,
        data: {
          orders,
          pagination: {
            total: count,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(count / limit),
          },
        },
      });
    } catch (error) {
      console.error('获取订单列表错误:', error);
      res.status(500).json({
        success: false,
        message: '服务器错误',
        error: error.message,
      });
    }
  }
);

// 更新订单状态
router.put(
  '/orders/:id/status',
  authenticate,
  requireAdmin,
  [
    param('id').isUUID().withMessage('无效的订单ID'),
    body('status').isIn(['pending', 'paid', 'shipped', 'delivered', 'cancelled', 'refunded']).withMessage('状态值无效'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: '验证失败',
          errors: errors.array(),
        });
      }

      const { id } = req.params;
      const { status } = req.body;

      const order = await Order.findByPk(id);
      if (!order) {
        return res.status(404).json({
          success: false,
          message: '订单不存在',
        });
      }

      const updateData = { status };
      if (status === 'paid' && !order.paidAt) {
        updateData.paidAt = new Date();
      }

      await order.update(updateData);

      res.json({
        success: true,
        message: '订单状态更新成功',
        data: {
          order,
        },
      });
    } catch (error) {
      console.error('更新订单状态错误:', error);
      res.status(500).json({
        success: false,
        message: '服务器错误',
        error: error.message,
      });
    }
  }
);

// 获取统计数据
router.get(
  '/statistics',
  authenticate,
  requireAdmin,
  async (req, res) => {
    try {
      const userCount = await User.count({ where: { role: 'user' } });
      const productCount = await Product.count();
      const orderCount = await Order.count();
      
      const pendingOrders = await Order.count({ where: { status: 'pending' } });
      const paidOrders = await Order.count({ where: { status: 'paid' } });

      const totalRevenueResult = await Order.sum('totalAmount', {
        where: { status: { [require('sequelize').Op.in]: ['paid', 'shipped', 'delivered'] } },
      });

      res.json({
        success: true,
        data: {
          statistics: {
            userCount,
            productCount,
            orderCount,
            pendingOrders,
            paidOrders,
            totalRevenue: totalRevenueResult || 0,
          },
        },
      });
    } catch (error) {
      console.error('获取统计数据错误:', error);
      res.status(500).json({
        success: false,
        message: '服务器错误',
        error: error.message,
      });
    }
  }
);

module.exports = router;
