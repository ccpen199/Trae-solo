const express = require('express');
const { db } = require('../db');
const { logCommand } = require('../middleware/commandLogger');

const router = express.Router();

const CHART_COLORS = ['#1890ff', '#52c41a', '#faad14', '#722ed1', '#13c2c2', '#eb2f96'];

function commandLabel(command) {
  const labels = {
    power: '电源',
    power_on: '开机',
    power_off: '关机',
    volume_up: '音量+',
    volume_down: '音量-',
    channel_up: '频道+',
    channel_down: '频道-',
    mute: '静音',
    temp_up: '温度+',
    temp_down: '温度-',
    mode_cool: '制冷',
    mode_heat: '制热',
    mode_auto: '自动',
    brightness_up: '亮度+',
    brightness_down: '亮度-'
  };
  return labels[command] || command || '未知';
}

function seriesKey(row) {
  if (row.category === 'cooling') return 'ac';
  if (row.category === 'lighting') return 'light';
  const text = `${row.device_type_name || ''} ${row.device_name || ''} ${row.model_number || ''}`.toLowerCase();
  if (/投影|projector|xgimi|vpl|lsp|z6x|z8x|\bh2\b|\bh3\b/.test(text)) return 'projector';
  if (row.category === 'AV') return 'tv';
  return 'other';
}

function defaultDateRange(query) {
  const endDate = new Date();
  const days = query.range === 'today' ? 1 : query.range === 'month' ? 30 : query.range === 'year' ? 365 : 7;
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - (days - 1));
  return {
    start: query.startDate || startDate.toISOString().split('T')[0],
    end: query.endDate || endDate.toISOString().split('T')[0]
  };
}

function buildPowerData(userId, query) {
  const { start, end } = defaultDateRange(query);
  const params = [userId, start, end];
  let deviceFilter = '';

  if (query.deviceId) {
    deviceFilter = ' AND ps.device_id = ?';
    params.push(query.deviceId);
  }

  const rows = db.prepare(`
    SELECT
      ps.date,
      ps.device_id,
      d.name as device_name,
      d.power_consumption_watts,
      dt.name as device_type_name,
      dt.category,
      b.name as brand_name,
      m.model_number,
      SUM(ps.runtime_minutes) as total_runtime_minutes,
      SUM(ps.power_used_kwh) as total_power_kwh,
      ROUND(SUM(ps.power_used_kwh) * 0.56, 2) as estimated_cost
    FROM power_statistics ps
    JOIN user_devices d ON ps.device_id = d.id
    JOIN device_types dt ON d.device_type_id = dt.id
    JOIN brands b ON d.brand_id = b.id
    JOIN ir_code_models m ON d.model_id = m.id
    WHERE ps.user_id = ? AND ps.date BETWEEN ? AND ?${deviceFilter}
    GROUP BY ps.date, ps.device_id
    ORDER BY ps.date ASC
  `).all(...params);

  const byDevice = {};
  const byDate = {};
  let totalPower = 0;
  let totalRuntime = 0;

  rows.forEach(row => {
    const key = seriesKey(row);
    if (!byDate[row.date]) {
      byDate[row.date] = {
        date: row.date,
        label: row.date.slice(5),
        tv: 0,
        ac: 0,
        light: 0,
        projector: 0,
        other: 0,
        total_runtime_minutes: 0,
        total_power_kwh: 0,
        total_cost: 0
      };
    }

    byDate[row.date][key] += row.total_power_kwh;
    byDate[row.date].total_runtime_minutes += row.total_runtime_minutes;
    byDate[row.date].total_power_kwh += row.total_power_kwh;
    byDate[row.date].total_cost += row.estimated_cost;

    if (!byDevice[row.device_id]) {
      byDevice[row.device_id] = {
        device_id: row.device_id,
        device_name: row.device_name,
        device_type_name: row.device_type_name,
        category: row.category,
        brand_name: row.brand_name,
        power_consumption_watts: row.power_consumption_watts,
        total_runtime_minutes: 0,
        total_power_kwh: 0,
        total_cost: 0,
        daily_data: []
      };
    }

    byDevice[row.device_id].total_runtime_minutes += row.total_runtime_minutes;
    byDevice[row.device_id].total_power_kwh += row.total_power_kwh;
    byDevice[row.device_id].total_cost += row.estimated_cost;
    byDevice[row.device_id].daily_data.push({
      date: row.date,
      runtime_minutes: row.total_runtime_minutes,
      power_kwh: row.total_power_kwh,
      cost: row.estimated_cost
    });

    totalPower += row.total_power_kwh;
    totalRuntime += row.total_runtime_minutes;
  });

  const chartData = Object.values(byDate).map(item => ({
    ...item,
    tv: Number(item.tv.toFixed(2)),
    ac: Number(item.ac.toFixed(2)),
    light: Number(item.light.toFixed(2)),
    projector: Number(item.projector.toFixed(2)),
    other: Number(item.other.toFixed(2)),
    total_power_kwh: Number(item.total_power_kwh.toFixed(2)),
    total_cost: Number(item.total_cost.toFixed(2))
  }));

  return {
    period: { start, end },
    summary: {
      total_devices: Object.keys(byDevice).length,
      total_power_kwh: Number(totalPower.toFixed(2)),
      total_runtime_minutes: totalRuntime,
      total_runtime_hours: Number((totalRuntime / 60).toFixed(2)),
      total_cost: Number(Object.values(byDevice).reduce((sum, d) => sum + d.total_cost, 0).toFixed(2))
    },
    chart_data: chartData,
    by_device: Object.values(byDevice),
    by_date: Object.values(byDate).sort((a, b) => b.date.localeCompare(a.date))
  };
}

