const db = require('../models');
const { Op } = require('sequelize');
const moment = require('moment');

const generatePaymentNo = () => {
  const date = moment().format('YYYYMMDD');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `PAY${date}${random}`;
};

const getPayments = async (req, res) => {
  try {
    const { page = 1, pageSize = 20, status, payMethod, startDate, endDate, keyword } = req.query;
    
    const where = {};
    
    if (status) {
      where.status = status;
    }
    
    if (payMethod) {
      where.payMethod = payMethod;
    }
    
    if (startDate || endDate) {
      where.paidAt = {};
      if (startDate) {
        where.paidAt[Op.gte] = new Date(startDate);
      }
      if (endDate) {
        where.paidAt[Op.lte] = new Date(`${endDate} 23:59:59`);
      }
    }
    
    if (keyword) {
      where[Op.or] = [
        { paymentNo: { [Op.like]: `%${keyword}%` } }
      ];
    }
    
    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    const limit = parseInt(pageSize);
    
    const { count, rows } = await db.Payment.findAndCountAll({
      where,
      include: [
        { model: db.Order, as: 'order' },
        { model: db.User, as: 'cashier' }
      ],
      order: [['paidAt', 'DESC']],
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
    console.error('获取支付记录错误:', error);
    return res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
};

const getPaymentById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const payment = await db.Payment.findByPk(id, {
      include: [
        { model: db.Order, as: 'order' },
        { model: db.User, as: 'cashier' }
      ]
    });
    
    if (!payment) {
      return res.status(404).json({
        code: 404,
        message: '支付记录不存在'
      });
    }
    
    return res.json({
      code: 200,
      message: '获取成功',
      data: payment
    });
    
  } catch (error) {
    console.error('获取支付详情错误:', error);
    return res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
};

const createPayment = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    const { orderId, discountAmount, payMethod, paymentDetails, receivedAmount, remark } = req.body;
    
    const order = await db.Order.findByPk(orderId, {
      include: [{ model: db.Table, as: 'table' }],
      transaction
    });
    
    if (!order) {
      await transaction.rollback();
      return res.status(404).json({
        code: 404,
        message: '订单不存在'
      });
    }
    
    if (order.status === 'paid') {
      await transaction.rollback();
      return res.status(400).json({
        code: 400,
        message: '该订单已支付'
      });
    }
    
    if (order.status === 'cancelled' || order.status === 'refunded') {
      await transaction.rollback();
      return res.status(400).json({
        code: 400,
        message: '该订单已取消或已退款'
      });
    }
    
    const totalAmount = parseFloat(order.totalAmount);
    const discount = parseFloat(discountAmount) || 0;
    const payAmount = totalAmount - discount;
    
    if (payAmount < 0) {
      await transaction.rollback();
      return res.status(400).json({
        code: 400,
        message: '优惠金额不能大于应收金额'
      });
    }
    
    let changeAmount = 0;
    const received = parseFloat(receivedAmount) || payAmount;
    
    if (payMethod === 'cash') {
      changeAmount = received - payAmount;
      if (changeAmount < 0) {
        await transaction.rollback();
        return res.status(400).json({
          code: 400,
          message: '收到的金额不足'
        });
      }
    }
    
    const payment = await db.Payment.create({
      paymentNo: generatePaymentNo(),
      orderId: order.id,
      totalAmount: totalAmount,
      discountAmount: discount,
      payAmount: payAmount,
      payMethod,
      paymentDetails: paymentDetails || [],
      receivedAmount: received,
      changeAmount,
      status: 'success',
      paidAt: new Date(),
      cashierId: req.user?.id,
      remark
    }, { transaction });
    
    await order.update({
      status: 'paid',
      discountAmount: discount,
      payAmount: payAmount,
      payMethod,
      paidAt: new Date(),
      paymentId: payment.id,
      cashierId: req.user?.id
    }, { transaction });
    
    if (order.table) {
      await order.table.update({
        status: 'available',
        currentOrderId: null
      }, { transaction });
    }
    
    await transaction.commit();
    
    const resultPayment = await db.Payment.findByPk(payment.id, {
      include: [
        { model: db.Order, as: 'order' }
      ]
    });
    
    return res.json({
      code: 200,
      message: '支付成功',
      data: resultPayment
    });
    
  } catch (error) {
    await transaction.rollback();
    console.error('创建支付记录错误:', error);
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
      status: 'success'
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
    
    const payments = await db.Payment.findAll({
      where,
      attributes: ['totalAmount', 'discountAmount', 'payAmount', 'payMethod', 'paidAt'],
      order: [['paidAt', 'DESC']]
    });
    
    const totalPayments = payments.length;
    const totalRevenue = payments.reduce((sum, p) => sum + parseFloat(p.payAmount), 0);
    const totalDiscount = payments.reduce((sum, p) => sum + parseFloat(p.discountAmount), 0);
    
    const payMethodStats = {};
    for (const p of payments) {
      const method = p.payMethod || 'other';
      if (!payMethodStats[method]) {
        payMethodStats[method] = { count: 0, amount: 0 };
      }
      payMethodStats[method].count++;
      payMethodStats[method].amount += parseFloat(p.payAmount);
    }
    
    return res.json({
      code: 200,
      message: '获取成功',
      data: {
        totalPayments,
        totalRevenue,
        totalDiscount,
        payMethodStats
      }
    });
    
  } catch (error) {
    console.error('获取支付统计错误:', error);
    return res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
};

module.exports = {
  getPayments,
  getPaymentById,
  createPayment,
  getStatistics
};
