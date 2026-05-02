import express from 'express';
import { Op } from 'sequelize';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import SKU from '../models/SKU.js';
import Shop from '../models/Shop.js';
import AfterSale from '../models/AfterSale.js';
import Cost from '../models/Cost.js';
import { ProfitEngine } from '../engines/ProfitEngine.js';
import Alert from '../models/Alert.js';

const router = express.Router();
const profitEngine = new ProfitEngine();

router.get('/dashboard', async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const [
      todayOrders,
      pendingShipments,
      pendingAfterSales,
      lowStockSKUs,
      recentAlerts
    ] = await Promise.all([
      Order.count({
        where: {
          created_at: { [Op.between]: [startOfDay, endOfDay] }
        }
      }),
      Order.count({
        where: {
          status: 'processing',
          shipping_status: 'unshipped'
        }
      }),
      AfterSale.count({
        where: {
          status: { [Op.in]: ['pending', 'processing'] }
        }
      }),
      SKU.findAll({
        where: {
          stock: { [Op.lt]: require('sequelize').col('min_stock') }
        },
        limit: 10
      }),
      Alert.findAll({
        where: {
          status: { [Op.in]: ['pending', 'processing'] }
        },
        order: [['created_at', 'DESC']],
        limit: 5
      })
    ]);

    const todayRevenue = await Order.sum('total_amount', {
      where: {
        created_at: { [Op.between]: [startOfDay, endOfDay] },
        status: { [Op.notIn]: ['cancelled', 'pending'] }
      }
    });

    const totalShops = await Shop.count({
      where: { status: 'active' }
    });

    res.json({
      todayOrders,
      todayRevenue: todayRevenue || 0,
      pendingShipments,
      pendingAfterSales,
      lowStockSKUs: lowStockSKUs.length,
      lowStockItems: lowStockSKUs,
      recentAlerts,
      totalShops
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/sales', async (req, res) => {
  try {
    const { start_date, end_date, group_by = 'day', platform, shop_id } = req.query;
    const where = {
      status: { [Op.notIn]: ['cancelled', 'pending'] }
    };

    if (start_date || end_date) {
      where.created_at = {};
      if (start_date) where.created_at[Op.gte] = new Date(start_date);
      if (end_date) where.created_at[Op.lte] = new Date(end_date);
    }
    if (platform) where.platform = platform;
    if (shop_id) where.shop_id = shop_id;

    const orders = await Order.findAll({
      where,
      include: [{ model: Shop, as: 'shop' }],
      order: [['created_at', 'ASC']]
    });

    const groupedData = {};
    for (const order of orders) {
      const date = new Date(order.created_at);
      let key;

      switch (group_by) {
        case 'week':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().split('T')[0];
          break;
        case 'month':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        case 'year':
          key = String(date.getFullYear());
          break;
        default:
          key = date.toISOString().split('T')[0];
      }

      if (!groupedData[key]) {
        groupedData[key] = {
          period: key,
          order_count: 0,
          revenue: 0,
          avg_order_value: 0
        };
      }

      groupedData[key].order_count++;
      groupedData[key].revenue += parseFloat(order.total_amount);
    }

    for (const key of Object.keys(groupedData)) {
      groupedData[key].avg_order_value =
        groupedData[key].order_count > 0
          ? groupedData[key].revenue / groupedData[key].order_count
          : 0;
    }

    res.json({
      sales: Object.values(groupedData),
      summary: {
        totalOrders: orders.length,
        totalRevenue: orders.reduce((sum, o) => sum + parseFloat(o.total_amount), 0),
        avgOrderValue: orders.length > 0
          ? orders.reduce((sum, o) => sum + parseFloat(o.total_amount), 0) / orders.length
          : 0
      }
    });
  } catch (error) {
    console.error('Get sales analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/profit', async (req, res) => {
  try {
    const { start_date, end_date, group_by = 'day' } = req.query;

    if (!start_date || !end_date) {
      return res.status(400).json({ error: 'start_date and end_date are required' });
    }

    const report = await profitEngine.generateProfitReport(start_date, end_date, group_by);

    res.json(report);
  } catch (error) {
    console.error('Get profit analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/inventory', async (req, res) => {
  try {
    const { low_stock, category } = req.query;
    const where = {};

    if (low_stock === 'true') {
      where.stock = { [Op.lt]: require('sequelize').col('min_stock') };
    }

    const skus = await SKU.findAll({
      where,
      include: [{
        model: Product,
        as: 'product',
        where: category ? { category } : {}
      }]
    });

    const totalSKUs = await SKU.count();
    const lowStockCount = await SKU.count({
      where: {
        stock: { [Op.lt]: require('sequelize').col('min_stock') }
      }
    });

    const totalStock = await SKU.sum('stock');
    const totalValue = await SKU.sum(require('sequelize').literal('stock * price'));

    res.json({
      inventory: skus.map(sku => ({
        id: sku.id,
        sku_code: sku.sku_code,
        product_name: sku.product?.name,
        stock: sku.stock,
        min_stock: sku.min_stock,
        price: sku.price,
        value: sku.stock * sku.price,
        status: sku.stock < sku.min_stock ? 'low_stock' : 'normal'
      })),
      summary: {
        totalSKUs,
        lowStockCount,
        normalStockCount: totalSKUs - lowStockCount,
        lowStockRate: totalSKUs > 0 ? (lowStockCount / totalSKUs * 100).toFixed(2) : 0,
        totalStock: totalStock || 0,
        totalValue: totalValue || 0
      }
    });
  } catch (error) {
    console.error('Get inventory analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/after-sales', async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    const where = {};

    if (start_date || end_date) {
      where.created_at = {};
      if (start_date) where.created_at[Op.gte] = new Date(start_date);
      if (end_date) where.created_at[Op.lte] = new Date(end_date);
    }

    const afterSales = await AfterSale.findAll({
      where,
      include: [{
        model: Order,
        as: 'order',
        attributes: ['id', 'platform_order_id', 'total_amount']
      }]
    });

    const byType = {
      refund: { count: 0, amount: 0 },
      return: { count: 0, amount: 0 },
      dispute: { count: 0, amount: 0 }
    };

    const byStatus = {
      pending: 0,
      processing: 0,
      completed: 0,
      rejected: 0
    };

    const reasonDistribution = {};

    for (const as of afterSales) {
      byType[as.type].count++;
      byType[as.type].amount += parseFloat(as.amount) || 0;
      byStatus[as.status]++;

      if (as.reason) {
        reasonDistribution[as.reason] = (reasonDistribution[as.reason] || 0) + 1;
      }
    }

    res.json({
      afterSales: afterSales.length,
      byType,
      byStatus,
      reasonDistribution,
      totalAmount: Object.values(byType).reduce((sum, t) => sum + t.amount, 0)
    });
  } catch (error) {
    console.error('Get after-sales analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;