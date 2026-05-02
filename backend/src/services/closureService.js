const db = require('../config/database');
const VoucherEngine = require('../engines/voucherEngine');
const VoucherService = require('./voucherService');
const ReportService = require('./reportService');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');

class ClosureService {
  static async closePeriod(period, user) {
    const now = moment().format('YYYY-MM-DD HH:mm:ss');

    try {
      const profitSheet = await ReportService.getProfitSheet(period);
      const balanceSheet = await ReportService.getBalanceSheet(period);

      if (!balanceSheet.success || !profitSheet.success) {
        return { 
          success: false, 
          error: '请先生成资产负债表和利润表' 
        };
      }

      if (!balanceSheet.data.isBalanced) {
        return { 
          success: false, 
          error: '资产负债表不平衡，无法结账' 
        };
      }

      const existingClosure = await new Promise((resolve, reject) => {
        db.get('SELECT * FROM period_closures WHERE period = ?', [period], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });

      if (existingClosure && existingClosure.status === 'closed') {
        return { success: false, error: '该期间已结账' };
      }

      if (existingClosure) {
        await new Promise((resolve, reject) => {
          db.run(
            `UPDATE period_closures SET 
              status = 'closed', closed_by = ?, closed_at = ?, updated_at = ?
            WHERE period = ?`,
            [user.id, now, now, period],
            (err) => {
              if (err) reject(err);
              else resolve();
            }
          );
        });
      } else {
        await new Promise((resolve, reject) => {
          db.run(
            `INSERT INTO period_closures (
              id, period, status, closed_by, closed_at, created_at, updated_at
            ) VALUES (?, ?, 'closed', ?, ?, ?, ?)`,
            [uuidv4(), period, user.id, now, now, now],
            (err) => {
              if (err) reject(err);
              else resolve();
            }
          );
        });
      }

      const pendingVouchers = await new Promise((resolve, reject) => {
        db.all(
          `SELECT * FROM vouchers 
           WHERE period = ? AND status != ? AND status != ?`,
          [period, VoucherEngine.VOUCHER_STATUSES.CLOSED, VoucherEngine.VOUCHER_STATUSES.CANCELLED],
          (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
          }
        );
      });

      for (const voucher of pendingVouchers) {
        if (voucher.status === VoucherEngine.VOUCHER_STATUSES.PENDING_CLOSURE) {
          await new Promise((resolve, reject) => {
            db.run(
              `UPDATE vouchers SET status = ?, updated_at = ? WHERE id = ?`,
              [VoucherEngine.VOUCHER_STATUSES.CLOSED, now, voucher.id],
              (err) => {
                if (err) reject(err);
                else resolve();
              }
            );
          });

          VoucherService.logStatusFlow(
            voucher.id, voucher.status, VoucherEngine.VOUCHER_STATUSES.CLOSED,
            user, 'close', '月末结账', 'backend'
          );

          VoucherService.logOperation(
            voucher.id, user, 'close_voucher',
            JSON.stringify({ status: voucher.status }),
            JSON.stringify({ status: VoucherEngine.VOUCHER_STATUSES.CLOSED }),
            'backend'
          );
        }
      }

      return {
        success: true,
        data: {
          period,
          status: 'closed',
          closedAt: now,
          closedBy: user.name,
          balanceSheet: balanceSheet.data,
          profitSheet: profitSheet.data
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  static async unclosePeriod(period, user) {
    const now = moment().format('YYYY-MM-DD HH:mm:ss');

    try {
      const existingClosure = await new Promise((resolve, reject) => {
        db.get('SELECT * FROM period_closures WHERE period = ?', [period], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });

      if (!existingClosure || existingClosure.status !== 'closed') {
        return { success: false, error: '该期间未结账' };
      }

      await new Promise((resolve, reject) => {
        db.run(
          `UPDATE period_closures SET 
            status = 'open', reopened_by = ?, reopened_at = ?, updated_at = ?
          WHERE period = ?`,
          [user.id, now, now, period],
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });

      const closedVouchers = await new Promise((resolve, reject) => {
        db.all(
          `SELECT * FROM vouchers 
           WHERE period = ? AND status = ?`,
          [period, VoucherEngine.VOUCHER_STATUSES.CLOSED],
          (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
          }
        );
      });

      for (const voucher of closedVouchers) {
        await new Promise((resolve, reject) => {
          db.run(
            `UPDATE vouchers SET status = ?, updated_at = ? WHERE id = ?`,
            [VoucherEngine.VOUCHER_STATUSES.PENDING_CLOSURE, now, voucher.id],
            (err) => {
              if (err) reject(err);
              else resolve();
            }
          );
        });

        VoucherService.logStatusFlow(
          voucher.id, VoucherEngine.VOUCHER_STATUSES.CLOSED, VoucherEngine.VOUCHER_STATUSES.PENDING_CLOSURE,
          user, 'unclose', '反结账', 'backend'
        );

        VoucherService.logOperation(
          voucher.id, user, 'unclose_voucher',
          JSON.stringify({ status: VoucherEngine.VOUCHER_STATUSES.CLOSED }),
          JSON.stringify({ status: VoucherEngine.VOUCHER_STATUSES.PENDING_CLOSURE }),
          'backend'
        );
      }

      return {
        success: true,
        data: {
          period,
          status: 'open',
          reopenedAt: now,
          reopenedBy: user.name
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  static async getPeriodClosureStatus(period) {
    try {
      const closure = await new Promise((resolve, reject) => {
        db.get('SELECT * FROM period_closures WHERE period = ?', [period], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });

      return {
        success: true,
        data: closure || { period, status: 'open' }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  static async closeVoucher(voucherId, user) {
    const now = moment().format('YYYY-MM-DD HH:mm:ss');

    const existingVoucher = await VoucherService.getVoucherById(voucherId);
    if (!existingVoucher) {
      return { success: false, error: '凭证不存在' };
    }

    if (!VoucherEngine.canClose(existingVoucher.status)) {
      return { success: false, error: '当前状态不可结账' };
    }

    try {
      await new Promise((resolve, reject) => {
        db.run(
          `UPDATE vouchers SET status = ?, updated_at = ? WHERE id = ?`,
          [VoucherEngine.VOUCHER_STATUSES.CLOSED, now, voucherId],
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });

      VoucherService.logStatusFlow(
        voucherId, existingVoucher.status, VoucherEngine.VOUCHER_STATUSES.CLOSED,
        user, 'close', '凭证结账', 'backend'
      );

      VoucherService.logOperation(
        voucherId, user, 'close_voucher',
        JSON.stringify({ status: existingVoucher.status }),
        JSON.stringify({ status: VoucherEngine.VOUCHER_STATUSES.CLOSED }),
        'backend'
      );

      return { 
        success: true, 
        voucher: { id: voucherId, status: VoucherEngine.VOUCHER_STATUSES.CLOSED }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  static async uncloseVoucher(voucherId, user) {
    const now = moment().format('YYYY-MM-DD HH:mm:ss');

    const existingVoucher = await VoucherService.getVoucherById(voucherId);
    if (!existingVoucher) {
      return { success: false, error: '凭证不存在' };
    }

    if (existingVoucher.status !== VoucherEngine.VOUCHER_STATUSES.CLOSED) {
      return { success: false, error: '只有已关闭的凭证才能反结账' };
    }

    try {
      await new Promise((resolve, reject) => {
        db.run(
          `UPDATE vouchers SET status = ?, updated_at = ? WHERE id = ?`,
          [VoucherEngine.VOUCHER_STATUSES.PENDING_CLOSURE, now, voucherId],
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });

      VoucherService.logStatusFlow(
        voucherId, VoucherEngine.VOUCHER_STATUSES.CLOSED, VoucherEngine.VOUCHER_STATUSES.PENDING_CLOSURE,
        user, 'unclose', '凭证反结账', 'backend'
      );

      VoucherService.logOperation(
        voucherId, user, 'unclose_voucher',
        JSON.stringify({ status: VoucherEngine.VOUCHER_STATUSES.CLOSED }),
        JSON.stringify({ status: VoucherEngine.VOUCHER_STATUSES.PENDING_CLOSURE }),
        'backend'
      );

      return { 
        success: true, 
        voucher: { id: voucherId, status: VoucherEngine.VOUCHER_STATUSES.PENDING_CLOSURE }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

module.exports = ClosureService;
