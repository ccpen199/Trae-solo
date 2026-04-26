import { AppDataSource } from '../data-source.js';
import { CreditAccount, CreditAccountType } from '../entities/CreditAccount.js';
import { CreditRecord, CreditRecordType } from '../entities/CreditRecord.js';
import { Farmer } from '../entities/Farmer.js';
import { RetailStore } from '../entities/RetailStore.js';
import { CreditApplication, CreditApplicationType } from '../entities/CreditApplication.js';
import { CreditAccountStatus, CreditApplicationStatus } from '../types/common.js';
import { Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';

export interface CreditScoreFactor {
  name: string;
  weight: number;
  score: number;
  maxScore: number;
  notes: string;
}

export interface CreditEvaluationResult {
  score: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  factors: CreditScoreFactor[];
  overallRisk: 'low' | 'medium' | 'high';
  recommendation: string;
  approvedLimit?: number;
  approvedTerm?: number;
  reasons?: string[];
}

export interface CreditCheckResult {
  available: boolean;
  reason?: string;
  currentLimit?: number;
  usedLimit?: number;
  availableLimit?: number;
  overdueAmount?: number;
  creditScore?: number;
}

export class CreditRiskEngine {
  private creditAccountRepository = AppDataSource.getRepository(CreditAccount);
  private creditRecordRepository = AppDataSource.getRepository(CreditRecord);
  private farmerRepository = AppDataSource.getRepository(Farmer);
  private retailStoreRepository = AppDataSource.getRepository(RetailStore);
  private creditApplicationRepository = AppDataSource.getRepository(CreditApplication);

  async evaluateCreditApplication(
    applicationId: string
  ): Promise<CreditEvaluationResult> {
    const application = await this.creditApplicationRepository.findOne({
      where: { id: applicationId },
      relations: ['creditAccount', 'order'],
    });

    if (!application) {
      throw new Error('信用申请不存在');
    }

    if (application.creditAccountId) {
      return this.evaluateExistingAccount(
        application.creditAccountId,
        application.requestedAmount,
        application
      );
    }

    return this.evaluateNewApplication(application);
  }

  private async evaluateExistingAccount(
    accountId: string,
    requestedAmount: number,
    application: CreditApplication
  ): Promise<CreditEvaluationResult> {
    const account = await this.creditAccountRepository.findOne({
      where: { id: accountId },
      relations: ['creditRecords'],
    });

    if (!account) {
      throw new Error('信用账户不存在');
    }

    const factors: CreditScoreFactor[] = [];
    const reasons: string[] = [];

    if (account.status !== CreditAccountStatus.ACTIVE) {
      factors.push({
        name: '账户状态',
        weight: 0.2,
        score: 0,
        maxScore: 100,
        notes: `账户状态: ${account.status}`,
      });
      reasons.push(`账户状态为 ${account.status}，无法使用`);
    } else {
      factors.push({
        name: '账户状态',
        weight: 0.2,
        score: 100,
        maxScore: 100,
        notes: '账户状态正常',
      });
    }

    if (account.overdueAmount > 0) {
      factors.push({
        name: '逾期记录',
        weight: 0.25,
        score: 0,
        maxScore: 100,
        notes: `当前逾期金额: ${account.overdueAmount}`,
      });
      reasons.push(`存在逾期金额 ${account.overdueAmount}`);
    } else {
      factors.push({
        name: '逾期记录',
        weight: 0.25,
        score: 100,
        maxScore: 100,
        notes: '无逾期记录',
      });
    }

    const availableCheck = account.checkCreditAvailability(requestedAmount);
    if (!availableCheck.available) {
      factors.push({
        name: '额度检查',
        weight: 0.2,
        score: 30,
        maxScore: 100,
        notes: availableCheck.reason || '额度不足',
      });
      reasons.push(availableCheck.reason || '额度不足');
    } else {
      factors.push({
        name: '额度检查',
        weight: 0.2,
        score: 100,
        maxScore: 100,
        notes: `可用额度: ${account.availableCreditLimit}`,
      });
    }

    const repaymentScore = this.calculateRepaymentScore(account);
    factors.push({
      name: '还款历史',
      weight: 0.2,
      score: repaymentScore,
      maxScore: 100,
      notes: `按时还款: ${account.onTimePaymentCount}次, 逾期: ${account.latePaymentCount}次`,
    });

    if (account.farmerId) {
      const farmerScore = await this.evaluateFarmerCredit(account.farmerId);
      factors.push({
        name: '农户信用',
        weight: 0.15,
        score: farmerScore,
        maxScore: 100,
        notes: '基于历史产量和履约记录评估',
      });
    }

    const totalScore = this.calculateWeightedScore(factors);
    const riskLevel = this.getRiskLevel(totalScore);
    const overallRisk = this.getOverallRisk(riskLevel);

    let recommendation = '建议拒绝';
    let approvedLimit = 0;
    let approvedTerm = 0;

    if (overallRisk === 'low') {
      recommendation = '建议批准';
      approvedLimit = Math.min(requestedAmount, account.availableCreditLimit);
      approvedTerm = account.creditTermsDays;
    } else if (overallRisk === 'medium') {
      recommendation = '建议审核后批准，可适当降低额度或缩短账期';
      approvedLimit = Math.min(requestedAmount * 0.7, account.availableCreditLimit * 0.7);
      approvedTerm = Math.min(account.creditTermsDays, 15);
    }

    return {
      score: totalScore,
      riskLevel,
      factors,
      overallRisk,
      recommendation,
      approvedLimit,
      approvedTerm,
      reasons: reasons.length > 0 ? reasons : undefined,
    };
  }

  private async evaluateNewApplication(
    application: CreditApplication
  ): Promise<CreditEvaluationResult> {
    const factors: CreditScoreFactor[] = [];

    if (application.creditAccount) {
      const account = application.creditAccount;
      
      if (account.farmerId) {
        const farmerScore = await this.evaluateFarmerCredit(account.farmerId);
        factors.push({
          name: '农户信用',
          weight: 0.35,
          score: farmerScore,
          maxScore: 100,
          notes: '基于历史产量和履约记录评估',
        });
      }

      if (account.retailStoreId) {
        const storeScore = await this.evaluateRetailStoreCredit(account.retailStoreId);
        factors.push({
          name: '门店信用',
          weight: 0.35,
          score: storeScore,
          maxScore: 100,
          notes: '基于门店经营状况评估',
        });
      }
    }

    factors.push({
      name: '申请类型',
      weight: 0.15,
      score: 80,
      maxScore: 100,
      notes: `首次申请，类型: ${application.applicationType}`,
    });

    factors.push({
      name: '申请金额',
      weight: 0.15,
      score: 70,
      maxScore: 100,
      notes: `申请金额: ${application.requestedAmount}`,
    });

    const totalScore = this.calculateWeightedScore(factors);
    const riskLevel = this.getRiskLevel(totalScore);
    const overallRisk = this.getOverallRisk(riskLevel);

    let recommendation = '建议审慎考虑';
    if (overallRisk === 'low') {
      recommendation = '建议批准，可建立初始额度';
    } else if (overallRisk === 'medium') {
      recommendation = '建议收集更多资料后评估';
    }

    return {
      score: totalScore,
      riskLevel,
      factors,
      overallRisk,
      recommendation,
    };
  }

  private async evaluateFarmerCredit(farmerId: string): Promise<number> {
    const farmer = await this.farmerRepository.findOne({
      where: { id: farmerId },
      relations: ['creditRecords', 'orders'],
    });

    if (!farmer) {
      return 50;
    }

    let score = 60;

    if (farmer.historicalYields && farmer.historicalYields.length > 0) {
      const recentYields = farmer.historicalYields.slice(-3);
      const avgYield = recentYields.reduce((sum, y) => sum + y.yieldAmount, 0) / recentYields.length;
      
      if (avgYield > 0) {
        score += 15;
      }
    }

    if (farmer.onTimePayments > 0) {
      const paymentRate = farmer.totalOrders > 0 
        ? farmer.onTimePayments / farmer.totalOrders 
        : 0;
      
      if (paymentRate >= 0.9) {
        score += 25;
      } else if (paymentRate >= 0.7) {
        score += 15;
      } else {
        score -= 10;
      }
    }

    if (farmer.latePayments > 0) {
      score -= farmer.latePayments * 5;
    }

    return Math.max(0, Math.min(100, score));
  }

  private async evaluateRetailStoreCredit(storeId: string): Promise<number> {
    const store = await this.retailStoreRepository.findOne({
      where: { id: storeId },
      relations: ['creditAccounts', 'orders'],
    });

    if (!store) {
      return 50;
    }

    let score = 60;

    if (store.status === 'active') {
      score += 10;
    }

    if (store.creditAccounts && store.creditAccounts.length > 0) {
      const account = store.creditAccounts[0];
      if (account) {
        if (account.onTimePaymentCount > 0 && account.totalOrders !== undefined) {
          const paymentRate = account.totalOrders > 0 
            ? account.onTimePaymentCount / account.totalOrders 
            : 0;
          
          if (paymentRate >= 0.95) {
            score += 30;
          } else if (paymentRate >= 0.85) {
            score += 20;
          } else if (paymentRate >= 0.7) {
            score += 10;
          }
        }

        if (account.overdueAmount > 0) {
          score -= 20;
        }
      }
    }

    return Math.max(0, Math.min(100, score));
  }

  private calculateRepaymentScore(account: CreditAccount): number {
    const totalPayments = account.onTimePaymentCount + account.latePaymentCount;
    
    if (totalPayments === 0) {
      return 70;
    }

    const onTimeRate = account.onTimePaymentCount / totalPayments;

    if (account.defaultCount > 0) {
      return 30;
    }

    if (onTimeRate >= 0.95) {
      return 100;
    } else if (onTimeRate >= 0.85) {
      return 85;
    } else if (onTimeRate >= 0.7) {
      return 65;
    } else {
      return 40;
    }
  }

  private calculateWeightedScore(factors: CreditScoreFactor[]): number {
    let totalWeight = 0;
    let weightedScore = 0;

    for (const factor of factors) {
      const normalizedScore = factor.score / factor.maxScore;
      weightedScore += normalizedScore * factor.weight;
      totalWeight += factor.weight;
    }

    if (totalWeight === 0) {
      return 50;
    }

    return Math.round((weightedScore / totalWeight) * 100);
  }

  private getRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score >= 80) {
      return 'low';
    } else if (score >= 60) {
      return 'medium';
    } else if (score >= 40) {
      return 'high';
    } else {
      return 'critical';
    }
  }

  private getOverallRisk(riskLevel: string): 'low' | 'medium' | 'high' {
    switch (riskLevel) {
      case 'low':
        return 'low';
      case 'medium':
        return 'medium';
      case 'high':
      case 'critical':
        return 'high';
      default:
        return 'medium';
    }
  }

  async checkCreditAvailability(
    accountId: string,
    amount: number
  ): Promise<CreditCheckResult> {
    const account = await this.creditAccountRepository.findOne({
      where: { id: accountId },
    });

    if (!account) {
      return {
        available: false,
        reason: '信用账户不存在',
      };
    }

    const check = account.checkCreditAvailability(amount);

    return {
      available: check.available,
      reason: check.reason,
      currentLimit: account.totalCreditLimit,
      usedLimit: account.usedCreditLimit,
      availableLimit: account.availableCreditLimit,
      overdueAmount: account.overdueAmount,
      creditScore: account.creditScore,
    };
  }

  async updateCreditScore(accountId: string): Promise<number> {
    const account = await this.creditAccountRepository.findOne({
      where: { id: accountId },
    });

    if (!account) {
      throw new Error('信用账户不存在');
    }

    const factors: CreditScoreFactor[] = [];

    if (account.status === CreditAccountStatus.ACTIVE) {
      factors.push({ name: '账户状态', weight: 0.15, score: 100, maxScore: 100, notes: '活跃' });
    } else {
      factors.push({ name: '账户状态', weight: 0.15, score: 20, maxScore: 100, notes: account.status });
    }

    if (account.overdueAmount > 0) {
      factors.push({ name: '逾期状况', weight: 0.25, score: 0, maxScore: 100, notes: `逾期: ${account.overdueAmount}` });
    } else {
      factors.push({ name: '逾期状况', weight: 0.25, score: 100, maxScore: 100, notes: '无逾期' });
    }

    const repaymentScore = this.calculateRepaymentScore(account);
    factors.push({ name: '还款历史', weight: 0.3, score: repaymentScore, maxScore: 100, notes: '' });

    const utilizationRate = account.totalCreditLimit > 0 
      ? account.usedCreditLimit / account.totalCreditLimit 
      : 0;
    
    let utilizationScore = 100;
    if (utilizationRate > 0.9) {
      utilizationScore = 40;
    } else if (utilizationRate > 0.7) {
      utilizationScore = 60;
    } else if (utilizationRate > 0.5) {
      utilizationScore = 80;
    }
    factors.push({ name: '额度使用率', weight: 0.3, score: utilizationScore, maxScore: 100, notes: `使用率: ${(utilizationRate * 100).toFixed(1)}%` });

    const newScore = this.calculateWeightedScore(factors);
    account.creditScore = newScore;
    await this.creditAccountRepository.save(account);

    return newScore;
  }
}

export const creditRiskEngine = new CreditRiskEngine();
