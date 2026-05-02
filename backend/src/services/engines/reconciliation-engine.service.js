const db = require('../../config/database');
const { v4: uuidv4 } = require('uuid');

const ReconciliationEngine = {
  checkReconciliation: (mainOrderId) => {
    const order = db.prepare(`
      SELECT mo.*, tt.tax_name, tt.tax_code
      FROM main_orders mo
      LEFT JOIN tax_types tt ON mo.tax_type_id = tt.id
      WHERE mo.id = ?
    `).get(mainOrderId);
    
    if (!order) {
      return { valid: false, errors: ['主单不存在'] };
    }
    
    const details = db.prepare(`
      SELECT * FROM order_details WHERE main_order_id = ?
    `).all(mainOrderId);
    
    const errors = [];
    const warnings = [];
    
    const calculatedTotalAmount = details.reduce((sum, d) => sum + (d.amount || 0), 0);
    const calculatedTotalTax = details.reduce((sum, d) => sum + (d.tax_amount || 0), 0);
    
    if (Math.abs(calculatedTotalAmount - order.total_amount) > 0.01) {
      errors.push({
        item: '总金额对账',
        expected: order.total_amount,
        actual: calculatedTotalAmount,
        difference: order.total_amount - calculatedTotalAmount,
        message: '主单总金额与明细汇总不一致'
      });
    }
    
    if (Math.abs(calculatedTotalTax - order.total_tax_amount) > 0.01) {
      errors.push({
        item: '总税额对账',
        expected: order.total_tax_amount,
        actual: calculatedTotalTax,
        difference: order.total_tax_amount - calculatedTotalTax,
        message: '主单总税额与明细汇总不一致'
      });
    }
    
    details.forEach((detail, index) => {
      if (detail.voucher_no) {
        const existing = db.prepare(`
          SELECT id, main_order_id FROM order_details 
          WHERE voucher_no = ? AND id != ?
        `).get(detail.voucher_no, detail.id);
        
        if (existing) {
          warnings.push({
            item: `凭证重复检查`,
            detail: `第${index + 1}行`,
            voucherNo: detail.voucher_no,
            message: `凭证号 ${detail.voucher_no} 在其他主单中已存在`,
            otherOrderId: existing.main_order_id
          });
        }
      }
      
      if (detail.amount && detail.amount > 0) {
        if (!detail.voucher_date) {
          warnings.push({
            item: `凭证完整性检查`,
            detail: `第${index + 1}行`,
            itemName: detail.item_name,
            message: `金额大于0但缺少凭证日期`
          });
        }
      }
    });
    
    errors.forEach(error => {
      ReconciliationEngine.logReconciliation(
        mainOrderId,
        error.item,
        error.expected,
        error.actual,
        error.difference,
        'failed',
        error.message
      );
    });
    
    return {
      valid: errors.length === 0,
      errors,
      warnings,
      canProceed: errors.length === 0,
      blockReasons: errors.map(e => e.message)
    };
  },

  logReconciliation: (mainOrderId, checkItem, expectedValue, actualValue, difference, status, remark, processedBy = null) => {
    const stmt = db.prepare(`
      INSERT INTO reconciliation_logs (
        id, main_order_id, check_item, expected_value, actual_value, 
        difference, status, remark, processed_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      uuidv4(), mainOrderId, checkItem, 
      String(expectedValue), String(actualValue), 
      String(difference), status, remark, processedBy
    );
  },

  getReconciliationLogs: (mainOrderId) => {
    return db.prepare(`
      SELECT rl.*, u.real_name as processed_by_name
      FROM reconciliation_logs rl
      LEFT JOIN users u ON rl.processed_by = u.id
      WHERE rl.main_order_id = ?
      ORDER BY rl.created_at DESC
    `).all(mainOrderId);
  },

  correctDifference: (mainOrderId, corrections, operatorId, operatorName) => {
    const order = db.prepare('SELECT * FROM main_orders WHERE id = ?').get(mainOrderId);
    if (!order) {
      return { success: false, message: '主单不存在' };
    }
    
    if (order.is_locked) {
      return { success: false, message: '主单已被锁定，无法修改' };
    }
    
    if (corrections.total_amount !== undefined) {
      db.prepare('UPDATE main_orders SET total_amount = ? WHERE id = ?')
        .run(corrections.total_amount, mainOrderId);
    }
    
    if (corrections.total_tax_amount !== undefined) {
      db.prepare('UPDATE main_orders SET total_tax_amount = ? WHERE id = ?')
        .run(corrections.total_tax_amount, mainOrderId);
    }
    
    if (corrections.details) {
      for (const detailCorrection of corrections.details) {
        if (detailCorrection.id) {
          const updates = [];
          const values = [];
          
          if (detailCorrection.amount !== undefined) {
            updates.push('amount = ?');
            values.push(detailCorrection.amount);
          }
          if (detailCorrection.tax_amount !== undefined) {
            updates.push('tax_amount = ?');
            values.push(detailCorrection.tax_amount);
          }
          if (detailCorrection.deduction_amount !== undefined) {
            updates.push('deduction_amount = ?');
            values.push(detailCorrection.deduction_amount);
          }
          
          if (updates.length > 0) {
            values.push(detailCorrection.id);
            db.prepare(`UPDATE order_details SET ${updates.join(', ')} WHERE id = ?`)
              .run(...values);
          }
        }
      }
    }
    
    ReconciliationEngine.logReconciliation(
      mainOrderId,
      '差异冲正',
      JSON.stringify({ total_amount: order.total_amount, total_tax_amount: order.total_tax_amount }),
      JSON.stringify({ total_amount: corrections.total_amount, total_tax_amount: corrections.total_tax_amount }),
      '已冲正',
      'corrected',
      '通过差异冲正操作完成',
      operatorId
    );
    
    return { success: true, message: '差异冲正完成' };
  }
};

module.exports = ReconciliationEngine;
