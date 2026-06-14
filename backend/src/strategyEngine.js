const db = require('./database');

const DEFAULT_STRATEGY = {
  screenTimeout: 30,
  wifiScanInterval: 120,
  backgroundWakeup: false,
  cpuThrottling: false,
  syncDisabled: false
};

class StrategyEngine {
  constructor() {
    this.temperatureHighThreshold = 45;
    this.temperatureLowThreshold = 5;
    this.voltageHighThreshold = 4.5;
    this.voltageLowThreshold = 3.2;
    this.currentHighThreshold = 3.5;
  }

  getDeviceAdaptation(deviceModel) {
    const stmt = db.prepare('SELECT * FROM device_adaptations WHERE device_model = ? LIMIT 1');
    const adaptation = stmt.get(deviceModel);
    if (adaptation) {
      return {
        ...adaptation,
        strategy_config: JSON.parse(adaptation.strategy_config)
      };
    }
    const defaultStmt = db.prepare('SELECT * FROM device_adaptations WHERE device_model = ? LIMIT 1');
    const defaultAdapt = defaultStmt.get('Default');
    return {
      ...defaultAdapt,
      strategy_config: JSON.parse(defaultAdapt.strategy_config)
    };
  }

  checkSafetyFuse(batteryData, sessionId, deviceId) {
    const issues = [];

    if (batteryData.temperature > this.temperatureHighThreshold) {
      issues.push({
        reason: 'TEMPERATURE_OVER_HIGH',
        value: batteryData.temperature,
        threshold: this.temperatureHighThreshold,
        action: 'PAUSE_CHARGING_OPTIMIZATION'
      });
    }

    if (batteryData.temperature < this.temperatureLowThreshold) {
      issues.push({
        reason: 'TEMPERATURE_TOO_LOW',
        value: batteryData.temperature,
        threshold: this.temperatureLowThreshold,
        action: 'PAUSE_CHARGING_OPTIMIZATION'
      });
    }

    if (batteryData.voltage > this.voltageHighThreshold) {
      issues.push({
        reason: 'VOLTAGE_OVER_HIGH',
        value: batteryData.voltage,
        threshold: this.voltageHighThreshold,
        action: 'REDUCE_CHARGING_CURRENT'
      });
    }

    if (batteryData.voltage < this.voltageLowThreshold) {
      issues.push({
        reason: 'VOLTAGE_TOO_LOW',
        value: batteryData.voltage,
        threshold: this.voltageLowThreshold,
        action: 'INCREASE_CHARGING_CURRENT'
      });
    }

    if (batteryData.health === 'OVERHEAT' || batteryData.health === 'OVER_VOLTAGE') {
      issues.push({
        reason: `BATTERY_HEALTH_${batteryData.health}`,
        value: null,
        threshold: null,
        action: 'STOP_CHARGING_COMPLETELY'
      });
    }

    if (issues.length > 0) {
      const insertFuse = db.prepare(`
        INSERT INTO safety_fuse_records (device_id, session_id, trigger_reason, trigger_value, threshold, action_taken)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      issues.forEach(issue => {
        insertFuse.run(deviceId, sessionId, issue.reason, issue.value, issue.threshold, issue.action);
      });
    }

    return issues;
  }

  calculateOptimalStrategy(batteryData, deviceModel, currentStrategy) {
    const adaptation = this.getDeviceAdaptation(deviceModel);
    const baseStrategy = { ...adaptation.strategy_config };
    const adjustments = [];

    if (batteryData.temperature > 35 && batteryData.temperature <= 40) {
      if (baseStrategy.screenTimeout > 20) {
        adjustments.push({
          metric: 'temperature',
          value: batteryData.temperature,
          before: { screenTimeout: baseStrategy.screenTimeout },
          after: { screenTimeout: 20 },
          reason: '温度偏高，缩短屏幕超时'
        });
        baseStrategy.screenTimeout = 20;
      }
      if (!baseStrategy.cpuThrottling) {
        adjustments.push({
          metric: 'temperature',
          value: batteryData.temperature,
          before: { cpuThrottling: false },
          after: { cpuThrottling: true },
          reason: '温度偏高，启用CPU降频'
        });
        baseStrategy.cpuThrottling = true;
      }
    }

    if (batteryData.temperature > 40) {
      if (baseStrategy.wifiScanInterval < 240) {
        adjustments.push({
          metric: 'temperature',
          value: batteryData.temperature,
          before: { wifiScanInterval: baseStrategy.wifiScanInterval },
          after: { wifiScanInterval: 240 },
          reason: '温度过高，延长WiFi扫描间隔'
        });
        baseStrategy.wifiScanInterval = 240;
      }
      if (!baseStrategy.syncDisabled) {
        adjustments.push({
          metric: 'temperature',
          value: batteryData.temperature,
          before: { syncDisabled: false },
          after: { syncDisabled: true },
          reason: '温度过高，禁用后台同步'
        });
        baseStrategy.syncDisabled = true;
      }
    }

    if (batteryData.current > 2.5 && batteryData.level > 80) {
      adjustments.push({
        metric: 'current',
        value: batteryData.current,
        before: { note: '高电流快充' },
        after: { note: '进入涓流充电模式' },
        reason: '电量>80%，降低充电电流保护电池'
      });
    }

    if (batteryData.health === 'GOOD' && batteryData.temperature < 30) {
      if (baseStrategy.wifiScanInterval > 60) {
        adjustments.push({
          metric: 'health',
          value: 100,
          before: { wifiScanInterval: baseStrategy.wifiScanInterval },
          after: { wifiScanInterval: Math.max(60, baseStrategy.wifiScanInterval - 30) },
          reason: '电池健康且温度低，适当提高响应性'
        });
        baseStrategy.wifiScanInterval = Math.max(60, baseStrategy.wifiScanInterval - 30);
      }
    }

    if (batteryData.level < 20 && !batteryData.is_charging) {
      if (baseStrategy.screenTimeout > 15) {
        adjustments.push({
          metric: 'level',
          value: batteryData.level,
          before: { screenTimeout: baseStrategy.screenTimeout },
          after: { screenTimeout: 15 },
          reason: '低电量未充电，进一步缩短屏幕超时'
        });
        baseStrategy.screenTimeout = 15;
      }
      if (!baseStrategy.backgroundWakeup) {
        adjustments.push({
          metric: 'level',
          value: batteryData.level,
          before: { backgroundWakeup: true },
          after: { backgroundWakeup: false },
          reason: '低电量未充电，完全禁用后台唤醒'
        });
        baseStrategy.backgroundWakeup = false;
      }
    }

    return {
      strategy: baseStrategy,
      adjustments,
      adaptation
    };
  }

  logAdjustment(sessionId, deviceId, adjustment) {
    const stmt = db.prepare(`
      INSERT INTO strategy_adjustment_logs (session_id, device_id, trigger_metric, trigger_value, before_adjustment, after_adjustment, adjustment_reason)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      sessionId,
      deviceId,
      adjustment.metric,
      adjustment.value,
      JSON.stringify(adjustment.before),
      JSON.stringify(adjustment.after),
      adjustment.reason
    );
  }

  getAdjustmentHistory(sessionId) {
    const stmt = db.prepare(`
      SELECT * FROM strategy_adjustment_logs 
      WHERE session_id = ? 
      ORDER BY timestamp DESC
    `);
    return stmt.all(sessionId);
  }

  getFuseRecords(deviceId, limit = 20) {
    const stmt = db.prepare(`
      SELECT * FROM safety_fuse_records 
      WHERE device_id = ? 
      ORDER BY trigger_time DESC 
      LIMIT ?
    `);
    return stmt.all(deviceId, limit);
  }

  calculateEstimatedFullTime(batteryData, historyRecords) {
    if (!batteryData.is_charging || batteryData.level >= 100) {
      return null;
    }

    const recentRecords = historyRecords.slice(-10);
    if (recentRecords.length < 2) {
      const remaining = 100 - batteryData.level;
      return Math.round(remaining * 2.5 * 60);
    }

    const chargeRates = [];
    for (let i = 1; i < recentRecords.length; i++) {
      const levelDiff = recentRecords[i].level - recentRecords[i - 1].level;
      if (levelDiff > 0) {
        const timeDiff = (new Date(recentRecords[i].timestamp) - new Date(recentRecords[i - 1].timestamp)) / 1000 / 60;
        if (timeDiff > 0) {
          chargeRates.push(levelDiff / timeDiff);
        }
      }
    }

    if (chargeRates.length === 0) {
      const remaining = 100 - batteryData.level;
      return Math.round(remaining * 2.5 * 60);
    }

    const avgRate = chargeRates.reduce((a, b) => a + b, 0) / chargeRates.length;
    const remaining = 100 - batteryData.level;
    const estimatedMinutes = remaining / avgRate;

    return Math.max(0, Math.round(estimatedMinutes * 60));
  }

  analyzeUserHabits(deviceId, sessions, records) {
    if (sessions.length < 3) {
      return null;
    }

    const lowBatteryHours = {};
    const chargingPatterns = {};
    const chargeLevels = [];
    let totalDuration = 0;

    sessions.forEach(session => {
      if (session.total_time) {
        totalDuration += session.total_time;
        chargeLevels.push(session.start_level);
        chargeLevels.push(session.end_level);

        const hour = new Date(session.start_time).getHours();
        if (session.start_level < 30) {
          lowBatteryHours[hour] = (lowBatteryHours[hour] || 0) + 1;
        }

        const period = hour >= 6 && hour < 12 ? 'morning' :
                       hour >= 12 && hour < 18 ? 'afternoon' :
                       hour >= 18 && hour < 24 ? 'evening' : 'night';
        chargingPatterns[period] = (chargingPatterns[period] || 0) + 1;
      }
    });

    const avgDuration = totalDuration / sessions.filter(s => s.total_time).length;
    const learningScore = Math.min(100, sessions.length * 10 + 20);

    const stmt = db.prepare(`
      INSERT INTO user_habits (device_id, low_battery_hours, charging_patterns, avg_daily_charge_count, avg_charge_duration, common_charge_levels, learning_score)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      deviceId,
      JSON.stringify(lowBatteryHours),
      JSON.stringify(chargingPatterns),
      Math.round(sessions.length / 7),
      Math.round(avgDuration),
      JSON.stringify(chargeLevels),
      learningScore
    );

    return {
      habit_id: result.lastInsertRowid,
      lowBatteryHours,
      chargingPatterns,
      avgDailyChargeCount: Math.round(sessions.length / 7),
      avgChargeDuration: Math.round(avgDuration),
      learningScore
    };
  }

  calculateEfficiencyTrend(sessions) {
    if (sessions.length < 2) {
      return { trend: 'insufficient', trendValue: 0 };
    }

    const efficiencies = sessions
      .filter(s => s.efficiency !== null)
      .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
      .map(s => s.efficiency);

    if (efficiencies.length < 2) {
      return { trend: 'insufficient', trendValue: 0 };
    }

    const firstHalf = efficiencies.slice(0, Math.floor(efficiencies.length / 2));
    const secondHalf = efficiencies.slice(Math.floor(efficiencies.length / 2));

    const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const avgSecond = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    const trendValue = avgSecond - avgFirst;
    let trend = 'stable';
    if (trendValue > 2) trend = 'improving';
    else if (trendValue < -2) trend = 'declining';

    return {
      trend,
      trendValue,
      avgFirst,
      avgSecond,
      efficiencies
    };
  }
}

module.exports = new StrategyEngine();
