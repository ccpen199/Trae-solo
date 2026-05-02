import Order from '../models/Order.js';
import SKU from '../models/SKU.js';
import Shop from '../models/Shop.js';
import Cost from '../models/Cost.js';
import Log from '../models/Log.js';
import { Op } from 'sequelize';

class ProfitEngine {
  constructor() {
    this.platformFeeRates = {
      amazon: 0.15,
      ebay: 0.10,
      shopify: 0.02,
      tiktok: 0.08
    };

    this.defaultShippingCost = 5.00;
  }

  async aggregateOrderCosts(orderId) {
    const order = await Order.findByPk(orderId, {
      include: [
        { model: Shop, as: 'shop' },
        { model: SKU, as: 'skus' }
      ]
    });

    if (!order) {
      throw new Error('Order not found');
    }

    const existingCosts = await Cost.findAll({
      where: {
        related_type: 'order',
        related_id: orderId
      }
    });

    if (existingCosts.length > 0) {
      return existingCosts;
    }

    const costs = [];

    for (const item of order.items) {
      if (item.sku_id) {
        const sku = await SKU.findByPk(item.sku_id);
        if (sku) {
          const purchaseCost = parseFloat(sku.cost) * item.quantity;

          costs.push(await Cost.create({
            type: 'purchase',
            amount: purchaseCost,
            currency: order.currency,
            related_type: 'order',
            related_id: orderId,
            description: `Purchase cost for ${sku.sku_code}`,
            cost_date: new Date()
          }));
        }
      }
    }

    costs.push(await Cost.create({
      type: 'shipping',
      amount: this.defaultShippingCost,
      currency: order.currency,
      related_type: 'order',
      related_id: orderId,
      description: 'Shipping cost',
      cost_date: new Date()
    }));

    if (order.shop) {
      const platformFeeRate = this.platformFeeRates[order.shop.platform] || 0.10;
      const platformFee = parseFloat(order.total_amount) * platformFeeRate;

      costs.push(await Cost.create({
        type: 'platform_fee',
        amount: platformFee,
        currency: order.currency,
        related_type: 'order',
        related_id: orderId,
        description: `${order.shop.platform} platform fee`,
        cost_date: new Date()
      }));
    }

    return costs;
  }

