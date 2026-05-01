import { RuleConstraints, RuleExecutionContext } from './types'
import { AppDataSource } from '../../config/database'
import { PointsTransaction, TransactionType, TransactionStatus } from '../../entities'
import { Between } from 'typeorm'

export class RuleConstraintChecker {
  static async check(
    constraints: RuleConstraints,
    context: RuleExecutionContext,
    ruleId: string
  ): Promise<{ passed: boolean; failures: string[] }> {
    const failures: string[] = []

    if (constraints.minTransactionAmount !== undefined) {
      const amount = context.eventData.amount || 0
      if (amount < constraints.minTransactionAmount) {
        failures.push(`交易金额 ${amount} 小于最低要求 ${constraints.minTransactionAmount}`)
      }
    }

    if (constraints.maxTransactionAmount !== undefined) {
      const amount = context.eventData.amount || 0
      if (amount > constraints.maxTransactionAmount) {
        failures.push(`交易金额 ${amount} 超过最高限制 ${constraints.maxTransactionAmount}`)
      }
    }

    if (constraints.includeUserLevels !== undefined && constraints.includeUserLevels.length > 0) {
      if (!constraints.includeUserLevels.includes(context.memberInfo.level)) {
        failures.push(`会员等级 ${context.memberInfo.level} 不在允许范围内`)
      }
    }

    if (constraints.excludeUserLevels !== undefined && constraints.excludeUserLevels.length > 0) {
      if (constraints.excludeUserLevels.includes(context.memberInfo.level)) {
        failures.push(`会员等级 ${context.memberInfo.level} 被排除`)
      }
    }

    if (constraints.effectiveHours !== undefined && constraints.effectiveHours.length > 0) {
      const hour = context.currentTime.getHours()
      if (!constraints.effectiveHours.includes(hour)) {
        failures.push(`当前时间 ${hour} 点不在有效时段内`)
      }
    }

    if (constraints.effectiveDays !== undefined && constraints.effectiveDays.length > 0) {
      const day = context.currentTime.getDay()
      if (!constraints.effectiveDays.includes(day)) {
        failures.push(`当前星期 ${day} 不在有效日期内`)
      }
    }

    const limitChecks = [
      this.checkDailyLimit,
      this.checkWeeklyLimit,
      this.checkMonthlyLimit,
      this.checkPerUserLimit,
    ]

    for (const check of limitChecks) {
      const result = await check.call(this, constraints, context, ruleId)
      if (!result.passed) {
        failures.push(...result.failures)
      }
    }

    return {
      passed: failures.length === 0,
      failures,
    }
  }

  private static async checkDailyLimit(
    constraints: RuleConstraints,
    context: RuleExecutionContext,
    ruleId: string
  ): Promise<{ passed: boolean; failures: string[] }> {
    if (constraints.dailyLimit === undefined) {
      return { passed: true, failures: [] }
    }

    const today = context.currentTime
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)

    const transactionRepo = AppDataSource.getRepository(PointsTransaction)
    const count = await transactionRepo.count({
      where: {
        memberId: context.memberId,
        ruleId: ruleId,
        type: TransactionType.EARN,
        status: TransactionStatus.CONFIRMED,
        createdAt: Between(startOfDay, endOfDay),
      },
    })

    if (count >= constraints.dailyLimit) {
      return {
        passed: false,
        failures: [`今日已触发 ${count} 次，超出每日限制 ${constraints.dailyLimit}`],
      }
    }

    return { passed: true, failures: [] }
  }

  private static async checkWeeklyLimit(
    constraints: RuleConstraints,
    context: RuleExecutionContext,
    ruleId: string
  ): Promise<{ passed: boolean; failures: string[] }> {
    if (constraints.weeklyLimit === undefined) {
      return { passed: true, failures: [] }
    }

    const today = context.currentTime
    const dayOfWeek = today.getDay()
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
    const startOfWeek = new Date(today.getFullYear(), today.getMonth(), diff)

    const transactionRepo = AppDataSource.getRepository(PointsTransaction)
    const count = await transactionRepo.count({
      where: {
        memberId: context.memberId,
        ruleId: ruleId,
        type: TransactionType.EARN,
        status: TransactionStatus.CONFIRMED,
        createdAt: Between(startOfWeek, today),
      },
    })

    if (count >= constraints.weeklyLimit) {
      return {
        passed: false,
        failures: [`本周已触发 ${count} 次，超出每周限制 ${constraints.weeklyLimit}`],
      }
    }

    return { passed: true, failures: [] }
  }

  private static async checkMonthlyLimit(
    constraints: RuleConstraints,
    context: RuleExecutionContext,
    ruleId: string
  ): Promise<{ passed: boolean; failures: string[] }> {
    if (constraints.monthlyLimit === undefined) {
      return { passed: true, failures: [] }
    }

    const today = context.currentTime
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

    const transactionRepo = AppDataSource.getRepository(PointsTransaction)
    const count = await transactionRepo.count({
      where: {
        memberId: context.memberId,
        ruleId: ruleId,
        type: TransactionType.EARN,
        status: TransactionStatus.CONFIRMED,
        createdAt: Between(startOfMonth, today),
      },
    })

    if (count >= constraints.monthlyLimit) {
      return {
        passed: false,
        failures: [`本月已触发 ${count} 次，超出每月限制 ${constraints.monthlyLimit}`],
      }
    }

    return { passed: true, failures: [] }
  }

  private static async checkPerUserLimit(
    constraints: RuleConstraints,
    context: RuleExecutionContext,
    ruleId: string
  ): Promise<{ passed: boolean; failures: string[] }> {
    if (constraints.perUserLimit === undefined) {
      return { passed: true, failures: [] }
    }

    const transactionRepo = AppDataSource.getRepository(PointsTransaction)
    const count = await transactionRepo.count({
      where: {
        memberId: context.memberId,
        ruleId: ruleId,
        type: TransactionType.EARN,
        status: TransactionStatus.CONFIRMED,
      },
    })

    if (count >= constraints.perUserLimit) {
      return {
        passed: false,
        failures: [`已触发 ${count} 次，超出每人限制 ${constraints.perUserLimit}`],
      }
    }

    return { passed: true, failures: [] }
  }
}
