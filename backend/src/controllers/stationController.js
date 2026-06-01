const db = require('../models/database');

const stationController = {
  getAllStations: (req, res) => {
    try {
      const stations = db.prepare('SELECT * FROM stations').all();
      
      const stationsWithStats = stations.map(station => {
        const spotStats = db.prepare(`
          SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) as available,
            SUM(CASE WHEN status = 'occupied' THEN 1 ELSE 0 END) as occupied,
            SUM(CASE WHEN has_charging = 1 THEN 1 ELSE 0 END) as charging_spots
          FROM parking_spots WHERE station_id = ?
        `).get(station.id);

        const gunStats = db.prepare(`
          SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN status = 'idle' THEN 1 ELSE 0 END) as idle,
            SUM(CASE WHEN status = 'charging' THEN 1 ELSE 0 END) as charging,
            SUM(CASE WHEN status = 'offline' THEN 1 ELSE 0 END) as offline
          FROM charging_guns WHERE station_id = ?
        `).get(station.id);

        const alerts = db.prepare(`
          SELECT COUNT(*) as count FROM alerts 
          WHERE station_id = ? AND is_resolved = 0
        `).get(station.id);

        return {
          ...station,
          spotStats,
          gunStats,
          activeAlerts: alerts.count
        };
      });

      res.json({ success: true, data: stationsWithStats });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  getStationDetail: (req, res) => {
    try {
      const { id } = req.params;
      const station = db.prepare('SELECT * FROM stations WHERE id = ?').get(id);
      
      if (!station) {
        return res.status(404).json({ success: false, message: 'Station not found' });
      }

      const spots = db.prepare(`
        SELECT ps.*, cg.gun_number, cg.status as gun_status, cg.power, cg.price_per_kwh
        FROM parking_spots ps
        LEFT JOIN charging_guns cg ON ps.gun_id = cg.id
        WHERE ps.station_id = ?
        ORDER BY ps.spot_number
      `).all(id);

      const guns = db.prepare('SELECT * FROM charging_guns WHERE station_id = ?').all(id);
      const devices = db.prepare('SELECT * FROM devices WHERE station_id = ?').all(id);

      res.json({
        success: true,
        data: { station, spots, guns, devices }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  getStationMap: (req, res) => {
    try {
      const { id } = req.params;
      
      const spots = db.prepare(`
        SELECT 
          ps.id, ps.spot_number, ps.type, ps.status, ps.has_charging,
          cg.id as gun_id, cg.gun_number, cg.status as gun_status, 
          cg.power, cg.price_per_kwh, ps.price_per_hour
        FROM parking_spots ps
        LEFT JOIN charging_guns cg ON ps.id = cg.spot_id
        WHERE ps.station_id = ?
        ORDER BY ps.spot_number
      `).all(id);

      const normalSpots = db.prepare(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) as available,
          SUM(CASE WHEN status = 'occupied' THEN 1 ELSE 0 END) as occupied,
          SUM(CASE WHEN status = 'reserved' THEN 1 ELSE 0 END) as reserved,
          AVG(price_per_hour) as avg_price
        FROM parking_spots WHERE station_id = ? AND type = 'normal'
      `).get(id);

      const chargingSpots = db.prepare(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) as available,
          SUM(CASE WHEN status = 'occupied' THEN 1 ELSE 0 END) as occupied,
          SUM(CASE WHEN status = 'reserved' THEN 1 ELSE 0 END) as reserved,
          AVG(price_per_hour) as avg_parking_price
        FROM parking_spots WHERE station_id = ? AND type = 'charging'
      `).get(id);

      const gunsByStatus = db.prepare(`
        SELECT 
          status, COUNT(*) as count,
          MIN(price_per_kwh) as min_price,
          MAX(price_per_kwh) as max_price
        FROM charging_guns WHERE station_id = ?
        GROUP BY status
      `).all(id);

      const gunPriceStats = db.prepare(`
        SELECT 
          MIN(price_per_kwh) as min_price,
          MAX(price_per_kwh) as max_price,
          AVG(price_per_kwh) as avg_price
        FROM charging_guns WHERE station_id = ?
      `).get(id);

      const alerts = db.prepare(`
        SELECT 
          a.*, d.device_name, d.device_type,
          CASE WHEN a.is_resolved = 0 THEN '未处理' ELSE '已处理' END as status_text
        FROM alerts a
        LEFT JOIN devices d ON a.device_id = d.id
        WHERE a.station_id = ?
        ORDER BY a.created_at DESC
        LIMIT 10
      `).all(id);

      const deviceStats = db.prepare(`
        SELECT 
          device_type,
          COUNT(*) as total,
          SUM(CASE WHEN status = 'online' THEN 1 ELSE 0 END) as online,
          SUM(CASE WHEN status = 'offline' THEN 1 ELSE 0 END) as offline,
          SUM(CASE WHEN status = 'fault' THEN 1 ELSE 0 END) as fault
        FROM devices WHERE station_id = ?
        GROUP BY device_type
      `).all(id);

      const stats = db.prepare(`
        SELECT 
          (SELECT COUNT(*) FROM parking_spots WHERE station_id = ? AND status = 'available') as available_spots,
          (SELECT COUNT(*) FROM parking_spots WHERE station_id = ? AND status = 'occupied') as occupied_spots,
          (SELECT COUNT(*) FROM charging_guns WHERE station_id = ? AND status = 'idle') as idle_guns,
          (SELECT COUNT(*) FROM charging_guns WHERE station_id = ? AND status = 'charging') as charging_guns,
          (SELECT COUNT(*) FROM charging_guns WHERE station_id = ? AND status = 'offline') as offline_guns
      `).get(id, id, id, id, id);

      const station = db.prepare('SELECT * FROM stations WHERE id = ?').get(id);

      res.json({ 
        success: true, 
        data: { 
          station,
          spots, 
          stats,
          normalSpots,
          chargingSpots,
          gunsByStatus,
          gunPriceStats,
          alerts,
          deviceStats
        } 
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

module.exports = stationController;