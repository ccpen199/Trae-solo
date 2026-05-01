import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';
import { AppDataSource } from '../database/dataSource';
import { FraudCheckEntity } from '../entities';
import { FraudCheckResult, AuditAction, UserRole } from '../types';
import { auditService } from '../services/auditService';

export interface FraudCheckContext {
  userId?: string;
  deviceFingerprint?: string;
  ipAddress?: string;
  userAgent?: string;
  action: 'claim_coupon' | 'use_coupon' | 'refund_coupon' | 'create_order';
  couponIds?: string[];
  orderAmount?: number;
  storeId?: string;
  traceId: string;
}

export interface RiskRule {
  id: string;
  name: string;
  weight: number;
  check: (context: FraudCheckContext, history: FraudCheckEntity[]) => boolean;
  reason: string;
  enabled: boolean;
}

export class AntiFraudEngine {
  private static instance: AntiFraudEngine;
  private rules: RiskRule[] = [];

  private constructor() {
    this.initializeRules();
  }

  static getInstance(): AntiFraudEngine {
    if (!AntiFraudEngine.instance) {
      AntiFraudEngine.instance = new AntiFraudEngine();
    }
    return AntiFraudEngine.instance;
  }

  private initializeRules(): void {
    this.rules = [
      {
        id: 'rule_001',
        name: '同一设备短时间内多次领券',
        weight: 30,
        enabled: true,
        check: (context, history) => {
          if (!context.deviceFingerprint) return false;
          const recentChecks = history.filter(h => 
            h.deviceFingerprint === context.deviceFingerprint &&
            dayjs(h.timestamp).isAfter(dayjs().subtract(5, 'minute')) &&
            h.action === 'claim_coupon'
          );
          return recentChecks.length > 5;
        },
        reason: '同一设备5分钟内领券超过5次'
      },
      {
        id: 'rule_002',
        name: '同一IP短时间内多次领券',
        weight: 25,
        enabled: true,
        check: (context, history) => {
          if (!context.ipAddress) return false;
          const recentChecks = history.filter(h => 
            h.ipAddress === context.ipAddress &&
            dayjs(h.timestamp).isAfter(dayjs().subtract(5, 'minute')) &&
            h.action === 'claim_coupon'
          );
          return recentChecks.length > 10;
        },
        reason: '同一IP5分钟内领券超过10次'
      },
      {
        id: 'rule_003',
        name: '新用户短时间内大量领券',
        weight: 40,
        enabled: true,
        check: (context, history) => {
          if (!context.userId) return false;
          const userChecks = history.filter(h => h.userId === context.userId);
          if (userChecks.length === 0) return false;
          const recentChecks = history.filter(h => 
            h.userId === context.userId &&
            dayjs(h.timestamp).isAfter(dayjs().subtract(1, 'hour')) &&
            h.action === 'claim_coupon'
          );
          return recentChecks.length > 20;
        },
        reason: '用户1小时内领券超过20次'
      },
      {
        id: 'rule_004',
        name: '异常退款频率',
        weight: 50,
        enabled: true,
        check: (context, history) => {
          if (!context.userId || context.action !== 'refund_coupon') return false;
          const recentRefunds = history.filter(h => 
            h.userId === context.userId &&
            dayjs(h.timestamp).isAfter(dayjs().subtract(24, 'hour')) &&
            h.action === 'refund_coupon'
          );
          return recentRefunds.length > 5;
        },
        reason: '用户24小时内退款超过5次'
      },
      {
        id: 'rule_005',
        name: '黑名单设备',
        weight: 100,
        enabled: true,
        check: (context) => {
          const blacklistedDevices = ['blacklisted_device_001', 'blacklisted_device_002'];
          return context.deviceFingerprint ? blacklistedDevices.includes(context.deviceFingerprint) : false;
        },
        reason: '设备在黑名单中'
      },
      {
        id: 'rule_006',
        name: '同一设备多个账号',
        weight: 35,
        enabled: true,
        check: (context, history) => {
          if (!context.deviceFingerprint || !context.userId) return false;
          const deviceChecks = history.filter(h => 
            h.deviceFingerprint === context.deviceFingerprint &&
            h.userId &&
            h.userId !== context.userId
          );
          const uniqueUsers = new Set(deviceChecks.map(h => h.userId));
          return uniqueUsers.size > 3;
        },
        reason: '同一设备关联超过3个用户账号'
      },
      {
        id: 'rule_007',
        name: '异常订单金额',
        weight: 20,
        enabled: true,
        check: (context) => {
          if (!context.orderAmount || context.action !== 'create_order') return false;
          const suspiciousThreshold = 0.01;
          return context.orderAmount < suspiciousThreshold;
        },
        reason: '订单金额异常低于阈值'
      },
      {
        id: 'rule_008',
        name: '同一订单多次使用相同券',
        weight: 60,
        enabled: true,
        check: (context, history) => {
          if (!context.couponIds || context.action !== 'use_coupon') return false;
          const recentUses = history.filter(h => 
            h.action === 'use_coupon' &&
            dayjs(h.timestamp).isAfter(dayjs().subtract(1, 'hour'))
          );
          for (const check of recentUses) {
            const usedCoupons = check.couponIds || [];
            const overlap = context.couponIds.filter(id => usedCoupons.includes(id));
            if (overlap.length > 0) {
              return true;
            }
          }
          return false;
        },
        reason: '优惠券在短时间内被多次使用'
      }
    ];
  }

