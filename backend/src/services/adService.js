const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');
const { Advertiser, AdCampaign, AdMaterial, AdDelivery } = require('../models');
const { User } = require('../models');
const { UserProfile } = require('../models');
const { AdReconciliation } = require('../models');
const logger = require('../utils/logger');
const { redisClient } = require('../config/redis');

const AD_VERSION = 'v1.0.0';
const AD_CONFIG = {
  adPositions: [3, 7, 11, 15],
  maxAdsPerFeed: 4,
  adRatio: 0.1,
  ctrWeight: 0.5,
  bidWeight: 0.3,
  relevanceWeight: 0.2,
  budgetThreshold: 0.1
};

const generateDeliveryId = () => {
  return `AD-${Date.now()}-${uuidv4().substring(0, 12)}`;
};

const getActiveCampaigns = async () => {
  const now = new Date();
  
  return AdCampaign.findAll({
    where: {
      status: 'active',
      startTime: { [Op.lte]: now },
      [Op.or]: [
        { endTime: { [Op.gte]: now } },
        { endTime: null }
      ]
    },
    include: [
      {
        model: Advertiser,
        as: 'advertiser',
        where: { status: 'active' },
        required: true
      },
      {
        model: AdMaterial,
        as: 'materials',
        where: { status: 'active' },
        required: true
      }
    ]
  });
};

const checkBudgetAvailable = async (campaign, bidPrice) => {
  const advertiser = await Advertiser.findByPk(campaign.advertiserId);
  
  if (!advertiser || advertiser.balance < bidPrice) {
    return false;
  }
  
  if (campaign.budget > 0 && campaign.spentAmount + bidPrice > campaign.budget) {
    return false;
  }
  
  if (campaign.dailyBudget > 0) {
    const today = new Date().toISOString().split('T')[0];
    const todaySpent = await AdDelivery.sum('cost', {
      where: {
        campaignId: campaign.id,
        createdAt: {
          [Op.gte]: new Date(today),
          [Op.lt]: new Date(today + 'T23:59:59')
        }
      }
    }) || 0;
    
    if (todaySpent + bidPrice > campaign.dailyBudget) {
      return false;
    }
  }
  
  return true;
};

const calculateAdRelevance = (material, campaign, userProfile) => {
  if (!userProfile) return 0.5;
  
  let relevance = 0.5;
  
  if (userProfile.interests && campaign.targetAudience?.interests) {
    const userInterests = Object.keys(userProfile.interests);
    const targetInterests = campaign.targetAudience.interests;
    
    const matches = userInterests.filter(i => targetInterests.includes(i));
    if (matches.length > 0) {
      relevance += 0.2 * (matches.length / targetInterests.length);
    }
  }
  
  if (material.semanticTags && userProfile.interests) {
    const materialTags = material.semanticTags || [];
    const userInterests = Object.keys(userProfile.interests);
    
    const matches = materialTags.filter(t => userInterests.includes(t));
    if (matches.length > 0) {
      relevance += 0.15 * (matches.length / Math.min(materialTags.length, 5));
    }
  }
  
  return Math.min(relevance, 1);
};

const calculateAdScore = (material, campaign, userProfile, historicalCtr = 0) => {
  const ctrScore = historicalCtr > 0 ? Math.min(historicalCtr * 10, 1) : 0.3;
  const bidScore = campaign.maxBid > 0 ? Math.min(campaign.maxBid / 10, 1) : 0.3;
  const relevanceScore = calculateAdRelevance(material, campaign, userProfile);
  
  const totalScore = 
    ctrScore * AD_CONFIG.ctrWeight +
    bidScore * AD_CONFIG.bidWeight +
    relevanceScore * AD_CONFIG.relevanceWeight;
  
  return {
    score: totalScore,
    ctrScore,
    bidScore,
    relevanceScore,
    bidPrice: campaign.maxBid
  };
};

