const { ServiceProvider, ServiceProduct, FeeConfig } = require('../models');

const SETTLEMENT_PRIORITY = { daily: 1, weekly: 2, monthly: 3 };

async function findBestProvider(category, city) {
  const providers = await ServiceProvider.findAll({
    where: { category, status: 'approved' },
    include: [
      { model: ServiceProduct, as: 'products', where: { status: 'on_sale' }, required: false, attributes: ['id'] },
      { model: FeeConfig, as: 'feeConfigs', where: { status: 'active' }, required: false, attributes: ['fee_rate'] },
    ],
  });

  if (!providers.length) return null;

  const ranked = providers.map((p) => {
    const productCount = p.products ? p.products.length : 0;
    const lowestFeeRate = p.feeConfigs && p.feeConfigs.length
      ? Math.min(...p.feeConfigs.map((f) => parseFloat(f.fee_rate)))
      : Infinity;
    return {
      provider: p,
      settlementScore: SETTLEMENT_PRIORITY[p.settlement_cycle] || 3,
      feeRate: lowestFeeRate,
      productCount,
    };
  });

  ranked.sort((a, b) => {
    if (a.settlementScore !== b.settlementScore) return a.settlementScore - b.settlementScore;
    if (a.feeRate !== b.feeRate) return a.feeRate - b.feeRate;
    return b.productCount - a.productCount;
  });

  return ranked[0].provider;
}

async function routeRequest(category, city, payload) {
  const provider = await findBestProvider(category, city);
  if (!provider) {
    return { success: false, message: `未找到可用的服务提供商 (category: ${category})` };
  }
  return {
    success: true,
    providerId: provider.id,
    providerName: provider.name,
    settlementCycle: provider.settlement_cycle,
    category,
    city,
    payload,
  };
}

module.exports = { findBestProvider, routeRequest };
