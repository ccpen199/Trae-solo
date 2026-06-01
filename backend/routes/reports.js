const express = require('express')
const db = require('../db')
const { successResponse, errorResponse } = require('../utils')
const { Parser } = require('json2csv')

const router = express.Router()

router.get('/summary', (req, res) => {
  const disasterStats = db.prepare(`
    SELECT
      report_type,
      status,
      COUNT(*) as count,
      SUM(deaths) as total_deaths,
      SUM(injuries) as total_injuries,
      SUM(missing) as total_missing,
      SUM(trapped) as total_trapped,
      SUM(buildings_destroyed) as total_buildings_destroyed,
      SUM(buildings_damaged) as total_buildings_damaged
    FROM disaster_reports
    GROUP BY report_type, status
  `).all()

  const byLocation = db.prepare(`
    SELECT
      location,
      COUNT(*) as report_count,
      SUM(deaths) as total_deaths,
      SUM(injuries) as total_injuries,
      SUM(buildings_destroyed) as total_buildings_destroyed
    FROM disaster_reports
    GROUP BY location
    ORDER BY report_count DESC
    LIMIT 20
  `).all()

  const missionStats = db.prepare(`
    SELECT
      status,
      COUNT(*) as count,
      priority
    FROM missions
    GROUP BY status, priority
  `).all()

  const teamStats = db.prepare(`
    SELECT
      status,
      COUNT(*) as count,
      SUM(person_count) as total_persons
    FROM rescue_teams
    GROUP BY status
  `).all()

  const materialStats = db.prepare(`
    SELECT
      i.category,
      COUNT(DISTINCT d.id) as demand_count,
      SUM(d.quantity) as total_demand,
      SUM(d.allocated_quantity) as total_allocated,
      SUM(i.total_stock) as total_stock
    FROM material_demands d
    LEFT JOIN material_items i ON d.item_id = i.id
    GROUP BY i.category
  `).all()

  const allocationStats = db.prepare(`
    SELECT
      status,
      COUNT(*) as count,
      SUM(quantity) as total_quantity
    FROM material_allocations
    GROUP BY status
  `).all()

  successResponse(res, {
    disasterStats,
    byLocation,
    missionStats,
    teamStats,
    materialStats,
    allocationStats,
    generatedAt: new Date().toISOString()
  })
})

router.get('/disasters/by-type', (req, res) => {
  const { start_date, end_date } = req.query
  let whereSql = []
  let params = []

  if (start_date) {
    whereSql.push('created_at >= ?')
    params.push(start_date)
  }
  if (end_date) {
    whereSql.push('created_at <= ?')
    params.push(end_date)
  }
  const whereClause = whereSql.length > 0 ? `WHERE ${whereSql.join(' AND ')}` : ''

  const list = db.prepare(`
    SELECT
      report_type,
      status,
      COUNT(*) as count,
      SUM(deaths) as total_deaths,
      SUM(injuries) as total_injuries,
      SUM(missing) as total_missing,
      SUM(trapped) as total_trapped
    FROM disaster_reports
    ${whereClause}
    GROUP BY report_type, status
    ORDER BY count DESC
  `).all(...params)

  successResponse(res, list)
})

router.get('/disasters/by-progress', (req, res) => {
  const list = db.prepare(`
    SELECT
      status,
      COUNT(*) as count,
      SUM(deaths) as total_deaths,
      SUM(injuries) as total_injuries
    FROM disaster_reports
    GROUP BY status
  `).all()

  successResponse(res, list)
})

router.get('/resources/overview', (req, res) => {
  const teams = db.prepare(`
    SELECT
      status,
      COUNT(*) as team_count,
      SUM(person_count) as person_count
    FROM rescue_teams
    GROUP BY status
  `).all()

  const vehicles = db.prepare(`
    SELECT
      status,
      COUNT(*) as count
    FROM vehicles
    GROUP BY status
  `).all()

  const missions = db.prepare(`
    SELECT
      status,
      COUNT(*) as count
    FROM missions
    GROUP BY status
  `).all()

  const materials = db.prepare(`
    SELECT
      category,
      COUNT(*) as item_count,
      SUM(total_stock) as total_stock
    FROM material_items
    GROUP BY category
  `).all()

  successResponse(res, {
    teams,
    vehicles,
    missions,
    materials,
    generatedAt: new Date().toISOString()
  })
})

