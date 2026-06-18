const dayjs = require('dayjs');

const generateOrderNo = (prefix = 'ORD') => {
  const timestamp = dayjs().format('YYYYMMDDHHmmss');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}${timestamp}${random}`;
};

const generateBookingNo = () => {
  return generateOrderNo('BK');
};

const generateWorkOrderNo = () => {
  return generateOrderNo('WO');
};

const generateVoucherCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 12; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
    if ((i + 1) % 4 === 0 && i < 11) {
      code += '-';
    }
  }
  return code;
};

const calculatePrice = (deviceType, mode, duration, unitPrice) => {
  const basePrice = {
    washer: 2.0,
    dryer: 1.5,
    water_dispenser: 0.5,
    shower: 0.1,
  }[deviceType] || 1.0;

  const modeMultiplier = {
    quick: 0.8,
    standard: 1.0,
    intensive: 1.3,
    hot: 1.2,
    cold: 1.0,
  }[mode] || 1.0;

  const pricePerUnit = unitPrice || basePrice;
  const totalAmount = Math.ceil(pricePerUnit * modeMultiplier * (duration / 60) * 100) / 100;

  return {
    basePrice,
    unitPrice: pricePerUnit,
    modeMultiplier,
    totalAmount,
  };
};

const calculateRefund = (order, usedDuration, totalDuration) => {
  if (!order || !order.amount || order.amount <= 0) {
    return 0;
  }

  const usedRatio = usedDuration / totalDuration;
  const refundRatio = Math.max(0, 1 - usedRatio);
  const refundAmount = Math.floor(order.amount * refundRatio * 100) / 100;

  return Math.max(0, Math.min(refundAmount, order.amount));
};

module.exports = {
  generateOrderNo,
  generateBookingNo,
  generateWorkOrderNo,
  generateVoucherCode,
  calculatePrice,
  calculateRefund,
};
