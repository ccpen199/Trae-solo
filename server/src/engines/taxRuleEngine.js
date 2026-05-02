const { get, all, run } = require('../database');

const TAX_TYPES = {
  VAT: 'vat',
  STAMP: 'stamp',
  INTEREST: 'interest',
  OTHER: 'other'
};

const findApplicableRules = async (ruleType, amount, effectiveDate = null) => {
  const dateCondition = effectiveDate 
    ? `AND (effective_date IS NULL OR effective_date <= ?) AND (expiry_date IS NULL OR expiry_date >= ?)`
    : '';
  
  const rules = await all(`
    SELECT * FROM tax_rules 
    WHERE rule_type = ? 
      AND is_active = 1 
      AND (min_amount IS NULL OR min_amount <= ?)
      AND (max_amount IS NULL OR max_amount >= ?)
      ${dateCondition}
    ORDER BY priority DESC, created_at ASC
  `, effectiveDate 
    ? [ruleType, amount, amount, effectiveDate, effectiveDate]
    : [ruleType, amount, amount]
  );

  return rules;
};

const calculateTax = async (ruleType, amount, effectiveDate = null) => {
  const rules = await findApplicableRules(ruleType, amount, effectiveDate);
  
  if (rules.length === 0) {
    return {
      taxAmount: 0,
      taxRate: 0,
      ruleApplied: null,
      message: `未找到适用于金额 ${amount} 的 ${ruleType} 税率规则`
    };
  }

  const applicableRule = rules[0];
  const taxAmount = amount * applicableRule.tax_rate;

  return {
    taxAmount,
    taxRate: applicableRule.tax_rate,
    ruleApplied: applicableRule.rule_code,
    ruleName: applicableRule.rule_name,
    amount,
    calculatedAt: new Date().toISOString()
  };
};

const calculateBillTaxes = async (bill) => {
  const taxes = {};
  const totalAmount = bill.amount;

  taxes.vat = await calculateTax(TAX_TYPES.VAT, totalAmount);
  taxes.stamp = await calculateTax(TAX_TYPES.STAMP, totalAmount);

  if (bill.discount_rate) {
    const interestAmount = totalAmount * bill.discount_rate;
    taxes.interest = await calculateTax(TAX_TYPES.INTEREST, interestAmount);
  }

  const totalTaxAmount = Object.values(taxes).reduce((sum, tax) => {
    return sum + (tax.taxAmount || 0);
  }, 0);

  return {
    taxes,
    totalTaxAmount,
    billAmount: totalAmount,
    netAmount: totalAmount - totalTaxAmount
  };
};

const calculateDiscountTax = async (discountAmount, discountRate, days) => {
  const dailyRate = discountRate / 365;
  const interestAmount = discountAmount * dailyRate * days;

  const interestTax = await calculateTax(TAX_TYPES.INTEREST, interestAmount);
  const stampTax = await calculateTax(TAX_TYPES.STAMP, discountAmount);

  return {
    interestAmount,
    interestTax,
    stampTax,
    totalTax: interestTax.taxAmount + stampTax.taxAmount,
    actualReceived: discountAmount - interestAmount - interestTax.taxAmount - stampTax.taxAmount
  };
};

const routeTaxRule = async (transactionType, amount, metadata = {}) => {
  const ruleMapping = {
    'bill_issue': TAX_TYPES.VAT,
    'bill_endorsement': TAX_TYPES.STAMP,
    'bill_discount': TAX_TYPES.INTEREST,
    'bill_maturity': TAX_TYPES.VAT
  };

  const ruleType = ruleMapping[transactionType] || TAX_TYPES.OTHER;
  const taxResult = await calculateTax(ruleType, amount);

  return {
    transactionType,
    ruleType,
    amount,
    taxResult,
    routedAt: new Date().toISOString()
  };
};

const getAllActiveTaxRules = async () => {
  return await all(`
    SELECT * FROM tax_rules 
    WHERE is_active = 1 
    ORDER BY rule_type, priority DESC
  `);
};

const addTaxRule = async (ruleData) => {
  const result = await run(`
    INSERT INTO tax_rules 
    (rule_code, rule_name, rule_type, tax_rate, min_amount, max_amount, 
     effective_date, expiry_date, is_active, priority)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    ruleData.rule_code,
    ruleData.rule_name,
    ruleData.rule_type,
    ruleData.tax_rate,
    ruleData.min_amount || null,
    ruleData.max_amount || null,
    ruleData.effective_date || null,
    ruleData.expiry_date || null,
    ruleData.is_active !== false ? 1 : 0,
    ruleData.priority || 0
  ]);

  return {
    id: result.lastID,
    ...ruleData
  };
};

module.exports = {
  TAX_TYPES,
  findApplicableRules,
  calculateTax,
  calculateBillTaxes,
  calculateDiscountTax,
  routeTaxRule,
  getAllActiveTaxRules,
  addTaxRule
};
