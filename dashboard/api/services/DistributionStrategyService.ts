import { Repository, In } from 'typeorm'
import { AppDataSource } from '../data-source.js'
import { DistributionStrategy } from '../entities/DistributionStrategy.js'
import { CouponActivity } from '../entities/CouponActivity.js'
import { CouponInstance } from '../entities/CouponInstance.js'
import { User } from '../entities/User.js'
import { UserProfile } from '../entities/UserProfile.js'
import { isPointInAnyGeofence } from '../utils/geo.js'
import { generateId } from '../utils/id.js'
import type { GeoLocation, DistributionStrategyType } from '../../../shared/types/index.js'

export interface EvaluateStrategyRequest {
  activityId: string
  userId: string
  userLocation?: GeoLocation
  consumptionAmount?: number
  category?: string
  merchantId?: string
}

export class DistributionStrategyService {
  private strategyRepository: Repository<DistributionStrategy>
  private activityRepository: Repository<CouponActivity>
  private instanceRepository: Repository<CouponInstance>
  private userRepository: Repository<User>
  private userProfileRepository: Repository<UserProfile>

  constructor() {
    this.strategyRepository = AppDataSource.getRepository(DistributionStrategy)
    this.activityRepository = AppDataSource.getRepository(CouponActivity)
    this.instanceRepository = AppDataSource.getRepository(CouponInstance)
    this.userRepository = AppDataSource.getRepository(User)
    this.userProfileRepository = AppDataSource.getRepository(UserProfile)
  }

  async createStrategy(
    type: DistributionStrategyType,
    config: {
      targetedGroups?: string[]
      geofencingAreas?: unknown[]
      autoTriggerConditions?: unknown
    },
  ): Promise<DistributionStrategy> {
    const strategy = this.strategyRepository.create({
      id: generateId(),
      type,
      targetedGroups: config.targetedGroups || null,
      geofencingAreas: config.geofencingAreas || null,
      autoTriggerConditions: config.autoTriggerConditions || null,
    })

    return this.strategyRepository.save(strategy)
  }

  async getStrategyById(id: string): Promise<DistributionStrategy | null> {
    return this.strategyRepository.findOne({
      where: { id },
      relations: ['couponActivity'],
    })
  }

  async updateStrategy(
    id: string,
    updates: Partial<DistributionStrategy>,
  ): Promise<DistributionStrategy | null> {
    const strategy = await this.strategyRepository.findOne({ where: { id } })
    if (!strategy) {
      return null
    }

    Object.assign(strategy, updates)
    strategy.updatedAt = new Date()

    return this.strategyRepository.save(strategy)
  }

  async deleteStrategy(id: string): Promise<boolean> {
    const result = await this.strategyRepository.delete(id)
    return (result.affected || 0) > 0
  }

  async evaluateTargetedStrategy(
    strategy: DistributionStrategy,
    userId: string,
  ): Promise<{ eligible: boolean; reason?: string }> {
    if (strategy.type !== 'targeted' || !strategy.targetedGroups) {
      return { eligible: false, reason: 'Invalid strategy type' }
    }

    const user = await this.userRepository.findOne({ where: { id: userId } })
    if (!user) {
      return { eligible: false, reason: 'User not found' }
    }

    if (user.status !== 'normal') {
      return { eligible: false, reason: 'User account is not active' }
    }

    const profile = await this.userProfileRepository.findOne({ where: { userId } })
    if (!profile) {
      return { eligible: false, reason: 'User profile not found' }
    }

    const userGroups = [
      profile.consumptionTier,
      ...profile.preferredCategories,
      ...profile.preferredDistricts,
    ]

    const hasMatchingGroup = strategy.targetedGroups.some(group => 
      userGroups.includes(group)
    )

    if (hasMatchingGroup) {
      return { eligible: true }
    }

    return { eligible: false, reason: 'User does not match targeted groups' }
  }

  async evaluateGeofencingStrategy(
    strategy: DistributionStrategy,
    userLocation?: GeoLocation,
  ): Promise<{ eligible: boolean; reason?: string }> {
    if (strategy.type !== 'geofencing' || !strategy.geofencingAreas) {
      return { eligible: false, reason: 'Invalid strategy type' }
    }

    if (!userLocation) {
      return { eligible: false, reason: 'User location not provided' }
    }

    const isInGeofence = isPointInAnyGeofence(userLocation, strategy.geofencingAreas)

    if (isInGeofence) {
      return { eligible: true }
    }

    return { eligible: false, reason: 'User is outside geofencing area' }
  }

