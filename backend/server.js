require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const PROJECT_DIR = path.resolve(__dirname, '..');
const FRONTEND_PORT = Number(process.env.FRONTEND_PORT || 43447);
const BACKEND_PORT = Number(process.env.BACKEND_PORT || 53447);
const DB_PATH = path.resolve(PROJECT_DIR, process.env.DB_PATH || './data/app.sqlite');

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initializeDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS routes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      start_station TEXT NOT NULL,
      end_station TEXT NOT NULL,
      distance_km REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      headway_min INTEGER NOT NULL DEFAULT 12,
      first_bus_time TEXT NOT NULL DEFAULT '06:00',
      last_bus_time TEXT NOT NULL DEFAULT '22:00',
      direction TEXT NOT NULL DEFAULT '双向',
      vehicle_count INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS route_stations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      route_id INTEGER NOT NULL,
      station_name TEXT NOT NULL,
      station_order INTEGER NOT NULL,
      distance_from_start REAL NOT NULL DEFAULT 0,
      avg_dwell_seconds INTEGER NOT NULL DEFAULT 30,
      is_terminal INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS route_time_periods (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      route_id INTEGER NOT NULL,
      period_name TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      headway_min INTEGER NOT NULL,
      vehicle_count INTEGER NOT NULL DEFAULT 1,
      FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS vehicles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      plate_no TEXT NOT NULL UNIQUE,
      model TEXT NOT NULL,
      capacity INTEGER NOT NULL,
      fuel_type TEXT NOT NULL DEFAULT 'electric',
      battery_percent INTEGER NOT NULL DEFAULT 100,
      status TEXT NOT NULL DEFAULT 'standby',
      route_id INTEGER,
      current_lat REAL,
      current_lng REAL,
      current_station_id INTEGER,
      km_today REAL NOT NULL DEFAULT 0,
      total_km REAL NOT NULL DEFAULT 0,
      last_charge_time TEXT,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (route_id) REFERENCES routes(id)
    );

    CREATE TABLE IF NOT EXISTS drivers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT,
      license_no TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL DEFAULT 'available',
      safety_score INTEGER NOT NULL DEFAULT 100,
      team_id INTEGER,
      daily_work_minutes INTEGER NOT NULL DEFAULT 0,
      max_daily_minutes INTEGER NOT NULL DEFAULT 480,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS driver_teams (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      team_name TEXT NOT NULL,
      route_id INTEGER,
      leader_id INTEGER,
      member_count INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (route_id) REFERENCES routes(id),
      FOREIGN KEY (leader_id) REFERENCES drivers(id)
    );

    CREATE TABLE IF NOT EXISTS dispatches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      dispatch_no TEXT NOT NULL UNIQUE,
      route_id INTEGER NOT NULL,
      vehicle_id INTEGER NOT NULL,
      driver_id INTEGER NOT NULL,
      planned_departure TEXT NOT NULL,
      planned_arrival TEXT NOT NULL,
      actual_departure TEXT,
      actual_arrival TEXT,
      passenger_load INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'scheduled',
      dispatch_type TEXT NOT NULL DEFAULT 'normal',
      skip_stations TEXT,
      short_turn_start INTEGER,
      short_turn_end INTEGER,
      note TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (route_id) REFERENCES routes(id),
      FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
      FOREIGN KEY (driver_id) REFERENCES drivers(id)
    );

    CREATE TABLE IF NOT EXISTS shift_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      plan_date TEXT NOT NULL,
      route_id INTEGER NOT NULL,
      period_name TEXT NOT NULL,
      vehicle_count INTEGER NOT NULL,
      driver_count INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (route_id) REFERENCES routes(id)
    );

    CREATE TABLE IF NOT EXISTS shift_tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      shift_plan_id INTEGER NOT NULL,
      route_id INTEGER NOT NULL,
      vehicle_id INTEGER,
      driver_id INTEGER,
      task_type TEXT NOT NULL DEFAULT 'outbound',
      planned_start TEXT NOT NULL,
      planned_end TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      FOREIGN KEY (shift_plan_id) REFERENCES shift_plans(id) ON DELETE CASCADE,
      FOREIGN KEY (route_id) REFERENCES routes(id),
      FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
      FOREIGN KEY (driver_id) REFERENCES drivers(id)
    );

    CREATE TABLE IF NOT EXISTS vehicle_positions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vehicle_id INTEGER NOT NULL,
      route_id INTEGER,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      speed_kmh REAL NOT NULL DEFAULT 0,
      heading REAL NOT NULL DEFAULT 0,
      station_id INTEGER,
      next_station_id INTEGER,
      eta_seconds INTEGER,
      is_delayed INTEGER NOT NULL DEFAULT 0,
      delay_minutes INTEGER NOT NULL DEFAULT 0,
      recorded_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
    );

    CREATE TABLE IF NOT EXISTS dispatch_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_type TEXT NOT NULL,
      route_id INTEGER,
      vehicle_id INTEGER,
      driver_id INTEGER,
      severity TEXT NOT NULL DEFAULT 'medium',
      description TEXT NOT NULL,
      location TEXT,
      status TEXT NOT NULL DEFAULT 'open',
      reported_at TEXT DEFAULT CURRENT_TIMESTAMP,
      resolved_at TEXT,
      FOREIGN KEY (route_id) REFERENCES routes(id),
      FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
      FOREIGN KEY (driver_id) REFERENCES drivers(id)
    );

    CREATE TABLE IF NOT EXISTS dispatch_instructions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      dispatch_id INTEGER,
      event_id INTEGER,
      instruction_type TEXT NOT NULL,
      instruction_data TEXT,
      issued_by TEXT NOT NULL DEFAULT 'dispatcher',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (dispatch_id) REFERENCES dispatches(id),
      FOREIGN KEY (event_id) REFERENCES dispatch_events(id)
    );

    CREATE TABLE IF NOT EXISTS holiday_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      route_id INTEGER NOT NULL,
      holiday_name TEXT NOT NULL,
      holiday_date TEXT NOT NULL,
      first_bus_time TEXT NOT NULL,
      last_bus_time TEXT NOT NULL,
      headway_min INTEGER NOT NULL,
      vehicle_count INTEGER NOT NULL DEFAULT 1,
      FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS driver_work_hours (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      driver_id INTEGER NOT NULL,
      work_date TEXT NOT NULL,
      shift_start TEXT,
      shift_end TEXT,
      break_start TEXT,
      break_end TEXT,
      total_minutes INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'scheduled',
      FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS vehicle_fuel (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vehicle_id INTEGER NOT NULL,
      fuel_type TEXT NOT NULL DEFAULT 'electric',
      amount REAL NOT NULL DEFAULT 0,
      station_name TEXT,
      started_at TEXT,
      completed_at TEXT,
      status TEXT NOT NULL DEFAULT 'planned',
      FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
    );
  `);

  function safeAlter(table, column, def) {
    try { db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${def}`); } catch(e) {}
  }
  safeAlter('routes', 'first_bus_time', "TEXT NOT NULL DEFAULT '06:00'");
  safeAlter('routes', 'last_bus_time', "TEXT NOT NULL DEFAULT '22:00'");
  safeAlter('routes', 'direction', "TEXT NOT NULL DEFAULT '双向'");
  safeAlter('routes', 'vehicle_count', "INTEGER NOT NULL DEFAULT 0");
  safeAlter('vehicles', 'fuel_type', "TEXT NOT NULL DEFAULT 'electric'");
  safeAlter('vehicles', 'current_lat', 'REAL');
  safeAlter('vehicles', 'current_lng', 'REAL');
  safeAlter('vehicles', 'current_station_id', 'INTEGER');
  safeAlter('vehicles', 'km_today', 'REAL NOT NULL DEFAULT 0');
  safeAlter('vehicles', 'total_km', 'REAL NOT NULL DEFAULT 0');
  safeAlter('vehicles', 'last_charge_time', 'TEXT');
  safeAlter('drivers', 'team_id', 'INTEGER');
  safeAlter('drivers', 'daily_work_minutes', 'INTEGER NOT NULL DEFAULT 0');
  safeAlter('drivers', 'max_daily_minutes', 'INTEGER NOT NULL DEFAULT 480');
  safeAlter('dispatches', 'actual_departure', 'TEXT');
  safeAlter('dispatches', 'actual_arrival', 'TEXT');
  safeAlter('dispatches', 'dispatch_type', "TEXT NOT NULL DEFAULT 'normal'");
  safeAlter('dispatches', 'skip_stations', 'TEXT');
  safeAlter('dispatches', 'short_turn_start', 'INTEGER');
  safeAlter('dispatches', 'short_turn_end', 'INTEGER');
}

