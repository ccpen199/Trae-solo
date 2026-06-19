import { Transaction, ITransaction } from '@models/Transaction';
import { User, IUser } from '@models/User';
import { Device, IDevice } from '@models/Device';
import { config } from '@config/index';
import { CryptoService } from '@security/crypto';
import { logger } from '@utils/logger';
import { generateTransactionNo } from '@utils/helpers';
import { userService } from './userService';

export interface DeductParams {
  userId: string;
  deviceId: string;
  waterVolume: number;
  unitPrice?: number;
  description?: string;
}

export interface TransactionQueryParams {
  userId?: string;
  deviceId?: string;
  investorId?: string;
  projectId?: string;
  type?: 'recharge' | 'dispense' | 'refund' | 'bonus' | 'adjustment' | 'deduct' | 'payment';
  status?: 'pending' | 'completed' | 'failed' | 'refunded' | 'success';
  startDate?: Date;
  endDate?: Date;
  page?: number;
  pageSize?: number;
}

export interface BillingParams {
  userId: string;
  deviceId: string;
  startTime: Date;
  endTime: Date;
  totalWaterVolume: number;
  totalAmount: number;
  pricingDetails: Array<{
    tier: number;
    unitPrice: number;
    amount: number;
  }>;
}

export interface TieredPricing {
  minVolume: number;
  maxVolume?: number;
  unitPrice: number;
}

export interface PricingDetailWithTier extends TieredPricing {
  amount: number;
  tier: number;
}

export class TransactionService {
  private static instance: TransactionService;

  private constructor() {}

  public static getInstance(): TransactionService {
    if (!TransactionService.instance) {
      TransactionService.instance = new TransactionService();
    }
    return TransactionService.instance;
  }

  private getTieredPricing(): TieredPricing[] {
    return [
      { minVolume: 0, maxVolume: 10, unitPrice: config.business.waterPricePerLiter || 2.0 },
      { minVolume: 10, maxVolume: 20, unitPrice: (config.business.waterPricePerLiter || 2.0) * 1.5 },
      { minVolume: 20, unitPrice: (config.business.waterPricePerLiter || 2.0) * 2.25 }
    ];
  }

  public calculateTieredAmount(waterVolume: number): { totalAmount: number; pricingDetails: PricingDetailWithTier[] } {
    const pricingTiers = this.getTieredPricing();
    let remainingVolume = waterVolume;
    let totalAmount = 0;
    const pricingDetails: PricingDetailWithTier[] = [];

    for (let i = 0; i < pricingTiers.length; i++) {
      const tier = pricingTiers[i];
      const tierVolume = tier.maxVolume 
        ? Math.min(remainingVolume, tier.maxVolume - tier.minVolume)
        : remainingVolume;

      if (tierVolume > 0) {
        const amount = tierVolume * tier.unitPrice;
        totalAmount += amount;
        pricingDetails.push({
          ...tier,
          tier: i + 1,
          amount
        });
        remainingVolume -= tierVolume;
      }

      if (remainingVolume <= 0) break;
    }

    return { totalAmount, pricingDetails };
  }

  public async realTimeDeduct(params: DeductParams): Promise<ITransaction> {
    try {
      const { userId, deviceId, waterVolume, description } = params;

      if (!userId) {
        throw new Error('用户ID不能为空');
      }

      if (!deviceId) {
        throw new Error('设备ID不能为空');
      }

      if (typeof waterVolume !== 'number' || waterVolume <= 0) {
        throw new Error('用水量必须大于0');
      }

      const user = await User.findById(userId);
      if (!user) {
        throw new Error('用户不存在');
      }

      const device = await Device.findById(deviceId);
      if (!device) {
        throw new Error('设备不存在');
      }

      const { totalAmount, pricingDetails } = this.calculateTieredAmount(waterVolume);

      const isSufficient = await userService.checkBalanceSufficient(userId, totalAmount);
      if (!isSufficient) {
        const transaction = new Transaction({
          transactionNo: generateTransactionNo(),
          userId,
          deviceId,
          type: 'dispense',
          amount: totalAmount,
          waterVolume,
          pricingDetails,
          status: 'failed',
          description: '余额不足，扣费失败',
          balanceBefore: user.balance || 0,
          balanceAfter: user.balance || 0,
          failedReason: 'insufficient_balance'
        });
        await transaction.save();
        
        throw new Error(`余额不足，当前余额: ${user.balance || 0}元，需要: ${totalAmount.toFixed(2)}元`);
      }

      const balanceBefore = user.balance || 0;
      const balanceAfter = balanceBefore - totalAmount;

      const transaction = new Transaction({
        transactionNo: generateTransactionNo(),
        userId,
        deviceId,
        type: 'dispense',
        amount: totalAmount,
        waterVolume,
        pricingDetails,
        status: 'completed',
        description,
        balanceBefore,
        balanceAfter,
        deductTime: new Date()
      });

      await transaction.save();

      await User.findByIdAndUpdate(userId, {
        $set: { balance: balanceAfter },
        $push: {
          balanceRecords: {
            type: 'deduct',
            amount: totalAmount,
            description: description || `设备用水扣费: ${waterVolume}升`,
            balanceBefore,
            balanceAfter,
            createdAt: new Date()
          }
        }
      });

      logger.info(`实时扣费成功: transactionNo=${transaction.transactionNo}, userId=${userId}, amount=${totalAmount}, waterVolume=${waterVolume}`);
      return transaction;
    } catch (error) {
      logger.error('实时扣费失败:', error);
      throw error;
    }
  }

