const db = require('../database');
const { v4: uuidv4 } = require('uuid');

class GreenCreditEngine {
  constructor() {
    this.creditRules = {
      paper: 10,
      plastic: 15,
      metal: 20,
      glass: 5,
      electronics: 30,
      clothes: 8,
      battery: 25,
      organic: 3
    };
  }

  calculateCredit(category, weight) {
    const baseCreditPerKg = this.creditRules[category] || 5;
    const totalCredit = Math.floor(weight * baseCreditPerKg);
    return Math.max(1, totalCredit);
  }

  async addCredit(userId, amount, orderId, description) {
    return new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        
        db.get(
          `SELECT green_credit FROM users WHERE id = ?`,
          [userId],
          (err, user) => {
            if (err) {
              db.run('ROLLBACK');
              return reject(err);
            }
            
            if (!user) {
              db.run('ROLLBACK');
              return reject(new Error('用户不存在'));
            }

            const balanceBefore = user.green_credit;
            const balanceAfter = balanceBefore + amount;

            db.run(
              `UPDATE users SET green_credit = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
              [balanceAfter, userId],
              function(err) {
                if (err) {
                  db.run('ROLLBACK');
                  return reject(err);
                }

                const transactionId = uuidv4();
                db.run(
                  `INSERT INTO credit_transactions 
                   (id, user_id, order_id, type, amount, balance_before, balance_after, description)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                  [transactionId, userId, orderId, 'earn', amount, balanceBefore, balanceAfter, description],
                  function(err) {
                    if (err) {
                      db.run('ROLLBACK');
                      return reject(err);
                    }

                    db.run('COMMIT', (commitErr) => {
                      if (commitErr) {
                        db.run('ROLLBACK');
                        return reject(commitErr);
                      }
                      resolve({
                        transaction_id: transactionId,
                        amount,
                        balance_before: balanceBefore,
                        balance_after: balanceAfter
                      });
                    });
                  }
                );
              }
            );
          }
        );
      });
    });
  }

  async deductCredit(userId, amount, description) {
    return new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        
        db.get(
          `SELECT green_credit FROM users WHERE id = ?`,
          [userId],
          (err, user) => {
            if (err) {
              db.run('ROLLBACK');
              return reject(err);
            }
            
            if (!user) {
              db.run('ROLLBACK');
              return reject(new Error('用户不存在'));
            }

            if (user.green_credit < amount) {
              db.run('ROLLBACK');
              return reject(new Error('积分不足'));
            }

            const balanceBefore = user.green_credit;
            const balanceAfter = balanceBefore - amount;

            db.run(
              `UPDATE users SET green_credit = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
              [balanceAfter, userId],
              function(err) {
                if (err) {
                  db.run('ROLLBACK');
                  return reject(err);
                }

                const transactionId = uuidv4();
                db.run(
                  `INSERT INTO credit_transactions 
                   (id, user_id, type, amount, balance_before, balance_after, description)
                   VALUES (?, ?, ?, ?, ?, ?, ?)`,
                  [transactionId, userId, 'spend', amount, balanceBefore, balanceAfter, description],
                  function(err) {
                    if (err) {
                      db.run('ROLLBACK');
                      return reject(err);
                    }

                    db.run('COMMIT', (commitErr) => {
                      if (commitErr) {
                        db.run('ROLLBACK');
                        return reject(commitErr);
                      }
                      resolve({
                        transaction_id: transactionId,
                        amount,
                        balance_before: balanceBefore,
                        balance_after: balanceAfter
                      });
                    });
                  }
                );
              }
            );
          }
        );
      });
    });
  }

  async getUserCredit(userId) {
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT green_credit, carbon_reduction FROM users WHERE id = ?`,
        [userId],
        (err, row) => {
          if (err) return reject(err);
          resolve(row || null);
        }
      );
    });
  }

  async getCreditHistory(userId, limit = 50) {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT * FROM credit_transactions 
         WHERE user_id = ? 
         ORDER BY created_at DESC 
         LIMIT ?`,
        [userId, limit],
        (err, rows) => {
          if (err) return reject(err);
          resolve(rows);
        }
      );
    });
  }

  async processOrderCredit(orderId, userId, category, weight) {
    const creditAmount = this.calculateCredit(category, weight);
    const description = `回收${this.getCategoryName(category)}获得积分`;
    
    const result = await this.addCredit(userId, creditAmount, orderId, description);
    return {
      ...result,
      category,
      weight,
      credit_per_kg: this.creditRules[category] || 5
    };
  }

  getCategoryName(category) {
    const names = {
      paper: '废纸',
      plastic: '塑料',
      metal: '金属',
      glass: '玻璃',
      electronics: '电子产品',
      clothes: '旧衣物',
      battery: '废电池',
      organic: '厨余垃圾'
    };
    return names[category] || '其他';
  }

  async getCreditStatistics(userId) {
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT 
          green_credit as current_credit,
          (SELECT COALESCE(SUM(amount), 0) FROM credit_transactions WHERE user_id = ? AND type = 'earn') as total_earned,
          (SELECT COALESCE(SUM(amount), 0) FROM credit_transactions WHERE user_id = ? AND type = 'spend') as total_spent
         FROM users WHERE id = ?`,
        [userId, userId, userId],
        (err, row) => {
          if (err) return reject(err);
          resolve(row || { current_credit: 0, total_earned: 0, total_spent: 0 });
        }
      );
    });
  }
}

module.exports = new GreenCreditEngine();
