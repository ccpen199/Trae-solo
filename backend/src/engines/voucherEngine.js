const db = require('../config/database');
const moment = require('moment');

class VoucherEngine {
  static VOUCHER_STATUSES = {
    DRAFT: 'draft',
    PENDING_REVIEW: 'pending_review',
    UNDER_REVIEW: 'under_review',
    REVIEW_PASSED: 'review_passed',
    REVIEW_REJECTED: 'review_rejected',
    PENDING_LEDGER: 'pending_ledger',
    LEDGER_GENERATED: 'ledger_generated',
    PENDING_REPORT: 'pending_report',
    REPORT_GENERATED: 'report_generated',
    PENDING_CLOSURE: 'pending_closure',
    CLOSED: 'closed',
    CANCELLED: 'cancelled'
  };

  static validateVoucher(voucher) {
    if (!voucher.voucher_type || !voucher.voucher_date || !voucher.period) {
      return { valid: false, error: '凭证类型、日期和期间为必填项' };
    }

    if (!voucher.details || voucher.details.length === 0) {
      return { valid: false, error: '凭证明细不能为空' };
    }

    const debitTotal = voucher.details.reduce((sum, d) => sum + (d.debit_amount || 0), 0);
    const creditTotal = voucher.details.reduce((sum, d) => sum + (d.credit_amount || 0), 0);

    if (Math.abs(debitTotal - creditTotal) > 0.0001) {
      return { 
        valid: false, 
        error: `借贷不平！借方总额: ${debitTotal.toFixed(2)}, 贷方总额: ${creditTotal.toFixed(2)}` 
      };
    }

    return { valid: true };
  }

  static validateDetails(details) {
    const errors = [];

    details.forEach((detail, index) => {
      if (!detail.subject_id || !detail.subject_code || !detail.subject_name) {
        errors.push(`第 ${index + 1} 行：科目信息不完整`);
      }

      if ((detail.debit_amount || 0) === 0 && (detail.credit_amount || 0) === 0) {
        errors.push(`第 ${index + 1} 行：借方和贷方金额不能同时为零`);
      }

      if ((detail.debit_amount || 0) > 0 && (detail.credit_amount || 0) > 0) {
        errors.push(`第 ${index + 1} 行：同一行不能同时有借方和贷方金额`);
      }

      if ((detail.debit_amount || 0) < 0 || (detail.credit_amount || 0) < 0) {
        errors.push(`第 ${index + 1} 行：金额不能为负数`);
      }
    });

    return errors.length === 0 ? { valid: true } : { valid: false, errors };
  }

