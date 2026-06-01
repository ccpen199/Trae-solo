import { ProviderRepository } from '../repositories/ProviderRepository.js'
import type { BulkOrder } from '../types/index.js'

const providerRepo = new ProviderRepository()

function generateBulkOrderNo(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0')
  return `BK${date}${random}`
}

export class BulkService {
  getProviders() {
    return providerRepo.findAll()
  }

  getProvider(id: number) {
    return providerRepo.findById(id)
  }

  calculateFee(params: {
    floors: number
    has_elevator: boolean
    floor_height?: number
    disassembly_required: boolean
    weight?: number
  }) {
    const fee = providerRepo.calculateFee(params)
    const breakdown = []

    breakdown.push({
      item: '基础搬运费',
      amount: params.has_elevator ? 50 : 80,
    })

    if (params.has_elevator && params.floors > 3) {
      breakdown.push({
        item: `超高层附加费 (${params.floors - 3}层)`,
        amount: (params.floors - 3) * 10,
      })
    }

    if (!params.has_elevator) {
      breakdown.push({
        item: `楼梯搬运费 (${params.floors}层)`,
        amount: params.floors * 30,
      })
    }

    if (params.floor_height && params.floor_height > 3.5) {
      breakdown.push({
        item: `超高楼层附加费 (${params.floor_height}米)`,
        amount: Math.round((params.floor_height - 3.5) * 20 * 100) / 100,
      })
    }

    if (params.disassembly_required) {
      breakdown.push({
        item: '家具拆装费',
        amount: 200,
      })
    }

    if (params.weight && params.weight > 50) {
      breakdown.push({
        item: `超重附加费 (${params.weight}kg)`,
        amount: Math.ceil((params.weight - 50) / 10) * 30,
      })
    }

    return {
      total: fee,
      breakdown,
    }
  }

  createBulkOrder(orderData: Omit<BulkOrder, 'id' | 'order_no' | 'fee' | 'status' | 'created_at'> & { user_id: number }) {
    const fee = providerRepo.calculateFee({
      floors: orderData.floors,
      has_elevator: !!orderData.has_elevator,
      floor_height: orderData.floor_height,
      disassembly_required: !!orderData.disassembly_required,
    })

    const order: Omit<BulkOrder, 'id'> = {
      ...orderData,
      order_no: generateBulkOrderNo(),
      fee,
      status: 'pending',
      created_at: new Date().toISOString(),
    }

    if (orderData.provider_id) {
      providerRepo.bookProvider(orderData.provider_id)
      order.status = 'assigned'
    }

    return providerRepo.createBulkOrder(order)
  }

  getBulkOrders(userId?: number) {
    return providerRepo.findBulkOrders(userId)
  }

  getBulkOrder(id: number) {
    return providerRepo.findBulkOrderById(id)
  }

  bookProvider(providerId: number) {
    return providerRepo.bookProvider(providerId)
  }
}
