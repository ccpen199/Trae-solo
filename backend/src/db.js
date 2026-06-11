const Database = require('better-sqlite3');
const path = require('path');
require('dotenv').config();

const dbPath = process.env.DATABASE_PATH || './data/app.sqlite';
const fullDbPath = path.resolve(__dirname, '..', dbPath);

const db = new Database(fullDbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT UNIQUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS device_types (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL CHECK(category IN ('cooling', 'AV', 'lighting', 'other')),
      icon TEXT
    );

    CREATE TABLE IF NOT EXISTS brands (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      logo TEXT,
      device_type_id INTEGER,
      FOREIGN KEY (device_type_id) REFERENCES device_types(id)
    );

    CREATE TABLE IF NOT EXISTS ir_code_models (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      brand_id INTEGER NOT NULL,
      model_number TEXT NOT NULL,
      device_type_id INTEGER NOT NULL,
      code_format TEXT NOT NULL,
      frequency INTEGER NOT NULL DEFAULT 38000,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      version TEXT DEFAULT '1.0.0',
      FOREIGN KEY (brand_id) REFERENCES brands(id),
      FOREIGN KEY (device_type_id) REFERENCES device_types(id)
    );

    CREATE TABLE IF NOT EXISTS ir_codes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ir_code_model_id INTEGER NOT NULL,
      command_name TEXT NOT NULL,
      code_data TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (ir_code_model_id) REFERENCES ir_code_models(id)
    );

    CREATE TABLE IF NOT EXISTS user_devices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      device_type_id INTEGER NOT NULL,
      brand_id INTEGER NOT NULL,
      model_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      room TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_used_at DATETIME,
      status TEXT DEFAULT 'online' CHECK(status IN ('online', 'offline')),
      power_consumption_watts INTEGER DEFAULT 0,
      daily_usage_hours REAL DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (device_type_id) REFERENCES device_types(id),
      FOREIGN KEY (brand_id) REFERENCES brands(id),
      FOREIGN KEY (model_id) REFERENCES ir_code_models(id)
    );

    CREATE TABLE IF NOT EXISTS device_bindings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      primary_device_id INTEGER NOT NULL,
      secondary_device_id INTEGER NOT NULL,
      relation_type TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (primary_device_id) REFERENCES user_devices(id),
      FOREIGN KEY (secondary_device_id) REFERENCES user_devices(id)
    );
