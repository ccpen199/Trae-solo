import express from 'express';
import db from '../database.js';

const router = express.Router();

router.get('/stats', (req, res) => {
  const totalLots = db.prepare('SELECT COUNT(*) as count FROM parking_lots').get().count;
  const totalSpots = db.prepare('SELECT SUM(total_spots) as count FROM parking_lots').get().count || 0;
  const availableSpots = db.prepare("SELECT COUNT(*) as count FROM spot_status WHERE status = 'available'").get().count;
  const occupiedSpots = db.prepare("SELECT COUNT(*) as count FROM spot_status WHERE status = 'occupied'").get().count;
  
  const todayRecords = db.prepare(`
    SELECT COUNT(*) as count FROM entry_exit_records 
    WHERE DATE(entry_time) = DATE('now')
  `).get().count;
  
  const todayRevenue = db.prepare(`
    SELECT SUM(fee) as total FROM entry_exit_records 
    WHERE DATE(exit_time) = DATE('now') AND payment_status = 'paid'
  `).get().total || 0;
  
  const totalClicks = db.prepare('SELECT COUNT(*) as count FROM guidance_clicks').get().count;
  const arrivedClicks = db.prepare('SELECT COUNT(*) as count FROM guidance_clicks WHERE arrived = 1').get().count;
  const conversionRate = totalClicks > 0 ? ((arrivedClicks / totalClicks) * 100).toFixed(1) : 0;
  
  const offlineDevices = db.prepare("SELECT COUNT(*) as count FROM parking_lots WHERE device_status != 'online'").get().count;
  
  const turnoverRate = totalSpots > 0 ? ((todayRecords / totalSpots) * 100).toFixed(1) : 0;
  
  res.json({
    total_lots: totalLots,
    total_spots: totalSpots,
    available_spots: availableSpots,
    occupied_spots: occupiedSpots,
    today_records: todayRecords,
    today_revenue: todayRevenue,
    total_clicks: totalClicks,
    arrived_clicks: arrivedClicks,
    conversion_rate: conversionRate,
    offline_devices: offlineDevices,
    turnover_rate: turnoverRate
  });
});

router.get('/parking-lots', (req, res) => {
  const lots = db.prepare(`
    SELECT p.*,
      (SELECT COUNT(*) FROM spot_status s WHERE s.parking_lot_id = p.id AND s.status = 'available') as available,
      (SELECT COUNT(*) FROM spot_status s WHERE s.parking_lot_id = p.id AND s.status = 'occupied') as occupied,
      (SELECT COUNT(*) FROM guidance_clicks c WHERE c.parking_lot_id = p.id) as clicks,
      (SELECT COUNT(*) FROM guidance_clicks c WHERE c.parking_lot_id = p.id AND c.arrived = 1) as arrived
    FROM parking_lots p
    ORDER BY p.id
  `).all();
  
  res.json(lots);
});

router.get('/hourly-traffic', (req, res) => {
  const data = db.prepare(`
    SELECT 
      strftime('%H', entry_time) as hour,
      COUNT(*) as entries
    FROM entry_exit_records
    WHERE entry_time >= datetime('now', '-24 hours')
    GROUP BY strftime('%H', entry_time)
    ORDER BY hour
  `).all();
  
  const result = [];
  for (let i = 0; i < 24; i++) {
    const hour = String(i).padStart(2, '0');
    const found = data.find(d => d.hour === hour);
    result.push({ hour: `${hour}:00`, entries: found ? found.entries : 0 });
  }
  res.json(result);
});

router.get('/device-status', (req, res) => {
  const logs = db.prepare(`
    SELECT d.*, p.name as parking_lot_name
    FROM device_status_logs d
    LEFT JOIN parking_lots p ON d.parking_lot_id = p.id
    ORDER BY d.logged_at DESC
    LIMIT 50
  `).all();
  res.json(logs);
});

export default router;
