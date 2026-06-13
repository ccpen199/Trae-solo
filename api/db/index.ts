import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'
import seed from './seed.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const dbPath = path.join(__dirname, '../../data/ticket.db')
const db = new Database(dbPath)

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

const initSQL = `
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    real_name TEXT NOT NULL,
    id_card TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL DEFAULT 'user',
    credit_score INTEGER DEFAULT 0,
    zhima_user_id TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS organizers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    company_name TEXT NOT NULL,
    license TEXT NOT NULL UNIQUE,
    contact_name TEXT NOT NULL,
    contact_phone TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS organizer_applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    organizer_id INTEGER NOT NULL REFERENCES organizers(id),
    company_name TEXT NOT NULL,
    license TEXT NOT NULL,
    contact_name TEXT NOT NULL,
    contact_phone TEXT NOT NULL,
    documents TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    review_reason TEXT,
    reviewed_at TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    organizer_id INTEGER NOT NULL REFERENCES organizers(id),
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    venue TEXT NOT NULL,
    poster TEXT,
    status TEXT NOT NULL DEFAULT 'draft',
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS showtimes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER NOT NULL REFERENCES events(id),
    start_time TEXT NOT NULL,
    sale_start_time TEXT NOT NULL,
    presale_start_time TEXT,
    total_seats INTEGER NOT NULL DEFAULT 0,
    available_seats INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'upcoming',
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS zones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    showtime_id INTEGER NOT NULL REFERENCES showtimes(id),
    name TEXT NOT NULL,
    color TEXT NOT NULL,
    rows INTEGER NOT NULL,
    cols INTEGER NOT NULL,
    seat_layout TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS pricing_tiers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    showtime_id INTEGER NOT NULL REFERENCES showtimes(id),
    name TEXT NOT NULL,
    tier_type TEXT NOT NULL,
    price REAL NOT NULL,
    valid_from TEXT,
    valid_to TEXT,
    quota INTEGER NOT NULL DEFAULT 0,
    sold INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS seats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    zone_id INTEGER NOT NULL REFERENCES zones(id),
    row_num INTEGER NOT NULL,
    col_num INTEGER NOT NULL,
    seat_label TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'available',
    pricing_tier_id INTEGER REFERENCES pricing_tiers(id),
    showtime_id INTEGER NOT NULL REFERENCES showtimes(id)
);

CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    order_no TEXT NOT NULL UNIQUE,
    total_amount REAL NOT NULL,
    payment_method TEXT NOT NULL,
    payment_status TEXT NOT NULL DEFAULT 'pending',
    zhima_auth_code TEXT,
    credit_deducted_at TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS tickets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL REFERENCES orders(id),
    seat_id INTEGER NOT NULL REFERENCES seats(id),
    showtime_id INTEGER NOT NULL REFERENCES showtimes(id),
    user_id INTEGER NOT NULL REFERENCES users(id),
    pricing_tier_id INTEGER REFERENCES pricing_tiers(id),
    anti_fake_code TEXT NOT NULL UNIQUE,
    blockchain_hash TEXT,
    status TEXT NOT NULL DEFAULT 'valid',
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS refund_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_id INTEGER NOT NULL REFERENCES tickets(id),
    order_id INTEGER NOT NULL REFERENCES orders(id),
    refund_amount REAL NOT NULL,
    fee_amount REAL NOT NULL DEFAULT 0,
    reason TEXT,
    reason_category TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS checkin_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_id INTEGER NOT NULL REFERENCES tickets(id),
    gate_id TEXT,
    checked_in_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS queue_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    queue_id TEXT NOT NULL UNIQUE,
    user_id INTEGER NOT NULL REFERENCES users(id),
    showtime_id INTEGER NOT NULL REFERENCES showtimes(id),
    position INTEGER NOT NULL,
    priority_weight REAL NOT NULL DEFAULT 1.0,
    status TEXT NOT NULL DEFAULT 'waiting',
    seat_holds TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_events_category ON events(category);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_showtimes_event ON showtimes(event_id);
CREATE INDEX IF NOT EXISTS idx_seats_zone ON seats(zone_id);
CREATE INDEX IF NOT EXISTS idx_seats_showtime_status ON seats(showtime_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_tickets_user ON tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_anti_fake ON tickets(anti_fake_code);
CREATE INDEX IF NOT EXISTS idx_tickets_blockchain ON tickets(blockchain_hash);
CREATE INDEX IF NOT EXISTS idx_queue_showtime ON queue_entries(showtime_id, status);
CREATE INDEX IF NOT EXISTS idx_queue_position ON queue_entries(position);
CREATE INDEX IF NOT EXISTS idx_refund_status ON refund_records(status);
`

db.exec(initSQL)

seed(db)

export default db
