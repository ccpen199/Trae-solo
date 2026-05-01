const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { AppError } = require('../middleware/errorHandler');
const adService = require('../services/adService');
const { Advertiser, AdCampaign, AdMaterial, AdDelivery } = require('../models');

router.get('/advertiser/profile', authenticate, authorize('advertiser', 'admin'), async (req, res, next) => {
  try {
    const advertiser = await Advertiser.findOne({
      where: { userId: req.user.id },
      include: [
        { association: 'user', attributes: ['id', 'username', 'email', 'phone'] }
      ]
    });
    
    if (!advertiser) {
      throw new AppError('广告主信息不存在', 404);
    }
    
    res.json({
      success: true,
      data: {
        advertiser
      }
    });
  } catch (error) {
    next(error);
  }
});

router.put('/advertiser/profile', authenticate, authorize('advertiser', 'admin'), async (req, res, next) => {
  try {
    const { companyName, industry, contactPerson, contactPhone } = req.body;
    
    let advertiser = await Advertiser.findOne({
      where: { userId: req.user.id }
    });
    
    const updateData = {};
    if (companyName !== undefined) updateData.companyName = companyName;
    if (industry !== undefined) updateData.industry = industry;
    if (contactPerson !== undefined) updateData.contactPerson = contactPerson;
    if (contactPhone !== undefined) updateData.contactPhone = contactPhone;
    
    if (advertiser) {
      await advertiser.update(updateData);
    } else {
      advertiser = await Advertiser.create({
        userId: req.user.id,
        companyName: companyName || req.user.username,
        ...updateData
      });
    }
    
    res.json({
      success: true,
      message: '广告主信息更新成功',
      data: {
        advertiser
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/campaigns', authenticate, authorize('advertiser', 'operator', 'admin'), async (req, res, next) => {
  try {
    const { status, page = 1, pageSize = 20 } = req.query;
    
    const where = {};
    if (req.user.role === 'advertiser') {
      const advertiser = await Advertiser.findOne({ where: { userId: req.user.id } });
      if (advertiser) {
        where.advertiserId = advertiser.id;
      }
    }
    if (status) {
      where.status = status;
    }
    
    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    
    const { count, rows } = await AdCampaign.findAndCountAll({
      where,
      include: [
        { association: 'advertiser', attributes: ['id', 'companyName'] },
        { association: 'materials', attributes: ['id', 'title', 'status'] }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(pageSize),
      offset
    });
    
    res.json({
      success: true,
      data: {
        campaigns: rows,
        pagination: {
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          total: count,
          totalPages: Math.ceil(count / parseInt(pageSize))
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

router.post('/campaigns', authenticate, authorize('advertiser', 'operator', 'admin'), async (req, res, next) => {
  try {
    const {
      name,
      description,
      budget,
      dailyBudget,
      startTime,
      endTime,
      targetAudience,
      bidStrategy,
      maxBid,
      autoBid
    } = req.body;
    
    if (!name || !startTime) {
      throw new AppError('活动名称和开始时间不能为空', 400);
    }
    
    let advertiserId;
    if (req.user.role === 'advertiser') {
      const advertiser = await Advertiser.findOne({ where: { userId: req.user.id } });
      if (!advertiser) {
        throw new AppError('请先完善广告主信息', 400);
      }
      advertiserId = advertiser.id;
    } else {
      advertiserId = req.body.advertiserId;
      if (!advertiserId) {
        throw new AppError('请选择广告主', 400);
      }
    }
    
    const campaign = await AdCampaign.create({
      advertiserId,
      name,
      description,
      budget: budget || 0,
      dailyBudget: dailyBudget || 0,
      spentAmount: 0,
      status: 'draft',
      startTime: new Date(startTime),
      endTime: endTime ? new Date(endTime) : null,
      targetAudience: targetAudience || {},
      bidStrategy: bidStrategy || 'cpc',
      maxBid: maxBid || 0,
      autoBid: autoBid || false
    });
    
    res.status(201).json({
      success: true,
      message: '推广活动创建成功',
      data: {
        campaign
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/campaigns/:id', authenticate, authorize('advertiser', 'operator', 'admin'), async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const campaign = await AdCampaign.findByPk(id, {
      include: [
        { association: 'advertiser', attributes: ['id', 'companyName', 'balance'] },
        { association: 'materials' }
      ]
    });
    
    if (!campaign) {
      throw new AppError('推广活动不存在', 404);
    }
    
    const stats = await adService.getAdStats(campaign.advertiserId, {
      campaignId: campaign.id
    });
    
    res.json({
      success: true,
      data: {
        campaign,
        stats
      }
    });
  } catch (error) {
    next(error);
  }
});

router.put('/campaigns/:id', authenticate, authorize('advertiser', 'operator', 'admin'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      budget,
      dailyBudget,
      startTime,
      endTime,
      targetAudience,
      bidStrategy,
      maxBid,
      autoBid,
      status
    } = req.body;
    
    const campaign = await AdCampaign.findByPk(id);
    
    if (!campaign) {
      throw new AppError('推广活动不存在', 404);
    }
    
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (budget !== undefined) updateData.budget = budget;
    if (dailyBudget !== undefined) updateData.dailyBudget = dailyBudget;
    if (startTime !== undefined) updateData.startTime = new Date(startTime);
    if (endTime !== undefined) updateData.endTime = endTime ? new Date(endTime) : null;
    if (targetAudience !== undefined) updateData.targetAudience = targetAudience;
    if (bidStrategy !== undefined) updateData.bidStrategy = bidStrategy;
    if (maxBid !== undefined) updateData.maxBid = maxBid;
    if (autoBid !== undefined) updateData.autoBid = autoBid;
    if (status !== undefined) updateData.status = status;
    
    await campaign.update(updateData);
    
    res.json({
      success: true,
      message: '推广活动更新成功',
      data: {
        campaign
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/materials', authenticate, authorize('advertiser', 'operator', 'admin'), async (req, res, next) => {
  try {
    const { campaignId, status, page = 1, pageSize = 20 } = req.query;
    
    const where = {};
    if (campaignId) where.campaignId = campaignId;
    if (status) where.status = status;
    
    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    
    const { count, rows } = await AdMaterial.findAndCountAll({
      where,
      include: [
        { association: 'campaign', attributes: ['id', 'name', 'status'] }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(pageSize),
      offset
    });
    
    res.json({
      success: true,
      data: {
        materials: rows,
        pagination: {
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          total: count,
          totalPages: Math.ceil(count / parseInt(pageSize))
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

router.post('/materials', authenticate, authorize('advertiser', 'operator', 'admin'), async (req, res, next) => {
  try {
    const {
      campaignId,
      title,
      description,
      adType,
      imageUrl,
      videoUrl,
      landingUrl,
      displayPosition,
      weight
    } = req.body;
    
    if (!campaignId || !title || !landingUrl) {
      throw new AppError('活动ID、标题和落地页URL不能为空', 400);
    }
    
    const material = await AdMaterial.create({
      campaignId,
      title,
      description,
      adType: adType || 'native',
      imageUrl,
      videoUrl,
      landingUrl,
      displayPosition: displayPosition || 'feed_mid',
      status: 'draft',
      weight: weight || 1,
      totalImpressions: 0,
      totalClicks: 0,
      totalCost: 0
    });
    
    res.status(201).json({
      success: true,
      message: '广告素材创建成功',
      data: {
        material
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/deliveries', authenticate, authorize('advertiser', 'operator', 'admin'), async (req, res, next) => {
  try {
    const { campaignId, materialId, startDate, endDate, page = 1, pageSize = 20 } = req.query;
    
    const where = {};
    if (campaignId) where.campaignId = campaignId;
    if (materialId) where.materialId = materialId;
    if (startDate) where.createdAt = { ...where.createdAt, $gte: new Date(startDate) };
    if (endDate) where.createdAt = { ...where.createdAt, $lte: new Date(endDate) };
    
    if (req.user.role === 'advertiser') {
      const advertiser = await Advertiser.findOne({ where: { userId: req.user.id } });
      if (advertiser) {
        where.advertiserId = advertiser.id;
      }
    }
    
    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    
    const { count, rows } = await AdDelivery.findAndCountAll({
      where,
      include: [
        { association: 'material', attributes: ['id', 'title'] },
        { association: 'campaign', attributes: ['id', 'name'] }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(pageSize),
      offset
    });
    
    res.json({
      success: true,
      data: {
        deliveries: rows,
        pagination: {
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          total: count,
          totalPages: Math.ceil(count / parseInt(pageSize))
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/reconciliations', authenticate, authorize('advertiser', 'operator', 'admin'), async (req, res, next) => {
  try {
    const { startDate, endDate, status, page = 1, pageSize = 20 } = req.query;
    
    const where = {};
    if (status) where.status = status;
    if (startDate) where.date = { ...where.date, $gte: startDate };
    if (endDate) where.date = { ...where.date, $lte: endDate };
    
    if (req.user.role === 'advertiser') {
      const advertiser = await Advertiser.findOne({ where: { userId: req.user.id } });
      if (advertiser) {
        where.advertiserId = advertiser.id;
      }
    }
    
    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    
    const { count, rows } = await AdReconciliation.findAndCountAll({
      where,
      order: [['date', 'DESC']],
      limit: parseInt(pageSize),
      offset
    });
    
    res.json({
      success: true,
      data: {
        reconciliations: rows,
        pagination: {
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          total: count,
          totalPages: Math.ceil(count / parseInt(pageSize))
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/stats', authenticate, authorize('advertiser', 'operator', 'admin'), async (req, res, next) => {
  try {
    const { startDate, endDate, campaignId } = req.query;
    
    let advertiserId;
    if (req.user.role === 'advertiser') {
      const advertiser = await Advertiser.findOne({ where: { userId: req.user.id } });
      if (advertiser) {
        advertiserId = advertiser.id;
      }
    } else {
      advertiserId = req.query.advertiserId;
    }
    
    if (!advertiserId) {
      throw new AppError('请指定广告主', 400);
    }
    
    const stats = await adService.getAdStats(advertiserId, {
      campaignId,
      startDate,
      endDate
    });
    
    res.json({
      success: true,
      data: {
        stats
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
