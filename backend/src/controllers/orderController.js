const db = require('../models');
const { Op } = require('sequelize');
const moment = require('moment');

const generateOrderNo = () => {
  const date = moment().format('YYYYMMDD');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `ORD${date}${random}`;
};

const getOrders = async (req, res) => {
  try {
    const { page = 1, pageSize = 20, status, tableId, orderType, startDate, endDate, keyword } = req.query;
    
    const where = {};
    
    if (status) {
      where.status = status;
    }
    
    if (tableId) {
      where.tableId = tableId;
    }
    
    if (orderType) {
      where.orderType = orderType;
    }
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt[Op.gte] = new Date(startDate);
      }
      if (endDate) {
        where.createdAt[Op.lte] = new Date(`${endDate} 23:59:59`);
      }
    }
    
    if (keyword) {
      where[Op.or] = [
        { orderNo: { [Op.like]: `%${keyword}%` } },
        { customerName: { [Op.like]: `%${keyword}%` } },
        { customerPhone: { [Op.like]: `%${keyword}%` } }
      ];
    }
    
    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    const limit = parseInt(pageSize);
    
    const { count, rows } = await db.Order.findAndCountAll({
      where,
      include: [
        { model: db.Table, as: 'table' },
        { model: db.User, as: 'waiter' },
        { model: db.User, as: 'cashier' },
        { 
          model: db.OrderItem, 
          as: 'items',
          include: [
            { model: db.Dish, as: 'dish' }
          ]
        }
      ],
      order: [['createdAt', 'DESC']],
      offset,
      limit
    });
    
    return res.json({
      code: 200,
      message: '获取成功',
      data: {
        list: rows,
        total: count,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        totalPages: Math.ceil(count / pageSize)
      }
    });
    
  } catch (error) {
    console.error('获取订单列表错误:', error);
    return res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
};

const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const order = await db.Order.findByPk(id, {
      include: [
        { model: db.Table, as: 'table' },
        { model: db.User, as: 'waiter' },
        { model: db.User, as: 'cashier' },
        { 
          model: db.OrderItem, 
          as: 'items',
          include: [
            { model: db.Dish, as: 'dish' }
          ]
        }
      ]
    });
    
    if (!order) {
      return res.status(404).json({
        code: 404,
        message: '订单不存在'
      });
    }
    
    return res.json({
      code: 200,
      message: '获取成功',
      data: order
    });
    
  } catch (error) {
    console.error('获取订单详情错误:', error);
    return res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
};

const createOrder = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    const { tableId, customerName, customerPhone, guestCount, orderType, items, remark, source } = req.body;
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      await transaction.rollback();
      return res.status(400).json({
        code: 400,
        message: '请选择菜品'
      });
    }
    
    let table = null;
    if (tableId) {
      table = await db.Table.findByPk(tableId, { transaction });
      if (!table) {
        await transaction.rollback();
        return res.status(400).json({
          code: 400,
          message: '桌台不存在'
        });
      }
      
      if (table.status === 'occupied') {
        await transaction.rollback();
        return res.status(400).json({
          code: 400,
          message: '该桌台正在使用中'
        });
      }
    }
    
    const dishIds = items.map(item => item.dishId);
    const dishes = await db.Dish.findAll({
      where: { id: dishIds },
      transaction
    });
    
    const dishMap = {};
    for (const dish of dishes) {
      dishMap[dish.id] = dish;
    }
    
    let totalAmount = 0;
    const orderItems = [];
    
    for (const item of items) {
      const dish = dishMap[item.dishId];
      if (!dish) {
        await transaction.rollback();
        return res.status(400).json({
          code: 400,
          message: `菜品 ${item.dishId} 不存在`
        });
      }
      
      if (dish.status !== 1) {
        await transaction.rollback();
        return res.status(400).json({
          code: 400,
          message: `菜品 ${dish.name} 已下架或售罄`
        });
      }
      
      const quantity = item.quantity || 1;
      const price = parseFloat(dish.price);
      const subtotal = price * quantity;
      
      totalAmount += subtotal;
      
      orderItems.push({
        dishId: dish.id,
        dishName: dish.name,
        dishCode: dish.code,
        unit: dish.unit,
        price: price,
        quantity: quantity,
        subtotal: subtotal,
        discount: 0,
        actualAmount: subtotal,
        remark: item.remark || '',
        ingredients: item.ingredients || []
      });
    }
    
    const order = await db.Order.create({
      orderNo: generateOrderNo(),
      tableId: tableId || null,
      customerName,
      customerPhone,
      guestCount: guestCount || 1,
      orderType: orderType || 'dine_in',
      status: 'confirmed',
      totalAmount: totalAmount,
      discountAmount: 0,
      payAmount: totalAmount,
      waiterId: req.user?.id,
      remark,
      source: source || 'pos'
    }, { transaction });
    
    for (const item of orderItems) {
      item.orderId = order.id;
      await db.OrderItem.create(item, { transaction });
    }
    
    if (table) {
      await table.update({
        status: 'occupied',
        currentOrderId: order.id
      }, { transaction });
    }
    
    await transaction.commit();
    
    const resultOrder = await db.Order.findByPk(order.id, {
      include: [
        { model: db.Table, as: 'table' },
        { model: db.OrderItem, as: 'items' }
      ]
    });
    
    return res.json({
      code: 200,
      message: '创建订单成功',
      data: resultOrder
    });
    
  } catch (error) {
    await transaction.rollback();
    console.error('创建订单错误:', error);
    return res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
};

