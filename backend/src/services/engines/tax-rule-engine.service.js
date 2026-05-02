const db = require('../../config/database');

const TaxRuleEngine = {
  getTaxTypeById: (taxTypeId) => {
    return db.prepare(`
      SELECT * FROM tax_types WHERE id = ? AND is_active = 1
    `).get(taxTypeId);
  },

  getTaxTypeByCode: (taxCode) => {
    return db.prepare(`
      SELECT * FROM tax_types WHERE tax_code = ? AND is_active = 1
    `).get(taxCode);
  },

  getActiveRulesByTaxType: (taxTypeId) => {
    return db.prepare(`
      SELECT * FROM tax_rules 
      WHERE tax_type_id = ? AND is_active = 1
      ORDER BY priority DESC
    `).all(taxTypeId);
  },

  calculateTax: (amount, taxRate, taxTypeId = null) => {
    if (!amount || amount <= 0) return 0;
    
    if (taxTypeId) {
      const taxType = TaxRuleEngine.getTaxTypeById(taxTypeId);
      if (taxType) {
        taxRate = taxType.tax_rate;
      }
    }
    
    return amount * taxRate;
  },

  calculateTaxWithRules: (amount, taxTypeId, context = {}) => {
    const taxType = TaxRuleEngine.getTaxTypeById(taxTypeId);
    if (!taxType) {
      throw new Error('税种不存在或已禁用');
    }
    
    const rules = TaxRuleEngine.getActiveRulesByTaxType(taxTypeId);
    
    let calculatedTax = 0;
    let appliedRule = null;
    
    for (const rule of rules) {
      const conditions = JSON.parse(rule.conditions || '{}');
      
      let conditionsMet = true;
      for (const [key, value] of Object.entries(conditions)) {
        if (context[key] !== value) {
          conditionsMet = false;
          break;
        }
      }
      
      if (conditionsMet) {
        appliedRule = rule;
        const formula = rule.calculation_formula;
        if (formula) {
          try {
            calculatedTax = eval(formula.replace(/\{amount\}/g, amount));
          } catch (e) {
            calculatedTax = amount * taxType.tax_rate;
          }
        } else {
          calculatedTax = amount * taxType.tax_rate;
        }
        break;
      }
    }
    
    if (!appliedRule) {
      calculatedTax = amount * taxType.tax_rate;
    }
    
    return {
      amount,
      taxRate: taxType.tax_rate,
      taxAmount: parseFloat(calculatedTax.toFixed(2)),
      taxTypeId,
      taxTypeName: taxType.tax_name,
      appliedRule: appliedRule?.id || null
    };
  },

  validateTaxAmount: (orderDetails, taxTypeId) => {
    const taxType = TaxRuleEngine.getTaxTypeById(taxTypeId);
    if (!taxType) return { valid: false, message: '税种不存在' };
    
    let totalAmount = 0;
    let totalTaxAmount = 0;
    
    for (const detail of orderDetails) {
      const amount = detail.amount || 0;
      const taxAmount = detail.tax_amount || 0;
      const expectedTaxAmount = amount * taxType.tax_rate;
      
      totalAmount += amount;
      totalTaxAmount += taxAmount;
      
      if (Math.abs(taxAmount - expectedTaxAmount) > 0.01) {
        return {
          valid: false,
          message: `明细项税额校验失败: 期望 ${expectedTaxAmount.toFixed(2)}, 实际 ${taxAmount.toFixed(2)}`,
          detail: detail
        };
      }
    }
    
    return {
      valid: true,
      totalAmount,
      totalTaxAmount,
      taxRate: taxType.tax_rate
    };
  },

  getAllTaxTypes: () => {
    return db.prepare('SELECT * FROM tax_types WHERE is_active = 1 ORDER BY tax_code').all();
  },

  getDeclarationFormsByTaxType: (taxTypeId) => {
    return db.prepare(`
      SELECT * FROM declaration_forms 
      WHERE tax_type_id = ? AND is_active = 1
      ORDER BY form_code
    `).all(taxTypeId);
  }
};

module.exports = TaxRuleEngine;
