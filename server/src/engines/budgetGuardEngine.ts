import { v4 as uuidv4 } from 'uuid';
import { AppDataSource } from '../database/dataSource';
import { BudgetEntity, CouponTemplateEntity } from '../entities';
import { BudgetCheckResult, AuditAction } from '../types';
import { auditService } from '../services/auditService';

export interface BudgetCheckContext {
  budgetId: string;
  requestedAmount: number;
  userId: string;
  userRole: string;
  operation: 'allocate' | 'release' | 'use' | 'refund';
  templateId?: string;
  couponCount?: number;
  traceId: string;
}

export interface BudgetWarning {
  type: 'low_balance' | 'over_allocation' | 'expiring_soon' | 'usage_high';
  message: string;
  threshold: number;
  currentValue: number;
}

export class BudgetGuardEngine {
  private static instance: BudgetGuardEngine;
  
  private readonly WARN_THRESHOLD_PERCENT = 20;
  private readonly CRITICAL_THRESHOLD_PERCENT = 10;

  private constructor() {}

  static getInstance(): BudgetGuardEngine {
    if (!BudgetGuardEngine.instance) {
      BudgetGuardEngine.instance = new BudgetGuardEngine();
    }
    return BudgetGuardEngine.instance;
  }

  async check(context: BudgetCheckContext): Promise<BudgetCheckResult> {
    const budgetRepository = AppDataSource.getRepository(BudgetEntity);
    const budget = await budgetRepository.findOne({ where: { id: context.budgetId } });
    
    if (!budget) {
      return {
        passed: false,
        budgetId: context.budgetId,
        requestedAmount: context.requestedAmount,
        availableBudget: 0,
        warnings: ['Budget not found'],
        timestamp: new Date()
      };
    }

    const warnings: string[] = [];
    
    this.checkWarnings(budget, warnings);
    
    let availableBudget = budget.remainingBudget;
    let passed = true;
    
    switch (context.operation) {
      case 'allocate':
        passed = this.checkAllocation(budget, context.requestedAmount);
        if (!passed) {
          warnings.push(`Insufficient budget for allocation. Available: ${availableBudget}, Requested: ${context.requestedAmount}`);
        }
        break;
        
      case 'release':
        passed = true;
        break;
        
      case 'use':
        passed = this.checkUsage(budget, context.requestedAmount);
        if (!passed) {
          warnings.push(`Insufficient budget for usage. Available: ${availableBudget}, Requested: ${context.requestedAmount}`);
        }
        break;
        
      case 'refund':
        passed = true;
        break;
        
      default:
        passed = false;
        warnings.push(`Unknown operation: ${context.operation}`);
    }
    
    await auditService.log({
      action: AuditAction.BUDGET_CHECK,
      userId: context.userId,
      userRole: context.userRole as any,
      resourceType: 'budget',
      resourceId: context.budgetId,
      details: {
        operation: context.operation,
        requestedAmount: context.requestedAmount,
        availableBudget: budget.remainingBudget,
        totalBudget: budget.totalBudget,
        passed,
        warnings,
        templateId: context.templateId,
        couponCount: context.couponCount
      },
      traceId: context.traceId
    });
    
    return {
      passed,
      budgetId: context.budgetId,
      requestedAmount: context.requestedAmount,
      availableBudget: budget.remainingBudget,
      warnings,
      timestamp: new Date()
    };
  }

  private checkAllocation(budget: BudgetEntity, amount: number): boolean {
    const availableToAllocate = budget.totalBudget - budget.allocatedBudget;
    return amount <= availableToAllocate;
  }

  private checkUsage(budget: BudgetEntity, amount: number): boolean {
    return amount <= budget.remainingBudget;
  }

