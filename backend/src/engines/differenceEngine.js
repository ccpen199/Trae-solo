const db = require('../config/database');

class DifferenceEngine {
  static DIFFERENCE_TYPES = {
    AMOUNT: 'amount',
    EXCHANGE_RATE: 'exchange_rate',
    INVOICE_SUBJECT: 'invoice_subject',
    PAYMENT_CALLBACK: 'payment_callback',
    RECONCILIATION: 'reconciliation'
  };

  static DIFFERENCE_STATUSES = {
    PENDING: 'pending',
    PROCESSING: 'processing',
    RESOLVED: 'resolved',
    CLOSED: 'closed'
  };

  static async createDifferenceRecord(difference) {
    const { v4: uuidv4 } = require('uuid');
    const moment = require('moment');
    const now = moment().format('YYYY-MM-DD HH:mm:ss');

    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO difference_records (
          id, voucher_id, difference_type, description, amount, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          uuidv4(),
          difference.voucher_id || null,
          difference.difference_type,
          difference.description,
          difference.amount || 0,
          this.DIFFERENCE_STATUSES.PENDING,
          now
        ],
        function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID, success: true });
        }
      );
    });
  }

  static async handleDifference(differenceId, handler) {
    const moment = require('moment');
    const now = moment().format('YYYY-MM-DD HH:mm:ss');

    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE difference_records 
         SET status = ?, handled_by = ?, handled_at = ?
         WHERE id = ?`,
        [
          this.DIFFERENCE_STATUSES.RESOLVED,
          handler,
          now,
          differenceId
        ],
        (err) => {
          if (err) reject(err);
          else resolve({ success: true });
        }
      );
    });
  }

  static async checkVoucherBalance(voucherId) {
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT total_debit, total_credit 
         FROM vouchers WHERE id = ?`,
        [voucherId],
        (err, row) => {
          if (err) reject(err);
          else if (!row) resolve({ balanced: false, error: '凭证不存在' });
          else {
            const balanced = Math.abs(row.total_debit - row.total_credit) < 0.0001;
            resolve({
              balanced,
              debit: row.total_debit,
              credit: row.total_credit,
              difference: row.total_debit - row.total_credit
            });
          }
        }
      );
    });
  }

  static async createAmountDifference(voucherId, expectedAmount, actualAmount, description) {
    const difference = {
      voucher_id: voucherId,
      difference_type: this.DIFFERENCE_TYPES.AMOUNT,
      description: description || `金额差异：期望 ${expectedAmount}，实际 ${actualAmount}`,
      amount: expectedAmount - actualAmount
    };
    return this.createDifferenceRecord(difference);
  }

  static async createExchangeRateDifference(voucherId, originalRate, actualRate, description) {
    const difference = {
      voucher_id: voucherId,
      difference_type: this.DIFFERENCE_TYPES.EXCHANGE_RATE,
      description: description || `汇率差异：期望 ${originalRate}，实际 ${actualRate}`
    };
    return this.createDifferenceRecord(difference);
  }

  static async createReconciliationDifference(voucherId, systemAmount, bankAmount, description) {
    const difference = {
      voucher_id: voucherId,
      difference_type: this.DIFFERENCE_TYPES.RECONCILIATION,
      description: description || `对账差异：系统 ${systemAmount}，银行 ${bankAmount}`,
      amount: systemAmount - bankAmount
    };
    return this.createDifferenceRecord(difference);
  }

  static async getPendingDifferences() {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT * FROM difference_records WHERE status = ? ORDER BY created_at DESC`,
        [this.DIFFERENCE_STATUSES.PENDING],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  static async pauseVoucherFlow(voucherId, reason) {
    const moment = require('moment');
    const now = moment().format('YYYY-MM-DD HH:mm:ss');

    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE vouchers 
         SET is_locked = 1, locked_at = ?
         WHERE id = ?`,
        [now, voucherId],
        (err) => {
          if (err) reject(err);
          else resolve({ success: true, voucherId });
        }
      );
    });
  }

  static getDifferenceTypeLabel(type) {
    const labels = {
      [this.DIFFERENCE_TYPES.AMOUNT]: '金额差异',
      [this.DIFFERENCE_TYPES.EXCHANGE_RATE]: '汇率差异',
      [this.DIFFERENCE_TYPES.INVOICE_SUBJECT]: '发票主体差异',
      [this.DIFFERENCE_TYPES.PAYMENT_CALLBACK]: '付款回调差异',
      [this.DIFFERENCE_TYPES.RECONCILIATION]: '对账差异'
    };
    return labels[type] || type;
  }

  static getDifferenceStatusLabel(status) {
    const labels = {
      [this.DIFFERENCE_STATUSES.PENDING]: '待处理',
      [this.DIFFERENCE_STATUSES.PROCESSING]: '处理中',
      [this.DIFFERENCE_STATUSES.RESOLVED]: '已解决',
      [this.DIFFERENCE_STATUSES.CLOSED]: '已关闭'
    };
    return labels[status] || status;
  }
}

module.exports = DifferenceEngine;
