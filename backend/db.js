import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dataDir = join(__dirname, '..', 'data');
const dbPath = join(dataDir, 'app.sqlite');

mkdirSync(dataDir, { recursive: true });

const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function tableExists(tableName) {
  return Boolean(
    db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?")
      .get(tableName)
  );
}

function hasColumn(tableName, columnName) {
  if (!tableExists(tableName)) return false;
  return db.pragma(`table_info(${tableName})`).some((column) => column.name === columnName);
}

function resetIfWrongSchema() {
  const looksLikeCinemaDb = tableExists('cinemas') && hasColumn('orders', 'showtime_id');
  if (looksLikeCinemaDb) return;

  db.pragma('foreign_keys = OFF');
  db.exec(`
    DROP TABLE IF EXISTS ab_test_results;
    DROP TABLE IF EXISTS ab_test_variants;
    DROP TABLE IF EXISTS ab_tests;
    DROP TABLE IF EXISTS crowdfunding_participants;
    DROP TABLE IF EXISTS crowdfunding_events;
    DROP TABLE IF EXISTS wallet_transactions;
    DROP TABLE IF EXISTS wallet_cards;
    DROP TABLE IF EXISTS order_items;
    DROP TABLE IF EXISTS seats_lock;
    DROP TABLE IF EXISTS orders;
    DROP TABLE IF EXISTS showtimes;
    DROP TABLE IF EXISTS concessions;
    DROP TABLE IF EXISTS concession_combos;
    DROP TABLE IF EXISTS audiences;
    DROP TABLE IF EXISTS movies;
    DROP TABLE IF EXISTS halls;
    DROP TABLE IF EXISTS cinemas;

    DROP TABLE IF EXISTS merchants;
    DROP TABLE IF EXISTS recipients;
    DROP TABLE IF EXISTS riders;
    DROP TABLE IF EXISTS rider_certifications;
    DROP TABLE IF EXISTS rider_credit_logs;
    DROP TABLE IF EXISTS rider_pools;
    DROP TABLE IF EXISTS sla_configs;
    DROP TABLE IF EXISTS waybill_tracks;
    DROP TABLE IF EXISTS order_status_logs;
    DROP TABLE IF EXISTS risk_controls;
    DROP TABLE IF EXISTS dispatch_records;
    DROP TABLE IF EXISTS delivery_pools;
    DROP TABLE IF EXISTS settlements;
    DROP TABLE IF EXISTS complaints;
  `);
  db.pragma('foreign_keys = ON');
}

resetIfWrongSchema();

