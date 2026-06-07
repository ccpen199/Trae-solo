import { db } from '../models/database';

export function seedData() {
  const deviceCount = (db.prepare('SELECT COUNT(*) as count FROM devices').get() as { count: number }).count;
  if (deviceCount > 0) return;

  const adminUser = db.prepare('SELECT id FROM users WHERE username = ?').get('admin') as any;
  const userId = adminUser?.id || 1;

  const insertDevice = db.prepare(
    'INSERT INTO devices (device_id, name, brand, model, type, protocol, status, has_wifi, room, user_id, firmware_version) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  );

  const devices = [
    { device_id: 'HAI-AC-001', name: '客厅空调', brand: 'Haier', model: 'KFR-72LW/81@U1-Hc', type: 'air_conditioner', protocol: 'uhome', status: 'online', has_wifi: 1, room: '客厅', firmware_version: '2.1.3' },
    { device_id: 'CAS-WS-001', name: '卧室洗衣机', brand: 'Casarte', model: 'C1 HD10G6XU1', type: 'washer', protocol: 'wifi', status: 'online', has_wifi: 1, room: '卧室', firmware_version: '1.8.0' },
    { device_id: 'HAI-RF-001', name: '厨房冰箱', brand: 'Haier', model: 'BCD-470WDPG', type: 'fridge', protocol: 'wifi', status: 'online', has_wifi: 1, room: '厨房', firmware_version: '2.0.5' },
    { device_id: 'GE-TV-001', name: '客厅电视', brand: 'GE', model: '65Q8000', type: 'tv', protocol: 'wifi', status: 'online', has_wifi: 1, room: '客厅', firmware_version: '3.2.1' },
    { device_id: 'HAI-CT-001', name: '智能窗帘', brand: 'Haier', model: 'ZNCL-01', type: 'curtain', protocol: 'zigbee', status: 'offline', has_wifi: 0, room: '卧室', firmware_version: '1.2.0' },
    { device_id: 'CAS-LT-001', name: '客厅主灯', brand: 'Casarte', model: 'ZNSL-01', type: 'light', protocol: 'zigbee', status: 'online', has_wifi: 0, room: '客厅', firmware_version: '1.5.2' },
    { device_id: 'FP-WS-002', name: '阳台洗衣机', brand: 'Fisher&Paykel', model: 'WA8060P', type: 'washer', protocol: 'wifi', status: 'offline', has_wifi: 1, room: '阳台', firmware_version: '1.0.8' },
    { device_id: 'HAI-AC-002', name: '卧室空调', brand: 'Haier', model: 'KFR-35GW/81@U1-Hc', type: 'air_conditioner', protocol: 'uhome', status: 'online', has_wifi: 1, room: '卧室', firmware_version: '2.1.3' },
    { device_id: 'HAI-LT-002', name: '书房台灯', brand: 'Haier', model: 'ZNLT-02', type: 'light', protocol: 'matter', status: 'online', has_wifi: 1, room: '书房', firmware_version: '1.0.3' },
    { device_id: 'CAS-SN-001', name: '客厅传感器', brand: 'Casarte', model: 'ZNSN-01', type: 'sensor', protocol: 'matter', status: 'online', has_wifi: 0, room: '客厅', firmware_version: '2.0.0' }
  ];

  const deviceIds: number[] = [];
  const seedTransaction = db.transaction(() => {
    for (const d of devices) {
      const r = insertDevice.run(d.device_id, d.name, d.brand, d.model, d.type, d.protocol, d.status, d.has_wifi, d.room, userId, d.firmware_version);
      deviceIds.push(Number(r.lastInsertRowid));
    }

    const insertScene = db.prepare(
      'INSERT INTO scenes (name, description, user_id, trigger_type, trigger_config, actions, is_geek_mode, last_executed_at, execution_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );

    insertScene.run(
      '回家模式', '回家时自动开灯、开空调', userId, 'voice',
      JSON.stringify({ keyword: '我回来了' }),
      JSON.stringify([
        { device_id: deviceIds[5], command: 'turn_on', set_value: { brightness: 80 } },
        { device_id: deviceIds[0], command: 'turn_on', set_value: { temperature: 26, mode: 'cool' } }
      ]),
      0, null, 15
    );

    insertScene.run(
      '睡眠模式', '睡觉时关灯、调低空调', userId, 'voice',
      JSON.stringify({ keyword: '晚安' }),
      JSON.stringify([
        { device_id: deviceIds[5], command: 'turn_off' },
        { device_id: deviceIds[0], command: 'set', set_value: { temperature: 27, mode: 'sleep' } },
        { device_id: deviceIds[4], command: 'close' }
      ]),
      0, null, 8
    );

    insertScene.run(
      '离家模式', '离家时关闭所有设备', userId, 'condition',
      JSON.stringify({ condition: 'all_devices_offline', delay_minutes: 5 }),
      JSON.stringify([
        { device_id: deviceIds[0], command: 'turn_off' },
        { device_id: deviceIds[5], command: 'turn_off' },
        { device_id: deviceIds[4], command: 'close' },
        { device_id: deviceIds[3], command: 'turn_off' }
      ]),
      1, null, 3
    );

    const insertProduct = db.prepare(
      'INSERT INTO products (sku, name, brand, category, price, erp_stock, aftersales_parts, description, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );

    const products = [
      { sku: 'HAI-AC-KFR72', name: '海尔劲爽空调3匹', brand: 'Haier', category: 'air_conditioner', price: 6999, erp_stock: 150, aftersales_parts: 30, description: '新一级能效，自清洁', image_url: null },
      { sku: 'CAS-WS-HD10G', name: '卡萨帝洗衣机10kg', brand: 'Casarte', category: 'washer', price: 8999, erp_stock: 80, aftersales_parts: 20, description: '直驱变频，微蒸汽空气洗', image_url: null },
      { sku: 'HAI-RF-BCD470', name: '海尔冰箱470L', brand: 'Haier', category: 'fridge', price: 5499, erp_stock: 200, aftersales_parts: 50, description: '干湿分储，全空间保鲜', image_url: null },
      { sku: 'GE-TV-65Q8', name: 'GE 65寸4K电视', brand: 'GE', category: 'tv', price: 4999, erp_stock: 60, aftersales_parts: 15, description: '4K HDR，智能语音', image_url: null },
      { sku: 'FP-WS-WA8060', name: '斐雪派克洗衣机8kg', brand: 'Fisher&Paykel', category: 'washer', price: 12999, erp_stock: 25, aftersales_parts: 10, description: '直驱变频，智能投放', image_url: null }
    ];

    const productIds: number[] = [];
    for (const p of products) {
      const r = insertProduct.run(p.sku, p.name, p.brand, p.category, p.price, p.erp_stock, p.aftersales_parts, p.description, p.image_url);
      productIds.push(Number(r.lastInsertRowid));
    }

    const insertEnergy = db.prepare(
      'INSERT INTO energy_consumption (device_id, user_id, date, kwh, cost) VALUES (?, ?, ?, ?, ?)'
    );

    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 86400000);
      const dateStr = date.toISOString().split('T')[0];

      insertEnergy.run(deviceIds[0], userId, dateStr, +(3.5 + Math.random() * 2).toFixed(2), +(2.0 + Math.random() * 1.2).toFixed(2));
      insertEnergy.run(deviceIds[1], userId, dateStr, +(0.8 + Math.random() * 0.5).toFixed(2), +(0.5 + Math.random() * 0.3).toFixed(2));
      insertEnergy.run(deviceIds[2], userId, dateStr, +(1.2 + Math.random() * 0.3).toFixed(2), +(0.7 + Math.random() * 0.2).toFixed(2));
      insertEnergy.run(deviceIds[7], userId, dateStr, +(2.0 + Math.random() * 1.5).toFixed(2), +(1.1 + Math.random() * 0.8).toFixed(2));
      insertEnergy.run(deviceIds[8], userId, dateStr, +(0.3 + Math.random() * 0.2).toFixed(2), +(0.2 + Math.random() * 0.1).toFixed(2));
    }

    const weekStart = new Date(now.getTime() - 7 * 86400000).toISOString().split('T')[0];
    const weekKwh = 7 * (5.5 + 1.2 + 1.5 + 3.5);
    const weekSaved = weekKwh * 0.15;

    db.prepare(
      'INSERT INTO green_reports (user_id, period, total_kwh, saved_kwh, points_earned, report_data) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(
      userId, weekStart, +weekKwh.toFixed(2), +weekSaved.toFixed(2), Math.round(weekSaved * 10),
      JSON.stringify({
        carbon_reduction: (weekSaved * 0.785).toFixed(2),
        equivalent_trees: +(weekSaved * 0.785 / 18.3).toFixed(2),
        tips: ['空调温度设置26°C最节能', '洗衣机选择低温模式', '冰箱保持7分满最省电']
      })
    );

    const insertChannel = db.prepare('INSERT INTO channels (name, code, parent_id, level) VALUES (?, ?, ?, ?)');
    const ch1 = insertChannel.run('华东大区', 'EAST', null, 1);
    const ch1Id = Number(ch1.lastInsertRowid);
    const ch2 = insertChannel.run('华北大区', 'NORTH', null, 1);
    const ch2Id = Number(ch2.lastInsertRowid);
    insertChannel.run('上海分部', 'SH', ch1Id, 2);
    insertChannel.run('江苏分部', 'JS', ch1Id, 2);
    insertChannel.run('北京分部', 'BJ', ch2Id, 2);

    const insertBridge = db.prepare(
      'INSERT INTO ir_bridges (bridge_id, name, status, room, user_id, ip_address, last_heartbeat) VALUES (?, ?, ?, ?, ?, ?, ?)'
    );
    const bridge = insertBridge.run('IR-BR-001', '客厅红外网关', 'online', '客厅', userId, '192.168.1.100', new Date().toISOString());
    const bridgeId = Number(bridge.lastInsertRowid);

    const insertCode = db.prepare(
      'INSERT INTO ir_codes (bridge_id, device_brand, device_type, code_name, code_data) VALUES (?, ?, ?, ?, ?)'
    );
    insertCode.run(bridgeId, 'Haier', 'air_conditioner', 'power_on', 'RAW:8200,4200,500,1600,500,540,500,1600,500,540,500,540,500,540,500,1600,500');
    insertCode.run(bridgeId, 'Haier', 'air_conditioner', 'power_off', 'RAW:8200,4200,500,540,500,1600,500,540,500,1600,500,1600,500,540,500,1600,500');
    insertCode.run(bridgeId, 'Haier', 'air_conditioner', 'temp_up', 'RAW:8200,4200,500,1600,500,540,500,540,500,1600,500,540,500,1600,500,540,500');
    insertCode.run(bridgeId, 'Haier', 'air_conditioner', 'temp_down', 'RAW:8200,4200,500,540,500,1600,500,1600,500,540,500,540,500,540,500,1600,500');
    insertCode.run(bridgeId, 'GE', 'tv', 'power_toggle', 'RAW:8800,4400,550,1650,550,550,550,1650,550,550,550,550,550,550,550,1650,550');

    const insertHealth = db.prepare(
      'INSERT INTO device_health_scores (device_id, score, risk_level, analysis, prediction_days) VALUES (?, ?, ?, ?, ?)'
    );
    insertHealth.run(deviceIds[0], 85, 'low', '设备运行正常；固件版本较新', 365);
    insertHealth.run(deviceIds[1], 72, 'medium', '近期出现3次错误指标；建议关注运行状态', 180);
    insertHealth.run(deviceIds[2], 90, 'low', '设备运行正常', 365);
    insertHealth.run(deviceIds[7], 45, 'high', '固件版本过旧，建议升级；设备当前离线', 30);
    insertHealth.run(deviceIds[8], 92, 'low', 'Matter协议设备运行正常', 365);
    insertHealth.run(deviceIds[9], 88, 'low', '传感器设备正常，电量充足', 365);

    const bindChannel = db.prepare('INSERT INTO channel_device_bindings (channel_id, device_id, bound_by, permission_level) VALUES (?, ?, ?, ?)');
    bindChannel.run(ch1Id, deviceIds[0], userId, 'control');
    bindChannel.run(ch1Id, deviceIds[1], userId, 'control');
    bindChannel.run(ch1Id, deviceIds[2], userId, 'view');

    const insertPointTx = db.prepare('INSERT INTO point_transactions (user_id, points, type, reason, balance_after, created_at) VALUES (?, ?, ?, ?, ?, ?)');
    insertPointTx.run(userId, 500, 'earn', '节能奖励-空调智能调温', 500, new Date(now.getTime() - 6*86400000).toISOString());
    insertPointTx.run(userId, 300, 'earn', '绿色生活-月度积分', 800, new Date(now.getTime() - 5*86400000).toISOString());
    insertPointTx.run(userId, 200, 'earn', '设备绑定奖励', 1000, new Date(now.getTime() - 4*86400000).toISOString());
    insertPointTx.run(userId, 150, 'spend', '积分兑换-空调滤网清洗券', 850, new Date(now.getTime() - 3*86400000).toISOString());
    insertPointTx.run(userId, 380, 'earn', '推荐好友注册', 1230, new Date(now.getTime() - 2*86400000).toISOString());
    insertPointTx.run(userId, 850, 'earn', '能耗达标-环比节电15%', 2080, new Date(now.getTime() - 86400000).toISOString());
    insertPointTx.run(userId, 500, 'earn', '固件升级参与奖励', 2580, now.toISOString());

    const insertService = db.prepare('INSERT INTO service_orders (order_no, device_id, user_id, type, status, fault_description, diagnosis_result, progress, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
    insertService.run('SVC-20260601-001', deviceIds[1], userId, 'repair', 'diagnosing', '洗衣机脱水时异响', '初步诊断：轴承磨损', '已指派工程师，预计今日上门', new Date(now.getTime() - 86400000).toISOString());
    insertService.run('SVC-20260601-002', deviceIds[6], userId, 'maintenance', 'pending', '阳台洗衣机无法启动', null, '等待工程师接单', now.toISOString());

    const insertFirmware = db.prepare('INSERT INTO firmware_releases (version, device_model, description, is_gray, gray_percentage, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)');
    const fw1 = insertFirmware.run('2.2.0', 'KFR-72LW/81@U1-Hc', '优化温控算法，降低待机功耗15%', 1, 30, 'published', new Date(now.getTime() - 3*86400000).toISOString());
    db.prepare('INSERT INTO firmware_updates (device_id, firmware_id, status, started_at) VALUES (?, ?, ?, ?)').run(deviceIds[0], Number(fw1.lastInsertRowid), 'pending', now.toISOString());

    db.prepare('INSERT INTO device_metrics (device_id, metric_key, metric_value, timestamp) VALUES (?, ?, ?, ?)').run(deviceIds[0], 'discovery_scan', 3, new Date(now.getTime() - 3600000).toISOString());
  });

  seedTransaction();

  db.prepare("UPDATE users SET membership_level = 'gold', points = 2580 WHERE username = 'admin'").run();
  db.prepare("UPDATE users SET membership_level = 'silver', points = 800 WHERE username = 'user'").run();

  console.log('✅ 种子数据初始化完成');
}
