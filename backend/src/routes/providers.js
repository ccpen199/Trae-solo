const express = require('express');
const { ServiceProvider } = require('../models');
const { authMiddleware, adminOnly } = require('../middleware/auth');

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  const { status, category, page = 1, pageSize = 20 } = req.query;
  const where = {};
  if (status) where.status = status;
  if (category) where.category = category;

  try {
    const limit = parseInt(pageSize, 10);
    const offset = (parseInt(page, 10) - 1) * limit;
    const { rows, count } = await ServiceProvider.findAndCountAll({
      where,
      limit,
      offset,
      order: [['created_at', 'DESC']],
    });
    res.json({ list: rows.map(mapProvider), total: count, page: parseInt(page, 10), pageSize: limit });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  const { name, licenseNo, category, categoryDetail, settlementCycle, contactName, contactPhone, remark } = req.body;
  try {
    const provider = await ServiceProvider.create({
      name,
      license_no: licenseNo,
      category,
      category_detail: categoryDetail,
      settlement_cycle: settlementCycle || 'monthly',
      contact_name: contactName,
      contact_phone: contactPhone,
      remark,
    });
    res.status(201).json(mapProvider(provider));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const provider = await ServiceProvider.findByPk(req.params.id);
    if (!provider) return res.status(404).json({ error: '服务商不存在' });
    res.json(mapProvider(provider));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id/audit', authMiddleware, adminOnly, async (req, res) => {
  const status = req.body.status || req.body.result;
  const { remark } = req.body;
  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: '审核状态必须为 approved 或 rejected' });
  }

  try {
    const provider = await ServiceProvider.findByPk(req.params.id);
    if (!provider) return res.status(404).json({ error: '服务商不存在' });

    await provider.update({
      status,
      audit_by: req.user.userId,
      audit_at: new Date(),
      remark: remark !== undefined ? remark : provider.remark,
    });
    res.json(mapProvider(provider));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function mapProvider(row) {
  const p = typeof row.toJSON === 'function' ? row.toJSON() : row;
  return {
    ...p,
    licenseNo: p.license_no,
    categoryDetail: p.category_detail,
    settlementCycle: p.settlement_cycle,
    contactName: p.contact_name,
    contactPhone: p.contact_phone,
    auditBy: p.audit_by,
    auditAt: p.audit_at,
    createdAt: p.created_at,
    updatedAt: p.updated_at,
  };
}

module.exports = router;
