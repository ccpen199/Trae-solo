const db = require('../models/database');
const { isNightTime, calculateDuration } = require('../utils/helpers');
const dayjs = require('dayjs');

const getBillingRule = (vehicleType = 'car') => {
  const rule = db.prepare(`
    SELECT * FROM billing_rules 
    WHERE vehicle_type = ? AND is_active = 1
    ORDER BY priority DESC 
    LIMIT 1
  `).get(vehicleType);
  
  return rule || db.prepare(`
    SELECT * FROM billing_rules 
    WHERE vehicle_type = 'car' AND is_active = 1
    ORDER BY priority DESC 
    LIMIT 1
  `).get();
};

const checkMonthlyCard = (plateNumber) => {
  const today = dayjs().format('YYYY-MM-DD');
  
  const card = db.prepare(`
    SELECT * FROM monthly_cards 
    WHERE plate_number = ? 
      AND status = 'active' 
      AND start_date <= ? 
      AND end_date >= ?
    LIMIT 1
  `).get(plateNumber, today, today);
  
  return card;
};

const splitTimeSegments = (startTime, endTime, nightStart = '22:00', nightEnd = '06:00') => {
  const segments = [];
  let current = dayjs(startTime);
  const end = dayjs(endTime);
  
  while (current.isBefore(end)) {
    const isNight = isNightTime(current, nightStart, nightEnd);
    const segmentEnd = getSegmentBoundary(current, nightStart, nightEnd, end);
    const duration = segmentEnd.diff(current, 'minute');
    
    if (duration > 0) {
      segments.push({
        startTime: current.format(),
        endTime: segmentEnd.format(),
        duration,
        type: isNight ? 'night' : 'day'
      });
    }
    
    current = segmentEnd;
  }
  
  return segments;
};

const getSegmentBoundary = (currentTime, nightStart, nightEnd, endTime) => {
  const [startHour, startMin] = nightStart.split(':').map(Number);
  const [endHour, endMin] = nightEnd.split(':').map(Number);
  
  const hour = currentTime.hour();
  const minute = currentTime.minute();
  
  let boundaryTime;
  
  if (hour >= startHour) {
    boundaryTime = currentTime.clone().hour(endHour).minute(endMin).second(0).millisecond(0);
    if (boundaryTime.isBefore(currentTime)) {
      boundaryTime = boundaryTime.add(1, 'day');
    }
  } else if (hour < endHour) {
    boundaryTime = currentTime.clone().hour(endHour).minute(endMin).second(0).millisecond(0);
  } else {
    boundaryTime = currentTime.clone().hour(startHour).minute(startMin).second(0).millisecond(0);
  }
  
  return boundaryTime.isBefore(endTime) ? boundaryTime : endTime;
};

