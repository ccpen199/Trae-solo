const dayjs = require('dayjs');
const { User, Voucher, UserVoucher, EcoIncentiveLog, DeviceUsage } = require('../models');
const { generateVoucherCode } = require('../utils/order');

exports.getMyEcoStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    
    const recentLogs = await EcoIncentiveLog.find({ userId: req.user._id })
      .sort({ timestamp: -1 })
      .limit(20);

    const availableVouchers = await UserVoucher.find({
      userId: req.user._id,
      used: false,
      expiredAt: { $gt: new Date() },
    }).populate('voucherId', 'name voucherType discountValue discountRate maxDiscount minSpend deviceType');

    const streakInfo = await calculateStreakInfo(req.user._id);

    const nextReward = await getNextReward(user.streakDays || 0);

    res.json({
      success: true,
      data: {
        ecoPoints: user.ecoPoints || 0,
        streakDays: user.streakDays || 0,
        streakInfo,
        nextReward,
        availableVouchers: availableVouchers.map(uv => ({
          id: uv._id,
          code: uv.code,
          voucher: uv.voucherId,
          receivedAt: uv.receivedAt,
          expiredAt: uv.expiredAt,
        })),
        recentLogs,
      },
    });
  } catch (error) {
    next(error);
  }
};

const calculateStreakInfo = async (userId) => {
  const today = dayjs().startOf('day');
  
  const usages = await DeviceUsage.find({
    userId,
    status: 'completed',
    startTime: { $gte: today.subtract(30, 'day').toDate() },
  }).sort({ startTime: 1 });

  const usageDays = new Set();
  usages.forEach(u => {
    usageDays.add(dayjs(u.startTime).format('YYYY-MM-DD'));
  });

  let currentStreak = 0;
  for (let i = 0; i < 30; i++) {
    const checkDay = today.subtract(i, 'day').format('YYYY-MM-DD');
    if (usageDays.has(checkDay)) {
      currentStreak++;
    } else if (i > 0) {
      break;
    }
  }

  let longestStreak = 0;
  let tempStreak = 0;
  const sortedDays = Array.from(usageDays).sort();
  
  for (let i = 0; i < sortedDays.length; i++) {
    if (i === 0) {
      tempStreak = 1;
    } else {
      const prev = dayjs(sortedDays[i - 1]);
      const curr = dayjs(sortedDays[i]);
      if (curr.diff(prev, 'day') === 1) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }
  }
  longestStreak = Math.max(longestStreak, tempStreak);

  return {
    currentStreak,
    longestStreak,
    usageDays: usageDays.size,
    lastUseDate: usages.length > 0 ? usages[usages.length - 1].startTime : null,
  };
};

const getNextReward = async (currentStreak) => {
  const milestones = [
    { days: 7, reward: '5元水电券', type: 'voucher', value: 5 },
    { days: 14, reward: '10元水电券', type: 'voucher', value: 10 },
    { days: 30, reward: '30元水电券', type: 'voucher', value: 30 },
    { days: 60, reward: '80元水电券', type: 'voucher', value: 80 },
    { days: 100, reward: '150元水电券', type: 'voucher', value: 150 },
  ];

  const nextMilestone = milestones.find(m => m.days > currentStreak);
  
  if (!nextMilestone) {
    return {
      reachedMax: true,
      message: '恭喜你已达到最高连续使用奖励！',
    };
  }

  return {
    nextMilestone: nextMilestone.days,
    daysRemaining: nextMilestone.days - currentStreak,
    reward: nextMilestone.reward,
    type: nextMilestone.type,
    value: nextMilestone.value,
    progress: Math.round((currentStreak / nextMilestone.days) * 100),
  };
};

exports.checkAndAwardEcoRewards = async (userId, deviceType) => {
  const user = await User.findById(userId);
  if (!user) return;

  const streakInfo = await calculateStreakInfo(userId);
  const oldStreak = user.streakDays || 0;
  const newStreak = streakInfo.currentStreak;

  user.streakDays = newStreak;
  user.lastUseDate = new Date();
  user.ecoPoints = (user.ecoPoints || 0) + 10;

  const rewards = [];
  
  if (deviceType === 'washer' || deviceType === 'shower') {
    user.ecoPoints += 5;
  }

  await EcoIncentiveLog.create({
    userId,
    type: 'usage',
    deviceType,
    ecoPoints: 10,
    description: `使用${deviceType === 'washer' ? '洗衣机' : deviceType === 'dryer' ? '烘干机' : deviceType === 'water_dispenser' ? '饮水机' : '淋浴'}获得环保积分`,
  });

  if (deviceType === 'washer' || deviceType === 'shower') {
    await EcoIncentiveLog.create({
      userId,
      type: 'eco_points',
      deviceType,
      ecoPoints: 5,
      description: `低碳${deviceType === 'washer' ? '洗衣' : '淋浴'}额外环保积分`,
    });
  }

  await EcoIncentiveLog.create({
    userId,
    type: 'streak',
    streakDays: newStreak,
    description: `连续使用${newStreak}天`,
  });

  const streakMilestones = [7, 14, 30, 60, 100];
  const crossedMilestones = streakMilestones.filter(s => s > oldStreak && s <= newStreak);

  for (const milestone of crossedMilestones) {
    const voucher = await awardMilestoneVoucher(userId, milestone);
    if (voucher) {
      rewards.push({
        type: 'voucher',
        milestone,
        voucher,
      });
    }
  }

  await user.save();

  return rewards;
};

