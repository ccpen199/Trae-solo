import { Repository, MoreThan, Between } from 'typeorm'
import { AppDataSource } from '../data-source.js'
import { RiskEvent } from '../entities/RiskEvent.js'
import { User } from '../entities/User.js'
import { CouponInstance } from '../entities/CouponInstance.js'
import { VerificationRecord } from '../entities/VerificationRecord.js'
import { generateId } from '../utils/id.js'
import { getStartOfDay } from '../utils/date.js'
import type {
  RiskEventType,
  RiskLevel,
  RiskStatus,
  RiskEvidence,
} from '../../../shared/types/index.js'

export interface MultiAccountCheckRequest {
  deviceId: string
  userId: string
  idCard: string
  phone: string
  ipAddress?: string
}

export interface BulkHoardingCheckRequest {
  userId: string
  activityId: string
  couponCount: number
  timeWindowMinutes?: number
}

export interface AbnormalPathCheckRequest {
  userId: string
  locations: { latitude: number; longitude: number; timestamp: Date }[]
  timeWindowMinutes?: number
}

export class RiskControlService {
  private eventRepository: Repository<RiskEvent>
  private userRepository: Repository<User>
  private instanceRepository: Repository<CouponInstance>
  private verificationRepository: Repository<VerificationRecord>

  constructor() {
    this.eventRepository = AppDataSource.getRepository(RiskEvent)
    this.userRepository = AppDataSource.getRepository(User)
    this.instanceRepository = AppDataSource.getRepository(CouponInstance)
    this.verificationRepository = AppDataSource.getRepository(VerificationRecord)
  }

  async detectMultiAccount(request: MultiAccountCheckRequest): Promise<RiskEvent | null> {
    const existingUsers = await this.userRepository
      .createQueryBuilder('user')
      .where('user.deviceId = :deviceId AND user.id != :userId', {
        deviceId: request.deviceId,
        userId: request.userId,
      })
      .orWhere('user.idCard = :idCard AND user.id != :userId', {
        idCard: request.idCard,
        userId: request.userId,
      })
      .orWhere('user.phone = :phone AND user.id != :userId', {
        phone: request.phone,
        userId: request.userId,
      })
      .getMany()

    if (existingUsers.length === 0) {
      return null
    }

    const relatedAccounts = existingUsers.map(u => u.id)
    const evidence: RiskEvidence = {
      deviceId: request.deviceId,
      accountCount: existingUsers.length + 1,
      timeWindow: '24h',
      ipAddresses: request.ipAddress ? [request.ipAddress] : undefined,
      anomalyScore: Math.min(100, existingUsers.length * 25),
    }

    const event = this.eventRepository.create({
      id: generateId(),
      type: 'multi_account',
      level: existingUsers.length >= 3 ? 'high' : existingUsers.length >= 2 ? 'medium' : 'low',
      userId: request.userId,
      deviceId: request.deviceId,
      relatedAccounts,
      evidence,
      status: 'pending',
      detectedAt: new Date(),
    })

    const savedEvent = await this.eventRepository.save(event)
    await this.updateUserRiskScore(request.userId, evidence.anomalyScore)

    return savedEvent
  }

