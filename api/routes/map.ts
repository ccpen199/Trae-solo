import { Router, type Request, type Response } from 'express'
import { db } from '../db.js'

const router = Router()

interface RegionRow {
  region: string
  factory_count: number
  capacity_utilization: number
  order_volume: number
  supply_demand_ratio: number
  main_crafts: string
  top_suppliers: string
}

function formatRegion(row: RegionRow) {
  return {
    region: row.region,
    factoryCount: row.factory_count,
    capacityUtilization: row.capacity_utilization,
    orderVolume: row.order_volume,
    supplyDemandRatio: row.supply_demand_ratio,
    mainCrafts: JSON.parse(row.main_crafts || '[]'),
    topSuppliers: JSON.parse(row.top_suppliers || '[]'),
  }
}

router.get('/regions', (req: Request, res: Response): void => {
  try {
    const rows = db.prepare('SELECT * FROM region_data').all() as RegionRow[]
    res.json({ success: true, data: rows.map(formatRegion) })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取区域数据失败' })
  }
})

router.get('/heatmap', (req: Request, res: Response): void => {
  try {
    const rows = db.prepare('SELECT * FROM region_data').all() as RegionRow[]

    const maxFactoryCount = Math.max(...rows.map(r => r.factory_count))
    const maxOrderVolume = Math.max(...rows.map(r => r.order_volume))

    const heatmap = rows.map(row => {
      const factoryIntensity = maxFactoryCount > 0 ? row.factory_count / maxFactoryCount : 0
      const orderIntensity = maxOrderVolume > 0 ? row.order_volume / maxOrderVolume : 0
      const heatLevel = Math.round((factoryIntensity * 0.5 + orderIntensity * 0.3 + row.capacity_utilization * 0.2) * 100)

      return {
        region: row.region,
        heatLevel,
        factoryCount: row.factory_count,
        orderVolume: row.order_volume,
        capacityUtilization: row.capacity_utilization,
        supplyDemandRatio: row.supply_demand_ratio,
        mainCrafts: JSON.parse(row.main_crafts || '[]'),
      }
    })

    heatmap.sort((a, b) => b.heatLevel - a.heatLevel)

    res.json({ success: true, data: heatmap })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取热力图数据失败' })
  }
})

export default router
