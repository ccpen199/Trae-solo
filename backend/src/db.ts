import Database from 'better-sqlite3';
import type { Database as DatabaseType } from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const dbPath = process.env.DB_PATH || './data/app.sqlite';
const resolvedDbPath = path.resolve(__dirname, '../../', dbPath);

const dbDir = path.dirname(resolvedDbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db: DatabaseType = new Database(resolvedDbPath);

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS drivers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT,
      id_card TEXT,
      driver_license TEXT,
      vehicle_type TEXT,
      vehicle_plate TEXT,
      vehicle_inspection_status TEXT DEFAULT 'valid',
      rating REAL DEFAULT 5.0,
      status TEXT DEFAULT 'available',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_no TEXT UNIQUE NOT NULL,
      cargo_volume REAL,
      cargo_weight REAL,
      loading_requirement TEXT,
      time_window_start DATETIME,
      time_window_end DATETIME,
      customer_name TEXT,
      customer_phone TEXT,
      customer_credit_score INTEGER DEFAULT 100,
      pickup_address TEXT,
      delivery_address TEXT,
      pickup_lng REAL,
      pickup_lat REAL,
      delivery_lng REAL,
      delivery_lat REAL,
      status TEXT DEFAULT 'pending',
      assigned_driver_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      finished_at DATETIME,
      FOREIGN KEY (assigned_driver_id) REFERENCES drivers(id)
    );

    CREATE TABLE IF NOT EXISTS heatmap_data (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      area_code TEXT,
      area_name TEXT,
      available_drivers INTEGER DEFAULT 0,
      avg_response_time REAL DEFAULT 0,
      lng REAL,
      lat REAL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS exceptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER,
      driver_id INTEGER,
      type TEXT,
      level TEXT DEFAULT 'medium',
      description TEXT,
      status TEXT DEFAULT 'pending',
      handle_remark TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      resolved_at DATETIME,
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (driver_id) REFERENCES drivers(id)
    );

    CREATE TABLE IF NOT EXISTS driver_credit (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      driver_id INTEGER UNIQUE NOT NULL,
      on_time_rate REAL DEFAULT 100.0,
      service_score REAL DEFAULT 5.0,
      violation_count INTEGER DEFAULT 0,
      credit_score INTEGER DEFAULT 100,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (driver_id) REFERENCES drivers(id)
    );

    CREATE TABLE IF NOT EXISTS gps_tracks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER,
      driver_id INTEGER,
      lng REAL NOT NULL,
      lat REAL NOT NULL,
      speed REAL DEFAULT 0,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (driver_id) REFERENCES drivers(id)
    );

    CREATE TABLE IF NOT EXISTS waybills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER UNIQUE NOT NULL,
      signer_name TEXT,
      sign_time DATETIME,
      signature_image TEXT,
      status TEXT DEFAULT 'pending',
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id)
    );

    CREATE TABLE IF NOT EXISTS appeals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      exception_id INTEGER NOT NULL,
      driver_id INTEGER,
      reason TEXT NOT NULL,
      evidence TEXT,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      resolved_at DATETIME,
      resolver_note TEXT,
      FOREIGN KEY (exception_id) REFERENCES exceptions(id),
      FOREIGN KEY (driver_id) REFERENCES drivers(id)
    );

    CREATE TABLE IF NOT EXISTS order_evaluations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER UNIQUE NOT NULL,
      rating INTEGER NOT NULL,
      comment TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id)
    );
  `);
}

function initMockData() {
  const driverCount = db.prepare('SELECT COUNT(*) as count FROM drivers').get() as { count: number };
  if (driverCount.count > 0) return;

  const insertDriver = db.prepare(`
    INSERT INTO drivers (name, phone, id_card, driver_license, vehicle_type, vehicle_plate, vehicle_inspection_status, rating, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertCredit = db.prepare(`
    INSERT INTO driver_credit (driver_id, on_time_rate, service_score, violation_count, credit_score)
    VALUES (?, ?, ?, ?, ?)
  `);

  const drivers = [
    { name: '张伟', phone: '13800000001', id_card: '110101199001010001', driver_license: 'A1', vehicle_type: '厢式货车', vehicle_plate: '京A12345', status: 'available', rating: 4.8 },
    { name: '李强', phone: '13800000002', id_card: '110101199002020002', driver_license: 'A2', vehicle_type: '平板货车', vehicle_plate: '京B23456', status: 'available', rating: 4.9 },
    { name: '王芳', phone: '13800000003', id_card: '110101199003030003', driver_license: 'B1', vehicle_type: '冷藏车', vehicle_plate: '京C34567', status: 'busy', rating: 4.7 },
    { name: '刘洋', phone: '13800000004', id_card: '110101199004040004', driver_license: 'B2', vehicle_type: '厢式货车', vehicle_plate: '京D45678', status: 'available', rating: 4.6 },
    { name: '陈静', phone: '13800000005', id_card: '110101199005050005', driver_license: 'C1', vehicle_type: '小型货车', vehicle_plate: '京E56789', status: 'offline', rating: 4.5 },
  ];

  const insertMany = db.transaction(() => {
    drivers.forEach((driver, index) => {
      const info = insertDriver.run(
        driver.name,
        driver.phone,
        driver.id_card,
        driver.driver_license,
        driver.vehicle_type,
        driver.vehicle_plate,
        'valid',
        driver.rating,
        driver.status
      );
      insertCredit.run(
        info.lastInsertRowid,
        95 + Math.random() * 5,
        4.5 + Math.random() * 0.5,
        Math.floor(Math.random() * 3),
        90 + Math.floor(Math.random() * 10)
      );
    });
  });

  insertMany();

  const orderCount = db.prepare('SELECT COUNT(*) as count FROM orders').get() as { count: number };
  if (orderCount.count > 0) return;

  const insertOrder = db.prepare(`
    INSERT INTO orders (order_no, cargo_volume, cargo_weight, loading_requirement, time_window_start, time_window_end, customer_name, customer_phone, customer_credit_score, pickup_address, delivery_address, pickup_lng, pickup_lat, delivery_lng, delivery_lat, status, assigned_driver_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const orders = [
    { order_no: 'ORD20240101001', cargo_volume: 10.5, cargo_weight: 2000, loading_requirement: '轻拿轻放', customer_name: '赵先生', customer_phone: '13900000001', pickup_address: '北京市朝阳区建国路88号', delivery_address: '北京市海淀区中关村大街1号', pickup_lng: 116.46, pickup_lat: 39.91, delivery_lng: 116.31, delivery_lat: 39.98, status: 'in_transit', assigned_driver_id: 3 },
    { order_no: 'ORD20240101002', cargo_volume: 5.2, cargo_weight: 800, loading_requirement: '普通货物', customer_name: '孙女士', customer_phone: '13900000002', pickup_address: '北京市西城区西单北大街1号', delivery_address: '北京市东城区王府井大街88号', pickup_lng: 116.37, pickup_lat: 39.91, delivery_lng: 116.41, delivery_lat: 39.91, status: 'pending', assigned_driver_id: null },
    { order_no: 'ORD20240101003', cargo_volume: 15.0, cargo_weight: 3500, loading_requirement: '需要叉车', customer_name: '周经理', customer_phone: '13900000003', pickup_address: '北京市丰台区南三环西路16号', delivery_address: '北京市通州区新华西街58号', pickup_lng: 116.35, pickup_lat: 39.85, delivery_lng: 116.66, delivery_lat: 39.91, status: 'completed', assigned_driver_id: 1 },
    { order_no: 'ORD20240101004', cargo_volume: 8.0, cargo_weight: 1500, loading_requirement: '易碎品', customer_name: '吴总', customer_phone: '13900000004', pickup_address: '北京市石景山鲁谷路8号', delivery_address: '北京市昌平区回龙观西大街1号', pickup_lng: 116.22, pickup_lat: 39.90, delivery_lng: 116.34, delivery_lat: 40.07, status: 'pending', assigned_driver_id: null },
    { order_no: 'ORD20240101005', cargo_volume: 3.5, cargo_weight: 500, loading_requirement: '普通货物', customer_name: '郑先生', customer_phone: '13900000005', pickup_address: '北京市东城区东直门外大街1号', delivery_address: '北京市西城区月坛南街1号', pickup_lng: 116.43, pickup_lat: 39.94, delivery_lng: 116.35, delivery_lat: 39.91, status: 'cancelled', assigned_driver_id: null },
  ];

  const insertOrders = db.transaction(() => {
    orders.forEach((order) => {
      insertOrder.run(
        order.order_no,
        order.cargo_volume,
        order.cargo_weight,
        order.loading_requirement,
        '2024-01-01 09:00:00',
        '2024-01-01 18:00:00',
        order.customer_name,
        order.customer_phone,
        85 + Math.floor(Math.random() * 15),
        order.pickup_address,
        order.delivery_address,
        order.pickup_lng,
        order.pickup_lat,
        order.delivery_lng,
        order.delivery_lat,
        order.status,
        order.assigned_driver_id
      );
    });
  });

  insertOrders();

  const heatmapCount = db.prepare('SELECT COUNT(*) as count FROM heatmap_data').get() as { count: number };
  if (heatmapCount.count > 0) return;

  const insertHeatmap = db.prepare(`
    INSERT INTO heatmap_data (area_code, area_name, available_drivers, avg_response_time, lng, lat)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const heatmapData = [
    { area_code: 'BJ-CY', area_name: '朝阳区', available_drivers: 15, avg_response_time: 8.5, lng: 116.4551, lat: 39.9271 },
    { area_code: 'BJ-HD', area_name: '海淀区', available_drivers: 12, avg_response_time: 10.2, lng: 116.2980, lat: 39.9599 },
    { area_code: 'BJ-DC', area_name: '东城区', available_drivers: 8, avg_response_time: 12.1, lng: 116.4100, lat: 39.9200 },
    { area_code: 'BJ-XC', area_name: '西城区', available_drivers: 7, avg_response_time: 11.5, lng: 116.3700, lat: 39.9100 },
    { area_code: 'BJ-FT', area_name: '丰台区', available_drivers: 10, avg_response_time: 9.8, lng: 116.2869, lat: 39.8637 },
    { area_code: 'BJ-SJS', area_name: '石景山区', available_drivers: 5, avg_response_time: 15.3, lng: 116.2228, lat: 39.9056 },
    { area_code: 'BJ-TZ', area_name: '通州区', available_drivers: 9, avg_response_time: 14.0, lng: 116.6560, lat: 39.9080 },
    { area_code: 'BJ-CP', area_name: '昌平区', available_drivers: 6, avg_response_time: 16.5, lng: 116.2350, lat: 40.2200 },
  ];

  const insertHeatmaps = db.transaction(() => {
    heatmapData.forEach((item) => {
      insertHeatmap.run(item.area_code, item.area_name, item.available_drivers, item.avg_response_time, item.lng, item.lat);
    });
  });

  insertHeatmaps();

  const exceptionCount = db.prepare('SELECT COUNT(*) as count FROM exceptions').get() as { count: number };
  if (exceptionCount.count > 0) return;

  const insertException = db.prepare(`
    INSERT INTO exceptions (order_id, driver_id, type, description, status)
    VALUES (?, ?, ?, ?, ?)
  `);

  const exceptions = [
    { order_id: 1, driver_id: 3, type: 'delay', description: '交通拥堵，预计延误30分钟', status: 'resolved' },
    { order_id: 3, driver_id: 1, type: 'damage', description: '货物轻微破损', status: 'resolved' },
    { order_id: 2, driver_id: null, type: 'no_driver', description: '暂无可用司机接单', status: 'pending' },
  ];

  const insertExceptions = db.transaction(() => {
    exceptions.forEach((exc) => {
      insertException.run(exc.order_id, exc.driver_id, exc.type, exc.description, exc.status);
    });
  });

  insertExceptions();

  const gpsTrackCount = db.prepare('SELECT COUNT(*) as count FROM gps_tracks').get() as { count: number };
  if (gpsTrackCount.count === 0) {
    const insertGpsTrack = db.prepare(`
      INSERT INTO gps_tracks (order_id, driver_id, lng, lat, speed, timestamp)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const gpsTracks = [
      { order_id: 1, driver_id: 3, lng: 116.46, lat: 39.91, speed: 35.5, timestamp: '2024-01-01 10:00:00' },
      { order_id: 1, driver_id: 3, lng: 116.42, lat: 39.93, speed: 40.2, timestamp: '2024-01-01 10:15:00' },
      { order_id: 1, driver_id: 3, lng: 116.38, lat: 39.95, speed: 38.0, timestamp: '2024-01-01 10:30:00' },
      { order_id: 1, driver_id: 3, lng: 116.34, lat: 39.97, speed: 42.5, timestamp: '2024-01-01 10:45:00' },
      { order_id: 1, driver_id: 3, lng: 116.31, lat: 39.98, speed: 0, timestamp: '2024-01-01 11:00:00' },
    ];

    const insertGpsTracks = db.transaction(() => {
      gpsTracks.forEach((track) => {
        insertGpsTrack.run(track.order_id, track.driver_id, track.lng, track.lat, track.speed, track.timestamp);
      });
    });

    insertGpsTracks();
  }

  const waybillCount = db.prepare('SELECT COUNT(*) as count FROM waybills').get() as { count: number };
  if (waybillCount.count === 0) {
    const insertWaybill = db.prepare(`
      INSERT INTO waybills (order_id, signer_name, sign_time, signature_image, status, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const waybills = [
      { order_id: 3, signer_name: '周经理', sign_time: '2024-01-01 15:30:00', signature_image: 'sign_001.png', status: 'signed', notes: '货物完好无损' },
      { order_id: 1, signer_name: null, sign_time: null, signature_image: null, status: 'pending', notes: null },
    ];

    const insertWaybills = db.transaction(() => {
      waybills.forEach((wb) => {
        insertWaybill.run(wb.order_id, wb.signer_name, wb.sign_time, wb.signature_image, wb.status, wb.notes);
      });
    });

    insertWaybills();
  }

  const appealCount = db.prepare('SELECT COUNT(*) as count FROM appeals').get() as { count: number };
  if (appealCount.count === 0) {
    const insertAppeal = db.prepare(`
      INSERT INTO appeals (exception_id, driver_id, reason, evidence, status, created_at, resolved_at, resolver_note)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const appeals = [
      { exception_id: 2, driver_id: 1, reason: '货物本身包装不合格导致破损', evidence: 'photo_evidence.jpg', status: 'approved', created_at: '2024-01-01 16:00:00', resolved_at: '2024-01-02 10:00:00', resolver_note: '申诉成立，免除司机责任' },
      { exception_id: 1, driver_id: 3, reason: '前方交通事故导致堵车，非司机原因', evidence: 'traffic_report.pdf', status: 'pending', created_at: '2024-01-01 11:30:00', resolved_at: null, resolver_note: null },
    ];

    const insertAppeals = db.transaction(() => {
      appeals.forEach((appeal) => {
        insertAppeal.run(appeal.exception_id, appeal.driver_id, appeal.reason, appeal.evidence, appeal.status, appeal.created_at, appeal.resolved_at, appeal.resolver_note);
      });
    });

    insertAppeals();
  }

  const evaluationCount = db.prepare('SELECT COUNT(*) as count FROM order_evaluations').get() as { count: number };
  if (evaluationCount.count === 0) {
    const insertEvaluation = db.prepare(`
      INSERT INTO order_evaluations (order_id, rating, comment, created_at)
      VALUES (?, ?, ?, ?)
    `);

    const evaluations = [
      { order_id: 3, rating: 5, comment: '配送及时，服务态度好', created_at: '2024-01-01 16:00:00' },
    ];

    const insertEvaluations = db.transaction(() => {
      evaluations.forEach((evalItem) => {
        insertEvaluation.run(evalItem.order_id, evalItem.rating, evalItem.comment, evalItem.created_at);
      });
    });

    insertEvaluations();
  }
}

initDatabase();
initMockData();

export default db;