  async detectBulkHoarding(request: BulkHoardingCheckRequest): Promise<RiskEvent | null> {
    const { userId, activityId, couponCount, timeWindowMinutes = 60 } = request

    const timeWindow = new Date()
    timeWindow.setMinutes(timeWindow.getMinutes() - timeWindowMinutes)

    const count = await this.instanceRepository.count({
      where: {
        userId,
        activityId,
        issuedAt: MoreThan(timeWindow),
      },
    })

    const totalCount = count + couponCount
    const threshold = 5

    if (totalCount < threshold) {
      return null
    }

    const instances = await this.instanceRepository.find({
      where: {
        userId,
        activityId,
        issuedAt: MoreThan(timeWindow),
      },
      order: { issuedAt: 'DESC' },
      take: totalCount,
    })

    const timestamps = instances.map(i => i.issuedAt)
    const evidence: RiskEvidence = {
      couponCount: totalCount,
      timeWindow: `${timeWindowMinutes}m`,
      timestamps,
      anomalyScore: Math.min(100, (totalCount / threshold) * 50),
    }

    const event = this.eventRepository.create({
      id: generateId(),
      type: 'bulk_hoarding',
      level: totalCount >= 20 ? 'high' : totalCount >= 10 ? 'medium' : 'low',
      userId,
      evidence,
      status: 'pending',
      detectedAt: new Date(),
    })

    const savedEvent = await this.eventRepository.save(event)
    await this.updateUserRiskScore(userId, evidence.anomalyScore)

    if (totalCount >= 10) {
      await this.freezeUserCoupons(userId, activityId)
    }

    return savedEvent
  }

  async detectAbnormalPath(request: AbnormalPathCheckRequest): Promise<RiskEvent | null> {
    const { userId, locations, timeWindowMinutes = 30 } = request

    if (locations.length < 2) {
      return null
    }

    let suspiciousCount = 0
    const pathNodes: string[] = []

    for (let i = 0; i < locations.length - 1; i++) {
      const loc1 = locations[i]
      const loc2 = locations[i + 1]

      const distance = this.calculateDistance(loc1, loc2)
      const timeDiff = Math.abs(loc2.timestamp.getTime() - loc1.timestamp.getTime()) / 1000 / 60

      if (timeDiff < timeWindowMinutes) {
        const speed = distance / (timeDiff / 60)
        
        if (speed > 200) {
          suspiciousCount++
          pathNodes.push(`${loc1.latitude},${loc1.longitude} -> ${loc2.latitude},${loc2.longitude}`)
        }
      }
    }

    if (suspiciousCount === 0) {
      return null
    }

    const evidence: RiskEvidence = {
      pathNodes,
      timeWindow: `${timeWindowMinutes}m`,
      anomalyScore: Math.min(100, suspiciousCount * 30),
    }

    const event = this.eventRepository.create({
      id: generateId(),
      type: 'abnormal_path',
      level: suspiciousCount >= 3 ? 'high' : suspiciousCount >= 2 ? 'medium' : 'low',
      userId,
      evidence,
      status: 'pending',
      detectedAt: new Date(),
    })

    const savedEvent = await this.eventRepository.save(event)
    await this.updateUserRiskScore(userId, evidence.anomalyScore)

    return savedEvent
  }

