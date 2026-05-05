const { Op } = require('sequelize');
const { Order, OrderItem, OrderStatusLog } = require('../models/Order');
const { ShoppingCart, CartItem } = require('../models/ShoppingCart');
const { Package } = require('../models/Package');
const User = require('../models/User');
const PriceCalculator = require('../utils/priceCalculator');
const { cache } = require('../config/redis');

const orderController = {
  
  createOrder: async (req, res) => {
    try {
      const userId = req.userId;
      const { cartItemIds, remark, contactName, contactPhone, address } = req.body;

      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: '用户不存在'
        });
      }

      const cart = await ShoppingCart.findOne({
        where: { userId },
        include: [{
          model: CartItem,
          as: 'items',
          where: { 
            id: cartItemIds ? { [Op.in]: cartItemIds } : { [Op.ne]: null },
            isSelected: true 
          }
        }]
      });

      if (!cart || !cart.items || cart.items.length === 0) {
        return res.status(400).json({
          success: false,
          message: '购物车为空'
        });
      }

      const packageItem = cart.items.find(i => i.itemType === 'package');
      if (!packageItem) {
        return res.status(400).json({
          success: false,
          message: '必须选择套餐'
        });
      }

      const pkg = await Package.findByPk(packageItem.itemId);
      if (!pkg) {
        return res.status(404).json({
          success: false,
          message: '套餐不存在'
        });
      }

      let packagePrice = 0;
      let upgradePrice = 0;
      let accessoryPrice = 0;
      let houseArea = packageItem.houseArea || user.houseArea || 0;

      const orderItems = [];

      for (const cartItem of cart.items) {
        const itemData = {
          itemType: cartItem.itemType,
          itemId: cartItem.itemId,
          itemName: cartItem.metadata?.name,
          itemCode: cartItem.metadata?.code,
          imageUrl: cartItem.metadata?.coverImage,
          quantity: cartItem.quantity,
          unitPrice: cartItem.unitPrice,
          totalPrice: cartItem.totalPrice,
          houseArea: cartItem.houseArea,
          selectedAttributes: cartItem.selectedAttributes,
          specs: cartItem.metadata
        };

        orderItems.push(itemData);

        const price = parseFloat(cartItem.totalPrice) || 0;
        if (cartItem.itemType === 'package') {
          packagePrice += price;
        } else if (cartItem.itemType === 'upgrade') {
          upgradePrice += price;
        } else if (cartItem.itemType === 'accessory') {
          accessoryPrice += price;
        }
      }

      const totalPrice = packagePrice + upgradePrice + accessoryPrice;

      const orderNo = await Order.generateOrderNo();

      const order = await Order.create({
        orderNo,
        userId,
        status: 'pending',
        packageId: packageItem.itemId,
        packageName: pkg.name,
        packageCode: pkg.code,
        selectedAttributes: packageItem.selectedAttributes,
        houseArea,
        city: user.city,
        district: user.district,
        project: user.project,
        building: user.building,
        floor: user.floor,
        houseType: user.houseType,
        floorPlanUrl: user.floorPlanUrl,
        contactName: contactName || user.realName,
        contactPhone: contactPhone || user.phone,
        address,
        packagePrice,
        packageUnitPrice: packageItem.unitPrice,
        upgradePrice,
        accessoryPrice,
        discountAmount: 0,
        totalPrice,
        paidAmount: 0,
        remark
      });

      for (const itemData of orderItems) {
        await OrderItem.create({
          orderId: order.id,
          ...itemData
        });
      }

      await OrderStatusLog.create({
        orderId: order.id,
        fromStatus: null,
        toStatus: 'pending',
        operatorType: 'user',
        operatorId: userId,
        remark: '订单创建'
      });

      await CartItem.destroy({
        where: { id: cart.items.map(i => i.id) }
      });

      await cache.del(`orders:list:${userId}:*`);

      res.json({
        success: true,
        message: '订单创建成功',
        data: {
          orderId: order.id,
          orderNo: order.orderNo,
          totalPrice
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '创建订单失败',
        error: error.message
      });
    }
  },

  getOrderList: async (req, res) => {
    try {
      const userId = req.userId;
      const { status, page = 1, pageSize = 20 } = req.query;

      const cacheKey = `orders:list:${userId}:${status || 'all'}:${page}:${pageSize}`;
      const cached = await cache.get(cacheKey);
      
      if (cached) {
        return res.json({
          success: true,
          data: cached,
          fromCache: true
        });
      }

      const where = { userId };
      if (status) {
        where.status = status;
      }

      const { count, rows } = await Order.findAndCountAll({
        where,
        order: [['createdAt', 'DESC']],
        limit: parseInt(pageSize),
        offset: (parseInt(page) - 1) * parseInt(pageSize),
        include: [{
          model: OrderItem,
          as: 'items',
          order: [['createdAt', 'ASC']]
        }]
      });

      const result = {
        list: rows,
        total: count,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      };

      await cache.set(cacheKey, result, 60);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '获取订单列表失败',
        error: error.message
      });
    }
  },

  getOrderDetail: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.userId;

      const order = await Order.findOne({
        where: { id, userId },
        include: [
          {
            model: OrderItem,
            as: 'items',
            order: [['createdAt', 'ASC']]
          },
          {
            model: OrderStatusLog,
            as: 'statusLogs',
            order: [['createdAt', 'ASC']]
          }
        ]
      });

      if (!order) {
        return res.status(404).json({
          success: false,
          message: '订单不存在'
        });
      }

      res.json({
        success: true,
        data: order
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '获取订单详情失败',
        error: error.message
      });
    }
  },

  cancelOrder: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.userId;
      const { reason } = req.body;

      const order = await Order.findOne({
        where: { id, userId }
      });

      if (!order) {
        return res.status(404).json({
          success: false,
          message: '订单不存在'
        });
      }

      if (!['pending', 'confirmed'].includes(order.status)) {
        return res.status(400).json({
          success: false,
          message: '该订单状态无法取消'
        });
      }

      const oldStatus = order.status;
      await order.update({
        status: 'cancelled',
        cancelledAt: new Date(),
        cancelReason: reason
      });

      await OrderStatusLog.create({
        orderId: order.id,
        fromStatus: oldStatus,
        toStatus: 'cancelled',
        operatorType: 'user',
        operatorId: userId,
        remark: reason || '用户取消订单'
      });

      await cache.del(`orders:list:${userId}:*`);

      res.json({
        success: true,
        message: '订单已取消'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '取消订单失败',
        error: error.message
      });
    }
  },

  confirmOrder: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.userId;

      const order = await Order.findOne({
        where: { id, userId }
      });

      if (!order) {
        return res.status(404).json({
          success: false,
          message: '订单不存在'
        });
      }

      if (order.status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: '该订单状态无法确认'
        });
      }

      const oldStatus = order.status;
      await order.update({
        status: 'confirmed',
        confirmedAt: new Date()
      });

      await OrderStatusLog.create({
        orderId: order.id,
        fromStatus: oldStatus,
        toStatus: 'confirmed',
        operatorType: 'user',
        operatorId: userId,
        remark: '用户确认订单'
      });

      await cache.del(`orders:list:${userId}:*`);

      res.json({
        success: true,
        message: '订单已确认',
        data: {
          orderId: order.id,
          orderNo: order.orderNo,
          status: 'confirmed'
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '确认订单失败',
        error: error.message
      });
    }
  },

  getOrderStatistics: async (req, res) => {
    try {
      const userId = req.userId;

      const [pending, confirmed, paid, completed] = await Promise.all([
        Order.count({ where: { userId, status: 'pending' } }),
        Order.count({ where: { userId, status: 'confirmed' } }),
        Order.count({ where: { userId, status: 'paid' } }),
        Order.count({ where: { userId, status: 'completed' } })
      ]);

      res.json({
        success: true,
        data: {
          pending,
          confirmed,
          paid,
          completed,
          total: pending + confirmed + paid + completed
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '获取订单统计失败',
        error: error.message
      });
    }
  }
};

module.exports = orderController;