db.exec(`
  CREATE TABLE IF NOT EXISTS cinemas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    city TEXT NOT NULL,
    district TEXT,
    address TEXT,
    hall_count INTEGER DEFAULT 1,
    equipment_level TEXT DEFAULT 'standard',
    scheduling_protocol TEXT,
    status TEXT DEFAULT 'active',
    equipment_verify_date TEXT,
    equipment_verify_by TEXT,
    equipment_verify_status TEXT,
    protocol_start_date TEXT,
    protocol_end_date TEXT,
    min_schedule_ratio REAL,
    max_daily_showtimes INTEGER,
    last_review_date TEXT,
    next_review_date TEXT,
    review_notes TEXT,
    review_status TEXT,
    reviewed_by TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS halls (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cinema_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    seat_rows INTEGER NOT NULL DEFAULT 8,
    seat_cols INTEGER NOT NULL DEFAULT 12,
    screen_type TEXT DEFAULT 'standard',
    equipment_level TEXT DEFAULT 'standard',
    status TEXT DEFAULT 'active',
    seat_count INTEGER NOT NULL DEFAULT 96,
    FOREIGN KEY (cinema_id) REFERENCES cinemas(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS movies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    genre TEXT,
    duration INTEGER,
    director TEXT,
    release_date TEXT,
    copyright_expiry TEXT,
    revenue_share_ratio REAL DEFAULT 0.5,
    pre_show_package TEXT,
    poster_url TEXT,
    status TEXT DEFAULT 'upcoming',
    synopsis TEXT,
    cast TEXT,
    copyright_holder TEXT,
    copyright_reg_no TEXT,
    copyright_region TEXT,
    copyright_terms TEXT,
    pre_show_ad_duration INTEGER,
    pre_show_trailer_count INTEGER,
    pre_show_material_version TEXT,
    pre_show_material_path TEXT,
    pre_show_languages TEXT,
    pre_show_subtitles TEXT,
    share_effective_date TEXT,
    share_expiry_date TEXT,
    share_tiered INTEGER DEFAULT 0,
    share_tier1_ratio REAL,
    share_tier2_ratio REAL,
    share_tier3_ratio REAL,
    lifecycle_first_schedule TEXT,
    lifecycle_last_schedule TEXT,
    lifecycle_notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS showtimes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    movie_id INTEGER NOT NULL,
    cinema_id INTEGER NOT NULL,
    hall_id INTEGER NOT NULL,
    show_date TEXT NOT NULL,
    show_time TEXT NOT NULL,
    base_price REAL NOT NULL DEFAULT 45,
    current_price REAL NOT NULL DEFAULT 45,
    min_seats INTEGER DEFAULT 1,
    max_seats INTEGER DEFAULT 6,
    refund_rule TEXT DEFAULT 'flexible',
    status TEXT DEFAULT 'open',
    created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (movie_id) REFERENCES movies(id),
    FOREIGN KEY (cinema_id) REFERENCES cinemas(id),
    FOREIGN KEY (hall_id) REFERENCES halls(id)
  );

  CREATE TABLE IF NOT EXISTS audiences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT UNIQUE NOT NULL,
    email TEXT,
    preference_tags TEXT NOT NULL DEFAULT '[]',
    member_level TEXT DEFAULT 'regular',
    points_balance INTEGER DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS wallet_cards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    audience_id INTEGER NOT NULL,
    card_no TEXT UNIQUE NOT NULL,
    card_type TEXT DEFAULT 'personal',
    balance REAL DEFAULT 0,
    status TEXT DEFAULT 'active',
    created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (audience_id) REFERENCES audiences(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS wallet_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    card_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    amount REAL NOT NULL,
    balance_after REAL NOT NULL,
    order_id INTEGER,
    remark TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (card_id) REFERENCES wallet_cards(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS concessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT,
    price REAL NOT NULL,
    image_url TEXT,
    status TEXT DEFAULT 'available',
    created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS concession_combos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    items TEXT NOT NULL DEFAULT '[]',
    total_price REAL NOT NULL,
    discount_rate REAL DEFAULT 1.0,
    status TEXT DEFAULT 'available',
    created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_no TEXT UNIQUE NOT NULL,
    audience_id INTEGER NOT NULL,
    showtime_id INTEGER NOT NULL,
    seat_info TEXT NOT NULL,
    total_amount REAL NOT NULL DEFAULT 0,
    status TEXT DEFAULT 'pending',
    payment_method TEXT,
    pay_card_id INTEGER,
    channel TEXT DEFAULT 'official',
    verification_status TEXT DEFAULT 'not_verified',
    verification_time TEXT,
    verification_channel TEXT,
    payment_id TEXT,
    crowdfunding_id INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (audience_id) REFERENCES audiences(id),
    FOREIGN KEY (showtime_id) REFERENCES showtimes(id),
    FOREIGN KEY (pay_card_id) REFERENCES wallet_cards(id)
  );

  CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    item_type TEXT NOT NULL,
    item_id INTEGER,
    item_name TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price REAL NOT NULL DEFAULT 0,
    subtotal REAL NOT NULL DEFAULT 0,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS seats_lock (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    showtime_id INTEGER NOT NULL,
    row INTEGER NOT NULL,
    col INTEGER NOT NULL,
    status TEXT DEFAULT 'locked',
    locked_by TEXT,
    locked_at TEXT,
    order_id INTEGER,
    FOREIGN KEY (showtime_id) REFERENCES showtimes(id) ON DELETE CASCADE,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS crowdfunding_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    movie_id INTEGER NOT NULL,
    cinema_id INTEGER NOT NULL,
    hall_id INTEGER NOT NULL,
    target_audience_count INTEGER NOT NULL,
    current_count INTEGER DEFAULT 0,
    base_price REAL NOT NULL,
    min_price REAL NOT NULL,
    max_price REAL NOT NULL,
    price_strategy TEXT DEFAULT 'fixed',
    target_show_date TEXT NOT NULL,
    auto_confirm INTEGER DEFAULT 0,
    status TEXT DEFAULT 'draft',
    created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (movie_id) REFERENCES movies(id),
    FOREIGN KEY (cinema_id) REFERENCES cinemas(id),
    FOREIGN KEY (hall_id) REFERENCES halls(id)
  );

  CREATE TABLE IF NOT EXISTS crowdfunding_participants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER NOT NULL,
    audience_id INTEGER NOT NULL,
    seats_reserved INTEGER DEFAULT 1,
    price_paid REAL NOT NULL,
    status TEXT DEFAULT 'joined',
    created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (event_id) REFERENCES crowdfunding_events(id) ON DELETE CASCADE,
    FOREIGN KEY (audience_id) REFERENCES audiences(id)
  );

  CREATE TABLE IF NOT EXISTS ab_tests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    metric TEXT DEFAULT 'conversion',
    status TEXT DEFAULT 'running',
    start_date TEXT,
    end_date TEXT
  );

  CREATE TABLE IF NOT EXISTS ab_test_variants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    test_id INTEGER NOT NULL,
    variant_name TEXT NOT NULL,
    traffic_percent REAL DEFAULT 50,
    FOREIGN KEY (test_id) REFERENCES ab_tests(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS ab_test_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    variant_id INTEGER NOT NULL,
    converted INTEGER DEFAULT 0,
    revenue REAL DEFAULT 0,
    FOREIGN KEY (variant_id) REFERENCES ab_test_variants(id) ON DELETE CASCADE
  );
`);

