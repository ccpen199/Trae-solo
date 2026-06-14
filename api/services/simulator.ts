import db from '../database.js'

interface BroadcastFn {
  (type: string, data: any): void
}

export class Simulator {
  private interval: ReturnType<typeof setInterval> | null = null
  private broadcastFn: BroadcastFn
  private vehicleStopTimers: Map<number, number> = new Map()

  constructor(broadcastFn: BroadcastFn) {
    this.broadcastFn = broadcastFn
  }

  start(): void {
    if (this.interval) return
    this.interval = setInterval(() => this.tick(), 3000)
  }

  stop(): void {
    if (this.interval) {
      clearInterval(this.interval)
      this.interval = null
    }
    this.vehicleStopTimers.clear()
  }

  private tick(): void {
    try {
      const vehicles = db.prepare("SELECT * FROM vehicles WHERE status IN ('online', 'alarm')").all() as any[]
      if (vehicles.length === 0) return
      const updateCount = Math.min(Math.floor(Math.random() * 3) + 1, vehicles.length)
      const shuffled = vehicles.sort(() => Math.random() - 0.5)
      const toUpdate = shuffled.slice(0, updateCount)
      const now = new Date().toISOString()
      const updateVehicle = db.prepare(
        'UPDATE vehicles SET lat=?, lng=?, speed=?, heading=?, last_location_time=? WHERE id=?',
      )
      const insertTrajectory = db.prepare(
        'INSERT INTO trajectory_points (vehicle_id, lat, lng, speed, heading, timestamp) VALUES (?, ?, ?, ?, ?, ?)',
      )
      const insertAlert = db.prepare(
        'INSERT INTO alerts (type, level, vehicle_id, driver_id, lat, lng, status, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      )
      for (const v of toUpdate) {
        const latChange = (Math.random() - 0.5) * 0.001
        const lngChange = (Math.random() - 0.5) * 0.001
        const newLat = Math.round((v.lat + latChange) * 100000) / 100000
        const newLng = Math.round((v.lng + lngChange) * 100000) / 100000
        const speedChange = (Math.random() - 0.5) * 10
        let newSpeed = Math.max(0, Math.round((v.speed + speedChange) * 10) / 10)
        if (Math.random() < 0.05) newSpeed = 0
        const newHeading = Math.round((v.heading + (Math.random() - 0.5) * 20 + 360) % 360)
        updateVehicle.run(newLat, newLng, newSpeed, newHeading, now, v.id)
        insertTrajectory.run(v.id, newLat, newLng, newSpeed, newHeading, now)
        this.broadcastFn('vehicle_update', {
          vehicleId: v.id,
          lat: newLat,
          lng: newLng,
          speed: newSpeed,
          heading: newHeading,
          timestamp: now,
        })
        if (newSpeed > 80) {
          const existingOverspeed = (db.prepare(
            "SELECT COUNT(*) as count FROM alerts WHERE vehicle_id = ? AND type = 'overspeed' AND status = 'pending'",
          ).get(v.id) as any).count
          if (existingOverspeed === 0) {
            insertAlert.run('overspeed', 'critical', v.id, v.driver_id, newLat, newLng, 'pending', now)
            this.broadcastFn('alert', {
              type: 'overspeed',
              level: 'critical',
              vehicleId: v.id,
              lat: newLat,
              lng: newLng,
              timestamp: now,
            })
          }
        }
        if (newSpeed === 0) {
          const current = this.vehicleStopTimers.get(v.id) || 0
          this.vehicleStopTimers.set(v.id, current + 3)
          if (current + 3 >= 300) {
            const existingStop = (db.prepare(
              "SELECT COUNT(*) as count FROM alerts WHERE vehicle_id = ? AND type = 'abnormal_stop' AND status = 'pending'",
            ).get(v.id) as any).count
            if (existingStop === 0) {
              insertAlert.run('abnormal_stop', 'warning', v.id, v.driver_id, newLat, newLng, 'pending', now)
              this.broadcastFn('alert', {
                type: 'abnormal_stop',
                level: 'warning',
                vehicleId: v.id,
                lat: newLat,
                lng: newLng,
                timestamp: now,
              })
            }
            this.vehicleStopTimers.delete(v.id)
          }
        } else {
          this.vehicleStopTimers.delete(v.id)
        }
        this.checkFenceViolation(v.id, newLat, newLng, v.driver_id, now)
      }
    } catch (error) {}
  }

  private checkFenceViolation(vehicleId: number, lat: number, lng: number, driverId: number | null, timestamp: string): void {
    const bindings = db.prepare(
      `SELECT fb.*, f.type as fence_type, f.coordinates, f.radius, f.alert_type, f.enabled
       FROM fence_bindings fb
       JOIN fences f ON fb.fence_id = f.id
       WHERE (fb.vehicle_id = ? OR fb.fleet_id IN (SELECT org_id FROM vehicles WHERE id = ?))
       AND f.enabled = 1`,
    ).all(vehicleId, vehicleId) as any[]
    const insertAlert = db.prepare(
      'INSERT INTO alerts (type, level, vehicle_id, driver_id, lat, lng, status, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    )
    for (const binding of bindings) {
      const coords = JSON.parse(binding.coordinates)
      let isInside = false
      if (binding.fence_type === 'circle') {
        const center = coords[0]
        const dist = Math.sqrt(Math.pow(lat - center.lat, 2) + Math.pow(lng - center.lng, 2)) * 111000
        isInside = dist <= binding.radius
      } else if (binding.fence_type === 'polygon') {
        isInside = this.pointInPolygon(lat, lng, coords)
      }
      const shouldAlert =
        (binding.alert_type === 'exit' && !isInside) ||
        (binding.alert_type === 'enter' && isInside) ||
        (binding.alert_type === 'both')
      if (shouldAlert && Math.random() < 0.02) {
        const existing = (db.prepare(
          "SELECT COUNT(*) as count FROM alerts WHERE vehicle_id = ? AND type = 'fence_violation' AND status = 'pending'",
        ).get(vehicleId) as any).count
        if (existing === 0) {
          insertAlert.run('fence_violation', 'critical', vehicleId, driverId, lat, lng, 'pending', timestamp)
          this.broadcastFn('alert', {
            type: 'fence_violation',
            level: 'critical',
            vehicleId,
            lat,
            lng,
            timestamp,
          })
        }
      }
    }
  }

  private pointInPolygon(lat: number, lng: number, polygon: { lat: number; lng: number }[]): boolean {
    let inside = false
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].lat, yi = polygon[i].lng
      const xj = polygon[j].lat, yj = polygon[j].lng
      const intersect = ((yi > lng) !== (yj > lng)) && (lat < (xj - xi) * (lng - yi) / (yj - yi) + xi)
      if (intersect) inside = !inside
    }
    return inside
  }
}