  async evaluateAutoStrategy(
    strategy: DistributionStrategy,
    userId: string,
    activityId: string,
    consumptionAmount?: number,
    category?: string,
    merchantId?: string,
  ): Promise<{ eligible: boolean; reason?: string }> {
    if (strategy.type !== 'auto' || !strategy.autoTriggerConditions) {
      return { eligible: false, reason: 'Invalid strategy type' }
    }

    const conditions = strategy.autoTriggerConditions as {
      minConsumptionAmount: number
      category?: string
      merchantIds?: string[]
      maxCouponsPerUser: number
    }

    if (consumptionAmount && consumptionAmount < conditions.minConsumptionAmount) {
      return { 
        eligible: false, 
        reason: `Consumption amount below minimum of ${conditions.minConsumptionAmount}` 
      }
    }

    if (conditions.category && category && category !== conditions.category) {
      return { eligible: false, reason: 'Category does not match' }
    }

    if (conditions.merchantIds && merchantId && !conditions.merchantIds.includes(merchantId)) {
      return { eligible: false, reason: 'Merchant not in allowed list' }
    }

    const existingCount = await this.instanceRepository.count({
      where: { userId, activityId, status: In(['available', 'used']) },
    })

    if (existingCount >= conditions.maxCouponsPerUser) {
      return { 
        eligible: false, 
        reason: `Maximum coupons per user (${conditions.maxCouponsPerUser}) reached` 
      }
    }

    return { eligible: true }
  }

  async evaluateStrategy(request: EvaluateStrategyRequest): Promise<{
    eligible: boolean
    reason?: string
    strategy?: DistributionStrategy
  }> {
    const activity = await this.activityRepository.findOne({
      where: { id: request.activityId },
      relations: ['distributionStrategy'],
    })

    if (!activity) {
      return { eligible: false, reason: 'Activity not found' }
    }

    const strategy = activity.distributionStrategy
    if (!strategy) {
      return { eligible: true, reason: 'No distribution strategy defined' }
    }

    let result: { eligible: boolean; reason?: string }

    switch (strategy.type) {
      case 'targeted':
        result = await this.evaluateTargetedStrategy(strategy, request.userId)
        break
      case 'geofencing':
        result = await this.evaluateGeofencingStrategy(strategy, request.userLocation)
        break
      case 'auto':
        result = await this.evaluateAutoStrategy(
          strategy,
          request.userId,
          request.activityId,
          request.consumptionAmount,
          request.category,
          request.merchantId,
        )
        break
      default:
        result = { eligible: false, reason: 'Unknown strategy type' }
    }

    return { ...result, strategy }
  }

  async getEligibleUsers(activityId: string): Promise<User[]> {
    const activity = await this.activityRepository.findOne({
      where: { id: activityId },
      relations: ['distributionStrategy'],
    })

    if (!activity || !activity.distributionStrategy) {
      return this.userRepository.find({ where: { status: 'normal' } })
    }

    const strategy = activity.distributionStrategy

    if (strategy.type === 'targeted' && strategy.targetedGroups) {
      const profiles = await this.userProfileRepository
        .createQueryBuilder('profile')
        .where('profile.consumptionTier IN (:...tiers)', { tiers: strategy.targetedGroups })
        .orWhere('json_each(profile.preferredCategories) IN (:...categories)', { categories: strategy.targetedGroups })
        .orWhere('json_each(profile.preferredDistricts) IN (:...districts)', { districts: strategy.targetedGroups })
        .getMany()

      const userIds = profiles.map(p => p.userId)
      return this.userRepository.find({
        where: { id: In(userIds), status: 'normal' },
      })
    }

    return this.userRepository.find({ where: { status: 'normal' } })
  }

  async batchDistributeByStrategy(activityId: string): Promise<number> {
    const eligibleUsers = await this.getEligibleUsers(activityId)
    let distributedCount = 0

    for (const user of eligibleUsers) {
      const evaluation = await this.evaluateStrategy({
        activityId,
        userId: user.id,
      })

      if (evaluation.eligible) {
        distributedCount++
      }
    }

    return distributedCount
  }

  async listStrategies(
    page: number = 1,
    pageSize: number = 20,
    type?: DistributionStrategyType,
  ): Promise<{ strategies: DistributionStrategy[]; total: number }> {
    const where: Record<string, unknown> = {}
    if (type) where.type = type

    const [strategies, total] = await this.strategyRepository.findAndCount({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      order: { createdAt: 'DESC' },
    })

    return { strategies, total }
  }
}

export const distributionStrategyService = new DistributionStrategyService()
