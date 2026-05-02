const db = require('../../config/database');
const { v4: uuidv4 } = require('uuid');

const RiskCheckEngine = {
  riskRules: [
    {
      code: 'TAX_RATE_VARIANCE',
      name: '税率异常检查',
      description: '检查实际税率与配置税率差异是否超过阈值',
      severity: 'high',
      check: (order, details, taxType) => {
        if (order.total_amount <= 0) return null;
        
        const actualRate = order.total_tax_amount / order.total_amount;
        const expectedRate = taxType?.tax_rate || 0;
        const variance = Math.abs(actualRate - expectedRate);
        const threshold = 0.05;
        
        if (variance > threshold) {
          return {
            passed: false,
            riskLevel: 'high',
            message: `实际税率 ${(actualRate * 100).toFixed(2)}% 与配置税率 ${(expectedRate * 100).toFixed(2)}% 差异超过 ${(threshold * 100).toFixed(0)}%`,
            suggestion: '请检查税额计算是否正确，确认是否适用特殊税收政策'
          };
        }
        return { passed: true };
      }
    },
    {
      code: 'DETAIL_CONSISTENCY',
      name: '明细一致性检查',
      description: '检查主单金额与明细汇总是否一致',
      severity: 'high',
      check: (order, details) => {
        const sumAmount = details.reduce((sum, d) => sum + (d.amount || 0), 0);
        const sumTax = details.reduce((sum, d) => sum + (d.tax_amount || 0), 0);
        
        const issues = [];
        
        if (Math.abs(sumAmount - order.total_amount) > 0.01) {
          issues.push(`总金额差异：主单 ${order.total_amount}，明细汇总 ${sumAmount}`);
        }
        
        if (Math.abs(sumTax - order.total_tax_amount) > 0.01) {
          issues.push(`总税额差异：主单 ${order.total_tax_amount}，明细汇总 ${sumTax}`);
        }
        
        if (issues.length > 0) {
          return {
            passed: false,
            riskLevel: 'high',
            message: issues.join('；'),
            suggestion: '请核对主单与明细数据，确保金额汇总一致'
          };
        }
        return { passed: true };
      }
    },
    {
      code: 'VOUCHER_COMPLETENESS',
      name: '凭证完整性检查',
      description: '检查凭证是否完整',
      severity: 'medium',
      check: (order, details) => {
        const incomplete = details.filter(d => 
          d.amount > 0 && (!d.voucher_no || !d.voucher_date)
        );
        
        if (incomplete.length > 0) {
          return {
            passed: false,
            riskLevel: 'medium',
            message: `${incomplete.length} 条明细缺少凭证号或凭证日期`,
            suggestion: '请补充完整的凭证信息，以便后续审核'
          };
        }
        return { passed: true };
      }
    },
    {
      code: 'NEGATIVE_AMOUNT',
      name: '负金额检查',
      description: '检查是否存在负金额或负税额',
      severity: 'medium',
      check: (order, details) => {
        const negativeItems = details.filter(d => 
          d.amount < 0 || d.tax_amount < 0
        );
        
        if (negativeItems.length > 0) {
          return {
            passed: false,
            riskLevel: 'medium',
            message: `存在 ${negativeItems.length} 条负金额/负税额明细`,
            suggestion: '请确认负金额是否为红字发票或退款等正常业务场景'
          };
        }
        return { passed: true };
      }
    },
    {
      code: 'HIGH_VALUE_ITEM',
      name: '大额项目检查',
      description: '检查是否存在异常大额明细项',
      severity: 'low',
      check: (order, details) => {
        const threshold = 1000000;
        const highValueItems = details.filter(d => d.amount >= threshold);
        
        if (highValueItems.length > 0) {
          return {
            passed: false,
            riskLevel: 'low',
            message: `存在 ${highValueItems.length} 条大额明细项（单条金额≥${threshold}）`,
            suggestion: '大额交易建议准备相关合同、发票等佐证材料'
          };
        }
        return { passed: true };
      }
    },
    {
      code: 'DEDUCTION_RATIO',
      name: '抵扣比例检查',
      description: '检查进项税额抵扣比例是否异常',
      severity: 'medium',
      check: (order, details) => {
        const totalTax = order.total_tax_amount;
        const totalDeduction = details.reduce((sum, d) => sum + (d.deduction_amount || 0), 0);
        
        if (totalTax > 0 && totalDeduction / totalTax > 0.8) {
          const ratio = ((totalDeduction / totalTax * 100).toFixed(1));
          return {
            passed: false,
            riskLevel: 'medium',
            message: '进项税额抵扣比例较高 (' + ratio + '%)',
            suggestion: '高抵扣比例可能引起关注,请确保抵扣凭证合规'
          };
        }
        return { passed: true };
      }
    }
  ],

  executeRiskCheck: (mainOrderId, operatorId) => {
    const order = db.prepare(`
      SELECT mo.*, tt.tax_name, tt.tax_rate, tt.tax_code
      FROM main_orders mo
      LEFT JOIN tax_types tt ON mo.tax_type_id = tt.id
      WHERE mo.id = ?
    `).get(mainOrderId);
    
    if (!order) {
      return { success: false, message: '主单不存在' };
    }
    
    const details = db.prepare(`
      SELECT * FROM order_details WHERE main_order_id = ?
    `).all(mainOrderId);
    
    const results = [];
    let highestRisk = 'none';
    
    for (const rule of RiskCheckEngine.riskRules) {
      try {
        const result = rule.check(order, details, {
          tax_rate: order.tax_rate,
          tax_name: order.tax_name
        });
        
        if (result) {
          results.push({
            ruleCode: rule.code,
            ruleName: rule.name,
            ruleDescription: rule.description,
            severity: rule.severity,
            passed: result.passed,
            riskLevel: result.passed ? 'none' : result.riskLevel,
            message: result.message,
            suggestion: result.suggestion
          });
          
          if (!result.passed && result.riskLevel) {
            const riskPriority = { 'none': 0, 'low': 1, 'medium': 2, 'high': 3 };
            if (riskPriority[result.riskLevel] > riskPriority[highestRisk]) {
              highestRisk = result.riskLevel;
            }
          }
        }
      } catch (e) {
        results.push({
          ruleCode: rule.code,
          ruleName: rule.name,
          error: e.message,
          passed: false,
          riskLevel: 'none'
        });
      }
    }
    
    db.prepare('DELETE FROM risk_checks WHERE main_order_id = ?').run(mainOrderId);
    
    const insertStmt = db.prepare(`
      INSERT INTO risk_checks (
        id, main_order_id, check_type, check_name, check_result, 
        risk_level, risk_message, suggestion, checked_by, checked_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);
    
    for (const r of results) {
      insertStmt.run(
        uuidv4(), mainOrderId, r.ruleCode, r.ruleName,
        r.passed ? 'pass' : 'fail',
        r.riskLevel, r.message, r.suggestion, operatorId
      );
    }
    
    db.prepare(`
      UPDATE main_orders 
      SET risk_level = ?, risk_message = ?
      WHERE id = ?
    `).run(
      highestRisk,
      results.filter(r => !r.passed).map(r => r.message).join('；'),
      mainOrderId
    );
    
    return {
      success: true,
      orderNo: order.order_no,
      overallRisk: highestRisk,
      canApprove: highestRisk !== 'high',
      checkResults: results,
      passedCount: results.filter(r => r.passed).length,
      failedCount: results.filter(r => !r.passed).length,
      highRiskCount: results.filter(r => r.riskLevel === 'high').length
    };
  },

  getRiskCheckResults: (mainOrderId) => {
    return db.prepare(`
      SELECT rc.*, u.real_name as checked_by_name
      FROM risk_checks rc
      LEFT JOIN users u ON rc.checked_by = u.id
      WHERE rc.main_order_id = ?
      ORDER BY 
        CASE rc.risk_level 
          WHEN 'high' THEN 1 
          WHEN 'medium' THEN 2 
          WHEN 'low' THEN 3 
          ELSE 4 
        END,
        rc.created_at DESC
    `).all(mainOrderId);
  },

  getRiskSummary: (mainOrderId) => {
    const checks = RiskCheckEngine.getRiskCheckResults(mainOrderId);
    
    return {
      total: checks.length,
      passed: checks.filter(c => c.check_result === 'pass').length,
      failed: checks.filter(c => c.check_result === 'fail').length,
      byLevel: {
        high: checks.filter(c => c.risk_level === 'high').length,
        medium: checks.filter(c => c.risk_level === 'medium').length,
        low: checks.filter(c => c.risk_level === 'low').length,
        none: checks.filter(c => c.risk_level === 'none' || !c.risk_level).length
      },
      details: checks
    };
  }
};

module.exports = RiskCheckEngine;
