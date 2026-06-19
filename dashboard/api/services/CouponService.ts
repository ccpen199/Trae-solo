import { Repository, In } from 'typeorm'
import { AppDataSource } from '../data-source.js'
import { CouponActivity } from '../entities/CouponActivity.js'
import { CouponInstance } from '../entities/CouponInstance.js'
import { DistributionStrategy } from '../entities/DistributionStrategy.js'
import { generateCouponCode } from '../utils/password.js'
import { generateId } from '../utils/id.js'
import { redisCache, getInventoryCacheKey } from '../utils/redis.js'
import { addDays } from '../utils/date.js'
import type { CouponStatus, CouponType, DistributionStrategyType } from '../../../shared/types/index.js'

export interface CreateCouponActivityRequest {
  name: string
  type: CouponType
  value: number
  threshold: number
  totalQuantity: number
  startTime: Date
  endTime: Date
  description?: string
  strategyType?: DistributionStrategyType
  targetedGroups?: string[]
  geofencingAreas?: unknown[]
  autoTriggerConditions?: unknown
  applicableMerchantIds: string[]
}

export class CouponService {
  private activityRepository: Repository<CouponActivity>
  private instanceRepository: Repository<CouponInstance>
  private strategyRepository: Repository<DistributionStrategy>

  constructor() {
    this.activityRepository = AppDataSource.getRepository(CouponActivity)
    this.instanceRepository = AppDataSource.getRepository(CouponInstance)
    this.strategyRepository = AppDataSource.getRepository(DistributionStrategy)
  }

  async createActivity(request: CreateCouponActivityRequest): Promise<CouponActivity> {
    let strategy: DistributionStrategy | null = null
    
    if (request.strategyType) {
      strategy = this.strategyRepository.create({
        type: request.strategyType,
        targetedGroups: request.targetedGroups || null,
        geofencingAreas: request.geofencingAreas || null,
        autoTriggerConditions: request.autoTriggerConditions || null,
      })
      strategy = await this.strategyRepository.save(strategy)
    }

    const activity = this.activityRepository.create({
      name: request.name,
      type: request.type,
      value: request.value,
      threshold: request.threshold,
      totalQuantity: request.totalQuantity,
      usedQuantity: 0,
      status: 'draft',
      startTime: request.startTime,
      endTime: request.endTime,
      description: request.description || null,
      strategyId: strategy?.id || null,
      distributionStrategy: strategy,
      applicableMerchantIds: request.applicableMerchantIds,
    })

    const savedActivity = await this.activityRepository.save(activity)
    
    await this.updateInventoryCache(savedActivity.id, request.totalQuantity)
    
    return savedActivity
  }

  async getActivityList(
    page: number = 1,
    pageSize: number = 20,
    status?: CouponStatus,
    type?: CouponType,
  ): Promise<{ activities: CouponActivity[]; total: number }> {
    const where: Record<string, unknown> = {}
    if (status) where.status = status
    if (type) where.type = type

    const [activities, total] = await this.activityRepository.findAndCount({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      order: { createdAt: 'DESC' },
      relations: ['distributionStrategy'],
    })

    return { activities, total }
  }

  async getActivityById(id: string): Promise<CouponActivity | null> {
    return this.activityRepository.findOne({
      where: { id },
      relations: ['distributionStrategy', 'applicableMerchants'],
    })
  }

  async updateActivity(id: string, updates: Partial<CouponActivity>): Promise<CouponActivity | null> {
    const activity = await this.activityRepository.findOne({ where: { id } })
    if (!activity) {
      return null
    }

    Object.assign(activity, updates)
    activity.updatedAt = new Date()
    
    return this.activityRepository.save(activity)
  }

  async updateActivityStatus(id: string, status: CouponStatus): Promise<CouponActivity | null> {
    const activity = await this.activityRepository.findOne({ where: { id } })
    if (!activity) {
      return null
    }

    activity.status = status
    activity.updatedAt = new Date()
    
    return this.activityRepository.save(activity)
  }

