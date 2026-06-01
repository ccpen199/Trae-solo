const express = require('express')
const db = require('../database/init')
const { authMiddleware } = require('../middleware/auth')

const router = express.Router()

router.get('/poi/search', (req, res) => {
  const { keyword, business_domain, lat, lng, radius = 5000 } = req.query
  
  let query = `
    SELECT m.*, 
           (CASE WHEN ? AND ? THEN 
             6371 * acos(cos(radians(?)) * cos(radians(latitude)) * cos(radians(longitude) - radians(?)) + sin(radians(?)) * sin(radians(latitude)))
            ELSE NULL END) as distance
    FROM merchants m
    WHERE status = ?
  `
  const params = [lat, lng, lat, lng, lat, 'approved']
  
  if (keyword) {
    query += ' AND (name LIKE ? OR description LIKE ? OR address LIKE ?)'
    const keywordPattern = `%${keyword}%`
    params.push(keywordPattern, keywordPattern, keywordPattern)
  }
  
  if (business_domain) {
    query += ' AND business_domain = ?'
    params.push(business_domain)
  }
  
  query += ' ORDER BY distance ASC NULLS LAST, id DESC LIMIT 50'
  
  const pois = db.prepare(query).all(...params)
  
  res.json(pois)
})

router.get('/geocode', (req, res) => {
  const { address } = req.query
  
  const merchants = db.prepare('SELECT * FROM merchants WHERE address LIKE ? AND status = ? LIMIT 10').all(`%${address}%`, 'approved')
  
  const results = merchants.map(m => ({
    name: m.name,
    address: m.address,
    latitude: m.latitude,
    longitude: m.longitude,
    business_domain: m.business_domain
  }))
  
  res.json(results)
})

router.get('/reverse', (req, res) => {
  const { lat, lng } = req.query
  
  if (!lat || !lng) {
    return res.status(400).json({ error: '经纬度不能为空' })
  }
  
  const nearest = db.prepare(`
    SELECT *, 
           6371 * acos(cos(radians(?)) * cos(radians(latitude)) * cos(radians(longitude) - radians(?)) + sin(radians(?)) * sin(radians(latitude))) as distance
    FROM merchants
    WHERE status = ? AND latitude IS NOT NULL AND longitude IS NOT NULL
    ORDER BY distance ASC
    LIMIT 1
  `).get(lat, lng, lat, 'approved')
  
  if (nearest) {
    res.json({
      address: nearest.address,
      name: nearest.name,
      business_domain: nearest.business_domain,
      distance: nearest.distance
    })
  } else {
    res.json({ address: '未知位置' })
  }
})

router.get('/route', (req, res) => {
  const { origin_lat, origin_lng, dest_lat, dest_lng } = req.query
  
  if (!origin_lat || !origin_lng || !dest_lat || !dest_lng) {
    return res.status(400).json({ error: '起点和终点经纬度不能为空' })
  }
  
  const distance = 6371 * Math.acos(
    Math.cos(parseFloat(origin_lat) * Math.PI / 180) * 
    Math.cos(parseFloat(dest_lat) * Math.PI / 180) * 
    Math.cos(parseFloat(dest_lng) * Math.PI / 180 - parseFloat(origin_lng) * Math.PI / 180) + 
    Math.sin(parseFloat(origin_lat) * Math.PI / 180) * 
    Math.sin(parseFloat(dest_lat) * Math.PI / 180)
  )
  
  const duration = distance / 30 * 60
  
  res.json({
    distance: distance.toFixed(2),
    duration: Math.ceil(duration),
    unit: 'km'
  })
})

router.get('/lbs/recommend', authMiddleware, (req, res) => {
  const { lat, lng, business_domain, limit = 10 } = req.query
  
  let query = `
    SELECT m.*,
           (CASE WHEN ? AND ? THEN 
             6371 * acos(cos(radians(?)) * cos(radians(latitude)) * cos(radians(longitude) - radians(?)) + sin(radians(?)) * sin(radians(latitude)))
            ELSE NULL END) as distance
    FROM merchants m
    WHERE status = ?
  `
  const params = [lat, lng, lat, lng, lat, 'approved']
  
  if (business_domain) {
    query += ' AND business_domain = ?'
    params.push(business_domain)
  }
  
  query += ' ORDER BY distance ASC NULLS LAST, id DESC LIMIT ?'
  params.push(parseInt(limit))
  
  const recommendations = db.prepare(query).all(...params)
  
  res.json(recommendations)
})

module.exports = router
