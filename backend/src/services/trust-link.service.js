const db = require('../config/database');
const auditService = require('./audit.service');

const TRUST_RULES = {
  ORDER_COMPLETE: {
    buyer: { amount: 10, minScore: 0, maxScore: 1000 },
    seller: { amount: 15, minScore: 0, maxScore: 1000 }
  },
  REVIEW_POSITIVE: { amount: 20, minScore: 0, maxScore: 1000 },
  REVIEW_NEGATIVE: { amount: -30, minScore: 0, maxScore: 1000 },
  DISPUTE_WON: { amount: 10, minScore: 0, maxScore: 1000 },
  DISPUTE_LOST: { amount: -50, minScore: 0, maxScore: 1000 },
  FRAUD_DETECTED: { amount: -100, minScore: 0, maxScore: 1000 },
  CANCEL_ORDER_SELLER: { amount: -20, minScore: 0, maxScore: 1000 },
  CANCEL_ORDER_BUYER: { amount: -5, minScore: 0, maxScore: 1000 },
  PRODUCT_APPROVED: { amount: 5, minScore: 0, maxScore: 1000 },
  PRODUCT_REJECTED: { amount: -10, minScore: 0, maxScore: 1000 }
};

const TRUST_LEVELS = {
  POOR: { name: 'poor', min: 0, max: 399, label: '较差' },
  NORMAL: { name: 'normal', min: 400, max: 699, label: '一般' },
  GOOD: { name: 'good', min: 700, max: 899, label: '良好' },
  EXCELLENT: { name: 'excellent', min: 900, max: 1000, label: '优秀' }
};

class TrustLinkService {
  constructor() {
    this.defaultScore = parseInt(process.env.TRUST_DEFAULT_SCORE) || 600;
    this.maxScore = parseInt(process.env.TRUST_MAX_SCORE) || 1000;
    this.minScore = parseInt(process.env.TRUST_MIN_SCORE) || 0;
  }

  getTrustLevel(score) {
    if (score >= TRUST_LEVELS.EXCELLENT.min) return TRUST_LEVELS.EXCELLENT;
    if (score >= TRUST_LEVELS.GOOD.min) return TRUST_LEVELS.GOOD;
    if (score >= TRUST_LEVELS.NORMAL.min) return TRUST_LEVELS.NORMAL;
    return TRUST_LEVELS.POOR;
  }

  calculateChange(user, rule, role = null) {
    let ruleConfig;
    
    if (role && rule[role]) {
      ruleConfig = rule[role];
    } else {
      ruleConfig = rule;
    }

    if (!ruleConfig) {
      return { amount: 0, beforeScore: user.trust_score, afterScore: user.trust_score };
    }

    const beforeScore = user.trust_score;
    let afterScore = beforeScore + ruleConfig.amount;
    
    afterScore = Math.max(ruleConfig.minScore, Math.min(ruleConfig.maxScore, afterScore));
    
    const actualChange = afterScore - beforeScore;

    return {
      amount: actualChange,
      beforeScore,
      afterScore
    };
  }

