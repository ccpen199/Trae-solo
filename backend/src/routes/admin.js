const express = require('express');
const db = require('../database');

const router = express.Router();

router.get('/health/devices', (req, res) => {
  const now = Date.now();
  const oneHourAgo = now - 60 * 60 * 1000;
  const oneDayAgo = now - 24 * 60 * 60 * 1000;
  
  const devices = db.prepare(`
    SELECT d.*, 
      (SELECT COUNT(*) FROM device_heartbeats dh WHERE dh.device_id = d.id AND dh.status = 'offline' AND dh.timestamp > ?) as offline_count_24h,
      (SELECT MAX(timestamp) FROM device_heartbeats dh WHERE dh.device_id = d.id) as last_heartbeat_time
    FROM devices d
  `).all(oneDayAgo).map(d => {
    let healthScore = 100;
    
    if (d.status === 'offline') healthScore -= 50;
    healthScore -= (d.offline_count_24h || 0) * 10;
    
    const versionParts = (d.firmware_version || '0.0.0').split('.').map(n => parseInt(n));
    if (versionParts[0] < 2) healthScore -= 20;
    
    const lastHb = d.last_heartbeat_time || 0;
    if (now - lastHb > oneHourAgo) healthScore -= 15;
    
    return {
      ...d,
      healthScore: Math.max(0, healthScore),
      needsUpdate: (versionParts[0] || 0) < 2,
      warnings: [
        d.status === 'offline' && '设备离线',
        (d.offline_count_24h || 0) > 3 && '频繁离线',
        (versionParts[0] || 0) < 2 && '固件版本过旧',
        now - lastHb > oneHourAgo && '心跳超时'
      ].filter(Boolean)
    };
  });
  
  const summary = {
    total: devices.length,
    online: devices.filter(d => d.status === 'online').length,
    offline: devices.filter(d => d.status === 'offline').length,
    needsUpdate: devices.filter(d => d.needsUpdate).length,
    avgHealth: Math.round(devices.reduce((sum, d) => sum + d.healthScore, 0) / devices.length),
    unhealthyCount: devices.filter(d => d.healthScore < 80).length
  };
  
  res.json({ success: true, data: { devices, summary } });
});

router.post('/health/log', (req, res) => {
  const { deviceId, offlineCount, firmwareOutdated, healthScore } = req.body;
  const now = Date.now();
  
  db.prepare(`
    INSERT INTO device_health_logs (device_id, offline_count, firmware_outdated, health_score, timestamp)
    VALUES (?, ?, ?, ?, ?)
  `).run(deviceId, offlineCount || 0, firmwareOutdated ? 1 : 0, healthScore || 100, now);
  
  res.json({ success: true });
});

router.get('/parental/status', (req, res) => {
  const status = db.prepare('SELECT * FROM parental_controls ORDER BY id DESC LIMIT 1').get();
  
  if (!status) {
    return res.json({ success: true, data: null });
  }
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const needsReset = status.last_reset < today.getTime();
  
  let usedTime = status.used_time;
  if (needsReset) {
    usedTime = 0;
    db.prepare('UPDATE parental_controls SET used_time = 0, last_reset = ? WHERE id = ?')
      .run(Date.now(), status.id);
  }
  
  res.json({
    success: true,
    data: {
      ...status,
      usedTime,
      remainingTime: Math.max(0, status.daily_time_limit - usedTime),
      usagePercent: Math.min(100, Math.round(usedTime / status.daily_time_limit * 100))
    }
  });
});

