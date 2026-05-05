const express = require('express');
const { body, param, validationResult } = require('express-validator');
const { sequelize, Order, OrderItem, Product, User } = require('../models');
const { authenticate, requireAdmin } = require('../middleware/auth');
const redisService = require('../config/redis');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// 生成订单号
const generateOrderNo = () => {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `GB${timestamp}${random}`;
};

// 创建订单
router.post(
  '/',
  authenticate,
  [
    body('items').isArray({ min: 1 }).withMessage('商品列表不能为空'),
    body('shippingName').notEmpty().withMessage('收货人姓名不能为空'),
    body('shippingPhone').notEmpty().isMobilePhone().withMessage('请输入有效的手机号'),
    body('shippingAddress').notEmpty().withMessage('收货地址不能为空'),
  ],
  async (req, res) => {
    const transaction = await sequelize.transaction();

    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: '验证失败',
          errors: errors.array(),
        });
      }

      const { items, shippingName, shippingPhone, shippingAddress, remark } = req.body;
      const userId = req.user.id;

      let totalAmount = 0;
      const orderItems = [];

      for (const item of items) {
        const product = await Product.findByPk(item.productId, { transaction });
        
        if (!product) {
          await transaction.rollback();
          return res.status(404).json({
            success: false,
            message: `商品 ${item.productId} 不存在`,
          });
        }

        if (product.stock < item.quantity) {
          await transaction.rollback();
          return res.status(400).json({
            success: false,
            message: `商品 ${product.name} 库存不足`,
          });
        }

        if (product.status !== 'active') {
          await transaction.rollback();
          return res.status(400).json({
            success: false,
            message: `商品 ${product.name} 已下架`,
          });
        }

        const subtotal = parseFloat(product.price) * item.quantity;
        totalAmount += subtotal;

        orderItems.push({
          productId: product.id,
          productName: product.name,
          productImage: product.image,
          price: product.price,
          quantity: item.quantity,
          subtotal,
        });

        await product.update(
          {
            stock: product.stock - item.quantity,
            sold: product.sold + item.quantity,
          },
          { transaction }
        );
      }

      const order = await Order.create(
        {
          orderNo: generateOrderNo(),
          userId,
          totalAmount,
          status: 'pending',
          shippingName,
          shippingPhone,
          shippingAddress,
          remark,
        },
        { transaction }
      );

      for (const item of orderItems) {
        await OrderItem.create(
          {
            orderId: order.id,
            ...item,
          },
          { transaction }
        );
      }

      await transaction.commit();

      await redisService.enqueue('order:notifications', {
        orderId: order.id,
        orderNo: order.orderNo,
        userId,
        action: 'created',
      });

      res.status(201).json({
        success: true,
        message: '订单创建成功',
        data: {
          order: {
            ...order.toJSON(),
            orderItems,
          },
        },
      });
    } catch (error) {
      await transaction.rollback();
      console.error('创建订单错误:', error);
      res.status(500).json({
        success: false,
        message: '服务器错误',
        error: error.message,
      });
    }
  }
);

// 获取当前用户的订单列表
router.get('/my', authenticate, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const userId = req.user.id;

    const whereClause = { userId };
    if (status) whereClause.status = status;

    const offset = (page - 1) * limit;

    const { count, rows: orders } = await Order.findAndCountAll({
      where: whereClause,
      include: [
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
});

// 获取订单详情
router.get(
  '/:id',
  authenticate,
  [param('id').isUUID().withMessage('无效的订单ID')],
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
      const userId = req.user.id;
      const isAdmin = req.user.role === 'admin';

      const whereClause = { id };
      if (!isAdmin) {
        whereClause.userId = userId;
      }

      const order = await Order.findOne({
        where: whereClause,
        include: [
          {
            model: OrderItem,
            as: 'orderItems',
          },
          ...(isAdmin ? [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'username', 'email', 'phone'],
            }
          ] : []),
        ],
      });

      if (!order) {
        return res.status(404).json({
          success: false,
          message: '订单不存在',
        });
      }

      res.json({
        success: true,
        data: {
          order,
        },
      });
    } catch (error) {
      console.error('获取订单详情错误:', error);
      res.status(500).json({
        success: false,
        message: '服务器错误',
        error: error.message,
      });
    }
  }
);

// 支付订单
router.post(
  '/:id/pay',
  authenticate,
  [param('id').isUUID().withMessage('无效的订单ID')],
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
      const userId = req.user.id;

      const order = await Order.findOne({
        where: { id, userId },
      });

      if (!order) {
        return res.status(404).json({
          success: false,
          message: '订单不存在',
        });
      }

      if (order.status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: '订单状态不允许支付',
        });
      }

      await order.update({
        status: 'paid',
        paidAt: new Date(),
      });

      await redisService.enqueue('order:notifications', {
        orderId: order.id,
        orderNo: order.orderNo,
        userId,
        action: 'paid',
      });

      res.json({
        success: true,
        message: '支付成功',
        data: {
          order,
        },
      });
    } catch (error) {
      console.error('支付订单错误:', error);
      res.status(500).json({
        success: false,
        message: '服务器错误',
        error: error.message,
      });
    }
  }
);

// 取消订单
router.post(
  '/:id/cancel',
  authenticate,
  [param('id').isUUID().withMessage('无效的订单ID')],
  async (req, res) => {
    const transaction = await sequelize.transaction();

    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: '验证失败',
          errors: errors.array(),
        });
      }

      const { id } = req.params;
      const userId = req.user.id;

      const order = await Order.findOne({
        where: { id, userId },
        include: [
          {
            model: OrderItem,
            as: 'orderItems',
          },
        ],
        transaction,
      });

      if (!order) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: '订单不存在',
        });
      }

      if (order.status !== 'pending') {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: '订单状态不允许取消',
        });
      }

      for (const item of order.orderItems) {
        const product = await Product.findByPk(item.productId, { transaction });
        if (product) {
          await product.update(
            {
              stock: product.stock + item.quantity,
              sold: Math.max(0, product.sold - item.quantity),
            },
            { transaction }
          );
        }
      }

      await order.update({ status: 'cancelled' }, { transaction });

      await transaction.commit();

      res.json({
        success: true,
        message: '订单已取消',
        data: {
          order,
        },
      });
    } catch (error) {
      await transaction.rollback();
      console.error('取消订单错误:', error);
      res.status(500).json({
        success: false,
        message: '服务器错误',
        error: error.message,
      });
    }
  }
);

module.exports = router;
