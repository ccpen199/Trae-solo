import { Repository, MoreThan } from 'typeorm'
import { AppDataSource } from '../data-source.js'
import { Alert } from '../entities/Alert.js'
import { Inventory } from '../entities/Inventory.js'
import { CouponActivity } from '../entities/CouponActivity.js'
import { generateId } from '../utils/id.js'
import type { AlertType, AlertLevel } from '../../../shared/types/index.js'

export class AlertService {
  private alertRepository: Repository<Alert>
  private inventoryRepository: Repository<Inventory>
  private activityRepository: Repository<CouponActivity>

  constructor() {
    this.alertRepository = AppDataSource.getRepository(Alert)
    this.inventoryRepository = AppDataSource.getRepository(Inventory)
    this.activityRepository = AppDataSource.getRepository(CouponActivity)
  }

  async createAlert(
    type: AlertType,
    level: AlertLevel,
    title: string,
    message: string,
    relatedId?: string,
    merchantId?: string,
  ): Promise<Alert> {
    const alert = this.alertRepository.create({
      id: generateId(),
      type,
      level,
      title,
      message,
      relatedId: relatedId || null,
      merchantId: merchantId || null,
      read: false,
    })

    return this.alertRepository.save(alert)
  }

  async getAlerts(
    page: number = 1,
    pageSize: number = 20,
    type?: AlertType,
    level?: AlertLevel,
    read?: boolean,
    merchantId?: string,
  ): Promise<{ alerts: Alert[]; total: number }> {
    const where: Record<string, unknown> = {}
    if (type) where.type = type
    if (level) where.level = level
    if (read !== undefined) where.read = read
    if (merchantId) where.merchantId = merchantId

    const [alerts, total] = await this.alertRepository.findAndCount({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      order: { createdAt: 'DESC' },
    })

    return { alerts, total }
  }

  async getAlertById(id: string): Promise<Alert | null> {
    return this.alertRepository.findOne({ where: { id } })
  }

  async markAsRead(id: string): Promise<Alert | null> {
    const alert = await this.alertRepository.findOne({ where: { id } })
    if (!alert) {
      return null
    }

    alert.read = true
    return this.alertRepository.save(alert)
  }

  async markAllAsRead(merchantId?: string): Promise<number> {
    const where: Record<string, unknown> = { read: false }
    if (merchantId) where.merchantId = merchantId

    const result = await this.alertRepository
      .createQueryBuilder()
      .update(Alert)
      .set({ read: true })
      .where(where)
      .execute()

    return result.affected || 0
  }

  async getUnreadCount(merchantId?: string): Promise<number> {
    const where: Record<string, unknown> = { read: false }
    if (merchantId) where.merchantId = merchantId

    return this.alertRepository.count({ where })
  }

  async deleteAlert(id: string): Promise<boolean> {
    const result = await this.alertRepository.delete(id)
    return (result.affected || 0) > 0
  }

  async deleteOldAlerts(daysOld: number = 30): Promise<number> {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysOld)

    const result = await this.alertRepository
      .createQueryBuilder()
      .delete()
      .from(Alert)
      .where('createdAt < :cutoffDate', { cutoffDate })
      .execute()

    return result.affected || 0
  }

  async checkInventoryAlerts(threshold: number = 100): Promise<Alert[]> {
    const lowInventory = await this.inventoryRepository
      .createQueryBuilder('inventory')
      .where('inventory.availableQuantity <= :threshold', { threshold })
      .andWhere('inventory.availableQuantity > 0')
      .leftJoinAndSelect('inventory.activity', 'activity')
      .getMany()

    const createdAlerts: Alert[] = []

    for (const inventory of lowInventory) {
      const activityName = inventory.activity?.name || '未知活动'
      
      const existingAlert = await this.alertRepository.findOne({
        where: {
          type: 'inventory',
          relatedId: inventory.id,
          read: false,
        },
      })

      if (!existingAlert) {
        const level: AlertLevel = inventory.availableQuantity <= 10 ? 'critical' : 'warning'
        const alert = await this.createAlert(
          'inventory',
          level,
          `库存预警: ${activityName}`,
          `活动"${activityName}"的库存仅剩${inventory.availableQuantity}张，请及时补货。`,
          inventory.id,
        )
        createdAlerts.push(alert)
      }
    }

    return createdAlerts
  }

  async checkVerificationRateAlerts(threshold: number = 0.3): Promise<Alert[]> {
    const activities = await this.activityRepository.find({
      where: { status: 'active' },
    })

    const createdAlerts: Alert[] = []

    for (const activity of activities) {
      if (activity.totalQuantity > 0) {
        const verificationRate = activity.usedQuantity / activity.totalQuantity
        
        if (verificationRate > 0 && verificationRate < threshold) {
          const existingAlert = await this.alertRepository.findOne({
            where: {
              type: 'verification_rate',
              relatedId: activity.id,
              read: false,
            },
          })

          if (!existingAlert) {
            const alert = await this.createAlert(
              'verification_rate',
              'warning',
              `核销率预警: ${activity.name}`,
              `活动"${activity.name}"的核销率仅为${(verificationRate * 100).toFixed(1)}%，低于阈值${(threshold * 100)}%。`,
              activity.id,
            )
            createdAlerts.push(alert)
          }
        }
      }
    }

    return createdAlerts
  }

  async checkSystemAlerts(): Promise<Alert[]> {
    const now = new Date()
    const soonExpiring = await this.activityRepository
      .createQueryBuilder('activity')
      .where('activity.status = :status', { status: 'active' })
      .andWhere('activity.endTime BETWEEN :now AND :threeDaysLater', {
        now,
        threeDaysLater: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
      })
      .getMany()

    const createdAlerts: Alert[] = []

    for (const activity of soonExpiring) {
      const existingAlert = await this.alertRepository.findOne({
        where: {
          type: 'system',
          relatedId: activity.id,
          read: false,
        },
      })

      if (!existingAlert) {
        const alert = await this.createAlert(
          'system',
          'info',
          `活动即将到期: ${activity.name}`,
          `活动"${activity.name}"将于${activity.endTime.toLocaleString()}到期，请注意处理。`,
          activity.id,
        )
        createdAlerts.push(alert)
      }
    }

    return createdAlerts
  }

  async runAlertChecks(): Promise<{
    inventoryAlerts: Alert[]
    verificationAlerts: Alert[]
    systemAlerts: Alert[]
  }> {
    const [inventoryAlerts, verificationAlerts, systemAlerts] = await Promise.all([
      this.checkInventoryAlerts(),
      this.checkVerificationRateAlerts(),
      this.checkSystemAlerts(),
    ])

    return { inventoryAlerts, verificationAlerts, systemAlerts }
  }

  async getAlertStats(): Promise<{
    totalAlerts: number
    unreadCount: number
    criticalCount: number
    warningCount: number
    infoCount: number
  }> {
    const totalAlerts = await this.alertRepository.count()
    const unreadCount = await this.alertRepository.count({ where: { read: false } })
    const criticalCount = await this.alertRepository.count({ where: { level: 'critical', read: false } })
    const warningCount = await this.alertRepository.count({ where: { level: 'warning', read: false } })
    const infoCount = await this.alertRepository.count({ where: { level: 'info', read: false } })

    return {
      totalAlerts,
      unreadCount,
      criticalCount,
      warningCount,
      infoCount,
    }
  }
}

export const alertService = new AlertService()
