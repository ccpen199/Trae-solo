const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

module.exports = (db, authService, rulesEngine) => {
  const authMiddleware = (req, res, next) => {
    authService.middleware(req, res, next);
  };

  router.get('/vehicles', authMiddleware, (req, res) => {
    try {
      const { status, route_id } = req.query;

      let query = `
        SELECT 
          v.*,
          s.schedule_id,
          s.route_id,
          r.route_name,
          mo.main_order_no,
          mo.current_status as order_status
        FROM vehicles v
        LEFT JOIN schedules s ON v.vehicle_id = s.vehicle_id AND s.status NOT IN ('completed', 'cancelled')
        LEFT JOIN routes r ON s.route_id = r.route_id
        LEFT JOIN main_orders mo ON s.schedule_id = mo.schedule_id AND mo.current_status NOT IN ('completed', 'cancelled', 'rejected')
        WHERE 1=1
      `;
      let params = [];

      if (status) {
        query += ' AND v.status = ?';
        params.push(status);
      }

      if (route_id) {
        query += ' AND s.route_id = ?';
        params.push(route_id);
      }

      const vehicles = db.prepare(query).all(...params);

      const vehiclesWithTrack = vehicles.map(vehicle => {
        const lastTrack = db.prepare(`
          SELECT * FROM vehicle_tracks 
          WHERE vehicle_id = ? 
          ORDER BY track_time DESC 
          LIMIT 1
        `).get(vehicle.vehicle_id);

        return {
          ...vehicle,
          last_track: lastTrack,
          state_info: vehicle.order_status ? {
            label: vehicle.order_status,
            color: '#67C23A'
          } : {
            label: vehicle.status,
            color: vehicle.status === 'idle' ? '#909399' : '#67C23A'
          }
        };
      });

      res.json(vehiclesWithTrack);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/track', authMiddleware, (req, res) => {
    try {
      const { vehicle_id, main_order_no, latitude, longitude, speed, direction, track_time } = req.body;

      if (!vehicle_id || latitude === undefined || longitude === undefined) {
        return res.status(400).json({ error: '缺少必要参数' });
      }

      const vehicle = db.prepare('SELECT * FROM vehicles WHERE vehicle_id = ?').get(vehicle_id);
      if (!vehicle) {
        return res.status(404).json({ error: '车辆不存在' });
      }

      const previousTrack = db.prepare(`
        SELECT * FROM vehicle_tracks 
        WHERE vehicle_id = ? 
        ORDER BY track_time DESC 
        LIMIT 1
      `).get(vehicle_id);

      let route = null;
      if (main_order_no) {
        const order = db.prepare(`
          SELECT r.* FROM main_orders mo
          LEFT JOIN routes r ON mo.route_id = r.route_id
          WHERE mo.main_order_no = ?
        `).get(main_order_no);
        route = order;
      }

      const currentTrack = {
        latitude,
        longitude,
        track_time: track_time || new Date().toISOString()
      };

      const anomalies = rulesEngine.detectAnomaly(currentTrack, previousTrack, route);

      const trackId = uuidv4();
      const isAnomaly = anomalies.length > 0 ? 1 : 0;
      const anomalyType = anomalies.length > 0 ? anomalies[0].type : null;

      const insertTrack = db.prepare(`
        INSERT INTO vehicle_tracks (track_id, vehicle_id, main_order_no, latitude, longitude, speed, direction, track_time, is_anomaly, anomaly_type)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      insertTrack.run(
        trackId,
        vehicle_id,
        main_order_no,
        latitude,
        longitude,
        speed,
        direction,
        currentTrack.track_time,
        isAnomaly,
        anomalyType
      );

      db.prepare(`
        UPDATE vehicles 
        SET current_latitude = ?, current_longitude = ?, status = ?, updated_at = CURRENT_TIMESTAMP
        WHERE vehicle_id = ?
      `).run(latitude, longitude, main_order_no ? 'running' : 'idle', vehicle_id);

      if (isAnomaly && main_order_no) {
        rulesEngine.addToExceptionQueue(
          anomalyType,
          {
            track_id: trackId,
            previous_track: previousTrack,
            current_track: currentTrack,
            anomalies
          },
          main_order_no,
          vehicle_id,
          trackId
        );
      }

      res.json({
        success: true,
        track_id: trackId,
        anomalies
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.get('/tracks/:vehicleId', authMiddleware, (req, res) => {
    try {
      const { vehicleId } = req.params;
      const { start_time, end_time, limit = 100 } = req.query;

      let query = `
        SELECT * FROM vehicle_tracks WHERE vehicle_id = ?
      `;
      let params = [vehicleId];

      if (start_time) {
        query += ' AND track_time >= ?';
        params.push(start_time);
      }

      if (end_time) {
        query += ' AND track_time <= ?';
        params.push(end_time);
      }

      query += ' ORDER BY track_time DESC LIMIT ?';
      params.push(parseInt(limit));

      const tracks = db.prepare(query).all(...params);

      res.json(tracks.reverse());
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.get('/stations', authMiddleware, (req, res) => {
    try {
      const { route_id } = req.query;

      let query = 'SELECT * FROM stations WHERE 1=1';
      let params = [];

      if (route_id) {
        const route = db.prepare('SELECT station_order FROM routes WHERE route_id = ?').get(route_id);
        if (route && route.station_order) {
          const stationIds = route.station_order.split(',');
          query = `
            SELECT * FROM stations 
            WHERE station_id IN (${stationIds.map(() => '?').join(',')})
            ORDER BY order_index
          `;
          params = stationIds;
        }
      } else {
        query += ' ORDER BY order_index';
      }

      const stations = db.prepare(query).all(...params);

      res.json(stations);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.get('/routes', authMiddleware, (req, res) => {
    try {
      const routes = db.prepare(`
        SELECT r.*, 
               (SELECT COUNT(*) FROM schedules s WHERE s.route_id = r.route_id AND s.status = 'scheduled') as active_schedules
        FROM routes r
        WHERE r.status = 'active'
        ORDER BY r.route_code
      `).all();

      const routesWithStations = routes.map(route => {
        const stationIds = route.station_order.split(',');
        const stations = db.prepare(`
          SELECT * FROM stations 
          WHERE station_id IN (${stationIds.map(() => '?').join(',')})
          ORDER BY order_index
        `).all(...stationIds);

        return {
          ...route,
          stations
        };
      });

      res.json(routesWithStations);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.get('/drivers', authMiddleware, (req, res) => {
    try {
      const drivers = db.prepare(`
        SELECT d.*, u.name, u.username, u.status as user_status
        FROM drivers d
        LEFT JOIN users u ON d.user_id = u.user_id
        ORDER BY u.name
      `).all();

      res.json(drivers);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
};
