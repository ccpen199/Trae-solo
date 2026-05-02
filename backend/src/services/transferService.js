const db = require('../database');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const ledgerKernel = require('../engines/ledgerKernel');
const antiFraud = require('../engines/antiFraud');
const amlMonitor = require('../engines/amlMonitor');
const hashChain = require('../engines/hashChain');

class TransferService {
  async checkAccountConsistency(accountId) {
    const account = await db.get('SELECT * FROM accounts WHERE id = ?', [accountId]);
    if (!account) {
      return { valid: false, error: '账户不存在' };
    }

    if (account.status !== 'active') {
      return { valid: false, error: '账户已冻结' };
    }

    const debitSum = await db.get(
      `SELECT COALESCE(SUM(amount), 0) as total 
       FROM ledger_entries 
       WHERE account_id = ? AND entry_type = 'debit'`,
      [accountId]
    );

    const creditSum = await db.get(
      `SELECT COALESCE(SUM(amount), 0) as total 
       FROM ledger_entries 
       WHERE account_id = ? AND entry_type = 'credit'`,
      [accountId]
    );

    const calculatedBalance = (creditSum.total || 0) - (debitSum.total || 0);

    if (Math.abs(calculatedBalance - account.balance) > 0.01) {
      return {
        valid: false,
        error: '账户余额不一致',
        expected: account.balance,
        calculated: calculatedBalance
      };
    }

    return {
      valid: true,
      accountId,
      balance: account.balance,
      frozenBalance: account.frozen_balance,
      status: account.status
    };
  }

  async executeTransfer(fromUserId, toAccountNumber, amount, description = '') {
    if (amount <= 0) {
      throw new Error('转账金额必须大于0');
    }

    const fromAccount = await db.get('SELECT * FROM accounts WHERE user_id = ?', [fromUserId]);
    if (!fromAccount || fromAccount.status !== 'active') {
      throw new Error('付款账户不存在或已冻结');
    }

    const fromUser = await db.get('SELECT status FROM users WHERE id = ?', [fromUserId]);
    if (fromUser.status !== 'active') {
      throw new Error('付款用户未完成实名激活');
    }

    const fromConsistency = await this.checkAccountConsistency(fromAccount.id);
    if (!fromConsistency.valid) {
      throw new Error(`付款账户异常: ${fromConsistency.error}`);
    }

    const toAccount = await db.get('SELECT * FROM accounts WHERE account_number = ?', [toAccountNumber]);
    if (!toAccount || toAccount.status !== 'active') {
      throw new Error('收款账户不存在或已冻结');
    }

    const toConsistency = await this.checkAccountConsistency(toAccount.id);
    if (!toConsistency.valid) {
      throw new Error(`收款账户异常: ${toConsistency.error}`);
    }

    if (fromAccount.id === toAccount.id) {
      throw new Error('不能向自己转账');
    }

    const riskAnalysis = await antiFraud.analyzeTransaction({
      userId: fromUserId,
      amount,
      toAccountId: toAccount.id,
      transactionType: 'transfer'
    });

    if (riskAnalysis.status === 'blocked') {
      await db.run(
        `INSERT INTO operation_logs (
          id, user_id, operation_type, detail
        ) VALUES (?, ?, ?, ?)`,
        [
          uuidv4(),
          fromUserId,
          'transfer_blocked',
          `转账被反欺诈引擎拦截: ${JSON.stringify(riskAnalysis.reasons)}`
        ]
      );
      throw new Error('转账存在风险，已被拦截');
    }

    const amlResult = await amlMonitor.monitorTransaction({
      userId: fromUserId,
      amount,
      from_account_id: fromAccount.id,
      to_account_id: toAccount.id
    });

    if (amlResult.status === 'suspended') {
      throw new Error('转账触发AML监控，已暂停处理');
    }

    const result = await ledgerKernel.executeTransfer({
      fromUserId,
      toAccountNumber,
      amount,
      description: description || '账户转账'
    });

    await antiFraud.updateTransactionRisk(
      result.transactionId,
      riskAnalysis.riskScore,
      riskAnalysis.status
    );

    await amlMonitor.updateTransactionAMLStatus(
      result.transactionId,
      amlResult.status
    );

    await hashChain.createBlock([result.transactionId], 'transfer');

    const voucher = await this.createElectronicVoucher(result.transactionId, {
      fromAccount: fromAccount.account_number,
      toAccount: toAccountNumber,
      amount,
      transactionType: 'transfer'
    });

    await this.sendTransferNotification(fromUserId, toAccount.user_id, result.transactionId, amount, voucher);

    await db.run(
      `INSERT INTO operation_logs (
        id, user_id, operation_type, detail
      ) VALUES (?, ?, ?, ?)`,
      [
        uuidv4(),
        fromUserId,
        'transfer',
        `转账成功: 从 ${fromAccount.account_number} 到 ${toAccountNumber}, 金额 ${amount} 元, 交易号: ${result.transactionNo}`
      ]
    );

    const transaction = await ledgerKernel.getTransaction(result.transactionId);

    return {
      success: true,
      transactionId: result.transactionId,
      transactionNo: result.transactionNo,
      fromAccount: fromAccount.account_number,
      toAccount: toAccountNumber,
      amount,
      fromNewBalance: result.fromNewBalance,
      toNewBalance: result.toNewBalance,
      voucher,
      riskScore: riskAnalysis.riskScore,
      riskLevel: riskAnalysis.riskLevel,
      amlStatus: amlResult.status,
      transaction,
      message: '转账成功，电子凭证已推送'
    };
  }