router.post('/parental/update', (req, res) => {
  const { dailyTimeLimit, contentRating, usedTime } = req.body;
  const now = Date.now();
  
  const existing = db.prepare('SELECT * FROM parental_controls ORDER BY id DESC LIMIT 1').get();
  
  if (existing) {
    const updates = [];
    const params = [];
    
    if (dailyTimeLimit !== undefined) { updates.push('daily_time_limit = ?'); params.push(dailyTimeLimit); }
    if (contentRating !== undefined) { updates.push('content_rating = ?'); params.push(contentRating); }
    if (usedTime !== undefined) { updates.push('used_time = ?'); params.push(usedTime); }
    updates.push('last_reset = ?'); params.push(now);
    
    params.push(existing.id);
    
    db.prepare(`UPDATE parental_controls SET ${updates.join(', ')} WHERE id = ?`).run(...params);
  } else {
    db.prepare(`
      INSERT INTO parental_controls (user_id, daily_time_limit, used_time, content_rating, last_reset)
      VALUES (?, ?, ?, ?, ?)
    `).run('default', dailyTimeLimit || 120, 0, contentRating || 'all', now);
  }
  
  res.json({ success: true });
});

router.get('/dashboard/summary', (req, res) => {
  const now = Date.now();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const oneHourAgo = now - 60 * 60 * 1000;
  const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
  
  const deviceStats = db.prepare(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN status = 'online' THEN 1 ELSE 0 END) as online,
      SUM(CASE WHEN status = 'offline' THEN 1 ELSE 0 END) as offline
    FROM devices
  `).get();
  
  const deviceHealthStats = db.prepare(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN status = 'offline' THEN 1 ELSE 0 END) as offline_count,
      SUM(CASE WHEN last_heartbeat < ? THEN 1 ELSE 0 END) as heartbeat_timeout,
      SUM(CASE WHEN CAST(SUBSTR(firmware_version, 1, 1) AS INTEGER) < 2 THEN 1 ELSE 0 END) as outdated_firmware
    FROM devices
  `).all(oneHourAgo)[0];
  
  const healthWarnings = [
    deviceHealthStats.offline_count > 0 && `${deviceHealthStats.offline_count}台设备离线`,
    deviceHealthStats.heartbeat_timeout > 0 && `${deviceHealthStats.heartbeat_timeout}台心跳超时`,
    deviceHealthStats.outdated_firmware > 0 && `${deviceHealthStats.outdated_firmware}台固件过旧`
  ].filter(Boolean);
  
  const avgHealthScore = deviceStats.total > 0 
    ? Math.round((deviceStats.online / deviceStats.total) * 100)
    : 0;
  
  const systemStatus = avgHealthScore >= 80 ? 'healthy' : 
                       avgHealthScore >= 50 ? 'warning' : 'critical';
  
  const sceneStats = db.prepare(`
    SELECT 
      COUNT(*) as total_scenes,
      SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_scenes
    FROM scenes
  `).get();
  
  const execStats = db.prepare(`
    SELECT 
      COUNT(*) as executions_today,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as successful_executions,
      SUM(CASE WHEN status = 'partial_success' THEN 1 ELSE 0 END) as partial_executions,
      SUM(CASE WHEN status = 'failed' OR status = 'rolled_back' THEN 1 ELSE 0 END) as failed_executions
    FROM scene_executions
    WHERE started_at >= ?
  `).get(today.getTime());
  
  const voiceStats = db.prepare(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN fuzzy_corrected = 1 THEN 1 ELSE 0 END) as fuzzy_corrected,
      SUM(CASE WHEN multi_turn = 1 THEN 1 ELSE 0 END) as multi_turn
    FROM voice_commands
    WHERE timestamp >= ?
  `).get(today.getTime());
  
  const shoppingStats = db.prepare(`
    SELECT 
      COUNT(*) as orders_today,
      COALESCE(SUM(total_amount), 0) as total_spent
    FROM shopping_orders
    WHERE created_at >= ? AND status = 'paid'
  `).get(today.getTime());
  
  const accountStats = db.prepare('SELECT balance FROM family_accounts WHERE user_id = ?').get('default');
  
  const parentalStats = db.prepare(`
    SELECT * FROM parental_controls ORDER BY id DESC LIMIT 1
  `).get();
  
  const contentStats = db.prepare(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN content_rating = 'children' THEN 1 ELSE 0 END) as children_content
    FROM content_services
  `).get();
  
  const dailyTrend = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const dayStart = d.getTime();
    const dayEnd = dayStart + 24 * 60 * 60 * 1000;
    
    const dayConsumption = 2 + Math.random() * 3 + i * 0.5;
    dailyTrend.push({
      date: `${d.getMonth() + 1}/${d.getDate()}`,
      value: Math.round(dayConsumption * 10) / 10
    });
  }
  
  const byRoom = db.prepare(`
    SELECT 
      r.name as room,
      COALESCE(SUM(em.total_consumption), 0) as value
    FROM rooms r
    LEFT JOIN energy_meters em ON em.room_id = r.id
    GROUP BY r.id, r.name
  `).all().map(r => ({
    room: r.room,
    value: Math.round((r.value || (Math.random() * 5 + 2)) * 10) / 10
  }));
  
  const totalConsumption = dailyTrend.reduce((sum, d) => sum + d.value, 0);
  
  const healthLogs = db.prepare(`
    SELECT 
      dhl.*,
      d.name as device_name
    FROM device_health_logs dhl
    LEFT JOIN devices d ON d.id = dhl.device_id
    ORDER BY dhl.timestamp DESC
    LIMIT 10
  `).all();
  
  const activeWarnings = db.prepare(`
    SELECT 
      d.id,
      d.name,
      d.status,
      d.last_heartbeat,
      d.firmware_version,
      dhl.health_score,
      dhl.status_change,
      dhl.timestamp as warning_time,
      dhl.resolved
    FROM devices d
    LEFT JOIN device_health_logs dhl ON dhl.device_id = d.id
    WHERE d.status = 'offline' 
       OR d.last_heartbeat < ?
       OR CAST(SUBSTR(d.firmware_version, 1, 1) AS INTEGER) < 2
    GROUP BY d.id
    ORDER BY dhl.timestamp DESC
  `).all(oneHourAgo).map(d => ({
    ...d,
    warnings: [
      d.status === 'offline' && '设备离线',
      d.last_heartbeat < oneHourAgo && '心跳超时',
      parseInt(d.firmware_version?.[0] || '0') < 2 && '固件过旧'
    ].filter(Boolean),
    resolved: d.resolved === 1
  }));
  
  res.json({
    success: true,
    data: {
      systemStatus,
      healthWarnings,
      avgHealthScore,
      devices: {
        total: deviceStats.total,
        online: deviceStats.online,
        offline: deviceStats.offline,
        onlineRate: deviceStats.total > 0 ? Math.round(deviceStats.online / deviceStats.total * 100) : 0
      },
      scenes: {
        total: sceneStats.total_scenes,
        active: sceneStats.active_scenes
      },
      executions: {
        today: execStats.executions_today,
        successful: execStats.successful_executions,
        partial: execStats.partial_executions,
        failed: execStats.failed_executions,
        successRate: execStats.executions_today > 0 
          ? Math.round(execStats.successful_executions / execStats.executions_today * 100) 
          : 0
      },
      voice: {
        commandsToday: voiceStats.total,
        fuzzyCorrected: voiceStats.fuzzy_corrected,
        multiTurn: voiceStats.multi_turn
      },
      shopping: {
        ordersToday: shoppingStats.orders_today,
        totalSpent: shoppingStats.total_spent,
        balance: accountStats?.balance || 0
      },
      parental: parentalStats ? {
        dailyLimit: parentalStats.daily_time_limit,
        usedTime: parentalStats.used_time,
        contentRating: parentalStats.content_rating,
        remainingTime: Math.max(0, parentalStats.daily_time_limit - parentalStats.used_time),
        usagePercent: Math.min(100, Math.round(parentalStats.used_time / parentalStats.daily_time_limit * 100))
      } : null,
      content: {
        total: contentStats.total,
        childrenContent: contentStats.children_content
      },
      energyDailyTrend: dailyTrend,
      energyByRoom: byRoom,
      totalConsumption: Math.round(totalConsumption * 10) / 10,
      healthLogs,
      activeWarnings
    }
  });
});

