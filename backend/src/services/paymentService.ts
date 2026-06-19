import { Transaction, ITransaction } from '@models/Transaction';
import { User, IUser } from '@models/User';
import { config } from '@config/index';
import { CryptoService } from '@security/crypto';
import { logger } from '@utils/logger';
import { generateTransactionNo } from '@utils/helpers';
import { userService } from './userService';
import * as crypto from 'crypto';

export interface PaymentOrderParams {
  userId: string;
  amount: number;
  subject: string;
  body?: string;
  returnUrl?: string;
  notifyUrl?: string;
}

export interface AlipayOrderParams {
  out_trade_no: string;
  total_amount: string;
  subject: string;
  body?: string;
  product_code: string;
  quit_url?: string;
}

export interface AlipayNotifyParams {
  trade_no: string;
  out_trade_no: string;
  trade_status: string;
  total_amount: string;
  receipt_amount?: string;
  buyer_logon_id?: string;
  gmt_payment?: string;
  sign: string;
  sign_type: string;
  [key: string]: any;
}

export interface RefundParams {
  transactionId: string;
  refundAmount: number;
  refundReason: string;
}

export class PaymentService {
  private static instance: PaymentService;

  private constructor() {}

  public static getInstance(): PaymentService {
    if (!PaymentService.instance) {
      PaymentService.instance = new PaymentService();
    }
    return PaymentService.instance;
  }

  private getAlipayConfig() {
    const alipayConfig = config.alipay;
    if (!alipayConfig) {
      throw new Error('支付宝配置未找到');
    }
    return {
      appId: alipayConfig.appId,
      privateKey: alipayConfig.privateKey,
      publicKey: alipayConfig.publicKey,
      gateway: alipayConfig.gateway || 'https://openapi.alipay.com/gateway.do',
      notifyUrl: alipayConfig.notifyUrl,
      returnUrl: alipayConfig.returnUrl
    };
  }

  private generateAlipaySign(params: Record<string, any>, privateKey: string): string {
    const sortedParams = this.sortParams(params);
    const signContent = Object.keys(sortedParams)
      .filter(key => key !== 'sign' && key !== 'sign_type' && sortedParams[key] !== undefined && sortedParams[key] !== '')
      .map(key => `${key}=${sortedParams[key]}`)
      .join('&');

    const sign = crypto.createSign('RSA-SHA256');
    sign.update(signContent, 'utf8');
    return sign.sign(privateKey, 'base64');
  }

  private verifyAlipaySign(params: AlipayNotifyParams, publicKey: string): boolean {
    try {
      const sign = params.sign;
      const signType = params.sign_type;

      const paramsToVerify: Record<string, any> = {};
      Object.keys(params)
        .filter(key => key !== 'sign' && key !== 'sign_type')
        .sort()
        .forEach(key => {
          paramsToVerify[key] = params[key];
        });

      const signContent = Object.keys(paramsToVerify)
        .map(key => `${key}=${paramsToVerify[key]}`)
        .join('&');

      const verify = crypto.createVerify('RSA-SHA256');
      verify.update(signContent, 'utf8');
      return verify.verify(publicKey, sign, 'base64');
    } catch (error) {
      logger.error('验证支付宝签名失败:', error);
      return false;
    }
  }

  private sortParams(params: Record<string, any>): Record<string, any> {
    const sorted: Record<string, any> = {};
    Object.keys(params).sort().forEach(key => {
      sorted[key] = params[key];
    });
    return sorted;
  }