const selectAdsForFeed = async (userId, feedSize, userProfile, options = {}) => {
  const { requestId = null, sessionId = null, userIp = null } = options;
  
  try {
    const activeCampaigns = await getActiveCampaigns();
    
    if (activeCampaigns.length === 0) {
      logger.info('没有活跃的广告活动');
      return [];
    }
    
    const adCandidates = [];
    
    for (const campaign of activeCampaigns) {
      for (const material of campaign.materials) {
        const isBudgetAvailable = await checkBudgetAvailable(campaign, campaign.maxBid);
        
        if (!isBudgetAvailable) continue;
        
        const historicalCtr = material.totalImpressions > 0 
          ? material.totalClicks / material.totalImpressions 
          : 0;
        
        const scoreResult = calculateAdScore(
          material, 
          campaign, 
          userProfile, 
          historicalCtr
        );
        
        adCandidates.push({
          campaign,
          material,
          advertiser: campaign.advertiser,
          ...scoreResult
        });
      }
    }
    
    adCandidates.sort((a, b) => b.score - a.score);
    
    const adCount = Math.min(
      AD_CONFIG.maxAdsPerFeed,
      Math.floor(feedSize * AD_CONFIG.adRatio)
    );
    
    const selectedAds = adCandidates.slice(0, adCount);
    const adDeliveries = [];
    
    for (let i = 0; i < selectedAds.length; i++) {
      const candidate = selectedAds[i];
      const deliveryId = generateDeliveryId();
      const position = AD_CONFIG.adPositions[i] || i * 4 + 3;
      
      const delivery = await AdDelivery.create({
        deliveryId,
        userId,
        materialId: candidate.material.id,
        campaignId: candidate.campaign.id,
        advertiserId: candidate.advertiser.id,
        position,
        displayPosition: candidate.material.displayPosition,
        bidPrice: candidate.bidPrice,
        matchScore: candidate.score,
        isImpressed: false,
        isClicked: false,
        cost: 0,
        sessionId,
        requestId,
        userIp
      });
      
      adDeliveries.push({
        ...delivery.toJSON(),
        type: 'ad',
        material: {
          id: candidate.material.id,
          title: candidate.material.title,
          description: candidate.material.description,
          adType: candidate.material.adType,
          imageUrl: candidate.material.imageUrl,
          videoUrl: candidate.material.videoUrl,
          landingUrl: candidate.material.landingUrl,
          displayPosition: candidate.material.displayPosition
        },
        campaign: {
          id: candidate.campaign.id,
          name: candidate.campaign.name
        },
        advertiser: {
          id: candidate.advertiser.id,
          companyName: candidate.advertiser.companyName
        }
      });
    }
    
    logger.info('广告选择完成', {
      userId,
      totalCandidates: adCandidates.length,
      selectedCount: adDeliveries.length
    });
    
    return adDeliveries;
  } catch (error) {
    logger.error('广告选择失败', error);
    throw error;
  }
};

const mergeAdsIntoFeed = (recommendations, ads) => {
  const mergedFeed = [...recommendations];
  
  const sortedAds = [...ads].sort((a, b) => a.position - b.position);
  
  for (const ad of sortedAds) {
    const insertPosition = Math.min(ad.position, mergedFeed.length);
    mergedFeed.splice(insertPosition, 0, ad);
  }
  
  return mergedFeed.map((item, index) => ({
    ...item,
    feedPosition: index + 1
  }));
};

const markAdImpressed = async (deliveryId) => {
  const delivery = await AdDelivery.findOne({
    where: { deliveryId }
  });
  
  if (!delivery) {
    throw new Error('广告分发记录不存在');
  }
  
  if (delivery.isImpressed) {
    return delivery;
  }
  
  await delivery.update({
    isImpressed: true,
    impressedAt: new Date()
  });
  
  const material = await AdMaterial.findByPk(delivery.materialId);
  if (material) {
    await material.increment('totalImpressions');
  }
  
  logger.info('广告曝光记录', {
    deliveryId,
    materialId: delivery.materialId,
    campaignId: delivery.campaignId
  });
  
  return delivery;
};

