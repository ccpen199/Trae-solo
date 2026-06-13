import db from '../db/index.js'
import type { Showtime, Zone, Seat, PricingTier } from '../../shared/types.js'

export const showtimeService = {
  async detail(id: number) {
    const showtime = db.prepare('SELECT * FROM showtimes WHERE id = ?').get(id) as Showtime | undefined
    if (!showtime) throw new Error('场次不存在')
    const zones = db.prepare('SELECT * FROM zones WHERE showtime_id = ? ORDER BY sort_order').all(id) as Zone[]
    const pricingTiers = db.prepare('SELECT * FROM pricing_tiers WHERE showtime_id = ? ORDER BY price').all(id) as PricingTier[]
    return { showtime, zones, pricingTiers }
  },

  async getSeats(showtimeId: number) {
    const zones = db.prepare('SELECT * FROM zones WHERE showtime_id = ? ORDER BY sort_order').all(showtimeId) as Zone[]
    const seatsMap: Record<number, Seat[][]> = {}

    for (const zone of zones) {
      const seats = db.prepare('SELECT * FROM seats WHERE zone_id = ? ORDER BY row_num, col_num').all(zone.id) as Seat[]
      const grid: Seat[][] = []
      for (let r = 1; r <= zone.rows; r++) {
        const row = seats.filter((s) => s.rowNum === r)
        if (row.length > 0) grid.push(row)
      }
      seatsMap[zone.id] = grid
    }
    return { zones, seatsMap }
  },

  async selectSeats(showtimeId: number, seatIds: number[], userId: number) {
    const now = Date.now()
    const updateStmt = db.prepare('UPDATE seats SET status = ? WHERE id = ? AND status = ?')
    let success = true

    for (const seatId of seatIds) {
      const result = updateStmt.run('held', seatId, 'available')
      if (result.changes === 0) {
        success = false
        break
      }
    }

    if (!success) {
      db.prepare('UPDATE seats SET status = ? WHERE id = ? AND status = ?').run('available', -1, 'held')
      throw new Error('部分座位已被锁定')
    }

    return { held: true, holdId: `hold_${userId}_${showtimeId}_${now}` }
  },

  async create(data: {
    eventId: number
    startTime: string
    saleStartTime: string
    presaleStartTime?: string
    zones: { name: string; color: string; rows: number; cols: number; sortOrder: number }[]
    pricingTiers: { name: string; tierType: string; price: number; quota: number; validFrom?: string; validTo?: string }[]
  }) {
    const tx = db.transaction(() => {
      const showResult = db
        .prepare('INSERT INTO showtimes (event_id, start_time, sale_start_time, presale_start_time, total_seats, available_seats, status) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .run(data.eventId, data.startTime, data.saleStartTime, data.presaleStartTime || null, 0, 0, 'upcoming')
      const showtimeId = Number(showResult.lastInsertRowid)

      let totalSeats = 0
      data.zones.forEach((zone) => {
        const zoneResult = db
          .prepare('INSERT INTO zones (showtime_id, name, color, rows, cols, seat_layout, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)')
          .run(showtimeId, zone.name, zone.color, zone.rows, zone.cols, 'normal', zone.sortOrder)
        const zoneId = Number(zoneResult.lastInsertRowid)

        for (let r = 1; r <= zone.rows; r++) {
          for (let c = 1; c <= zone.cols; c++) {
            const label = `${String.fromCharCode(64 + r)}${c}`
            db.prepare('INSERT INTO seats (zone_id, row_num, col_num, seat_label, status, showtime_id) VALUES (?, ?, ?, ?, ?, ?)').run(
              zoneId,
              r,
              c,
              label,
              'available',
              showtimeId
            )
            totalSeats++
          }
        }
      })

      data.pricingTiers.forEach((tier) => {
        db.prepare('INSERT INTO pricing_tiers (showtime_id, name, tier_type, price, valid_from, valid_to, quota, sold) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(
          showtimeId,
          tier.name,
          tier.tierType,
          tier.price,
          tier.validFrom || null,
          tier.validTo || null,
          tier.quota,
          0
        )
      })

      db.prepare('UPDATE showtimes SET total_seats = ?, available_seats = ? WHERE id = ?').run(totalSeats, totalSeats, showtimeId)
      return showtimeId
    })

    const showtimeId = tx()
    return { showtime: db.prepare('SELECT * FROM showtimes WHERE id = ?').get(showtimeId) as Showtime }
  },
}