  static async checkVoucherNoExists(voucherNo, excludeId = null) {
    return new Promise((resolve, reject) => {
      let query = 'SELECT COUNT(*) as count FROM vouchers WHERE voucher_no = ?';
      const params = [voucherNo];
      
      if (excludeId) {
        query += ' AND id != ?';
        params.push(excludeId);
      }

      db.get(query, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row.count > 0);
        }
      });
    });
  }

  static generateVoucherNo(period, type) {
    const prefix = {
      '收款凭证': 'SK',
      '付款凭证': 'FK',
      '转账凭证': 'ZZ',
      '记账凭证': 'JZ'
    }[type] || 'JZ';

    const dateStr = moment(period, 'YYYY-MM').format('YYYYMM');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    
    return `${prefix}-${dateStr}-${random}`;
  }

  static canEdit(status) {
    const editableStatuses = [
      this.VOUCHER_STATUSES.DRAFT,
      this.VOUCHER_STATUSES.REVIEW_REJECTED
    ];
    return editableStatuses.includes(status);
  }

  static canSubmit(status) {
    return status === this.VOUCHER_STATUSES.DRAFT;
  }

  static canReview(status) {
    return status === this.VOUCHER_STATUSES.PENDING_REVIEW;
  }

  static canGenerateLedger(status) {
    return status === this.VOUCHER_STATUSES.PENDING_LEDGER;
  }

  static canGenerateReport(status) {
    return status === this.VOUCHER_STATUSES.PENDING_REPORT;
  }

  static canClose(status) {
    return status === this.VOUCHER_STATUSES.PENDING_CLOSURE;
  }

  static canCancel(status) {
    const cancellableStatuses = [
      this.VOUCHER_STATUSES.DRAFT,
      this.VOUCHER_STATUSES.PENDING_REVIEW,
      this.VOUCHER_STATUSES.REVIEW_REJECTED
    ];
    return cancellableStatuses.includes(status);
  }

  static getNextStatus(currentStatus, action) {
    const transitions = {
      [this.VOUCHER_STATUSES.DRAFT]: {
        submit: this.VOUCHER_STATUSES.PENDING_REVIEW
      },
      [this.VOUCHER_STATUSES.PENDING_REVIEW]: {
        review: this.VOUCHER_STATUSES.UNDER_REVIEW
      },
      [this.VOUCHER_STATUSES.UNDER_REVIEW]: {
        pass: this.VOUCHER_STATUSES.REVIEW_PASSED,
        reject: this.VOUCHER_STATUSES.REVIEW_REJECTED
      },
      [this.VOUCHER_STATUSES.REVIEW_PASSED]: {
        ledger: this.VOUCHER_STATUSES.PENDING_LEDGER
      },
      [this.VOUCHER_STATUSES.PENDING_LEDGER]: {
        generate: this.VOUCHER_STATUSES.LEDGER_GENERATED
      },
      [this.VOUCHER_STATUSES.LEDGER_GENERATED]: {
        report: this.VOUCHER_STATUSES.PENDING_REPORT
      },
      [this.VOUCHER_STATUSES.PENDING_REPORT]: {
        generate: this.VOUCHER_STATUSES.REPORT_GENERATED
      },
      [this.VOUCHER_STATUSES.REPORT_GENERATED]: {
        closure: this.VOUCHER_STATUSES.PENDING_CLOSURE
      },
      [this.VOUCHER_STATUSES.PENDING_CLOSURE]: {
        close: this.VOUCHER_STATUSES.CLOSED
      }
    };

    const statusTransitions = transitions[currentStatus];
    return statusTransitions ? statusTransitions[action] : null;
  }

  static getStatusLabel(status) {
    const labels = {
      [this.VOUCHER_STATUSES.DRAFT]: '草稿',
      [this.VOUCHER_STATUSES.PENDING_REVIEW]: '待审核',
      [this.VOUCHER_STATUSES.UNDER_REVIEW]: '审核中',
      [this.VOUCHER_STATUSES.REVIEW_PASSED]: '审核通过',
      [this.VOUCHER_STATUSES.REVIEW_REJECTED]: '审核驳回',
      [this.VOUCHER_STATUSES.PENDING_LEDGER]: '待生成账簿',
      [this.VOUCHER_STATUSES.LEDGER_GENERATED]: '账簿已生成',
      [this.VOUCHER_STATUSES.PENDING_REPORT]: '待出报表',
      [this.VOUCHER_STATUSES.REPORT_GENERATED]: '报表已生成',
      [this.VOUCHER_STATUSES.PENDING_CLOSURE]: '待月末结账',
      [this.VOUCHER_STATUSES.CLOSED]: '已关闭',
      [this.VOUCHER_STATUSES.CANCELLED]: '已取消'
    };
    return labels[status] || status;
  }

  static getAvailableActions(status, role) {
    const actions = [];

    if (this.canEdit(status) && role === 'accountant') {
      actions.push({ action: 'edit', label: '编辑', color: 'primary' });
    }

    if (this.canSubmit(status) && role === 'accountant') {
      actions.push({ action: 'submit', label: '提交审核', color: 'success' });
    }

    if (this.canReview(status) && role === 'auditor') {
      actions.push(
        { action: 'lock', label: '锁定审核', color: 'warning' },
        { action: 'reject', label: '驳回', color: 'danger' }
      );
    }

    if (status === this.VOUCHER_STATUSES.UNDER_REVIEW && role === 'auditor') {
      actions.push(
        { action: 'pass', label: '通过', color: 'success' },
        { action: 'reject', label: '驳回', color: 'danger' },
        { action: 'supplement', label: '补充资料', color: 'warning' },
        { action: 'transfer', label: '转派', color: 'info' },
        { action: 'unlock', label: '解锁', color: 'secondary' }
      );
    }

    if (this.canGenerateLedger(status) && (role === 'accountant' || role === 'cashier')) {
      actions.push({ action: 'generate_ledger', label: '生成账簿', color: 'success' });
    }

    if (this.canGenerateReport(status) && (role === 'accountant' || role === 'auditor')) {
      actions.push({ action: 'generate_report', label: '生成报表', color: 'success' });
    }

    if (this.canClose(status) && (role === 'accountant' || role === 'boss')) {
      actions.push({ action: 'close', label: '月末结账', color: 'success' });
    }

    if (this.canCancel(status) && role === 'accountant') {
      actions.push({ action: 'cancel', label: '取消', color: 'danger' });
    }

    if (status === this.VOUCHER_STATUSES.CLOSED && role === 'boss') {
      actions.push({ action: 'unclose', label: '反结账', color: 'warning' });
    }

    return actions;
  }
}

module.exports = VoucherEngine;
