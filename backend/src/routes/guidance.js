import express from 'express';
import db from '../database.js';

const router = express.Router();

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

router.post('/recommend', (req, res) => {
  const { user_lat, user_lng, preferences = {}, restrictions = {} } = req.body;
  
  const lots = db.prepare('SELECT * FROM parking_lots WHERE device_status = ?').all('online');
  const spotStats = db.prepare(`
    SELECT parking_lot_id,
      SUM(CASE WHEN status = 'available' AND is_trusted = 1 THEN 1 ELSE 0 END) as available
    FROM spot_status
    GROUP BY parking_lot_id
  `).all();
  
  const spotMap = Object.fromEntries(spotStats.map(s => [s.parking_lot_id, s.available]));
  
  const weighted = lots.map(lot => {
    const distance = calculateDistance(user_lat || 39.9, user_lng || 116.4, lot.latitude, lot.longitude);
    const available = spotMap[lot.id] || 0;
    
    let score = 0;
    const distWeight = preferences.distance_weight || 0.3;
    const spotWeight = preferences.spot_weight || 0.3;
    const priceWeight = preferences.price_weight || 0.2;
    
    score += (1 - Math.min(distance / 5, 1)) * distWeight * 100;
    score += Math.min(available / 10, 1) * spotWeight * 100;
    score += (1 - Math.min(lot.price_per_hour / 20, 1)) * priceWeight * 100;
    
    return {
      ...lot,
      distance: distance.toFixed(2),
      available_spots: available,
      score: score.toFixed(1)
    };
  });
  
  weighted.sort((a, b) => b.score - a.score);
  
  res.json(weighted.slice(0, 5));
});

router.post('/click', (req, res) => {
  const { parking_lot_id, user_session } = req.body;
  db.prepare('INSERT INTO guidance_clicks (parking_lot_id, user_session) VALUES (?, ?)')
    .run(parking_lot_id, user_session || 'anonymous');
  res.json({ success: true });
});

router.post('/arrive', (req, res) => {
  const { parking_lot_id, user_session } = req.body;
  db.prepare('UPDATE guidance_clicks SET arrived = 1 WHERE parking_lot_id = ? AND user_session = ? ORDER BY clicked_at DESC LIMIT 1')
    .run(parking_lot_id, user_session || 'anonymous');
  res.json({ success: true });
});

export default router;
