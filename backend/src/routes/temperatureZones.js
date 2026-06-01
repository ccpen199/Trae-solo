const express = require('express')
const { db } = require('../database')
const router = express.Router()

router.get('/', (req, res) => {
  const zones = db.prepare(`
    SELECT tz.*,
           (SELECT COUNT(*) FROM locations WHERE temperature_zone_id = tz.id) as location_count,
           (SELECT COUNT(*) FROM products WHERE temperature_zone_id = tz.id) as product_count
    FROM temperature_zones tz
    ORDER BY tz.id
  `).all()
  res.json(zones)
})

router.get('/:id', (req, res) => {
  const zone = db.prepare('SELECT * FROM temperature_zones WHERE id = ?').get(req.params.id)
  if (!zone) return res.status(404).json({ error: '温区不存在' })
  res.json(zone)
})

module.exports = router
