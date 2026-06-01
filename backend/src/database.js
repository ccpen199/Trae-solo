import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectDir = path.join(__dirname, '../..');

dotenv.config({ path: path.join(projectDir, '.env') });

const dbPath = path.resolve(projectDir, process.env.DATABASE_PATH || './data/app.sqlite');

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS parking_lots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    entrance_points TEXT,
    total_spots INTEGER NOT NULL DEFAULT 0,
    charging_spots INTEGER NOT NULL DEFAULT 0,
    price_per_hour REAL NOT NULL DEFAULT 0,
    business_hours TEXT,
    device_status TEXT DEFAULT 'online',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS spot_status (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    parking_lot_id INTEGER NOT NULL,
    spot_number TEXT NOT NULL,
    spot_type TEXT DEFAULT 'normal',
    status TEXT DEFAULT 'available',
    is_trusted INTEGER DEFAULT 1,
    last_update DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parking_lot_id) REFERENCES parking_lots(id)
  );

  CREATE TABLE IF NOT EXISTS entry_exit_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    plate_number TEXT NOT NULL,
    parking_lot_id INTEGER NOT NULL,
    entry_time DATETIME,
    exit_time DATETIME,
    duration INTEGER DEFAULT 0,
    fee REAL DEFAULT 0,
    payment_status TEXT DEFAULT 'unpaid',
    spot_number TEXT,
    FOREIGN KEY (parking_lot_id) REFERENCES parking_lots(id)
  );

  CREATE TABLE IF NOT EXISTS guidance_clicks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    parking_lot_id INTEGER NOT NULL,
    user_session TEXT,
    clicked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    arrived INTEGER DEFAULT 0,
    FOREIGN KEY (parking_lot_id) REFERENCES parking_lots(id)
  );

  CREATE TABLE IF NOT EXISTS device_status_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    parking_lot_id INTEGER NOT NULL,
    status TEXT,
    logged_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parking_lot_id) REFERENCES parking_lots(id)
  );
`);

function seedDemoData() {
  const lotCount = db.prepare('SELECT COUNT(*) as count FROM parking_lots').get().count;
  if (lotCount > 0) return;

  const lots = [
    {
      name: '国贸中心停车场',
      address: '北京市朝阳区建国门外大街1号',
      latitude: 39.9087,
      longitude: 116.4605,
      entrance_points: ['东入口', 'B2直达口'],
      total_spots: 80,
      charging_spots: 16,
      price_per_hour: 15,
      business_hours: '00:00-24:00',
      device_status: 'online',
      occupied: 18,
      reserved: 6,
      fault: 2
    },
    {
      name: '万达广场停车场',
      address: '北京市朝阳区建国路88号',
      latitude: 39.912,
      longitude: 116.465,
      entrance_points: ['南入口', '商场连廊'],
      total_spots: 65,
      charging_spots: 10,
      price_per_hour: 12,
      business_hours: '08:00-23:00',
      device_status: 'online',
      occupied: 22,
      reserved: 4,
      fault: 1
    },
    {
      name: 'CBD核心区停车楼',
      address: '北京市朝阳区光华路10号',
      latitude: 39.915,
      longitude: 116.455,
      entrance_points: ['西入口', '写字楼入口'],
      total_spots: 120,
      charging_spots: 24,
      price_per_hour: 18,
      business_hours: '06:00-24:00',
      device_status: 'online',
      occupied: 35,
      reserved: 10,
      fault: 3
    },
    {
      name: '世贸天阶地下停车场',
      address: '北京市朝阳区光华路9号',
      latitude: 39.918,
      longitude: 116.458,
      entrance_points: ['北入口'],
      total_spots: 45,
      charging_spots: 8,
      price_per_hour: 10,
      business_hours: '10:00-22:00',
      device_status: 'offline',
      occupied: 9,
      reserved: 2,
      fault: 4
    }
  ];

  const insertLot = db.prepare(`
    INSERT INTO parking_lots (
      name, address, latitude, longitude, entrance_points, total_spots,
      charging_spots, price_per_hour, business_hours, device_status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertSpot = db.prepare(`
    INSERT INTO spot_status (parking_lot_id, spot_number, spot_type, status, is_trusted)
    VALUES (?, ?, ?, ?, ?)
  `);
  const insertRecord = db.prepare(`
    INSERT INTO entry_exit_records (
      plate_number, parking_lot_id, entry_time, exit_time, duration, fee,
      payment_status, spot_number
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertClick = db.prepare(`
    INSERT INTO guidance_clicks (parking_lot_id, user_session, clicked_at, arrived)
    VALUES (?, ?, datetime('now', ?), ?)
  `);
  const insertLog = db.prepare(`
    INSERT INTO device_status_logs (parking_lot_id, status, logged_at)
    VALUES (?, ?, datetime('now', ?))
  `);

  const seed = db.transaction(() => {
    lots.forEach((lot, lotIndex) => {
      const lotId = insertLot.run(
        lot.name,
        lot.address,
        lot.latitude,
        lot.longitude,
        JSON.stringify(lot.entrance_points),
        lot.total_spots,
        lot.charging_spots,
        lot.price_per_hour,
        lot.business_hours,
        lot.device_status
      ).lastInsertRowid;

      for (let i = 1; i <= lot.total_spots; i += 1) {
        let status = 'available';
        if (i <= lot.occupied) status = 'occupied';
        else if (i <= lot.occupied + lot.reserved) status = 'reserved';
        else if (i > lot.total_spots - lot.fault) status = 'fault';

        const spotType = i <= lot.charging_spots ? 'charging' : 'normal';
        const trusted = i % 37 === 0 ? 0 : 1;
        const spotNumber = `A${String(i).padStart(3, '0')}`;
        insertSpot.run(lotId, spotNumber, spotType, status, trusted);

        if (status === 'occupied') {
          const plate = `京${String.fromCharCode(65 + lotIndex)}${String(63000 + lotIndex * 100 + i).padStart(5, '0')}`;
          insertRecord.run(
            plate,
            lotId,
            `2026-05-28 ${String(7 + (i % 6)).padStart(2, '0')}:${String((i * 7) % 60).padStart(2, '0')}:00`,
            null,
            0,
            0,
            'unpaid',
            spotNumber
          );
        }
      }

      for (let i = 1; i <= 4; i += 1) {
        insertRecord.run(
          `京Z${lotIndex}${i}88${i}`,
          lotId,
          `2026-05-28 0${i}:10:00`,
          `2026-05-28 0${i + 1}:35:00`,
          85,
          lot.price_per_hour * 2,
          'paid',
          `A${String(lot.occupied + lot.reserved + i).padStart(3, '0')}`
        );
      }

      for (let i = 1; i <= 6; i += 1) {
        insertClick.run(lotId, `seed_${lotIndex}_${i}`, `-${i + lotIndex} hours`, i % 3 !== 0 ? 1 : 0);
      }

      insertLog.run(lotId, lot.device_status, `-${lotIndex + 1} hours`);
    });
  });

  seed();
}

seedDemoData();

export default db;