  private checkWarnings(budget: BudgetEntity, warnings: string[]): void {
    const remainingPercent = (budget.remainingBudget / budget.totalBudget) * 100;
    
    if (remainingPercent <= this.CRITICAL_THRESHOLD_PERCENT) {
      warnings.push(`CRITICAL: Budget remaining is ${remainingPercent.toFixed(1)}%, below critical threshold of ${this.CRITICAL_THRESHOLD_PERCENT}%`);
    } else if (remainingPercent <= this.WARN_THRESHOLD_PERCENT) {
      warnings.push(`WARNING: Budget remaining is ${remainingPercent.toFixed(1)}%, below warning threshold of ${this.WARN_THRESHOLD_PERCENT}%`);
    }
    
    const now = new Date();
    const daysUntilExpiry = Math.ceil((budget.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry <= 7 && daysUntilExpiry > 0) {
      warnings.push(`Budget expires in ${daysUntilExpiry} days`);
    }
    
    const usedPercent = (budget.usedBudget / budget.totalBudget) * 100;
    if (usedPercent >= 90) {
      warnings.push(`High usage: ${usedPercent.toFixed(1)}% of budget has been used`);
    }
  }

  async allocateBudget(
    budgetId: string,
    amount: number,
    userId: string,
    userRole: string,
    traceId: string
  ): Promise<{ success: boolean; budget?: BudgetEntity; error?: string }> {
    const checkResult = await this.check({
      budgetId,
      requestedAmount: amount,
      userId,
      userRole,
      operation: 'allocate',
      traceId
    });
    
    if (!checkResult.passed) {
      return {
        success: false,
        error: checkResult.warnings.join('; ')
      };
    }
    
    const budgetRepository = AppDataSource.getRepository(BudgetEntity);
    const budget = await budgetRepository.findOne({ where: { id: budgetId } });
    
    if (!budget) {
      return { success: false, error: 'Budget not found' };
    }
    
    budget.allocatedBudget += amount;
    budget.remainingBudget = budget.totalBudget - budget.usedBudget;
    budget.updatedAt = new Date();
    
    await budgetRepository.save(budget);
    
    return { success: true, budget };
  }

  async releaseBudget(
    budgetId: string,
    amount: number,
    userId: string,
    userRole: string,
    traceId: string
  ): Promise<{ success: boolean; budget?: BudgetEntity; error?: string }> {
    const budgetRepository = AppDataSource.getRepository(BudgetEntity);
    const budget = await budgetRepository.findOne({ where: { id: budgetId } });
    
    if (!budget) {
      return { success: false, error: 'Budget not found' };
    }
    
    if (amount > budget.allocatedBudget) {
      return { success: false, error: 'Cannot release more than allocated budget' };
    }
    
    budget.allocatedBudget -= amount;
    budget.remainingBudget = budget.totalBudget - budget.usedBudget;
    budget.updatedAt = new Date();
    
    await budgetRepository.save(budget);
    
    await this.check({
      budgetId,
      requestedAmount: amount,
      userId,
      userRole,
      operation: 'release',
      traceId
    });
    
    return { success: true, budget };
  }

  async useBudget(
    budgetId: string,
    amount: number,
    userId: string,
    userRole: string,
    traceId: string
  ): Promise<{ success: boolean; budget?: BudgetEntity; error?: string }> {
    const checkResult = await this.check({
      budgetId,
      requestedAmount: amount,
      userId,
      userRole,
      operation: 'use',
      traceId
    });
    
    if (!checkResult.passed) {
      return {
        success: false,
        error: checkResult.warnings.join('; ')
      };
    }
    
    const budgetRepository = AppDataSource.getRepository(BudgetEntity);
    const budget = await budgetRepository.findOne({ where: { id: budgetId } });
    
    if (!budget) {
      return { success: false, error: 'Budget not found' };
    }
    
    budget.usedBudget += amount;
    budget.remainingBudget = budget.totalBudget - budget.usedBudget;
    budget.updatedAt = new Date();
    
    if (budget.remainingBudget <= 0) {
      budget.status = 'depleted';
    }
    
    await budgetRepository.save(budget);
    
    return { success: true, budget };
  }

  async refundBudget(
    budgetId: string,
    amount: number,
    userId: string,
    userRole: string,
    traceId: string
  ): Promise<{ success: boolean; budget?: BudgetEntity; error?: string }> {
    const budgetRepository = AppDataSource.getRepository(BudgetEntity);
    const budget = await budgetRepository.findOne({ where: { id: budgetId } });
    
    if (!budget) {
      return { success: false, error: 'Budget not found' };
    }
    
    if (amount > budget.usedBudget) {
      return { success: false, error: 'Cannot refund more than used budget' };
    }
    
    budget.usedBudget -= amount;
    budget.remainingBudget = budget.totalBudget - budget.usedBudget;
    budget.updatedAt = new Date();
    
    if (budget.status === 'depleted' && budget.remainingBudget > 0) {
      budget.status = 'active';
    }
    
    await budgetRepository.save(budget);
    
    await this.check({
      budgetId,
      requestedAmount: amount,
      userId,
      userRole,
      operation: 'refund',
      traceId
    });
    
    return { success: true, budget };
  }

  async getBudgetStatus(budgetId: string): Promise<{
    budgetId: string;
    totalBudget: number;
    allocatedBudget: number;
    usedBudget: number;
    remainingBudget: number;
    status: string;
    warnings: string[];
  } | null> {
    const budgetRepository = AppDataSource.getRepository(BudgetEntity);
    const budget = await budgetRepository.findOne({ where: { id: budgetId } });
    
    if (!budget) {
      return null;
    }
    
    const warnings: string[] = [];
    this.checkWarnings(budget, warnings);
    
    return {
      budgetId: budget.id,
      totalBudget: budget.totalBudget,
      allocatedBudget: budget.allocatedBudget,
      usedBudget: budget.usedBudget,
      remainingBudget: budget.remainingBudget,
      status: budget.status,
      warnings
    };
  }

  async calculateTemplateCost(
    templateType: string,
    templateValue: number,
    quantity: number
  ): Promise<{ totalCost: number; perUnitCost: number }> {
    const perUnitCost = templateType === 'percentage_discount' 
      ? (templateValue / 100) * 100
      : templateValue;
    
    return {
      totalCost: perUnitCost * quantity,
      perUnitCost
    };
  }
}

export const budgetGuardEngine = BudgetGuardEngine.getInstance();