router.get('/content/list', (req, res) => {
  const content = db.prepare('SELECT * FROM content_services ORDER BY created_at DESC').all().map(c => ({
    ...c,
    cdn_strategy: JSON.parse(c.cdn_strategy || '{}')
  }));
  
  res.json({ success: true, data: content });
});

router.post('/content', (req, res) => {
  const { name, copyrightHolder, licenseStart, licenseEnd, cdnStrategy, contentRating } = req.body;
  const id = `content-${Date.now()}`;
  const now = Date.now();
  
  db.prepare(`
    INSERT INTO content_services (id, name, copyright_holder, license_start, license_end, cdn_strategy, content_rating, is_active, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
  `).run(id, name, copyrightHolder, licenseStart, licenseEnd, JSON.stringify(cdnStrategy || {}), contentRating || 'all', now, now);
  
  res.json({ success: true, data: { id } });
});

router.get('/shopping/account', (req, res) => {
  const account = db.prepare('SELECT * FROM family_accounts WHERE user_id = ?').get('default');
  
  res.json({
    success: true,
    data: account ? {
      id: account.id,
      balance: account.balance,
      dailyLimit: account.daily_limit
    } : null
  });
});

router.post('/shopping/account/recharge', (req, res) => {
  const { amount } = req.body;
  const now = Date.now();
  
  db.prepare('UPDATE family_accounts SET balance = balance + ?, updated_at = ? WHERE user_id = ?')
    .run(amount, now, 'default');
  
  const account = db.prepare('SELECT * FROM family_accounts WHERE user_id = ?').get('default');
  
  res.json({ success: true, data: { balance: account.balance } });
});

