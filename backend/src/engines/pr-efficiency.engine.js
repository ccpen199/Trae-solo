const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');

class PREfficiencyEngine {
  static calculateExpectedGeneration(station, irradiance, ambientTemp = 25) {
    const capacityKw = station.capacity_kw;
    const tempCoefficient = -0.004;
    const cellTemp = ambientTemp + (irradiance / 800) * 30;
    const tempFactor = 1 + tempCoefficient * (cellTemp - 25);
    const expectedKwh = (capacityKw * irradiance * tempFactor) / 1000;
    return Math.max(0, expectedKwh);
  }

  static calculatePR(actualGeneration, expectedGeneration, stationCapacity) {
    if (expectedGeneration <= 0 || stationCapacity <= 0) return 0;
    const actualYield = actualGeneration / stationCapacity;
    const referenceYield = expectedGeneration / stationCapacity;
    if (referenceYield <= 0) return 0;
    return actualYield / referenceYield;
  }

  static calculateDeviation(actual, expected) {
    const deviation = actual - expected;
    const deviationPercent = expected > 0 ? (deviation / expected) * 100 : 0;
    return { deviation, deviationPercent };
  }

  static determineHealthLevel(prValue, prTarget = 0.85) {
    const prRatio = prValue / prTarget;
    if (prRatio >= 0.95) return 'excellent';
    if (prRatio >= 0.85) return 'good';
    if (prRatio >= 0.70) return 'fair';
    if (prRatio >= 0.50) return 'poor';
    return 'critical';
  }

  static processInverterData(inverterData) {
    const inverter = db.prepare(`
      SELECT i.*, s.capacity_kw as station_capacity, s.pr_target, s.name as station_name
      FROM inverters i
      JOIN stations s ON i.station_id = s.id
      WHERE i.id = ?
    `).get(inverterData.inverter_id);

    if (!inverter) {
      throw new Error('逆变器不存在');
    }

    const irradiance = this.estimateIrradiance(inverterData, inverter.station_capacity);
    const expectedGeneration = this.calculateExpectedGeneration(
      { capacity_kw: inverter.capacity_kw },
      irradiance,
      inverterData.temperature
    );

    const pr = this.calculatePR(
      inverterData.active_power / 1000,
      expectedGeneration,
      inverter.capacity_kw
    );

    return {
      inverter_id: inverterData.inverter_id,
      station_id: inverter.station_id,
      actual_power_kw: inverterData.active_power / 1000,
      expected_power_kw: expectedGeneration,
      pr_value: pr,
      efficiency: inverterData.efficiency,
      temperature: inverterData.temperature,
      irradiance_estimate: irradiance
    };
  }

  static estimateIrradiance(inverterData, stationCapacity) {
    if (inverterData.dc_voltage && inverterData.dc_current) {
      const dcPower = inverterData.dc_voltage * inverterData.dc_current / 1000;
      const estimatedIrradiance = (dcPower / stationCapacity) * 1000;
      return Math.min(1200, Math.max(0, estimatedIrradiance));
    }
    const hour = moment().hour();
    if (hour >= 6 && hour <= 18) {
      const midDay = 12;
      const distance = Math.abs(hour - midDay);
      const factor = 1 - (distance / 6) * 0.5;
      return 800 * factor;
    }
    return 0;
  }

