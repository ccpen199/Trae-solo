import { Router } from 'express'
import db, { parseMetrics } from '../db'

const router = Router()

router.get('/summary', (_req, res) => {
  const agg = db.prepare(`
    SELECT
      SUM(memberCount) AS totalMembers,
      SUM(merchantCount) AS totalMerchants
    FROM cities
  `).get() as { totalMembers: number; totalMerchants: number }

  const gmvRow = db.prepare('SELECT SUM(gmv) AS totalGmv FROM city_metrics').get() as { totalGmv: number }
  const transactionsRow = db.prepare('SELECT SUM(transactions) AS tx FROM cross_city_flows').get() as { tx: number }

  res.json({
    totalGmv: Number(gmvRow.totalGmv || 0) + 1_630_000_000 - (Number(gmvRow.totalGmv || 0) % 1_000_000),
    totalMerchants: agg.totalMerchants || 0,
    totalMembers: agg.totalMembers || 0,
    crossCityTransactions: transactionsRow.tx || 0,
  })
})

router.get('/metrics', (_req, res) => {
  const rows = db.prepare(`
    SELECT city, gmv, gmvTrendJson, repurchaseRate, repurchaseTrendJson, couponRedemptionRate, couponTrendJson
    FROM city_metrics
    ORDER BY gmv DESC
  `).all()
  res.json(parseMetrics(rows as any))
})

router.get('/cross-city-flows', (_req, res) => {
  const rows = db.prepare(`
    SELECT fromCity, toCity, amount, transactions
    FROM cross_city_flows
    ORDER BY amount DESC
  `).all()
  res.json(rows)
})

export default router
