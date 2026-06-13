import db from '../db/index.js'

export const analyticsService = {
  async getHeatmap(showtimeId: number) {
    const zones = db.prepare('SELECT * FROM zones WHERE showtime_id = ? ORDER BY sort_order').all(showtimeId) as any[]
    const result = []

    for (const zone of zones) {
      const total = (db.prepare('SELECT COUNT(*) as cnt FROM seats WHERE zone_id = ?').get(zone.id) as any).cnt
      const sold = (db.prepare('SELECT COUNT(*) as cnt FROM seats WHERE zone_id = ? AND status = ?').get(zone.id, 'sold') as any).cnt
      const occupancyRate = total > 0 ? Math.round((sold / total) * 100) / 100 : 0

      result.push({
        zoneId: zone.id,
        name: zone.name,
        color: zone.color,
        totalSeats: total,
        soldSeats: sold,
        occupancyRate,
      })
    }

    return { showtimeId, zones: result }
  },

  async getSalesRanking(type: 'zone' | 'event', period?: string) {
    if (type === 'zone') {
      const rows = db
        .prepare(
          'SELECT z.id, z.name, e.title as event_title, COUNT(t.id) as sales, SUM(pt.price) as revenue ' +
            'FROM zones z ' +
            'JOIN seats s ON z.id = s.zone_id ' +
            'JOIN tickets t ON s.id = t.seat_id ' +
            'JOIN pricing_tiers pt ON t.pricing_tier_id = pt.id ' +
            'JOIN showtimes st ON z.showtime_id = st.id ' +
            'JOIN events e ON st.event_id = e.id ' +
            'WHERE t.status != ? ' +
            'GROUP BY z.id ' +
            'ORDER BY sales DESC ' +
            'LIMIT 10'
        )
        .all('refunded')
      return { rankings: rows.map((r: any, i: number) => ({ rank: i + 1, ...r })) }
    } else {
      const rows = db
        .prepare(
          'SELECT e.id, e.title, e.category, COUNT(t.id) as sales, SUM(pt.price) as revenue ' +
            'FROM events e ' +
            'JOIN showtimes st ON e.id = st.event_id ' +
            'JOIN tickets t ON st.id = t.showtime_id ' +
            'JOIN pricing_tiers pt ON t.pricing_tier_id = pt.id ' +
            'WHERE t.status != ? ' +
            'GROUP BY e.id ' +
            'ORDER BY sales DESC ' +
            'LIMIT 10'
        )
        .all('refunded')
      return { rankings: rows.map((r: any, i: number) => ({ rank: i + 1, ...r })) }
    }
  },

  async getRefundAnalysis(period?: string) {
    const categories = ['schedule_change', 'personal', 'health', 'duplicate', 'other']
    const labels = ['日程变更', '个人原因', '健康原因', '重复购票', '其他']
    const colors = ['#e53935', '#1e88e5', '#43a047', '#8e24aa', '#757575']

    const clusters = []
    let totalRefunds = 0

    for (let i = 0; i < categories.length; i++) {
      const count = (db.prepare('SELECT COUNT(*) as cnt FROM refund_records WHERE reason_category = ?').get(categories[i]) as any).cnt
      totalRefunds += count
      clusters.push({
        category: categories[i],
        label: labels[i],
        color: colors[i],
        count,
        percentage: 0,
      })
    }

    clusters.forEach((c) => {
      c.percentage = totalRefunds > 0 ? Math.round((c.count / totalRefunds) * 100) / 100 : 0
    })

    const days = 7
    const timeDistribution = []
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().slice(0, 10)
      const count = (db.prepare("SELECT COUNT(*) as cnt FROM refund_records WHERE DATE(created_at) = ?").get(dateStr) as any).cnt
      timeDistribution.push({
        date: dateStr,
        label: `${date.getMonth() + 1}/${date.getDate()}`,
        count,
      })
    }

    const stats = db.prepare(
      'SELECT COUNT(*) as totalRefunds, SUM(refund_amount) as totalRefundAmount, SUM(fee_amount) as totalFeeAmount FROM refund_records WHERE status = ?'
    ).get('completed') as any

    const totalTickets = (db.prepare('SELECT COUNT(*) as cnt FROM tickets').get() as any).cnt
    const refundRate = totalTickets > 0 ? Math.round((totalRefunds / totalTickets) * 10000) / 10000 : 0
    const avgFeeRate = stats.totalRefundAmount > 0 ? Math.round((stats.totalFeeAmount / stats.totalRefundAmount) * 10000) / 10000 : 0

    return {
      clusters,
      timeDistribution,
      feeStats: {
        totalRefunds: stats.totalRefunds || 0,
        totalRefundAmount: stats.totalRefundAmount || 0,
        totalFeeAmount: stats.totalFeeAmount || 0,
        avgFeeRate,
        refundRate,
      },
    }
  },
}