cscenes: rollback_strategy TEXT DEFAULT 'stop'
scenes: retry_count INTEGER DEFAULT 1
scenes: action_count INTEGER DEFAULT 0
scene_actions: retry_count INTEGER DEFAULT 1scenes: rollback_strategy TEXT DEFAULT 'stop'
scenes: retry_count INTEGER DEFAULT 1
scenes: action_count INTEGER DEFAULT 0
scene_actions: retry_count INTEGER DEFAULT 1scenes: rollback_strategy TEXT DEFAULT 'stop'
scenes: retry_count INTEGER DEFAULT 1
scenes: action_count INTEGER DEFAULT 0
scene_actions: retry_count INTEGER DEFAULT 1scenes: rollback_strategy TEXT DEFAULT 'stop'
scenes: retry_count INTEGER DEFAULT 1
scenes: action_count INTEGER DEFAULT 0
scene_actions: retry_count INTEGER DEFAULT 1typeDisplayName: device.device_type_name || device.type_name || '-'typeDisplayName: device.device_type_name || device.type_name || '-'typeDisplayName: device.device_type_name || device.type_name || '-'typeDisplayName: device.device_type_name || device.type_name || '-'E:TRIMARY KEY AUT??CNbik?NTEGER??
      error_message TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      network_status TEXT DEFAULT 'good',
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (device_id) REFERENCES user_devices(id),
      FOREIGN KEY (ir_code_id) REFERENCES ir_codes(id)
    );

    CREATE TABLE IF NOT EXISTS ir_code_versions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      brand_id INTEGER NOT NULL,
      version_number TEXT NOT NULL,
      description TEXT,
      release_date DATE,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (brand_id) REFERENCES brands(id)
    );

    CREATE TABLE IF NOT EXISTS learned_ir_codes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      device_id INTEGER NOT NULL,
      command_name TEXT NOT NULL,
      raw_code_data TEXT NOT NULL,
      matched_model_id INTEGER,
      confidence_score REAL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (device_id) REFERENCES user_devices(id),
      FOREIGN KEY (matched_model_id) REFERENCES ir_code_models(id)
    );

    CREATE TABLE IF NOT EXISTS error_feedbacks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      device_id INTEGER,
      error_type TEXT NOT NULL,
      description TEXT,
      frequency_count INTEGER DEFAULT 1,
      status TEXT DEFAULT 'open' CHECK(status IN ('open', 'closed')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      resolved_at DATETIME,
      resolution TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (device_id) REFERENCES user_devices(id)
    );

    CREATE TABLE IF NOT EXISTS offline_cache (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cache_key TEXT UNIQUE NOT NULL,
      cache_data TEXT NOT NULL,
      expires_at DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

function seedData() {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount > 0) return;

  const insertUser = db.prepare('INSERT INTO users (name, phone) VALUES (?, ?)');
  const users = [
    ['张三', '13800138001'],
    ['李四', '13800138002'],
    ['王五', '13800138003']
  ];
  users.forEach(u => insertUser.run(u[0], u[1]));

  const insertDeviceType = db.prepare('INSERT INTO device_types (name, category, icon) VALUES (?, ?, ?)');
  const deviceTypes = [
    ['空调', 'cooling', 'ac'],
    ['电视', 'AV', 'tv'],
    ['灯光', 'lighting', 'lightbulb'],
    ['投影仪', 'AV', 'projector']
  ];
  deviceTypes.forEach(dt => insertDeviceType.run(dt[0], dt[1], dt[2]));

  const insertBrand = db.prepare('INSERT INTO brands (name, logo, device_type_id) VALUES (?, ?, ?)');
  const brands = [
    ['美的', 'midea', 1],
    ['格力', 'gree', 1],
    ['海尔', 'haier', 1],
    ['小米', 'xiaomi', 1],
    ['索尼', 'sony', 2],
    ['三星', 'samsung', 2],
    ['TCL', 'tcl', 2],
    ['飞利浦', 'philips', 3],
    ['欧普', 'opple', 3],
    ['极米', 'xgimi', 4]
  ];
  brands.forEach(b => insertBrand.run(b[0], b[1], b[2]));

  const insertModel = db.prepare('INSERT INTO ir_code_models (brand_id, model_number, device_type_id, code_format, frequency, version) VALUES (?, ?, ?, ?, ?, ?)');
  const models = [
    [1, 'KFR-26GW', 1, 'NEC', 38000, '1.0.0'],
    [1, 'KFR-35GW', 1, 'NEC', 38000, '1.1.0'],
    [1, 'KFR-51LW', 1, 'NEC', 38000, '1.0.0'],
    [2, 'KFR-26GW/NhAa1', 1, 'RC5', 38000, '1.0.0'],
    [2, 'KFR-35GW/NhAa1', 1, 'RC5', 38000, '1.2.0'],
    [2, 'KFR-72LW/NhAa1', 1, 'RC5', 38000, '1.0.0'],
    [3, 'KFR-26GW/03JDM81A', 1, 'SIRC', 38000, '1.0.0'],
    [3, 'KFR-35GW/03JDM81A', 1, 'SIRC', 38000, '1.1.0'],
    [4, 'KFR-26GW/F3W1', 1, 'NEC', 38000, '1.0.0'],
    [4, 'KFR-35GW/F3W1', 1, 'NEC', 38000, '1.0.0'],
    [5, 'KD-55X8500G', 2, 'SIRC', 40000, '1.0.0'],
    [5, 'KD-65X8500G', 2, 'SIRC', 40000, '1.1.0'],
    [5, 'KD-75X8500G', 2, 'SIRC', 40000, '1.0.0'],
    [6, 'UA55RU7700', 2, 'RC5', 38000, '1.0.0'],
    [6, 'UA65RU7700', 2, 'RC5', 38000, '1.0.0'],
    [6, 'UA75RU7700', 2, 'RC5', 38000, '1.2.0'],
    [7, '55C79', 2, 'NEC', 38000, '1.0.0'],
    [7, '65C79', 2, 'NEC', 38000, '1.1.0'],
    [7, '75C79', 2, 'NEC', 38000, '1.0.0'],
    [8, 'HUE-white', 3, 'Zigbee', 38000, '1.0.0'],
    [8, 'HUE-color', 3, 'Zigbee', 38000, '1.2.0'],
    [8, 'HUE-ambiance', 3, 'Zigbee', 38000, '1.0.0'],
    [9, 'MX650', 3, 'WiFi', 38000, '1.0.0'],
    [9, 'MX800', 3, 'WiFi', 38000, '1.1.0'],
    [10, 'H2', 4, 'NEC', 38000, '1.0.0'],
    [10, 'H3', 4, 'NEC', 38000, '1.0.0'],
    [10, 'Z6X', 4, 'NEC', 38000, '1.2.0'],
    [10, 'Z8X', 4, 'NEC', 38000, '1.0.0'],
    [5, 'VPL-VW298', 4, 'SIRC', 40000, '1.0.0'],
    [6, 'SP-LSP9T', 4, 'RC5', 38000, '1.1.0']
  ];
  models.forEach(m => insertModel.run(m[0], m[1], m[2], m[3], m[4], m[5]));

  const insertCode = db.prepare('INSERT INTO ir_codes (ir_code_model_id, command_name, code_data) VALUES (?, ?, ?)');
  const acCommands = ['power', 'temp_up', 'temp_down', 'mode_cool', 'mode_heat', 'mode_dry', 'mode_auto', 'fan_low', 'fan_mid', 'fan_high', 'swing_on', 'swing_off', 'sleep', 'turbo', 'eco'];
  const tvCommands = ['power', 'volume_up', 'volume_down', 'channel_up', 'channel_down', 'mute', 'input_hdmi1', 'input_hdmi2', 'input_tv', 'menu', 'ok', 'up', 'down', 'left', 'right', 'back', 'home', 'netflix', 'youtube', 'settings'];
  const lightCommands = ['power', 'brightness_up', 'brightness_down', 'color_warm', 'color_cool', 'mode_romantic', 'mode_reading', 'mode_movie', 'timer_30min', 'timer_60min'];
  const projectorCommands = ['power', 'focus_near', 'focus_far', 'zoom_in', 'zoom_out', 'keystone_up', 'keystone_down', 'input_hdmi', 'input_usb', 'menu', 'ok', 'mute', 'volume_up', 'volume_down', 'eco_mode', 'lamp_on', 'lamp_off'];

  for (let modelId = 1; modelId <= 30; modelId++) {
    let commands;
    if (modelId <= 10) commands = acCommands;
    else if (modelId <= 18) commands = tvCommands;
    else if (modelId <= 24) commands = lightCommands;
    else commands = projectorCommands;

    commands.forEach(cmd => {
      const codeData = Buffer.from(`model_${modelId}_cmd_${cmd}_${Date.now()}`).toString('base64');
      insertCode.run(modelId, cmd, codeData);
    });
  }

  const insertUserDevice = db.prepare('INSERT INTO user_devices (user_id, device_type_id, brand_id, model_id, name, room, power_consumption_watts, daily_usage_hours) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
  const userDevices = [
    [1, 1, 1, 1, '客厅空调', '客厅', 1200, 4.5],
    [1, 1, 2, 4, '卧室空调', '主卧', 1000, 6.0],
    [1, 2, 5, 11, '客厅电视', '客厅', 150, 3.0],
    [1, 3, 8, 20, '客厅主灯', '客厅', 80, 5.0],
    [1, 4, 10, 25, '客厅投影仪', '客厅', 300, 2.0],
    [2, 1, 3, 7, '书房空调', '书房', 900, 3.0],
    [2, 2, 6, 14, '卧室电视', '主卧', 120, 2.5],
    [2, 3, 9, 23, '书房台灯', '书房', 40, 4.0],
    [3, 1, 4, 9, '客厅空调', '客厅', 1100, 5.0],
    [3, 2, 7, 17, '客厅电视', '客厅', 180, 4.0],
    [3, 3, 8, 21, '卧室灯', '主卧', 60, 6.0],
    [3, 4, 10, 27, '家庭影院投影', '影音室', 350, 1.5]
  ];
  userDevices.forEach(d => insertUserDevice.run(d[0], d[1], d[2], d[3], d[4], d[5], d[6], d[7]));

  const insertBinding = db.prepare('INSERT INTO device_bindings (user_id, primary_device_id, secondary_device_id, relation_type) VALUES (?, ?, ?, ?)');
  const bindings = [
    [1, 1, 4, 'room_sync'],
    [1, 3, 4, 'room_sync'],
    [1, 3, 5, 'entertainment'],
    [2, 6, 8, 'room_sync'],
    [3, 9, 11, 'room_sync'],
    [3, 10, 12, 'entertainment']
  ];
  bindings.forEach(b => insertBinding.run(b[0], b[1], b[2], b[3]));

  const insertScene = db.prepare('INSERT INTO scenes (user_id, name, description, icon, is_active) VALUES (?, ?, ?, ?, ?)');
  const scenes = [
    [1, '回家模式', '开启客厅空调、灯光和电视', 'home', 1],
    [1, '离家模式', '关闭所有设备', 'exit', 1],
    [1, '观影模式', '打开投影、调暗灯光', 'movie', 1],
    [1, '睡眠模式', '关闭主灯、开启睡眠空调', 'moon', 1],
    [2, '阅读模式', '打开台灯、调节适宜亮度', 'book', 1],
    [2, '工作模式', '开启书房空调和台灯', 'briefcase', 1],
    [3, '派对模式', '开启所有灯光和娱乐设备', 'party', 1],
    [3, '节能模式', '降低所有设备功率', 'leaf', 1]
  ];
  scenes.forEach(s => insertScene.run(s[0], s[1], s[2], s[3], s[4]));

  const insertSceneAction = db.prepare('INSERT INTO scene_actions (scene_id, device_id, command, params, delay_seconds, order_index) VALUES (?, ?, ?, ?, ?, ?)');
  const sceneActions = [
    [1, 1, 'power', '{"state":"on","temp":26}', 0, 0],
    [1, 4, 'power', '{"state":"on","brightness":80}', 1, 1],
    [1, 3, 'power', '{"state":"on","input":"hdmi1"}', 2, 2],
    [2, 1, 'power', '{"state":"off"}', 0, 0],
    [2, 2, 'power', '{"state":"off"}', 0, 1],
    [2, 3, 'power', '{"state":"off"}', 0, 2],
    [2, 4, 'power', '{"state":"off"}', 0, 3],
    [2, 5, 'power', '{"state":"off"}', 0, 4],
    [3, 5, 'power', '{"state":"on"}', 0, 0],
    [3, 4, 'brightness_down', '{"target":20}', 2, 1],
    [3, 3, 'power', '{"state":"off"}', 3, 2],
    [4, 4, 'power', '{"state":"off"}', 0, 0],
    [4, 2, 'sleep', '{"temp":27}', 1, 1],
    [5, 8, 'mode_reading', '{"brightness":60}', 0, 0],
    [6, 6, 'power', '{"state":"on","temp":24}', 0, 0],
    [6, 8, 'power', '{"state":"on","brightness":70}', 1, 1],
    [7, 11, 'mode_romantic', '{}', 0, 0],
    [7, 10, 'power', '{"state":"on"}', 1, 1],
    [7, 12, 'power', '{"state":"on"}', 2, 2],
    [8, 9, 'eco', '{"state":"on"}', 0, 0],
    [8, 10, 'eco', '{"state":"on"}', 0, 1],
    [8, 11, 'brightness_down', '{"target":30}', 1, 2]
  ];
  sceneActions.forEach(a => insertSceneAction.run(a[0], a[1], a[2], JSON.stringify(a[3]), a[4], a[5]));

  const insertSchedule = db.prepare('INSERT INTO schedule_tasks (user_id, device_id, scene_id, action_type, cron_expression, target_time, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)');
  const schedules = [
    [1, null, 1, 'scene', '0 30 18 * * 1-5', null, 1],
    [1, null, 2, 'scene', '0 0 9 * * 1-5', null, 1],
    [1, 1, null, 'device', '0 0 22 * * *', null, 1],
    [1, null, 4, 'scene', '0 30 22 * * *', null, 1],
    [2, null, 6, 'scene', '0 0 9 * * 1-5', null, 1],
    [2, 6, null, 'device', '0 0 22 * * *', null, 1],
    [3, null, 7, 'scene', '0 0 20 * * 6,0', null, 1],
    [3, 9, null, 'device', '0 30 7 * * *', null, 1]
  ];
  schedules.forEach(s => insertSchedule.run(s[0], s[1], s[2], s[3], s[4], s[5], s[6]));

  const insertStats = db.prepare('INSERT INTO power_statistics (user_id, device_id, date, runtime_minutes, power_used_kwh) VALUES (?, ?, ?, ?, ?)');
  const today = new Date();
  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    for (let deviceId = 1; deviceId <= 12; deviceId++) {
      const runtime = Math.floor(Math.random() * 300) + 60;
      const power = (runtime / 60) * (0.5 + Math.random() * 1.5);
      const userId = deviceId <= 5 ? 1 : (deviceId <= 8 ? 2 : 3);
      insertStats.run(userId, deviceId, dateStr, runtime, Number(power.toFixed(2)));
    }
  }

  const insertCodeVersion = db.prepare('INSERT INTO ir_code_versions (brand_id, version_number, description, release_date, is_active) VALUES (?, ?, ?, ?, ?)');
  const codeVersions = [
    [1, '1.0.0', '初始版本，支持基础功能', '2023-01-15', 1],
    [1, '1.1.0', '新增ECO模式和睡眠模式', '2023-06-20', 1],
    [2, '1.0.0', '初始版本', '2023-02-10', 1],
    [2, '1.2.0', '优化静音模式代码', '2023-08-15', 1],
    [3, '1.0.0', '初始版本', '2023-03-05', 1],
    [3, '1.1.0', '新增智能送风功能', '2023-09-10', 1],
    [5, '1.0.0', '初始版本', '2023-01-20', 1],
    [5, '1.1.0', '新增流媒体快捷键', '2023-07-25', 1],
    [6, '1.0.0', '初始版本', '2023-02-28', 1],
    [6, '1.2.0', '修复HDMI切换问题', '2023-10-05', 1],
    [8, '1.0.0', '初始版本', '2023-04-15', 1],
    [8, '1.2.0', '新增场景模式支持', '2023-11-20', 1],
    [10, '1.0.0', '初始版本', '2023-05-10', 1],
    [10, '1.2.0', '优化自动对焦代码', '2023-12-01', 1]
  ];
  codeVersions.forEach(v => insertCodeVersion.run(v[0], v[1], v[2], v[3], v[4]));

  const insertFeedback = db.prepare('INSERT INTO error_feedbacks (user_id, device_id, error_type, description, frequency_count, status, resolved_at, resolution) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
  const feedbacks = [
    [1, 1, 'code_mismatch', '制冷模式不响应', 3, 'open', null, null],
    [1, 3, 'signal_weak', '客厅角落信号弱', 5, 'closed', '2024-06-01 10:30:00', '建议调整发射器位置'],
    [2, 6, 'code_mismatch', '温度调节不准', 2, 'open', null, null],
    [3, 10, 'learning_failed', '学习遥控器按键失败', 4, 'closed', '2024-06-02 15:20:00', '已更新红外码库'],
    [3, 12, 'function_missing', '缺少梯形校正功能', 1, 'open', null, null]
  ];
  feedbacks.forEach(f => insertFeedback.run(f[0], f[1], f[2], f[3], f[4], f[5], f[6], f[7]));

  const insertLog = db.prepare('INSERT INTO command_logs (user_id, device_id, ir_code_id, command, success, error_message, network_status) VALUES (?, ?, ?, ?, ?, ?, ?)');
  for (let i = 0; i < 50; i++) {
    const userId = Math.floor(Math.random() * 3) + 1;
    const deviceId = Math.floor(Math.random() * 12) + 1;
    const irCodeId = Math.floor(Math.random() * 210) + 1;
    const commands = ['power', 'temp_up', 'temp_down', 'volume_up', 'volume_down', 'brightness_up'];
    const cmd = commands[Math.floor(Math.random() * commands.length)];
    const success = Math.random() > 0.1 ? 1 : 0;
    const networkStatus = Math.random() > 0.15 ? 'good' : 'weak';
    const errorMsg = success ? null : '信号发送失败，请重试';
    insertLog.run(userId, deviceId, irCodeId, cmd, success, errorMsg, networkStatus);
  }
}

function runMigrations() {
  const addColumn = (table, columnSql) => {
    try {
      db.prepare(`ALTER TABLE ${table} ADD COLUMN ${columnSql}`).run();
    } catch (e) {
      if (!e.message.includes('duplicate column name')) {
        console.log('Migration note:', e.message);
      }
    }
  };

  try {
    addColumn('scenes', 'last_used_at DATETIME');
    addColumn('user_devices', "status TEXT DEFAULT 'online' CHECK(status IN ('online', 'offline'))");
    addColumn('schedule_tasks', 'command TEXT');
    addColumn('schedule_tasks', "execution_channel TEXT DEFAULT 'web'");
    addColumn('schedule_tasks', "offline_strategy TEXT DEFAULT 'queue'");
    addColumn('schedule_tasks', 'command_params TEXT');
    addColumn('schedule_tasks', 'name TEXT');

    db.prepare(`
      UPDATE user_devices
      SET status = CASE
        WHEN last_used_at IS NOT NULL
          AND DATETIME(last_used_at) >= DATETIME('now', '-1 hour') THEN 'online'
        ELSE COALESCE(status, 'online')
      END
      WHERE status IS NULL OR status = ''
    `).run();

    db.prepare(`
      UPDATE schedule_tasks
      SET action_type = 'cron'
      WHERE cron_expression IS NOT NULL
        AND action_type IN ('device', 'scene')
    `).run();

    db.prepare(`
      UPDATE schedule_tasks
      SET action_type = 'once'
      WHERE target_time IS NOT NULL
        AND action_type IN ('device', 'scene')
    `).run();

    db.prepare(`
      UPDATE schedule_tasks
      SET name = CASE
        WHEN scene_id IS NOT NULL THEN COALESCE((SELECT name FROM scenes WHERE scenes.id = schedule_tasks.scene_id), '场景定时任务')
        WHEN device_id IS NOT NULL THEN COALESCE((SELECT name FROM user_devices WHERE user_devices.id = schedule_tasks.device_id), '设备定时任务')
        ELSE '定时任务'
      END
      WHERE name IS NULL OR name = ''
    `).run();

    db.prepare(`
      UPDATE schedule_tasks
      SET command = 'power'
      WHERE device_id IS NOT NULL AND (command IS NULL OR command = '')
    `).run();
  } catch (e) {
    console.log('Migration note:', e.message);
  }
}

function initDB() {
  initSchema();
  runMigrations();
  seedData();
}

module.exports = { db, initDB };
