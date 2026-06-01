const { db } = require('../database')

let lastAlertId = {}

function simulateTemperature() {
  const zones = db.prepare('SELECT * FROM temperature_zones').all()
  
  zones.forEach(zone => {
    const baseTemp = (zone.min_temp + zone.max_temp) / 2
    const variation = (Math.random() - 0.5) * 4
    let temp = baseTemp + variation
    
    const isAlert = temp < zone.min_temp || temp > zone.max_temp
    const alertType = temp < zone.min_temp ? 'too_low' : temp > zone.max_temp ? 'too_high' : null

    db.prepare(`
      INSERT INTO temperature_records
      (temperature_zone_id, temperature, is_alert, alert_type)
      VALUES (?, ?, ?, ?)
    `).run(zone.id, Math.round(temp * 100) / 100, isAlert ? 1 : 0, alertType)

    if (isAlert) {
      const existingOpen = db.prepare(`
        SELECT id FROM temperature_alerts 
        WHERE temperature_zone_id = ? AND status = 'open'
      `).get(zone.id)

      if (!existingOpen) {
        db.prepare(`
          INSERT INTO temperature_alerts
          (temperature_zone_id, start_time, max_temp, min_temp, avg_temp, status)
          VALUES (?, CURRENT_TIMESTAMP, ?, ?, ?, 'open')
        `).run(zone.id, zone.max_temp + 2, zone.min_temp - 2, temp)
      }
    } else {
      const openAlerts = db.prepare(`
        SELECT id FROM temperature_alerts 
        WHERE temperature_zone_id = ? AND status = 'open'
      `).all(zone.id)
      
      openAlerts.forEach(alert => {
        db.prepare(`
          UPDATE temperature_alerts 
          SET status = 'resolved', end_time = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(alert.id)
      })
    }
  })
}

setInterval(simulateTemperature, 30000)
simulateTemperature()

module.exports = { simulateTemperature }