const markAdClicked = async (deliveryId, userIp, userAgent) => {
  const delivery = await AdDelivery.findOne({
    where: { deliveryId },
    include: [
      { association: 'material' },
      { association: 'campaign' },
      { association: 'advertiser' }
    ]
  });
  
  if (!delivery) {
    throw new Error('广告分发记录不存在');
  }
  
  if (delivery.isClicked) {
    return delivery;
  }
  
  const cost = delivery.bidPrice;
  const advertiser = delivery.advertiser;
  const campaign = delivery.campaign;
  const material = delivery.material;
  
  if (advertiser.balance < cost) {
    throw new Error('广告主余额不足');
  }
  
  await delivery.update({
    isClicked: true,
    clickedAt: new Date(),
    cost,
    userIp,
    userAgent
  });
  
  await advertiser.decrement('balance', { by: cost });
  await advertiser.increment('totalCost', { by: cost });
  
  await campaign.increment('spentAmount', { by: cost });
  await material.increment('totalClicks');
  await material.increment('totalCost', { by: cost });
  
  logger.info('广告点击记录', {
    deliveryId,
    cost,
    materialId: delivery.materialId,
    advertiserId: delivery.advertiserId
  });
  
  return delivery;
};

const getAdStats = async (advertiserId, options = {}) => {
  const { campaignId, startDate, endDate, groupBy = 'day' } = options;
  
  const where = { advertiserId };
  
  if (campaignId) {
    where.campaignId = campaignId;
  }
  if (startDate) {
    where.createdAt = { ...where.createdAt, [Op.gte]: startDate };
  }
  if (endDate) {
    where.createdAt = { ...where.createdAt, [Op.lte]: endDate };
  }
  
  const totalImpressions = await AdDelivery.count({
    where: { ...where, isImpressed: true }
  });
  
  const totalClicks = await AdDelivery.count({
    where: { ...where, isClicked: true }
  });
  
  const totalCost = await AdDelivery.sum('cost', { where }) || 0;
  
  const ctr = totalImpressions > 0 ? totalClicks / totalImpressions : 0;
  const avgCpc = totalClicks > 0 ? totalCost / totalClicks : 0;
  const avgCpm = totalImpressions > 0 ? (totalCost / totalImpressions) * 1000 : 0;
  
  return {
    totalImpressions,
    totalClicks,
    totalCost: parseFloat(totalCost.toFixed(2)),
    ctr: parseFloat(ctr.toFixed(4)),
    avgCpc: parseFloat(avgCpc.toFixed(4)),
    avgCpm: parseFloat(avgCpm.toFixed(4))
  };
};

const createReconciliation = async (advertiserId, date) => {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  const where = {
    advertiserId,
    createdAt: { [Op.between]: [startOfDay, endOfDay] }
  };
  
  const impressions = await AdDelivery.count({
    where: { ...where, isImpressed: true }
  });
  
  const clicks = await AdDelivery.count({
    where: { ...where, isClicked: true }
  });
  
  const cost = await AdDelivery.sum('cost', { where }) || 0;
  
  const ctr = impressions > 0 ? clicks / impressions : 0;
  
  return AdReconciliation.create({
    advertiserId,
    date,
    totalImpressions: impressions,
    totalClicks: clicks,
    ctr: parseFloat(ctr.toFixed(4)),
    totalCost: parseFloat(cost.toFixed(2)),
    systemRecorded: { impressions, clicks, cost },
    status: 'pending'
  });
};

module.exports = {
  AD_VERSION,
  AD_CONFIG,
  generateDeliveryId,
  getActiveCampaigns,
  checkBudgetAvailable,
  calculateAdRelevance,
  calculateAdScore,
  selectAdsForFeed,
  mergeAdsIntoFeed,
  markAdImpressed,
  markAdClicked,
  getAdStats,
  createReconciliation
};
