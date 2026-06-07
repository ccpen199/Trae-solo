const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../../data/app.sqlite');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      role TEXT DEFAULT 'user',
      address TEXT,
      ltv_score REAL DEFAULT 0,
      total_spent REAL DEFAULT 0,
      device_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS technicians (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT,
      skill TEXT,
      status TEXT DEFAULT 'available',
      location TEXT,
      rating REAL DEFAULT 5.0,
      completed_orders INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS devices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      device_id TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      model TEXT,
      brand TEXT DEFAULT 'Hisense',
      status TEXT DEFAULT 'offline',
      power_state TEXT DEFAULT 'off',
      energy_consumption REAL DEFAULT 0,
      running_mode TEXT,
      fault_code TEXT,
      firmware_version TEXT,
      health_score REAL DEFAULT 100,
      last_online DATETIME,
      user_id INTEGER,
      bind_time DATETIME,
      sn_number TEXT,
      purchase_date DATETIME,
      warranty_expire DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS device_operation_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      device_id INTEGER NOT NULL,
      operation TEXT NOT NULL,
      params TEXT,
      operator TEXT,
      result TEXT,
      success INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (device_id) REFERENCES devices(id)
    );

    CREATE TABLE IF NOT EXISTS device_discovery_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      device_id TEXT NOT NULL,
      name TEXT,
      type TEXT,
      model TEXT,
      ip_address TEXT,
      mac_address TEXT,
      ssid TEXT,
      bind_user_id INTEGER,
      bind_status TEXT DEFAULT 'discovered',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS scene_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      conditions TEXT,
      actions TEXT,
      enabled INTEGER DEFAULT 1,
      execute_count INTEGER DEFAULT 0,
      last_executed DATETIME,
      user_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS scene_execution_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      scene_id INTEGER NOT NULL,
      scene_name TEXT,
      trigger_type TEXT,
      executed_by TEXT,
      actions_result TEXT,
      success INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (scene_id) REFERENCES scene_templates(id)
    );

    CREATE TABLE IF NOT EXISTS service_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_no TEXT UNIQUE NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'pending',
      priority TEXT DEFAULT 'normal',
      user_id INTEGER,
      device_id INTEGER,
      technician_id INTEGER,
      scheduled_time DATETIME,
      arrival_time DATETIME,
      completed_at DATETIME,
      fault_description TEXT,
      diagnosis_result TEXT,
      solution TEXT,
      parts_used TEXT,
      labor_cost REAL DEFAULT 0,
      parts_cost REAL DEFAULT 0,
      total_cost REAL DEFAULT 0,
      rating INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (device_id) REFERENCES devices(id),
      FOREIGN KEY (technician_id) REFERENCES technicians(id)
    );

    CREATE TABLE IF NOT EXISTS order_sop_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      step TEXT NOT NULL,
      description TEXT,
      operator TEXT,
      result TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES service_orders(id)
    );

    CREATE TABLE IF NOT EXISTS parts_inventory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      part_code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      category TEXT,
      stock INTEGER DEFAULT 0,
      price REAL DEFAULT 0,
      location TEXT,
      min_stock INTEGER DEFAULT 10,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS parts_usage_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER,
      part_id INTEGER NOT NULL,
      quantity INTEGER DEFAULT 1,
      technician TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES service_orders(id),
      FOREIGN KEY (part_id) REFERENCES parts_inventory(id)
    );

    CREATE TABLE IF NOT EXISTS voice_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      command TEXT NOT NULL,
      intent TEXT,
      params TEXT,
      result TEXT,
      success INTEGER DEFAULT 1,
      user_id INTEGER,
      device_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (device_id) REFERENCES devices(id)
    );

    CREATE TABLE IF NOT EXISTS device_telemetry (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      device_id INTEGER NOT NULL,
      metric TEXT NOT NULL,
      value REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (device_id) REFERENCES devices(id)
    );

    CREATE TABLE IF NOT EXISTS sla_metrics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      total_orders INTEGER DEFAULT 0,
      completed_on_time INTEGER DEFAULT 0,
      avg_response_time REAL DEFAULT 0,
      avg_resolution_time REAL DEFAULT 0,
      customer_satisfaction REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount === 0) {
    const insertUser = db.prepare('INSERT INTO users (username, name, phone, email, role, address, ltv_score, total_spent, device_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
    insertUser.run('admin', '系统管理员', '13800138000', 'admin@hisense.com', 'admin', '海信大厦', 0, 0, 0);
    insertUser.run('user001', '张三', '13900139001', 'zhangsan@example.com', 'user', '北京市朝阳区建国路88号', 85.5, 12580.0, 4);
    insertUser.run('user002', '李四', '13900139002', 'lisi@example.com', 'user', '上海市浦东新区张江高科技园区', 92.3, 8960.0, 2);
    insertUser.run('user003', '王五', '13900139003', 'wangwu@example.com', 'user', '广州市天河区珠江新城', 78.0, 5680.0, 1);
  }

  const techCount = db.prepare('SELECT COUNT(*) as count FROM technicians').get().count;
  if (techCount === 0) {
    const insertTech = db.prepare('INSERT INTO technicians (name, phone, skill, status, location, rating, completed_orders) VALUES (?, ?, ?, ?, ?, ?, ?)');
    insertTech.run('王建国', '13700137001', '空调,电视', 'available', '北京朝阳区', 4.8, 156);
    insertTech.run('李明', '13700137002', '冰箱,洗衣机', 'available', '北京海淀区', 4.9, 189);
    insertTech.run('张伟', '13700137003', '全品类', 'on_site', '上海浦东区', 4.7, 234);
    insertTech.run('刘洋', '13700137004', '空调,热水器', 'available', '广州天河区', 4.6, 128);
  }

  const deviceCount = db.prepare('SELECT COUNT(*) as count FROM devices').get().count;
  if (deviceCount === 0) {
    const insertDevice = db.prepare('INSERT INTO devices (device_id, name, type, model, status, power_state, energy_consumption, running_mode, firmware_version, user_id, bind_time, health_score, sn_number, purchase_date, warranty_expire) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?, ?, ?, ?)');
    insertDevice.run('HS-TV-001', '客厅智能电视', 'tv', 'HS55U7E', 'online', 'on', 120.5, 'standard', 'v2.3.1', 2, 95, 'SN2023TV00123', '2023-06-15', '2026-06-14');
    insertDevice.run('HS-AC-001', '主卧智能空调', 'ac', 'KFR-35GW/BP3DN8Y', 'online', 'cool', 850.0, 'cool_26', 'v1.8.5', 2, 92, 'SN2023AC00456', '2023-07-20', '2026-07-19');
    insertDevice.run('HS-FR-001', '智能变频冰箱', 'fridge', 'BCD-451WTDGVBP', 'online', 'on', 1200.0, 'eco', 'v3.1.0', 2, 88, 'SN2023FR00789', '2023-05-10', '2026-05-09');
    insertDevice.run('HS-WM-001', '滚筒洗烘一体机', 'washer', 'HD100DES2', 'offline', 'off', 0, 'idle', 'v1.5.2', 2, 96, 'SN2023WM00101', '2023-08-01', '2026-07-31');
    insertDevice.run('HS-TV-002', '卧室激光电视', 'tv', 'HS88L5', 'online', 'off', 0, 'standby', 'v2.2.0', 3, 94, 'SN2023TV00222', '2023-09-15', '2026-09-14');
    insertDevice.run('HS-AC-002', '客厅中央空调', 'ac', 'KFR-50GW/BP3DN8Y', 'online', 'heat', 1200.0, 'heat_24', 'v1.8.5', 3, 90, 'SN2023AC00555', '2023-10-01', '2026-09-30');
    insertDevice.run('HS-AC-003', '书房空调', 'ac', 'KFR-26GW/BP3DN8Y', 'online', 'off', 0, 'standby', 'v1.8.5', 2, 85, 'SN2024AC00888', '2024-01-10', '2027-01-09');
  }

  const sceneCount = db.prepare('SELECT COUNT(*) as count FROM scene_templates').get().count;
  if (sceneCount === 0) {
    const insertScene = db.prepare('INSERT INTO scene_templates (name, description, conditions, actions, enabled, execute_count, last_executed, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    insertScene.run(
      '离家模式',
      '一键关闭所有设备并启动安防布防',
      JSON.stringify({ trigger: 'manual', conditions: [] }),
      JSON.stringify({ devices: ['HS-TV-001', 'HS-AC-001', 'HS-FR-001'], action: 'power_off', security: true }),
      1, 128, '2024-06-02 08:30:00', 2
    );
    insertScene.run(
      '回家模式',
      '自动打开空调、电视和灯光，营造温馨氛围',
      JSON.stringify({ trigger: 'location', distance: 500, unit: 'meter' }),
      JSON.stringify({ devices: ['HS-AC-001', 'HS-TV-001'], action: 'power_on', temp: 26 }),
      1, 96, '2024-06-02 18:45:00', 2
    );
    insertScene.run(
      '睡眠模式',
      '夜间自动调节设备，降低能耗',
      JSON.stringify({ trigger: 'time', time: '22:00', repeat: 'daily' }),
      JSON.stringify({ devices: ['HS-TV-001', 'HS-AC-001'], action: 'sleep_mode', temp: 28 }),
      1, 45, '2024-06-01 22:00:00', 2
    );
    insertScene.run(
      '影院模式',
      '营造家庭影院氛围',
      JSON.stringify({ trigger: 'manual' }),
      JSON.stringify({ devices: ['HS-TV-001'], action: 'theater_mode', light: 'dim' }),
      1, 32, '2024-06-01 20:00:00', 3
    );
    insertScene.run(
      '节能模式',
      '全屋设备进入低功耗状态',
      JSON.stringify({ trigger: 'manual' }),
      JSON.stringify({ devices: ['HS-AC-001', 'HS-FR-001'], action: 'eco_mode' }),
      1, 18, '2024-05-28 14:00:00', 2
    );
  }

  const sceneLogCount = db.prepare('SELECT COUNT(*) as count FROM scene_execution_logs').get().count;
  if (sceneLogCount === 0) {
    const insertSceneLog = db.prepare('INSERT INTO scene_execution_logs (scene_id, scene_name, trigger_type, executed_by, actions_result, success) VALUES (?, ?, ?, ?, ?, ?)');
    insertSceneLog.run(1, '离家模式', 'manual', '张三', JSON.stringify({ device_count: 3, all_success: true }), 1);
    insertSceneLog.run(2, '回家模式', 'location', '自动触发', JSON.stringify({ device_count: 2, all_success: true }), 1);
    insertSceneLog.run(3, '睡眠模式', 'time', '定时触发', JSON.stringify({ device_count: 2, all_success: true }), 1);
  }

  const orderCount = db.prepare('SELECT COUNT(*) as count FROM service_orders').get().count;
  if (orderCount === 0) {
    const insertOrder = db.prepare('INSERT INTO service_orders (order_no, type, title, description, status, priority, user_id, device_id, technician_id, scheduled_time, completed_at, diagnosis_result, solution, labor_cost, parts_cost, total_cost, rating) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    insertOrder.run(
      'WO202406001', 'install', '空调安装服务',
      '新购空调上门安装调试，包含打孔、试机',
      'completed', 'high', 2, 2, 1,
      '2024-06-01 09:00:00', '2024-06-01 11:30:00',
      '设备正常，安装顺利', '标准安装流程',
      200, 50, 250, 5
    );
    insertOrder.run(
      'WO202406002', 'repair', '冰箱噪音故障维修',
      '冰箱运行时有异常噪音，特别是压缩机启动时',
      'in_progress', 'medium', 2, 3, 2,
      '2024-06-03 14:00:00', null,
      '初步判断为压缩机脚垫问题', '待进一步诊断',
      0, 0, 0, null
    );
    insertOrder.run(
      'WO202406003', 'maintain', '电视系统升级服务',
      '预约上门进行系统固件升级和性能优化',
      'pending', 'low', 3, 5, 3,
      '2024-06-05 10:00:00', null,
      null, null,
      0, 0, 0, null
    );
    insertOrder.run(
      'WO202406004', 'repair', '空调不制冷故障',
      '空调开启后出风不凉，已持续2天',
      'completed', 'high', 2, 7, 1,
      '2024-05-30 14:00:00', '2024-05-30 16:30:00',
      '制冷剂泄漏', '补充制冷剂并检测漏点',
      150, 380, 530, 5
    );
    insertOrder.run(
      'WO202406005', 'consult', '智能场景配置咨询',
      '咨询如何配置离家模式和回家模式的自动化',
      'completed', 'normal', 3, null, null,
      '2024-05-28 15:00:00', '2024-05-28 15:30:00',
      '用户已掌握配置方法', '电话指导完成',
      0, 0, 0, 4
    );
  }

  const orderSopCount = db.prepare('SELECT COUNT(*) as count FROM order_sop_logs').get().count;
  if (orderSopCount === 0) {
    const insertSop = db.prepare('INSERT INTO order_sop_logs (order_id, step, description, operator, result) VALUES (?, ?, ?, ?, ?)');
    insertSop.run(1, '创建工单', '用户提交空调安装服务请求', '系统', '成功');
    insertSop.run(1, '派单', '系统自动派单给王建国技师', '调度引擎', '成功');
    insertSop.run(1, '技师接单', '王建国技师确认接单', '王建国', '成功');
    insertSop.run(1, '到达现场', '技师到达用户家中开始服务', '王建国', '成功');
    insertSop.run(1, '远程诊断', '远程检测设备状态正常', '系统', '通过');
    insertSop.run(1, '安装调试', '空调安装完成并试机正常', '王建国', '完成');
    insertSop.run(1, '用户验收', '用户确认服务完成并满意', '张三', '满意');
    insertSop.run(1, '工单完结', '工单正式关闭，费用结算完成', '系统', '完成');

    insertSop.run(2, '创建工单', '用户提交冰箱噪音故障报修', '系统', '成功');
    insertSop.run(2, '派单', '系统派单给李明技师', '调度引擎', '成功');
    insertSop.run(2, '技师接单', '李明技师确认接单', '李明', '成功');
    insertSop.run(2, '远程诊断', '远程检测发现压缩机运行异常', '系统', '发现问题');
  }

  const partsCount = db.prepare('SELECT COUNT(*) as count FROM parts_inventory').get().count;
  if (partsCount === 0) {
    const insertPart = db.prepare('INSERT INTO parts_inventory (part_code, name, category, stock, price, location, min_stock) VALUES (?, ?, ?, ?, ?, ?, ?)');
    insertPart.run('P-AC-001', '空调遥控器', '配件', 150, 89.0, 'A区-01架', 20);
    insertPart.run('P-AC-002', 'R32制冷剂', '耗材', 80, 280.0, 'B区-03架', 30);
    insertPart.run('P-AC-003', '空调支架', '配件', 60, 120.0, 'A区-02架', 15);
    insertPart.run('P-TV-001', '电视挂架', '配件', 100, 150.0, 'A区-03架', 20);
    insertPart.run('P-TV-002', 'HDMI线', '配件', 200, 45.0, 'C区-01架', 50);
    insertPart.run('P-FR-001', '冰箱密封条', '配件', 45, 180.0, 'B区-01架', 10);
    insertPart.run('P-WM-001', '洗衣机进水管', '配件', 120, 35.0, 'C区-02架', 30);
    insertPart.run('P-GN-001', '万能遥控器', '通用', 200, 128.0, 'C区-03架', 50);
  }

  const opLogCount = db.prepare('SELECT COUNT(*) as count FROM device_operation_logs').get().count;
  if (opLogCount === 0) {
    const insertOpLog = db.prepare('INSERT INTO device_operation_logs (device_id, operation, params, operator, result, success) VALUES (?, ?, ?, ?, ?, ?)');
    insertOpLog.run(1, 'power_on', '{}', '张三', '设备已开启', 1);
    insertOpLog.run(1, 'set_mode', '{"mode":"standard"}', '张三', '模式已切换', 1);
    insertOpLog.run(2, 'power_on', '{}', '系统-回家模式', '设备已开启', 1);
    insertOpLog.run(2, 'set_temp', '{"temp":26}', '张三', '温度已调节', 1);
    insertOpLog.run(2, 'power_off', '{}', '系统-离家模式', '设备已关闭', 1);
    insertOpLog.run(3, 'set_mode', '{"mode":"eco"}', '系统-节能模式', '模式已切换', 1);
  }

  const discoveryCount = db.prepare('SELECT COUNT(*) as count FROM device_discovery_logs').get().count;
  if (discoveryCount === 0) {
    const insertDiscovery = db.prepare('INSERT INTO device_discovery_logs (device_id, name, type, model, ip_address, mac_address, ssid, bind_user_id, bind_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
    insertDiscovery.run('HS-TV-001', '客厅智能电视', 'tv', 'HS55U7E', '192.168.1.101', '00:1A:2B:3C:4D:01', 'Hisense_Home', 2, 'bound');
    insertDiscovery.run('HS-AC-001', '主卧智能空调', 'ac', 'KFR-35GW', '192.168.1.102', '00:1A:2B:3C:4D:02', 'Hisense_Home', 2, 'bound');
    insertDiscovery.run('HS-FR-001', '智能变频冰箱', 'fridge', 'BCD-451', '192.168.1.103', '00:1A:2B:3C:4D:03', 'Hisense_Home', 2, 'bound');
    insertDiscovery.run('HS-WM-001', '滚筒洗烘一体机', 'washer', 'HD100DES2', '192.168.1.104', '00:1A:2B:3C:4D:04', 'Hisense_Home', 2, 'bound');
    insertDiscovery.run('HS-AC-NEW', '待配置空调', 'ac', 'KFR-26GW', '192.168.1.201', '00:1A:2B:3C:4D:F1', 'Hisense_Setup', null, 'discovered');
    insertDiscovery.run('HS-TV-NEW', '待配置电视', 'tv', 'HS65U8H', '192.168.1.202', '00:1A:2B:3C:4D:F2', 'Hisense_Setup', null, 'discovered');
  }

  const voiceCount = db.prepare('SELECT COUNT(*) as count FROM voice_logs').get().count;
  if (voiceCount === 0) {
    const insertVoice = db.prepare('INSERT INTO voice_logs (command, intent, params, result, success, user_id, device_id) VALUES (?, ?, ?, ?, ?, ?, ?)');
    insertVoice.run('打开客厅电视', 'power_on', '{}', '已为您打开客厅电视', 1, 2, 1);
    insertVoice.run('空调调到26度', 'set_temperature', '{"temp":26}', '主卧空调温度已调节为26度', 1, 2, 2);
    insertVoice.run('开启离家模式', 'activate_scene', '{"scene":"离家模式"}', '离家模式已启动', 1, 2, null);
    insertVoice.run('关闭所有设备', 'power_off_all', '{}', '已为您关闭所有设备', 1, 2, null);
    insertVoice.run('电视音量大点', 'volume_up', '{}', '电视音量已调大', 1, 2, 1);
    insertVoice.run('冰箱调到节能模式', 'set_mode', '{"mode":"eco"}', '冰箱已切换到节能模式', 1, 2, 3);
  }

  const slaCount = db.prepare('SELECT COUNT(*) as count FROM sla_metrics').get().count;
  if (slaCount === 0) {
    const insertSLA = db.prepare('INSERT INTO sla_metrics (date, total_orders, completed_on_time, avg_response_time, avg_resolution_time, customer_satisfaction) VALUES (?, ?, ?, ?, ?, ?)');
    insertSLA.run('2024-06-01', 12, 11, 12.5, 45.2, 4.8);
    insertSLA.run('2024-05-31', 15, 14, 10.8, 38.6, 4.7);
    insertSLA.run('2024-05-30', 8, 8, 15.2, 52.0, 4.9);
    insertSLA.run('2024-05-29', 10, 9, 11.0, 42.5, 4.6);
    insertSLA.run('2024-05-28', 13, 12, 9.5, 36.8, 4.8);
  }
}

initDatabase();

module.exports = db;