const calculateParkingFee = (plateNumber, entryTime, exitTime, vehicleType = 'car') => {
  const rule = getBillingRule(vehicleType);
  if (!rule) {
    return { success: false, message: '未找到计费规则' };
  }

  const monthlyCard = checkMonthlyCard(plateNumber);
  if (monthlyCard) {
    return {
      success: true,
      totalAmount: 0,
      breakdown: [{ type: 'monthly_card', amount: 0, description: '月卡免费' }],
      monthlyCard: {
        id: monthlyCard.id,
        cardNo: monthlyCard.card_no,
        endDate: monthlyCard.end_date
      }
    };
  }

  const totalMinutes = calculateDuration(entryTime, exitTime);
  
  if (totalMinutes <= rule.free_minutes) {
    return {
      success: true,
      totalAmount: 0,
      breakdown: [{ type: 'free', amount: 0, description: `${rule.free_minutes}分钟内免费` }],
      freeMinutes: rule.free_minutes,
      actualMinutes: totalMinutes
    };
  }

  const billableMinutes = totalMinutes - rule.free_minutes;
  const segments = splitTimeSegments(entryTime, exitTime, rule.night_start_time, rule.night_end_time);
  
  const breakdown = [];
  let dailyTotal = 0;
  let currentDay = dayjs(entryTime).format('YYYY-MM-DD');
  
  breakdown.push({
    type: 'free_deduct',
    amount: 0,
    minutes: rule.free_minutes,
    description: `减免${rule.free_minutes}分钟`
  });

  segments.forEach(segment => {
    const segmentDay = dayjs(segment.startTime).format('YYYY-MM-DD');
    if (segmentDay !== currentDay) {
      if (dailyTotal > rule.daily_max) {
        breakdown.push({
          type: 'daily_cap',
          amount: dailyTotal - rule.daily_max,
          isDiscount: true,
          description: `${currentDay} 日封顶减免`
        });
      }
      currentDay = segmentDay;
      dailyTotal = 0;
    }

    const rate = segment.type === 'night' ? rule.night_rate : rule.hourly_rate;
    const hours = Math.ceil(segment.duration / 60);
    const amount = hours * rate;
    
    dailyTotal += amount;
    const cappedAmount = Math.min(amount, rule.daily_max - (dailyTotal - amount));
    
    if (cappedAmount > 0) {
      breakdown.push({
        type: segment.type === 'night' ? 'night_rate' : 'day_rate',
        amount: cappedAmount,
        minutes: segment.duration,
        rate,
        hours,
        description: `${segment.type === 'night' ? '夜间' : '日间'}计费: ${Math.ceil(segment.duration / 60)}小时 × ¥${rate}`
      });
    }
  });

  if (dailyTotal > rule.daily_max) {
    breakdown.push({
      type: 'daily_cap',
      amount: dailyTotal - rule.daily_max,
      isDiscount: true,
      description: `${currentDay} 日封顶减免`
    });
  }

  const totalAmount = Math.min(
    Math.ceil(billableMinutes / 60) * rule.hourly_rate,
    rule.daily_max
  );

  return {
    success: true,
    totalAmount,
    breakdown,
    totalMinutes,
    billableMinutes,
    rule: {
      freeMinutes: rule.free_minutes,
      hourlyRate: rule.hourly_rate,
      dailyMax: rule.daily_max,
      nightRate: rule.night_rate
    }
  };
};

const verifyBilling = (orderId, calculatedAmount) => {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  if (!order) {
    return { success: false, message: '订单不存在' };
  }

  if (order.status !== 'pending_parking') {
    return { success: false, message: '订单状态不正确，无法计费' };
  }

  const exitTime = dayjs().format();
  const calculation = calculateParkingFee(
    order.plate_number,
    order.entry_time,
    exitTime,
    order.vehicle_type
  );

  if (!calculation.success) {
    return calculation;
  }

  const isMatch = Math.abs(calculation.totalAmount - calculatedAmount) < 0.01;

  return {
    success: true,
    isMatch,
    expectedAmount: calculation.totalAmount,
    providedAmount: calculatedAmount,
    difference: Math.abs(calculation.totalAmount - calculatedAmount),
    calculation,
    exitTime
  };
};

const generateBillingDetails = (orderId) => {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  if (!order) {
    return { success: false, message: '订单不存在' };
  }

  const exitTime = dayjs().format();
  const calculation = calculateParkingFee(
    order.plate_number,
    order.entry_time,
    exitTime,
    order.vehicle_type
  );

  if (!calculation.success) {
    return calculation;
  }

  return {
    success: true,
    orderNo: order.order_no,
    plateNumber: order.plate_number,
    entryTime: order.entry_time,
    exitTime,
    duration: calculateDuration(order.entry_time, exitTime),
    totalAmount: calculation.totalAmount,
    breakdown: calculation.breakdown,
    monthlyCard: calculation.monthlyCard,
    isFree: calculation.totalAmount === 0
  };
};

const reconcilePayment = (paymentId, actualAmount) => {
  const payment = db.prepare('SELECT * FROM payments WHERE id = ?').get(paymentId);
  if (!payment) {
    return { success: false, message: '支付记录不存在' };
  }

  if (payment.is_locked) {
    return { success: false, message: '支付已锁定，无法修改' };
  }

  const expectedAmount = payment.amount;
  const difference = actualAmount - expectedAmount;

  return {
    success: true,
    paymentNo: payment.payment_no,
    orderId: payment.order_id,
    expectedAmount,
    actualAmount,
    difference,
    status: Math.abs(difference) < 0.01 ? 'matched' : (difference > 0 ? 'overpayment' : 'underpayment')
  };
};

module.exports = {
  getBillingRule,
  checkMonthlyCard,
  calculateParkingFee,
  verifyBilling,
  generateBillingDetails,
  reconcilePayment,
  splitTimeSegments
};