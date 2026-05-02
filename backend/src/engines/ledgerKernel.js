const db = require('../database');
const { v4: uuidv4 } = require('uuid');

class LedgerKernel {
  constructor() {
    this.ENTRY_TYPES = {
      DEBIT: 'debit',
      CREDIT: 'credit'
    };
  }

  async getAccount(accountId) {
    return await db.get(
      'SELECT * FROM accounts WHERE id = ? AND status = "active"',
      [accountId]
    );
  }

  async getAccountByNumber(accountNumber) {
    return await db.get(
      'SELECT * FROM accounts WHERE account_number = ? AND status = "active"',
      [accountNumber]
    );
  }

  async getAccountByUserId(userId) {
    return await db.get(
      'SELECT * FROM accounts WHERE user_id = ? AND status = "active"',
      [userId]
    );
  }

  async validateTransfer(fromAccount, toAccount, amount) {
    if (!fromAccount || fromAccount.status !== 'active') {
      return { valid: false, error: '付款账户不存在或已冻结' };
    }

    if (!toAccount || toAccount.status !== 'active') {
      return { valid: false, error: '收款账户不存在或已冻结' };
    }

    if (fromAccount.balance < amount) {
      return { valid: false, error: '余额不足' };
    }

    if (amount <= 0) {
      return { valid: false, error: '转账金额必须大于0' };
    }

    const dailyLimit = fromAccount.daily_limit;
    const todaySpent = await this.getDailySpent(fromAccount.id);
    
    if (todaySpent + amount > dailyLimit) {
      return { valid: false, error: `超出日限额，当前已使用 ${todaySpent}，限额 ${dailyLimit}` };
    }

    return { valid: true };
  }

  async getDailySpent(accountId) {
    const today = new Date().toISOString().split('T')[0];
    const result = await db.get(
      `SELECT COALESCE(SUM(amount), 0) as total 
       FROM transactions 
       WHERE from_account_id = ? 
       AND status = 'completed'
       AND date(created_at) = ?`,
      [accountId, today]
    );
    return result.total || 0;
  }

  async executeDoubleEntry(transactionData) {
    const { fromAccountId, toAccountId, amount, transactionType, description, merchantId } = transactionData;

    const fromAccount = await this.getAccount(fromAccountId);
    const toAccount = await this.getAccount(toAccountId);

    const validation = await this.validateTransfer(fromAccount, toAccount, amount);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const transactionNo = this.generateTransactionNo();
    const transactionId = uuidv4();

    const fromNewBalance = fromAccount.balance - amount;
    const toNewBalance = toAccount.balance + amount;

    try {
      await db.exec('BEGIN TRANSACTION');

      await db.run(
        `INSERT INTO transactions (
          id, transaction_no, from_account_id, to_account_id, 
          amount, transaction_type, status, description, merchant_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          transactionId, transactionNo, fromAccountId, toAccountId,
          amount, transactionType, 'pending', description, merchantId
        ]
      );

      const debitEntryId = uuidv4();
      await db.run(
        `INSERT INTO ledger_entries (
          id, transaction_id, account_id, entry_type, amount, balance_after, description
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          debitEntryId, transactionId, fromAccountId, this.ENTRY_TYPES.DEBIT,
          amount, fromNewBalance, `支付 ${amount} 元`
        ]
      );

      const creditEntryId = uuidv4();
      await db.run(
        `INSERT INTO ledger_entries (
          id, transaction_id, account_id, entry_type, amount, balance_after, description
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          creditEntryId, transactionId, toAccountId, this.ENTRY_TYPES.CREDIT,
          amount, toNewBalance, `收到 ${amount} 元`
        ]
      );

      await db.run(
        'UPDATE accounts SET balance = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [fromNewBalance, fromAccountId]
      );

      await db.run(
        'UPDATE accounts SET balance = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [toNewBalance, toAccountId]
      );

      await db.run(
        `UPDATE transactions 
         SET status = 'completed', updated_at = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [transactionId]
      );

      await db.exec('COMMIT');

      return {
        success: true,
        transactionId,
        transactionNo,
        fromNewBalance,
        toNewBalance
      };
    } catch (error) {
      await db.exec('ROLLBACK');
      throw error;
    }
  }

  async executePayment(paymentData) {
    const { userId, merchantId, amount, description } = paymentData;

    const userAccount = await this.getAccountByUserId(userId);
    if (!userAccount) {
      throw new Error('用户账户不存在');
    }

    const merchantAccount = await this.getAccountByUserId(merchantId);
    if (!merchantAccount) {
      throw new Error('商户账户不存在');
    }

    return await this.executeDoubleEntry({
      fromAccountId: userAccount.id,
      toAccountId: merchantAccount.id,
      amount,
      transactionType: 'payment',
      description: description || '扫码支付',
      merchantId
    });
  }

  async executeTransfer(transferData) {
    const { fromUserId, toAccountNumber, amount, description } = transferData;

    const fromAccount = await this.getAccountByUserId(fromUserId);
    if (!fromAccount) {
      throw new Error('付款账户不存在');
    }

    const toAccount = await this.getAccountByNumber(toAccountNumber);
    if (!toAccount) {
      throw new Error('收款账户不存在');
    }

    return await this.executeDoubleEntry({
      fromAccountId: fromAccount.id,
      toAccountId: toAccount.id,
      amount,
      transactionType: 'transfer',
      description: description || '账户转账'
    });
  }

  async getTransaction(transactionId) {
    return await db.get(
      `SELECT t.*, 
              fa.account_number as from_account,
              ta.account_number as to_account
       FROM transactions t
       LEFT JOIN accounts fa ON t.from_account_id = fa.id
       LEFT JOIN accounts ta ON t.to_account_id = ta.id
       WHERE t.id = ?`,
      [transactionId]
    );
  }

  async getTransactionByNo(transactionNo) {
    return await db.get(
      `SELECT t.*, 
              fa.account_number as from_account,
              ta.account_number as to_account
       FROM transactions t
       LEFT JOIN accounts fa ON t.from_account_id = fa.id
       LEFT JOIN accounts ta ON t.to_account_id = ta.id
       WHERE t.transaction_no = ?`,
      [transactionNo]
    );
  }

  async getAccountTransactions(accountId, limit = 20) {
    return await db.all(
      `SELECT t.*, 
              fa.account_number as from_account,
              ta.account_number as to_account
       FROM transactions t
       LEFT JOIN accounts fa ON t.from_account_id = fa.id
       LEFT JOIN accounts ta ON t.to_account_id = ta.id
       WHERE t.from_account_id = ? OR t.to_account_id = ?
       ORDER BY t.created_at DESC
       LIMIT ?`,
      [accountId, accountId, limit]
    );
  }

  async getLedgerEntries(transactionId) {
    return await db.all(
      `SELECT le.*, a.account_number
       FROM ledger_entries le
       JOIN accounts a ON le.account_id = a.id
       WHERE le.transaction_id = ?
       ORDER BY le.created_at`,
      [transactionId]
    );
  }

  generateTransactionNo() {
    const now = new Date();
    const dateStr = now.getFullYear().toString() +
                   (now.getMonth() + 1).toString().padStart(2, '0') +
                   now.getDate().toString().padStart(2, '0');
    const timeStr = now.getHours().toString().padStart(2, '0') +
                   now.getMinutes().toString().padStart(2, '0') +
                   now.getSeconds().toString().padStart(2, '0');
    const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `TXN${dateStr}${timeStr}${randomStr}`;
  }
}

module.exports = new LedgerKernel();
