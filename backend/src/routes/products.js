const express = require('express');
const { ServiceProduct, ServiceProvider } = require('../models');
const { authMiddleware, adminOnly } = require('../middleware/auth');

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  const { category, providerId, status, page = 1, pageSize = 20 } = req.query;
  const where = {};
  if (category) where.category = category;
  if (providerId) where.provider_id = providerId;
  if (status) where.status = status;

  try {
    const limit = parseInt(pageSize, 10);
    const offset = (parseInt(page, 10) - 1) * limit;
    const { rows, count } = await ServiceProduct.findAndCountAll({
      where,
      limit,
      offset,
      include: [{ model: ServiceProvider, as: 'provider', required: false }],
      order: [['created_at', 'DESC']],
    });
    res.json({ list: rows.map(mapProduct), total: count, page: parseInt(page, 10), pageSize: limit });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'merchant') {
    return res.status(403).json({ error: '仅服务商或管理员可创建产品' });
  }

  const { providerId, name, category, skuCode, price, originalPrice, description, spec } = req.body;
  try {
    const product = await ServiceProduct.create({
      provider_id: providerId,
      name,
      category,
      sku_code: skuCode,
      price,
      original_price: originalPrice,
      description,
      spec: typeof spec === 'object' ? JSON.stringify(spec) : spec,
    });
    res.status(201).json(mapProduct(product));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const product = await ServiceProduct.findByPk(req.params.id);
    if (!product) return res.status(404).json({ error: '产品不存在' });
    res.json(mapProduct(product));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'merchant') {
    return res.status(403).json({ error: '仅服务商或管理员可修改产品' });
  }

  try {
    const product = await ServiceProduct.findByPk(req.params.id);
    if (!product) return res.status(404).json({ error: '产品不存在' });

    const { name, price, originalPrice, description, spec, status } = req.body;
    await product.update({
      name: name !== undefined ? name : product.name,
      price: price !== undefined ? price : product.price,
      original_price: originalPrice !== undefined ? originalPrice : product.original_price,
      description: description !== undefined ? description : product.description,
      spec: spec !== undefined ? (typeof spec === 'object' ? JSON.stringify(spec) : spec) : product.spec,
      status: status !== undefined ? status : product.status,
    });
    res.json(mapProduct(product));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function mapProduct(row) {
  const p = typeof row.toJSON === 'function' ? row.toJSON() : row;
  return {
    ...p,
    providerId: p.provider_id,
    providerName: p.provider?.name,
    skuCode: p.sku_code,
    originalPrice: p.original_price,
    createdAt: p.created_at,
    updatedAt: p.updated_at,
  };
}

module.exports = router;
