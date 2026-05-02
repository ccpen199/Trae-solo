const { all, run } = require('../config/database');

class PromotionEngine {
  static getActivePromotions() {
    return new Promise((resolve, reject) => {
      try {
        const promotions = all(
          `SELECT * FROM promotions 
           WHERE is_active = 1 
           AND (start_time IS NULL OR start_time <= CURRENT_TIMESTAMP)
           AND (end_time IS NULL OR end_time >= CURRENT_TIMESTAMP)`
        );
        resolve(promotions);
      } catch (err) {
        reject(err);
      }
    });
  }

  static calculateDiscount(basePrice, promotions = []) {
    let finalPrice = basePrice;
    let appliedPromotions = [];

    for (const promo of promotions) {
      let discountAmount = 0;
      
      switch (promo.discount_type) {
        case 'percentage':
          discountAmount = basePrice * (promo.discount_value / 100);
          break;
        case 'fixed':
          discountAmount = promo.discount_value;
          break;
        default:
          continue;
      }

      finalPrice = Math.max(0, finalPrice - discountAmount);
      appliedPromotions.push({
        id: promo.id,
        name: promo.promotion_name,
        code: promo.promotion_code,
        discountAmount
      });
    }

    return {
      basePrice,
      finalPrice,
      totalDiscount: basePrice - finalPrice,
      appliedPromotions
    };
  }

  static applyPromotionsToPrice(basePrice, promoCodes = []) {
    return new Promise(async (resolve, reject) => {
      try {
        const activePromos = await this.getActivePromotions();
        const applicablePromos = activePromos.filter(p => 
          promoCodes.includes(p.promotion_code) || !p.promotion_code
        );
        
        const result = this.calculateDiscount(basePrice, applicablePromos);
        resolve(result);
      } catch (err) {
        reject(err);
      }
    });
  }

  static createPromotion(promotionData) {
    return new Promise((resolve, reject) => {
      try {
        const result = run(
          `INSERT INTO promotions 
           (promotion_name, promotion_code, promotion_type, discount_value, discount_type, start_time, end_time, is_active)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            promotionData.name,
            promotionData.code,
            promotionData.type,
            promotionData.discountValue,
            promotionData.discountType,
            promotionData.startTime,
            promotionData.endTime,
            promotionData.isActive !== undefined ? promotionData.isActive : 1
          ]
        );
        
        resolve({
          id: result.lastInsertRowid,
          ...promotionData
        });
      } catch (err) {
        reject(err);
      }
    });
  }
}

module.exports = PromotionEngine;
