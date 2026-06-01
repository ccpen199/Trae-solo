const express = require('express')
const { db } = require('../database')
const router = express.Router()

router.get('/', (req, res) => {
  const { zone_id, status } = req.query
  let sql = `
    SELECT l.*,
           tz.name as zone_name,
           tz.min_temp,
           tz.max_temp,
           (SELECT SUM(available_quantity) FROM inventory WHERE location_id = l.id) as current_quantity
    FROM locations l
    JOIN temperature_zones tz ON l.temperature_zone_id = tz.id
    WHERE 1=1
  `
  const params = []
  if (zone_id) {
    sql += ' AND l.temperature_zone_id = ?'
    params.push(zone_id)
  }
  if (status) {
    sql += ' AND l.status = ?'
    params.push(status)
  }
  sql += ' ORDER BY l.code'
  const locations = db.prepare(sql).all(...params)
  res.json(locations)
})

router.get('/:id', (req, res) => {
  const location = db.prepare(`
    SELECT l.*, tz.name as zone_name
    FROM locations l
    JOIN temperature_zones tz ON l.temperature_zone_id = tz.id
    WHERE l.id = ?
  `).get(req.params.id)
  if (!location) return res.status(404).json({ error: '库位不存在' })
  res.json(location)
})

module.exports = router