  async check(context: FraudCheckContext): Promise<FraudCheckResult> {
    const history = await this.getRecentHistory(context);
    
    let totalScore = 0;
    const reasons: string[] = [];
    
    for (const rule of this.rules) {
      if (!rule.enabled) continue;
      
      try {
        const violated = rule.check(context, history);
        if (violated) {
          totalScore += rule.weight;
          reasons.push(rule.reason);
        }
      } catch (error) {
        console.error(`Error checking rule ${rule.id}:`, error);
      }
    }
    
    let riskLevel: 'low' | 'medium' | 'high' | 'critical';
    if (totalScore >= 100) {
      riskLevel = 'critical';
    } else if (totalScore >= 60) {
      riskLevel = 'high';
    } else if (totalScore >= 30) {
      riskLevel = 'medium';
    } else {
      riskLevel = 'low';
    }
    
    const passed = riskLevel === 'low' || (riskLevel === 'medium' && context.action === 'claim_coupon');
    
    const result: FraudCheckResult = {
      passed,
      riskLevel,
      score: totalScore,
      reasons,
      deviceFingerprint: context.deviceFingerprint,
      ipAddress: context.ipAddress,
      userId: context.userId,
      timestamp: new Date()
    };
    
    await this.saveCheckResult(result, context);
    
    if (!passed || riskLevel !== 'low') {
      await auditService.log({
        action: AuditAction.FRAUD_DETECTION,
        userId: context.userId || 'system',
        userRole: context.userId ? 'customer' as any : 'system' as any,
        resourceType: 'system',
        details: {
          action: context.action,
          riskLevel,
          score: totalScore,
          reasons,
          deviceFingerprint: context.deviceFingerprint,
          ipAddress: context.ipAddress
        },
        traceId: context.traceId
      });
    }
    
    return result;
  }

  private async getRecentHistory(context: FraudCheckContext): Promise<FraudCheckEntity[]> {
    const checkRepository = AppDataSource.getRepository(FraudCheckEntity);
    
    const queryBuilder = checkRepository.createQueryBuilder('check')
      .where('check.timestamp >= :since', { since: dayjs().subtract(30, 'day').toDate() });
    
    if (context.userId) {
      queryBuilder.orWhere('check.userId = :userId', { userId: context.userId });
    }
    if (context.deviceFingerprint) {
      queryBuilder.orWhere('check.deviceFingerprint = :deviceFingerprint', { deviceFingerprint: context.deviceFingerprint });
    }
    if (context.ipAddress) {
      queryBuilder.orWhere('check.ipAddress = :ipAddress', { ipAddress: context.ipAddress });
    }
    
    return queryBuilder.orderBy('check.timestamp', 'DESC').getMany();
  }

  private async saveCheckResult(result: FraudCheckResult, context: FraudCheckContext): Promise<void> {
    const checkRepository = AppDataSource.getRepository(FraudCheckEntity);
    
    const check = checkRepository.create({
      deviceFingerprint: result.deviceFingerprint,
      ipAddress: result.ipAddress,
      userId: result.userId,
      riskLevel: result.riskLevel,
      score: result.score,
      reasons: result.reasons,
      passed: result.passed,
      timestamp: result.timestamp,
      action: context.action,
      couponIds: context.couponIds
    });
    
    await checkRepository.save(check);
  }

  addRule(rule: RiskRule): void {
    this.rules.push(rule);
  }

  removeRule(ruleId: string): void {
    this.rules = this.rules.filter(r => r.id !== ruleId);
  }

  enableRule(ruleId: string): void {
    const rule = this.rules.find(r => r.id === ruleId);
    if (rule) {
      rule.enabled = true;
    }
  }

  disableRule(ruleId: string): void {
    const rule = this.rules.find(r => r.id === ruleId);
    if (rule) {
      rule.enabled = false;
    }
  }

  getRules(): RiskRule[] {
    return [...this.rules];
  }
}

export const antiFraudEngine = AntiFraudEngine.getInstance();