const awardMilestoneVoucher = async (userId, streakDays) => {
  const voucherValues = {
    7: 5,
    14: 10,
    30: 30,
    60: 80,
    100: 150,
  };

  const value = voucherValues[streakDays];
  if (!value) return null;

  let voucher = await Voucher.findOne({
    source: 'eco_incentive',
    'ecoCondition.streakDays': streakDays,
    status: 'active',
  });

  if (!voucher) {
    voucher = await Voucher.create({
      code: `ECO${streakDays}-${Date.now()}`,
      name: `连续${streakDays}天低碳奖励`,
      voucherType: 'amount',
      discountValue: value,
      minSpend: value * 2,
      deviceType: 'all',
      validity: {
        type: 'relative',
        daysAfterReceive: 30,
      },
      source: 'eco_incentive',
      ecoCondition: {
        streakDays,
        deviceType: 'washer',
      },
      totalQuantity: -1,
      issuedCount: 0,
      usedCount: 0,
      status: 'active',
    });
  }

  const userVoucher = await UserVoucher.create({
    userId,
    voucherId: voucher._id,
    code: generateVoucherCode(),
    used: false,
    receivedAt: new Date(),
    expiredAt: dayjs().add(30, 'day').toDate(),
    source: 'eco_incentive',
  });

  voucher.issuedCount++;
  await voucher.save();

  await EcoIncentiveLog.create({
    userId,
    type: 'voucher_awarded',
    streakDays,
    voucherId: voucher._id,
    description: `连续${streakDays}天低碳行为奖励${value}元水电券`,
  });

  return {
    id: userVoucher._id,
    code: userVoucher.code,
    name: voucher.name,
    value: voucher.discountValue,
    expiredAt: userVoucher.expiredAt,
  };
};

