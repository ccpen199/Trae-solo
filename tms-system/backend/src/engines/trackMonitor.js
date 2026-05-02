import { v4 as uuidv4 } from 'uuid'
import { db } from '../models/database.js'

export class TrackMonitor {
  constructor(io) {
    this.io = io
    this.activeTracks = new Map()
  }

  processLocation(data) {
    const { waybill_id, vehicle_id, driver_id, lat, lng, address, speed, direction } = data

    if (waybill_id) {
      const id = uuidv4()

      db.prepare(`
        INSERT INTO gps_tracks (id, waybill_id, vehicle_id, driver_id, lat, lng, address, speed, direction, location_type, recorded_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'NORMAL', CURRENT_TIMESTAMP)
      `).run(id, waybill_id, vehicle_id, driver_id, lat, lng, address, speed, direction)

      if (vehicle_id) {
        db.prepare(`
          UPDATE vehicles SET current_lat = ?, current_lng = ?, current_address = ?, last_location_update = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(lat, lng, address, vehicle_id)
      }

      this.io.to(`waybill:${waybill_id}`).emit('location-update', {
        waybill_id,
        lat,
        lng,
        address,
        speed,
        direction,
        timestamp: new Date().toISOString()
      })

      this.checkAnomaly(waybill_id, { lat, lng, speed })
    }
  }

  checkAnomaly(waybillId, locationData) {
    const { speed } = locationData

    if (speed > 120) {
      this.io.to(`waybill:${waybillId}`).emit('anomaly-warning', {
        type: 'SPEED_OVER',
        message: '检测到异常速度',
        data: { speed }
      })
    }

    if (speed < 5 && speed > 0) {
      const existing = this.activeTracks.get(waybillId)
      if (existing) {
        existing.idleTime = (existing.idleTime || 0) + 30
        if (existing.idleTime > 600) {
          this.io.to(`waybill:${waybillId}`).emit('anomaly-warning', {
            type: 'LONG_IDLE',
            message: '车辆长时间停滞',
            data: { idleTime: existing.idleTime }
          })
        }
      }
    }
  }

  subscribeWaybill(socket, waybillId) {
    socket.join(`waybill:${waybillId}`)
    this.activeTracks.set(waybillId, { socketId: socket.id, startTime: Date.now() })
  }

  unsubscribeWaybill(socket, waybillId) {
    socket.leave(`waybill:${waybillId}`)
    this.activeTracks.delete(waybillId)
  }

  getTrackHistory(waybillId) {
    return db.prepare(`
      SELECT * FROM gps_tracks
      WHERE waybill_id = ?
      ORDER BY recorded_at ASC
    `).all(waybillId)
  }

  getTrackSummary(waybillId) {
    const tracks = this.getTrackHistory(waybillId)
    if (tracks.length === 0) return null

    let totalDistance = 0
    let maxSpeed = 0
    let totalIdleTime = 0

    for (let i = 1; i < tracks.length; i++) {
      const prev = tracks[i - 1]
      const curr = tracks[i]
      totalDistance += this.calculateDistance(prev.lat, prev.lng, curr.lat, curr.lng)
      if (curr.speed > maxSpeed) maxSpeed = curr.speed
      if (curr.speed < 5) totalIdleTime += 30
    }

    return {
      waybill_id: waybillId,
      total_distance: Math.round(totalDistance * 100) / 100,
      total_points: tracks.length,
      max_speed: maxSpeed,
      total_idle_time: totalIdleTime,
      start_time: tracks[0].recorded_at,
      end_time: tracks[tracks.length - 1].recorded_at,
      duration: Math.round((new Date(tracks[tracks.length - 1].recorded_at) - new Date(tracks[0].recorded_at)) / 1000 / 60)
    }
  }

  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371
    const dLat = this.deg2rad(lat2 - lat1)
    const dLng = this.deg2rad(lng2 - lng1)
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  deg2rad(deg) {
    return deg * (Math.PI / 180)
  }
}