router.get('/overview', (req, res) => {
  const { user } = req;
  const today = new Date().toISOString().split('T')[0];

  const totalDevices = db.prepare('SELECT COUNT(*) as count FROM user_devices WHERE user_id = ?').get(user.id).count;
  const onlineDevices = db.prepare(`
    SELECT COUNT(*) as count
    FROM user_devices
    WHERE user_id = ? AND last_used_at >= DATETIME('now', '-1 hour')
  `).get(user.id).count;
  const totalScenes = db.prepare('SELECT COUNT(*) as count FROM scenes WHERE user_id = ?').get(user.id).count;
  const totalSchedules = db.prepare('SELECT COUNT(*) as count FROM schedule_tasks WHERE user_id = ?').get(user.id).count;
  const todayCommands = db.prepare(`
    SELECT COUNT(*) as count
    FROM command_logs
    WHERE user_id = ? AND DATE(created_at) = ?
  `).get(user.id, today).count;
  const todayPower = db.prepare(`
    SELECT COALESCE(SUM(power_used_kwh), 0) as total
    FROM power_statistics
    WHERE user_id = ? AND date = ?
  `).get(user.id, today).total;
  const monthPower = db.prepare(`
    SELECT COALESCE(SUM(power_used_kwh), 0) as power, COUNT(DISTINCT date) as days
    FROM power_statistics
    WHERE user_id = ? AND date >= DATE('now', '-30 days')
  `).get(user.id);
  const commandStats = db.prepare(`
    SELECT COUNT(*) as total, COUNT(DISTINCT DATE(created_at)) as days
    FROM command_logs
    WHERE user_id = ? AND created_at >= DATE('now', '-30 days')
  `).get(user.id);
  const mostUsedDevice = db.prepare(`
    SELECT d.name, COUNT(*) as count
    FROM command_logs cl
    LEFT JOIN user_devices d ON cl.device_id = d.id
    WHERE cl.user_id = ? AND cl.device_id IS NOT NULL
    GROUP BY cl.device_id
    ORDER BY count DESC
    LIMIT 1
  `).get(user.id);
  const mostUsedCommand = db.prepare(`
    SELECT command, COUNT(*) as count
    FROM command_logs
    WHERE user_id = ?
    GROUP BY command
    ORDER BY count DESC
    LIMIT 1
  `).get(user.id);

  logCommand(user.id, null, null, 'stats:overview', true, null, req.networkStatus);

  res.json({
    totalDevices,
    onlineDevices,
    totalScenes,
    totalSchedules,
    todayCommands,
    powerConsumption: Number(todayPower.toFixed(2)),
    totalPower: Number(monthPower.power.toFixed(2)),
    avgDailyPower: Number((monthPower.power / Math.max(monthPower.days || 1, 1)).toFixed(2)),
    totalCommands: commandStats.total || 0,
    avgDailyCommands: Math.round((commandStats.total || 0) / Math.max(commandStats.days || 1, 1)),
    powerTrend: 'up',
    commandTrend: 'down',
    mostUsedDevice: mostUsedDevice?.name || '暂无设备',
    mostUsedCommand: mostUsedCommand?.command ? commandLabel(mostUsedCommand.command) : '暂无指令'
  });
});

router.get('/power', (req, res) => {
  const data = buildPowerData(req.user.id, req.query);
  logCommand(req.user.id, null, null, 'stats:power', true, null, req.networkStatus);
  res.json(data);
});

