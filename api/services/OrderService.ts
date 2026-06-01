import { OrderRepository } from '../repositories/OrderRepository.js'
import type { Order, RoutingOption } from '../types/index.js'

const orderRepo = new OrderRepository()

function generateOrderNo(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0')
  return `SF${date}${random}`
}

export class OrderService {
  createOrder(orderData: Omit<Order, 'id' | 'order_no' | 'created_at' | 'updated_at' | 'routing_plan' | 'carrier' | 'estimated_delivery'> & { user_id: number }) {
    const routing = this.calculateRouting(orderData.goods_type, orderData.urgency, orderData.weight)

    const order: Omit<Order, 'id' | 'created_at' | 'updated_at'> = {
      ...orderData,
      order_no: generateOrderNo(),
      routing_plan: routing.plan,
      carrier: routing.carrier,
      estimated_delivery: routing.eta,
      status: 'pending',
    }

    return orderRepo.create(order)
  }

  getOrder(id: number) {
    return orderRepo.findById(id)
  }

  getOrderByNo(orderNo: string) {
    return orderRepo.findByOrderNo(orderNo)
  }

  getOrders(params: { page?: number; pageSize?: number; status?: string; user_id?: number } = {}) {
    return orderRepo.findAll(params)
  }

  updateOrder(id: number, updates: Partial<Order>) {
    return orderRepo.update(id, updates)
  }

  deleteOrder(id: number) {
    return orderRepo.delete(id)
  }

  calculateRouting(goodsType: string, urgency: string, weight: number): { carrier: string; plan: string; eta: string; cost: number } {
    let carrier = '顺丰速运'
    let days = 3
    let cost = 15

    if (urgency === 'urgent') {
      carrier = '顺丰特快'
      days = 1
      cost = 30
    } else if (urgency === 'express') {
      carrier = '顺丰航空'
      days = 2
      cost = 23
    } else if (weight > 20) {
      carrier = '顺丰特惠'
      days = 4
      cost = 12
    }

    if (goodsType === '电子产品' || goodsType === '精密仪器') {
      carrier = '顺丰航空'
      cost += 5
    }

    if (goodsType === '易碎品') {
      cost += 10
    }

    cost += Math.ceil(weight / 2) * 2

    const eta = new Date()
    eta.setDate(eta.getDate() + days)

    return {
      carrier,
      plan: `${carrier} - ${urgency === 'urgent' ? '航空直达' : urgency === 'express' ? '航空干线' : '陆运干线'}`,
      eta: eta.toISOString().split('T')[0],
      cost: Math.round(cost * 100) / 100,
    }
  }

  getRoutingOptions(goodsType: string, urgency: string, weight: number, fromCity: string, toCity: string): RoutingOption[] {
    const options: RoutingOption[] = []

    const baseCost = this.calculateRouting(goodsType, urgency, weight).cost

    options.push({
      carrier: '顺丰特快',
      estimated_days: 1,
      cost: baseCost * 1.5,
      score: 95,
      reason: '航空直达，时效最快，适合紧急贵重物品',
    })

    options.push({
      carrier: '顺丰航空',
      estimated_days: 2,
      cost: baseCost * 1.2,
      score: 88,
      reason: '航空干线，时效稳定，性价比高',
    })

    options.push({
      carrier: '顺丰速运',
      estimated_days: 3,
      cost: baseCost,
      score: 80,
      reason: '陆运干线，经济实惠，适合普通货物',
    })

    options.push({
      carrier: '顺丰特惠',
      estimated_days: 4,
      cost: baseCost * 0.8,
      score: 70,
      reason: '经济陆运，价格最优，时效稍慢',
    })

    return options
  }

  batchCreateOrders(orders: Omit<Order, 'id' | 'order_no' | 'created_at' | 'updated_at'>[]) {
    const results = []
    for (const order of orders) {
      results.push(this.createOrder(order as any))
    }
    return results
  }

  processScanOrder(scanData: { qrCode: string; user_id: number }) {
    const mockAddress = JSON.parse(`{"sender":"上海市浦东新区张江高科技园区","receiver":"北京市朝阳区望京SOHO"}`)
    return this.createOrder({
      user_id: scanData.user_id,
      sender_name: '扫码用户',
      sender_phone: '13800138000',
      sender_address: mockAddress.sender,
      receiver_name: '收件人',
      receiver_phone: '13900139000',
      receiver_address: mockAddress.receiver,
      goods_type: '普通物品',
      weight: 1,
      urgency: 'standard',
      status: 'pending',
    })
  }

  processVoiceOrder(voiceText: string, user_id: number) {
    const keywords = {
      sender: voiceText.match(/从([\u4e00-\u9fa5]+)/)?.[1] || '默认寄件地址',
      receiver: voiceText.match(/到([\u4e00-\u9fa5]+)/)?.[1] || '默认收件地址',
      goods: voiceText.match(/寄(.+?)(?:，|。|$)/)?.[1] || '文件',
    }

    return this.createOrder({
      user_id,
      sender_name: '语音用户',
      sender_phone: '13800138000',
      sender_address: keywords.sender,
      receiver_name: '收件人',
      receiver_phone: '13900139000',
      receiver_address: keywords.receiver,
      goods_type: keywords.goods,
      weight: 1,
      urgency: 'standard',
      status: 'pending',
    })
  }

  getStats() {
    return orderRepo.getStats()
  }

  getDashboardData() {
    const stats = orderRepo.getStats()
    const now = new Date()
    const trendData = []

    for (let i = 6; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      trendData.push({
        date: date.toISOString().slice(5, 10),
        orders: Math.floor(Math.random() * 500) + 500,
        revenue: Math.floor(Math.random() * 50000) + 50000,
      })
    }

    return {
      stats,
      trendData,
      revenue: {
        today: 128560,
        yesterday: 115230,
        growth: 11.5,
      },
    }
  }
}
