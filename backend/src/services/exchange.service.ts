import { AppDataSource } from '../config/database'
import {
  ExchangeOrder,
  ExchangeOrderStatus,
  ExchangeType,
  Member,
} from '../entities'
import { ExchangeGate, ExchangeRequest, ExchangeItem } from '../engines/exchange-gate'

export class ExchangeService {
  private static instance: ExchangeService

  private constructor() {}

  static getInstance(): ExchangeService {
    if (!ExchangeService.instance) {
      ExchangeService.instance = new ExchangeService()
    }
    return ExchangeService.instance
  }

  async createExchange(
    memberId: string,
    item: ExchangeItem,
    businessNo?: string,
    operatorId?: string
  ) {
    const exchangeGate = ExchangeGate.getInstance()

    const request: ExchangeRequest = {
      memberId,
      items: [item],
      businessNo,
      operatorId,
    }

    return exchangeGate.createAndFreeze(request)
  }

  async confirmExchange(orderId: string, operatorId?: string) {
    const exchangeGate = ExchangeGate.getInstance()
    return exchangeGate.confirmExchange(orderId)
  }

  async cancelExchange(orderId: string, reason?: string, operatorId?: string) {
    const exchangeGate = ExchangeGate.getInstance()
    return exchangeGate.cancelExchange(orderId, reason)
  }

  async completeExchange(orderId: string, operatorId?: string) {
    const exchangeGate = ExchangeGate.getInstance()
    return exchangeGate.completeExchange(orderId)
  }

  async getOrderById(orderId: string): Promise<ExchangeOrder | null> {
    const orderRepo = AppDataSource.getRepository(ExchangeOrder)
    return orderRepo.findOne({
      where: { id: orderId },
      relations: ['member'],
    })
  }

  async getOrderByNo(orderNo: string): Promise<ExchangeOrder | null> {
    const orderRepo = AppDataSource.getRepository(ExchangeOrder)
    return orderRepo.findOne({
      where: { orderNo },
      relations: ['member'],
    })
  }

  async listOrders(
    filters?: {
      memberId?: string
      status?: ExchangeOrderStatus
      exchangeType?: ExchangeType
      startDate?: Date
      endDate?: Date
    },
    page: number = 1,
    pageSize: number = 20
  ): Promise<{
    items: ExchangeOrder[]
    total: number
    page: number
    pageSize: number
  }> {
    const orderRepo = AppDataSource.getRepository(ExchangeOrder)
    
    const query = orderRepo.createQueryBuilder('order')

    if (filters?.memberId) {
      query.andWhere('order.memberId = :memberId', { memberId: filters.memberId })
    }

    if (filters?.status) {
      query.andWhere('order.status = :status', { status: filters.status })
    }

    if (filters?.exchangeType) {
      query.andWhere('order.exchangeType = :exchangeType', { exchangeType: filters.exchangeType })
    }

    if (filters?.startDate) {
      query.andWhere('order.createdAt >= :startDate', { startDate: filters.startDate })
    }

    if (filters?.endDate) {
      query.andWhere('order.createdAt <= :endDate', { endDate: filters.endDate })
    }

    query.orderBy('order.createdAt', 'DESC')

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

  async processTimeoutOrders(): Promise<{ processedCount: number; errors: string[] }> {
    const exchangeGate = ExchangeGate.getInstance()
    return exchangeGate.processTimeoutOrders()
  }
}
