const db = require('../config/database');
const VoucherEngine = require('../engines/voucherEngine');
const LedgerEngine = require('../engines/ledgerEngine');
const VoucherService = require('./voucherService');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');

class LedgerService {
  static async generateLedger(voucherId, user) {
    const now = moment().format('YYYY-MM-DD HH:mm:ss');

    const existingVoucher = await VoucherService.getVoucherById(voucherId);
    if (!existingVoucher) {
      return { success: false, error: '凭证不存在' };
    }

    if (!VoucherEngine.canGenerateLedger(existingVoucher.status)) {
      return { success: false, error: '当前状态不可生成账簿' };
    }

    try {
      await LedgerEngine.generateLedgerFromVoucher(voucherId);

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
          user, 'generate_ledger', '生成账簿', 'backend'
        );

        const reportStatus = VoucherEngine.getNextStatus(nextStatus, 'report');
        if (reportStatus) {
          await new Promise((resolve, reject) => {
            db.run(
              `UPDATE vouchers SET status = ?, updated_at = ? WHERE id = ?`,
              [reportStatus, now, voucherId],
              (err) => {
                if (err) reject(err);
                else resolve();
              }
            );
          });

          VoucherService.logStatusFlow(
            voucherId, nextStatus, reportStatus,
            user, 'report', '账簿生成后自动进入待出报表', 'backend'
          );
        }
      }

      VoucherService.logOperation(
        voucherId, user, 'generate_ledger',
        JSON.stringify({ status: existingVoucher.status }),
        JSON.stringify({ status: nextStatus }),
        'backend'
      );

      VoucherService.createMessage(
        null, '会计/审计', '待办',
        `凭证 ${existingVoucher.voucher_no} 账簿已生成，待出报表`,
        voucherId
      );

      return { 
        success: true, 
        voucher: { id: voucherId, status: reportStatus || nextStatus }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  static async getLedgerBySubject(subjectId, period) {
    try {
      const ledger = await LedgerEngine.getLedgerBySubject(subjectId, period);
      const summary = await LedgerEngine.getSubjectSummary(subjectId, period);
      
      return {
        success: true,
        data: {
          records: ledger,
          summary
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  static async getGeneralLedger(period) {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT 
          s.id, s.code, s.name, s.type, s.balance_direction,
          COALESCE(SUM(l.debit_amount), 0) as total_debit,
          COALESCE(SUM(l.credit_amount), 0) as total_credit
         FROM subjects s
         LEFT JOIN ledgers l ON s.id = l.subject_id AND l.period = ?
         WHERE s.is_active = 1
         GROUP BY s.id, s.code, s.name, s.type, s.balance_direction
         ORDER BY s.code`,
        [period],
        (err, rows) => {
          if (err) reject(err);
          else resolve({
            success: true,
            data: rows
          });
        }
      );
    });
  }

  static async getSubjectBalance(subjectId, period) {
    try {
      const balance = await LedgerEngine.getSubjectBalance(subjectId, period);
      return {
        success: true,
        data: { subjectId, period, balance }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

module.exports = LedgerService;
