const db = require('../config/database');

class SubjectEngine {
  static validateSubject(subject) {
    if (!subject.code || !subject.name || !subject.type || !subject.balance_direction) {
      return { valid: false, error: '科目代码、名称、类型和余额方向为必填项' };
    }

    if (!['asset', 'liability', 'equity', 'revenue', 'expense'].includes(subject.type)) {
      return { valid: false, error: '科目类型必须为 asset、liability、equity、revenue 或 expense' };
    }

    if (!['debit', 'credit'].includes(subject.balance_direction)) {
      return { valid: false, error: '余额方向必须为 debit 或 credit' };
    }

    return { valid: true };
  }

  static async checkSubjectCodeExists(code, excludeId = null) {
    return new Promise((resolve, reject) => {
      let query = 'SELECT COUNT(*) as count FROM subjects WHERE code = ?';
      const params = [code];
      
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

  static calculateBalance(balanceDirection, debitAmount, creditAmount) {
    if (balanceDirection === 'debit') {
      return debitAmount - creditAmount;
    } else {
      return creditAmount - debitAmount;
    }
  }

  static isDebitSubject(type) {
    return ['asset', 'expense'].includes(type);
  }

  static isCreditSubject(type) {
    return ['liability', 'equity', 'revenue'].includes(type);
  }

  static getSubjectTypeLabel(type) {
    const labels = {
      asset: '资产类',
      liability: '负债类',
      equity: '权益类',
      revenue: '收入类',
      expense: '费用类'
    };
    return labels[type] || type;
  }
}

module.exports = SubjectEngine;