function seedDatabase() {
  const routeCount = db.prepare('SELECT COUNT(*) AS count FROM routes').get().count;
  if (routeCount > 0) return;

  const insertRoute = db.prepare(`INSERT INTO routes (name, start_station, end_station, distance_km, status, headway_min, first_bus_time, last_bus_time, direction, vehicle_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  const insertStation = db.prepare(`INSERT INTO route_stations (route_id, station_name, station_order, distance_from_start, avg_dwell_seconds, is_terminal) VALUES (?, ?, ?, ?, ?, ?)`);
  const insertTimePeriod = db.prepare(`INSERT INTO route_time_periods (route_id, period_name, start_time, end_time, headway_min, vehicle_count) VALUES (?, ?, ?, ?, ?, ?)`);
  const insertVehicle = db.prepare(`INSERT INTO vehicles (plate_no, model, capacity, fuel_type, battery_percent, status, route_id, current_lat, current_lng, km_today, total_km) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  const insertDriver = db.prepare(`INSERT INTO drivers (name, phone, license_no, status, safety_score, team_id, daily_work_minutes, max_daily_minutes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
  const insertTeam = db.prepare(`INSERT INTO driver_teams (team_name, route_id, leader_id, member_count) VALUES (?, ?, ?, ?)`);
  const insertDispatch = db.prepare(`INSERT INTO dispatches (dispatch_no, route_id, vehicle_id, driver_id, planned_departure, planned_arrival, actual_departure, actual_arrival, passenger_load, status, dispatch_type, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  const insertPosition = db.prepare(`INSERT INTO vehicle_positions (vehicle_id, route_id, lat, lng, speed_kmh, heading, station_id, next_station_id, eta_seconds, is_delayed, delay_minutes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  const insertEvent = db.prepare(`INSERT INTO dispatch_events (event_type, route_id, vehicle_id, driver_id, severity, description, location, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
  const insertHoliday = db.prepare(`INSERT INTO holiday_plans (route_id, holiday_name, holiday_date, first_bus_time, last_bus_time, headway_min, vehicle_count) VALUES (?, ?, ?, ?, ?, ?, ?)`);
  const insertWorkHours = db.prepare(`INSERT INTO driver_work_hours (driver_id, work_date, shift_start, shift_end, break_start, break_end, total_minutes, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
  const insertFuel = db.prepare(`INSERT INTO vehicle_fuel (vehicle_id, fuel_type, amount, station_name, started_at, completed_at, status) VALUES (?, ?, ?, ?, ?, ?, ?)`);
  const insertShiftPlan = db.prepare(`INSERT INTO shift_plans (plan_date, route_id, period_name, vehicle_count, driver_count, status) VALUES (?, ?, ?, ?, ?, ?)`);
  const insertShiftTask = db.prepare(`INSERT INTO shift_tasks (shift_plan_id, route_id, vehicle_id, driver_id, task_type, planned_start, planned_end, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);

  const seed = db.transaction(() => {
    const r1 = insertRoute.run('一号线', '中央枢纽站', '科创园东门', 18.6, 'active', 8, '05:30', '23:00', '双向', 12).lastInsertRowid;
    const r2 = insertRoute.run('三号线环城支线', '北客运站', '南湖换乘中心', 26.4, 'active', 12, '06:00', '22:00', '双向', 8).lastInsertRowid;
    const r3 = insertRoute.run('夜间保障线', '市民广场', '高铁西站', 14.2, 'active', 20, '21:30', '01:00', '单向', 4).lastInsertRowid;
    const r4 = insertRoute.run('机场快线', '火车站北广场', '国际机场T3', 32.8, 'active', 15, '05:00', '23:30', '双向', 6).lastInsertRowid;

    [['中央枢纽站',0,60,1],['人民路',2.1,30,0],['市政府',4.8,45,0],['科技大道',7.2,30,0],['大学城北',9.5,40,0],['体育中心',12.0,30,0],['金融街',14.3,35,0],['科创园东门',18.6,60,1]].forEach((s,i) => insertStation.run(r1,s[0],i+1,s[1],s[2],s[3]));
    [['北客运站',0,60,1],['北环路',3.2,30,0],['中山路口',6.8,40,0],['东门桥',10.5,30,0],['南湖公园',15.0,35,0],['南湖换乘中心',26.4,60,1]].forEach((s,i) => insertStation.run(r2,s[0],i+1,s[1],s[2],s[3]));
    [['市民广场',0,60,1],['人民医院',3.5,40,0],['高铁西站',14.2,60,1]].forEach((s,i) => insertStation.run(r3,s[0],i+1,s[1],s[2],s[3]));
    [['火车站北广场',0,60,1],['高速入口',8.0,20,0],['航空城',20.5,30,0],['国际机场T3',32.8,60,1]].forEach((s,i) => insertStation.run(r4,s[0],i+1,s[1],s[2],s[3]));

    insertTimePeriod.run(r1,'早高峰','06:30','09:00',5,10);
    insertTimePeriod.run(r1,'平峰','09:00','16:30',10,6);
    insertTimePeriod.run(r1,'晚高峰','16:30','19:30',5,10);
    insertTimePeriod.run(r1,'夜间','19:30','23:00',15,4);
    insertTimePeriod.run(r2,'早高峰','07:00','09:00',8,5);
    insertTimePeriod.run(r2,'平峰','09:00','17:00',15,3);
    insertTimePeriod.run(r2,'晚高峰','17:00','19:30',8,5);

    const t1 = insertTeam.run('一号线甲班',r1,null,4).lastInsertRowid;
    const t2 = insertTeam.run('三号线乙班',r2,null,3).lastInsertRowid;
    const t3 = insertTeam.run('夜间保障班',r3,null,2).lastInsertRowid;
    const t4 = insertTeam.run('机场快线班',r4,null,2).lastInsertRowid;

    const v1 = insertVehicle.run('京A-D63447','BYD K9',78,'electric',86,'running',r1,39.915,116.404,86.3,18250).lastInsertRowid;
    const v2 = insertVehicle.run('京A-D63448','宇通 E12',82,'electric',72,'standby',r2,39.928,116.416,42.1,15430).lastInsertRowid;
    const v3 = insertVehicle.run('京A-D63449','中车 C11',65,'electric',91,'running',r3,39.901,116.382,18.7,12800).lastInsertRowid;
    const v4 = insertVehicle.run('京A-D63450','福田 BJ6123',72,'diesel',0,'maintenance',null,null,null,0,22100).lastInsertRowid;
    const v5 = insertVehicle.run('京A-D63451','金龙 XMQ',90,'electric',55,'running',r1,39.920,116.398,102.5,16800).lastInsertRowid;
    const v6 = insertVehicle.run('京A-D63452','比亚迪 B10',70,'electric',38,'charging',null,null,null,0,19500).lastInsertRowid;
    const v7 = insertVehicle.run('京A-D63453','申龙 SLK',80,'electric',95,'running',r4,39.944,116.360,64.2,14300).lastInsertRowid;
    const v8 = insertVehicle.run('京A-D63454','安凯 HFF',68,'gas',0,'standby',r2,null,null,0,21200).lastInsertRowid;

    const d1 = insertDriver.run('陈建国','13800010001','BUS-110047','on_duty',98,t1,360,480).lastInsertRowid;
    const d2 = insertDriver.run('刘海燕','13800010002','BUS-110048','available',96,t1,0,480).lastInsertRowid;
    const d3 = insertDriver.run('王明','13800010003','BUS-110049','on_duty',94,t2,420,480).lastInsertRowid;
    const d4 = insertDriver.run('赵雪','13800010004','BUS-110050','resting',99,t2,480,480).lastInsertRowid;
    const d5 = insertDriver.run('孙伟','13800010005','BUS-110051','on_duty',97,t3,300,480).lastInsertRowid;
    const d6 = insertDriver.run('周丽','13800010006','BUS-110052','available',95,t3,0,480).lastInsertRowid;
    const d7 = insertDriver.run('吴强','13800010007','BUS-110053','on_duty',93,t4,380,480).lastInsertRowid;
    const d8 = insertDriver.run('郑芳','13800010008','BUS-110054','leave',100,t4,0,480).lastInsertRowid;

    db.prepare('UPDATE driver_teams SET leader_id = ? WHERE id = ?').run(d1,t1);
    db.prepare('UPDATE driver_teams SET leader_id = ? WHERE id = ?').run(d3,t2);
    db.prepare('UPDATE driver_teams SET leader_id = ? WHERE id = ?').run(d5,t3);
    db.prepare('UPDATE driver_teams SET leader_id = ? WHERE id = ?').run(d7,t4);

    const today = '2026-05-28';
    insertDispatch.run('D20260528-001',r1,v1,d1,`${today} 07:20`,`${today} 08:08`,`${today} 07:22`,null,61,'running','normal','早高峰加密班次');
    insertDispatch.run('D20260528-002',r2,v2,d2,`${today} 08:00`,`${today} 09:05`,null,null,44,'scheduled','normal','换乘站客流预警');
    insertDispatch.run('D20260528-003',r3,v3,d5,`${today} 22:10`,`${today} 22:45`,null,null,19,'scheduled','normal','夜间保障');
    insertDispatch.run('D20260527-008',r1,v4,d4,'2026-05-27 18:10','2026-05-27 18:58','2026-05-27 18:12','2026-05-27 19:02',70,'completed','normal','晚高峰已完成');
    insertDispatch.run('D20260528-004',r1,v5,d3,`${today} 07:35`,`${today} 08:23`,`${today} 07:36`,null,55,'running','normal','早高峰常规');
    insertDispatch.run('D20260528-005',r4,v7,d7,`${today} 09:00`,`${today} 09:55`,null,null,32,'scheduled','normal','机场快线上午');

    insertPosition.run(v1,r1,39.915,116.404,32.5,90,3,4,180,0,0);
    insertPosition.run(v5,r1,39.920,116.398,28.0,270,5,6,240,1,3);
    insertPosition.run(v3,r3,39.901,116.382,45.0,180,1,2,120,0,0);
    insertPosition.run(v7,r4,39.944,116.360,65.0,45,2,3,300,0,0);

    insertEvent.run('traffic_jam',r1,v5,null,'high','科技大道至体育中心段拥堵，预计延误5-8分钟','科技大道-体育中心','open');
    insertEvent.run('vehicle_fault',r1,v4,null,'critical','发动机异响，已安排进站检修','中央枢纽站','processing');
    insertEvent.run('driver_leave',null,null,d8,'medium','郑芳申请事假，需安排替班',null,'open');
    insertEvent.run('weather',null,null,null,'medium','暴雨黄色预警，全线限速运行','全市','open');
    insertEvent.run('complaint',r2,v2,d2,'low','乘客反映班次间隔过大','北客运站','open');

    insertHoliday.run(r1,'元旦','2026-01-01','06:00','23:30',8,10);
    insertHoliday.run(r1,'春节除夕','2026-02-17','06:30','20:00',12,6);
    insertHoliday.run(r1,'国庆节','2026-10-01','05:00','24:00',5,12);
    insertHoliday.run(r2,'国庆节','2026-10-01','06:00','23:00',8,6);

    insertWorkHours.run(d1,today,`${today} 06:00`,null,`${today} 10:00`,`${today} 10:20`,360,'on_duty');
    insertWorkHours.run(d3,today,`${today} 07:00`,null,`${today} 11:00`,`${today} 11:20`,420,'on_duty');
    insertWorkHours.run(d5,today,`${today} 21:30`,null,null,null,300,'on_duty');
    insertWorkHours.run(d7,today,`${today} 08:00`,null,`${today} 12:00`,`${today} 12:20`,380,'on_duty');
    insertWorkHours.run(d4,'2026-05-27','2026-05-27 17:00','2026-05-27 19:02',null,null,480,'completed');
    insertWorkHours.run(d8,today,null,null,null,null,0,'leave');

    insertFuel.run(v6,'electric',62,'科创园充电站',`${today} 08:30`,`${today} 10:30`,'in_progress');
    insertFuel.run(v4,'diesel',80,'北客运加油站',`${today} 09:00`,null,'planned');

    const sp1 = insertShiftPlan.run(today,r1,'早高峰',10,10,'approved').lastInsertRowid;
    const sp2 = insertShiftPlan.run(today,r1,'平峰',6,6,'approved').lastInsertRowid;
    const sp3 = insertShiftPlan.run(today,r2,'全天',8,8,'draft').lastInsertRowid;

    insertShiftTask.run(sp1,r1,v1,d1,'outbound',`${today} 05:30`,`${today} 09:30`,'in_progress');
    insertShiftTask.run(sp1,r1,v5,d3,'outbound',`${today} 06:00`,`${today} 10:00`,'in_progress');
    insertShiftTask.run(sp1,r1,v2,d2,'outbound',`${today} 06:30`,`${today} 10:30`,'pending');
    insertShiftTask.run(sp2,r1,v6,d2,'outbound',`${today} 09:30`,`${today} 16:30`,'pending');
    insertShiftTask.run(sp3,r2,v8,d4,'outbound',`${today} 06:00`,`${today} 14:00`,'pending');
  });

  seed();
}

initializeDatabase();
seedDatabase();

if (process.argv.includes('--seed-only')) {
  console.log(`SQLite database ready: ${DB_PATH}`);
  db.close();
  process.exit(0);
}

const app = express();

app.use(cors({
  origin: [`http://127.0.0.1:${FRONTEND_PORT}`, `http://localhost:${FRONTEND_PORT}`],
  credentials: true
}));
app.use(express.json({ limit: '2mb' }));

function all(sql, params) { return db.prepare(sql).all(...(params || [])); }
function one(sql, params) { return db.prepare(sql).get(...(params || [])); }
function run(sql, params) { return db.prepare(sql).run(...(params || [])); }

function getCounts() {
  return {
    routes: one('SELECT COUNT(*) AS count FROM routes').count,
    vehicles: one('SELECT COUNT(*) AS count FROM vehicles').count,
    drivers: one('SELECT COUNT(*) AS count FROM drivers').count,
    dispatches: one('SELECT COUNT(*) AS count FROM dispatches').count,
    events_open: one("SELECT COUNT(*) AS count FROM dispatch_events WHERE status = 'open'").count,
    running: one("SELECT COUNT(*) AS count FROM dispatches WHERE status = 'running'").count,
    scheduled: one("SELECT COUNT(*) AS count FROM dispatches WHERE status = 'scheduled'").count
  };
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'bus-dispatch-backend', database: DB_PATH, counts: getCounts(), timestamp: new Date().toISOString() });
});

app.get('/api/dashboard', (req, res) => {
  const load = one(`SELECT COALESCE(AVG(passenger_load),0) AS average_load, COALESCE(MAX(passenger_load),0) AS peak_load FROM dispatches WHERE date(planned_departure) >= date('now','-1 day')`);
  const routeLoads = all(`SELECT r.id, r.name, r.status, COALESCE(AVG(d.passenger_load),0) AS average_load, COUNT(d.id) AS dispatch_count FROM routes r LEFT JOIN dispatches d ON d.route_id = r.id GROUP BY r.id ORDER BY average_load DESC`);
  const upcoming = all(`SELECT d.*, r.name AS route_name, v.plate_no, dr.name AS driver_name FROM dispatches d JOIN routes r ON d.route_id = r.id JOIN vehicles v ON d.vehicle_id = v.id JOIN drivers dr ON d.driver_id = dr.id WHERE d.status IN ('scheduled','running') ORDER BY d.planned_departure ASC LIMIT 10`);
  const positions = all(`SELECT vp.*, v.plate_no, v.model, r.name AS route_name FROM vehicle_positions vp JOIN vehicles v ON vp.vehicle_id = v.id LEFT JOIN routes r ON vp.route_id = r.id ORDER BY vp.recorded_at DESC`);
  const alerts = all(`SELECT de.*, r.name AS route_name, v.plate_no, dr.name AS driver_name FROM dispatch_events de LEFT JOIN routes r ON de.route_id = r.id LEFT JOIN vehicles v ON de.vehicle_id = v.id LEFT JOIN drivers dr ON de.driver_id = dr.id WHERE de.status IN ('open','processing') ORDER BY de.reported_at DESC LIMIT 10`);
  const vehicleStatus = all(`SELECT status, COUNT(*) AS count FROM vehicles GROUP BY status`);
  res.json({ counts: getCounts(), load, routeLoads, upcoming, positions, alerts, vehicleStatus });
});

app.get('/api/routes', (req, res) => {
  res.json({ data: all(`SELECT r.*, COUNT(DISTINCT d.id) AS dispatch_count, COALESCE(AVG(d.passenger_load),0) AS average_load, (SELECT COUNT(*) FROM route_stations rs WHERE rs.route_id = r.id) AS station_count FROM routes r LEFT JOIN dispatches d ON d.route_id = r.id GROUP BY r.id ORDER BY r.id`) });
});

app.get('/api/routes/:id', (req, res) => {
  const route = one('SELECT * FROM routes WHERE id = ?', [req.params.id]);
  if (!route) return res.status(404).json({ error: '线路不存在' });
  const stations = all('SELECT * FROM route_stations WHERE route_id = ? ORDER BY station_order', [route.id]);
  const timePeriods = all('SELECT * FROM route_time_periods WHERE route_id = ? ORDER BY start_time', [route.id]);
  const vehicles = all('SELECT * FROM vehicles WHERE route_id = ?', [route.id]);
  const teams = all('SELECT dt.*, d.name AS leader_name FROM driver_teams dt LEFT JOIN drivers d ON dt.leader_id = d.id WHERE dt.route_id = ?', [route.id]);
  const holidays = all('SELECT * FROM holiday_plans WHERE route_id = ? ORDER BY holiday_date', [route.id]);
  res.json({ data: route, stations, timePeriods, vehicles, teams, holidays });
});

app.post('/api/routes', (req, res) => {
  const { name, start_station, end_station, distance_km, headway_min, first_bus_time, last_bus_time, direction, vehicle_count } = req.body;
  if (!name || !start_station || !end_station || !distance_km) return res.status(400).json({ error: '线路名称、起终点、里程为必填项' });
  const result = run(`INSERT INTO routes (name, start_station, end_station, distance_km, status, headway_min, first_bus_time, last_bus_time, direction, vehicle_count) VALUES (?, ?, ?, ?, 'active', ?, ?, ?, ?, ?)`, [name, start_station, end_station, distance_km, headway_min || 12, first_bus_time || '06:00', last_bus_time || '22:00', direction || '双向', vehicle_count || 0]);
  res.status(201).json({ id: result.lastInsertRowid });
});

app.put('/api/routes/:id', (req, res) => {
  const { name, start_station, end_station, distance_km, status, headway_min, first_bus_time, last_bus_time, direction, vehicle_count } = req.body;
  run(`UPDATE routes SET name=?, start_station=?, end_station=?, distance_km=?, status=?, headway_min=?, first_bus_time=?, last_bus_time=?, direction=?, vehicle_count=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`, [name, start_station, end_station, distance_km, status, headway_min, first_bus_time, last_bus_time, direction, vehicle_count, req.params.id]);
  res.json({ updated: true });
});

app.delete('/api/routes/:id', (req, res) => {
  run('DELETE FROM routes WHERE id = ?', [req.params.id]);
  res.json({ deleted: true });
});

app.get('/api/routes/:id/stations', (req, res) => {
  res.json({ data: all('SELECT * FROM route_stations WHERE route_id = ? ORDER BY station_order', [req.params.id]) });
});

app.post('/api/routes/:id/stations', (req, res) => {
  const { station_name, station_order, distance_from_start, avg_dwell_seconds, is_terminal } = req.body;
  if (!station_name) return res.status(400).json({ error: '站点名称为必填项' });
  const result = run(`INSERT INTO route_stations (route_id, station_name, station_order, distance_from_start, avg_dwell_seconds, is_terminal) VALUES (?, ?, ?, ?, ?, ?)`, [req.params.id, station_name, station_order || 0, distance_from_start || 0, avg_dwell_seconds || 30, is_terminal ? 1 : 0]);
  res.status(201).json({ id: result.lastInsertRowid });
});

app.put('/api/route-stations/:sid', (req, res) => {
  const { station_name, station_order, distance_from_start, avg_dwell_seconds, is_terminal } = req.body;
  run(`UPDATE route_stations SET station_name=?, station_order=?, distance_from_start=?, avg_dwell_seconds=?, is_terminal=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`, [station_name, station_order, distance_from_start, avg_dwell_seconds, is_terminal ? 1 : 0, req.params.sid]);
  res.json({ updated: true });
});

app.delete('/api/route-stations/:sid', (req, res) => {
  run('DELETE FROM route_stations WHERE id = ?', [req.params.sid]);
  res.json({ deleted: true });
});

app.get('/api/routes/:id/time-periods', (req, res) => {
  res.json({ data: all('SELECT * FROM route_time_periods WHERE route_id = ? ORDER BY start_time', [req.params.id]) });
});

app.post('/api/routes/:id/time-periods', (req, res) => {
  const { period_name, start_time, end_time, headway_min, vehicle_count } = req.body;
  if (!period_name || !start_time || !end_time || !headway_min) return res.status(400).json({ error: '时段名、开始/结束时间、间隔为必填' });
  const result = run(`INSERT INTO route_time_periods (route_id, period_name, start_time, end_time, headway_min, vehicle_count) VALUES (?, ?, ?, ?, ?, ?)`, [req.params.id, period_name, start_time, end_time, headway_min, vehicle_count || 1]);
  res.status(201).json({ id: result.lastInsertRowid });
});

app.put('/api/route-time-periods/:pid', (req, res) => {
  const { period_name, start_time, end_time, headway_min, vehicle_count } = req.body;
  run(`UPDATE route_time_periods SET period_name=?, start_time=?, end_time=?, headway_min=?, vehicle_count=? WHERE id=?`, [period_name, start_time, end_time, headway_min, vehicle_count, req.params.pid]);
  res.json({ updated: true });
});

app.delete('/api/route-time-periods/:pid', (req, res) => {
  run('DELETE FROM route_time_periods WHERE id = ?', [req.params.pid]);
  res.json({ deleted: true });
});

app.get('/api/routes/:id/holidays', (req, res) => {
  res.json({ data: all('SELECT * FROM holiday_plans WHERE route_id = ? ORDER BY holiday_date', [req.params.id]) });
});

app.post('/api/routes/:id/holidays', (req, res) => {
  const { holiday_name, holiday_date, first_bus_time, last_bus_time, headway_min, vehicle_count } = req.body;
  if (!holiday_name || !holiday_date) return res.status(400).json({ error: '节假日名称和日期为必填' });
  const result = run(`INSERT INTO holiday_plans (route_id, holiday_name, holiday_date, first_bus_time, last_bus_time, headway_min, vehicle_count) VALUES (?, ?, ?, ?, ?, ?, ?)`, [req.params.id, holiday_name, holiday_date, first_bus_time || '06:00', last_bus_time || '22:00', headway_min || 12, vehicle_count || 1]);
  res.status(201).json({ id: result.lastInsertRowid });
});

app.put('/api/holiday-plans/:hid', (req, res) => {
  const { holiday_name, holiday_date, first_bus_time, last_bus_time, headway_min, vehicle_count } = req.body;
  run(`UPDATE holiday_plans SET holiday_name=?, holiday_date=?, first_bus_time=?, last_bus_time=?, headway_min=?, vehicle_count=? WHERE id=?`, [holiday_name, holiday_date, first_bus_time, last_bus_time, headway_min, vehicle_count, req.params.hid]);
  res.json({ updated: true });
});

app.delete('/api/holiday-plans/:hid', (req, res) => {
  run('DELETE FROM holiday_plans WHERE id = ?', [req.params.hid]);
  res.json({ deleted: true });
});

app.get('/api/vehicles', (req, res) => {
  res.json({ data: all(`SELECT v.*, r.name AS route_name FROM vehicles v LEFT JOIN routes r ON v.route_id = r.id ORDER BY v.id`) });
});

app.get('/api/vehicles/:id', (req, res) => {
  const vehicle = one(`SELECT v.*, r.name AS route_name FROM vehicles v LEFT JOIN routes r ON v.route_id = r.id WHERE v.id = ?`, [req.params.id]);
  if (!vehicle) return res.status(404).json({ error: '车辆不存在' });
  const fuelRecords = all('SELECT * FROM vehicle_fuel WHERE vehicle_id = ? ORDER BY started_at DESC LIMIT 10', [vehicle.id]);
  res.json({ data: vehicle, fuelRecords });
});

app.post('/api/vehicles', (req, res) => {
  const { plate_no, model, capacity, fuel_type, battery_percent, status, route_id } = req.body;
  if (!plate_no || !model || !capacity) return res.status(400).json({ error: '车牌号、车型、容量为必填' });
  const result = run(`INSERT INTO vehicles (plate_no, model, capacity, fuel_type, battery_percent, status, route_id) VALUES (?, ?, ?, ?, ?, ?, ?)`, [plate_no, model, capacity, fuel_type || 'electric', battery_percent || 100, status || 'standby', route_id || null]);
  res.status(201).json({ id: result.lastInsertRowid });
});

app.put('/api/vehicles/:id', (req, res) => {
  const { plate_no, model, capacity, fuel_type, battery_percent, status, route_id, km_today, total_km } = req.body;
  run(`UPDATE vehicles SET plate_no=?, model=?, capacity=?, fuel_type=?, battery_percent=?, status=?, route_id=?, km_today=?, total_km=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`, [plate_no, model, capacity, fuel_type, battery_percent, status, route_id, km_today, total_km, req.params.id]);
  res.json({ updated: true });
});

app.delete('/api/vehicles/:id', (req, res) => {
  run('DELETE FROM vehicles WHERE id = ?', [req.params.id]);
  res.json({ deleted: true });
});

app.get('/api/drivers', (req, res) => {
  res.json({ data: all(`SELECT d.*, dt.team_name FROM drivers d LEFT JOIN driver_teams dt ON d.team_id = dt.id ORDER BY d.id`) });
});

app.post('/api/drivers', (req, res) => {
  const { name, phone, license_no, status, safety_score, team_id, max_daily_minutes } = req.body;
  if (!name || !license_no) return res.status(400).json({ error: '姓名和驾照号为必填' });
  const result = run(`INSERT INTO drivers (name, phone, license_no, status, safety_score, team_id, max_daily_minutes) VALUES (?, ?, ?, ?, ?, ?, ?)`, [name, phone || '', license_no, status || 'available', safety_score || 100, team_id || null, max_daily_minutes || 480]);
  res.status(201).json({ id: result.lastInsertRowid });
});

app.put('/api/drivers/:id', (req, res) => {
  const { name, phone, license_no, status, safety_score, team_id, daily_work_minutes, max_daily_minutes } = req.body;
  run(`UPDATE drivers SET name=?, phone=?, license_no=?, status=?, safety_score=?, team_id=?, daily_work_minutes=?, max_daily_minutes=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`, [name, phone, license_no, status, safety_score, team_id, daily_work_minutes, max_daily_minutes, req.params.id]);
  res.json({ updated: true });
});

app.delete('/api/drivers/:id', (req, res) => {
  run('DELETE FROM drivers WHERE id = ?', [req.params.id]);
  res.json({ deleted: true });
});

app.get('/api/driver-teams', (req, res) => {
  res.json({ data: all(`SELECT dt.*, d.name AS leader_name, r.name AS route_name FROM driver_teams dt LEFT JOIN drivers d ON dt.leader_id = d.id LEFT JOIN routes r ON dt.route_id = r.id ORDER BY dt.id`) });
});

app.post('/api/driver-teams', (req, res) => {
  const { team_name, route_id, leader_id, member_count } = req.body;
  if (!team_name) return res.status(400).json({ error: '班组名称为必填' });
  const result = run(`INSERT INTO driver_teams (team_name, route_id, leader_id, member_count) VALUES (?, ?, ?, ?)`, [team_name, route_id || null, leader_id || null, member_count || 0]);
  res.status(201).json({ id: result.lastInsertRowid });
});

app.put('/api/driver-teams/:id', (req, res) => {
  const { team_name, route_id, leader_id, member_count } = req.body;
  run(`UPDATE driver_teams SET team_name=?, route_id=?, leader_id=?, member_count=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`, [team_name, route_id, leader_id, member_count, req.params.id]);
  res.json({ updated: true });
});

app.delete('/api/driver-teams/:id', (req, res) => {
  run('DELETE FROM driver_teams WHERE id = ?', [req.params.id]);
  res.json({ deleted: true });
});

app.get('/api/dispatches', (req, res) => {
  const { status, route_id, date } = req.query;
  let sql = `SELECT d.*, r.name AS route_name, v.plate_no, dr.name AS driver_name FROM dispatches d JOIN routes r ON d.route_id = r.id JOIN vehicles v ON d.vehicle_id = v.id JOIN drivers dr ON d.driver_id = dr.id WHERE 1=1`;
  const params = [];
  if (status) { sql += ' AND d.status = ?'; params.push(status); }
  if (route_id) { sql += ' AND d.route_id = ?'; params.push(route_id); }
  if (date) { sql += ' AND date(d.planned_departure) = ?'; params.push(date); }
  sql += ' ORDER BY d.planned_departure DESC';
  res.json({ data: all(sql, params) });
});

app.get('/api/dispatches/:id', (req, res) => {
  const dispatch = one(`SELECT d.*, r.name AS route_name, v.plate_no, dr.name AS driver_name FROM dispatches d JOIN routes r ON d.route_id = r.id JOIN vehicles v ON d.vehicle_id = v.id JOIN drivers dr ON d.driver_id = dr.id WHERE d.id = ?`, [req.params.id]);
  if (!dispatch) return res.status(404).json({ error: '班次不存在' });
  const instructions = all('SELECT * FROM dispatch_instructions WHERE dispatch_id = ? ORDER BY created_at', [dispatch.id]);
  res.json({ data: dispatch, instructions });
});

app.post('/api/dispatches', (req, res) => {
  const { route_id, vehicle_id, driver_id, planned_departure, planned_arrival, passenger_load, dispatch_type, note, skip_stations, short_turn_start, short_turn_end } = req.body;
  if (!route_id || !vehicle_id || !driver_id || !planned_departure || !planned_arrival) return res.status(400).json({ error: '线路、车辆、司机、发车/到达时间为必填' });

  const vehicle = one('SELECT * FROM vehicles WHERE id = ?', [vehicle_id]);
  if (!vehicle) return res.status(400).json({ error: '车辆不存在' });
  if (vehicle.status === 'maintenance') return res.status(400).json({ error: '车辆正在检修，不可排班' });

  const driver = one('SELECT * FROM drivers WHERE id = ?', [driver_id]);
  if (!driver) return res.status(400).json({ error: '司机不存在' });
  if (driver.status === 'leave') return res.status(400).json({ error: '司机请假中，不可排班' });
  if (driver.daily_work_minutes >= driver.max_daily_minutes) return res.status(400).json({ error: '司机已达当日工时上限' });

  const dispatchNo = `D${new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14)}`;
  const dtype = dispatch_type || 'normal';
  const result = run(`INSERT INTO dispatches (dispatch_no, route_id, vehicle_id, driver_id, planned_departure, planned_arrival, passenger_load, status, dispatch_type, note, skip_stations, short_turn_start, short_turn_end) VALUES (?, ?, ?, ?, ?, ?, ?, 'scheduled', ?, ?, ?, ?, ?)`, [dispatchNo, route_id, vehicle_id, driver_id, planned_departure, planned_arrival, Number(passenger_load || 0), dtype, note || '', skip_stations || null, short_turn_start || null, short_turn_end || null]);

  run(`INSERT INTO dispatch_instructions (dispatch_id, instruction_type, instruction_data, issued_by) VALUES (?, 'create', ?, 'system')`, [result.lastInsertRowid, JSON.stringify({ dispatch_type: dtype, skip_stations, short_turn_start, short_turn_end })]);
  res.status(201).json({ id: result.lastInsertRowid, dispatch_no: dispatchNo });
});

app.put('/api/dispatches/:id', (req, res) => {
  const { status, actual_departure, actual_arrival, passenger_load, note } = req.body;
  const dispatch = one('SELECT * FROM dispatches WHERE id = ?', [req.params.id]);
  if (!dispatch) return res.status(404).json({ error: '班次不存在' });
  const updates = [];
  const params = [];
  if (status) { updates.push('status=?'); params.push(status); }
  if (actual_departure) { updates.push('actual_departure=?'); params.push(actual_departure); }
  if (actual_arrival) { updates.push('actual_arrival=?'); params.push(actual_arrival); }
  if (passenger_load !== undefined) { updates.push('passenger_load=?'); params.push(Number(passenger_load)); }
  if (note !== undefined) { updates.push('note=?'); params.push(note); }
  updates.push("updated_at=CURRENT_TIMESTAMP");
  params.push(req.params.id);
  if (updates.length > 1) {
    run(`UPDATE dispatches SET ${updates.join(',')} WHERE id=?`, params);
  }
  res.json({ updated: true });
});

app.post('/api/dispatches/:id/insert-run', (req, res) => {
  const { vehicle_id, driver_id, planned_departure, planned_arrival, note } = req.body;
  const dispatch = one('SELECT * FROM dispatches WHERE id = ?', [req.params.id]);
  if (!dispatch) return res.status(404).json({ error: '班次不存在' });
  const dispatchNo = `INS${new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14)}`;
  const result = run(`INSERT INTO dispatches (dispatch_no, route_id, vehicle_id, driver_id, planned_departure, planned_arrival, passenger_load, status, dispatch_type, note) VALUES (?, ?, ?, ?, ?, ?, 0, 'scheduled', 'insert', ?)`, [dispatchNo, dispatch.route_id, vehicle_id, driver_id, planned_departure, planned_arrival, note || `插班-关联${dispatch.dispatch_no}`]);
  run(`INSERT INTO dispatch_instructions (dispatch_id, event_id, instruction_type, instruction_data, issued_by) VALUES (?, NULL, 'insert_run', ?, 'dispatcher')`, [result.lastInsertRowid, JSON.stringify({ parent_dispatch_id: dispatch.id, vehicle_id, driver_id })]);
  res.status(201).json({ id: result.lastInsertRowid, dispatch_no: dispatchNo, type: 'insert' });
});

app.post('/api/dispatches/:id/short-turn', (req, res) => {
  const { short_turn_start, short_turn_end, planned_departure, planned_arrival, note } = req.body;
  if (!short_turn_start || !short_turn_end) return res.status(400).json({ error: '区间起点和终点站为必填' });
  const dispatch = one('SELECT * FROM dispatches WHERE id = ?', [req.params.id]);
  if (!dispatch) return res.status(404).json({ error: '班次不存在' });
  const dispatchNo = `ST${new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14)}`;
  const result = run(`INSERT INTO dispatches (dispatch_no, route_id, vehicle_id, driver_id, planned_departure, planned_arrival, passenger_load, status, dispatch_type, short_turn_start, short_turn_end, note) VALUES (?, ?, ?, ?, ?, ?, 0, 'scheduled', 'short_turn', ?, ?, ?)`, [dispatchNo, dispatch.route_id, dispatch.vehicle_id, dispatch.driver_id, planned_departure, planned_arrival, short_turn_start, short_turn_end, note || `区间车-关联${dispatch.dispatch_no}`]);
  run(`INSERT INTO dispatch_instructions (dispatch_id, event_id, instruction_type, instruction_data, issued_by) VALUES (?, NULL, 'short_turn', ?, 'dispatcher')`, [result.lastInsertRowid, JSON.stringify({ parent_dispatch_id: dispatch.id, short_turn_start, short_turn_end })]);
  res.status(201).json({ id: result.lastInsertRowid, dispatch_no: dispatchNo, type: 'short_turn' });
});

app.post('/api/dispatches/:id/skip-station', (req, res) => {
  const { skip_stations, note } = req.body;
  if (!skip_stations) return res.status(400).json({ error: '跳站列表为必填' });
  const dispatch = one('SELECT * FROM dispatches WHERE id = ?', [req.params.id]);
  if (!dispatch) return res.status(404).json({ error: '班次不存在' });
  run(`UPDATE dispatches SET dispatch_type='skip_stop', skip_stations=?, note=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`, [skip_stations, note || `跳站-${dispatch.dispatch_no}`, req.params.id]);
  run(`INSERT INTO dispatch_instructions (dispatch_id, instruction_type, instruction_data, issued_by) VALUES (?, 'skip_station', ?, 'dispatcher')`, [dispatch.id, JSON.stringify({ skip_stations })]);
  res.json({ updated: true, type: 'skip_stop' });
});

app.get('/api/shift-plans', (req, res) => {
  const { date, route_id, status } = req.query;
  let sql = `SELECT sp.*, r.name AS route_name FROM shift_plans sp JOIN routes r ON sp.route_id = r.id WHERE 1=1`;
  const params = [];
  if (date) { sql += ' AND sp.plan_date = ?'; params.push(date); }
  if (route_id) { sql += ' AND sp.route_id = ?'; params.push(route_id); }
  if (status) { sql += ' AND sp.status = ?'; params.push(status); }
  sql += ' ORDER BY sp.plan_date DESC, sp.id';
  res.json({ data: all(sql, params) });
});

app.get('/api/shift-plans/:id', (req, res) => {
  const plan = one(`SELECT sp.*, r.name AS route_name FROM shift_plans sp JOIN routes r ON sp.route_id = r.id WHERE sp.id = ?`, [req.params.id]);
  if (!plan) return res.status(404).json({ error: '班次计划不存在' });
  const tasks = all(`SELECT st.*, v.plate_no, dr.name AS driver_name, r.name AS route_name FROM shift_tasks st LEFT JOIN vehicles v ON st.vehicle_id = v.id LEFT JOIN drivers dr ON st.driver_id = dr.id LEFT JOIN routes r ON st.route_id = r.id WHERE st.shift_plan_id = ? ORDER BY st.planned_start`, [plan.id]);
  res.json({ data: plan, tasks });
});

app.post('/api/shift-plans', (req, res) => {
  const { plan_date, route_id, period_name, vehicle_count, driver_count, status } = req.body;
  if (!plan_date || !route_id || !period_name) return res.status(400).json({ error: '计划日期、线路、时段为必填' });
  const result = run(`INSERT INTO shift_plans (plan_date, route_id, period_name, vehicle_count, driver_count, status) VALUES (?, ?, ?, ?, ?, ?)`, [plan_date, route_id, period_name, vehicle_count || 1, driver_count || 1, status || 'draft']);
  res.status(201).json({ id: result.lastInsertRowid });
});

app.put('/api/shift-plans/:id', (req, res) => {
  const { status, vehicle_count, driver_count } = req.body;
  run(`UPDATE shift_plans SET status=?, vehicle_count=?, driver_count=? WHERE id=?`, [status, vehicle_count, driver_count, req.params.id]);
  res.json({ updated: true });
});

app.post('/api/shift-plans/:id/generate-tasks', (req, res) => {
  const plan = one('SELECT * FROM shift_plans WHERE id = ?', [req.params.id]);
  if (!plan) return res.status(404).json({ error: '班次计划不存在' });
  const route = one('SELECT * FROM routes WHERE id = ?', [plan.route_id]);
  const timePeriod = one('SELECT * FROM route_time_periods WHERE route_id = ? AND period_name = ?', [plan.route_id, plan.period_name]);
  const availableVehicles = all("SELECT * FROM vehicles WHERE status IN ('standby','available') AND (route_id = ? OR route_id IS NULL) ORDER BY battery_percent DESC", [plan.route_id]);
  const availableDrivers = all("SELECT * FROM drivers WHERE status IN ('available','resting') AND daily_work_minutes < max_daily_minutes ORDER BY daily_work_minutes ASC");
  const vehicleCount = Math.min(plan.vehicle_count, availableVehicles.length);
  const driverCount = Math.min(plan.driver_count, availableDrivers.length);
  const taskCount = Math.min(vehicleCount, driverCount);
  if (taskCount === 0) return res.status(400).json({ error: '无可用车辆或司机' });
  const startTime = timePeriod ? timePeriod.start_time : route.first_bus_time;
  const headway = timePeriod ? timePeriod.headway_min : route.headway_min;
  const tripMin = Math.round(route.distance_km / 25 * 60);
  let generated = 0;
  const gen = db.transaction(() => {
    for (let i = 0; i < taskCount; i++) {
      const offsetMin = i * headway;
      const [sh, sm] = startTime.split(':').map(Number);
      const startTotalMin = sh * 60 + sm + offsetMin;
      const startH = Math.floor(startTotalMin / 60) % 24;
      const startM = startTotalMin % 60;
      const endTotalMin = startTotalMin + tripMin;
      const endH = Math.floor(endTotalMin / 60) % 24;
      const endM = endTotalMin % 60;
      const pStart = `${plan.plan_date} ${String(startH).padStart(2,'0')}:${String(startM).padStart(2,'0')}`;
      const pEnd = `${plan.plan_date} ${String(endH).padStart(2,'0')}:${String(endM).padStart(2,'0')}`;
      run(`INSERT INTO shift_tasks (shift_plan_id, route_id, vehicle_id, driver_id, task_type, planned_start, planned_end, status) VALUES (?, ?, ?, ?, 'outbound', ?, ?, 'pending')`, [plan.id, plan.route_id, availableVehicles[i].id, availableDrivers[i].id, pStart, pEnd]);
      generated++;
    }
    run("UPDATE shift_plans SET status = 'approved' WHERE id = ?", [plan.id]);
  });
  gen();
  res.json({ generated, vehicle_available: availableVehicles.length, driver_available: availableDrivers.length });
});

app.get('/api/vehicle-positions', (req, res) => {
  const { route_id } = req.query;
  let sql = `SELECT vp.*, v.plate_no, v.model, v.capacity, r.name AS route_name FROM vehicle_positions vp JOIN vehicles v ON vp.vehicle_id = v.id LEFT JOIN routes r ON vp.route_id = r.id WHERE 1=1`;
  const params = [];
  if (route_id) { sql += ' AND vp.route_id = ?'; params.push(route_id); }
  sql += ' ORDER BY vp.recorded_at DESC';
  const positions = all(sql, params);
  const dispatches = all(`SELECT d.id, d.dispatch_no, d.status, d.planned_departure, d.dispatch_type, d.skip_stations, v.plate_no, r.name AS route_name FROM dispatches d JOIN vehicles v ON d.vehicle_id = v.id JOIN routes r ON d.route_id = r.id WHERE d.status = 'running' ORDER BY d.planned_departure`);
  const delayed = all(`SELECT vp.*, v.plate_no, r.name AS route_name FROM vehicle_positions vp JOIN vehicles v ON vp.vehicle_id = v.id LEFT JOIN routes r ON vp.route_id = r.id WHERE vp.is_delayed = 1`);
  const bunching = all(`SELECT vp1.vehicle_id AS v1_id, vp2.vehicle_id AS v2_id, v1.plate_no AS plate1, v2.plate_no AS plate2, r.name AS route_name, vp1.station_id AS station_id FROM vehicle_positions vp1 JOIN vehicle_positions vp2 ON vp1.vehicle_id < vp2.vehicle_id AND vp1.route_id = vp2.route_id AND vp1.station_id = vp2.station_id JOIN vehicles v1 ON vp1.vehicle_id = v1.id JOIN vehicles v2 ON vp2.vehicle_id = v2.id LEFT JOIN routes r ON vp1.route_id = r.id`);
  res.json({ positions, running_dispatches: dispatches, delayed, bunching });
});

app.post('/api/vehicle-positions', (req, res) => {
  const { vehicle_id, route_id, lat, lng, speed_kmh, heading, station_id, next_station_id, eta_seconds, is_delayed, delay_minutes } = req.body;
  if (!vehicle_id || lat === undefined || lng === undefined) return res.status(400).json({ error: '车辆ID、经纬度为必填' });
  const result = run(`INSERT INTO vehicle_positions (vehicle_id, route_id, lat, lng, speed_kmh, heading, station_id, next_station_id, eta_seconds, is_delayed, delay_minutes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [vehicle_id, route_id || null, lat, lng, speed_kmh || 0, heading || 0, station_id || null, next_station_id || null, eta_seconds || null, is_delayed ? 1 : 0, delay_minutes || 0]);
  res.status(201).json({ id: result.lastInsertRowid });
});

app.get('/api/dispatch-events', (req, res) => {
  const { status, event_type, severity } = req.query;
  let sql = `SELECT de.*, r.name AS route_name, v.plate_no, dr.name AS driver_name FROM dispatch_events de LEFT JOIN routes r ON de.route_id = r.id LEFT JOIN vehicles v ON de.vehicle_id = v.id LEFT JOIN drivers dr ON de.driver_id = dr.id WHERE 1=1`;
  const params = [];
  if (status) { sql += ' AND de.status = ?'; params.push(status); }
  if (event_type) { sql += ' AND de.event_type = ?'; params.push(event_type); }
  if (severity) { sql += ' AND de.severity = ?'; params.push(severity); }
  sql += ' ORDER BY de.reported_at DESC';
  res.json({ data: all(sql, params) });
});

app.post('/api/dispatch-events', (req, res) => {
  const { event_type, route_id, vehicle_id, driver_id, severity, description, location } = req.body;
  if (!event_type || !description) return res.status(400).json({ error: '事件类型和描述为必填' });
  const validTypes = ['traffic_jam','vehicle_fault','driver_leave','complaint','weather','accident','road_closure','other'];
  if (!validTypes.includes(event_type)) return res.status(400).json({ error: '事件类型必须为: ' + validTypes.join(', ') });
  const result = run(`INSERT INTO dispatch_events (event_type, route_id, vehicle_id, driver_id, severity, description, location, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'open')`, [event_type, route_id || null, vehicle_id || null, driver_id || null, severity || 'medium', description, location || null]);
  res.status(201).json({ id: result.lastInsertRowid });
});

app.put('/api/dispatch-events/:id', (req, res) => {
  const { status, severity, description, resolution } = req.body;
  const evt = one('SELECT * FROM dispatch_events WHERE id = ?', [req.params.id]);
  if (!evt) return res.status(404).json({ error: '事件不存在' });
  if (status === 'resolved' || status === 'closed') {
    run(`UPDATE dispatch_events SET status=?, resolved_at=CURRENT_TIMESTAMP WHERE id=?`, [status, req.params.id]);
  } else {
    run(`UPDATE dispatch_events SET status=?, severity=?, description=? WHERE id=?`, [status || evt.status, severity || evt.severity, description || evt.description, req.params.id]);
  }
  if (resolution) {
    run(`INSERT INTO dispatch_instructions (event_id, instruction_type, instruction_data, issued_by) VALUES (?, 'resolution', ?, 'dispatcher')`, [req.params.id, JSON.stringify({ resolution })]);
  }
  res.json({ updated: true });
});

app.post('/api/dispatch-events/:id/instructions', (req, res) => {
  const { instruction_type, instruction_data, issued_by } = req.body;
  if (!instruction_type) return res.status(400).json({ error: '指令类型为必填' });
  const result = run(`INSERT INTO dispatch_instructions (event_id, instruction_type, instruction_data, issued_by) VALUES (?, ?, ?, ?)`, [req.params.id, instruction_type, JSON.stringify(instruction_data || {}), issued_by || 'dispatcher']);
  res.status(201).json({ id: result.lastInsertRowid });
});

app.get('/api/dispatch-instructions', (req, res) => {
  const { event_id, dispatch_id } = req.query;
  let sql = `SELECT di.*, de.event_type, d.dispatch_no FROM dispatch_instructions di LEFT JOIN dispatch_events de ON di.event_id = de.id LEFT JOIN dispatches d ON di.dispatch_id = d.id WHERE 1=1`;
  const params = [];
  if (event_id) { sql += ' AND di.event_id = ?'; params.push(event_id); }
  if (dispatch_id) { sql += ' AND di.dispatch_id = ?'; params.push(dispatch_id); }
  sql += ' ORDER BY di.created_at DESC';
  res.json({ data: all(sql, params) });
});

app.get('/api/driver-work-hours', (req, res) => {
  const { driver_id, work_date } = req.query;
  let sql = `SELECT wh.*, d.name AS driver_name FROM driver_work_hours wh JOIN drivers d ON wh.driver_id = d.id WHERE 1=1`;
  const params = [];
  if (driver_id) { sql += ' AND wh.driver_id = ?'; params.push(driver_id); }
  if (work_date) { sql += ' AND wh.work_date = ?'; params.push(work_date); }
  sql += ' ORDER BY wh.work_date DESC, wh.shift_start';
  res.json({ data: all(sql, params) });
});

app.post('/api/driver-work-hours', (req, res) => {
  const { driver_id, work_date, shift_start, shift_end, break_start, break_end, total_minutes, status } = req.body;
  if (!driver_id || !work_date) return res.status(400).json({ error: '司机ID和日期为必填' });
  const driver = one('SELECT * FROM drivers WHERE id = ?', [driver_id]);
  if (!driver) return res.status(400).json({ error: '司机不存在' });
  const newTotal = (driver.daily_work_minutes || 0) + (total_minutes || 0);
  if (newTotal > driver.max_daily_minutes) return res.status(400).json({ error: '添加后工时将达' + newTotal + '分钟，超过上限' + driver.max_daily_minutes + '分钟' });
  const result = run(`INSERT INTO driver_work_hours (driver_id, work_date, shift_start, shift_end, break_start, break_end, total_minutes, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [driver_id, work_date, shift_start || null, shift_end || null, break_start || null, break_end || null, total_minutes || 0, status || 'scheduled']);
  run('UPDATE drivers SET daily_work_minutes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [newTotal, driver_id]);
  res.status(201).json({ id: result.lastInsertRowid });
});

app.get('/api/vehicle-fuel', (req, res) => {
  const { vehicle_id, status } = req.query;
  let sql = `SELECT vf.*, v.plate_no, v.model FROM vehicle_fuel vf JOIN vehicles v ON vf.vehicle_id = v.id WHERE 1=1`;
  const params = [];
  if (vehicle_id) { sql += ' AND vf.vehicle_id = ?'; params.push(vehicle_id); }
  if (status) { sql += ' AND vf.status = ?'; params.push(status); }
  sql += ' ORDER BY vf.started_at DESC';
  res.json({ data: all(sql, params) });
});

app.post('/api/vehicle-fuel', (req, res) => {
  const { vehicle_id, fuel_type, amount, station_name, started_at, completed_at, status } = req.body;
  if (!vehicle_id) return res.status(400).json({ error: '车辆ID为必填' });
  const result = run(`INSERT INTO vehicle_fuel (vehicle_id, fuel_type, amount, station_name, started_at, completed_at, status) VALUES (?, ?, ?, ?, ?, ?, ?)`, [vehicle_id, fuel_type || 'electric', amount || 0, station_name || null, started_at || null, completed_at || null, status || 'planned']);
  res.status(201).json({ id: result.lastInsertRowid });
});

app.put('/api/vehicle-fuel/:id', (req, res) => {
  const { status, completed_at, amount, vehicle_id } = req.body;
  run(`UPDATE vehicle_fuel SET status=?, completed_at=?, amount=? WHERE id=?`, [status, completed_at || null, amount || 0, req.params.id]);
  if (status === 'completed' && vehicle_id) {
    run('UPDATE vehicles SET battery_percent = 100, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', ['standby', vehicle_id]);
  }
  res.json({ updated: true });
});

app.get('/api/reports/summary', (req, res) => {
  const { date_from, date_to } = req.query;
  const df = date_from ? `'${date_from}'` : "date('now','-7 days')";
  const dt = date_to ? `'${date_to}'` : "date('now')";
  const where = `date(planned_departure) BETWEEN ${df} AND ${dt}`;

  const onTimeStats = one(`SELECT COUNT(*) AS total, SUM(CASE WHEN actual_arrival IS NOT NULL AND julianday(actual_arrival) - julianday(planned_arrival) <= 0.00347 THEN 1 ELSE 0 END) AS on_time FROM dispatches WHERE ${where} AND status IN ('completed','running')`);
  const onTimeRate = onTimeStats.total > 0 ? Math.round(onTimeStats.on_time / onTimeStats.total * 100) : 0;

  const departStats = one(`SELECT COUNT(*) AS planned, SUM(CASE WHEN status NOT IN ('scheduled') THEN 1 ELSE 0 END) AS dispatched FROM dispatches WHERE ${where}`);
  const departRate = departStats.planned > 0 ? Math.round(departStats.dispatched / departStats.planned * 100) : 0;

  const passengerFlow = all(`SELECT date(planned_departure) AS date, SUM(passenger_load) AS total_passengers, AVG(passenger_load) AS avg_passengers FROM dispatches WHERE ${where} GROUP BY date(planned_departure) ORDER BY date`);

  const vehicleUtil = all(`SELECT v.plate_no, v.model, COUNT(d.id) AS trip_count, COALESCE(SUM(d.passenger_load), 0) AS total_load, v.km_today, v.total_km FROM vehicles v LEFT JOIN dispatches d ON d.vehicle_id = v.id AND ${where.replace('planned_departure', 'd.planned_departure')} GROUP BY v.id ORDER BY trip_count DESC`);

  const eventReasons = all(`SELECT event_type, COUNT(*) AS count FROM dispatch_events WHERE date(reported_at) BETWEEN ${df} AND ${dt} GROUP BY event_type ORDER BY count DESC`);

  const routePerformance = all(`SELECT r.name, COUNT(d.id) AS total_trips, SUM(CASE WHEN d.actual_arrival IS NOT NULL AND julianday(d.actual_arrival) - julianday(d.planned_arrival) <= 0.00347 THEN 1 ELSE 0 END) AS on_time_trips, AVG(d.passenger_load) AS avg_load FROM routes r LEFT JOIN dispatches d ON d.route_id = r.id AND ${where.replace('planned_departure', 'd.planned_departure')} GROUP BY r.id ORDER BY r.name`);

  res.json({ onTimeRate, departRate, totalDispatches: departStats.planned, totalOnTime: onTimeStats.on_time, passengerFlow, vehicleUtilization: vehicleUtil, eventReasons, routePerformance });
});

app.get('/api/reports/daily', (req, res) => {
  const { date } = req.query;
  const d = date || "date('now')";
  const stats = one(`SELECT COUNT(*) AS total_dispatches, SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed, SUM(CASE WHEN status = 'running' THEN 1 ELSE 0 END) AS running, SUM(CASE WHEN status = 'scheduled' THEN 1 ELSE 0 END) AS scheduled, COALESCE(SUM(passenger_load), 0) AS total_passengers, COALESCE(AVG(passenger_load), 0) AS avg_passengers FROM dispatches WHERE date(planned_departure) = ${d}`);
  const events = all(`SELECT event_type, severity, COUNT(*) AS count FROM dispatch_events WHERE date(reported_at) = ${d} GROUP BY event_type, severity ORDER BY count DESC`);
  const vehicleStats = all(`SELECT status, COUNT(*) AS count FROM vehicles GROUP BY status`);
  const driverStats = all(`SELECT status, COUNT(*) AS count, SUM(daily_work_minutes) AS total_work_min FROM drivers GROUP BY status`);
  res.json({ stats, events, vehicleStats, driverStats });
});

app.use((req, res) => {
  res.status(404).json({ error: '接口不存在' });
});

const server = app.listen(BACKEND_PORT, '127.0.0.1', () => {
  console.log(`Bus dispatch backend listening on http://127.0.0.1:${BACKEND_PORT}`);
  console.log(`SQLite database: ${DB_PATH}`);
});

function shutdown() {
  server.close(() => {
    db.close();
    process.exit(0);
  });
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);