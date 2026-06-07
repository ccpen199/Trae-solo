import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 58819;

app.use(cors({
  origin: 'http://127.0.0.1:48819',
  credentials: true
}));
app.use(express.json());

const dbPath = path.join(__dirname, '..', 'data', 'app.sqlite');
const dbDir = path.join(__dirname, '..', 'data');

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS user_profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT UNIQUE NOT NULL,
    user_type TEXT NOT NULL,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    address TEXT,
    id_number TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS meter_points (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    meter_id TEXT UNIQUE NOT NULL,
    user_id TEXT,
    address TEXT,
    capacity REAL,
    voltage_level TEXT,
    topology_path TEXT,
    FOREIGN KEY (user_id) REFERENCES user_profiles(user_id)
  );

  CREATE TABLE IF NOT EXISTS electricity_bills (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bill_id TEXT UNIQUE NOT NULL,
    meter_id TEXT,
    period TEXT,
    peak_usage REAL,
    valley_usage REAL,
    total_usage REAL,
    amount REAL,
    status TEXT,
    due_date DATE,
    paid_at DATETIME,
    FOREIGN KEY (meter_id) REFERENCES meter_points(meter_id)
  );

  CREATE TABLE IF NOT EXISTS outage_orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id TEXT UNIQUE NOT NULL,
    meter_id TEXT,
    outage_type TEXT,
    reason TEXT,
    start_time DATETIME,
    expected_end_time DATETIME,
    actual_end_time DATETIME,
    status TEXT,
    priority TEXT,
    FOREIGN KEY (meter_id) REFERENCES meter_points(meter_id)
  );

  CREATE TABLE IF NOT EXISTS charging_stations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    station_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    address TEXT,
    latitude REAL,
    longitude REAL,
    operator TEXT,
    total_ports INTEGER,
    available_ports INTEGER,
    power_rating REAL,
    price_per_kwh REAL,
    station_type TEXT
  );

  CREATE TABLE IF NOT EXISTS pv_contracts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    contract_id TEXT UNIQUE NOT NULL,
    user_id TEXT,
    capacity REAL,
    installation_date DATE,
    grid_connection_date DATE,
    status TEXT,
    monthly_generation REAL,
    monthly_feed_in REAL,
    subsidy_amount REAL,
    subsidy_status TEXT,
    document_path TEXT
  );

  CREATE TABLE IF NOT EXISTS service_satisfaction (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    evaluation_id TEXT UNIQUE NOT NULL,
    order_id TEXT,
    user_id TEXT,
    service_type TEXT,
    score INTEGER,
    comment TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS policy_documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    doc_id TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    category TEXT,
    summary TEXT,
    keywords TEXT,
    content TEXT,
    published_date DATE,
    effective_date DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS outage_warnings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    warning_id TEXT UNIQUE NOT NULL,
    order_id TEXT,
    user_id TEXT,
    message TEXT,
    sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    read_status TEXT DEFAULT 'unread',
    FOREIGN KEY (order_id) REFERENCES outage_orders(order_id)
  );
