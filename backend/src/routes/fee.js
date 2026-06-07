const express = require('express');
const { FeeConfig, ServiceProvider } = require('../models');
const { authMiddleware, adminOnly } = require('../middleware/auth');

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  const { category, providerId, page = 1, pageSize = 20 } = req.query;
  const where = {};
  if (category) where.category = category;
  if (providerId) where.provider_id = providerId;

  try {
    const limit = parseInt(pageSize, 10);
    const offset = (parseInt(page, 10) - 1) * limit;
    const { rows, count } = await FeeConfig.findAndCountAll({
      where,
      limit,
      offset,
      include: [{ model: ServiceProvider, as: 'provider', required: false }],
      order: [['created_at', 'DESC']],
    });
    res.json({ list: rows.map(mapFee), total: count, page: parseInt(page, 10), pageSize: limit });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authMiddleware, adminOnly, async (req, res) => {
  const { category, providerId, feeRate, minFee, maxFee, effectiveDate, status } = req.body;
  try {
    const config = await FeeConfig.create({
      category,
      provider_id: providerId || null,
      fee_rate: normalizeRate(feeRate),
      min_fee: minFee || 0,
      max_fee: maxFee || 0,
      effective_date: effectiveDate,
      status: status || 'active',
    });
    res.status(201).json(mapFee(config));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const config = await FeeConfig.findByPk(req.params.id);
    if (!config) return res.status(404).json({ error: '费率配置不存在' });

    const { category, providerId, feeRate, minFee, maxFee, effectiveDate, status } = req.body;
    await config.update({
      category: category !== undefined ? category : config.category,
      provider_id: providerId !== undefined ? providerId : config.provider_id,
      fee_rate: feeRate !== undefined ? normalizeRate(feeRate) : config.fee_rate,
      min_fee: minFee !== undefined ? minFee : config.min_fee,
      max_fee: maxFee !== undefined ? maxFee : config.max_fee,
      effective_date: effectiveDate !== undefined ? effectiveDate : config.effective_date,
      status: status !== undefined ? status : config.status,
    });
    res.json(mapFee(config));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function mapFee(row) {
  const f = typeof row.toJSON === 'function' ? row.toJSON() : row;
  return {
    ...f,
    providerId: f.provider_id,
    providerName: f.provider?.name,
    feeRate: Number(f.fee_rate) * 100,
    minFee: f.min_fee,
    maxFee: f.max_fee,
    effectiveDate: f.effective_date,
    createdAt: f.created_at,
    updatedAt: f.updated_at,
  };
}

function normalizeRate(value) {
  const numeric = Number(value || 0);
  return numeric > 1 ? numeric / 100 : numeric;
}

module.exports = router;