router.get('/usage-patterns', (req, res) => {
  const rows = db.prepare(`
    SELECT
      STRFTIME('%H', created_at) as hour,
      COUNT(*) as commands,
      COUNT(DISTINCT device_id) as devices
    FROM command_logs
    WHERE user_id = ? AND created_at >= DATETIME('now', '-30 days')
    GROUP BY STRFTIME('%H', created_at)
  `).all(req.user.id);

  const byHour = new Map(rows.map(row => [Number(row.hour), row]));
  const data = [];
  for (let hour = 0; hour < 24; hour += 2) {
    const first = byHour.get(hour);
    const second = byHour.get(hour + 1);
    data.push({
      hour: `${String(hour).padStart(2, '0')}:00`,
      commands: (first?.commands || 0) + (second?.commands || 0),
      devices: Math.max(first?.devices || 0, second?.devices || 0)
    });
  }

  res.json(data);
});

router.get('/device-usage', (req, res) => {
  const rows = db.prepare(`
    SELECT d.name, COUNT(cl.id) as value
    FROM user_devices d
    LEFT JOIN command_logs cl ON cl.device_id = d.id AND cl.user_id = d.user_id
    WHERE d.user_id = ?
    GROUP BY d.id
    ORDER BY value DESC, d.created_at DESC
    LIMIT 8
  `).all(req.user.id);

  res.json(rows.map((row, index) => ({
    name: row.name,
    value: row.value || 0,
    color: CHART_COLORS[index % CHART_COLORS.length]
  })));
});

router.get('/command-stats', (req, res) => {
  const rows = db.prepare(`
    SELECT command, COUNT(*) as count
    FROM command_logs
    WHERE user_id = ?
    GROUP BY command
    ORDER BY count DESC
    LIMIT 12
  `).all(req.user.id);

  res.json(rows.map(row => ({
    command: row.command,
    count: row.count,
    label: commandLabel(row.command)
  })));
});

router.get('/usage', (req, res) => {
  const { user } = req;
  const { deviceId } = req.query;

  let sql = `
    SELECT
      cl.command,
      cl.success,
      cl.network_status,
      COUNT(*) as count,
      cl.device_id,
      d.name as device_name,
      dt.name as device_type_name,
      dt.category,
      DATE(cl.created_at) as date
    FROM command_logs cl
    LEFT JOIN user_devices d ON cl.device_id = d.id
    LEFT JOIN device_types dt ON d.device_type_id = dt.id
    WHERE cl.user_id = ?
  `;
  const params = [user.id];

  if (deviceId) {
    sql += ' AND cl.device_id = ?';
    params.push(deviceId);
  }

  sql += `
    AND cl.created_at >= DATE('now', '-30 days')
    GROUP BY cl.command, cl.success, cl.network_status, DATE(cl.created_at), cl.device_id
    ORDER BY date DESC, count DESC
  `;

  const logs = db.prepare(sql).all(...params);
  const commandStats = {};
  const networkStats = { good: 0, moderate: 0, weak: 0, offline: 0 };
  const successRate = { total: 0, success: 0 };

  logs.forEach(log => {
    if (!commandStats[log.command]) {
      commandStats[log.command] = {
        command: log.command,
        count: 0,
        success_count: 0,
        device_id: log.device_id,
        device_name: log.device_name,
        device_type_name: log.device_type_name,
        category: log.category
      };
    }
    commandStats[log.command].count += log.count;
    if (log.success) commandStats[log.command].success_count += log.count;
    networkStats[log.network_status] = (networkStats[log.network_status] || 0) + log.count;
    successRate.total += log.count;
    if (log.success) successRate.success += log.count;
  });

  const recentActivity = db.prepare(`
    SELECT cl.*, d.name as device_name, dt.name as device_type_name
    FROM command_logs cl
    LEFT JOIN user_devices d ON cl.device_id = d.id
    LEFT JOIN device_types dt ON d.device_type_id = dt.id
    WHERE cl.user_id = ?
    ORDER BY cl.created_at DESC
    LIMIT 50
  `).all(user.id);

  logCommand(user.id, null, null, 'stats:usage', true, null, req.networkStatus);

  res.json({
    summary: {
      total_commands: successRate.total,
      success_rate: successRate.total > 0 ? Number((successRate.success / successRate.total).toFixed(4)) : 0,
      network_distribution: networkStats
    },
    top_commands: Object.values(commandStats)
      .sort((a, b) => b.count - a.count)
      .slice(0, 20)
      .map(c => ({
        ...c,
        success_rate: c.count > 0 ? Number((c.success_count / c.count).toFixed(4)) : 0
      })),
    recent_activity: recentActivity
  });
});

module.exports = router;