exports.claimVoucher = async (req, res, next) => {
  try {
    const { voucherId } = req.body;

    const voucher = await Voucher.findById(voucherId);
    if (!voucher || voucher.status !== 'active') {
      return res.status(400).json({ message: '优惠券不可用' });
    }

    if (voucher.source === 'eco_incentive' && voucher.ecoCondition) {
      const user = await User.findById(req.user._id);
      if ((user.streakDays || 0) < (voucher.ecoCondition.streakDays || 0)) {
        return res.status(400).json({ 
          message: `需要连续使用${voucher.ecoCondition.streak}天才能领取` 
        });
      }
      if ((user.ecoPoints || 0) < (voucher.ecoCondition.minPoints || 0)) {
        return res.status(400).json({ 
          message: `需要${voucher.ecoCondition.minPoints}环保积分才能领取` 
        });
      }
    }

    const existing = await UserVoucher.findOne({
      userId: req.user._id,
      voucherId,
      used: false,
      expiredAt: { $gt: new Date() },
    });

    if (existing) {
      return res.status(400).json({ message: '您已拥有该优惠券' });
    }

    if (voucher.limitPerUser) {
      const userCount = await UserVoucher.countDocuments({
        userId: req.user._id,
        voucherId,
      });
      if (userCount >= voucher.limitPerUser) {
        return res.status(400).json({ message: '领取已达上限' });
      }
    }

    if (voucher.totalQuantity > 0 && voucher.issuedCount >= voucher.totalQuantity) {
      return res.status(400).json({ message: '优惠券已领完' });
    }

    const userVoucher = await UserVoucher.create({
      userId: req.user._id,
      voucherId,
      code: generateVoucherCode(),
      used: false,
      receivedAt: new Date(),
      expiredAt: voucher.validity.type === 'relative' 
        ? dayjs().add(voucher.validity.daysAfterReceive || 30, 'day').toDate()
        : voucher.validity.endDate,
      source: voucher.source,
    });

    voucher.issuedCount++;
    await voucher.save();

    await EcoIncentiveLog.create({
      userId: req.user._id,
      type: 'voucher_claimed',
      voucherId: voucher._id,
      description: `领取优惠券: ${voucher.name}`,
    });

    res.json({
      success: true,
      data: {
        id: userVoucher._id,
        code: userVoucher.code,
        voucher: {
          id: voucher._id,
          name: voucher.name,
          type: voucher.voucherType,
          discountValue: voucher.discountValue,
          discountRate: voucher.discountRate,
          maxDiscount: voucher.maxDiscount,
          minSpend: voucher.minSpend,
          deviceType: voucher.deviceType,
        },
        expiredAt: userVoucher.expiredAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getMyVouchers = async (req, res, next) => {
  try {
    const { used } = req.query;

    const filter = { userId: req.user._id };
    if (used !== undefined) filter.used = used === 'true';

    const vouchers = await UserVoucher.find(filter)
      .populate('voucherId', 'name voucherType discountValue discountRate maxDiscount minSpend deviceType validity')
      .sort({ receivedAt: -1 });

    const now = new Date();
    const validVouchers = vouchers.filter(v => !v.used && v.expiredAt > now);
    const usedVouchers = vouchers.filter(v => v.used);
    const expiredVouchers = vouchers.filter(v => !v.used && v.expiredAt <= now);

    res.json({
      success: true,
      data: {
        valid: validVouchers,
        used: usedVouchers,
        expired: expiredVouchers,
        total: vouchers.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getAvailableVouchers = async (req, res, next) => {
  try {
    const { deviceType } = req.query;

    const user = await User.findById(req.user._id);

    const filter = {
      status: 'active',
      $or: [
        { deviceType: 'all' },
        deviceType ? { deviceType } : {},
      ],
    };

    const vouchers = await Voucher.find(filter)
      .sort({ sort: 1, createdAt: -1 });

    const availableVouchers = [];
    for (const voucher of vouchers) {
      let canClaim = true;
      let reason = '';

      if (voucher.applicableCommunities?.length > 0 && user.communityId) {
        if (!voucher.applicableCommunities.includes(user.communityId)) {
          canClaim = false;
          reason = '不适用于您的社区';
        }
      }

      if (voucher.ecoCondition && canClaim) {
        if (voucher.ecoCondition.streakDays && (user.streakDays || 0) < voucher.ecoCondition.streakDays) {
          canClaim = false;
          reason = `需要连续${voucher.ecoCondition.streakDays}天`;
        }
        if (voucher.ecoCondition.minPoints && (user.ecoPoints || 0) < voucher.ecoCondition.minPoints) {
          canClaim = false;
          reason = `需要${voucher.ecoCondition.minPoints}积分`;
        }
      }

      if (voucher.limitPerUser && canClaim) {
        const userCount = await UserVoucher.countDocuments({
          userId: req.user._id,
          voucherId: voucher._id,
        });
        if (userCount >= voucher.limitPerUser) {
          canClaim = false;
          reason = '已达到领取上限';
        }
      }

      if (voucher.totalQuantity > 0 && voucher.issuedCount >= voucher.totalQuantity && canClaim) {
        canClaim = false;
        reason = '已领完';
      }

      availableVouchers.push({
        ...voucher.toObject(),
        canClaim,
        reason,
        userStreak: user.streakDays || 0,
        userEcoPoints: user.ecoPoints || 0,
      });
    }

    res.json({
      success: true,
      data: availableVouchers,
    });
  } catch (error) {
    next(error);
  }
};

exports.getEcoLeaderboard = async (req, res, next) => {
  try {
    const { communityId, limit = 50 } = req.query;

    const filter = {};
    if (communityId) filter.communityId = communityId;

    const users = await User.find({ ...filter, status: 'active' })
      .sort({ streakDays: -1, ecoPoints: -1 })
      .limit(Number(limit))
      .select('nickname avatar streakDays ecoPoints communityId');

    const myRank = await User.countDocuments({
      ...filter,
      status: 'active',
      $or: [
        { streakDays: { $gt: req.user.streakDays || 0 } },
        { streakDays: req.user.streakDays || 0, ecoPoints: { $gt: req.user.ecoPoints || 0 } },
      ],
    }) + 1;

    res.json({
      success: true,
      data: {
        leaderboard: users.map((u, index) => ({
          rank: index + 1,
          userId: u._id,
          nickname: u.nickname,
          avatar: u.avatar,
          streakDays: u.streakDays || 0,
          ecoPoints: u.ecoPoints || 0,
        })),
        myRank,
        myStreakDays: req.user.streakDays || 0,
        myEcoPoints: req.user.ecoPoints || 0,
      },
    });
  } catch (error) {
    next(error);
  }
};
