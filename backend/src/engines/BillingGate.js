const { get, run } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

const PLATFORM_FEE_RATE = parseFloat(process.env.PLATFORM_FEE_RATE) || 0.20;
const LAWYER_COMMISSION_RATE = parseFloat(process.env.LAWYER_COMMISSION_RATE) || 0.80;
const TAX_RATE = parseFloat(process.env.TAX_RATE) || 0.06;

class BillingGate {
  constructor() {
    this.platformFeeRate = PLATFORM_FEE_RATE;
    this.lawyerCommissionRate = LAWYER_COMMISSION_RATE;
    this.taxRate = TAX_RATE;
  }

  calculateFees(amount) {
    const platformFee = amount * this.platformFeeRate;
    const taxAmount = platformFee * this.taxRate;
    const lawyerCommission = amount * this.lawyerCommissionRate;
    const lawyerTax = lawyerCommission * this.taxRate;
    const lawyerNet = lawyerCommission - lawyerTax;
    const totalTax = taxAmount + lawyerTax;
    const platformNet = platformFee - taxAmount;

    return {
      originalAmount: amount,
      platformFee,
      lawyerCommission,
      taxAmount,
      lawyerTax,
      totalTax,
      platformNet,
      lawyerNet,
      breakdown: {
        platform: {
          gross: platformFee,
          tax: taxAmount,
          net: platformNet
        },
        lawyer: {
          gross: lawyerCommission,
          tax: lawyerTax,
          net: lawyerNet
        }
      }
    };
  }

  async processPayment(consultationId, userId, amount, paymentMethod = 'online') {
    const consultation = await get(
      'SELECT * FROM consultations WHERE id = ? AND user_id = ?',
      [consultationId, userId]
    );

    if (!consultation) {
      return { success: false, message: '咨询单不存在或无权操作' };
    }

    if (consultation.status !== 'pending_payment') {
      return { success: false, message: '咨询单状态不正确，无法支付' };
    }

    const fees = this.calculateFees(amount);

    const paymentId = uuidv4();
    const transactionNo = `TXN${Date.now()}${Math.floor(Math.random() * 10000)}`;

    await run(`
      INSERT INTO payments (id, consultation_id, user_id, amount, payment_method, 
                            transaction_no, status, paid_at, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `, [paymentId, consultationId, userId, amount, paymentMethod, transactionNo, 'completed']);

    await this.createTransaction(
      userId,
      'payment',
      -amount,
      `支付咨询费 #${consultationId}`,
      consultationId,
      paymentId
    );

    await this.updateConsultationStatus(
      consultationId,
      'pending_accept',
      userId,
      'client',
      '支付完成，等待律师接单'
    );

    return {
      success: true,
      paymentId,
      transactionNo,
      consultationId,
      amount,
      fees,
      status: 'completed'
    };
  }

  async processSettlement(consultationId, reviewId = null) {
    const consultation = await get(`
      SELECT c.*, p.amount as payment_amount
      FROM consultations c
      JOIN payments p ON c.payment_id = p.id
      WHERE c.id = ?
    `, [consultationId]);

    if (!consultation) {
      return { success: false, message: '咨询单不存在' };
    }

    if (consultation.status !== 'reviewed') {
      return { success: false, message: '咨询单尚未完成评价，无法结算' };
    }

    if (!consultation.lawyer_id) {
      return { success: false, message: '未关联律师，无法结算' };
    }

    const fees = this.calculateFees(consultation.payment_amount);

    const lawyer = await get(
      'SELECT user_id FROM lawyers WHERE id = ?',
      [consultation.lawyer_id]
    );

    if (!lawyer) {
      return { success: false, message: '律师信息不存在' };
    }

    const wallet = await get(
      'SELECT * FROM user_wallets WHERE user_id = ?',
      [lawyer.user_id]
    );

    if (!wallet) {
      await run(`
        INSERT INTO user_wallets (id, user_id, balance, frozen_balance, total_income, created_at, updated_at)
        VALUES (?, ?, 0, 0, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `, [uuidv4(), lawyer.user_id]);
    }

    const balanceBefore = wallet ? wallet.balance : 0;
    const balanceAfter = balanceBefore + fees.lawyerNet;

    await run(`
      UPDATE user_wallets 
      SET balance = ?, total_income = total_income + ?, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ?
    `, [balanceAfter, fees.lawyerNet, lawyer.user_id]);

    await this.createTransaction(
      lawyer.user_id,
      'commission',
      fees.lawyerNet,
      `咨询费结算 #${consultationId}`,
      consultationId,
      consultation.payment_id,
      consultation.user_id
    );

    await run(
      'UPDATE consultations SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      ['settled', consultationId]
    );

    await this.updateConsultationStatus(
      consultationId,
      'settled',
      lawyer.user_id,
      'lawyer',
      '结算完成'
    );

    return {
      success: true,
      consultationId,
      lawyerId: consultation.lawyer_id,
      lawyerUserId: lawyer.user_id,
      amount: consultation.payment_amount,
      settlement: {
        lawyerGross: fees.lawyerCommission,
        lawyerTax: fees.lawyerTax,
        lawyerNet: fees.lawyerNet,
        platformFee: fees.platformFee,
        platformTax: fees.taxAmount,
        platformNet: fees.platformNet
      },
      balanceBefore,
      balanceAfter
    };
  }

