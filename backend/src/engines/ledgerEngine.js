const db = require('../config/database');
const SubjectEngine = require('./subjectEngine');

class LedgerEngine {
  static async generateLedgerFromVoucher(voucherId) {
    return new Promise((resolve, reject) => {
      db.serialize(async () => {
        try {
          db.run('BEGIN TRANSACTION');

          const voucher = await this.getVoucherById(voucherId);
          if (!voucher) {
            db.run('ROLLBACK');
            return reject(new Error('凭证不存在'));
          }

          const details = await this.getVoucherDetails(voucherId);
          if (!details || details.length === 0) {
            db.run('ROLLBACK');
            return reject(new Error('凭证明细不存在'));
          }

          for (const detail of details) {
            const subject = await this.getSubjectById(detail.subject_id);
            if (!subject) continue;

            const previousBalance = await this.getSubjectBalance(subject.id, voucher.period);
            const newBalance = SubjectEngine.calculateBalance(
              subject.balance_direction,
              previousBalance + detail.debit_amount,
              previousBalance + detail.credit_amount
            );

            await this.insertLedgerRecord({
              voucher_id: voucherId,
              voucher_detail_id: detail.id,
              subject_id: subject.id,
              subject_code: subject.code,
              subject_name: subject.name,
              period: voucher.period,
              debit_amount: detail.debit_amount,
              credit_amount: detail.credit_amount,
              balance: newBalance
            });
          }

          db.run('COMMIT');
          resolve({ success: true, voucherId });
        } catch (error) {
          db.run('ROLLBACK');
          reject(error);
        }
      });
    });
  }

  static getVoucherById(voucherId) {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM vouchers WHERE id = ?', [voucherId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  static getVoucherDetails(voucherId) {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM voucher_details WHERE voucher_id = ? ORDER BY sort_order', [voucherId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  static getSubjectById(subjectId) {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM subjects WHERE id = ?', [subjectId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  static getSubjectBalance(subjectId, period) {
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT SUM(debit_amount) as total_debit, SUM(credit_amount) as total_credit 
         FROM ledgers WHERE subject_id = ? AND period <= ?`,
        [subjectId, period],
        (err, row) => {
          if (err) reject(err);
          else resolve((row.total_debit || 0) - (row.total_credit || 0));
        }
      );
    });
  }

  static insertLedgerRecord(ledger) {
    const { v4: uuidv4 } = require('uuid');
    const moment = require('moment');
    const now = moment().format('YYYY-MM-DD HH:mm:ss');

    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO ledgers (
          id, voucher_id, voucher_detail_id, subject_id, subject_code, 
          subject_name, period, debit_amount, credit_amount, balance, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          uuidv4(),
          ledger.voucher_id,
          ledger.voucher_detail_id,
          ledger.subject_id,
          ledger.subject_code,
          ledger.subject_name,
          ledger.period,
          ledger.debit_amount,
          ledger.credit_amount,
          ledger.balance,
          now
        ],
        (err) => {
          if (err) reject(err);
          else resolve({ success: true });
        }
      );
    });
  }

  static async getLedgerBySubject(subjectId, period) {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT l.*, v.voucher_no, v.voucher_date 
         FROM ledgers l 
         LEFT JOIN vouchers v ON l.voucher_id = v.id 
         WHERE l.subject_id = ? AND l.period = ? 
         ORDER BY v.voucher_date, l.created_at`,
        [subjectId, period],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  static async getSubjectSummary(subjectId, period) {
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT 
          SUM(debit_amount) as total_debit,
          SUM(credit_amount) as total_credit,
          COUNT(*) as record_count
         FROM ledgers WHERE subject_id = ? AND period = ?`,
        [subjectId, period],
        (err, row) => {
          if (err) reject(err);
          else resolve({
            total_debit: row.total_debit || 0,
            total_credit: row.total_credit || 0,
            record_count: row.record_count || 0
          });
        }
      );
    });
  }
}

module.exports = LedgerEngine;