  private calculateDistance(
    loc1: { latitude: number; longitude: number },
    loc2: { latitude: number; longitude: number },
  ): number {
    const R = 6371
    const dLat = (loc2.latitude - loc1.latitude) * Math.PI / 180
    const dLon = (loc2.longitude - loc1.longitude) * Math.PI / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(loc1.latitude * Math.PI / 180) * Math.cos(loc2.latitude * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  async getEvents(
    page: number = 1,
    pageSize: number = 20,
    type?: RiskEventType,
    level?: RiskLevel,
    status?: RiskStatus,
  ): Promise<{ events: RiskEvent[]; total: number }> {
    const where: Record<string, unknown> = {}
    if (type) where.type = type
    if (level) where.level = level
    if (status) where.status = status

    const [events, total] = await this.eventRepository.findAndCount({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      order: { detectedAt: 'DESC' },
      relations: ['user'],
    })

    return { events, total }
  }

  async getEventById(id: string): Promise<RiskEvent | null> {
    return this.eventRepository.findOne({
      where: { id },
      relations: ['user'],
    })
  }

  async resolveEvent(
    id: string,
    handlerId: string,
    handlerNotes: string,
    action: 'resolve' | 'ignore',
  ): Promise<RiskEvent | null> {
    const event = await this.eventRepository.findOne({ where: { id } })
    if (!event) {
      return null
    }

    event.status = action === 'resolve' ? 'resolved' : 'ignored'
    event.handlerId = handlerId
    event.handledAt = new Date()
    event.handlerNotes = handlerNotes
    event.updatedAt = new Date()

    if (action === 'resolve' && event.userId) {
      await this.freezeUser(event.userId)
    }

    return this.eventRepository.save(event)
  }

  async updateEventStatus(id: string, status: RiskStatus): Promise<RiskEvent | null> {
    const event = await this.eventRepository.findOne({ where: { id } })
    if (!event) {
      return null
    }

    event.status = status
    event.updatedAt = new Date()

    return this.eventRepository.save(event)
  }

  private async updateUserRiskScore(userId: string, scoreIncrement: number): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } })
    if (!user) return

    user.riskScore = Math.min(100, user.riskScore + scoreIncrement)
    user.updatedAt = new Date()

    if (user.riskScore >= 80) {
      user.status = 'frozen'
    } else if (user.riskScore >= 50) {
      user.status = 'watch'
    }

    await this.userRepository.save(user)
  }

  private async freezeUser(userId: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } })
    if (!user) return

    user.status = 'frozen'
    user.updatedAt = new Date()
    await this.userRepository.save(user)
  }

  private async freezeUserCoupons(userId: string, activityId: string): Promise<void> {
    await this.instanceRepository
      .createQueryBuilder()
      .update(CouponInstance)
      .set({ status: 'frozen', updatedAt: new Date() })
      .where('userId = :userId AND activityId = :activityId AND status = :status', {
        userId,
        activityId,
        status: 'available',
      })
      .execute()
  }

  async runRiskScan(): Promise<{ detected: number; types: Record<string, number> }> {
    const startTime = getStartOfDay()
    const now = new Date()

    const types: Record<string, number> = {
      multi_account: 0,
      bulk_hoarding: 0,
      abnormal_path: 0,
    }

    const users = await this.userRepository.find({
      where: { status: 'normal' },
    })

    for (const user of users) {
      if (user.deviceId) {
        const result = await this.detectMultiAccount({
          deviceId: user.deviceId,
          userId: user.id,
          idCard: user.idCard,
          phone: user.phone,
        })
        if (result) types.multi_account++
      }

      const activities = await this.instanceRepository
        .createQueryBuilder('instance')
        .select('instance.activityId')
        .distinct(true)
        .where('instance.userId = :userId', { userId: user.id })
        .andWhere('instance.issuedAt BETWEEN :start AND :end', { start: startTime, end: now })
        .getRawMany()

      for (const activity of activities) {
        const result = await this.detectBulkHoarding({
          userId: user.id,
          activityId: activity.activityId,
          couponCount: 0,
          timeWindowMinutes: 60,
        })
        if (result) types.bulk_hoarding++
      }
    }

    const totalDetected = Object.values(types).reduce((a, b) => a + b, 0)

    return { detected: totalDetected, types }
  }

  async getRiskStats(): Promise<{
    totalEvents: number
    pendingCount: number
    highRiskCount: number
    highRiskUsers: number
  }> {
    const totalEvents = await this.eventRepository.count()
    const pendingCount = await this.eventRepository.count({ where: { status: 'pending' } })
    const highRiskCount = await this.eventRepository.count({ where: { level: 'high' } })
    const highRiskUsers = await this.userRepository.count({ where: { riskScore: MoreThan(70) } })

    return {
      totalEvents,
      pendingCount,
      highRiskCount,
      highRiskUsers,
    }
  }

  async createManualEvent(
    type: RiskEventType,
    level: RiskLevel,
    evidence: RiskEvidence,
    userId?: string,
    deviceId?: string,
    relatedAccounts?: string[],
  ): Promise<RiskEvent> {
    const event = this.eventRepository.create({
      id: generateId(),
      type,
      level,
      userId: userId || null,
      deviceId: deviceId || null,
      relatedAccounts: relatedAccounts || null,
      evidence,
      status: 'pending',
      detectedAt: new Date(),
    })

    return this.eventRepository.save(event)
  }
}

export const riskControlService = new RiskControlService()