function seedData() {
  const existing = db.prepare('SELECT COUNT(*) AS count FROM cinemas').get();
  if (existing.count > 0) return;

  const today = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const tx = db.transaction(() => {
    db.prepare(`
      INSERT INTO cinemas (
        id, name, city, district, address, hall_count, equipment_level, scheduling_protocol, status,
        equipment_verify_date, equipment_verify_by, equipment_verify_status,
        protocol_start_date, protocol_end_date, min_schedule_ratio, max_daily_showtimes,
        last_review_date, next_review_date, review_notes, review_status, reviewed_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(1, '星河影城旗舰店', '上海', '浦东新区', '世纪大道 88 号', 2, 'laser_imax', '黄金时段国产片不低于 35%', 'active', today, '设备主管', 'passed', today, nextWeek, 0.35, 18, today, nextWeek, '设备状态正常，排片协议已续签', 'passed', '运营经理');

    db.prepare(`
      INSERT INTO cinemas (
        id, name, city, district, address, hall_count, equipment_level, scheduling_protocol, status,
        equipment_verify_date, equipment_verify_by, equipment_verify_status,
        protocol_start_date, protocol_end_date, min_schedule_ratio, max_daily_showtimes,
        last_review_date, next_review_date, review_notes, review_status, reviewed_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(2, '万象汇电影中心', '杭州', '西湖区', '文三路 168 号', 1, 'standard', '重点新片首周每日不少于 6 场', 'active', today, '质检员', 'passed', today, nextWeek, 0.25, 12, today, nextWeek, '小卖品联动活动执行中', 'passed', '区域督导');

    db.prepare('INSERT INTO halls (id, cinema_id, name, seat_rows, seat_cols, screen_type, equipment_level, status, seat_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .run(1, 1, 'IMAX 一号厅', 8, 12, 'imax', 'laser_imax', 'active', 96);
    db.prepare('INSERT INTO halls (id, cinema_id, name, seat_rows, seat_cols, screen_type, equipment_level, status, seat_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .run(2, 1, '杜比全景声厅', 7, 10, 'dolby', 'premium', 'active', 70);
    db.prepare('INSERT INTO halls (id, cinema_id, name, seat_rows, seat_cols, screen_type, equipment_level, status, seat_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .run(3, 2, '四号激光厅', 6, 10, 'laser', 'standard', 'active', 60);

    const movieInsert = db.prepare(`
      INSERT INTO movies (
        id, title, genre, duration, director, release_date, copyright_expiry, revenue_share_ratio,
        pre_show_package, poster_url, status, synopsis, cast, copyright_holder, copyright_reg_no,
        copyright_region, copyright_terms, pre_show_ad_duration, pre_show_trailer_count,
        pre_show_material_version, pre_show_material_path, pre_show_languages, pre_show_subtitles,
        share_effective_date, share_expiry_date, share_tiered, share_tier1_ratio, share_tier2_ratio,
        share_tier3_ratio, lifecycle_first_schedule, lifecycle_last_schedule, lifecycle_notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    movieInsert.run(1, '星际归途', 'Action', 128, '林澈', today, nextWeek, 0.48, '科幻预告 A', '', 'showing', '远航舰队返航途中发现新的宜居星球。', '周铭 / 许安', '银河影业', 'CN-2026-IM-001', JSON.stringify(['CN']), '全国院线发行', 90, 2, 'v3', '/materials/stars-v3.mp4', JSON.stringify(['普通话']), JSON.stringify(['中文字幕']), today, nextWeek, 1, 0.50, 0.47, 0.44, today, nextWeek, '首周热映，适合黄金场');
    movieInsert.run(2, '城市烟火', 'Drama', 112, '赵一凡', today, nextWeek, 0.42, '城市生活映前包', '', 'showing', '三组普通家庭在城市夜色里交汇。', '陈诺 / 李禾', '拾光文化', 'CN-2026-DR-018', JSON.stringify(['CN']), '华东区域优先', 60, 1, 'v2', '/materials/city-v2.mp4', JSON.stringify(['普通话']), JSON.stringify(['中文字幕']), today, nextWeek, 0, null, null, null, today, nextWeek, '口碑稳定，午后场表现较好');
    movieInsert.run(3, '深海来信', 'Family', 98, '钱悦', today, nextWeek, 0.45, '亲子预告包', '', 'showing', '少年和海洋科研团队寻找失落信标。', '王沐 / 唐佳', '蓝鲸动画', 'CN-2026-FA-009', JSON.stringify(['CN']), '亲子院线发行', 45, 1, 'v1', '/materials/ocean-v1.mp4', JSON.stringify(['普通话']), JSON.stringify(['中文字幕']), today, nextWeek, 0, null, null, null, today, nextWeek, '周末亲子场优先');
    movieInsert.run(4, '旧日回声', 'Suspense', 118, '韩青', tomorrow, nextWeek, 0.46, '悬疑预告包', '', 'upcoming', '档案馆管理员追踪一卷失踪录音。', '沈逸 / 何蓝', '回声影业', 'CN-2026-SU-022', JSON.stringify(['CN']), '预售期', 60, 1, 'v1', '/materials/echo-v1.mp4', JSON.stringify(['普通话']), JSON.stringify(['中文字幕']), tomorrow, nextWeek, 0, null, null, null, tomorrow, nextWeek, '预售观察中');

    const showtimeInsert = db.prepare('INSERT INTO showtimes (id, movie_id, cinema_id, hall_id, show_date, show_time, base_price, current_price, min_seats, max_seats, refund_rule, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    showtimeInsert.run(1, 1, 1, 1, today, '10:30', 58, 52, 1, 6, 'flexible', 'open');
    showtimeInsert.run(2, 2, 1, 2, today, '14:20', 46, 42, 1, 6, 'strict', 'open');
    showtimeInsert.run(3, 1, 1, 1, today, '19:30', 68, 72, 1, 4, 'flexible', 'open');
    showtimeInsert.run(4, 3, 2, 3, tomorrow, '16:00', 40, 36, 1, 8, 'none', 'open');

    const audienceInsert = db.prepare('INSERT INTO audiences (id, name, phone, email, preference_tags, member_level, points_balance) VALUES (?, ?, ?, ?, ?, ?, ?)');
    audienceInsert.run(1, '陈晓雨', '13800010001', 'xiaoyu@example.com', JSON.stringify(['科幻', 'IMAX']), 'gold', 860);
    audienceInsert.run(2, '李明哲', '13800010002', 'mingzhe@example.com', JSON.stringify(['剧情', '工作日优惠']), 'regular', 210);
    audienceInsert.run(3, '星河企业客户', '13800010003', 'corp@example.com', JSON.stringify(['包场', '团建']), 'platinum', 2400);

    const cardInsert = db.prepare('INSERT INTO wallet_cards (id, audience_id, card_no, card_type, balance, status) VALUES (?, ?, ?, ?, ?, ?)');
    cardInsert.run(1, 1, 'MC202606050001', 'personal', 326.5, 'active');
    cardInsert.run(2, 2, 'MC202606050002', 'personal', 88, 'active');
    cardInsert.run(3, 3, 'EC202606050003', 'enterprise', 5000, 'active');

    const concessionInsert = db.prepare('INSERT INTO concessions (id, name, category, price, image_url, status) VALUES (?, ?, ?, ?, ?, ?)');
    concessionInsert.run(1, '大桶爆米花', 'snack', 32, '', 'available');
    concessionInsert.run(2, '双杯可乐', 'drink', 24, '', 'available');
    concessionInsert.run(3, '拿铁咖啡', 'drink', 28, '', 'available');
    concessionInsert.run(4, '亲子零食包', 'combo_item', 39, '', 'available');

    db.prepare('INSERT INTO concession_combos (id, name, description, items, total_price, discount_rate, status) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(1, '双人观影套餐', '爆米花加双杯饮料', JSON.stringify([{ concession_id: 1, quantity: 1 }, { concession_id: 2, quantity: 1 }]), 49, 0.88, 'available');
    db.prepare('INSERT INTO concession_combos (id, name, description, items, total_price, discount_rate, status) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(2, '亲子分享套餐', '亲子零食包加可乐', JSON.stringify([{ concession_id: 4, quantity: 1 }, { concession_id: 2, quantity: 1 }]), 55, 0.9, 'available');

    const orderInsert = db.prepare(`
      INSERT INTO orders (
        id, order_no, audience_id, showtime_id, seat_info, total_amount, status, payment_method,
        pay_card_id, channel, verification_status, verification_time, verification_channel, payment_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    orderInsert.run(1, 'ORD202606050001', 1, 1, JSON.stringify([{ row: 3, col: 5 }, { row: 3, col: 6 }]), 153, 'paid', 'wallet', 1, 'official', 'verified', `${today} 10:12:00`, 'gate_qr', 'PAY-MC-0001');
    orderInsert.run(2, 'ORD202606050002', 2, 2, JSON.stringify([{ row: 4, col: 3 }]), 42, 'pending', 'card', null, 'mini_program', 'not_verified', null, null, 'PAY-CARD-0002');
    orderInsert.run(3, 'ORD202606050003', 3, 3, JSON.stringify([{ row: 5, col: 7 }, { row: 5, col: 8 }, { row: 5, col: 9 }]), 216, 'paid', 'wallet', 3, 'third_party', 'not_verified', null, null, 'PAY-ENT-0003');

    const itemInsert = db.prepare('INSERT INTO order_items (order_id, item_type, item_id, item_name, quantity, unit_price, subtotal) VALUES (?, ?, ?, ?, ?, ?, ?)');
    itemInsert.run(1, 'ticket', 1, '星际归途 10:30 电影票', 2, 52, 104);
    itemInsert.run(1, 'combo', 1, '双人观影套餐', 1, 49, 49);
    itemInsert.run(2, 'ticket', 2, '城市烟火 14:20 电影票', 1, 42, 42);
    itemInsert.run(3, 'ticket', 3, '星际归途 19:30 电影票', 3, 72, 216);

    const lockInsert = db.prepare('INSERT INTO seats_lock (showtime_id, row, col, status, locked_by, locked_at, order_id) VALUES (?, ?, ?, ?, ?, datetime(\'now\',\'localtime\'), ?)');
    lockInsert.run(1, 3, 5, 'sold', '1', 1);
    lockInsert.run(1, 3, 6, 'sold', '1', 1);
    lockInsert.run(2, 4, 3, 'locked', '2', 2);
    lockInsert.run(3, 5, 7, 'sold', '3', 3);
    lockInsert.run(3, 5, 8, 'sold', '3', 3);
    lockInsert.run(3, 5, 9, 'sold', '3', 3);

    db.prepare('INSERT INTO wallet_transactions (card_id, type, amount, balance_after, order_id, remark) VALUES (?, ?, ?, ?, ?, ?)')
      .run(1, 'consume', 153, 326.5, 1, '星际归途购票及套餐');
    db.prepare('INSERT INTO wallet_transactions (card_id, type, amount, balance_after, order_id, remark) VALUES (?, ?, ?, ?, ?, ?)')
      .run(3, 'consume', 216, 5000, 3, '企业团建观影');

    db.prepare('INSERT INTO crowdfunding_events (id, title, movie_id, cinema_id, hall_id, target_audience_count, current_count, base_price, min_price, max_price, price_strategy, target_show_date, auto_confirm, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .run(1, '旧日回声首映包场', 4, 1, 2, 60, 18, 59, 49, 69, 'dynamic', nextWeek, 1, 'open');
    db.prepare('INSERT INTO crowdfunding_participants (event_id, audience_id, seats_reserved, price_paid, status) VALUES (?, ?, ?, ?, ?)')
      .run(1, 1, 2, 118, 'joined');
    db.prepare('INSERT INTO crowdfunding_participants (event_id, audience_id, seats_reserved, price_paid, status) VALUES (?, ?, ?, ?, ?)')
      .run(1, 3, 16, 944, 'joined');

    db.prepare('INSERT INTO ab_tests (id, name, metric, status, start_date, end_date) VALUES (?, ?, ?, ?, ?, ?)')
      .run(1, '小卖品套餐默认推荐', 'revenue', 'running', today, nextWeek);
    db.prepare('INSERT INTO ab_test_variants (id, test_id, variant_name, traffic_percent) VALUES (?, ?, ?, ?)')
      .run(1, 1, '爆米花优先', 50);
    db.prepare('INSERT INTO ab_test_variants (id, test_id, variant_name, traffic_percent) VALUES (?, ?, ?, ?)')
      .run(2, 1, '咖啡优先', 50);
    db.prepare('INSERT INTO ab_test_results (variant_id, converted, revenue) VALUES (?, ?, ?)')
      .run(1, 1, 49);
    db.prepare('INSERT INTO ab_test_results (variant_id, converted, revenue) VALUES (?, ?, ?)')
      .run(2, 1, 68);
  });

  tx();
}

seedData();

export default db;