  public async createAlipayH5Order(params: PaymentOrderParams): Promise<{ order: ITransaction; payUrl: string }> {
    try {
      const { userId, amount, subject, body, returnUrl, notifyUrl } = params;

      if (!userId) {
        throw new Error('用户ID不能为空');
      }

      if (typeof amount !== 'number' || amount <= 0) {
        throw new Error('支付金额必须大于0');
      }

      if (!subject || subject.length > 256) {
        throw new Error('订单标题不能为空且长度不能超过256个字符');
      }

      const user = await User.findById(userId);
      if (!user) {
        throw new Error('用户不存在');
      }

      const alipayConfig = this.getAlipayConfig();
      const outTradeNo = generateTransactionNo();

      const transaction = new Transaction({
        transactionNo: outTradeNo,
        userId,
        type: 'recharge',
        amount,
        paymentMethod: 'alipay_h5',
        status: 'pending',
        description: subject + (body ? ` - ${body}` : ''),
        balanceBefore: user.balance || 0,
        balanceAfter: user.balance || 0,
        createdAt: new Date()
      });
      await transaction.save();

      const orderParams: AlipayOrderParams = {
        out_trade_no: outTradeNo,
        total_amount: amount.toFixed(2),
        subject,
        body,
        product_code: 'QUICK_WAP_WAY',
        quit_url: returnUrl || alipayConfig.returnUrl
      };

      const commonParams: Record<string, any> = {
        app_id: alipayConfig.appId,
        method: 'alipay.trade.wap.pay',
        format: 'JSON',
        charset: 'utf-8',
        sign_type: 'RSA2',
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        version: '1.0',
        notify_url: notifyUrl || alipayConfig.notifyUrl,
        return_url: returnUrl || alipayConfig.returnUrl,
        biz_content: JSON.stringify(orderParams)
      };

      const sign = this.generateAlipaySign(commonParams, alipayConfig.privateKey);
      commonParams['sign'] = sign;

      const queryString = Object.keys(commonParams)
        .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(commonParams[key])}`)
        .join('&');

      const payUrl = `${alipayConfig.gateway}?${queryString}`;

      logger.info(`创建支付宝H5支付订单成功: outTradeNo=${outTradeNo}, amount=${amount}`);
      return { order: transaction, payUrl };
    } catch (error) {
      logger.error('创建支付宝H5支付订单失败:', error);
      throw error;
    }
  }

  public async handleAlipayNotify(notifyParams: AlipayNotifyParams): Promise<boolean> {
    try {
      logger.info('收到支付宝支付回调:', JSON.stringify(notifyParams));

      const alipayConfig = this.getAlipayConfig();

      if (!this.verifyAlipaySign(notifyParams, alipayConfig.publicKey)) {
        logger.error('支付宝回调签名验证失败');
        return false;
      }

      const { out_trade_no, trade_status, total_amount, trade_no } = notifyParams;

      const transaction = await Transaction.findOne({ transactionNo: out_trade_no });
      if (!transaction) {
        logger.error(`交易不存在: out_trade_no=${out_trade_no}`);
        return false;
      }

      if (transaction.status === 'completed') {
        logger.info(`交易已处理成功，忽略重复回调: out_trade_no=${out_trade_no}`);
        return true;
      }

      const amount = parseFloat(total_amount);
      if (Math.abs(transaction.amount - amount) > 0.01) {
        logger.error(`金额不一致: 订单金额=${transaction.amount}, 回调金额=${amount}`);
        return false;
      }

      if (trade_status === 'TRADE_SUCCESS' || trade_status === 'TRADE_FINISHED') {
        await this.processPaymentSuccess(transaction, trade_no, notifyParams);
      } else if (trade_status === 'TRADE_CLOSED') {
        await this.processPaymentClosed(transaction);
      }

      return true;
    } catch (error) {
      logger.error('处理支付宝支付回调失败:', error);
      return false;
    }
  }

  private async processPaymentSuccess(transaction: ITransaction, tradeNo: string, notifyParams: AlipayNotifyParams): Promise<void> {
    const user = await User.findById(transaction.userId);
    if (!user) {
      throw new Error('用户不存在');
    }

    const balanceBefore = user.balance || 0;
    const balanceAfter = balanceBefore + transaction.amount;

    await Transaction.findByIdAndUpdate(transaction._id, {
      $set: {
        status: 'completed',
        thirdPartyTradeNo: tradeNo,
        payTime: notifyParams.gmt_payment ? new Date(notifyParams.gmt_payment) : new Date(),
        balanceBefore,
        balanceAfter,
        buyerAccount: notifyParams.buyer_logon_id,
        receiptAmount: notifyParams.receipt_amount ? parseFloat(notifyParams.receipt_amount) : undefined
      }
    });

    await User.findByIdAndUpdate(transaction.userId, {
      $set: { balance: balanceAfter },
      $push: {
        balanceRecords: {
          type: 'recharge',
          amount: transaction.amount,
          description: transaction.description || '支付宝充值',
          balanceBefore,
          balanceAfter,
          createdAt: new Date()
        }
      }
    });

    logger.info(`支付成功处理完成: transactionNo=${transaction.transactionNo}, amount=${transaction.amount}`);
  }

  private async processPaymentClosed(transaction: ITransaction): Promise<void> {
    await Transaction.findByIdAndUpdate(transaction._id, {
      $set: {
        status: 'failed',
        failedReason: 'TRADE_CLOSED'
      }
    });

    logger.info(`支付关闭: transactionNo=${transaction.transactionNo}`);
  }

  public async queryPaymentStatus(transactionId: string): Promise<{ status: string; transaction: ITransaction }> {
    try {
      if (!transactionId) {
        throw new Error('交易ID不能为空');
      }

      const transaction = await Transaction.findById(transactionId);
      if (!transaction) {
        throw new Error('交易不存在');
      }

      return { status: transaction.status, transaction };
    } catch (error) {
      logger.error('查询支付状态失败:', error);
      throw error;
    }
  }

  public async alipayRefund(params: RefundParams): Promise<ITransaction> {
    try {
      const { transactionId, refundAmount, refundReason } = params;

      if (!transactionId) {
        throw new Error('交易ID不能为空');
      }

      if (typeof refundAmount !== 'number' || refundAmount <= 0) {
        throw new Error('退款金额必须大于0');
      }

      const transaction = await Transaction.findById(transactionId);
      if (!transaction) {
        throw new Error('交易不存在');
      }

      if (transaction.status !== 'completed') {
        throw new Error('只有成功的支付交易才能退款');
      }

      if (transaction.type !== 'recharge') {
        throw new Error('该交易类型不支持退款');
      }

      if (refundAmount > transaction.amount) {
        throw new Error('退款金额不能超过支付金额');
      }

      const user = await User.findById(transaction.userId);
      if (!user) {
        throw new Error('用户不存在');
      }

      if ((user.balance || 0) < refundAmount) {
        throw new Error('用户余额不足');
      }

      const balanceBefore = user.balance || 0;
      const balanceAfter = balanceBefore - refundAmount;

      await User.findByIdAndUpdate(transaction.userId, {
        $set: { balance: balanceAfter },
        $push: {
          balanceRecords: {
            type: 'deduct',
            amount: refundAmount,
            description: refundReason || '退款扣除',
            balanceBefore,
            balanceAfter,
            createdAt: new Date()
          }
        }
      });

      const refundTransaction = new Transaction({
        transactionNo: generateTransactionNo(),
        userId: transaction.userId,
        type: 'refund',
        amount: refundAmount,
        paymentMethod: 'alipay_h5',
        status: 'pending',
        description: `退款: ${transaction.description || '订单'}`,
        originalTransactionId: transactionId,
        balanceBefore,
        balanceAfter
      });
      await refundTransaction.save();

      const alipayConfig = this.getAlipayConfig();
      const refundParams = {
        out_trade_no: transaction.transactionNo,
        out_request_no: refundTransaction.transactionNo,
        refund_amount: refundAmount.toFixed(2),
        refund_reason: refundReason || '正常退款'
      };

      const commonParams: Record<string, any> = {
        app_id: alipayConfig.appId,
        method: 'alipay.trade.refund',
        format: 'JSON',
        charset: 'utf-8',
        sign_type: 'RSA2',
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        version: '1.0',
        biz_content: JSON.stringify(refundParams)
      };

      const sign = this.generateAlipaySign(commonParams, alipayConfig.privateKey);
      commonParams['sign'] = sign;

      logger.info(`发起支付宝退款: transactionNo=${transaction.transactionNo}, refundAmount=${refundAmount}`);

      await Transaction.findByIdAndUpdate(refundTransaction._id, {
        $set: {
          status: 'completed',
          refundTime: new Date()
        }
      });

      return refundTransaction;
    } catch (error) {
      logger.error('支付宝退款失败:', error);
      throw error;
    }
  }

  public async getPaymentOrder(transactionId: string): Promise<ITransaction> {
    try {
      if (!transactionId) {
        throw new Error('交易ID不能为空');
      }

      const transaction = await Transaction.findById(transactionId)
        .populate('userId', 'realName phone');

      if (!transaction) {
        throw new Error('订单不存在');
      }

      return transaction;
    } catch (error) {
      logger.error('获取支付订单失败:', error);
      throw error;
    }
  }

  public async getPaymentOrders(params: {
    userId?: string;
    status?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    pageSize?: number;
  }): Promise<{ orders: ITransaction[]; total: number }> {
    try {
      const page = params.page || 1;
      const pageSize = params.pageSize || 20;

      const query: any = {
        type: { $in: ['recharge', 'refund'] }
      };

      if (params.userId) {
        query.userId = params.userId;
      }
      if (params.status) {
        query.status = params.status;
      }
      if (params.startDate || params.endDate) {
        query.createdAt = {};
        if (params.startDate) {
          query.createdAt.$gte = params.startDate;
        }
        if (params.endDate) {
          query.createdAt.$lte = params.endDate;
        }
      }

      const total = await Transaction.countDocuments(query);
      const orders = await Transaction.find(query)
        .populate('userId', 'realName phone')
        .sort({ createdAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize);

      return { orders, total };
    } catch (error) {
      logger.error('获取支付订单列表失败:', error);
      throw error;
    }
  }

  public async closeExpiredOrders(): Promise<number> {
    try {
      const expireTime = new Date(Date.now() - 30 * 60 * 1000);
      
      const result = await Transaction.updateMany(
        {
          type: 'recharge',
          status: 'pending',
          createdAt: { $lt: expireTime }
        },
        {
          $set: {
            status: 'failed',
            failedReason: 'order_expired'
          }
        }
      );

      logger.info(`关闭过期订单数量: ${result.modifiedCount}`);
      return result.modifiedCount;
    } catch (error) {
      logger.error('关闭过期订单失败:', error);
      throw error;
    }
  }
}

export const paymentService = PaymentService.getInstance();
