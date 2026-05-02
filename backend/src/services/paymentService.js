const db = require('../database');
const { v4: uuidv4 } = require('uuid');
const ledgerKernel = require('../engines/ledgerKernel');
const antiFraud = require('../engines/antiFraud');
const amlMonitor = require('../engines/amlMonitor');
const hashChain = require('../engines/hashChain');

class PaymentService {
  async scanAndPay(userId, merchantNo, amount, description = '') {
    if (amount <= 0) {
      throw new Error('支付金额必须大于0');
    }

    const userAccount = await db.get('SELECT * FROM accounts WHERE user_id = ?', [userId]);
    if (!userAccount || userAccount.status !== 'active') {
      throw new Error('用户账户不存在或已冻结');
    }

    const user = await db.get('SELECT status FROM users WHERE id = ?', [userId]);
    if (user.status !== 'active') {
      throw new Error('用户未完成实名激活');
    }

    const merchant = await db.get('SELECT * FROM merchants WHERE merchant_no = ?', [merchantNo]);
    if (!merchant || merchant.status !== 'active') {
      throw new Error('商户不存在或已停用');
    }

    const merchantAccount = await db.get('SELECT * FROM accounts WHERE user_id = ?', [merchant.id]);
    if (!merchantAccount) {
      const merchantAccountId = uuidv4();
      const accountNumber = this.generateAccountNumber();
      
      await db.run(
        `INSERT INTO accounts (
          id, user_id, account_number, account_type, balance, frozen_balance, 
          currency, status, daily_limit
        ) VALUES (?, ?, ?, 'merchant', 0, 0, 'CNY', 'active', ?)`,
        [merchantAccountId, merchant.id, accountNumber, process.env.DAILY_LIMIT_MERCHANT || 1000000]
      );
    }

    const merchantAccountFinal = await db.get('SELECT * FROM accounts WHERE user_id = ?', [merchant.id]);

    const riskAnalysis = await antiFraud.analyzeTransaction({
      userId,
      amount,
      toAccountId: merchantAccountFinal.id,
      transactionType: 'payment'
    });

    if (riskAnalysis.status === 'blocked') {
      await db.run(
        `INSERT INTO operation_logs (
          id, user_id, operation_type, detail
        ) VALUES (?, ?, ?, ?)`,
        [
          uuidv4(),
          userId,
          'payment_blocked',
          `支付被反欺诈引擎拦截: ${JSON.stringify(riskAnalysis.reasons)}`
        ]
      );
      throw new Error('支付存在风险，已被拦截，请联系客服');
    }

    const amlResult = await amlMonitor.monitorTransaction({
      userId,
      amount,
      from_account_id: userAccount.id,
      to_account_id: merchantAccountFinal.id
    });

    if (amlResult.status === 'suspended') {
      throw new Error('支付触发AML监控，已暂停处理');
    }

    const result = await ledgerKernel.executePayment({
      userId,
      merchantId: merchant.id,
      amount,
      description: description || `向 ${merchant.merchant_name} 支付`
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

    await hashChain.createBlock([result.transactionId], 'payment');

    await db.run(
      `INSERT INTO operation_logs (
        id, user_id, operation_type, detail
      ) VALUES (?, ?, ?, ?)`,
      [
        uuidv4(),
        userId,
        'payment',
        `支付成功: 向商户 ${merchant.merchant_name} 支付 ${amount} 元, 交易号: ${result.transactionNo}`
      ]
    );

    const transaction = await ledgerKernel.getTransaction(result.transactionId);

    return {
      success: true,
      transactionId: result.transactionId,
      transactionNo: result.transactionNo,
      amount,
      merchantName: merchant.merchant_name,
      newBalance: result.fromNewBalance,
      riskScore: riskAnalysis.riskScore,
      riskLevel: riskAnalysis.riskLevel,
      amlStatus: amlResult.status,
      transaction,
      message: '支付成功'
    };
  }

  async generateQRCode(merchantId, amount = null) {
    const merchant = await db.get('SELECT * FROM merchants WHERE id = ?', [merchantId]);
    if (!merchant) {
      throw new Error('商户不存在');
    }

    const qrData = {
      type: 'payment',
      merchantNo: merchant.merchant_no,
      merchantName: merchant.merchant_name,
      amount,
      timestamp: Date.now()
    };

    const qrCodeData = JSON.stringify(qrData);

    return {
      merchantId,
      merchantNo: merchant.merchant_no,
      merchantName: merchant.merchant_name,
      amount,
      qrCodeData,
      qrCodeString: Buffer.from(qrCodeData).toString('base64')
    };
  }

  async getPaymentStatus(transactionId) {
    const transaction = await ledgerKernel.getTransaction(transactionId);
    if (!transaction) {
      throw new Error('交易不存在');
    }

    const ledgerEntries = await ledgerKernel.getLedgerEntries(transactionId);
    const hashTrace = await hashChain.traceTransaction(transactionId);

    return {
      transaction,
      ledgerEntries,
      hashVerified: hashTrace.found,
      blocks: hashTrace.blocks
    };
  }

  async getMerchantPayments(merchantId, limit = 50) {
    const merchant = await db.get('SELECT * FROM merchants WHERE id = ?', [merchantId]);
    if (!merchant) {
      throw new Error('商户不存在');
    }

    const account = await db.get('SELECT id FROM accounts WHERE user_id = ?', [merchantId]);
    if (!account) {
      return [];
    }

    return await db.all(
      `SELECT t.*, 
              fa.account_number as from_account,
              u.username as payer_username,
              u.real_name as payer_name
       FROM transactions t
       LEFT JOIN accounts fa ON t.from_account_id = fa.id
       LEFT JOIN users u ON fa.user_id = u.id
       WHERE t.to_account_id = ? AND t.transaction_type = 'payment'
       ORDER BY t.created_at DESC
       LIMIT ?`,
      [account.id, limit]
    );
  }

  generateAccountNumber() {
    const prefix = '9999';
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return prefix + timestamp + random;
  }
}

module.exports = new PaymentService();