  async processRefund(consultationId, refundAmount, reason) {
    const consultation = await get(`
      SELECT c.*, p.amount as payment_amount, p.transaction_no
      FROM consultations c
      JOIN payments p ON c.payment_id = p.id
      WHERE c.id = ?
    `, [consultationId]);

    if (!consultation) {
      return { success: false, message: '咨询单不存在' };
    }

    const actualRefund = Math.min(refundAmount, consultation.payment_amount);

    const wallet = await get(
      'SELECT * FROM user_wallets WHERE user_id = ?',
      [consultation.user_id]
    );

    const balanceBefore = wallet ? wallet.balance : 0;
    const balanceAfter = balanceBefore + actualRefund;

    if (wallet) {
      await run(`
        UPDATE user_wallets SET balance = ?, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ?
      `, [balanceAfter, consultation.user_id]);
    } else {
      await run(`
        INSERT INTO user_wallets (id, user_id, balance, frozen_balance, total_income, created_at, updated_at)
        VALUES (?, ?, ?, 0, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `, [uuidv4(), consultation.user_id, actualRefund]);
    }

    await this.createTransaction(
      consultation.user_id,
      'refund',
      actualRefund,
      `退款: ${reason} #${consultationId}`,
      consultationId,
      consultation.payment_id
    );

    return {
      success: true,
      consultationId,
      userId: consultation.user_id,
      refundAmount: actualRefund,
      reason,
      balanceBefore,
      balanceAfter
    };
  }

  async createTransaction(userId, type, amount, description, consultationId = null, paymentId = null, relatedUserId = null) {
    const wallet = await get(
      'SELECT * FROM user_wallets WHERE user_id = ?',
      [userId]
    );

    const balanceBefore = wallet ? wallet.balance : 0;
    const balanceAfter = balanceBefore + amount;

    const transactionId = uuidv4();

    await run(`
      INSERT INTO transactions (
        id, user_id, type, amount, balance_before, balance_after,
        consultation_id, payment_id, description, related_user_id, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `, [
      transactionId, userId, type, amount, balanceBefore, balanceAfter,
      consultationId, paymentId, description, relatedUserId
    ]);

    return {
      transactionId,
      userId,
      type,
      amount,
      balanceBefore,
      balanceAfter
    };
  }

  async updateConsultationStatus(consultationId, newStatus, changedBy, role, reason = null) {
    const consultation = await get(
      'SELECT status FROM consultations WHERE id = ?',
      [consultationId]
    );

    if (!consultation) return;

    const logId = uuidv4();

    await run(`
      INSERT INTO consultation_status_logs (id, consultation_id, from_status, to_status, changed_by, reason, created_at)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `, [logId, consultationId, consultation.status, newStatus, changedBy, reason]);
  }

  async getWalletBalance(userId) {
    const wallet = await get(
      'SELECT * FROM user_wallets WHERE user_id = ?',
      [userId]
    );

    if (!wallet) {
      return {
        success: true,
        balance: 0,
        frozen_balance: 0,
        total_income: 0,
        total_withdraw: 0
      };
    }

    return {
      success: true,
      balance: wallet.balance,
      frozen_balance: wallet.frozen_balance,
      total_income: wallet.total_income,
      total_withdraw: wallet.total_withdraw
    };
  }

  async getTransactionHistory(userId, limit = 20, offset = 0) {
    const transactions = await get(`
      SELECT t.*, u.real_name as related_user_name
      FROM transactions t
      LEFT JOIN users u ON t.related_user_id = u.id
      WHERE t.user_id = ?
      ORDER BY t.created_at DESC
      LIMIT ? OFFSET ?
    `, [userId, limit, offset]);

    return {
      success: true,
      transactions,
      limit,
      offset
    };
  }
}

module.exports = new BillingGate();
