const express = require('express');
const { Order, Arbitration } = require('../models');
const { authMiddleware, adminOnly } = require('../middleware/auth');
const { Op } = require('sequelize');
const { sequelize } = require('../models');

const router = express.Router();

router.get('/gmv', authMiddleware, adminOnly, async (req, res) => {
  const { city, startDate, endDate } = req.query;
  const where = {};
  if (city) where.city = city;
  if (startDate || endDate) {
    where.created_at = {};
    if (startDate) where.created_at[Op.gte] = new Date(startDate);
    if (endDate) where.created_at[Op.lte] = new Date(endDate);
  }

  try {
    const results = await Order.findAll({
      attributes: [
        [sequelize.fn('date', sequelize.col('created_at')), 'date'],
        [sequelize.fn('sum', sequelize.col('total_amount')), 'gmv'],
        [sequelize.fn('count', sequelize.col('id')), 'orderCount'],
      ],
      where,
      group: [sequelize.fn('date', sequelize.col('created_at'))],
      order: [[sequelize.fn('date', sequelize.col('created_at')), 'ASC']],
      raw: true,
    });
    const totalGmv = results.reduce((sum, item) => sum + Number(item.gmv || 0), 0);
    const totalOrders = results.reduce((sum, item) => sum + Number(item.orderCount || 0), 0);
    res.json({ list: results, items: results, totalGmv, totalOrders });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/repurchase', authMiddleware, adminOnly, async (req, res) => {
  const { city, startDate, endDate } = req.query;
  const where = {};
  if (city) where.city = city;
  if (startDate || endDate) {
    where.created_at = {};
    if (startDate) where.created_at[Op.gte] = new Date(startDate);
    if (endDate) where.created_at[Op.lte] = new Date(endDate);
  }

  try {
    const totalUsers = await Order.findAll({
      attributes: ['user_id'],
      where,
      group: ['user_id'],
      raw: true,
    });

    const repeatUsers = await Order.findAll({
      attributes: ['user_id', [sequelize.fn('count', sequelize.col('id')), 'orderCount']],
      where,
      group: ['user_id'],
      having: sequelize.where(sequelize.fn('count', sequelize.col('id')), { [Op.gt]: 1 }),
      raw: true,
    });

    const totalUserCount = totalUsers.length;
    const repeatUserCount = repeatUsers.length;
    const rate = totalUserCount > 0 ? (repeatUserCount / totalUserCount * 100).toFixed(2) : 0;

    const numericRate = totalUserCount > 0 ? repeatUserCount / totalUserCount : 0;
    res.json({
      list: [{ id: 'all', totalUsers: totalUserCount, repurchaseUsers: repeatUserCount, repurchaseRate: numericRate }],
      totalUsers: totalUserCount,
      repeatUsers: repeatUserCount,
      repurchaseRate: `${rate}%`,
      avgRate: numericRate,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/complaints', authMiddleware, adminOnly, async (req, res) => {
  const { city, startDate, endDate } = req.query;
  const orderWhere = {};
  if (city) orderWhere.city = city;
  if (startDate || endDate) {
    orderWhere.created_at = {};
    if (startDate) orderWhere.created_at[Op.gte] = new Date(startDate);
    if (endDate) orderWhere.created_at[Op.lte] = new Date(endDate);
  }

  try {
    const totalOrders = await Order.count({ where: orderWhere });

    const complaintOrders = await Arbitration.count({
      include: [{ model: Order, as: 'order', where: orderWhere, attributes: [] }],
    });

    const rate = totalOrders > 0 ? (complaintOrders / totalOrders * 100).toFixed(2) : 0;
    const numericRate = totalOrders > 0 ? complaintOrders / totalOrders : 0;
    res.json({
      list: [{ id: 'all', totalOrders, complaintCount: complaintOrders, complaintRate: numericRate }],
      totalOrders,
      complaintOrders,
      complaintRate: `${rate}%`,
      avgRate: numericRate,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
