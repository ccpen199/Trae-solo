const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { Enterprise, User, MonitorPoint, ViolationEvent } = require('../models');
const complianceModelEngine = require('../engines/ComplianceModelEngine');
const { v4: uuidv4 } = require('uuid');

router.get('/', async (req, res) => {
  try {
    const { status, industryType, complianceStatus, page = 1, pageSize = 20 } = req.query;
    const where = {};

    if (status) where.status = status;
    if (industryType) where.industryType = industryType;
    if (complianceStatus) where.complianceStatus = complianceStatus;

    const { count, rows } = await Enterprise.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: parseInt(pageSize),
      offset: (parseInt(page) - 1) * parseInt(pageSize),
    });

    res.json({ success: true, data: { total: count, page: parseInt(page), pageSize: parseInt(pageSize), data: rows } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { code, name, industryType, address, latitude, longitude, legalPerson, contactPhone } = req.body;

    const existing = await Enterprise.findOne({ where: { code } });
    if (existing) {
      return res.status(400).json({ success: false, error: '企业编码已存在' });
    }

    const enterprise = await Enterprise.create({
      id: uuidv4(),
      code,
      name,
      industryType,
      address,
      latitude,
      longitude,
      legalPerson,
      contactPhone,
      creditScore: 100,
      complianceStatus: 'compliant',
      status: 'active',
    });

    res.json({ success: true, data: enterprise });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/ranking', async (req, res) => {
  try {
    const { type = 'all', limit = 20 } = req.query;

    const result = await complianceModelEngine.getComplianceRanking(type, parseInt(limit));
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/stats/industry', async (req, res) => {
  try {
    const { industryType } = req.query;

    const result = await complianceModelEngine.getIndustryComplianceStats(industryType);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/stats/compliance', async (req, res) => {
  try {
    const stats = await Enterprise.findAll({
      attributes: ['complianceStatus', [require('sequelize').fn('COUNT', '*'), 'count']],
      group: ['complianceStatus'],
      raw: true,
    });

    const result = {};
    stats.forEach(s => {
      result[s.complianceStatus] = parseInt(s.count);
    });

    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/batch-evaluate', async (req, res) => {
  try {
    const { enterpriseIds, days = 90 } = req.body;

    if (!enterpriseIds || !Array.isArray(enterpriseIds)) {
      return res.status(400).json({ success: false, error: '请提供企业ID数组' });
    }

    const result = await complianceModelEngine.batchEvaluate(enterpriseIds, { days: parseInt(days) });
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const enterprise = await Enterprise.findByPk(id);

    if (!enterprise) {
      return res.status(404).json({ success: false, error: '企业不存在' });
    }

    res.json({ success: true, data: enterprise });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, industryType, address, latitude, longitude, legalPerson, contactPhone, status } = req.body;

    const enterprise = await Enterprise.findByPk(id);
    if (!enterprise) {
      return res.status(404).json({ success: false, error: '企业不存在' });
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (industryType !== undefined) updateData.industryType = industryType;
    if (address !== undefined) updateData.address = address;
    if (latitude !== undefined) updateData.latitude = latitude;
    if (longitude !== undefined) updateData.longitude = longitude;
    if (legalPerson !== undefined) updateData.legalPerson = legalPerson;
    if (contactPhone !== undefined) updateData.contactPhone = contactPhone;
    if (status !== undefined) updateData.status = status;

    await enterprise.update(updateData);
    res.json({ success: true, data: enterprise });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:id/monitor-points', async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, pageSize = 20 } = req.query;

    const { count, rows } = await MonitorPoint.findAndCountAll({
      where: { enterpriseId: id },
      order: [['createdAt', 'DESC']],
      limit: parseInt(pageSize),
      offset: (parseInt(page) - 1) * parseInt(pageSize),
    });

    res.json({ success: true, data: { total: count, page: parseInt(page), pageSize: parseInt(pageSize), data: rows } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:id/violations', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, page = 1, pageSize = 20 } = req.query;

    const where = { enterpriseId: id };
    if (status) where.status = status;

    const { count, rows } = await ViolationEvent.findAndCountAll({
      where,
      include: [
        { model: MonitorPoint, as: 'monitorPoint' },
      ],
      order: [['triggeredAt', 'DESC']],
      limit: parseInt(pageSize),
      offset: (parseInt(page) - 1) * parseInt(pageSize),
    });

    res.json({ success: true, data: { total: count, page: parseInt(page), pageSize: parseInt(pageSize), data: rows } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/:id/evaluate', async (req, res) => {
  try {
    const { id } = req.params;
    const { days = 90 } = req.body;

    const result = await complianceModelEngine.evaluateEnterprise(id, { days: parseInt(days) });
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:id/history', async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 10 } = req.query;

    const result = await complianceModelEngine.getEnterpriseHistory(id, parseInt(limit));
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
