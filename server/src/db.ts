import Database from 'better-sqlite3';
import path from 'path';

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    const dbPath = path.join(__dirname, '..', 'data.db');
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initTables();
  }
  return db;
}

function initTables(): void {
  if (!db) return;

  db.exec(`
    CREATE TABLE IF NOT EXISTS areas (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      propertyManagerId TEXT,
      FOREIGN KEY (propertyManagerId) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      phone TEXT UNIQUE NOT NULL,
      nickname TEXT NOT NULL,
      avatar TEXT,
      role TEXT NOT NULL CHECK(role IN ('resident', 'property', 'operator')),
      balance REAL NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS devices (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('washer', 'water_dispenser', 'shower')),
      status TEXT NOT NULL CHECK(status IN ('idle', 'running', 'fault', 'offline', 'reserved')),
      location TEXT NOT NULL,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      areaId TEXT NOT NULL,
      pricing REAL NOT NULL,
      lastHeartbeat TEXT,
      isOnline INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (areaId) REFERENCES areas(id)
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      deviceId TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('washer', 'water_dispenser', 'shower')),
      startTime TEXT,
      endTime TEXT,
      duration INTEGER NOT NULL DEFAULT 0,
      amount REAL NOT NULL DEFAULT 0,
      status TEXT NOT NULL CHECK(status IN ('pending', 'active', 'completed', 'refunded', 'cancelled')),
      payMethod TEXT NOT NULL DEFAULT 'balance',
      refundAmount REAL NOT NULL DEFAULT 0,
      FOREIGN KEY (userId) REFERENCES users(id),
      FOREIGN KEY (deviceId) REFERENCES devices(id)
    );

    CREATE TABLE IF NOT EXISTS reservations (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      deviceId TEXT NOT NULL,
      startTime TEXT NOT NULL,
      endTime TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('pending', 'active', 'completed', 'cancelled')),
      amount REAL NOT NULL DEFAULT 0,
      FOREIGN KEY (userId) REFERENCES users(id),
      FOREIGN KEY (deviceId) REFERENCES devices(id)
    );

    CREATE TABLE IF NOT EXISTS workorders (
      id TEXT PRIMARY KEY,
      deviceId TEXT NOT NULL,
      reporterId TEXT NOT NULL,
      handlerId TEXT,
      type TEXT NOT NULL CHECK(type IN ('repair', 'maintenance', 'complaint')),
      description TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('pending', 'assigned', 'processing', 'resolved', 'closed')),
      priority TEXT NOT NULL CHECK(priority IN ('low', 'medium', 'high', 'urgent')),
      createdAt TEXT NOT NULL,
      resolvedAt TEXT,
      FOREIGN KEY (deviceId) REFERENCES devices(id),
      FOREIGN KEY (reporterId) REFERENCES users(id),
      FOREIGN KEY (handlerId) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS packages (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      deviceType TEXT NOT NULL CHECK(deviceType IN ('washer', 'water_dispenser', 'shower')),
      totalMinutes INTEGER NOT NULL,
      price REAL NOT NULL,
      description TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS userPackages (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      packageId TEXT NOT NULL,
      remainingMinutes INTEGER NOT NULL,
      expireAt TEXT NOT NULL,
      FOREIGN KEY (userId) REFERENCES users(id),
      FOREIGN KEY (packageId) REFERENCES packages(id)
    );

    CREATE TABLE IF NOT EXISTS rewardCoupons (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('discount', 'cash')),
      value REAL NOT NULL,
      minAmount REAL NOT NULL DEFAULT 0,
      expireAt TEXT NOT NULL,
      isUsed INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (userId) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS rewardRecords (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      action TEXT NOT NULL,
      points INTEGER NOT NULL,
      description TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      deviceType TEXT CHECK(deviceType IN ('washer', 'water_dispenser', 'shower')),
      FOREIGN KEY (userId) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS deviceCommands (
      id TEXT PRIMARY KEY,
      deviceId TEXT NOT NULL,
      command TEXT NOT NULL,
      params TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('pending', 'synced', 'executed', 'failed')),
      createdAt TEXT NOT NULL,
      syncedAt TEXT,
      FOREIGN KEY (deviceId) REFERENCES devices(id)
    );
  `);
}

export default getDb;
