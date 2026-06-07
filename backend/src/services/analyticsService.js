const { Order, Engineer, Part, Fault } = require('../models');
const { Op, fn, col, literal } = require('sequelize');

class AnalyticsService {
  async getDashboardStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalOrders, todayOrders, pendingOrders, totalEngineers, totalRevenue] = await Promise.all([
      Order.count(),
      Order.count({ where: { created_at: { [Op.gte]: today } } }),
      Order.count({ where: { status: { [Op.lt]: 4 } } }),
      Engineer.count({ where: { status: 1 } }),
      Order.sum('total_cost', { where: { status: 5 } })
    ]);

    return {
      totalOrders,
      todayOrders,
      pendingOrders,
      totalEngineers,
      totalRevenue: totalRevenue || 0
    };
  }

  async getEngineerRadar(engineerId) {
    const engineer = await Engineer.findByPk(engineerId);
    if (!engineer) return null;

    return {
      name: engineer.name,
      indicators: [
        { name: '技能覆盖', value: 85 },
        { name: '维修成功率', value: parseFloat(engineer.success_rate) },
        { name: '用户评分', value: parseFloat(engineer.avg_rating) * 20 },
        { name: '响应速度', value: 88 },
        { name: '配件利用率', value: 76 }
      ]
    };
  }

  async getFaultHeatmapData() {
    const faults = await Order.findAll({
      attributes: [
        'actual_fault_code',
        [fn('COUNT', col('id')), 'count'],
        [literal("CASE WHEN actual_fault_code LIKE 'BAT%' THEN '电池故障' WHEN actual_fault_code LIKE 'SCR%' THEN '屏幕故障' WHEN actual_fault_code LIKE 'CHG%' THEN '充电故障' WHEN actual_fault_code LIKE 'CAM%' THEN '相机故障' WHEN actual_fault_code LIKE 'BRD%' THEN '主板故障' WHEN actual_fault_code LIKE 'SPK%' THEN '音频故障' ELSE '其他' END"), 'category']
      ],
      where: {
        actual_fault_code: { [Op.not]: null }
      },
      group: ['actual_fault_code', 'category'],
      raw: true
    });

    const categoryMap = {};
    faults.forEach(f => {
      if (!categoryMap[f.category]) categoryMap[f.category] = 0;
      categoryMap[f.category] += parseInt(f.count);
    });

    return Object.entries(categoryMap).map(([name, value]) => ({ name, value }));
  }

  async getPartsForecast() {
    const parts = await Part.findAll({
      attributes: ['id', 'sku', 'name', 'quantity', 'min_stock', 'price'],
      order: [['quantity', 'ASC']],
      limit: 10
    });

    return parts.map(p => ({
      id: p.id,
      sku: p.sku,
      name: p.name,
      currentStock: p.quantity,
      minStock: p.min_stock,
      forecastDemand: Math.ceil(p.min_stock * 1.5),
      price: p.price,
      status: p.quantity < p.min_stock ? 'warning' : 'normal'
    }));
  }

  async getOrderTrend(days = 7) {
    const result = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const count = await Order.count({
        where: {
          created_at: {
            [Op.gte]: date,
            [Op.lt]: nextDate
          }
        }
      });

      result.push({
        date: date.toISOString().split('T')[0],
        orders: count
      });
    }
    return result;
  }

  async getEngineerPerformanceList() {
    const engineers = await Engineer.findAll({
      attributes: ['id', 'name', 'certificate_level', 'success_rate', 'avg_rating', 'total_orders', 'service_radius']
    });

    return engineers.map(e => ({
      id: e.id,
      name: e.name,
      certificateLevel: e.certificate_level,
      successRate: e.success_rate,
      avgRating: e.avg_rating,
      totalOrders: e.total_orders,
      serviceRadius: e.service_radius
    }));
  }
}

module.exports = new AnalyticsService();
