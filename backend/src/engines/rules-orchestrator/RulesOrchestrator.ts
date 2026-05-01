import { AppDataSource } from '../../config/database'
import {
  RuleConfig,
  RuleStatus,
  RuleType,
  Member,
  PointsAccount,
  BusinessEvent,
  EventStatus,
} from '../../entities'
import { In, MoreThanOrEqual, LessThanOrEqual, IsNull } from 'typeorm'
import { RuleMatcher } from './RuleMatcher'
import { RuleConstraintChecker } from './RuleConstraintChecker'
import {
  RuleCondition,
  RuleAction,
  RuleExecutionContext,
  RuleMatchResult,
  RuleExecutionResult,
} from './types'

export class RulesOrchestrator {
  private static instance: RulesOrchestrator

  private constructor() {}

  static getInstance(): RulesOrchestrator {
    if (!RulesOrchestrator.instance) {
      RulesOrchestrator.instance = new RulesOrchestrator()
    }
    return RulesOrchestrator.instance
  }

  async processEvent(event: BusinessEvent): Promise<{ success: boolean; results: RuleExecutionResult[] }> {
    const eventRepo = AppDataSource.getRepository(BusinessEvent)
    
    try {
      event.status = EventStatus.PROCESSING
      event.startedAt = new Date()
      await eventRepo.save(event)

      const activeRules = await this.getActiveRules(event.type)
      if (activeRules.length === 0) {
        event.status = EventStatus.SKIPPED
        event.completedAt = new Date()
        await eventRepo.save(event)
        return { success: true, results: [] }
      }

      const context = await this.buildExecutionContext(event)
      const matchResults: RuleMatchResult[] = []

      for (const rule of activeRules) {
        const matchResult = await this.matchRule(rule, context)
        matchResults.push(matchResult)
        
        if (matchResult.matched) {
          console.log(`规则 ${rule.ruleCode} 匹配成功`)
        }
      }

      const matchedRules = matchResults.filter(r => r.matched)
      event.matchedRules = matchedRules.map(r => r.ruleId)

      const executionResults: RuleExecutionResult[] = []
      
      for (const matchResult of matchedRules) {
        const execResult = await this.executeRule(matchResult, context, event)
        executionResults.push(execResult)
      }

      const totalPoints = executionResults
        .filter(r => r.success)
        .reduce((sum, r) => sum + r.pointsAwarded, 0)

      event.status = executionResults.every(r => r.success) ? EventStatus.PROCESSED : EventStatus.FAILED
      event.triggeredActions = executionResults.map(r => ({
        ruleId: r.ruleId,
        ruleCode: r.ruleCode,
        success: r.success,
        pointsAwarded: r.pointsAwarded,
      }))
      event.totalPointsAwarded = totalPoints
      event.completedAt = new Date()
      await eventRepo.save(event)

      return {
        success: event.status === EventStatus.PROCESSED,
        results: executionResults,
      }
    } catch (error: any) {
      event.status = EventStatus.FAILED
      event.errorMessage = error.message
      event.completedAt = new Date()
      await eventRepo.save(event)
      throw error
    }
  }

  private async getActiveRules(eventType: string): Promise<RuleConfig[]> {
    const ruleRepo = AppDataSource.getRepository(RuleConfig)
    const now = new Date()

    const query = ruleRepo.createQueryBuilder('rule')
      .where('rule.status = :status', { status: RuleStatus.ACTIVE })
      .andWhere('rule.type = :type', { type: eventType })
      .andWhere(
        '(rule.startDate IS NULL OR rule.startDate <= :now)',
        { now }
      )
      .andWhere(
        '(rule.endDate IS NULL OR rule.endDate >= :now)',
        { now }
      )
      .orderBy('rule.priority', 'DESC')

    return query.getMany()
  }

