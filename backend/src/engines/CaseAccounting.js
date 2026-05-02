const db = require('../database/init');

class CaseAccounting {
  static async recordTransaction(caseId, type, amount, category, description, recordedBy) {
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO transactions (case_id, type, amount, category, description, recorded_by)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [caseId, type, amount, category, description, recordedBy],
        function (err) {
          if (err) reject(err);
          else resolve({
            id: this.lastID,
            caseId,
            type,
            amount,
            category,
            recordedAt: new Date().toISOString()
          });
        }
      );
    });
  }

  static async confirmTransaction(transactionId, confirmedBy) {
    return new Promise((resolve, reject) => {
      const confirmedAt = new Date().toISOString();
      db.run(
        `UPDATE transactions 
         SET confirmed_at = ?, confirmed_by = ?
         WHERE id = ?`,
        [confirmedAt, confirmedBy, transactionId],
        function (err) {
          if (err) reject(err);
          else if (this.changes === 0) reject(new Error('交易记录不存在'));
          else resolve({ transactionId, confirmedAt, confirmedBy });
        }
      );
    });
  }

  static getCaseTransactions(caseId) {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT t.*, u1.name as recorder_name, u2.name as confirmer_name
         FROM transactions t
         LEFT JOIN users u1 ON t.recorded_by = u1.id
         LEFT JOIN users u2 ON t.confirmed_by = u2.id
         WHERE t.case_id = ?
         ORDER BY t.created_at DESC`,
        [caseId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  static calculateCaseProfit(caseId) {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT type, SUM(amount) as total
         FROM transactions
         WHERE case_id = ? AND confirmed_at IS NOT NULL
         GROUP BY type`,
        [caseId],
        (err, rows) => {
          if (err) return reject(err);

          const totals = { income: 0, expense: 0 };
          rows.forEach(row => {
            totals[row.type] = row.total;
          });

          const profit = totals.income - totals.expense;

          db.run(
            `UPDATE cases 
             SET fee_amount = ?, cost_amount = ?, profit_amount = ?
             WHERE id = ?`,
            [totals.income, totals.expense, profit, caseId],
            (err2) => {
              if (err2) reject(err2);
              else resolve({
                caseId,
                totalIncome: totals.income,
                totalExpense: totals.expense,
                profit
              });
            }
          );
        }
      );
    });
  }

  static async closeCase(caseId, closedBy) {
    const profitResult = await this.calculateCaseProfit(caseId);
    const closedDate = new Date().toISOString();

    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE cases 
         SET status = 'closed', closed_date = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [closedDate, caseId],
        function (err) {
          if (err) reject(err);
          else if (this.changes === 0) reject(new Error('案件不存在'));
          else resolve({
            caseId,
            status: 'closed',
            closedDate,
            ...profitResult
          });
        }
      );
    });
  }

  static async archiveCase(caseId, archivedBy) {
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT status FROM cases WHERE id = ?',
        [caseId],
        (err, row) => {
          if (err) return reject(err);
          if (!row) return reject(new Error('案件不存在'));
          if (row.status !== 'closed') {
            return reject(new Error('只有已结案的案件才能归档'));
          }

          db.run(
            `UPDATE cases 
             SET status = 'archived', updated_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [caseId],
            function (err2) {
              if (err2) reject(err2);
              else resolve({ caseId, status: 'archived', archivedAt: new Date().toISOString() });
            }
          );
        }
      );
    });
  }
}

module.exports = CaseAccounting;