  public async generateBill(params: BillingParams): Promise<ITransaction> {
    try {
      const { userId, deviceId, startTime, endTime, totalWaterVolume, totalAmount, pricingDetails } = params;

      if (!userId || !deviceId) {
        throw new Error('用户ID和设备ID不能为空');
      }

      if (totalWaterVolume <= 0) {
        throw new Error('用水量必须大于0');
      }

      const transaction = new Transaction({
        transactionNo: generateTransactionNo(),
        userId,
        deviceId,
        type: 'dispense',
        amount: totalAmount,
        waterVolume: totalWaterVolume,
        pricingDetails,
        status: 'pending',
        description: '账单生成',
        billingPeriod: {
          startTime,
          endTime
        },
        createdAt: new Date()
      });

      await transaction.save();
      logger.info(`生成账单成功: transactionNo=${transaction.transactionNo}, amount=${totalAmount}`);
      return transaction;
    } catch (error) {
      logger.error('生成账单失败:', error);
      throw error;
    }
  }

  public async processBill(transactionId: string): Promise<ITransaction> {
    try {
      if (!transactionId) {
        throw new Error('交易ID不能为空');
      }

      const transaction = await Transaction.findById(transactionId);
      if (!transaction) {
        throw new Error('交易不存在');
      }

      if (transaction.status !== 'pending') {
        throw new Error('交易状态不正确');
      }

      const user = await User.findById(transaction.userId);
      if (!user) {
        throw new Error('用户不存在');
      }

      const isSufficient = await userService.checkBalanceSufficient(transaction.userId.toString(), transaction.amount);
      if (!isSufficient) {
        await Transaction.findByIdAndUpdate(transactionId, {
          $set: {
            status: 'failed',
            failedReason: 'insufficient_balance'
          }
        });
        throw new Error('余额不足，账单支付失败');
      }

      const balanceBefore = user.balance || 0;
      const balanceAfter = balanceBefore - transaction.amount;

      await Transaction.findByIdAndUpdate(transactionId, {
        $set: {
          status: 'completed',
          balanceBefore,
          balanceAfter,
          deductTime: new Date()
        }
      });

      await User.findByIdAndUpdate(transaction.userId, {
        $set: { balance: balanceAfter },
        $push: {
          balanceRecords: {
            type: 'deduct',
            amount: transaction.amount,
            description: '账单支付',
            balanceBefore,
            balanceAfter,
            createdAt: new Date()
          }
        }
      });

      logger.info(`账单支付成功: transactionNo=${transaction.transactionNo}, amount=${transaction.amount}`);
      return await Transaction.findById(transactionId) as ITransaction;
    } catch (error) {
      logger.error('账单支付失败:', error);
      throw error;
    }
  }

  public async getTransactionById(transactionId: string): Promise<ITransaction> {
    try {
      if (!transactionId) {
        throw new Error('交易ID不能为空');
      }

      const transaction = await Transaction.findById(transactionId)
        .populate('userId', 'realName phone')
        .populate('deviceId', 'deviceId deviceName');

      if (!transaction) {
        throw new Error('交易不存在');
      }

      return transaction;
    } catch (error) {
      logger.error('获取交易详情失败:', error);
      throw error;
    }
  }

  public async getTransactionByNo(transactionNo: string): Promise<ITransaction> {
    try {
      if (!transactionNo) {
        throw new Error('交易编号不能为空');
      }

      const transaction = await Transaction.findOne({ transactionNo })
        .populate('userId', 'realName phone')
        .populate('deviceId', 'deviceId deviceName');

      if (!transaction) {
        throw new Error('交易不存在');
      }

      return transaction;
    } catch (error) {
      logger.error('获取交易详情失败:', error);
      throw error;
    }
  }