const updateOrderItems = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { items, action } = req.body;
    
    const order = await db.Order.findByPk(id, {
      include: [{ model: db.OrderItem, as: 'items' }],
      transaction
    });
    
    if (!order) {
      await transaction.rollback();
      return res.status(404).json({
        code: 404,
        message: '订单不存在'
      });
    }
    
    if (['paid', 'cancelled', 'refunded'].includes(order.status)) {
      await transaction.rollback();
      return res.status(400).json({
        code: 400,
        message: '该订单已完成或已取消，不能修改'
      });
    }
    
    if (action === 'add' && items && items.length > 0) {
      const dishIds = items.map(item => item.dishId);
      const dishes = await db.Dish.findAll({
        where: { id: dishIds },
        transaction
      });
      
      const dishMap = {};
      for (const dish of dishes) {
        dishMap[dish.id] = dish;
      }
      
      for (const item of items) {
        const dish = dishMap[item.dishId];
        if (!dish) {
          await transaction.rollback();
          return res.status(400).json({
            code: 400,
            message: `菜品 ${item.dishId} 不存在`
          });
        }
        
        if (dish.status !== 1) {
          await transaction.rollback();
          return res.status(400).json({
            code: 400,
            message: `菜品 ${dish.name} 已下架或售罄`
          });
        }
        
        const quantity = item.quantity || 1;
        const price = parseFloat(dish.price);
        const subtotal = price * quantity;
        
        await db.OrderItem.create({
          orderId: order.id,
          dishId: dish.id,
          dishName: dish.name,
          dishCode: dish.code,
          unit: dish.unit,
          price: price,
          quantity: quantity,
          subtotal: subtotal,
          discount: 0,
          actualAmount: subtotal,
          remark: item.remark || '',
          ingredients: item.ingredients || []
        }, { transaction });
        
        order.totalAmount = parseFloat(order.totalAmount) + subtotal;
        order.payAmount = parseFloat(order.payAmount) + subtotal;
      }
      
      await order.save({ transaction });
    }
    
    await transaction.commit();
    
    const resultOrder = await db.Order.findByPk(id, {
      include: [
        { model: db.Table, as: 'table' },
        { model: db.OrderItem, as: 'items' }
      ]
    });
    
    return res.json({
      code: 200,
      message: '订单更新成功',
      data: resultOrder
    });
    
  } catch (error) {
    await transaction.rollback();
    console.error('更新订单错误:', error);
    return res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
};

const updateOrderStatus = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'served', 'paid', 'cancelled', 'refunded'];
    if (!validStatuses.includes(status)) {
      await transaction.rollback();
      return res.status(400).json({
        code: 400,
        message: '无效的订单状态'
      });
    }
    
    const order = await db.Order.findByPk(id, {
      include: [
        { model: db.Table, as: 'table' }
      ],
      transaction
    });
    
    if (!order) {
      await transaction.rollback();
      return res.status(404).json({
        code: 404,
        message: '订单不存在'
      });
    }
    
    order.status = status;
    await order.save({ transaction });
    
    if (['paid', 'cancelled', 'refunded'].includes(status) && order.table) {
      await order.table.update({
        status: 'available',
        currentOrderId: null
      }, { transaction });
    }
    
    await transaction.commit();
    
    const resultOrder = await db.Order.findByPk(id, {
      include: [
        { model: db.Table, as: 'table' },
        { model: db.OrderItem, as: 'items' }
      ]
    });
    
    return res.json({
      code: 200,
      message: '订单状态更新成功',
      data: resultOrder
    });
    
  } catch (error) {
    await transaction.rollback();
    console.error('更新订单状态错误:', error);
    return res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
};

const getStatistics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const where = {
      status: 'paid'
    };
    
    if (startDate || endDate) {
      where.paidAt = {};
      if (startDate) {
        where.paidAt[Op.gte] = new Date(startDate);
      }
      if (endDate) {
        where.paidAt[Op.lte] = new Date(`${endDate} 23:59:59`);
      }
    }
    
    const orders = await db.Order.findAll({
      where,
      attributes: ['totalAmount', 'discountAmount', 'payAmount', 'payMethod', 'paidAt'],
      order: [['paidAt', 'DESC']]
    });
    
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.payAmount), 0);
    const totalDiscount = orders.reduce((sum, order) => sum + parseFloat(order.discountAmount), 0);
    
    const payMethodStats = {};
    for (const order of orders) {
      const method = order.payMethod || 'other';
      if (!payMethodStats[method]) {
        payMethodStats[method] = { count: 0, amount: 0 };
      }
      payMethodStats[method].count++;
      payMethodStats[method].amount += parseFloat(order.payAmount);
    }
    
    return res.json({
      code: 200,
      message: '获取成功',
      data: {
        totalOrders,
        totalRevenue,
        totalDiscount,
        payMethodStats
      }
    });
    
  } catch (error) {
    console.error('获取订单统计错误:', error);
    return res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
};

module.exports = {
  getOrders,
  getOrderById,
  createOrder,
  updateOrderItems,
  updateOrderStatus,
  getStatistics
};
