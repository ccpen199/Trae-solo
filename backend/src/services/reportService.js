const db = require('../config/database');
const VoucherEngine = require('../engines/voucherEngine');
const VoucherService = require('./voucherService');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');

class ReportService {
  static async generateBalanceSheet(period, user) {
    const now = moment().format('YYYY-MM-DD HH:mm:ss');

    const assets = await this.calculateAssets(period);
    const liabilities = await this.calculateLiabilities(period);
    const equity = await this.calculateEquity(period);

    const totalAssets = assets.reduce((sum, item) => sum + item.balance, 0);
    const totalLiabilities = liabilities.reduce((sum, item) => sum + item.balance, 0);
    const totalEquity = equity.reduce((sum, item) => sum + item.balance, 0);

    const isBalanced = Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01;

    try {
      const existingRecord = await new Promise((resolve, reject) => {
        db.get('SELECT * FROM balance_sheets WHERE period = ?', [period], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });

      if (existingRecord) {
        await new Promise((resolve, reject) => {
          db.run(
            `UPDATE balance_sheets SET 
              total_assets = ?, total_liabilities = ?, total_equity = ?,
              is_balanced = ?, check_result = ?, generated_by = ?, updated_at = ?
            WHERE period = ?`,
            [
              totalAssets, totalLiabilities, totalEquity,
              isBalanced ? 1 : 0,
              isBalanced ? '资产负债表平衡' : `不平衡：资产${totalAssets.toFixed(2)} ≠ 负债${totalLiabilities.toFixed(2)} + 权益${totalEquity.toFixed(2)}`,
              user.id, now, period
            ],
            (err) => {
              if (err) reject(err);
              else resolve();
            }
          );
        });
      } else {
        await new Promise((resolve, reject) => {
          db.run(
            `INSERT INTO balance_sheets (
              id, period, total_assets, total_liabilities, total_equity,
              is_balanced, check_result, generated_by, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              uuidv4(), period, totalAssets, totalLiabilities, totalEquity,
              isBalanced ? 1 : 0,
              isBalanced ? '资产负债表平衡' : `不平衡：资产${totalAssets.toFixed(2)} ≠ 负债${totalLiabilities.toFixed(2)} + 权益${totalEquity.toFixed(2)}`,
              user.id, now, now
            ],
            (err) => {
              if (err) reject(err);
              else resolve();
            }
          );
        });
      }

      return {
        success: true,
        data: {
          period,
          totalAssets,
          totalLiabilities,
          totalEquity,
          isBalanced,
          assets,
          liabilities,
          equity
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  static async generateProfitSheet(period, user) {
    const now = moment().format('YYYY-MM-DD HH:mm:ss');

    const revenues = await this.calculateRevenues(period);
    const costs = await this.calculateCosts(period);
    const expenses = await this.calculateExpenses(period);

    const totalRevenue = revenues.reduce((sum, item) => sum + item.balance, 0);
    const totalCost = costs.reduce((sum, item) => sum + item.balance, 0);
    const totalExpenses = expenses.reduce((sum, item) => sum + item.balance, 0);
    const netProfit = totalRevenue - totalCost - totalExpenses;

    try {
      const existingRecord = await new Promise((resolve, reject) => {
        db.get('SELECT * FROM profit_sheets WHERE period = ?', [period], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });

      if (existingRecord) {
        await new Promise((resolve, reject) => {
          db.run(
            `UPDATE profit_sheets SET 
              total_revenue = ?, total_cost = ?, total_expenses = ?, net_profit = ?,
              generated_by = ?, updated_at = ?
            WHERE period = ?`,
            [totalRevenue, totalCost, totalExpenses, netProfit, user.id, now, period],
            (err) => {
              if (err) reject(err);
              else resolve();
            }
          );
        });
      } else {
        await new Promise((resolve, reject) => {
          db.run(
            `INSERT INTO profit_sheets (
              id, period, total_revenue, total_cost, total_expenses, net_profit,
              generated_by, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              uuidv4(), period, totalRevenue, totalCost, totalExpenses, netProfit,
              user.id, now, now
            ],
            (err) => {
              if (err) reject(err);
              else resolve();
            }
          );
        });
      }

      return {
        success: true,
        data: {
          period,
          totalRevenue,
          totalCost,
          totalExpenses,
          netProfit,
          revenues,
          costs,
          expenses
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  static async generateReportForVoucher(voucherId, user) {
    const now = moment().format('YYYY-MM-DD HH:mm:ss');

    const existingVoucher = await VoucherService.getVoucherById(voucherId);
    if (!existingVoucher) {
      return { success: false, error: '凭证不存在' };
    }

    if (!VoucherEngine.canGenerateReport(existingVoucher.status)) {
      return { success: false, error: '当前状态不可生成报表' };
    }

    try {
      const nextStatus = VoucherEngine.getNextStatus(existingVoucher.status, 'generate');
      if (nextStatus) {
        await new Promise((resolve, reject) => {
          db.run(
            `UPDATE vouchers SET status = ?, updated_at = ? WHERE id = ?`,
            [nextStatus, now, voucherId],
            (err) => {
              if (err) reject(err);
              else resolve();
            }
          );
        });

        VoucherService.logStatusFlow(
          voucherId, existingVoucher.status, nextStatus,
          user, 'generate_report', '生成报表', 'backend'
        );

        const closureStatus = VoucherEngine.getNextStatus(nextStatus, 'closure');
        if (closureStatus) {
          await new Promise((resolve, reject) => {
            db.run(
              `UPDATE vouchers SET status = ?, updated_at = ? WHERE id = ?`,
              [closureStatus, now, voucherId],
              (err) => {
                if (err) reject(err);
                else resolve();
              }
            );
          });

          VoucherService.logStatusFlow(
            voucherId, nextStatus, closureStatus,
            user, 'closure', '报表生成后自动进入待月末结账', 'backend'
          );
        }
      }

      VoucherService.logOperation(
        voucherId, user, 'generate_report',
        JSON.stringify({ status: existingVoucher.status }),
        JSON.stringify({ status: nextStatus }),
        'backend'
      );

      VoucherService.createMessage(
        null, '会计/老板', '待办',
        `凭证 ${existingVoucher.voucher_no} 报表已生成，待月末结账`,
        voucherId
      );

      return { 
        success: true, 
        voucher: { id: voucherId, status: closureStatus || nextStatus }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  static async calculateAssets(period) {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT s.id, s.code, s.name, 
          COALESCE(SUM(CASE WHEN s.balance_direction = 'debit' THEN l.debit_amount - l.credit_amount ELSE l.credit_amount - l.debit_amount END), 0) as balance
         FROM subjects s
         LEFT JOIN ledgers l ON s.id = l.subject_id AND l.period <= ?
         WHERE s.type = 'asset' AND s.is_active = 1
         GROUP BY s.id, s.code, s.name
         ORDER BY s.code`,
        [period],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows.filter(r => r.balance !== 0));
        }
      );
    });
  }

  static async calculateLiabilities(period) {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT s.id, s.code, s.name,
          COALESCE(SUM(CASE WHEN s.balance_direction = 'debit' THEN l.debit_amount - l.credit_amount ELSE l.credit_amount - l.debit_amount END), 0) as balance
         FROM subjects s
         LEFT JOIN ledgers l ON s.id = l.subject_id AND l.period <= ?
         WHERE s.type = 'liability' AND s.is_active = 1
         GROUP BY s.id, s.code, s.name
         ORDER BY s.code`,
        [period],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows.filter(r => r.balance !== 0));
        }
      );
    });
  }

  static async calculateEquity(period) {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT s.id, s.code, s.name,
          COALESCE(SUM(CASE WHEN s.balance_direction = 'debit' THEN l.debit_amount - l.credit_amount ELSE l.credit_amount - l.debit_amount END), 0) as balance
         FROM subjects s
         LEFT JOIN ledgers l ON s.id = l.subject_id AND l.period <= ?
         WHERE s.type = 'equity' AND s.is_active = 1
         GROUP BY s.id, s.code, s.name
         ORDER BY s.code`,
        [period],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows.filter(r => r.balance !== 0));
        }
      );
    });
  }

  static async calculateRevenues(period) {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT s.id, s.code, s.name,
          COALESCE(SUM(CASE WHEN s.balance_direction = 'debit' THEN l.debit_amount - l.credit_amount ELSE l.credit_amount - l.debit_amount END), 0) as balance
         FROM subjects s
         LEFT JOIN ledgers l ON s.id = l.subject_id AND l.period = ?
         WHERE s.type = 'revenue' AND s.is_active = 1
         GROUP BY s.id, s.code, s.name
         ORDER BY s.code`,
        [period],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows.filter(r => r.balance !== 0));
        }
      );
    });
  }

  static async calculateCosts(period) {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT s.id, s.code, s.name,
          COALESCE(SUM(CASE WHEN s.balance_direction = 'debit' THEN l.debit_amount - l.credit_amount ELSE l.credit_amount - l.debit_amount END), 0) as balance
         FROM subjects s
         LEFT JOIN ledgers l ON s.id = l.subject_id AND l.period = ?
         WHERE s.type = 'expense' AND (s.code LIKE '54%') AND s.is_active = 1
         GROUP BY s.id, s.code, s.name
         ORDER BY s.code`,
        [period],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows.filter(r => r.balance !== 0));
        }
      );
    });
  }

  static async calculateExpenses(period) {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT s.id, s.code, s.name,
          COALESCE(SUM(CASE WHEN s.balance_direction = 'debit' THEN l.debit_amount - l.credit_amount ELSE l.credit_amount - l.debit_amount END), 0) as balance
         FROM subjects s
         LEFT JOIN ledgers l ON s.id = l.subject_id AND l.period = ?
         WHERE s.type = 'expense' AND (s.code LIKE '56%' OR s.code LIKE '57%' OR s.code LIKE '58%') AND s.is_active = 1
         GROUP BY s.id, s.code, s.name
         ORDER BY s.code`,
        [period],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows.filter(r => r.balance !== 0));
        }
      );
    });
  }

  static async getBalanceSheet(period) {
    try {
      const assets = await this.calculateAssets(period);
      const liabilities = await this.calculateLiabilities(period);
      const equity = await this.calculateEquity(period);

      const totalAssets = assets.reduce((sum, item) => sum + item.balance, 0);
      const totalLiabilities = liabilities.reduce((sum, item) => sum + item.balance, 0);
      const totalEquity = equity.reduce((sum, item) => sum + item.balance, 0);

      return {
        success: true,
        data: {
          period,
          totalAssets,
          totalLiabilities,
          totalEquity,
          isBalanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01,
          assets,
          liabilities,
          equity
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  static async getProfitSheet(period) {
    try {
      const revenues = await this.calculateRevenues(period);
      const costs = await this.calculateCosts(period);
      const expenses = await this.calculateExpenses(period);

      const totalRevenue = revenues.reduce((sum, item) => sum + item.balance, 0);
      const totalCost = costs.reduce((sum, item) => sum + item.balance, 0);
      const totalExpenses = expenses.reduce((sum, item) => sum + item.balance, 0);

      return {
        success: true,
        data: {
          period,
          totalRevenue,
          totalCost,
          totalExpenses,
          netProfit: totalRevenue - totalCost - totalExpenses,
          revenues,
          costs,
          expenses
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

module.exports = ReportService;
