const { db } = require('../database/init');

class UserCenterService {
  
  static calculateGrowth(payAmount, businessLineId) {
    const businessLine = db.prepare(`
      SELECT * FROM business_lines WHERE id = ? AND status = 1
    `).get(businessLineId);

    if (!businessLine) {
      throw new Error('业务线不存在或已停用');
    }

    const growthCoefficient = businessLine.growth_coefficient;
    const baseGrowth = Math.floor(payAmount / 100);
    const growthAmount = Math.floor(baseGrowth * growthCoefficient);

    return {
      baseGrowth,
      growthCoefficient,
      growthAmount,
      businessLineId,
      businessLineName: businessLine.name,
      businessLineCode: businessLine.code
    };
  }

  static recordGrowth(userId, orderId, businessLineId, growthAmount, growthCoefficient) {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    if (!user) {
      throw new Error('用户不存在');
    }

    const growthBefore = user.current_growth;
    const growthAfter = growthBefore + growthAmount;

    const expireDate = new Date();
    expireDate.setFullYear(expireDate.getFullYear() + 2);

    const result = db.prepare(`
      INSERT INTO growth_records (
        user_id, order_id, business_line_id, growth_amount,
        growth_before, growth_after, business_coefficient,
        expire_date, source_type, source_desc
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      userId, orderId, businessLineId, growthAmount,
      growthBefore, growthAfter, growthCoefficient,
      expireDate.toISOString(), 'consumption',
      `消费订单成长值累计`
    );

    const growthRecordId = result.lastInsertRowid;

    db.prepare(`
      INSERT INTO growth_expire_schedule (
        user_id, growth_record_id, expire_amount, expire_date
      ) VALUES (?, ?, ?, ?)
    `).run(userId, growthRecordId, growthAmount, expireDate.toISOString());

    db.prepare(`
      UPDATE users 
      SET total_growth = total_growth + ?, current_growth = current_growth + ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(growthAmount, growthAmount, userId);

    return {
      growthRecordId,
      userId,
      orderId,
      growthAmount,
      growthBefore,
      growthAfter,
      growthCoefficient,
      expireDate: expireDate.toISOString()
    };
  }

  static determineLevel(currentGrowth) {
    const levels = db.prepare(`
      SELECT * FROM user_levels 
      WHERE status = 1 
      ORDER BY min_growth DESC
    `).all();

    for (const level of levels) {
      if (currentGrowth >= level.min_growth) {
        if (level.max_growth === null || currentGrowth <= level.max_growth) {
          return level;
        }
      }
    }

    return db.prepare('SELECT * FROM user_levels WHERE min_growth = 0 AND status = 1').get();
  }

  static checkAndUpgradeLevel(userId) {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    if (!user) {
      throw new Error('用户不存在');
    }

    const currentLevel = db.prepare('SELECT * FROM user_levels WHERE id = ?').get(user.current_level_id);
    const newLevel = this.determineLevel(user.current_growth);

    if (!currentLevel || newLevel.id !== currentLevel.id) {
      db.prepare(`
        UPDATE users 
        SET current_level_id = ?, level_upgrade_time = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(newLevel.id, userId);

      return {
        upgraded: true,
        userId,
        oldLevelId: currentLevel?.id,
        oldLevelName: currentLevel?.name,
        newLevelId: newLevel.id,
        newLevelName: newLevel.name,
        currentGrowth: user.current_growth
      };
    }

    return {
      upgraded: false,
      userId,
      currentLevelId: currentLevel.id,
      currentLevelName: currentLevel.name,
      currentGrowth: user.current_growth
    };
  }

  static getUserInfo(userId) {
    const user = db.prepare(`
      SELECT u.*, ul.name as level_name, ul.code as level_code, 
             ul.min_growth, ul.max_growth, ul.description as level_description,
             ul.icon as level_icon, ul.color as level_color
      FROM users u
      LEFT JOIN user_levels ul ON u.current_level_id = ul.id
      WHERE u.id = ?
    `).get(userId);

    if (!user) {
      return null;
    }

    const nextLevel = db.prepare(`
      SELECT * FROM user_levels 
      WHERE min_growth > ? AND status = 1
      ORDER BY min_growth ASC
      LIMIT 1
    `).get(user.current_growth);

    let progressToNext = null;
    if (nextLevel) {
      const currentMin = user.min_growth || 0;
      const nextMin = nextLevel.min_growth;
      const progress = user.current_growth - currentMin;
      const needed = nextMin - currentMin;
      progressToNext = {
        nextLevelName: nextLevel.name,
        nextLevelMin: nextMin,
        currentProgress: progress,
        neededForNext: Math.max(0, nextMin - user.current_growth),
        progressPercent: Math.min(100, (progress / needed) * 100)
      };
    }

    return {
      user,
      progressToNext
    };
  }

  static getLevelPrivileges(levelId) {
    return db.prepare(`
      SELECT lp.*, p.name as privilege_name, p.code as privilege_code,
             p.description as privilege_description, p.privilege_type,
             p.discount_value, p.discount_unit
      FROM level_privileges lp
      JOIN privileges p ON lp.privilege_id = p.id
      WHERE lp.level_id = ? AND lp.is_visible = 1 AND p.status = 1
      ORDER BY p.id
    `).all(levelId);
  }

  static getAllLevelsWithPrivileges() {
    const levels = db.prepare(`
      SELECT * FROM user_levels WHERE status = 1 ORDER BY min_growth
    `).all();

    return levels.map(level => ({
      ...level,
      privileges: this.getLevelPrivileges(level.id)
    }));
  }

  static getBusinessLineDiscounts(userId, businessLineId) {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    if (!user) {
      throw new Error('用户不存在');
    }

    const userLevelId = user.current_level_id;
    
    const discount = db.prepare(`
      SELECT bld.*, ul.name as level_name, ul.code as level_code, bl.name as business_name
      FROM business_line_discounts bld
      JOIN user_levels ul ON bld.level_id = ul.id
      JOIN business_lines bl ON bld.business_line_id = bl.id
      WHERE bld.business_line_id = ? AND bld.level_id = ? AND bld.status = 1
    `).get(businessLineId, userLevelId);

    if (!discount) {
      return {
        hasDiscount: false,
        userId,
        businessLineId,
        userLevelId,
        discountPercent: 1.0,
        discountAmount: 0
      };
    }

    return {
      hasDiscount: true,
      ...discount,
      discountPercent: discount.discount_percent
    };
  }

  static calculateLevelDiscount(originalAmount, discountInfo) {
    if (!discountInfo.hasDiscount) {
      return {
        discountAmount: 0,
        discountPercent: 1.0,
        finalAmount: originalAmount
      };
    }

    const discountPercent = discountInfo.discountPercent;
    let discountAmount = Math.floor(originalAmount * (1 - discountPercent));

    if (discountInfo.max_discount_amount && discountAmount > discountInfo.max_discount_amount) {
      discountAmount = discountInfo.max_discount_amount;
    }

    return {
      discountAmount,
      discountPercent,
      maxDiscountAmount: discountInfo.max_discount_amount,
      finalAmount: originalAmount - discountAmount
    };
  }

  static getUserGrowthRecords(userId, limit = 20) {
    return db.prepare(`
      SELECT gr.*, bl.name as business_name, bl.code as business_code
      FROM growth_records gr
      LEFT JOIN business_lines bl ON gr.business_line_id = bl.id
      WHERE gr.user_id = ?
      ORDER BY gr.created_at DESC
      LIMIT ?
    `).all(userId, limit);
  }

  static getExpiringGrowth(userId) {
    const now = new Date();
    const threeMonthsLater = new Date();
    threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3);

    return db.prepare(`
      SELECT ges.*, gr.created_at as earned_at
      FROM growth_expire_schedule ges
      JOIN growth_records gr ON ges.growth_record_id = gr.id
      WHERE ges.user_id = ? AND ges.is_expired = 0
        AND ges.expire_date <= ?
      ORDER BY ges.expire_date ASC
    `).all(userId, threeMonthsLater.toISOString());
  }

  static getRetentionStrategy(levelId) {
    const level = db.prepare('SELECT * FROM user_levels WHERE id = ?').get(levelId);
    if (!level) return null;

    const strategies = {
      1: {
        levelName: '小骆驼',
        strategy: '保持每月至少1笔消费，即可维持等级',
        minConsumptionPerPeriod: 1,
        periodMonths: 1,
        downgradeLevel: null
      },
      2: {
        levelName: '铜骆驼',
        strategy: '连续3个月无消费将降为小骆驼',
        minConsumptionPerPeriod: 1,
        periodMonths: 3,
        downgradeLevel: 1
      },
      3: {
        levelName: '银骆驼',
        strategy: '连续6个月无消费将降为铜骆驼',
        minConsumptionPerPeriod: 1,
        periodMonths: 6,
        downgradeLevel: 2
      },
      4: {
        levelName: '金骆驼',
        strategy: '连续12个月无消费将降为银骆驼',
        minConsumptionPerPeriod: 1,
        periodMonths: 12,
        downgradeLevel: 3
      }
    };

    return strategies[levelId] || strategies[1];
  }

  static getOperationStats(months = 3) {
    const dateMonthsAgo = new Date();
    dateMonthsAgo.setMonth(dateMonthsAgo.getMonth() - months);

    const newLevelUsers = db.prepare(`
      SELECT COUNT(*) as count FROM users 
      WHERE level_upgrade_time >= ?
    `).get(dateMonthsAgo.toISOString()).count;

    const pointsDistributed = db.prepare(`
      SELECT ABS(SUM(points)) as total FROM point_transactions 
      WHERE created_at >= ? AND trans_type = 'award'
    `).get(dateMonthsAgo.toISOString()).total || 0;

    const privilegeUsage = db.prepare(`
      SELECT COUNT(*) as count FROM privilege_usage 
      WHERE created_at >= ?
    `).get(dateMonthsAgo.toISOString()).count;

    const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
    const totalOrders = db.prepare(`
      SELECT COUNT(*) as count FROM orders WHERE created_at >= ?
    `).get(dateMonthsAgo.toISOString()).count;

    return {
      periodMonths: months,
      newLevelUsers,
      pointsDistributed,
      privilegeUsage,
      totalUsers,
      totalOrders,
      pointsPerOrder: totalOrders > 0 ? Math.round(pointsDistributed / totalOrders) : 0
    };
  }

  static processGrowthFromOrder(orderId) {
    const order = db.prepare(`
      SELECT o.*, bl.growth_coefficient
      FROM orders o
      JOIN business_lines bl ON o.business_line_id = bl.id
      WHERE o.id = ?
    `).get(orderId);

    if (!order) {
      throw new Error('订单不存在');
    }
    if (order.status !== 'paid') {
      throw new Error('订单未支付，无法计算成长值');
    }

    const growthCalc = this.calculateGrowth(order.pay_amount, order.business_line_id);
    
    if (growthCalc.growthAmount > 0) {
      const growthRecord = this.recordGrowth(
        order.user_id, 
        orderId, 
        order.business_line_id, 
        growthCalc.growthAmount, 
        growthCalc.growthCoefficient
      );

      const upgradeResult = this.checkAndUpgradeLevel(order.user_id);

      return {
        success: true,
        growthCalculation: growthCalc,
        growthRecord,
        upgradeResult
      };
    }

    return {
      success: false,
      message: '支付金额不足以产生成长值',
      growthCalculation: growthCalc
    };
  }
}

module.exports = UserCenterService;
