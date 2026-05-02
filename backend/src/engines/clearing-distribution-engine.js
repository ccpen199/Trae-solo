import db from '../config/database.js';
import eventStore, { EventTypes, AggregateTypes } from '../core/event-store.js';

const FeeRules = {
  purchase: {
    tiers: [
      { minAmount: 0, maxAmount: 10000, rate: 0.015 },
      { minAmount: 10000, maxAmount: 50000, rate: 0.012 },
      { minAmount: 50000, maxAmount: 100000, rate: 0.010 },
      { minAmount: 100000, maxAmount: 500000, rate: 0.008 },
      { minAmount: 500000, maxAmount: Infinity, rate: 0.005 },
    ]
  },
  redemption: {
    tiers: [
      { minDays: 0, maxDays: 7, rate: 0.015 },
      { minDays: 7, maxDays: 30, rate: 0.0075 },
      { minDays: 30, maxDays: 180, rate: 0.005 },
      { minDays: 180, maxDays: 365, rate: 0.0025 },
      { minDays: 365, maxDays: Infinity, rate: 0 },
    ]
  }
};

class ClearingDistributionEngine {
  calculatePurchaseFee(amount, customRate = null) {
    if (customRate !== null) {
      return {
        feeAmount: Math.floor(amount * customRate * 100) / 100,
        rate: customRate,
        netAmount: Math.floor(amount * (1 - customRate) * 100) / 100
      };
    }

    const rule = FeeRules.purchase.tiers.find(t => 
      amount >= t.minAmount && amount < t.maxAmount
    ) || FeeRules.purchase.tiers[FeeRules.purchase.tiers.length - 1];

    const feeAmount = Math.floor(amount * rule.rate * 100) / 100;
    const netAmount = Math.floor(amount * (1 - rule.rate) * 100) / 100;

    return {
      feeAmount,
      rate: rule.rate,
      netAmount
    };
  }

  calculateRedemptionFee(amount, holdDays, customRate = null) {
    if (customRate !== null) {
      return {
        feeAmount: Math.floor(amount * customRate * 100) / 100,
        rate: customRate,
        netAmount: Math.floor(amount * (1 - customRate) * 100) / 100
      };
    }

    const rule = FeeRules.redemption.tiers.find(t => 
      holdDays >= t.minDays && holdDays < t.maxDays
    ) || FeeRules.redemption.tiers[FeeRules.redemption.tiers.length - 1];

    const feeAmount = Math.floor(amount * rule.rate * 100) / 100;
    const netAmount = Math.floor(amount * (1 - rule.rate) * 100) / 100;

    return {
      feeAmount,
      rate: rule.rate,
      netAmount,
      holdDays
    };
  }

  calculateHoldDays(firstPurchaseDate, redemptionDate = new Date()) {
    const firstDate = new Date(firstPurchaseDate);
    const currentDate = new Date(redemptionDate);
    const diffTime = Math.abs(currentDate - firstDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  clearRedemption(orderId, userId, productId, amount, shares, holdDays) {
    const feeCalculation = this.calculateRedemptionFee(amount, holdDays);
    const now = new Date().toISOString();

    eventStore.append(
      AggregateTypes.ORDER,
      orderId,
      EventTypes.FUND_CLEARED,
      {
        orderId,
        userId,
        productId,
        grossAmount: amount,
        feeAmount: feeCalculation.feeAmount,
        netAmount: feeCalculation.netAmount,
        feeRate: feeCalculation.rate,
        holdDays: feeCalculation.holdDays,
        clearedAt: now
      },
      { source: 'ClearingDistributionEngine' }
    );

    return {
      orderId,
      grossAmount: amount,
      feeAmount: feeCalculation.feeAmount,
      netAmount: feeCalculation.netAmount,
      feeRate: feeCalculation.rate,
      holdDays: feeCalculation.holdDays
    };
  }

  processDividend(userId, productId, shares, perShareAmount, distributionType = 'cash') {
    const totalAmount = shares * perShareAmount;
    const roundedAmount = Math.floor(totalAmount * 100) / 100;

    return {
      userId,
      productId,
      shares,
      perShareAmount,
      totalAmount: roundedAmount,
      distributionType
    };
  }

  reconcileOrders(reconciliationDate) {
    const dateStr = reconciliationDate instanceof Date 
      ? reconciliationDate.toISOString().split('T')[0]
      : reconciliationDate;

    const stmt = db.prepare(`
      SELECT o.*, p.name as product_name, u.username 
      FROM orders o 
      LEFT JOIN fund_products p ON o.product_id = p.id
      LEFT JOIN users u ON o.user_id = u.id
      WHERE date(o.created_at) = ?
    `);
    const orders = stmt.all(dateStr);

    const totalOrders = orders.length;
    const matchedOrders = orders.filter(o => 
      ['completed', 'confirmed'].includes(o.status)
    ).length;
    const unmatchedOrders = totalOrders - matchedOrders;
    
    const totalAmount = orders.reduce((sum, o) => sum + (o.amount || 0), 0);
    const feeTotal = orders.reduce((sum, o) => sum + (o.fee_amount || 0), 0);

    eventStore.append(
      AggregateTypes.RECONCILIATION,
      dateStr,
      EventTypes.RECONCILIATION_COMPLETED,
      {
        date: dateStr,
        totalOrders,
        matchedOrders,
        unmatchedOrders,
        totalAmount,
        feeTotal
      },
      { source: 'ClearingDistributionEngine' }
    );

    return {
      date: dateStr,
      totalOrders,
      matchedOrders,
      unmatchedOrders,
      totalAmount,
      feeTotal,
      differenceAmount: unmatchedOrders > 0 ? totalAmount * 0.01 : 0
    };
  }
}

export default new ClearingDistributionEngine();
export { FeeRules };