router.get('/shopping/orders', (req, res) => {
  const orders = db.prepare('SELECT * FROM shopping_orders ORDER BY created_at DESC LIMIT 50').all();
  res.json({ success: true, data: orders });
});

router.post('/shopping/order', (req, res) => {
  const { 
    itemName, itemId, product_name, product_id,
    quantity = 1, price, totalAmount, tmallItemId, accountId, voiceTriggered = false 
  } = req.body;
  const id = `order-${Date.now()}`;
  const now = Date.now();
  const userId = accountId || 'default';
  const amount = totalAmount || price || 0;
  const name = itemName || product_name || '未命名商品';
  const item_id = itemId || product_id || tmallItemId || 'unknown';
  
  db.prepare('BEGIN').run();
  
  try {
    const account = db.prepare('SELECT * FROM family_accounts WHERE user_id = ?').get(userId);
    
    if (!account || account.balance < amount) {
      db.prepare('ROLLBACK').run();
      return res.status(400).json({ success: false, error: '账户余额不足' });
    }
    
    db.prepare(`
      INSERT INTO shopping_orders (id, user_id, tmall_item_id, item_name, quantity, total_amount, status, voice_triggered, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?)
    `).run(id, userId, tmallItemId || item_id, name, quantity, amount, voiceTriggered ? 1 : 0, now);
    
    db.prepare('UPDATE family_accounts SET balance = balance - ?, updated_at = ? WHERE user_id = ?')
      .run(amount, now, userId);
    
    db.prepare('UPDATE shopping_orders SET status = ? WHERE id = ?').run('paid', id);
    
    const newAccount = db.prepare('SELECT * FROM family_accounts WHERE user_id = ?').get(userId);
    
    db.prepare('COMMIT').run();
    
    res.json({ 
      success: true, 
      data: { 
        orderId: id, 
        status: 'paid',
        newBalance: newAccount.balance
      } 
    });
  } catch (e) {
    db.prepare('ROLLBACK').run();
    res.status(500).json({ success: false, error: e.message });
  }
});

module.exports = router;