  async createElectronicVoucher(transactionId, voucherData) {
    const voucherNo = this.generateVoucherNo();
    const hashData = {
      voucherNo,
      transactionId,
      ...voucherData,
      timestamp: new Date().toISOString()
    };
    const hashValue = crypto.createHash('sha256').update(JSON.stringify(hashData)).digest('hex');

    const voucherId = uuidv4();
    await db.run(
      `INSERT INTO electronic_vouchers (
        id, voucher_no, transaction_id, from_account, to_account, 
        amount, currency, voucher_type, hash_value
      ) VALUES (?, ?, ?, ?, ?, ?, 'CNY', ?, ?)`,
      [
        voucherId,
        voucherNo,
        transactionId,
        voucherData.fromAccount,
        voucherData.toAccount,
        voucherData.amount,
        voucherData.transactionType,
        hashValue
      ]
    );

    return {
      voucherId,
      voucherNo,
      hashValue,
      ...voucherData
    };
  }

  async sendTransferNotification(fromUserId, toUserId, transactionId, amount, voucher) {
    const fromUser = await db.get('SELECT username FROM users WHERE id = ?', [fromUserId]);
    const toUser = await db.get('SELECT username FROM users WHERE id = ?', [toUserId]);

    await db.run(
      `INSERT INTO notifications (
        id, user_id, notification_type, title, content, related_transaction_id
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        uuidv4(),
        fromUserId,
        'transfer_out',
        '转账成功',
        `您已成功转出 ${amount} 元，凭证号: ${voucher.voucherNo}`,
        transactionId
      ]
    );

    await db.run(
      `INSERT INTO notifications (
        id, user_id, notification_type, title, content, related_transaction_id
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        uuidv4(),
        toUserId,
        'transfer_in',
        '收到转账',
        `您收到来自 ${fromUser.username} 的转账 ${amount} 元，凭证号: ${voucher.voucherNo}`,
        transactionId
      ]
    );
  }

  async getTransferHistory(userId, limit = 50) {
    const account = await db.get('SELECT id FROM accounts WHERE user_id = ?', [userId]);
    if (!account) {
      return [];
    }

    const transactions = await db.all(
      `SELECT t.*, 
              fa.account_number as from_account,
              ta.account_number as to_account,
              fu.username as from_username,
              fu.real_name as from_real_name,
              tu.username as to_username,
              tu.real_name as to_real_name
       FROM transactions t
       LEFT JOIN accounts fa ON t.from_account_id = fa.id
       LEFT JOIN accounts ta ON t.to_account_id = ta.id
       LEFT JOIN users fu ON fa.user_id = fu.id
       LEFT JOIN users tu ON ta.user_id = tu.id
       WHERE (t.from_account_id = ? OR t.to_account_id = ?)
       AND t.transaction_type = 'transfer'
       ORDER BY t.created_at DESC
       LIMIT ?`,
      [account.id, account.id, limit]
    );

    return transactions.map(tx => ({
      ...tx,
      direction: tx.from_account_id === account.id ? 'outgoing' : 'incoming'
    }));
  }

  async getVoucher(transactionId) {
    const voucher = await db.get(
      `SELECT ev.*, t.transaction_no, t.created_at as transaction_time
       FROM electronic_vouchers ev
       JOIN transactions t ON ev.transaction_id = t.id
       WHERE ev.transaction_id = ?`,
      [transactionId]
    );

    if (!voucher) {
      throw new Error('凭证不存在');
    }

    return voucher;
  }

  async verifyVoucher(voucherNo) {
    const voucher = await db.get('SELECT * FROM electronic_vouchers WHERE voucher_no = ?', [voucherNo]);
    if (!voucher) {
      return { valid: false, error: '凭证不存在' };
    }

    const hashTrace = await hashChain.traceTransaction(voucher.transaction_id);

    return {
      valid: true,
      voucher,
      hashVerified: hashTrace.found,
      blocks: hashTrace.blocks
    };
  }

  generateVoucherNo() {
    const now = new Date();
    const dateStr = now.getFullYear().toString() +
                   (now.getMonth() + 1).toString().padStart(2, '0') +
                   now.getDate().toString().padStart(2, '0');
    const randomStr = Math.random().toString(36).substring(2, 10).toUpperCase();
    return `VCH${dateStr}${randomStr}`;
  }
}

module.exports = new TransferService();