  static generateDailyRecord(stationId, recordDate) {
    const dateStr = moment(recordDate).format('YYYY-MM-DD');
    
    const dailyData = db.prepare(`
      SELECT 
        SUM(daily_generation_kwh) as total_actual,
        AVG(efficiency) as avg_efficiency
      FROM inverter_data
      WHERE station_id = ?
        AND date(collect_time) = ?
      GROUP BY station_id
    `).get(stationId, dateStr);

    if (!dailyData || dailyData.total_actual === null) {
      return null;
    }

    const station = db.prepare('SELECT capacity_kw, pr_target FROM stations WHERE id = ?').get(stationId);
    if (!station) return null;

    const expectedDaily = this.calculateDailyExpected(station.capacity_kw, recordDate);
    const prValue = this.calculatePR(dailyData.total_actual, expectedDaily, station.capacity_kw);
    const { deviation, deviationPercent } = this.calculateDeviation(dailyData.total_actual, expectedDaily);
    
    const healthLevel = this.determineHealthLevel(prValue, station.pr_target);

    const existing = db.prepare(`
      SELECT id FROM generation_records 
      WHERE station_id = ? AND record_date = ?
    `).get(stationId, dateStr);

    if (existing) {
      db.prepare(`
        UPDATE generation_records SET
          actual_generation_kwh = ?,
          expected_generation_kwh = ?,
          pr_value = ?,
          deviation = ?,
          deviation_percent = ?,
          status = ?,
          updated_at = datetime('now')
        WHERE id = ?
      `).run(
        dailyData.total_actual,
        expectedDaily,
        prValue,
        deviation,
        deviationPercent,
        healthLevel === 'excellent' || healthLevel === 'good' ? 'normal' : 'abnormal',
        existing.id
      );
      return existing.id;
    } else {
      const id = uuidv4();
      db.prepare(`
        INSERT INTO generation_records (
          id, station_id, record_date, actual_generation_kwh,
          expected_generation_kwh, pr_value, deviation, deviation_percent, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id, stationId, dateStr, dailyData.total_actual,
        expectedDaily, prValue, deviation, deviationPercent,
        healthLevel === 'excellent' || healthLevel === 'good' ? 'normal' : 'abnormal'
      );
      return id;
    }
  }

  static calculateDailyExpected(capacityKw, date) {
    const month = moment(date).month() + 1;
    let dailyHours;
    if (month >= 3 && month <= 5) dailyHours = 6.5;
    else if (month >= 6 && month <= 8) dailyHours = 8.5;
    else if (month >= 9 && month <= 11) dailyHours = 5.5;
    else dailyHours = 4.0;

    return capacityKw * dailyHours * 0.75;
  }

  static getStationEfficiencyTrend(stationId, days = 30) {
    const records = db.prepare(`
      SELECT 
        record_date,
        actual_generation_kwh,
        expected_generation_kwh,
        pr_value,
        deviation_percent
      FROM generation_records
      WHERE station_id = ?
        AND record_date >= date('now', '-' || ? || ' days')
      ORDER BY record_date
    `).all(stationId, days);

    return records;
  }

  static updateDashboardMetrics() {
    const today = moment().format('YYYY-MM-DD');
    
    const totalGeneration = db.prepare(`
      SELECT SUM(actual_generation_kwh) as total
      FROM generation_records
      WHERE record_date = ?
    `).get(today);

    this.saveMetric(today, 'daily_generation', null, totalGeneration?.total || 0, 'kWh');

    const avgPR = db.prepare(`
      SELECT AVG(pr_value) as avg_pr
      FROM generation_records
      WHERE record_date = ?
    `).get(today);

    this.saveMetric(today, 'average_pr', null, avgPR?.avg_pr || 0, 'ratio');

    const stations = db.prepare('SELECT id, capacity_kw FROM stations').all();
    stations.forEach(station => {
      const todayRecord = db.prepare(`
        SELECT actual_generation_kwh, pr_value, deviation_percent
        FROM generation_records
        WHERE station_id = ? AND record_date = ?
      `).get(station.id, today);

      if (todayRecord) {
        this.saveMetric(today, 'station_generation', station.id, todayRecord.actual_generation_kwh, 'kWh');
        this.saveMetric(today, 'station_pr', station.id, todayRecord.pr_value, 'ratio');
      }
    });
  }

  static saveMetric(date, type, stationId, value, unit) {
    const existing = db.prepare(`
      SELECT id FROM dashboard_metrics
      WHERE metric_date = ? AND metric_type = ? AND station_id IS ?
    `).get(date, type, stationId);

    if (existing) {
      db.prepare(`
        UPDATE dashboard_metrics SET value = ?, updated_at = datetime('now')
        WHERE id = ?
      `).run(value, existing.id);
    } else {
      const id = uuidv4();
      db.prepare(`
        INSERT INTO dashboard_metrics (id, metric_date, metric_type, station_id, value, unit)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(id, date, type, stationId, value, unit);
    }
  }
}

module.exports = PREfficiencyEngine;