  async updateTrustScore(userId, changeType, options = {}) {
    const { orderId = null, reviewId = null, disputeId = null, reason = null, actor = null } = options;
    
    const rule = TRUST_RULES[changeType];
    if (!rule) {
      throw new Error(`未知的信任分变更类型: ${changeType}`);
    }

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    if (!user) {
      throw new Error(`用户不存在: ${userId}`);
    }

    const role = changeType === 'ORDER_COMPLETE' ? (options.role || 'buyer') : null;
    const change = this.calculateChange(user, rule, role);

    if (change.amount !== 0) {
      const trustLevel = this.getTrustLevel(change.afterScore);
      
      const updateStmt = db.prepare(`
        UPDATE users SET trust_score = ?, trust_level = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);
      updateStmt.run(change.afterScore, trustLevel.name, userId);

      const logStmt = db.prepare(`
        INSERT INTO trust_score_logs (
          user_id, order_id, review_id, dispute_id, change_type,
          change_amount, before_score, after_score, reason
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      logStmt.run(
        userId, orderId, reviewId, disputeId, changeType,
        change.amount, change.beforeScore, change.afterScore, reason
      );

      auditService.logUpdate({
        user: actor,
        module: auditService.MODULES.USER,
        resourceType: 'user',
        resourceId: userId,
        oldValue: { trust_score: change.beforeScore },
        newValue: { trust_score: change.afterScore },
        description: `信任分变更: ${changeType}, 变更量: ${change.amount}`
      });
    }

    return {
      userId,
      changeType,
      changeAmount: change.amount,
      beforeScore: change.beforeScore,
      afterScore: change.afterScore,
      trustLevel: this.getTrustLevel(change.afterScore)
    };
  }

  onOrderComplete(orderId, actor = null) {
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
    if (!order) {
      throw new Error(`订单不存在: ${orderId}`);
    }

    const buyerResult = this.updateTrustScore(order.buyer_id, 'ORDER_COMPLETE', {
      orderId,
      role: 'buyer',
      reason: '交易完成，买家获得信任分',
      actor
    });

    const sellerResult = this.updateTrustScore(order.seller_id, 'ORDER_COMPLETE', {
      orderId,
      role: 'seller',
      reason: '交易完成，卖家获得信任分',
      actor
    });

    return { buyer: buyerResult, seller: sellerResult };
  }

  onReviewCreated(reviewId, actor = null) {
    const review = db.prepare('SELECT * FROM reviews WHERE id = ?').get(reviewId);
    if (!review) {
      throw new Error(`评价不存在: ${reviewId}`);
    }

    let changeType;
    if (review.rating >= 4) {
      changeType = 'REVIEW_POSITIVE';
    } else if (review.rating <= 2) {
      changeType = 'REVIEW_NEGATIVE';
    } else {
      return { changed: false, reason: '中性评价不影响信任分' };
    }

    const result = this.updateTrustScore(review.reviewee_id, changeType, {
      reviewId,
      reason: `收到${review.rating >= 4 ? '好评' : '差评'}，信任分变更`,
      actor
    });

    return { changed: true, ...result };
  }

  onDisputeResolved(disputeId, winnerId, loserId, actor = null) {
    if (winnerId) {
      this.updateTrustScore(winnerId, 'DISPUTE_WON', {
        disputeId,
        reason: '纠纷胜诉，获得信任分奖励',
        actor
      });
    }

    if (loserId) {
      this.updateTrustScore(loserId, 'DISPUTE_LOST', {
        disputeId,
        reason: '纠纷败诉，扣除信任分',
        actor
      });
    }

    return { winnerId, loserId };
  }

  onFraudDetected(userId, reason, actor = null) {
    return this.updateTrustScore(userId, 'FRAUD_DETECTED', {
      reason: `检测到欺诈行为: ${reason}`,
      actor
    });
  }

  onProductApproved(sellerId, productId, actor = null) {
    return this.updateTrustScore(sellerId, 'PRODUCT_APPROVED', {
      reason: '商品审核通过',
      actor
    });
  }

  onProductRejected(sellerId, productId, actor = null) {
    return this.updateTrustScore(sellerId, 'PRODUCT_REJECTED', {
      reason: '商品审核未通过',
      actor
    });
  }

  onOrderCancelled(orderId, cancellerRole, actor = null) {
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
    if (!order) {
      throw new Error(`订单不存在: ${orderId}`);
    }

    const userId = cancellerRole === 'seller' ? order.seller_id : order.buyer_id;
    const changeType = cancellerRole === 'seller' ? 'CANCEL_ORDER_SELLER' : 'CANCEL_ORDER_BUYER';

    return this.updateTrustScore(userId, changeType, {
      orderId,
      reason: `${cancellerRole === 'seller' ? '卖家' : '买家'}取消订单`,
      actor
    });
  }

  getUserTrustHistory(userId, limit = 50) {
    return db.prepare(`
      SELECT 
        t.*,
        o.order_no,
        r.rating as review_rating
      FROM trust_score_logs t
      LEFT JOIN orders o ON t.order_id = o.id
      LEFT JOIN reviews r ON t.review_id = r.id
      WHERE t.user_id = ?
      ORDER BY t.created_at DESC
      LIMIT ?
    `).all(userId, limit);
  }

  getTrustStats(userId) {
    const user = db.prepare('SELECT id, trust_score, trust_level FROM users WHERE id = ?').get(userId);
    if (!user) {
      return null;
    }

    const history = this.getUserTrustHistory(userId, 100);
    
    const positiveChanges = history.filter(h => h.change_amount > 0).length;
    const negativeChanges = history.filter(h => h.change_amount < 0).length;
    
    const level = this.getTrustLevel(user.trust_score);

    return {
      userId: user.id,
      trustScore: user.trust_score,
      trustLevel: user.trust_level,
      trustLevelLabel: level.label,
      totalChanges: history.length,
      positiveChanges,
      negativeChanges,
      nextLevel: this.getNextLevelInfo(user.trust_score)
    };
  }

  getNextLevelInfo(currentScore) {
    const currentLevel = this.getTrustLevel(currentScore);
    
    if (currentLevel.name === 'excellent') {
      return { name: 'excellent', label: '已达到最高等级', pointsNeeded: 0 };
    }

    const levels = [TRUST_LEVELS.POOR, TRUST_LEVELS.NORMAL, TRUST_LEVELS.GOOD, TRUST_LEVELS.EXCELLENT];
    const currentIndex = levels.findIndex(l => l.name === currentLevel.name);
    const nextLevel = levels[currentIndex + 1];

    return {
      name: nextLevel.name,
      label: nextLevel.label,
      pointsNeeded: nextLevel.min - currentScore
    };
  }
}

module.exports = new TrustLinkService();
module.exports.TRUST_RULES = TRUST_RULES;
module.exports.TRUST_LEVELS = TRUST_LEVELS;
