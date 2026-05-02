import { v4 as uuidv4 } from 'uuid';
import db from '../database.js';

export const RISK_TYPES = {
  TAX_NO_MISMATCH: '税号不匹配',
  AMOUNT_EXCEED: '金额超限',
  FREQUENT_RED_CREDIT: '频繁红冲',
  INVALID_TITLE: '抬头无效',
  QUOTA_WARNING: '额度预警',
  DUPLICATE_INVOICE: '重复开票'
};

export const RISK_LEVELS = {
  HIGH: '高',
  MEDIUM: '中',
  LOW: '低'
};

export const validateTaxNo = (taxNo) => {
  if (!taxNo) {
    return { valid: false, risk: '税号不能为空', level: RISK_LEVELS.HIGH };
  }

  if (taxNo.length !== 15 && taxNo.length !== 17 && taxNo.length !== 18) {
    return { valid: false, risk: '税号长度不正确（应为15、17或18位）', level: RISK_LEVELS.HIGH };
  }

  const pattern = /^[A-HJ-NP-Z0-9]{15,18}$/;
  if (!pattern.test(taxNo)) {
    return { valid: false, risk: '税号格式不正确', level: RISK_LEVELS.HIGH };
  }

  if (taxNo.length === 18) {
    const checksum = validate18DigitTaxNo(taxNo);
    if (!checksum) {
      return { valid: false, risk: '税号校验位不匹配', level: RISK_LEVELS.HIGH };
    }
  }

  return { valid: true, risk: null, level: null };
};

export const validateInvoiceTitle = (title) => {
  if (!title || title.trim().length === 0) {
    return { valid: false, risk: '发票抬头不能为空', level: RISK_LEVELS.HIGH };
  }

  if (title.length > 100) {
    return { valid: false, risk: '发票抬头过长（最大100字符）', level: RISK_LEVELS.MEDIUM };
  }

  return { valid: true, risk: null, level: null };
};

export const checkAmountRisk = (amount, customerId) => {
  const risks = [];

  if (amount > 100000) {
    risks.push({
      type: RISK_TYPES.AMOUNT_EXCEED,
      level: RISK_LEVELS.MEDIUM,
      description: `单笔金额 ${amount} 超过预警阈值100,000`
    });
  }

  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

  const recentInvoices = db.prepare(`
    SELECT COUNT(*) as count, SUM(amount) as total
    FROM invoice_requests
    WHERE customer_id = ? AND status != 'rejected' AND created_at >= ?
  `).get(customerId, oneMonthAgo.toISOString());

  if (recentInvoices.count > 20) {
    risks.push({
      type: RISK_TYPES.FREQUENT_RED_CREDIT,
      level: RISK_LEVELS.MEDIUM,
      description: `该客户近30天开票 ${recentInvoices.count} 次，频率较高`
    });
  }

  return risks;
};

export const checkDuplicateInvoice = (orderNo, amount) => {
  const exists = db.prepare(`
    SELECT * FROM invoice_requests 
    WHERE order_no = ? AND status != 'rejected' AND status != 'red_credited'
  `).get(orderNo);

  if (exists) {
    return {
      isDuplicate: true,
      existingInvoice: {
        id: exists.id,
        invoice_no: exists.invoice_no,
        amount: exists.amount,
        status: exists.status
      }
    };
  }

  return { isDuplicate: false };
};

export const checkQuotaRisk = (newAmount) => {
  const period = new Date().toISOString().slice(0, 7);
  const quota = db.prepare(`
    SELECT * FROM invoice_quota WHERE period = ?
  `).get(period);

  if (!quota) {
    return { hasRisk: false };
  }

  const projectedUsed = quota.used_quota + newAmount;
  const usageRate = projectedUsed / quota.total_quota;

  if (usageRate > 0.95) {
    return {
      hasRisk: true,
      level: RISK_LEVELS.HIGH,
      type: RISK_TYPES.QUOTA_WARNING,
      description: `开票额度即将用尽，预计使用率 ${(usageRate * 100).toFixed(1)}%`
    };
  } else if (usageRate > 0.8) {
    return {
      hasRisk: true,
      level: RISK_LEVELS.MEDIUM,
      type: RISK_TYPES.QUOTA_WARNING,
      description: `开票额度使用率较高，预计使用率 ${(usageRate * 100).toFixed(1)}%`
    };
  }

  return { hasRisk: false };
};

export const createRiskAlert = (params) => {
  const { invoiceId, riskType, riskLevel, description, operator } = params;
  const alertId = uuidv4();
  
  db.prepare(`
    INSERT INTO risk_alerts (
      id, invoice_id, risk_type, risk_level, description
    ) VALUES (?, ?, ?, ?, ?)
  `).run(alertId, invoiceId || null, riskType, riskLevel, description);

  return alertId;
};

const validate18DigitTaxNo = (taxNo) => {
  const weights = [1, 3, 9, 27, 19, 26, 16, 17, 20, 29, 25, 13, 8, 24, 10, 30, 28];
  const chars = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  
  let sum = 0;
  for (let i = 0; i < 17; i++) {
    const charValue = chars.indexOf(taxNo.charAt(i));
    if (charValue === -1) return false;
    sum += charValue * weights[i];
  }
  
  const checkValue = (31 - (sum % 31)) % 31;
  return taxNo.charAt(17) === chars.charAt(checkValue);
};

export default {
  validateTaxNo,
  validateInvoiceTitle,
  checkAmountRisk,
  checkDuplicateInvoice,
  checkQuotaRisk,
  createRiskAlert,
  RISK_TYPES,
  RISK_LEVELS
};
