import { RiderRepository } from '../repositories/RiderRepository.js'
import { NetworkRepository } from '../repositories/NetworkRepository.js'
import type { ExpressOrder, Rider } from '../types/index.js'

const riderRepo = new RiderRepository()
const networkRepo = new NetworkRepository()

function generateExpressOrderNo(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0')
  return `EX${date}${random}`
}

export class ExpressService {
  createExpressOrder(orderData: Omit<ExpressOrder, 'id' | 'order_no' | 'rider_id' | 'status' | 'estimated_minutes' | 'created_at'> & { user_id: number }) {
    const availableRiders = riderRepo.findAll('available')
    const rider = availableRiders[Math.floor(Math.random() * availableRiders.length)]

    const order: Omit<ExpressOrder, 'id'> = {
      ...orderData,
      order_no: generateExpressOrderNo(),
      rider_id: rider?.id,
      status: rider ? 'assigned' : 'pending',
      estimated_minutes: Math.floor(Math.random() * 30) + 30,
      created_at: new Date().toISOString(),
    }

    if (rider) {
      riderRepo.updateStatus(rider.id, 'busy')
    }

    return riderRepo.createExpressOrder(order)
  }

  getExpressOrder(id: number) {
    return riderRepo.findExpressOrderById(id)
  }

  getExpressOrders(userId?: number) {
    return riderRepo.findExpressOrders(userId)
  }

  getRiderLocation(riderId: number) {
    const rider = riderRepo.findById(riderId)
    if (!rider) return null

    return {
      rider,
      currentLocation: {
        latitude: rider.latitude + (Math.random() - 0.5) * 0.01,
        longitude: rider.longitude + (Math.random() - 0.5) * 0.01,
        heading: Math.floor(Math.random() * 360),
        speed: Math.floor(Math.random() * 20) + 10,
        lastUpdate: new Date().toISOString(),
      },
      eta: Math.floor(Math.random() * 15) + 5,
    }
  }

  updateRiderLocation(riderId: number, latitude: number, longitude: number) {
    return riderRepo.updateLocation(riderId, latitude, longitude)
  }

  getAvailableRiders() {
    return riderRepo.findAll('available')
  }

  updateExpressOrderStatus(id: number, status: string) {
    return riderRepo.updateExpressOrderStatus(id, status)
  }

  getProtocols() {
    return networkRepo.getProtocols()
  }

  createProtocol(protocolData: any) {
    return networkRepo.createProtocol(protocolData)
  }

  updateProtocol(id: number, updates: any) {
    return networkRepo.updateProtocol(id, updates)
  }
}
