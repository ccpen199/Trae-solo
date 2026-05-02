const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');
const PREfficiencyEngine = require('./pr-efficiency.engine');

class AssetValuationEngine {
  static evaluateStationQuality(stationId) {
    const station = db.prepare(`
      SELECT s.*,
             (SELECT COUNT(*) FROM faults 
              WHERE station_id = s.id AND detected_time >= date('now', '-90 days')) as fault_count_90d,
             (SELECT COUNT(*) FROM maintenance_orders 
              WHERE station_id = s.id AND status = 'verified' AND complete_time >= date('now', '-90 days')) as repair_count_90d
      FROM stations s
      WHERE s.id = ?
    `).get(stationId);

    if (!station) throw new Error('电站不存在');

    const prRecords = db.prepare(`
      SELECT pr_value FROM generation_records
      WHERE station_id = ? AND record_date >= date('now', '-30 days')
      ORDER BY record_date DESC
      LIMIT 30
    `).all(stationId);

    const avgPR = prRecords.length > 0 
      ? prRecords.reduce((sum, r) => sum + r.pr_value, 0) / prRecords.length 
      : station.pr_target;

    const healthScore = this.calculateHealthScore({
      pr_value: avgPR,
      pr_target: station.pr_target,
      fault_count: station.fault_count_90d,
      repair_count: station.repair_count_90d,
      health_level: station.health_level
    });

    const qualityLevel = this.determineQualityLevel(healthScore);
    const remainingLife = this.estimateRemainingLife(station, healthScore);

    return {
      station_id: stationId,
      station_name: station.name,
      health_score: healthScore,
      quality_level: qualityLevel,
      estimated_remaining_life_years: remainingLife,
      avg_pr_30d: avgPR,
      pr_target: station.pr_target,
      fault_count_90d: station.fault_count_90d,
      repair_count_90d: station.repair_count_90d
    };
  }

  static calculateHealthScore(metrics) {
    let score = 100;

    const prRatio = metrics.pr_value / metrics.pr_target;
    if (prRatio >= 0.95) {
      score += 0;
    } else if (prRatio >= 0.85) {
      score -= 10;
    } else if (prRatio >= 0.70) {
      score -= 25;
    } else if (prRatio >= 0.50) {
      score -= 40;
    } else {
      score -= 60;
    }

    score -= metrics.fault_count * 5;
    score -= metrics.repair_count * 2;

    const healthScores = {
      excellent: 0,
      good: -5,
      fair: -15,
      poor: -30,
      critical: -50
    };
    score += healthScores[metrics.health_level] || 0;

    return Math.max(0, Math.min(100, score));
  }

  static determineQualityLevel(healthScore) {
    if (healthScore >= 85) return 'excellent';
    if (healthScore >= 70) return 'good';
    if (healthScore >= 50) return 'fair';
    if (healthScore >= 30) return 'poor';
    return 'critical';
  }

  static estimateRemainingLife(station, healthScore) {
    const baseLifeYears = 25;
    const installedDate = station.installed_date 
      ? moment(station.installed_date) 
      : moment().subtract(2, 'years');
    
    const yearsOperated = moment().diff(installedDate, 'years', true);
    
    const healthFactor = healthScore / 100;
    const estimatedRemaining = (baseLifeYears - yearsOperated) * healthFactor;

    return Math.max(0, estimatedRemaining);
  }

  static calculateAssetValue(stationId) {
    const quality = this.evaluateStationQuality(stationId);
    const station = db.prepare('SELECT * FROM stations WHERE id = ?').get(stationId);

    const initialCost = station.capacity_kw * 4500;
    const yearsOperated = station.installed_date 
      ? moment().diff(moment(station.installed_date), 'years', true)
      : 2;

    const depreciationRate = 0.05;
    const linearDepreciation = initialCost * (1 - depreciationRate * yearsOperated);

    const qualityFactor = quality.health_score / 100;
    const adjustedValue = linearDepreciation * (0.7 + qualityFactor * 0.3);

    const historicalGeneration = db.prepare(`
      SELECT SUM(actual_generation_kwh) as total
      FROM generation_records
      WHERE station_id = ?
    `).get(stationId);

    const avgDailyGeneration = db.prepare(`
      SELECT AVG(actual_generation_kwh) as avg_daily
      FROM generation_records
      WHERE station_id = ? AND record_date >= date('now', '-30 days')
    `).get(stationId);

    const dailyRevenue = (avgDailyGeneration?.avg_daily || station.capacity_kw * 4) * 0.5;
    const futureRevenue = dailyRevenue * 365 * quality.estimated_remaining_life_years;

    const estimatedValue = adjustedValue + futureRevenue * 0.1;

    return {
      station_id: stationId,
      station_name: station.name,
      capacity_kw: station.capacity_kw,
      initial_investment: initialCost,
      years_operated: yearsOperated,
      book_value: Math.max(0, linearDepreciation),
      adjusted_value: Math.max(0, adjustedValue),
      estimated_market_value: Math.max(0, estimatedValue),
      health_score: quality.health_score,
      quality_level: quality.quality_level,
      estimated_remaining_life_years: quality.estimated_remaining_life_years,
      historical_generation_kwh: historicalGeneration?.total || 0,
      estimated_future_generation_kwh: (avgDailyGeneration?.avg_daily || 0) * 365 * quality.estimated_remaining_life_years,
      estimated_future_revenue: futureRevenue
    };
  }