  public async queryTransactions(params: TransactionQueryParams): Promise<{ transactions: ITransaction[]; total: number }> {
    try {
      const page = params.page || 1;
      const pageSize = params.pageSize || 20;

      const query: any = {};

      if (params.userId) {
        query.userId = params.userId;
      }
      if (params.deviceId) {
        query.deviceId = params.deviceId;
      }
      if (params.investorId) {
        query.investorId = params.investorId;
      }
      if (params.projectId) {
        query.projectId = params.projectId;
      }
      if (params.type) {
        query.type = params.type;
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
      const transactions = await Transaction.find(query)
        .populate('userId', 'realName phone')
        .populate('deviceId', 'deviceId deviceName')
        .sort({ createdAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize);

      return { transactions, total };
    } catch (error) {
      logger.error('查询交易记录失败:', error);
      throw error;
    }
  }

  public async refundTransaction(transactionId: string, reason: string): Promise<ITransaction> {
    try {
      if (!transactionId) {
        throw new Error('交易ID不能为空');
      }

      const transaction = await Transaction.findById(transactionId);
      if (!transaction) {
        throw new Error('交易不存在');
      }

      if (transaction.status !== 'completed') {
        throw new Error('只有成功的交易才能退款');
      }

      if (transaction.type !== 'dispense' && transaction.type !== 'recharge') {
        throw new Error('该类型交易不支持退款');
      }

      const user = await User.findById(transaction.userId);
      if (!user) {
        throw new Error('用户不存在');
      }

      const refundAmount = transaction.amount;
      const balanceBefore = user.balance || 0;
      const balanceAfter = balanceBefore + refundAmount;

      await Transaction.findByIdAndUpdate(transactionId, {
        $set: {
          status: 'refunded',
          refundReason: reason,
          refundTime: new Date()
        }
      });

      await User.findByIdAndUpdate(transaction.userId, {
        $set: { balance: balanceAfter },
        $push: {
          balanceRecords: {
            type: 'refund',
            amount: refundAmount,
            description: reason || '交易退款',
            balanceBefore,
            balanceAfter,
            createdAt: new Date()
          }
        }
      });

      const refundTransaction = new Transaction({
        transactionNo: generateTransactionNo(),
        userId: transaction.userId,
        deviceId: transaction.deviceId,
        type: 'refund',
        amount: refundAmount,
        status: 'completed',
        description: `退款: ${transaction.transactionNo}`,
        originalTransactionId: transactionId,
        balanceBefore,
        balanceAfter
      });
      await refundTransaction.save();

      logger.info(`退款成功: transactionId=${transactionId}, refundAmount=${refundAmount}`);
      return refundTransaction;
    } catch (error) {
      logger.error('退款失败:', error);
      throw error;
    }
  }

  public async getTransactionStatistics(params: {
    investorId?: string;
    projectId?: string;
    startDate: Date;
    endDate: Date;
  }): Promise<any> {
    try {
      const { investorId, projectId, startDate, endDate } = params;

      const match: any = {
        createdAt: { $gte: startDate, $lte: endDate },
        status: 'completed'
      };

      if (investorId) match.investorId = investorId;
      if (projectId) match.projectId = projectId;

      const stats = await Transaction.aggregate([
        { $match: match },
        {
          $group: {
            _id: '$type',
            count: { $sum: 1 },
            totalAmount: { $sum: '$amount' },
            totalWaterVolume: { $sum: '$waterVolume' }
          }
        }
      ]);

      const result: any = {
        totalTransactionCount: 0,
        totalAmount: 0,
        totalWaterVolume: 0,
        byType: {}
      };

      stats.forEach((stat: any) => {
        result.byType[stat._id] = {
          count: stat.count,
          totalAmount: stat.totalAmount,
          totalWaterVolume: stat.totalWaterVolume
        };
        result.totalTransactionCount += stat.count;
        result.totalAmount += stat.totalAmount;
        result.totalWaterVolume += stat.totalWaterVolume || 0;
      });

      return result;
    } catch (error) {
      logger.error('获取交易统计失败:', error);
      throw error;
    }
  }

  public async checkAndDeductLowBalance(userId: string, threshold: number = 10): Promise<boolean> {
    try {
      const balance = await userService.getBalance(userId);
      
      if (balance < threshold) {
        logger.warn(`用户余额不足提醒: userId=${userId}, balance=${balance}, threshold=${threshold}`);
        return false;
      }
      
      return true;
    } catch (error) {
      logger.error('检查余额失败:', error);
      throw error;
    }
  }
}

export const transactionService = TransactionService.getInstance();
