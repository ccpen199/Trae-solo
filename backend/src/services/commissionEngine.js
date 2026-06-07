import db from '../db/index.js';

export const calculateRiderFee = (order, riderId) => {
  const riderStats = db.prepare(`SELECT level, total_orders FROM rider_stats WHERE user_id = ?`).get(riderId);
  if (!riderStats) return order.base_fee * 0.75;

  const commissionRule = db.prepare(`SELECT * FROM commission_rules WHERE level = ?`).get(riderStats.level);
  if (!commissionRule) return order.base_fee * 0.75;

  const hourOfDay = new Date().getHours();
  const isPeakHour = (hourOfDay >= 11 && hourOfDay <= 13) || (hourOfDay >= 17 && hourOfDay <= 19);

  const baseRate = isPeakHour ? commissionRule.peak_hour_rate : commissionRule.base_rate;
  const bonusRate = commissionRule.bonus_rate;

  const baseFee = (order.base_fee || 0) * baseRate;
  const tipFee = (order.tip_fee || 0) * 0.95;
  const incentiveFee = order.incentive_fee || 0;
  const bonusFee = (order.base_fee || 0) * bonusRate;

  const totalRiderFee = Math.round((baseFee + tipFee + incentiveFee + bonusFee) * 100) / 100;

  return {
    riderFee: totalRiderFee,
    breakdown: {
      baseFee: Math.round(baseFee * 100) / 100,
      tipFee: Math.round(tipFee * 100) / 100,
      incentiveFee: Math.round(incentiveFee * 100) / 100,
      bonusFee: Math.round(bonusFee * 100) / 100,
      baseRate,
      bonusRate,
      isPeakHour,
      riderLevel: riderStats.level
    }
  };
};

export const getCommissionRules = () => {
  return db.prepare(`SELECT * FROM commission_rules ORDER BY level ASC`).all();
};
