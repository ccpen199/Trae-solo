import { TrackingRepository } from '../repositories/TrackingRepository.js'
import type { TrackingEvent, Exception } from '../types/index.js'

const trackingRepo = new TrackingRepository()

export class TrackingService {
  getTracking(orderId: number) {
    return trackingRepo.getTracking(orderId)
  }

  addTrackingEvent(event: Omit<TrackingEvent, 'id'>) {
    return trackingRepo.addEvent(event)
  }

  getExceptions(params: { page?: number; pageSize?: number; level?: number; status?: string } = {}) {
    return trackingRepo.getExceptions(params)
  }

  createException(exception: Omit<Exception, 'id'>) {
    return trackingRepo.createException(exception)
  }

  respondToException(exceptionId: number, response: { response_status: string; responder_id?: number }) {
    const updates: Partial<Exception> = {
      response_status: response.response_status as any,
    }

    if (response.responder_id) {
      updates.responder_id = response.responder_id
    }

    if (response.response_status === 'resolved') {
      updates.resolved_at = new Date().toISOString()
    }

    return trackingRepo.updateException(exceptionId, updates)
  }

  escalateException(exceptionId: number) {
    const exception = trackingRepo.findExceptionById(exceptionId)
    if (!exception) return null

    const newLevel = Math.min(exception.level + 1, 3)
    return trackingRepo.updateException(exceptionId, { level: newLevel })
  }

  getExceptionStats() {
    return trackingRepo.getExceptionStats()
  }

  getRealTimeTracking(orderId: number) {
    const events = trackingRepo.getTracking(orderId)

    if (events.length > 0 && events[events.length - 1].status === 'in_transit') {
      const lastEvent = events[events.length - 1]
      const now = new Date()
      const lat = 30 + Math.random() * 10
      const lng = 110 + Math.random() * 15

      return {
        events,
        currentLocation: {
          latitude: lat,
          longitude: lng,
          description: `运输中 - 预计 ${this.getEstimatedArrival(events)}`,
          lastUpdate: now.toISOString(),
        },
        progress: this.calculateProgress(events),
      }
    }

    return {
      events,
      currentLocation: events.length > 0 ? {
        description: events[events.length - 1].description,
        lastUpdate: events[events.length - 1].event_time,
      } : null,
      progress: this.calculateProgress(events),
    }
  }

  private calculateProgress(events: TrackingEvent[]): number {
    if (events.length === 0) return 0

    const statusOrder = ['pending', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered']
    const lastStatus = events[events.length - 1].status

    const index = statusOrder.indexOf(lastStatus)
    if (index === -1) return 50

    return Math.round((index / (statusOrder.length - 1)) * 100)
  }

  private getEstimatedArrival(events: TrackingEvent[]): string {
    const eta = new Date()
    eta.setHours(eta.getHours() + Math.floor(Math.random() * 24) + 6)
    return eta.toLocaleString('zh-CN')
  }
}
