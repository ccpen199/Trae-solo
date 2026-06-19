import { Repository } from 'typeorm'
import { AppDataSource } from '../data-source.js'
import { Inventory } from '../entities/Inventory.js'
import { CouponActivity } from '../entities/CouponActivity.js'
import { generateBatchNo, generateId } from '../utils/id.js'
import { redisCache, getInventoryCacheKey } from '../utils/redis.js'

export interface ReplenishRequest {
  activityId: string
  quantity: number
  unitCost?: number
  expiryDate?: Date
}

export interface InventoryLogEntry {
  id: string
  inventoryId: string
  type: 'in' | 'out' | 'adjust'
  quantity: number
  balance: number
  operatorId: string
  operatorName: string
  remark?: string
  createdAt: Date
}

export class InventoryService {
  private inventoryRepository: Repository<Inventory>
  private activityRepository: Repository<CouponActivity>
  private logStore: Map<string, InventoryLogEntry[]> = new Map()

  constructor() {
    this.inventoryRepository = AppDataSource.getRepository(Inventory)
    this.activityRepository = AppDataSource.getRepository(CouponActivity)
  }

  async createInventory(
    activityId: string,
    quantity: number,
    unitCost?: number,
    expiryDate?: Date,
  ): Promise<Inventory> {
    const activity = await this.activityRepository.findOne({ where: { id: activityId } })
    if (!activity) {
      throw new Error('Activity not found')
    }

    const inventory = this.inventoryRepository.create({
      id: generateId(),
      activityId,
      batchNo: generateBatchNo(),
      quantity,
      availableQuantity: quantity,
      unitCost: unitCost || null,
      expiryDate: expiryDate || null,
    })

    const savedInventory = await this.inventoryRepository.save(inventory)
    
    await this.updateInventoryCache(activityId)
    
    this.addLog({
      id: generateId(),
      inventoryId: savedInventory.id,
      type: 'in',
      quantity,
      balance: quantity,
      operatorId: 'system',
      operatorName: 'System',
      remark: 'Initial inventory creation',
      createdAt: new Date(),
    })

    return savedInventory
  }

  async replenish(request: ReplenishRequest, operatorId: string, operatorName: string): Promise<Inventory | null> {
    const inventory = await this.inventoryRepository.findOne({
      where: { activityId: request.activityId },
      order: { createdAt: 'DESC' },
    })

    if (!inventory) {
      const newInventory = await this.createInventory(
        request.activityId,
        request.quantity,
        request.unitCost,
        request.expiryDate,
      )
      return newInventory
    }

    inventory.availableQuantity += request.quantity
    inventory.quantity += request.quantity
    inventory.updatedAt = new Date()

    const savedInventory = await this.inventoryRepository.save(inventory)
    
    const activity = await this.activityRepository.findOne({ where: { id: request.activityId } })
    if (activity) {
      activity.totalQuantity += request.quantity
      await this.activityRepository.save(activity)
    }

    await this.updateInventoryCache(request.activityId)

    this.addLog({
      id: generateId(),
      inventoryId: inventory.id,
      type: 'in',
      quantity: request.quantity,
      balance: inventory.availableQuantity,
      operatorId,
      operatorName,
      remark: 'Inventory replenishment',
      createdAt: new Date(),
    })

    return savedInventory
  }

  async getInventoryList(
    page: number = 1,
    pageSize: number = 20,
    activityId?: string,
  ): Promise<{ inventory: Inventory[]; total: number }> {
    const where: Record<string, unknown> = {}
    if (activityId) where.activityId = activityId

    const [inventory, total] = await this.inventoryRepository.findAndCount({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      order: { createdAt: 'DESC' },
      relations: ['activity'],
    })

    return { inventory, total }
  }

  async getInventoryByActivity(activityId: string): Promise<Inventory[]> {
    return this.inventoryRepository.find({
      where: { activityId },
      order: { createdAt: 'DESC' },
    })
  }

  async getInventoryById(id: string): Promise<Inventory | null> {
    return this.inventoryRepository.findOne({
      where: { id },
      relations: ['activity'],
    })
  }

  async deductInventory(activityId: string, quantity: number): Promise<boolean> {
    const inventory = await this.inventoryRepository.findOne({
      where: { activityId },
      order: { createdAt: 'DESC' },
    })

    if (!inventory || inventory.availableQuantity < quantity) {
      return false
    }

    inventory.availableQuantity -= quantity
    inventory.updatedAt = new Date()

    await this.inventoryRepository.save(inventory)
    await this.updateInventoryCache(activityId)

    return true
  }

  async adjustInventory(
    id: string,
    newQuantity: number,
    operatorId: string,
    operatorName: string,
    remark?: string,
  ): Promise<Inventory | null> {
    const inventory = await this.inventoryRepository.findOne({ where: { id } })
    if (!inventory) {
      return null
    }

    const diff = newQuantity - inventory.availableQuantity
    inventory.availableQuantity = newQuantity
    inventory.updatedAt = new Date()

    const savedInventory = await this.inventoryRepository.save(inventory)
    await this.updateInventoryCache(inventory.activityId)

    this.addLog({
      id: generateId(),
      inventoryId: id,
      type: 'adjust',
      quantity: diff,
      balance: newQuantity,
      operatorId,
      operatorName,
      remark: remark || 'Inventory adjustment',
      createdAt: new Date(),
    })

    return savedInventory
  }

  async getAvailableQuantity(activityId: string): Promise<number> {
    const cacheKey = getInventoryCacheKey(activityId)
    const cached = await redisCache.get<number>(cacheKey)
    
    if (cached !== null) {
      return cached
    }

    const inventory = await this.inventoryRepository.findOne({
      where: { activityId },
      order: { createdAt: 'DESC' },
    })

    const quantity = inventory?.availableQuantity || 0
    await redisCache.set(cacheKey, quantity, 3600)
    
    return quantity
  }

  async getInventoryLogs(inventoryId: string): Promise<InventoryLogEntry[]> {
    return this.logStore.get(inventoryId) || []
  }

  async checkLowInventory(threshold: number = 100): Promise<Inventory[]> {
    return this.inventoryRepository
      .createQueryBuilder('inventory')
      .where('inventory.availableQuantity <= :threshold', { threshold })
      .andWhere('inventory.availableQuantity > 0')
      .leftJoinAndSelect('inventory.activity', 'activity')
      .getMany()
  }

  private async updateInventoryCache(activityId: string): Promise<void> {
    const cacheKey = getInventoryCacheKey(activityId)
    const inventory = await this.inventoryRepository.findOne({
      where: { activityId },
      order: { createdAt: 'DESC' },
    })
    
    const quantity = inventory?.availableQuantity || 0
    await redisCache.set(cacheKey, quantity, 3600)
  }

  private addLog(log: InventoryLogEntry): void {
    const existing = this.logStore.get(log.inventoryId) || []
    existing.unshift(log)
    this.logStore.set(log.inventoryId, existing)
  }

  async getInventoryStats(): Promise<{
    totalInventory: number
    totalValue: number
    lowInventoryCount: number
  }> {
    const inventory = await this.inventoryRepository.find()
    
    let totalInventory = 0
    let totalValue = 0
    let lowInventoryCount = 0

    for (const item of inventory) {
      totalInventory += item.availableQuantity
      totalValue += item.availableQuantity * (item.unitCost || 0)
      if (item.availableQuantity <= 100) {
        lowInventoryCount++
      }
    }

    return {
      totalInventory,
      totalValue,
      lowInventoryCount,
    }
  }
}

export const inventoryService = new InventoryService()