router.get('/export/briefing', (req, res) => {
  const { format = 'json' } = req.query

  const latestEarthquake = db.prepare(`
    SELECT * FROM earthquakes ORDER BY occurred_at DESC LIMIT 1
  `).get()

  const disasterSummary = db.prepare(`
    SELECT
      report_type,
      COUNT(*) as report_count,
      SUM(deaths) as total_deaths,
      SUM(injuries) as total_injuries,
      SUM(missing) as total_missing,
      SUM(trapped) as total_trapped,
      SUM(buildings_destroyed) as buildings_destroyed,
      SUM(buildings_damaged) as buildings_damaged
    FROM disaster_reports
    GROUP BY report_type
  `).all()

  const missionSummary = db.prepare(`
    SELECT
      status,
      COUNT(*) as count
    FROM missions
    GROUP BY status
  `).all()

  const resourceSummary = db.prepare(`
    SELECT
      'teams' as type,
      status,
      COUNT(*) as count,
      SUM(person_count) as total
    FROM rescue_teams
    GROUP BY status
    UNION ALL
    SELECT
      'vehicles' as type,
      status,
      COUNT(*) as count,
      NULL as total
    FROM vehicles
    GROUP BY status
  `).all()

  const materialGaps = db.prepare(`
    SELECT
      i.item_name,
      i.category,
      i.unit,
      d.quantity as demanded,
      d.allocated_quantity as allocated,
      (d.quantity - d.allocated_quantity) as gap,
      d.demand_location,
      d.urgency
    FROM material_demands d
    LEFT JOIN material_items i ON d.item_id = i.id
    WHERE d.status IN ('pending', 'partial')
      AND (d.quantity - d.allocated_quantity) > 0
    ORDER BY d.urgency = 'urgent' DESC, gap DESC
  `).all()

  const briefing = {
    title: '地震应急指挥阶段简报',
    generatedAt: new Date().toISOString(),
    period: '截至当前',
    earthquake: latestEarthquake || null,
    disasterSummary,
    missionSummary,
    resourceSummary,
    materialGaps,
    notes: [
      '本简报由系统自动生成',
      '数据来源于各模块实时上报',
      '物资缺口需优先调度'
    ]
  }

  if (format === 'csv') {
    try {
      const disasterFields = ['report_type', 'report_count', 'total_deaths', 'total_injuries', 'total_missing', 'total_trapped', 'buildings_destroyed', 'buildings_damaged']
      const disasterParser = new Parser({ fields: disasterFields })
      const disasterCsv = disasterParser.parse(disasterSummary)

      const gapFields = ['item_name', 'category', 'unit', 'demanded', 'allocated', 'gap', 'demand_location', 'urgency']
      const gapParser = new Parser({ fields: gapFields })
      const gapCsv = gapParser.parse(materialGaps)

      const fullCsv = `=== 地震应急指挥阶段简报 ===\n生成时间: ${briefing.generatedAt}\n\n=== 灾情汇总 ===\n${disasterCsv}\n\n=== 物资缺口 ===\n${gapCsv}`

      res.setHeader('Content-Type', 'text/csv; charset=utf-8')
      res.setHeader('Content-Disposition', `attachment; filename="briefing_${Date.now()}.csv"`)
      res.send('\ufeff' + fullCsv)
    } catch (err) {
      errorResponse(res, 'CSV导出失败: ' + err.message)
    }
  } else {
    successResponse(res, briefing)
  }
})

router.get('/logs', (req, res) => {
  const { page = 1, pageSize = 20, module } = req.query
  const offset = (page - 1) * pageSize

  let whereSql = []
  let params = []
  if (module) {
    whereSql.push('module = ?')
    params.push(module)
  }
  const whereClause = whereSql.length > 0 ? `WHERE ${whereSql.join(' AND ')}` : ''

  const total = db.prepare(`SELECT COUNT(*) as count FROM operation_logs ${whereClause}`).get(...params).count
  const list = db.prepare(`
    SELECT * FROM operation_logs
    ${whereClause}
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, pageSize, offset)

  successResponse(res, { list, total, page: parseInt(page), pageSize: parseInt(pageSize) })
})

module.exports = router
