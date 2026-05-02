const db = require('../database/init');

const PricingEngine = {
  PRICING_RULES: {
    standard: {
      baseFee: 13.0,
      distanceFee: 2.3,
      timeFee: 0.5,
      minimumFee: 13.0,
      peakMultiplier: 1.5,
      nightMultiplier: 1.3,
      longDistanceMultiplier: 1.5,
      longDistanceThreshold: 15.0,
      waitTimeFree: 10,
      waitTimeFee: 0.3
    },
    premium: {
      baseFee: 20.0,
      distanceFee: 3.5,
      timeFee: 0.8,
      minimumFee: 20.0,
      peakMultiplier: 1.6,
      nightMultiplier: 1.4,
      longDistanceMultiplier: 1.6,
      longDistanceThreshold: 15.0,
      waitTimeFree: 15,
      waitTimeFee: 0.5
    },
    luxury: {
      baseFee: 50.0,
      distanceFee: 5.0,
      timeFee: 1.5,
      minimumFee: 50.0,
      peakMultiplier: 1.8,
      nightMultiplier: 1.6,
      longDistanceMultiplier: 1.8,
      longDistanceThreshold: 15.0,
      waitTimeFree: 20,
      waitTimeFee: 1.0
    }
  },

  TIME_SLOTS: {
    peakMorning: { start: 7, end: 9 },
    peakEvening: { start: 17, end: 19 },
    night: { start: 23, end: 6 }
  },

  isPeakTime(hour) {
    return (hour >= this.TIME_SLOTS.peakMorning.start && hour < this.TIME_SLOTS.peakMorning.end) ||
           (hour >= this.TIME_SLOTS.peakEvening.start && hour < this.TIME_SLOTS.peakEvening.end);
  },

  isNightTime(hour) {
    return hour >= this.TIME_SLOTS.night.start || hour < this.TIME_SLOTS.night.end;
  },

  calculateEstimatedPrice(distance, rideType = 'standard') {
    const rules = this.PRICING_RULES[rideType] || this.PRICING_RULES.standard;
    const now = new Date();
    const hour = now.getHours();

    let totalPrice = rules.baseFee;
    
    const distanceFee = distance * rules.distanceFee;
    totalPrice += distanceFee;

    const estimatedMinutes = distance * 4;
    const timeFee = estimatedMinutes * rules.timeFee / 60;
    totalPrice += timeFee;

    if (this.isPeakTime(hour)) {
      totalPrice *= rules.peakMultiplier;
    }

    if (this.isNightTime(hour)) {
      totalPrice *= rules.nightMultiplier;
    }

    totalPrice = Math.max(totalPrice, rules.minimumFee);

    return {
      estimatedPrice: Math.round(totalPrice * 100) / 100,
      baseFee: rules.baseFee,
      distanceFee: Math.round(distanceFee * 100) / 100,
      timeFee: Math.round(timeFee * 100) / 100,
      isPeakTime: this.isPeakTime(hour),
      isNightTime: this.isNightTime(hour),
      peakMultiplier: rules.peakMultiplier,
      nightMultiplier: rules.nightMultiplier
    };
  },

  calculateActualPrice(order, actualDistance, actualDuration, waitTime = 0) {
    const rules = this.PRICING_RULES[order.ride_type] || this.PRICING_RULES.standard;
    const startTime = new Date(order.created_at * 1000);
    const hour = startTime.getHours();

    let totalPrice = rules.baseFee;
    
    const distanceFee = actualDistance * rules.distanceFee;
    totalPrice += distanceFee;

    const timeFee = (actualDuration / 60) * rules.timeFee;
    totalPrice += timeFee;

    if (waitTime > rules.waitTimeFree) {
      const chargeableWaitTime = waitTime - rules.waitTimeFree;
      const waitFee = chargeableWaitTime * rules.waitTimeFee;
      totalPrice += waitFee;
    }

    if (this.isPeakTime(hour)) {
      totalPrice *= rules.peakMultiplier;
    }

    if (this.isNightTime(hour)) {
      totalPrice *= rules.nightMultiplier;
    }

    if (actualDistance > rules.longDistanceThreshold) {
      const overDistance = actualDistance - rules.longDistanceThreshold;
      const longDistanceFee = overDistance * rules.distanceFee * (rules.longDistanceMultiplier - 1);
      totalPrice += longDistanceFee;
    }

    totalPrice = Math.max(totalPrice, rules.minimumFee);

    return {
      actualPrice: Math.round(totalPrice * 100) / 100,
      baseFee: rules.baseFee,
      distanceFee: Math.round(distanceFee * 100) / 100,
      timeFee: Math.round(timeFee * 100) / 100,
      waitFee: waitTime > rules.waitTimeFree ? Math.round((waitTime - rules.waitTimeFree) * rules.waitTimeFee * 100) / 100 : 0,
      isPeakTime: this.isPeakTime(hour),
      isNightTime: this.isNightTime(hour),
      peakMultiplier: rules.peakMultiplier,
      nightMultiplier: rules.nightMultiplier,
      actualDistance,
      actualDuration,
      waitTime
    };
  },

  calculateCancellationFee(order, cancelTime) {
    const rules = this.PRICING_RULES[order.ride_type] || this.PRICING_RULES.standard;
    const orderTime = order.created_at;
    const minutesSinceOrder = (cancelTime - orderTime) / 60;

    if (minutesSinceOrder < 2) {
      return {
        fee: 0,
        reason: '2分钟内免费取消'
      };
    }

    if (order.status === 'driver_assigned' || order.status === 'driver_accepted') {
      const fee = Math.min(rules.baseFee * 0.3, 10);
      return {
        fee: Math.round(fee * 100) / 100,
        reason: '司机已接单，收取取消费'
      };
    }

    if (order.status === 'in_progress') {
      return {
        fee: rules.baseFee,
        reason: '行程已开始，收取起步价'
      };
    }

    return {
      fee: 0,
      reason: '免费取消'
    };
  },

  validatePriceCalculation(priceData) {
    const errors = [];
    
    if (priceData.actualPrice < 0) {
      errors.push('金额不能为负数');
    }
    if (priceData.actualDistance < 0) {
      errors.push('行驶距离不能为负数');
    }
    if (priceData.actualDuration < 0) {
      errors.push('行驶时长不能为负数');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
};

module.exports = PricingEngine;