  async calculateOrderProfit(orderId) {
    const order = await Order.findByPk(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    const costs = await this.aggregateOrderCosts(orderId);

    const totalCost = costs.reduce((sum, cost) => sum + parseFloat(cost.amount), 0);
    const revenue = parseFloat(order.total_amount);
    const profit = revenue - totalCost;
    const profitMargin = revenue > 0 ? (profit / revenue) * 100 : 0;

    return {
      orderId,
      platformOrderId: order.platform_order_id,
      revenue,
      costs: costs.map(c => ({
        type: c.type,
        amount: parseFloat(c.amount)
      })),
      totalCost,
      profit,
      profitMargin: profitMargin.toFixed(2)
    };
  }

  async generateProfitReport(startDate, endDate, groupBy = 'day') {
    const whereClause = {
      created_at: {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      }
    };

    const orders = await Order.findAll({
      where: {
        ...whereClause,
        status: { [Op.notIn]: ['cancelled', 'pending'] }
      },
      include: [{ model: Shop, as: 'shop' }]
    });

    const costs = await Cost.findAll({
      where: {
        cost_date: {
          [Op.between]: [new Date(startDate), new Date(endDate)]
        }
      }
    });

    let totalRevenue = 0;
    const revenueByGroup = {};
    let totalCost = 0;
    const costByType = {};

    for (const order of orders) {
      const revenue = parseFloat(order.total_amount);
      totalRevenue += revenue;

      const groupKey = this.getGroupKey(order.created_at, groupBy);
      revenueByGroup[groupKey] = (revenueByGroup[groupKey] || 0) + revenue;
    }

    for (const cost of costs) {
      const amount = parseFloat(cost.amount);
      totalCost += amount;
      costByType[cost.type] = (costByType[cost.type] || 0) + amount;
    }

    const totalProfit = totalRevenue - totalCost;
    const overallMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    const groupedData = this.groupData(revenueByGroup, groupBy);

    return {
      summary: {
        totalRevenue,
        totalCost,
        totalProfit,
        overallMargin: overallMargin.toFixed(2),
        orderCount: orders.length
      },
      costBreakdown: costByType,
      groupedRevenue: groupedData,
      period: {
        startDate,
        endDate,
        groupBy
      }
    };
  }

  getGroupKey(date, groupBy) {
    const d = new Date(date);
    switch (groupBy) {
      case 'day':
        return d.toISOString().split('T')[0];
      case 'week':
        const weekStart = new Date(d);
        weekStart.setDate(d.getDate() - d.getDay());
        return weekStart.toISOString().split('T')[0];
      case 'month':
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      case 'year':
        return String(d.getFullYear());
      default:
        return d.toISOString().split('T')[0];
    }
  }

  groupData(revenueByGroup, groupBy) {
    return Object.entries(revenueByGroup).map(([key, revenue]) => ({
      period: key,
      revenue,
      cost: revenue * 0.6,
      profit: revenue * 0.4
    }));
  }

  async calculateSKUProfit(skuId, startDate, endDate) {
    const sku = await SKU.findByPk(skuId);
    if (!sku) {
      throw new Error('SKU not found');
    }

    const orders = await Order.findAll({
      where: {
        created_at: {
          [Op.between]: [new Date(startDate), new Date(endDate)]
        },
        status: { [Op.notIn]: ['cancelled', 'pending'] }
      }
    });

    let totalSold = 0;
    let totalRevenue = 0;
    let totalCost = 0;

    for (const order of orders) {
      for (const item of order.items) {
        if (item.sku_id === skuId || item.sku_code === sku.sku_code) {
          const quantity = item.quantity || 1;
          const price = parseFloat(item.price) || 0;
          const itemCost = parseFloat(sku.cost) || 0;

          totalSold += quantity;
          totalRevenue += price * quantity;
          totalCost += itemCost * quantity;
        }
      }
    }

    const totalProfit = totalRevenue - totalCost;
    const margin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    return {
      sku,
      period: { startDate, endDate },
      metrics: {
        totalSold,
        totalRevenue,
        totalCost,
        totalProfit,
        margin: margin.toFixed(2)
      }
    };
  }

  async calculateShopProfit(shopId, startDate, endDate) {
    const shop = await Shop.findByPk(shopId);
    if (!shop) {
      throw new Error('Shop not found');
    }

    const orders = await Order.findAll({
      where: {
        shop_id: shopId,
        created_at: {
          [Op.between]: [new Date(startDate), new Date(endDate)]
        },
        status: { [Op.notIn]: ['cancelled', 'pending'] }
      }
    });

    let totalRevenue = 0;
    const revenueByStatus = {};

    for (const order of orders) {
      const amount = parseFloat(order.total_amount);
      totalRevenue += amount;
      revenueByStatus[order.status] = (revenueByStatus[order.status] || 0) + amount;
    }

    const costs = await Cost.findAll({
      where: {
        related_type: 'order',
        related_id: orders.map(o => o.id)
      }
    });

    let totalCost = 0;
    const costByType = {};

    for (const cost of costs) {
      const amount = parseFloat(cost.amount);
      totalCost += amount;
      costByType[cost.type] = (costByType[cost.type] || 0) + amount;
    }

    const totalProfit = totalRevenue - totalCost;
    const margin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    return {
      shop,
      period: { startDate, endDate },
      metrics: {
        orderCount: orders.length,
        totalRevenue,
        totalCost,
        totalProfit,
        margin: margin.toFixed(2)
      },
      revenueByStatus,
      costByType
    };
  }

  async calculateDailyProfits() {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const orders = await Order.findAll({
      where: {
        created_at: {
          [Op.between]: [startOfDay, endOfDay]
        },
        status: { [Op.notIn]: ['cancelled', 'pending'] }
      }
    });

    let totalRevenue = 0;
    let totalCost = 0;

    for (const order of orders) {
      totalRevenue += parseFloat(order.total_amount);

      const costs = await this.aggregateOrderCosts(order.id);
      for (const cost of costs) {
        totalCost += parseFloat(cost.amount);
      }
    }

    const totalProfit = totalRevenue - totalCost;

    await Log.create({
      type: 'operation',
      action: 'daily_profit_calculation',
      message: `Daily profit calculated: Revenue $${totalRevenue}, Cost $${totalCost}, Profit $${totalProfit}`,
      details: {
        date: startOfDay.toISOString().split('T')[0],
        revenue: totalRevenue,
        cost: totalCost,
        profit: totalProfit,
        orderCount: orders.length
      }
    });

    return {
      date: startOfDay.toISOString().split('T')[0],
      revenue: totalRevenue,
      cost: totalCost,
      profit: totalProfit,
      orderCount: orders.length
    };
  }
}

export { ProfitEngine };