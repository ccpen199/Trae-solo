const db = require('../config/database');

const models = {
  getStations: db.prepare(`
    SELECT s.*, 
      SUM(CASE WHEN cs.is_occupied = 0 AND cs.is_offline = 0 THEN 1 ELSE 0 END) as available_piles,
      SUM(CASE WHEN cs.is_charging = 1 THEN 1 ELSE 0 END) as charging_piles,
      SUM(CASE WHEN cs.is_offline = 1 THEN 1 ELSE 0 END) as offline_piles
    FROM stations s
    LEFT JOIN chargers c ON s.id = c.station_id
    LEFT JOIN charger_status cs ON c.id = cs.charger_id
    WHERE cs.id IN (SELECT MAX(id) FROM charger_status GROUP BY charger_id)
    GROUP BY s.id
    ORDER BY s.id
  `),

  getStationById: db.prepare(`
    SELECT s.*,
      SUM(CASE WHEN cs.is_occupied = 0 AND cs.is_offline = 0 THEN 1 ELSE 0 END) as available_piles,
      SUM(CASE WHEN cs.is_charging = 1 THEN 1 ELSE 0 END) as charging_piles,
      SUM(CASE WHEN cs.is_offline = 1 THEN 1 ELSE 0 END) as offline_piles
    FROM stations s
    LEFT JOIN chargers c ON s.id = c.station_id
    LEFT JOIN charger_status cs ON c.id = cs.charger_id
    WHERE s.id = ? AND cs.id IN (SELECT MAX(id) FROM charger_status GROUP BY charger_id)
    GROUP BY s.id
  `),

  getChargersByStationId: db.prepare(`
    SELECT c.*, cs.voltage, cs.current, cs.power, cs.temperature, cs.soc, 
      cs.fault_code, cs.fault_message, cs.occupied_duration, cs.is_occupied, 
      cs.is_charging, cs.is_offline, cs.timestamp as last_update
    FROM chargers c
    LEFT JOIN charger_status cs ON c.id = cs.charger_id
    WHERE c.station_id = ? 
      AND cs.id IN (SELECT MAX(id) FROM charger_status GROUP BY charger_id)
    ORDER BY c.type DESC, c.id
  `),

  getChargerById: db.prepare(`
    SELECT c.*, cs.voltage, cs.current, cs.power, cs.temperature, cs.soc,
      cs.fault_code, cs.fault_message, cs.occupied_duration, cs.is_occupied,
      cs.is_charging, cs.is_offline, cs.timestamp as last_update,
      s.name as station_name, s.address, s.city, s.lat, s.lng
    FROM chargers c
    LEFT JOIN charger_status cs ON c.id = cs.charger_id
    LEFT JOIN stations s ON c.station_id = s.id
    WHERE c.id = ? 
      AND cs.id IN (SELECT MAX(id) FROM charger_status GROUP BY charger_id)
  `),

  getChargerByCode: db.prepare(`
    SELECT c.*, cs.voltage, cs.current, cs.power, cs.temperature, cs.soc,
      cs.fault_code, cs.fault_message, cs.occupied_duration, cs.is_occupied,
      cs.is_charging, cs.is_offline, cs.timestamp as last_update
    FROM chargers c
    LEFT JOIN charger_status cs ON c.id = cs.charger_id
    WHERE c.charger_code = ? 
      AND cs.id IN (SELECT MAX(id) FROM charger_status GROUP BY charger_id)
  `),

  insertChargerStatus: db.prepare(`
    INSERT INTO charger_status 
    (charger_id, voltage, current, power, temperature, soc, fault_code, 
     fault_message, occupied_duration, is_occupied, is_charging, is_offline)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `),

  updateChargerStatus: db.prepare(`
    UPDATE chargers 
    SET status = ?, updated_at = CURRENT_TIMESTAMP 
    WHERE id = ?
  `),

  getPriceStrategyByStationId: db.prepare(`
    SELECT ps.*, pp.id as period_id, pp.period_type, pp.start_time, pp.end_time, 
           pp.electricity_price, pp.service_price
    FROM price_strategies ps
    LEFT JOIN price_periods pp ON ps.id = pp.strategy_id
    WHERE ps.station_id = ? AND ps.is_active = 1
    ORDER BY pp.period_type = 'peak' DESC, pp.period_type = 'flat' DESC, pp.start_time
  `),

  getCurrentPricePeriod: db.prepare(`
    SELECT pp.*
    FROM price_strategies ps
    LEFT JOIN price_periods pp ON ps.id = pp.strategy_id
    WHERE ps.station_id = ? AND ps.is_active = 1
      AND ((pp.start_time <= pp.end_time AND ? >= pp.start_time AND ? < pp.end_time)
        OR (pp.start_time > pp.end_time AND (? >= pp.start_time OR ? < pp.end_time)))
    LIMIT 1
  `),

  createOrder: db.prepare(`
    INSERT INTO charging_orders 
    (order_no, user_id, vehicle_id, charger_id, station_id, start_time, 
     start_soc, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'charging')
  `),

  updateOrder: db.prepare(`
    UPDATE charging_orders 
    SET end_time = ?, end_soc = ?, energy = ?, duration = ?, 
        peak_energy = ?, flat_energy = ?, valley_energy = ?,
        peak_cost = ?, flat_cost = ?, valley_cost = ?, service_fee = ?,
        total_amount = ?, status = ?
    WHERE id = ?
  `),

  getOrderById: db.prepare(`
    SELECT o.*, s.name as station_name, s.address, c.charger_code, c.type as charger_type,
           c.power_rating, v.plate_number, v.brand, v.model, u.nickname, u.phone
    FROM charging_orders o
    LEFT JOIN stations s ON o.station_id = s.id
    LEFT JOIN chargers c ON o.charger_id = c.id
    LEFT JOIN vehicles v ON o.vehicle_id = v.id
    LEFT JOIN users u ON o.user_id = u.id
    WHERE o.id = ?
  `),

  getOrderByNo: db.prepare(`
    SELECT o.*, s.name as station_name, s.address, c.charger_code, c.type as charger_type,
           c.power_rating, v.plate_number, v.brand, v.model
    FROM charging_orders o
    LEFT JOIN stations s ON o.station_id = s.id
    LEFT JOIN chargers c ON o.charger_id = c.id
    LEFT JOIN vehicles v ON o.vehicle_id = v.id
    WHERE o.order_no = ?
  `),

  getActiveOrderByChargerId: db.prepare(`
    SELECT o.*, s.name as station_name, s.address, c.charger_code, v.plate_number
    FROM charging_orders o
    LEFT JOIN stations s ON o.station_id = s.id
    LEFT JOIN chargers c ON o.charger_id = c.id
    LEFT JOIN vehicles v ON o.vehicle_id = v.id
    WHERE o.charger_id = ? AND o.status = 'charging'
    ORDER BY o.id DESC
    LIMIT 1
  `),

  getOrdersByUserId: db.prepare(`
    SELECT o.*, s.name as station_name, c.charger_code, c.type as charger_type
    FROM charging_orders o
    LEFT JOIN stations s ON o.station_id = s.id
    LEFT JOIN chargers c ON o.charger_id = c.id
    WHERE o.user_id = ?
    ORDER BY o.created_at DESC
    LIMIT 50
  `),

  insertPowerData: db.prepare(`
    INSERT INTO charging_power_data 
    (order_id, charger_id, voltage, current, power, soc, temperature)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `),

  getPowerDataByOrderId: db.prepare(`
    SELECT * FROM charging_power_data 
    WHERE order_id = ? 
    ORDER BY timestamp ASC
  `),

  createReservation: db.prepare(`
    INSERT INTO reservations 
    (reservation_no, user_id, vehicle_id, charger_id, station_id, 
     scheduled_start_time, scheduled_end_time, target_soc, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'confirmed')
  `),

  getReservationsByUserId: db.prepare(`
    SELECT r.*, s.name as station_name, s.address, c.charger_code, c.type as charger_type,
           c.power_rating, v.plate_number, v.brand, v.model
    FROM reservations r
    LEFT JOIN stations s ON r.station_id = s.id
    LEFT JOIN chargers c ON r.charger_id = c.id
    LEFT JOIN vehicles v ON r.vehicle_id = v.id
    WHERE r.user_id = ?
    ORDER BY r.created_at DESC
    LIMIT 50
  `),

  getAlarms: db.prepare(`
    SELECT a.*, s.name as station_name, c.charger_code, c.type as charger_type
    FROM alarm_work_orders a
    LEFT JOIN stations s ON a.station_id = s.id
    LEFT JOIN chargers c ON a.charger_id = c.id
    ORDER BY a.created_at DESC
    LIMIT 100
  `),

  getAlarmById: db.prepare(`
    SELECT a.*, s.name as station_name, s.address, c.charger_code, c.type as charger_type,
           c.power_rating, c.health_score
    FROM alarm_work_orders a
    LEFT JOIN stations s ON a.station_id = s.id
    LEFT JOIN chargers c ON a.charger_id = c.id
    WHERE a.id = ?
  `),

  updateAlarm: db.prepare(`
    UPDATE alarm_work_orders 
    SET status = ?, assignee = ?, description = ?, resolution = ?, 
        resolved_at = CASE WHEN ? = 'resolved' THEN CURRENT_TIMESTAMP ELSE resolved_at END
    WHERE id = ?
  `),

  getDailyRevenue: db.prepare(`
    SELECT dr.*, s.name as station_name, s.city
    FROM daily_revenue dr
    LEFT JOIN stations s ON dr.station_id = s.id
    WHERE dr.report_date BETWEEN ? AND ?
    ORDER BY dr.report_date DESC, dr.station_id
  `),

  getMonthlyRevenue: db.prepare(`
    SELECT mr.*, s.name as station_name, s.city
    FROM monthly_revenue mr
    LEFT JOIN stations s ON mr.station_id = s.id
    WHERE mr.report_month = ?
    ORDER BY mr.station_id
  `),

  getSummaryStats: db.prepare(`
    SELECT 
      (SELECT COUNT(*) FROM stations WHERE status = 'active') as total_stations,
      (SELECT COUNT(*) FROM chargers) as total_chargers,
      (SELECT COUNT(*) FROM chargers WHERE status = 'online') as online_chargers,
      (SELECT COUNT(*) FROM charger_status cs WHERE cs.id IN (SELECT MAX(id) FROM charger_status GROUP BY charger_id) AND cs.is_charging = 1) as charging_now,
      (SELECT SUM(total_energy) FROM daily_revenue WHERE report_date >= date('now', '-7 days')) as weekly_energy,
      (SELECT SUM(total_amount) FROM daily_revenue WHERE report_date >= date('now', '-7 days')) as weekly_revenue,
      (SELECT COUNT(*) FROM alarm_work_orders WHERE status IN ('pending', 'processing')) as active_alarms
  `),

  getChargerHealthStats: db.prepare(`
    SELECT 
      c.id, c.charger_code, c.type, c.power_rating, c.health_score,
      c.last_maintenance_date, c.total_charging_count, c.total_energy,
      s.name as station_name, s.city,
      cs.is_offline, cs.fault_code, cs.fault_message, cs.temperature,
      CASE 
        WHEN c.health_score >= 90 THEN 'excellent'
        WHEN c.health_score >= 75 THEN 'good'
        WHEN c.health_score >= 60 THEN 'fair'
        ELSE 'poor'
      END as health_level
    FROM chargers c
    LEFT JOIN stations s ON c.station_id = s.id
    LEFT JOIN charger_status cs ON c.id = cs.charger_id
    WHERE cs.id IN (SELECT MAX(id) FROM charger_status GROUP BY charger_id)
    ORDER BY c.health_score ASC
  `),

  getUserById: db.prepare(`
    SELECT * FROM users WHERE id = ?
  `),

  getVehicleById: db.prepare(`
    SELECT * FROM vehicles WHERE id = ?
  `),

  getVehiclesByUserId: db.prepare(`
    SELECT * FROM vehicles WHERE user_id = ?
  `),

  getOcppMessages: db.prepare(`
    SELECT * FROM ocpp_messages 
    WHERE charger_code = ?
    ORDER BY timestamp DESC
    LIMIT 50
  `),

  insertOcppMessage: db.prepare(`
    INSERT INTO ocpp_messages (charger_code, message_type, action, payload, direction)
    VALUES (?, ?, ?, ?, ?)
  `),

  createPriceStrategy: db.prepare(`
    INSERT INTO price_strategies (station_id, name, type, effective_date, expire_date, is_active)
    VALUES (?, ?, ?, ?, ?, 1)
  `),

  deletePricePeriods: db.prepare(`
    DELETE FROM price_periods WHERE strategy_id = ?
  `),

  insertPricePeriod: db.prepare(`
    INSERT INTO price_periods (strategy_id, period_type, start_time, end_time, electricity_price, service_price)
    VALUES (?, ?, ?, ?, ?, ?)
  `)
};

module.exports = models;