  async distributeCoupon(activityId: string, userId: string): Promise<CouponInstance | null> {
    const activity = await this.activityRepository.findOne({ where: { id: activityId } })
    if (!activity || activity.status !== 'active') {
      return null
    }

    const cacheKey = getInventoryCacheKey(activityId)
    const available = await redisCache.decr(cacheKey)
    
    if (available < 0) {
      await redisCache.incr(cacheKey)
      return null
    }

    const existingCount = await this.instanceRepository.count({
      where: { activityId, userId, status: In(['available', 'used']) },
    })

    if (existingCount >= 3) {
      await redisCache.incr(cacheKey)
      return null
    }

    const code = generateCouponCode()
    const instance = this.instanceRepository.create({
      id: generateId(),
      activityId,
      userId,
      code,
      status: 'available',
      issuedAt: new Date(),
      expiresAt: activity.endTime,
    })

    const savedInstance = await this.instanceRepository.save(instance)
    
    activity.usedQuantity = activity.usedQuantity + 1
    await this.activityRepository.save(activity)

    return savedInstance
  }

  async batchDistribute(activityId: string, userIds: string[]): Promise<CouponInstance[]> {
    const instances: CouponInstance[] = []
    
    for (const userId of userIds) {
      const instance = await this.distributeCoupon(activityId, userId)
      if (instance) {
        instances.push(instance)
      }
    }

    return instances
  }

  async getUserCoupons(userId: string, status?: string): Promise<CouponInstance[]> {
    const where: Record<string, unknown> = { userId }
    if (status) where.status = status

    return this.instanceRepository.find({
      where,
      relations: ['activity'],
      order: { issuedAt: 'DESC' },
    })
  }

  async getInstanceByCode(code: string): Promise<CouponInstance | null> {
    return this.instanceRepository.findOne({
      where: { code },
      relations: ['activity', 'user'],
    })
  }

  async getInstanceById(id: string): Promise<CouponInstance | null> {
    return this.instanceRepository.findOne({
      where: { id },
      relations: ['activity', 'user', 'verificationRecord'],
    })
  }

  async updateInstanceStatus(id: string, status: string): Promise<CouponInstance | null> {
    const instance = await this.instanceRepository.findOne({ where: { id } })
    if (!instance) {
      return null
    }

    instance.status = status as CouponInstance['status']
    instance.updatedAt = new Date()
    
    if (status === 'used') {
      instance.usedAt = new Date()
    }

    return this.instanceRepository.save(instance)
  }

  private async updateInventoryCache(activityId: string, quantity: number): Promise<void> {
    const cacheKey = getInventoryCacheKey(activityId)
    await redisCache.set(cacheKey, quantity, 7 * 24 * 60 * 60)
  }

  async getInventoryCount(activityId: string): Promise<number> {
    const cacheKey = getInventoryCacheKey(activityId)
    const cached = await redisCache.get<number>(cacheKey)
    
    if (cached !== null) {
      return cached
    }

    const activity = await this.activityRepository.findOne({ where: { id: activityId } })
    const count = activity ? activity.totalQuantity - activity.usedQuantity : 0
    
    await this.updateInventoryCache(activityId, count)
    
    return count
  }

  async expireCoupons(): Promise<number> {
    const now = new Date()
    const expiredInstances = await this.instanceRepository.find({
      where: { status: 'available', expiresAt: { $lt: now } as unknown as Date },
    })

    let count = 0
    for (const instance of expiredInstances) {
      instance.status = 'expired'
      instance.updatedAt = now
      await this.instanceRepository.save(instance)
      count++
    }

    return count
  }

  async generateInstances(activityId: string, count: number): Promise<CouponInstance[]> {
    const activity = await this.activityRepository.findOne({ where: { id: activityId } })
    if (!activity) {
      return []
    }

    const instances: CouponInstance[] = []
    for (let i = 0; i < count; i++) {
      const instance = this.instanceRepository.create({
        id: generateId(),
        activityId,
        userId: 'system',
        code: generateCouponCode(),
        status: 'available',
        issuedAt: new Date(),
        expiresAt: activity.endTime,
      })
      instances.push(instance)
    }

    return this.instanceRepository.save(instances)
  }
}

export const couponService = new CouponService()
