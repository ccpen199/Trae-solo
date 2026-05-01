import { AppDataSource } from '../config/database'
import {
  RuleConfig,
  RuleType,
  RuleStatus,
  UserRole,
} from '../entities'
import { Like, In } from 'typeorm'
import { RuleCondition, RuleAction, RuleConstraints } from '../engines/rules-orchestrator/types'

export interface CreateRuleInput {
  ruleCode: string
  name: string
  type: RuleType
  description: string
  conditions: RuleCondition[]
  actions: RuleAction[]
  constraints?: RuleConstraints
  priority?: number
  startDate?: Date
  endDate?: Date
  maxTriggers?: number
  maxPoints?: number
}

export class RuleService {
  private static instance: RuleService

  private constructor() {}

  static getInstance(): RuleService {
    if (!RuleService.instance) {
      RuleService.instance = new RuleService()
    }
    return RuleService.instance
  }

  async createRule(input: CreateRuleInput, operatorId?: string): Promise<RuleConfig> {
    const ruleRepo = AppDataSource.getRepository(RuleConfig)

    const existingRule = await ruleRepo.findOne({
      where: { ruleCode: input.ruleCode },
    })

    if (existingRule) {
      throw new Error(`规则编码 ${input.ruleCode} 已存在`)
    }

    const rule = ruleRepo.create({
      ruleCode: input.ruleCode,
      name: input.name,
      type: input.type,
      status: RuleStatus.DRAFT,
      description: input.description,
      conditions: input.conditions,
      actions: input.actions,
      constraints: input.constraints || {},
      priority: input.priority || 1,
      startDate: input.startDate,
      endDate: input.endDate,
      maxTriggers: input.maxTriggers,
      maxPoints: input.maxPoints,
      triggerCount: 0,
      totalPointsAwarded: 0,
      operatorId,
    })

    return ruleRepo.save(rule)
  }

  async getRuleById(ruleId: string): Promise<RuleConfig | null> {
    const ruleRepo = AppDataSource.getRepository(RuleConfig)
    return ruleRepo.findOne({
      where: { id: ruleId },
    })
  }

  async getRuleByCode(ruleCode: string): Promise<RuleConfig | null> {
    const ruleRepo = AppDataSource.getRepository(RuleConfig)
    return ruleRepo.findOne({
      where: { ruleCode },
    })
  }

  async listRules(
    filters?: {
      type?: RuleType
      status?: RuleStatus
      keyword?: string
    },
    page: number = 1,
    pageSize: number = 20
  ): Promise<{
    items: RuleConfig[]
    total: number
    page: number
    pageSize: number
  }> {
    const ruleRepo = AppDataSource.getRepository(RuleConfig)
    
    const query = ruleRepo.createQueryBuilder('rule')

    if (filters?.type) {
      query.andWhere('rule.type = :type', { type: filters.type })
    }

    if (filters?.status) {
      query.andWhere('rule.status = :status', { status: filters.status })
    }

    if (filters?.keyword) {
      query.andWhere(
        '(rule.name LIKE :keyword OR rule.ruleCode LIKE :keyword OR rule.description LIKE :keyword)',
        { keyword: `%${filters.keyword}%` }
      )
    }

    query.orderBy('rule.priority', 'DESC')
      .addOrderBy('rule.createdAt', 'DESC')

    const [items, total] = await query
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount()

    return {
      items,
      total,
      page,
      pageSize,
    }
  }

  async updateRule(
    ruleId: string,
    updates: Partial<CreateRuleInput> & { status?: RuleStatus },
    operatorId?: string
  ): Promise<RuleConfig | null> {
    const ruleRepo = AppDataSource.getRepository(RuleConfig)
    
    const rule = await ruleRepo.findOne({
      where: { id: ruleId },
    })

    if (!rule) {
      return null
    }

    if (rule.status === RuleStatus.ACTIVE) {
      throw new Error('活动状态的规则不能修改，请先停用')
    }

    Object.assign(rule, updates, { operatorId })
    return ruleRepo.save(rule)
  }

  async activateRule(ruleId: string, operatorId?: string): Promise<RuleConfig | null> {
    const ruleRepo = AppDataSource.getRepository(RuleConfig)
    
    const rule = await ruleRepo.findOne({
      where: { id: ruleId },
    })

    if (!rule) {
      return null
    }

    if (rule.status !== RuleStatus.DRAFT && rule.status !== RuleStatus.INACTIVE) {
      throw new Error(`当前状态 ${rule.status} 不能激活`)
    }

    rule.status = RuleStatus.ACTIVE
    rule.approvedBy = operatorId
    rule.approvedAt = new Date()

    return ruleRepo.save(rule)
  }

  async deactivateRule(ruleId: string, operatorId?: string): Promise<RuleConfig | null> {
    const ruleRepo = AppDataSource.getRepository(RuleConfig)
    
    const rule = await ruleRepo.findOne({
      where: { id: ruleId },
    })

    if (!rule) {
      return null
    }

    if (rule.status !== RuleStatus.ACTIVE) {
      throw new Error(`当前状态 ${rule.status} 不能停用`)
    }

    rule.status = RuleStatus.INACTIVE
    rule.operatorId = operatorId

    return ruleRepo.save(rule)
  }

  async deleteRule(ruleId: string): Promise<boolean> {
    const ruleRepo = AppDataSource.getRepository(RuleConfig)
    
    const rule = await ruleRepo.findOne({
      where: { id: ruleId },
    })

    if (!rule) {
      return false
    }

    if (rule.status === RuleStatus.ACTIVE) {
      throw new Error('活动状态的规则不能删除')
    }

    await ruleRepo.delete(ruleId)
    return true
  }

  async createDefaultRules(): Promise<void> {
    const existingRules = await this.listRules({}, 1, 100)
    
    if (existingRules.total > 0) {
      return
    }

    const defaultRules: CreateRuleInput[] = [
      {
        ruleCode: 'CONSUMPTION_DEFAULT',
        name: '消费积分规则',
        type: RuleType.CONSUMPTION,
        description: '消费1元获得1积分',
        conditions: [
          {
            type: 'comparison',
            field: 'eventData.amount',
            operator: 'gt',
            value: 0,
          },
        ],
        actions: [
          {
            type: 'award_points',
            pointsFormula: 'amount * 1',
          },
        ],
        constraints: {},
        priority: 10,
      },
      {
        ruleCode: 'CHECK_IN_DAILY',
        name: '每日签到规则',
        type: RuleType.CHECK_IN,
        description: '每日签到获得10积分',
        conditions: [],
        actions: [
          {
            type: 'award_points',
            points: 10,
          },
        ],
        constraints: {
          dailyLimit: 1,
        },
        priority: 5,
      },
      {
        ruleCode: 'REGISTRATION_BONUS',
        name: '注册奖励规则',
        type: RuleType.REGISTRATION,
        description: '新用户注册赠送100积分',
        conditions: [],
        actions: [
          {
            type: 'award_points',
            points: 100,
          },
        ],
        constraints: {
          perUserLimit: 1,
        },
        priority: 20,
      },
      {
        ruleCode: 'BIRTHDAY_BONUS',
        name: '生日奖励规则',
        type: RuleType.BIRTHDAY,
        description: '会员生日当天赠送200积分',
        conditions: [],
        actions: [
          {
            type: 'award_points',
            points: 200,
          },
        ],
        constraints: {
          perUserLimit: 1,
        },
        priority: 15,
      },
    ]

    for (const ruleInput of defaultRules) {
      await this.createRule(ruleInput)
    }
  }
}