  private async buildExecutionContext(event: BusinessEvent): Promise<RuleExecutionContext> {
    const memberRepo = AppDataSource.getRepository(Member)
    const accountRepo = AppDataSource.getRepository(PointsAccount)

    const member = await memberRepo.findOne({
      where: { id: event.memberId },
    })

    if (!member) {
      throw new Error(`会员 ${event.memberId} 不存在`)
    }

    const account = await accountRepo.findOne({
      where: { memberId: event.memberId },
    })

    return {
      eventType: event.type,
      memberId: event.memberId,
      memberInfo: {
        level: member.level,
        totalPoints: member.totalPointsEarned,
        totalConsumption: member.totalConsumption,
        registrationDate: member.createdAt,
      },
      eventData: event.eventData || {},
      businessNo: event.businessNo,
      currentTime: new Date(),
    }
  }

  private async matchRule(rule: RuleConfig, context: RuleExecutionContext): Promise<RuleMatchResult> {
    const conditions = rule.conditions as RuleCondition[]
    const constraints = rule.constraints || {}

    let conditionsPassed = true
    let failureReason: string | undefined

    if (conditions && conditions.length > 0) {
      for (const condition of conditions) {
        if (!RuleMatcher.match(condition, context)) {
          conditionsPassed = false
          failureReason = `条件不匹配: ${JSON.stringify(condition)}`
          break
        }
      }
    }

    if (!conditionsPassed) {
      return {
        ruleId: rule.id,
        ruleCode: rule.ruleCode,
        ruleName: rule.name,
        matched: false,
        conditionsPassed: false,
        constraintsPassed: false,
        failureReason,
      }
    }

    const constraintResult = await RuleConstraintChecker.check(
      constraints,
      context,
      rule.id
    )

    if (!constraintResult.passed) {
      return {
        ruleId: rule.id,
        ruleCode: rule.ruleCode,
        ruleName: rule.name,
        matched: false,
        conditionsPassed: true,
        constraintsPassed: false,
        failureReason: `约束检查失败: ${constraintResult.failures.join(', ')}`,
      }
    }

    return {
      ruleId: rule.id,
      ruleCode: rule.ruleCode,
      ruleName: rule.name,
      matched: true,
      conditionsPassed: true,
      constraintsPassed: true,
      actions: rule.actions as RuleAction[],
    }
  }

  private async executeRule(
    matchResult: RuleMatchResult,
    context: RuleExecutionContext,
    event: BusinessEvent
  ): Promise<RuleExecutionResult> {
    if (!matchResult.actions || matchResult.actions.length === 0) {
      return {
        success: true,
        ruleId: matchResult.ruleId,
        ruleCode: matchResult.ruleCode,
        actionsExecuted: [],
        pointsAwarded: 0,
      }
    }

    let totalPointsAwarded = 0
    const executedActions: RuleAction[] = []

    try {
      for (const action of matchResult.actions) {
        if (action.type === 'award_points') {
          const points = this.calculatePoints(action, context)
          if (points > 0) {
            totalPointsAwarded += points
            executedActions.push({
              ...action,
              points,
            })
          }
        }
      }

      return {
        success: true,
        ruleId: matchResult.ruleId,
        ruleCode: matchResult.ruleCode,
        actionsExecuted: executedActions,
        pointsAwarded: totalPointsAwarded,
      }
    } catch (error: any) {
      return {
        success: false,
        ruleId: matchResult.ruleId,
        ruleCode: matchResult.ruleCode,
        actionsExecuted: executedActions,
        pointsAwarded: totalPointsAwarded,
        errorMessage: error.message,
      }
    }
  }

  private calculatePoints(action: RuleAction, context: RuleExecutionContext): number {
    let points = 0

    if (action.points !== undefined) {
      points = action.points
    } else if (action.pointsFormula) {
      points = this.evaluateFormula(action.pointsFormula, context)
    }

    if (action.multiplier) {
      points = points * action.multiplier
    }

    if (action.maxPoints && points > action.maxPoints) {
      points = action.maxPoints
    }

    return Math.floor(points * 100) / 100
  }

  private evaluateFormula(formula: string, context: RuleExecutionContext): number {
    const amount = context.eventData.amount || 0
    const level = context.memberInfo.level

    const formulaMap: Record<string, number> = {
      'amount * 1': amount * 1,
      'amount * 2': amount * 2,
      'amount * 3': amount * 3,
      'amount * 0.5': amount * 0.5,
      'amount * (1 + level * 0.1)': amount * (1 + level * 0.1),
    }

    return formulaMap[formula] || 0
  }
}
