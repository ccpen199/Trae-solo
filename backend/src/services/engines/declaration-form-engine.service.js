const db = require('../../config/database');

const DeclarationFormEngine = {
  getFormById: (formId) => {
    return db.prepare(`
      SELECT df.*, tt.tax_name, tt.tax_code
      FROM declaration_forms df
      LEFT JOIN tax_types tt ON df.tax_type_id = tt.id
      WHERE df.id = ? AND df.is_active = 1
    `).get(formId);
  },

  getFormFields: (formId) => {
    const form = DeclarationFormEngine.getFormById(formId);
    if (!form) return null;
    
    const defaultFields = {
      general: [
        { code: 'period', label: '所属期', type: 'period', required: true },
        { code: 'taxpayer_name', label: '纳税人名称', type: 'text', required: true },
        { code: 'taxpayer_id', label: '纳税人识别号', type: 'text', required: true }
      ],
      income: [
        { code: 'sales_amount', label: '销售额', type: 'decimal', required: true },
        { code: 'export_amount', label: '出口销售额', type: 'decimal', required: false },
        { code: 'service_amount', label: '服务收入', type: 'decimal', required: false }
      ],
      deduction: [
        { code: 'input_tax', label: '进项税额', type: 'decimal', required: false },
        { code: 'input_tax_transfer', label: '进项税额转出', type: 'decimal', required: false },
        { code: 'deduction_amount', label: '减免税额', type: 'decimal', required: false }
      ],
      tax: [
        { code: 'taxable_amount', label: '应纳税额', type: 'decimal', required: true, calculated: true },
        { code: 'tax_payable', label: '应补(退)税额', type: 'decimal', required: true, calculated: true }
      ]
    };
    
    if (form.fields_config) {
      try {
        return { ...defaultFields, ...JSON.parse(form.fields_config) };
      } catch (e) {
        return defaultFields;
      }
    }
    
    return defaultFields;
  },

  validateFormData: (formId, formData) => {
    const form = DeclarationFormEngine.getFormById(formId);
    if (!form) {
      return { valid: false, errors: ['申报表不存在'] };
    }
    
    const fields = DeclarationFormEngine.getFormFields(formId);
    const errors = [];
    const warnings = [];
    
    const allFields = Object.values(fields).flat();
    
    for (const field of allFields) {
      const value = formData[field.code];
      
      if (field.required && !field.calculated) {
        if (value === undefined || value === null || value === '') {
          errors.push({
            field: field.code,
            label: field.label,
            message: `${field.label} 为必填项`
          });
        }
      }
      
      if (field.type === 'decimal' && value !== undefined && value !== null) {
        const numValue = parseFloat(value);
        if (isNaN(numValue)) {
          errors.push({
            field: field.code,
            label: field.label,
            message: `${field.label} 必须是数字`
          });
        } else if (numValue < 0) {
          warnings.push({
            field: field.code,
            label: field.label,
            message: `${field.label} 为负数，请确认是否正确`
          });
        }
      }
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  },

  calculateFormFields: (formId, formData, orderDetails = []) => {
    const fields = DeclarationFormEngine.getFormFields(formId);
    if (!fields) return formData;
    
    const result = { ...formData };
    
    const salesAmount = parseFloat(formData.sales_amount || 0);
    const exportAmount = parseFloat(formData.export_amount || 0);
    const serviceAmount = parseFloat(formData.service_amount || 0);
    const inputTax = parseFloat(formData.input_tax || 0);
    const inputTaxTransfer = parseFloat(formData.input_tax_transfer || 0);
    const deductionAmount = parseFloat(formData.deduction_amount || 0);
    
    const totalIncome = salesAmount + exportAmount + serviceAmount;
    const taxRate = 0.13;
    
    const taxableAmount = (salesAmount + serviceAmount) * taxRate;
    const inputTaxDeductible = inputTax - inputTaxTransfer;
    const taxPayable = taxableAmount - inputTaxDeductible - deductionAmount;
    
    result.taxable_amount = parseFloat(taxableAmount.toFixed(2));
    result.tax_payable = parseFloat(Math.max(0, taxPayable).toFixed(2));
    result.total_income = parseFloat(totalIncome.toFixed(2));
    result.net_input_tax = parseFloat(inputTaxDeductible.toFixed(2));
    
    return result;
  },

  generateFormSummary: (formId, mainOrder) => {
    const form = DeclarationFormEngine.getFormById(formId);
    if (!form) return null;
    
    return {
      formId: form.id,
      formCode: form.form_code,
      formName: form.form_name,
      taxType: {
        id: form.tax_type_id,
        code: form.tax_code,
        name: form.tax_name
      },
      orderNo: mainOrder.order_no,
      period: {
        type: mainOrder.period_type,
        start: mainOrder.period_start,
        end: mainOrder.period_end
      },
      totalAmount: mainOrder.total_amount,
      totalTaxAmount: mainOrder.total_tax_amount,
      status: mainOrder.status,
      statusDisplay: mainOrder.status_display
    };
  },

  checkFormCompatibility: (formId, taxTypeId) => {
    const form = DeclarationFormEngine.getFormById(formId);
    if (!form) return { compatible: false, reason: '申报表不存在' };
    
    if (form.tax_type_id !== taxTypeId) {
      return {
        compatible: false,
        reason: `申报表税种不匹配：期望 ${form.tax_name}，请重新选择`
      };
    }
    
    return { compatible: true };
  }
};

module.exports = DeclarationFormEngine;
