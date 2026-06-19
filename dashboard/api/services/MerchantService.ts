import { Repository } from 'typeorm'
import { AppDataSource } from '../data-source.js'
import { Merchant } from '../entities/Merchant.js'
import { Store } from '../entities/Store.js'
import { POSTerminal } from '../entities/POSTerminal.js'
import { generateId } from '../utils/id.js'
import type { Merchant as MerchantType, Store as StoreType, POSTerminal as POSTerminalType } from '../../../shared/types/index.js'

export class MerchantService {
  private merchantRepository: Repository<Merchant>
  private storeRepository: Repository<Store>
  private terminalRepository: Repository<POSTerminal>

  constructor() {
    this.merchantRepository = AppDataSource.getRepository(Merchant)
    this.storeRepository = AppDataSource.getRepository(Store)
    this.terminalRepository = AppDataSource.getRepository(POSTerminal)
  }

  async createMerchant(data: Omit<MerchantType, 'id' | 'createdAt'>): Promise<Merchant> {
    const merchant = this.merchantRepository.create({
      id: generateId(),
      ...data,
    })
    return this.merchantRepository.save(merchant)
  }

  async getMerchantList(
    page: number = 1,
    pageSize: number = 20,
    status?: string,
    district?: string,
    category?: string,
  ): Promise<{ merchants: Merchant[]; total: number }> {
    const where: Record<string, unknown> = {}
    if (status) where.status = status
    if (district) where.district = district
    if (category) where.category = category

    const [merchants, total] = await this.merchantRepository.findAndCount({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      order: { createdAt: 'DESC' },
    })

    return { merchants, total }
  }

  async getMerchantById(id: string): Promise<Merchant | null> {
    return this.merchantRepository.findOne({
      where: { id },
      relations: ['stores'],
    })
  }

  async updateMerchant(id: string, updates: Partial<Merchant>): Promise<Merchant | null> {
    const merchant = await this.merchantRepository.findOne({ where: { id } })
    if (!merchant) {
      return null
    }

    Object.assign(merchant, updates)
    merchant.updatedAt = new Date()

    return this.merchantRepository.save(merchant)
  }

  async updateMerchantStatus(id: string, status: 'active' | 'inactive' | 'pending'): Promise<Merchant | null> {
    const merchant = await this.merchantRepository.findOne({ where: { id } })
    if (!merchant) {
      return null
    }

    merchant.status = status
    merchant.updatedAt = new Date()

    return this.merchantRepository.save(merchant)
  }

  async createStore(merchantId: string, data: Omit<StoreType, 'id' | 'merchantId'>): Promise<Store> {
    const store = this.storeRepository.create({
      id: generateId(),
      merchantId,
      ...data,
    })
    return this.storeRepository.save(store)
  }

  async getStoresByMerchant(merchantId: string): Promise<Store[]> {
    return this.storeRepository.find({
      where: { merchantId },
      order: { createdAt: 'DESC' },
    })
  }

  async getStoreById(id: string): Promise<Store | null> {
    return this.storeRepository.findOne({
      where: { id },
      relations: ['merchant', 'posTerminals'],
    })
  }

  async updateStore(id: string, updates: Partial<Store>): Promise<Store | null> {
    const store = await this.storeRepository.findOne({ where: { id } })
    if (!store) {
      return null
    }

    Object.assign(store, updates)
    store.updatedAt = new Date()

    return this.storeRepository.save(store)
  }

  async createTerminal(
    storeId: string,
    merchantId: string,
    data: Omit<POSTerminalType, 'id' | 'storeId' | 'merchantId'>,
  ): Promise<POSTerminal> {
    const terminal = this.terminalRepository.create({
      id: generateId(),
      storeId,
      merchantId,
      ...data,
    })
    return this.terminalRepository.save(terminal)
  }

  async getTerminalsByStore(storeId: string): Promise<POSTerminal[]> {
    return this.terminalRepository.find({
      where: { storeId },
      order: { createdAt: 'DESC' },
    })
  }

  async getTerminalsByMerchant(merchantId: string): Promise<POSTerminal[]> {
    return this.terminalRepository.find({
      where: { merchantId },
      order: { createdAt: 'DESC' },
    })
  }

  async getTerminalById(id: string): Promise<POSTerminal | null> {
    return this.terminalRepository.findOne({
      where: { id },
      relations: ['store', 'merchant'],
    })
  }

  async updateTerminal(id: string, updates: Partial<POSTerminal>): Promise<POSTerminal | null> {
    const terminal = await this.terminalRepository.findOne({ where: { id } })
    if (!terminal) {
      return null
    }

    Object.assign(terminal, updates)
    terminal.updatedAt = new Date()

    return this.terminalRepository.save(terminal)
  }

  async updateTerminalHeartbeat(terminalNo: string): Promise<POSTerminal | null> {
    const terminal = await this.terminalRepository.findOne({ where: { terminalNo } })
    if (!terminal) {
      return null
    }

    terminal.lastHeartbeat = new Date()
    terminal.updatedAt = new Date()

    return this.terminalRepository.save(terminal)
  }

  async getMerchantStats(): Promise<{
    totalMerchants: number
    activeMerchants: number
    pendingMerchants: number
    totalStores: number
    totalTerminals: number
  }> {
    const totalMerchants = await this.merchantRepository.count()
    const activeMerchants = await this.merchantRepository.count({ where: { status: 'active' } })
    const pendingMerchants = await this.merchantRepository.count({ where: { status: 'pending' } })
    const totalStores = await this.storeRepository.count()
    const totalTerminals = await this.terminalRepository.count()

    return {
      totalMerchants,
      activeMerchants,
      pendingMerchants,
      totalStores,
      totalTerminals,
    }
  }

  async getMerchantsByIds(ids: string[]): Promise<Merchant[]> {
    return this.merchantRepository.findByIds(ids)
  }

  async deleteMerchant(id: string): Promise<boolean> {
    const result = await this.merchantRepository.delete(id)
    return (result.affected || 0) > 0
  }

  async deleteStore(id: string): Promise<boolean> {
    const result = await this.storeRepository.delete(id)
    return (result.affected || 0) > 0
  }

  async deleteTerminal(id: string): Promise<boolean> {
    const result = await this.terminalRepository.delete(id)
    return (result.affected || 0) > 0
  }
}

export const merchantService = new MerchantService()