  static generateQualityReport(stationId) {
    const valuation = this.calculateAssetValue(stationId);
    const trend = PREfficiencyEngine.getStationEfficiencyTrend(stationId, 30);

    const faults = db.prepare(`
      SELECT f.*, s.name as station_name
      FROM faults f
      JOIN stations s ON f.station_id = s.id
      WHERE f.station_id = ? AND f.detected_time >= date('now', '-90 days')
      ORDER BY f.detected_time DESC
    `).all(stationId);

    const repairs = db.prepare(`
      SELECT mo.*, u.name as worker_name, f.fault_description
      FROM maintenance_orders mo
      LEFT JOIN users u ON mo.assigned_worker_id = u.id
      LEFT JOIN faults f ON mo.fault_id = f.id
      WHERE mo.station_id = ? AND mo.status = 'verified' AND mo.complete_time >= date('now', '-90 days')
      ORDER BY mo.complete_time DESC
    `).all(stationId);

    const cleaningHistory = db.prepare(`
      SELECT co.*, u.name as worker_name
      FROM cleaning_orders co
      LEFT JOIN users u ON co.assigned_worker_id = u.id
      WHERE co.station_id = ? AND co.status = 'verified'
      ORDER BY co.verify_time DESC
      LIMIT 10
    `).all(stationId);

    const report = {
      report_id: uuidv4(),
      generated_at: new Date().toISOString(),
      station_summary: {
        id: valuation.station_id,
        name: valuation.station_name,
        capacity_kw: valuation.capacity_kw,
        health_score: valuation.health_score,
        quality_level: valuation.quality_level
      },
      valuation,
      efficiency_trend: trend,
      faults_90d: {
        count: faults.length,
        list: faults.slice(0, 10)
      },
      repairs_90d: {
        count: repairs.length,
        list: repairs.slice(0, 10)
      },
      cleaning_history: {
        count: cleaningHistory.length,
        recent: cleaningHistory
      },
      recommendations: this.generateRecommendations(valuation, faults, repairs)
    };

    const id = uuidv4();
    db.prepare(`
      INSERT INTO asset_valuations (
        id, station_id, valuation_date, current_capacity_kw,
        remaining_life_years, historical_pr_value,
        predicted_future_generation_kwh, predicted_future_revenue,
        estimated_value, depreciation_rate, health_score,
        quality_level, report_file, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, stationId, moment().format('YYYY-MM-DD'),
      valuation.capacity_kw, valuation.estimated_remaining_life_years,
      valuation.avg_pr_30d || null,
      valuation.estimated_future_generation_kwh,
      valuation.estimated_future_revenue,
      valuation.estimated_market_value,
      0.05, valuation.health_score,
      valuation.quality_level, JSON.stringify(report), 'normal'
    );

    return report;
  }

  static generateRecommendations(valuation, faults, repairs) {
    const recommendations = [];

    if (valuation.health_score >= 85) {
      recommendations.push({
        priority: 'low',
        category: 'maintenance',
        title: '设备状态良好',
        description: '电站运行状态优秀，建议保持当前运维节奏。'
      });
    } else if (valuation.health_score >= 70) {
      recommendations.push({
        priority: 'medium',
        category: 'maintenance',
        title: '建议预防性维护',
        description: '设备健康状况良好，建议安排预防性检查以保持状态。'
      });
    } else if (valuation.health_score >= 50) {
      recommendations.push({
        priority: 'high',
        category: 'maintenance',
        title: '需要关注设备状态',
        description: '健康评分中等，建议尽快安排全面检查。'
      });
    } else {
      recommendations.push({
        priority: 'critical',
        category: 'maintenance',
        title: '紧急维护需求',
        description: '设备健康状况较差，建议立即安排专业人员检查。'
      });
    }

    const activeFaults = faults.filter(f => f.status !== 'resolved' && f.status !== 'false_alarm');
    if (activeFaults.length > 0) {
      recommendations.push({
        priority: 'high',
        category: 'faults',
        title: `存在 ${activeFaults.length} 个未解决故障`,
        description: '请优先处理当前活跃故障，避免影响发电效率。'
      });
    }

    if (valuation.estimated_remaining_life_years < 5) {
      recommendations.push({
        priority: 'high',
        category: 'asset',
        title: '设备接近生命周期终点',
        description: `预计剩余寿命仅 ${valuation.estimated_remaining_life_years.toFixed(1)} 年，建议提前规划设备更新。`
      });
    }

    return recommendations;
  }

  static getAllStationValuations() {
    return db.prepare(`
      SELECT av.*, s.name as station_name, s.code as station_code, s.capacity_kw
      FROM asset_valuations av
      JOIN stations s ON av.station_id = s.id
      ORDER BY av.valuation_date DESC
    `).all();
  }
}

module.exports = AssetValuationEngine;
