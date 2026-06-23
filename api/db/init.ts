import db from './index.js'

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      account_no TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      address TEXT NOT NULL,
      user_type TEXT NOT NULL CHECK(user_type IN ('residential', 'commercial', 'industrial')),
      phone TEXT NOT NULL,
      open_date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'suspended', 'closed')),
      area TEXT
    );

    CREATE TABLE IF NOT EXISTS meters (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      meter_no TEXT UNIQUE NOT NULL,
      model TEXT NOT NULL,
      install_date TEXT NOT NULL,
      calibration_expiry TEXT NOT NULL,
      current_reading REAL NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'normal' CHECK(status IN ('normal', 'faulty', 'replaced'))
    );

    CREATE TABLE IF NOT EXISTS gas_devices (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      device_type TEXT NOT NULL CHECK(device_type IN ('stove', 'water_heater', 'boiler', 'other')),
      brand TEXT NOT NULL,
      model TEXT NOT NULL,
      install_date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'normal' CHECK(status IN ('normal', 'expired', 'faulty'))
    );

    CREATE TABLE IF NOT EXISTS safety_inspections (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      inspect_date TEXT NOT NULL,
      result TEXT NOT NULL CHECK(result IN ('pass', 'warning', 'fail')),
      issues TEXT NOT NULL DEFAULT '[]',
      rectification_status TEXT NOT NULL DEFAULT 'none' CHECK(rectification_status IN ('none', 'pending', 'completed')),
      inspector TEXT
    );

    CREATE TABLE IF NOT EXISTS meter_readings (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      meter_id TEXT NOT NULL REFERENCES meters(id),
      reading REAL NOT NULL,
      previous_reading REAL NOT NULL,
      consumption REAL NOT NULL,
      reading_date TEXT NOT NULL,
      method TEXT NOT NULL CHECK(method IN ('ocr', 'manual')),
      ocr_confidence REAL,
      image_url TEXT
    );

    CREATE TABLE IF NOT EXISTS tiered_pricing_rules (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      user_type TEXT NOT NULL,
      tiers TEXT NOT NULL DEFAULT '[]',
      effective_from TEXT NOT NULL,
      effective_to TEXT,
      status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('active', 'draft', 'archived'))
    );

    CREATE TABLE IF NOT EXISTS bills (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      period_start TEXT NOT NULL,
      period_end TEXT NOT NULL,
      consumption REAL NOT NULL,
      tiers TEXT NOT NULL DEFAULT '[]',
      total_amount REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'unpaid' CHECK(status IN ('unpaid', 'paid', 'overdue')),
      paid_date TEXT,
      payment_method TEXT
    );

    CREATE TABLE IF NOT EXISTS work_orders (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      type TEXT NOT NULL CHECK(type IN ('repair', 'inspection_issue', 'ai_warning')),
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      priority TEXT NOT NULL DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high', 'urgent')),
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'dispatched', 'in_progress', 'completed', 'closed')),
      assignee TEXT,
      grid_area TEXT,
      created_at TEXT NOT NULL,
      dispatched_at TEXT,
      completed_at TEXT,
      images TEXT DEFAULT '[]',
      evaluation TEXT,
      warning_id TEXT
    );

    CREATE TABLE IF NOT EXISTS warning_rules (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('zero_usage', 'spike', 'leak_suspect', 'high_usage')),
      threshold REAL NOT NULL,
      unit TEXT NOT NULL,
      severity TEXT NOT NULL CHECK(severity IN ('info', 'warning', 'critical')),
      auto_create_work_order INTEGER NOT NULL DEFAULT 0,
      auto_outbound_call INTEGER NOT NULL DEFAULT 0,
      enabled INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS warning_events (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      type TEXT NOT NULL CHECK(type IN ('zero_usage', 'spike', 'leak_suspect', 'high_usage')),
      severity TEXT NOT NULL CHECK(severity IN ('info', 'warning', 'critical')),
      message TEXT NOT NULL,
      trigger_rule TEXT NOT NULL,
      detected_at TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'acknowledged', 'resolved')),
      outbound_call_made INTEGER NOT NULL DEFAULT 0,
      outbound_call_result TEXT,
      work_order_id TEXT
    );

    CREATE TABLE IF NOT EXISTS inspection_plans (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      area TEXT NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      assignees TEXT NOT NULL DEFAULT '[]',
      status TEXT NOT NULL DEFAULT 'planned' CHECK(status IN ('planned', 'in_progress', 'completed')),
      total_tasks INTEGER NOT NULL DEFAULT 0,
      completed_tasks INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS inspection_records (
      id TEXT PRIMARY KEY,
      plan_id TEXT NOT NULL REFERENCES inspection_plans(id),
      user_id TEXT NOT NULL REFERENCES users(id),
      inspector TEXT NOT NULL,
      inspect_date TEXT NOT NULL,
      result TEXT NOT NULL CHECK(result IN ('pass', 'warning', 'fail')),
      notes TEXT NOT NULL,
      images TEXT DEFAULT '[]',
      converted_to_work_order TEXT
    );

    CREATE TABLE IF NOT EXISTS outage_plans (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      area TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      reason TEXT,
      affected_users INTEGER NOT NULL DEFAULT 0,
      affected_account_nos TEXT NOT NULL DEFAULT '[]',
      status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'published', 'completed', 'cancelled')),
      created_at TEXT NOT NULL,
      created_by TEXT
    );

    CREATE TABLE IF NOT EXISTS service_stations (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      address TEXT NOT NULL,
      lng REAL NOT NULL,
      lat REAL NOT NULL,
      business_hours TEXT NOT NULL,
      services TEXT NOT NULL DEFAULT '[]',
      current_queue INTEGER NOT NULL DEFAULT 0,
      phone TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS grid_workers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      area TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'idle' CHECK(status IN ('idle', 'on_duty', 'on_task')),
      active_orders INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS reporting_logs (
      id TEXT PRIMARY KEY,
      report_date TEXT NOT NULL,
      report_type TEXT NOT NULL,
      metrics TEXT NOT NULL DEFAULT '{}',
      status TEXT NOT NULL DEFAULT 'success' CHECK(status IN ('success', 'failed', 'pending')),
      submitted_at TEXT NOT NULL,
      platform_response TEXT
    );
  `)
}

export function seedData() {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }
  if (userCount.count > 0) return

  const insertUser = db.prepare(`
    INSERT INTO users (id, account_no, name, address, user_type, phone, open_date, status, area)
    VALUES (@id, @account_no, @name, @address, @user_type, @phone, @open_date, @status, @area)
  `)

  const insertMeter = db.prepare(`
    INSERT INTO meters (id, user_id, meter_no, model, install_date, calibration_expiry, current_reading, status)
    VALUES (@id, @user_id, @meter_no, @model, @install_date, @calibration_expiry, @current_reading, @status)
  `)

  const insertDevice = db.prepare(`
    INSERT INTO gas_devices (id, user_id, device_type, brand, model, install_date, status)
    VALUES (@id, @user_id, @device_type, @brand, @model, @install_date, @status)
  `)

  const insertInspection = db.prepare(`
    INSERT INTO safety_inspections (id, user_id, inspect_date, result, issues, rectification_status, inspector)
    VALUES (@id, @user_id, @inspect_date, @result, @issues, @rectification_status, @inspector)
  `)

  const insertReading = db.prepare(`
    INSERT INTO meter_readings (id, user_id, meter_id, reading, previous_reading, consumption, reading_date, method, ocr_confidence, image_url)
    VALUES (@id, @user_id, @meter_id, @reading, @previous_reading, @consumption, @reading_date, @method, @ocr_confidence, @image_url)
  `)

  const insertBill = db.prepare(`
    INSERT INTO bills (id, user_id, period_start, period_end, consumption, tiers, total_amount, status, paid_date, payment_method)
    VALUES (@id, @user_id, @period_start, @period_end, @consumption, @tiers, @total_amount, @status, @paid_date, @payment_method)
  `)

  const insertWorkOrder = db.prepare(`
    INSERT INTO work_orders (id, user_id, type, title, description, priority, status, assignee, grid_area, created_at, dispatched_at, completed_at, images, evaluation, warning_id)
    VALUES (@id, @user_id, @type, @title, @description, @priority, @status, @assignee, @grid_area, @created_at, @dispatched_at, @completed_at, @images, @evaluation, @warning_id)
  `)

  const insertWarningRule = db.prepare(`
    INSERT INTO warning_rules (id, name, type, threshold, unit, severity, auto_create_work_order, auto_outbound_call, enabled)
    VALUES (@id, @name, @type, @threshold, @unit, @severity, @auto_create_work_order, @auto_outbound_call, @enabled)
  `)

  const insertWarningEvent = db.prepare(`
    INSERT INTO warning_events (id, user_id, type, severity, message, trigger_rule, detected_at, status, outbound_call_made, outbound_call_result, work_order_id)
    VALUES (@id, @user_id, @type, @severity, @message, @trigger_rule, @detected_at, @status, @outbound_call_made, @outbound_call_result, @work_order_id)
  `)

  const insertStation = db.prepare(`
    INSERT INTO service_stations (id, name, address, lng, lat, business_hours, services, current_queue, phone)
    VALUES (@id, @name, @address, @lng, @lat, @business_hours, @services, @current_queue, @phone)
  `)

  const insertPricing = db.prepare(`
    INSERT INTO tiered_pricing_rules (id, name, user_type, tiers, effective_from, status)
    VALUES (@id, @name, @user_type, @tiers, @effective_from, @status)
  `)

  const insertOutage = db.prepare(`
    INSERT INTO outage_plans (id, title, area, start_time, end_time, reason, affected_users, affected_account_nos, status, created_at, created_by)
    VALUES (@id, @title, @area, @start_time, @end_time, @reason, @affected_users, @affected_account_nos, @status, @created_at, @created_by)
  `)

  const insertGridWorker = db.prepare(`
    INSERT INTO grid_workers (id, name, phone, area, status, active_orders)
    VALUES (@id, @name, @phone, @area, @status, @active_orders)
  `)

  const insertInspectionPlan = db.prepare(`
    INSERT INTO inspection_plans (id, title, area, start_date, end_date, assignees, status, total_tasks, completed_tasks)
    VALUES (@id, @title, @area, @start_date, @end_date, @assignees, @status, @total_tasks, @completed_tasks)
  `)

  const insertInspectionRecord = db.prepare(`
    INSERT INTO inspection_records (id, plan_id, user_id, inspector, inspect_date, result, notes, images, converted_to_work_order)
    VALUES (@id, @plan_id, @user_id, @inspector, @inspect_date, @result, @notes, @images, @converted_to_work_order)
  `)

  const areas = ['朝阳区', '海淀区', '西城区', '东城区', '丰台区', '石景山区']
  const userTypes: Array<'residential' | 'commercial' | 'industrial'> = ['residential', 'residential', 'residential', 'commercial', 'industrial']

  const users: Array<{
    id: string
    account_no: string
    name: string
    address: string
    user_type: string
    phone: string
    open_date: string
    status: string
    area: string
  }> = []

  for (let i = 1; i <= 20; i++) {
    const area = areas[i % areas.length]
    const userType = userTypes[i % userTypes.length]
    users.push({
      id: `user-${i}`,
      account_no: `BJ${String(202400000 + i).padStart(10, '0')}`,
      name: userType === 'residential' ? `用户${i}先生/女士` : `${['阳光百货', '星辰酒店', '万达广场', '金茂大厦', '科技园'][i % 5]}（${area}店）`,
      address: `北京市${area}${['建国路', '中关村大街', '长安街', '三里屯路', '望京街'][i % 5]}${i * 3}号院${i}号楼${100 + i}室`,
      user_type: userType,
      phone: `138${String(10000000 + i * 1234).slice(0, 8)}`,
      open_date: `2019-${String((i % 12) + 1).padStart(2, '0')}-15`,
      status: 'active',
      area
    })
  }

  const meterModels = ['G2.5 膜式燃气表', 'G4 IC卡智能燃气表', 'G6 远传智能燃气表', 'G10 工商业燃气表', 'G25 工业燃气表']

  const meters: Array<{
    id: string
    user_id: string
    meter_no: string
    model: string
    install_date: string
    calibration_expiry: string
    current_reading: number
    status: string
  }> = []

  for (let i = 1; i <= 20; i++) {
    const currentReading = 300 + i * 47 + Math.floor(Math.random() * 100)
    meters.push({
      id: `meter-${i}`,
      user_id: `user-${i}`,
      meter_no: `MT${String(100000 + i * 7).padStart(8, '0')}`,
      model: meterModels[i % meterModels.length],
      install_date: `2019-${String((i % 12) + 1).padStart(2, '0')}-20`,
      calibration_expiry: `2027-${String((i % 12) + 1).padStart(2, '0')}-20`,
      current_reading: currentReading,
      status: i === 7 ? 'faulty' : 'normal'
    })
  }

  const deviceTypes: Array<'stove' | 'water_heater' | 'boiler' | 'other'> = ['stove', 'water_heater', 'boiler', 'other']
  const devices: Array<{
    id: string
    user_id: string
    device_type: string
    brand: string
    model: string
    install_date: string
    status: string
  }> = []

  let deviceId = 1
  for (let i = 1; i <= 20; i++) {
    const numDevices = (i % 3) + 1
    for (let j = 0; j < numDevices; j++) {
      devices.push({
        id: `device-${deviceId}`,
        user_id: `user-${i}`,
        device_type: deviceTypes[j % deviceTypes.length],
        brand: ['老板', '方太', '史密斯', '海尔', '万家乐'][deviceId % 5],
        model: `Model-${String.fromCharCode(65 + deviceId % 26)}${deviceId}`,
        install_date: `2020-${String((deviceId % 12) + 1).padStart(2, '0')}-10`,
        status: deviceId === 8 ? 'faulty' : 'normal'
      })
      deviceId++
    }
  }

  const inspections: Array<{
    id: string
    user_id: string
    inspect_date: string
    result: string
    issues: string
    rectification_status: string
    inspector: string
  }> = []

  for (let i = 1; i <= 20; i++) {
    const result = i % 7 === 0 ? 'fail' : (i % 5 === 0 ? 'warning' : 'pass')
    const issues = result === 'pass' ? '[]' :
      result === 'warning' ? '["胶管老化需关注"]' :
        '["灶具熄火保护装置故障", "燃气管道锈蚀"]'
    inspections.push({
      id: `inspect-${i}`,
      user_id: `user-${i}`,
      inspect_date: `2025-${String((i % 6) + 1).padStart(2, '0')}-${10 + (i % 20)}`,
      result,
      issues,
      rectification_status: result === 'pass' ? 'none' : (i % 2 === 0 ? 'completed' : 'pending'),
      inspector: ['李工', '王工', '张工', '赵工'][i % 4]
    })
  }

  const readings: Array<{
    id: string
    user_id: string
    meter_id: string
    reading: number
    previous_reading: number
    consumption: number
    reading_date: string
    method: string
    ocr_confidence: number | null
    image_url: string | null
  }> = []

  let readingId = 1
  for (let i = 1; i <= 20; i++) {
    let prevReading = meters[i - 1].current_reading - 200
    for (let month = 1; month <= 6; month++) {
      const consumption = 20 + Math.floor(Math.random() * 40) + (i % 3) * 15
      const reading = prevReading + consumption
      readings.push({
        id: `reading-${readingId}`,
        user_id: `user-${i}`,
        meter_id: `meter-${i}`,
        reading,
        previous_reading: prevReading,
        consumption,
        reading_date: `2025-${String(month).padStart(2, '0')}-28`,
        method: readingId % 3 === 0 ? 'manual' : 'ocr',
        ocr_confidence: readingId % 3 === 0 ? null : (0.92 + Math.random() * 0.07),
        image_url: readingId % 3 === 0 ? null : `/img/meter-${readingId}.jpg`
      })
      prevReading = reading
      readingId++
    }
  }

  const bills: Array<{
    id: string
    user_id: string
    period_start: string
    period_end: string
    consumption: number
    tiers: string
    total_amount: number
    status: string
    paid_date: string | null
    payment_method: string | null
  }> = []

  for (let i = 1; i <= 20; i++) {
    for (let month = 1; month <= 5; month++) {
      const consumption = 25 + Math.floor(Math.random() * 35)
      const tier1Usage = Math.min(consumption, 35)
      const tier2Usage = Math.max(0, Math.min(consumption - 35, 15))
      const tier3Usage = Math.max(0, consumption - 50)
      const totalAmount = tier1Usage * 2.63 + tier2Usage * 2.85 + tier3Usage * 4.25

      const isPaid = month < 5 || i % 3 !== 0
      bills.push({
        id: `bill-${i}-${month}`,
        user_id: `user-${i}`,
        period_start: `2025-${String(month).padStart(2, '0')}-01`,
        period_end: `2025-${String(month).padStart(2, '0')}-${28 + (month % 2)}`,
        consumption,
        tiers: JSON.stringify([
          { tier: 1, rangeStart: 0, rangeEnd: 35, unitPrice: 2.63, consumption: tier1Usage, amount: Math.round(tier1Usage * 2.63 * 100) / 100 },
          { tier: 2, rangeStart: 35, rangeEnd: 50, unitPrice: 2.85, consumption: tier2Usage, amount: Math.round(tier2Usage * 2.85 * 100) / 100 },
          { tier: 3, rangeStart: 50, rangeEnd: null, unitPrice: 4.25, consumption: tier3Usage, amount: Math.round(tier3Usage * 4.25 * 100) / 100 }
        ]),
        total_amount: Math.round(totalAmount * 100) / 100,
        status: isPaid ? 'paid' : 'unpaid',
        paid_date: isPaid ? `2025-${String(month).padStart(2, '0')}-30` : null,
        payment_method: isPaid ? (i % 2 === 0 ? 'wechat' : 'alipay') : null
      })
    }
  }

  const workOrders: Array<{
    id: string
    user_id: string
    type: string
    title: string
    description: string
    priority: string
    status: string
    assignee: string | null
    grid_area: string
    created_at: string
    dispatched_at: string | null
    completed_at: string | null
    images: string
    evaluation: string | null
    warning_id: string | null
  }> = []

  const orderTypes = [
    { type: 'repair', title: '灶具打不着火', desc: '用户反馈燃气灶左侧炉头无法点燃，右侧正常' },
    { type: 'repair', title: '燃气泄漏告警', desc: '用户家中燃气报警器响，怀疑有泄漏' },
    { type: 'repair', title: '表具读数异常', desc: '用户反映本月用气量异常高' },
    { type: 'ai_warning', title: '连续零用气预警', desc: 'AI检测到该用户连续7日零用气，需上门确认' },
    { type: 'inspection_issue', title: '安检隐患整改', desc: '安全检查发现胶管老化，需更换' }
  ]

  const statuses = ['pending', 'dispatched', 'in_progress', 'completed', 'completed', 'closed']

  for (let i = 1; i <= 12; i++) {
    const orderInfo = orderTypes[i % orderTypes.length]
    const status = statuses[i % statuses.length]
    const area = areas[i % areas.length]
    const workerName = ['张师傅', '李师傅', '王师傅', '赵师傅', '刘师傅'][i % 5]
    const createdAt = `2025-06-${String(10 + (i % 15)).padStart(2, '0')} ${String(8 + (i % 10)).padStart(2, '0')}:${String(i * 7 % 60).padStart(2, '0')}:00`

    workOrders.push({
      id: `order-${i}`,
      user_id: `user-${i}`,
      type: orderInfo.type,
      title: orderInfo.title,
      description: orderInfo.desc,
      priority: i % 4 === 0 ? 'urgent' : (i % 3 === 0 ? 'high' : 'medium'),
      status,
      assignee: status !== 'pending' ? workerName : null,
      grid_area: area,
      created_at: createdAt,
      dispatched_at: status !== 'pending' ? createdAt.split(' ')[0] + ` ${String(9 + (i % 8)).padStart(2, '0')}:30:00` : null,
      completed_at: ['completed', 'closed'].includes(status) ? `2025-06-${String(12 + (i % 15)).padStart(2, '0')} 16:00:00` : null,
      images: '[]',
      evaluation: ['completed', 'closed'].includes(status) ? JSON.stringify({
        rating: 4 + (i % 2),
        comment: ['师傅上门及时，服务专业', '问题很快解决了，好评', '服务态度好，讲解清楚'][i % 3],
        evaluatedAt: `2025-06-${String(13 + (i % 15)).padStart(2, '0')} 18:00:00`
      }) : null,
      warning_id: orderInfo.type === 'ai_warning' ? `warning-${i}` : null
    })
  }

  const warningRules = [
    { id: 'rule-1', name: '连续7日零用气', type: 'zero_usage', threshold: 7, unit: '天', severity: 'warning', auto_create_work_order: 0, auto_outbound_call: 1, enabled: 1 },
    { id: 'rule-2', name: '用量突增50%', type: 'spike', threshold: 50, unit: '%', severity: 'warning', auto_create_work_order: 0, auto_outbound_call: 0, enabled: 1 },
    { id: 'rule-3', name: '疑似泄漏（突增100%）', type: 'leak_suspect', threshold: 100, unit: '%', severity: 'critical', auto_create_work_order: 1, auto_outbound_call: 1, enabled: 1 },
    { id: 'rule-4', name: '月用量超100立方', type: 'high_usage', threshold: 100, unit: '立方米', severity: 'info', auto_create_work_order: 0, auto_outbound_call: 0, enabled: 1 }
  ]

  const warningEvents: Array<{
    id: string
    user_id: string
    type: string
    severity: string
    message: string
    trigger_rule: string
    detected_at: string
    status: string
    outbound_call_made: number
    outbound_call_result: string | null
    work_order_id: string | null
  }> = []

  for (let i = 1; i <= 8; i++) {
    const types: Array<'zero_usage' | 'spike' | 'leak_suspect' | 'high_usage'> = ['zero_usage', 'spike', 'leak_suspect', 'high_usage']
    const type = types[i % types.length]
    const severity = type === 'leak_suspect' ? 'critical' : (type === 'spike' ? 'warning' : 'info')
    const messages: Record<string, string> = {
      zero_usage: `用户已连续${7 + (i % 3)}日零用气，请关注`,
      spike: `用户本期用量环比增长${50 + i * 8}%，存在异常`,
      leak_suspect: `用户用量突增100%以上，疑似燃气泄漏`,
      high_usage: `用户月用气量已超100立方米`
    }

    warningEvents.push({
      id: `warning-${i}`,
      user_id: `user-${i + 5}`,
      type,
      severity,
      message: messages[type],
      trigger_rule: `rule-${(i % 4) + 1}`,
      detected_at: `2025-06-${String(15 + (i % 10)).padStart(2, '0')} ${String(9 + (i % 8)).padStart(2, '0')}:00:00`,
      status: i % 3 === 0 ? 'resolved' : (i % 2 === 0 ? 'acknowledged' : 'active'),
      outbound_call_made: type === 'leak_suspect' || type === 'zero_usage' ? 1 : 0,
      outbound_call_result: (type === 'leak_suspect' || type === 'zero_usage') ? (i % 2 === 0 ? '用户接听，确认正常' : '无人接听，已短信通知') : null,
      work_order_id: type === 'leak_suspect' ? `order-${(i % 12) + 1}` : null
    })
  }

  const stations = [
    { id: 'station-1', name: '朝阳燃气服务中心', address: '北京市朝阳区建国路88号', lng: 116.47, lat: 39.92, business_hours: '08:30-18:00', services: JSON.stringify(['缴费', '开户', '报装', '咨询']), current_queue: 3, phone: '010-65881234' },
    { id: 'station-2', name: '海淀燃气服务站', address: '北京市海淀区中关村大街27号', lng: 116.32, lat: 39.98, business_hours: '09:00-17:30', services: JSON.stringify(['缴费', '报装', '维修', '咨询']), current_queue: 5, phone: '010-82667890' },
    { id: 'station-3', name: '西城燃气服务中心', address: '北京市西城区西单北大街120号', lng: 116.37, lat: 39.91, business_hours: '08:30-19:00', services: JSON.stringify(['缴费', '开户', '安检', '报装', '咨询']), current_queue: 2, phone: '010-66012345' },
    { id: 'station-4', name: '东城燃气服务站', address: '北京市东城区东四十条22号', lng: 116.43, lat: 39.94, business_hours: '08:30-18:00', services: JSON.stringify(['缴费', '维修', '咨询']), current_queue: 0, phone: '010-64045678' },
    { id: 'station-5', name: '丰台燃气服务中心', address: '北京市丰台区丰台路58号', lng: 116.28, lat: 39.86, business_hours: '09:00-18:00', services: JSON.stringify(['缴费', '开户', '报装', '安检', '维修']), current_queue: 7, phone: '010-63811122' },
    { id: 'station-6', name: '石景山燃气服务站', address: '北京市石景山区石景山路32号', lng: 116.22, lat: 39.90, business_hours: '09:00-17:30', services: JSON.stringify(['缴费', '维修', '咨询']), current_queue: 1, phone: '010-88993344' }
  ]

  const pricingRules = [
    {
      id: 'pricing-res',
      name: '居民用气阶梯价格',
      user_type: 'residential',
      tiers: JSON.stringify([
        { tier: 1, rangeStart: 0, rangeEnd: 35, unitPrice: 2.63 },
        { tier: 2, rangeStart: 35, rangeEnd: 50, unitPrice: 2.85 },
        { tier: 3, rangeStart: 50, rangeEnd: null, unitPrice: 4.25 }
      ]),
      effective_from: '2024-01-01',
      status: 'active'
    },
    {
      id: 'pricing-com',
      name: '商业用气价格',
      user_type: 'commercial',
      tiers: JSON.stringify([
        { tier: 1, rangeStart: 0, rangeEnd: null, unitPrice: 3.95 }
      ]),
      effective_from: '2024-01-01',
      status: 'active'
    },
    {
      id: 'pricing-ind',
      name: '工业用气价格',
      user_type: 'industrial',
      tiers: JSON.stringify([
        { tier: 1, rangeStart: 0, rangeEnd: null, unitPrice: 3.65 }
      ]),
      effective_from: '2024-01-01',
      status: 'active'
    }
  ]

  const outagePlans = [
    { id: 'outage-1', title: '建国路燃气管道检修', area: '朝阳区', start_time: '2025-07-15 08:00:00', end_time: '2025-07-15 16:00:00', reason: '管道定期检修维护', affected_users: 326, affected_account_nos: JSON.stringify(['BJ202400001', 'BJ202400002']), status: 'published', created_at: '2025-06-10 10:00:00', created_by: '系统管理员' },
    { id: 'outage-2', title: '中关村管线改造工程', area: '海淀区', start_time: '2025-07-20 09:00:00', end_time: '2025-07-21 18:00:00', reason: '老旧管网升级改造', affected_users: 856, affected_account_nos: JSON.stringify(['BJ202400003']), status: 'draft', created_at: '2025-06-18 14:30:00', created_by: '系统管理员' },
    { id: 'outage-3', title: '西单商圈应急抢修', area: '西城区', start_time: '2025-06-25 22:00:00', end_time: '2025-06-26 06:00:00', reason: '泄漏紧急抢修', affected_users: 145, affected_account_nos: JSON.stringify([]), status: 'completed', created_at: '2025-06-24 08:00:00', created_by: '调度中心' }
  ]

  const gridWorkers = [
    { id: 'worker-1', name: '张建国', phone: '13800000001', area: '朝阳区', status: 'on_duty', active_orders: 2 },
    { id: 'worker-2', name: '李卫东', phone: '13800000002', area: '海淀区', status: 'on_task', active_orders: 3 },
    { id: 'worker-3', name: '王红旗', phone: '13800000003', area: '西城区', status: 'on_duty', active_orders: 1 },
    { id: 'worker-4', name: '赵援朝', phone: '13800000004', area: '东城区', status: 'idle', active_orders: 0 },
    { id: 'worker-5', name: '刘跃进', phone: '13800000005', area: '丰台区', status: 'on_duty', active_orders: 2 },
    { id: 'worker-6', name: '陈大庆', phone: '13800000006', area: '石景山区', status: 'on_task', active_orders: 1 }
  ]

  const inspectionPlans = [
    { id: 'plan-1', title: '2025年第二季度安全巡检', area: '朝阳区', start_date: '2025-04-01', end_date: '2025-06-30', assignees: JSON.stringify(['张建国', '李卫东']), status: 'in_progress', total_tasks: 500, completed_tasks: 380 },
    { id: 'plan-2', title: '2025年第二季度安全巡检', area: '海淀区', start_date: '2025-04-01', end_date: '2025-06-30', assignees: JSON.stringify(['王红旗']), status: 'in_progress', total_tasks: 420, completed_tasks: 310 },
    { id: 'plan-3', title: '2025年第一季度安全巡检', area: '西城区', start_date: '2025-01-01', end_date: '2025-03-31', assignees: JSON.stringify(['赵援朝']), status: 'completed', total_tasks: 360, completed_tasks: 360 }
  ]

  const tx = db.transaction(() => {
    users.forEach(u => insertUser.run(u))
    meters.forEach(m => insertMeter.run(m))
    devices.forEach(d => insertDevice.run(d))
    inspections.forEach(i => insertInspection.run(i))
    readings.forEach(r => insertReading.run(r))
    bills.forEach(b => insertBill.run(b))
    workOrders.forEach(w => insertWorkOrder.run(w))
    warningRules.forEach(r => insertWarningRule.run(r))
    warningEvents.forEach(w => insertWarningEvent.run(w))
    stations.forEach(s => insertStation.run(s))
    pricingRules.forEach(p => insertPricing.run(p))
    outagePlans.forEach(p => insertOutage.run(p))
    gridWorkers.forEach(w => insertGridWorker.run(w))
    inspectionPlans.forEach(p => insertInspectionPlan.run(p))

    for (let i = 1; i <= 15; i++) {
      insertInspectionRecord.run({
        id: `irecord-${i}`,
        plan_id: i < 8 ? 'plan-1' : (i < 12 ? 'plan-2' : 'plan-3'),
        user_id: `user-${i}`,
        inspector: ['张建国', '李卫东', '王红旗'][i % 3],
        inspect_date: `2025-0${i < 8 ? '4' : '5'}-${String(10 + (i % 20)).padStart(2, '0')}`,
        result: i % 5 === 0 ? 'warning' : 'pass',
        notes: i % 5 === 0 ? '发现轻微隐患，已告知用户' : '检查合格，用气环境良好',
        images: '[]',
        converted_to_work_order: null
      })
    }
  })

  tx()
}