`);

function initSampleData() {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM user_profiles').get();
  
  if (userCount.count === 0) {
    const userTypes = ['resident', 'enterprise', 'ev_owner', 'pv_owner'];
    const operators = ['国家电网', '特来电', '星星充电', '云快充'];
    const reasons = ['设备检修', '故障抢修', '计划停电', '突发故障'];
    const serviceTypes = ['报装', '维修', '查询', '缴费', '投诉'];
    const policyTitles = [
      '分布式光伏发电项目管理办法',
      '电动汽车充电基础设施建设运营管理暂行办法',
      '电力用户用电信息采集系统建设规范',
      '居民阶梯电价执行细则',
      '电力客户服务规范',
      '智能电网发展规划纲要',
      '节能减排奖励办法',
      '电力市场交易规则',
      '供电服务质量标准',
      '网络安全防护指南'
    ];
    const categories = ['政策', '法规', '标准', '规范'];

    for (let i = 1; i <= 20; i++) {
      db.prepare(`
        INSERT INTO user_profiles (user_id, user_type, name, phone, address, id_number)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        `USER${String(i).padStart(6, '0')}`,
        userTypes[Math.floor(Math.random() * userTypes.length)],
        `用户${i}`,
        `138${String(i).padStart(8, '0')}`,
        `XX省XX市XX区XX路${i}号`,
        `330101199001${String(i).padStart(4, '0')}`
      );
    }

    for (let i = 1; i <= 30; i++) {
      const voltageLevels = ['220V', '380V', '10kV'];
      const topologyPaths = [];
      for (let j = 0; j < 4; j++) {
        topologyPaths.push(`第${Math.floor(Math.random() * 5) + 1}`);
      }
      
      db.prepare(`
        INSERT INTO meter_points (meter_id, user_id, address, capacity, voltage_level, topology_path)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        `METER${String(i).padStart(8, '0')}`,
        `USER${String(Math.floor(Math.random() * 20) + 1).padStart(6, '0')}`,
        `XX省XX市XX区XX路${Math.floor(Math.random() * 100) + 1}号`,
        Math.round((Math.random() * 195 + 5) * 100) / 100,
        voltageLevels[Math.floor(Math.random() * voltageLevels.length)],
        `/变电站${Math.floor(Math.random() * 5) + 1}/馈线${Math.floor(Math.random() * 10) + 1}/表箱${Math.floor(Math.random() * 100) + 1}`
      );
    }

    for (let i = 1; i <= 25; i++) {
      const peakUsage = Math.round((Math.random() * 400 + 100) * 100) / 100;
      const valleyUsage = Math.round((Math.random() * 600 + 200) * 100) / 100;
      const statuses = ['paid', 'pending', 'overdue'];
      const month = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
      
      db.prepare(`
        INSERT INTO electricity_bills (bill_id, meter_id, period, peak_usage, valley_usage, total_usage, amount, status, due_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        `BILL${String(i).padStart(10, '0')}`,
        `METER${String(Math.floor(Math.random() * 30) + 1).padStart(8, '0')}`,
        `2024-${month}`,
        peakUsage,
        valleyUsage,
        peakUsage + valleyUsage,
        Math.round((Math.random() * 1800 + 200) * 100) / 100,
        statuses[Math.floor(Math.random() * statuses.length)],
        new Date(Date.now() + Math.floor(Math.random() * 60 - 30) * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      );
    }

    for (let i = 1; i <= 15; i++) {
      const startTime = new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000);
      const expectedEndTime = new Date(startTime.getTime() + Math.floor(Math.random() * 10 + 2) * 60 * 60 * 1000);
      const statuses = ['reported', 'processing', 'resolved'];
      const priorities = ['low', 'medium', 'high', 'urgent'];
      const outageTypes = ['planned', 'emergency'];
      
      db.prepare(`
        INSERT INTO outage_orders (order_id, meter_id, outage_type, reason, start_time, expected_end_time, status, priority)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        `OUTAGE${String(i).padStart(8, '0')}`,
        `METER${String(Math.floor(Math.random() * 30) + 1).padStart(8, '0')}`,
        outageTypes[Math.floor(Math.random() * outageTypes.length)],
        reasons[Math.floor(Math.random() * reasons.length)],
        startTime.toISOString(),
        expectedEndTime.toISOString(),
        statuses[Math.floor(Math.random() * statuses.length)],
        priorities[Math.floor(Math.random() * priorities.length)]
      );
    }

    for (let i = 1; i <= 20; i++) {
      db.prepare(`
        INSERT INTO charging_stations (station_id, name, address, latitude, longitude, operator, total_ports, available_ports, power_rating, price_per_kwh, station_type)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        `STATION${String(i).padStart(6, '0')}`,
        `充电站${i}`,
        `XX市XX区XX路${Math.floor(Math.random() * 50) + 1}号`,
        Math.round((Math.random() * 1.5 + 29.5) * 1000000) / 1000000,
        Math.round((Math.random() * 2 + 120) * 1000000) / 1000000,
        operators[Math.floor(Math.random() * operators.length)],
        Math.floor(Math.random() * 16) + 5,
        Math.floor(Math.random() * 10) + 1,
        [7, 14, 30, 60, 120][Math.floor(Math.random() * 5)],
        Math.round((Math.random() * 1 + 0.5) * 100) / 100,
        'public'
      );
    }

    for (let i = 1; i <= 10; i++) {
      const installDays = Math.floor(Math.random() * 550) + 180;
      const connectDays = Math.floor(Math.random() * 90) + 90;
      const statuses = ['applying', 'approved', 'connected'];
      const subsidyStatuses = ['pending', 'processing', 'paid'];
      
      db.prepare(`
        INSERT INTO pv_contracts (contract_id, user_id, capacity, installation_date, grid_connection_date, status, monthly_generation, monthly_feed_in, subsidy_amount, subsidy_status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        `PV${String(i).padStart(8, '0')}`,
        `USER${String(Math.floor(Math.random() * 20) + 1).padStart(6, '0')}`,
        Math.round((Math.random() * 90 + 10) * 100) / 100,
        new Date(Date.now() - installDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        new Date(Date.now() - connectDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        statuses[Math.floor(Math.random() * statuses.length)],
        Math.round((Math.random() * 2500 + 500) * 100) / 100,
        Math.round((Math.random() * 1700 + 300) * 100) / 100,
        Math.round((Math.random() * 4000 + 1000) * 100) / 100,
        subsidyStatuses[Math.floor(Math.random() * subsidyStatuses.length)]
      );
    }

    for (let i = 1; i <= 15; i++) {
      db.prepare(`
        INSERT INTO service_satisfaction (evaluation_id, order_id, user_id, service_type, score, comment)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        `EVAL${String(i).padStart(8, '0')}`,
        Math.random() > 0.3 ? `ORDER${String(i).padStart(8, '0')}` : null,
        `USER${String(Math.floor(Math.random() * 20) + 1).padStart(6, '0')}`,
        serviceTypes[Math.floor(Math.random() * serviceTypes.length)],
        Math.floor(Math.random() * 5) + 1,
        ['服务很好', '处理及时', '满意', '一般', null][Math.floor(Math.random() * 5)]
      );
    }

    for (let i = 1; i <= 10; i++) {
      const pubDate = new Date(Date.now() - Math.floor(Math.random() * 335) * 24 * 60 * 60 * 1000);
      const effDate = new Date(pubDate.getTime() + Math.floor(Math.random() * 60 + 30) * 24 * 60 * 60 * 1000);
      
      db.prepare(`
        INSERT INTO policy_documents (doc_id, title, category, summary, keywords, content, published_date, effective_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        `DOC${String(i).padStart(6, '0')}`,
        policyTitles[i - 1],
        categories[Math.floor(Math.random() * categories.length)],
        `关于${['光伏', '充电桩', '电价', '服务', '电网'][i % 5]}的相关政策文件`,
        '电力,政策,规范,标准',
        '详细内容...',
        pubDate.toISOString().split('T')[0],
        effDate.toISOString().split('T')[0]
      );
    }

    console.log('Sample data initialized successfully');
  }
}

initSampleData();

app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.get('/api/users', (req, res) => {
  try {
    const users = db.prepare('SELECT * FROM user_profiles').all();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/users/:userId', (req, res) => {
  try {
    const user = db.prepare('SELECT * FROM user_profiles WHERE user_id = ?').get(req.params.userId);
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/meters', (req, res) => {
  try {
    const meters = db.prepare('SELECT * FROM meter_points').all();
    res.json(meters);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/meters/:meterId', (req, res) => {
  try {
    const meter = db.prepare('SELECT * FROM meter_points WHERE meter_id = ?').get(req.params.meterId);
    if (!meter) {
      return res.status(404).json({ error: '计量点不存在' });
    }
    res.json(meter);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/bills', (req, res) => {
  try {
    const { meter_id, status } = req.query;
    let query = 'SELECT * FROM electricity_bills WHERE 1=1';
    const params = [];
    
    if (meter_id) {
      query += ' AND meter_id = ?';
      params.push(meter_id);
    }
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    
    const bills = db.prepare(query).all(...params);
    res.json(bills);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/bills/:billId/pay', (req, res) => {
  try {
    const result = db.prepare('UPDATE electricity_bills SET status = ?, paid_at = ? WHERE bill_id = ?')
      .run('paid', new Date().toISOString(), req.params.billId);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: '账单不存在' });
    }
    
    res.json({ message: '支付成功', bill_id: req.params.billId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/outages', (req, res) => {
  try {
    const { status } = req.query;
    let query = 'SELECT * FROM outage_orders';
    const params = [];
    
    if (status) {
      query += ' WHERE status = ?';
      params.push(status);
    }
    
    const outages = db.prepare(query).all(...params);
    res.json(outages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/outages', (req, res) => {
  try {
    const { order_id, meter_id, outage_type, reason, start_time, expected_end_time, status, priority } = req.body;
    
    db.prepare(`
      INSERT INTO outage_orders (order_id, meter_id, outage_type, reason, start_time, expected_end_time, status, priority)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(order_id, meter_id, outage_type, reason, start_time, expected_end_time, status, priority);
    
    res.json({ message: '工单创建成功', order_id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/stations', (req, res) => {
  try {
    const { lat, lon } = req.query;
    let stations = db.prepare('SELECT * FROM charging_stations').all();
    
    if (lat && lon) {
      stations = stations.map(station => {
        const distance = Math.sqrt(
          Math.pow(station.latitude - lat, 2) + Math.pow(station.longitude - lon, 2)
        ) * 111;
        return { ...station, distance_km: Math.round(distance * 100) / 100 };
      });
      stations.sort((a, b) => a.distance_km - b.distance_km);
    }
    
    res.json(stations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/stations/:stationId', (req, res) => {
  try {
    const station = db.prepare('SELECT * FROM charging_stations WHERE station_id = ?').get(req.params.stationId);
    if (!station) {
      return res.status(404).json({ error: '充电站不存在' });
    }
    res.json(station);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/pv/contracts', (req, res) => {
  try {
    const { user_id } = req.query;
    let query = 'SELECT * FROM pv_contracts';
    const params = [];
    
    if (user_id) {
      query += ' WHERE user_id = ?';
      params.push(user_id);
    }
    
    const contracts = db.prepare(query).all(...params);
    res.json(contracts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/pv/contracts', (req, res) => {
  try {
    const { contract_id, user_id, capacity, installation_date, grid_connection_date, status, monthly_generation, monthly_feed_in, subsidy_amount, subsidy_status } = req.body;
    
    db.prepare(`
      INSERT INTO pv_contracts (contract_id, user_id, capacity, installation_date, grid_connection_date, status, monthly_generation, monthly_feed_in, subsidy_amount, subsidy_status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(contract_id, user_id, capacity, installation_date, grid_connection_date, status, monthly_generation || 0, monthly_feed_in || 0, subsidy_amount || 0, subsidy_status || 'pending');
    
    res.json({ message: '并网申请提交成功', contract_id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/analysis/resident/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const meters = db.prepare('SELECT * FROM meter_points WHERE user_id = ?').all(userId);
    
    let totalPeak = 0;
    let totalValley = 0;
    let totalAmount = 0;
    let totalBills = 0;
    
    meters.forEach(meter => {
      const bills = db.prepare('SELECT * FROM electricity_bills WHERE meter_id = ?').all(meter.meter_id);
      totalBills += bills.length;
      bills.forEach(bill => {
        totalPeak += bill.peak_usage;
        totalValley += bill.valley_usage;
        totalAmount += bill.amount;
      });
    });
    
    const tips = [];
    const peakRatio = totalPeak + totalValley > 0 ? (totalPeak / (totalPeak + totalValley) * 100) : 0;
    const averageMonthly = totalBills > 0 ? (totalAmount / totalBills) : 0;
    
    if (peakRatio > 50) {
      tips.push('建议将大功率电器使用时间调整至谷时段，可节省电费');
    }
    if (averageMonthly > 500) {
      tips.push('您的月均电费较高，建议检查是否存在待机功耗');
    }
    if (averageMonthly < 200) {
      tips.push('您的用电效率很高，继续保持');
    }
    
    res.json({
      user_id: userId,
      total_bills: totalBills,
      peak_ratio: Math.round(peakRatio * 10) / 10,
      valley_ratio: Math.round((100 - peakRatio) * 10) / 10,
      average_monthly: Math.round(averageMonthly * 100) / 100,
      tips
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/analysis/enterprise/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const meters = db.prepare('SELECT * FROM meter_points WHERE user_id = ?').all(userId);
    
    const totalCapacity = meters.reduce((sum, m) => sum + m.capacity, 0);
    let totalUsage = 0;
    let totalAmount = 0;
    
    meters.forEach(meter => {
      const bills = db.prepare('SELECT * FROM electricity_bills WHERE meter_id = ?').all(meter.meter_id);
      bills.forEach(bill => {
        totalUsage += bill.total_usage;
        totalAmount += bill.amount;
      });
    });
    
    const efficiency = meters.length > 0 ? ((totalUsage / (meters.length * 730 * 24)) * 100) : 0;
    const recommendations = [];
    
    if (efficiency < 50) {
      recommendations.push('建议安装功率因数补偿装置');
    } else {
      recommendations.push('负载利用率良好');
    }
    recommendations.push('考虑错峰生产以降低峰值电费');
    recommendations.push('建议进行能源审计');
    
    res.json({
      user_id: userId,
      total_meters: meters.length,
      total_capacity: Math.round(totalCapacity * 100) / 100,
      total_usage_ytd: Math.round(totalUsage * 100) / 100,
      total_amount_ytd: Math.round(totalAmount * 100) / 100,
      load_utilization: Math.round(efficiency * 100) / 100,
      average_price_per_kwh: totalUsage > 0 ? Math.round((totalAmount / totalUsage) * 10000) / 10000 : 0,
      diagnosis: {
        load_level: efficiency > 70 ? 'high' : efficiency > 40 ? 'medium' : 'low',
        recommendations
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/satisfaction', (req, res) => {
  try {
    const satisfactions = db.prepare('SELECT * FROM service_satisfaction ORDER BY created_at DESC').all();
    res.json(satisfactions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/satisfaction', (req, res) => {
  try {
    const { evaluation_id, order_id, user_id, service_type, score, comment } = req.body;
    
    db.prepare(`
      INSERT INTO service_satisfaction (evaluation_id, order_id, user_id, service_type, score, comment)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(evaluation_id, order_id, user_id, service_type, score, comment);
    
    res.json({ message: '评价提交成功', evaluation_id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/policy', (req, res) => {
  try {
    const { keyword, category } = req.query;
    let query = 'SELECT * FROM policy_documents WHERE 1=1';
    const params = [];
    
    if (keyword) {
      query += ' AND keywords LIKE ?';
      params.push(`%${keyword}%`);
    }
    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }
    
    const policies = db.prepare(query).all(...params);
    res.json(policies);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/warnings', (req, res) => {
  try {
    const { user_id } = req.query;
    let query = 'SELECT * FROM outage_warnings ORDER BY sent_at DESC';
    const params = [];
    
    if (user_id) {
      query = 'SELECT * FROM outage_warnings WHERE user_id = ? ORDER BY sent_at DESC';
      params.push(user_id);
    }
    
    const warnings = db.prepare(query).all(...params);
    res.json(warnings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/warnings', (req, res) => {
  try {
    const { warning_id, order_id, user_id, message, sent_at, read_status } = req.body;
    
    db.prepare(`
      INSERT INTO outage_warnings (warning_id, order_id, user_id, message, sent_at, read_status)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(warning_id, order_id, user_id, message, sent_at || new Date().toISOString(), read_status || 'unread');
    
    res.json({ message: '预警发送成功', warning_id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/statistics', (req, res) => {
  try {
    const totalUsers = db.prepare('SELECT COUNT(*) as count FROM user_profiles').get().count;
    const totalMeters = db.prepare('SELECT COUNT(*) as count FROM meter_points').get().count;
    const totalBills = db.prepare('SELECT COUNT(*) as count FROM electricity_bills').get().count;
    const pendingBills = db.prepare("SELECT COUNT(*) as count FROM electricity_bills WHERE status = 'pending'").get().count;
    const activeOutages = db.prepare("SELECT COUNT(*) as count FROM outage_orders WHERE status != 'resolved'").get().count;
    const totalStations = db.prepare('SELECT COUNT(*) as count FROM charging_stations').get().count;
    const availableStations = db.prepare('SELECT COUNT(*) as count FROM charging_stations WHERE available_ports > 0').get().count;
    const totalPVContracts = db.prepare('SELECT COUNT(*) as count FROM pv_contracts').get().count;
    
    const satisfactions = db.prepare('SELECT score FROM service_satisfaction').all();
    const averageSatisfaction = satisfactions.length > 0 
      ? Math.round((satisfactions.reduce((sum, s) => sum + s.score, 0) / satisfactions.length) * 100) / 100 
      : 0;
    
    res.json({
      total_users: totalUsers,
      total_meters: totalMeters,
      total_bills: totalBills,
      pending_bills: pendingBills,
      active_outages: activeOutages,
      total_stations: totalStations,
      available_stations: availableStations,
      total_pv_contracts: totalPVContracts,
      average_satisfaction: averageSatisfaction
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Backend server running on http://127.0.0.1:${PORT}`);
});
