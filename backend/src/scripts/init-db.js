import db from '../db/index.js';
import bcrypt from 'bcryptjs';

const initDb = () => {
  const createTables = db.transaction(() => {
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'rider',
        phone TEXT,
        real_name TEXT,
        id_card TEXT,
        avatar TEXT,
        status TEXT DEFAULT 'pending',
        created_at INTEGER DEFAULT (strftime('%s','now')),
        updated_at INTEGER DEFAULT (strftime('%s','now'))
      );

      CREATE TABLE IF NOT EXISTS oauth_clients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_id TEXT UNIQUE NOT NULL,
        client_secret TEXT NOT NULL,
        name TEXT NOT NULL,
        redirect_uri TEXT,
        scope TEXT DEFAULT 'read write',
        created_at INTEGER DEFAULT (strftime('%s','now'))
      );

      CREATE TABLE IF NOT EXISTS oauth_tokens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        client_id TEXT NOT NULL,
        access_token TEXT UNIQUE NOT NULL,
        refresh_token TEXT UNIQUE NOT NULL,
        scope TEXT,
        expires_at INTEGER NOT NULL,
        refresh_expires_at INTEGER NOT NULL,
        created_at INTEGER DEFAULT (strftime('%s','now')),
        FOREIGN KEY (user_id) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS rider_verifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER UNIQUE NOT NULL,
        id_card_number TEXT,
        id_card_front TEXT,
        id_card_back TEXT,
        face_photo TEXT,
        verification_status TEXT DEFAULT 'pending',
        rejection_reason TEXT,
        verified_at INTEGER,
        created_at INTEGER DEFAULT (strftime('%s','now')),
        updated_at INTEGER DEFAULT (strftime('%s','now')),
        FOREIGN KEY (user_id) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS rider_vehicles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        vehicle_type TEXT NOT NULL,
        plate_number TEXT NOT NULL,
        vehicle_license TEXT,
        insurance_certificate TEXT,
        binding_status TEXT DEFAULT 'pending',
        verified_at INTEGER,
        created_at INTEGER DEFAULT (strftime('%s','now')),
        updated_at INTEGER DEFAULT (strftime('%s','now')),
        FOREIGN KEY (user_id) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS rider_stats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER UNIQUE NOT NULL,
        total_orders INTEGER DEFAULT 0,
        completed_orders INTEGER DEFAULT 0,
        canceled_orders INTEGER DEFAULT 0,
        on_time_rate REAL DEFAULT 100.0,
        average_delivery_time REAL DEFAULT 0,
        rating REAL DEFAULT 5.0,
        fulfillment_rate REAL DEFAULT 95.0,
        level INTEGER DEFAULT 1,
        total_income REAL DEFAULT 0,
        created_at INTEGER DEFAULT (strftime('%s','now')),
        updated_at INTEGER DEFAULT (strftime('%s','now')),
        FOREIGN KEY (user_id) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS gps_traces (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        order_id INTEGER,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        speed REAL,
        heading REAL,
        accuracy REAL,
        timestamp INTEGER NOT NULL,
        created_at INTEGER DEFAULT (strftime('%s','now')),
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (order_id) REFERENCES orders(id)
      );

      CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_no TEXT UNIQUE NOT NULL,
        merchant_id INTEGER,
        merchant_name TEXT,
        merchant_address TEXT,
        merchant_lat REAL,
        merchant_lng REAL,
        customer_name TEXT,
        customer_phone TEXT,
        customer_address TEXT,
        customer_lat REAL,
        customer_lng REAL,
        goods_description TEXT,
        goods_weight REAL,
        estimated_distance REAL,
        estimated_duration INTEGER,
        base_fee REAL DEFAULT 0,
        tip_fee REAL DEFAULT 0,
        incentive_fee REAL DEFAULT 0,
        total_fee REAL DEFAULT 0,
        rider_fee REAL DEFAULT 0,
        rider_id INTEGER,
        status TEXT DEFAULT 'pending',
        expected_pickup_time INTEGER,
        expected_delivery_time INTEGER,
        accepted_at INTEGER,
        picked_at INTEGER,
        delivered_at INTEGER,
        settlement_status TEXT DEFAULT 'unsettled',
        settlement_time INTEGER,
        created_at INTEGER DEFAULT (strftime('%s','now')),
        updated_at INTEGER DEFAULT (strftime('%s','now')),
        FOREIGN KEY (rider_id) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS order_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL,
        event_type TEXT NOT NULL,
        event_data TEXT,
        operator_id INTEGER,
        created_at INTEGER DEFAULT (strftime('%s','now')),
        FOREIGN KEY (order_id) REFERENCES orders(id)
      );

      CREATE TABLE IF NOT EXISTS order_exceptions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL,
        exception_type TEXT NOT NULL,
        description TEXT,
        photo_url TEXT,
        reported_by INTEGER NOT NULL,
        status TEXT DEFAULT 'pending',
        handled_at INTEGER,
        handler_id INTEGER,
        handling_result TEXT,
        created_at INTEGER DEFAULT (strftime('%s','now')),
        FOREIGN KEY (order_id) REFERENCES orders(id)
      );

      CREATE TABLE IF NOT EXISTS order_signatures (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER UNIQUE NOT NULL,
        signer_name TEXT,
        signer_photo TEXT,
        signature_data TEXT,
        signed_at INTEGER NOT NULL,
        created_at INTEGER DEFAULT (strftime('%s','now')),
        FOREIGN KEY (order_id) REFERENCES orders(id)
      );

      CREATE TABLE IF NOT EXISTS dispatch_rules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        weight_distance REAL DEFAULT 0.35,
        weight_route REAL DEFAULT 0.25,
        weight_fulfillment REAL DEFAULT 0.25,
        weight_supply_demand REAL DEFAULT 0.15,
        max_distance REAL DEFAULT 3000,
        min_fulfillment_rate REAL DEFAULT 80,
        is_active INTEGER DEFAULT 1,
        created_at INTEGER DEFAULT (strftime('%s','now'))
      );

      CREATE TABLE IF NOT EXISTS dispatch_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL,
        rider_id INTEGER NOT NULL,
        dispatch_score REAL,
        distance REAL,
        route_similarity REAL,
        fulfillment_rate REAL,
        supply_demand_ratio REAL,
        accepted INTEGER DEFAULT 0,
        created_at INTEGER DEFAULT (strftime('%s','now')),
        FOREIGN KEY (order_id) REFERENCES orders(id),
        FOREIGN KEY (rider_id) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS incentive_pools (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        area_code TEXT,
        start_time INTEGER NOT NULL,
        end_time INTEGER NOT NULL,
        total_budget REAL DEFAULT 0,
        remaining_budget REAL DEFAULT 0,
        min_orders INTEGER DEFAULT 0,
        bonus_amount REAL DEFAULT 0,
        is_active INTEGER DEFAULT 1,
        created_at INTEGER DEFAULT (strftime('%s','now'))
      );

      CREATE TABLE IF NOT EXISTS incentive_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        pool_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        order_count INTEGER DEFAULT 0,
        bonus_amount REAL DEFAULT 0,
        granted_at INTEGER,
        created_at INTEGER DEFAULT (strftime('%s','now')),
        FOREIGN KEY (pool_id) REFERENCES incentive_pools(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS commission_rules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        level INTEGER UNIQUE NOT NULL,
        order_threshold INTEGER NOT NULL,
        base_rate REAL NOT NULL,
        bonus_rate REAL DEFAULT 0,
        peak_hour_rate REAL DEFAULT 0,
        created_at INTEGER DEFAULT (strftime('%s','now'))
      );

      CREATE TABLE IF NOT EXISTS wallets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER UNIQUE NOT NULL,
        balance REAL DEFAULT 0,
        frozen_balance REAL DEFAULT 0,
        total_income REAL DEFAULT 0,
        total_withdraw REAL DEFAULT 0,
        created_at INTEGER DEFAULT (strftime('%s','now')),
        updated_at INTEGER DEFAULT (strftime('%s','now')),
        FOREIGN KEY (user_id) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS wallet_transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        order_id INTEGER,
        type TEXT NOT NULL,
        amount REAL NOT NULL,
        balance_after REAL NOT NULL,
        description TEXT,
        created_at INTEGER DEFAULT (strftime('%s','now')),
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (order_id) REFERENCES orders(id)
      );

      CREATE TABLE IF NOT EXISTS withdraw_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        amount REAL NOT NULL,
        bank_card_info TEXT,
        status TEXT DEFAULT 'pending',
        processed_at INTEGER,
        tax_amount REAL DEFAULT 0,
        actual_amount REAL DEFAULT 0,
        tax_certificate TEXT,
        created_at INTEGER DEFAULT (strftime('%s','now')),
        FOREIGN KEY (user_id) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS tax_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        withdraw_id INTEGER,
        income_amount REAL NOT NULL,
        tax_rate REAL DEFAULT 0.03,
        tax_amount REAL NOT NULL,
        certificate_no TEXT UNIQUE,
        created_at INTEGER DEFAULT (strftime('%s','now')),
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (withdraw_id) REFERENCES withdraw_requests(id)
      );

      CREATE TABLE IF NOT EXISTS appeal_tickets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER,
        user_id INTEGER NOT NULL,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        photo_urls TEXT,
        status TEXT DEFAULT 'pending',
        handler_id INTEGER,
        handled_at INTEGER,
        handling_result TEXT,
        created_at INTEGER DEFAULT (strftime('%s','now')),
        FOREIGN KEY (order_id) REFERENCES orders(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS area_demand_predictions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        area_code TEXT NOT NULL,
        prediction_date TEXT NOT NULL,
        hour_of_day INTEGER NOT NULL,
        predicted_orders INTEGER DEFAULT 0,
        actual_orders INTEGER,
        supply_demand_ratio REAL DEFAULT 1.0,
        created_at INTEGER DEFAULT (strftime('%s','now')),
        UNIQUE(area_code, prediction_date, hour_of_day)
      );

      CREATE TABLE IF NOT EXISTS heatmap_data (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        area_code TEXT NOT NULL,
        record_date TEXT NOT NULL,
        hour_of_day INTEGER NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        rider_count INTEGER DEFAULT 0,
        order_count INTEGER DEFAULT 0,
        intensity REAL DEFAULT 0,
        created_at INTEGER DEFAULT (strftime('%s','now'))
      );

      CREATE TABLE IF NOT EXISTS system_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        action TEXT NOT NULL,
        target_type TEXT,
        target_id INTEGER,
        ip_address TEXT,
        user_agent TEXT,
        request_id TEXT,
        created_at INTEGER DEFAULT (strftime('%s','now'))
      );

      CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
      CREATE INDEX IF NOT EXISTS idx_orders_rider ON orders(rider_id);
      CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);
      CREATE INDEX IF NOT EXISTS idx_gps_user ON gps_traces(user_id, timestamp);
      CREATE INDEX IF NOT EXISTS idx_gps_order ON gps_traces(order_id);
      CREATE INDEX IF NOT EXISTS idx_tokens_access ON oauth_tokens(access_token);
      CREATE INDEX IF NOT EXISTS idx_tokens_refresh ON oauth_tokens(refresh_token);
      CREATE INDEX IF NOT EXISTS idx_transactions_user ON wallet_transactions(user_id);
      CREATE INDEX IF NOT EXISTS idx_heatmap_area ON heatmap_data(area_code, record_date);
    `);

    const hashedAdmin = bcrypt.hashSync('admin123', 10);
    const hashedRider = bcrypt.hashSync('rider123', 10);

    db.prepare(`INSERT OR IGNORE INTO users (username, password_hash, role, phone, real_name, status) VALUES (?, ?, ?, ?, ?, ?)`).run(
      'admin', hashedAdmin, 'admin', '13800000001', '平台管理员', 'verified'
    );
    db.prepare(`INSERT OR IGNORE INTO users (username, password_hash, role, phone, real_name, status) VALUES (?, ?, ?, ?, ?, ?)`).run(
      'rider1', hashedRider, 'rider', '13900000001', '张师傅', 'verified'
    );
    db.prepare(`INSERT OR IGNORE INTO users (username, password_hash, role, phone, real_name, status) VALUES (?, ?, ?, ?, ?, ?)`).run(
      'rider2', hashedRider, 'rider', '13900000002', '李师傅', 'verified'
    );

    db.prepare(`INSERT OR IGNORE INTO oauth_clients (client_id, client_secret, name, redirect_uri) VALUES (?, ?, ?, ?)`).run(
      'platform-admin', 'platform-secret-2024', '前端Web应用', 'http://127.0.0.1:49061/oauth/callback'
    );

    db.prepare(`INSERT OR IGNORE INTO rider_stats (user_id, fulfillment_rate, level) VALUES (?, ?, ?)`).run(
      2, 96.5, 2
    );
    db.prepare(`INSERT OR IGNORE INTO rider_stats (user_id, fulfillment_rate, level) VALUES (?, ?, ?)`).run(
      3, 93.2, 1
    );

    db.prepare(`INSERT OR IGNORE INTO rider_verifications (user_id, id_card_number, verification_status, verified_at) VALUES (?, ?, ?, ?)`).run(
      2, 'U2FsdGVkX1+test123', 'verified', Date.now()
    );
    db.prepare(`INSERT OR IGNORE INTO rider_vehicles (user_id, vehicle_type, plate_number, binding_status, verified_at) VALUES (?, ?, ?, ?, ?)`).run(
      2, 'electric', '京A12345', 'bound', Date.now()
    );

    db.prepare(`INSERT OR IGNORE INTO wallets (user_id) VALUES (?)`).run(2);
    db.prepare(`INSERT OR IGNORE INTO wallets (user_id) VALUES (?)`).run(3);

    db.prepare(`INSERT OR IGNORE INTO dispatch_rules (name) VALUES (?)`).run('默认派单规则');

    db.prepare(`INSERT OR IGNORE INTO commission_rules (level, order_threshold, base_rate, bonus_rate, peak_hour_rate) VALUES (?, ?, ?, ?, ?)`).run(1, 0, 0.75, 0, 0.8);
    db.prepare(`INSERT OR IGNORE INTO commission_rules (level, order_threshold, base_rate, bonus_rate, peak_hour_rate) VALUES (?, ?, ?, ?, ?)`).run(2, 100, 0.8, 0.05, 0.85);
    db.prepare(`INSERT OR IGNORE INTO commission_rules (level, order_threshold, base_rate, bonus_rate, peak_hour_rate) VALUES (?, ?, ?, ?, ?)`).run(3, 300, 0.85, 0.1, 0.9);

    const now = Math.floor(Date.now() / 1000);
    const insertOrder = db.prepare(`INSERT OR IGNORE INTO orders (order_no, merchant_name, merchant_address, merchant_lat, merchant_lng, customer_name, customer_phone, customer_address, customer_lat, customer_lng, goods_description, estimated_distance, estimated_duration, base_fee, tip_fee, total_fee, rider_fee, status, expected_pickup_time, expected_delivery_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    
    insertOrder.run(
      'ORD' + now + '001',
      '肯德基(望京店)',
      '北京市朝阳区望京SOHO T1', 39.9920, 116.4780,
      '王先生', '13800138001',
      '北京市朝阳区阜通东大街6号院', 39.9950, 116.4820,
      '全家桶套餐 x1', 1500, 20, 8, 3, 11, 8.25, 'pending',
      now + 600, now + 1800
    );
    insertOrder.run(
      'ORD' + now + '002',
      '麦当劳(三里屯店)',
      '北京市朝阳区三里屯太古里', 39.9390, 116.4490,
      '李女士', '13800138002',
      '北京市朝阳区工人体育场北路8号', 39.9360, 116.4450,
      '巨无霸套餐 x2', 2000, 25, 10, 5, 15, 11.25, 'pending',
      now + 900, now + 2400
    );

    const insertHeatmap = db.prepare(`INSERT OR IGNORE INTO heatmap_data (area_code, record_date, hour_of_day, latitude, longitude, rider_count, order_count, intensity) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
    const today = new Date().toISOString().split('T')[0];
    for (let i = 0; i < 20; i++) {
      const baseLat = 39.95 + Math.random() * 0.08;
      const baseLng = 116.42 + Math.random() * 0.08;
      insertHeatmap.run(
        'chaoyang-beijing',
        today,
        12,
        baseLat,
        baseLng,
        Math.floor(Math.random() * 15) + 5,
        Math.floor(Math.random() * 30) + 10,
        Math.random() * 0.8 + 0.2
      );
    }
  });

  try {
    createTables();
    console.log('Database initialized successfully!');
    console.log('Test accounts:');
    console.log('  Admin: admin / admin123');
    console.log('  Rider: rider1 / rider123');
    console.log('  Rider: rider2 / rider123');
  } catch (e) {
    console.error('Database init failed:', e);
    throw e;
  } finally {
    db.close();
  }
};

initDb();
