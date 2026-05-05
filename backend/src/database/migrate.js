require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'train_ticket',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

const createTables = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    console.log('Creating trains table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS trains (
        id SERIAL PRIMARY KEY,
        train_number VARCHAR(20) NOT NULL UNIQUE,
        train_name VARCHAR(100),
        train_type VARCHAR(20) DEFAULT '普通',
        from_station VARCHAR(50) NOT NULL,
        to_station VARCHAR(50) NOT NULL,
        departure_time TIME NOT NULL,
        arrival_time TIME NOT NULL,
        duration_minutes INTEGER,
        total_seats INTEGER DEFAULT 100,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Creating stations table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS stations (
        id SERIAL PRIMARY KEY,
        station_code VARCHAR(10) NOT NULL UNIQUE,
        station_name VARCHAR(100) NOT NULL,
        city VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Creating train_stations table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS train_stations (
        id SERIAL PRIMARY KEY,
        train_id INTEGER NOT NULL REFERENCES trains(id) ON DELETE CASCADE,
        station_id INTEGER NOT NULL REFERENCES stations(id),
        station_order INTEGER NOT NULL,
        arrival_time TIME,
        departure_time TIME,
        stay_minutes INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(train_id, station_order)
      )
    `);

    console.log('Creating tickets table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS tickets (
        id SERIAL PRIMARY KEY,
        ticket_no VARCHAR(32) NOT NULL UNIQUE,
        train_id INTEGER NOT NULL REFERENCES trains(id),
        from_station VARCHAR(50) NOT NULL,
        to_station VARCHAR(50) NOT NULL,
        seat_type VARCHAR(20) DEFAULT '硬座',
        seat_number VARCHAR(20),
        carriage_number VARCHAR(10),
        price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        status VARCHAR(20) DEFAULT 'available',
        travel_date DATE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Creating orders table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        order_no VARCHAR(32) NOT NULL UNIQUE,
        passenger_name VARCHAR(50) NOT NULL,
        passenger_id_card VARCHAR(18),
        passenger_phone VARCHAR(20),
        train_id INTEGER NOT NULL REFERENCES trains(id),
        ticket_id INTEGER REFERENCES tickets(id),
        from_station VARCHAR(50) NOT NULL,
        to_station VARCHAR(50) NOT NULL,
        seat_type VARCHAR(20),
        seat_number VARCHAR(20),
        carriage_number VARCHAR(10),
        price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        travel_date DATE NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        payment_method VARCHAR(20),
        paid_at TIMESTAMP,
        order_type VARCHAR(20) DEFAULT 'online',
        created_by VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Creating inventory table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS inventory (
        id SERIAL PRIMARY KEY,
        train_id INTEGER NOT NULL REFERENCES trains(id),
        from_station VARCHAR(50) NOT NULL,
        to_station VARCHAR(50) NOT NULL,
        seat_type VARCHAR(20) DEFAULT '硬座',
        travel_date DATE NOT NULL,
        total_count INTEGER NOT NULL DEFAULT 0,
        available_count INTEGER NOT NULL DEFAULT 0,
        locked_count INTEGER NOT NULL DEFAULT 0,
        sold_count INTEGER NOT NULL DEFAULT 0,
        version INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(train_id, from_station, to_station, seat_type, travel_date)
      )
    `);

    console.log('Creating refunds table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS refunds (
        id SERIAL PRIMARY KEY,
        refund_no VARCHAR(32) NOT NULL UNIQUE,
        order_id INTEGER NOT NULL REFERENCES orders(id),
        order_no VARCHAR(32) NOT NULL,
        passenger_name VARCHAR(50) NOT NULL,
        train_id INTEGER NOT NULL,
        ticket_id INTEGER,
        from_station VARCHAR(50) NOT NULL,
        to_station VARCHAR(50) NOT NULL,
        seat_type VARCHAR(20),
        seat_number VARCHAR(20),
        travel_date DATE NOT NULL,
        refund_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        refund_reason TEXT,
        status VARCHAR(20) DEFAULT 'processing',
        processed_at TIMESTAMP,
        processed_by VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Creating indexes...');
    await client.query(`CREATE INDEX IF NOT EXISTS idx_trains_number ON trains(train_number)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_trains_stations ON trains(from_station, to_station)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_tickets_train_id ON tickets(train_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_tickets_date ON tickets(travel_date)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_orders_passenger_name ON orders(passenger_name)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_orders_order_no ON orders(order_no)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_orders_date ON orders(travel_date)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_inventory_train ON inventory(train_id, travel_date)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_inventory_route ON inventory(from_station, to_station, travel_date)`);

    await client.query('COMMIT');
    console.log('All tables created successfully!');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
};

const createDatabaseIfNotExists = async () => {
  const adminPool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: 'postgres',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  });

  const client = await adminPool.connect();
  try {
    const dbName = process.env.DB_NAME || 'train_ticket';
    const result = await client.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [dbName]
    );

    if (result.rows.length === 0) {
      console.log(`Creating database ${dbName}...`);
      await client.query(`CREATE DATABASE ${dbName}`);
      console.log(`Database ${dbName} created successfully!`);
    } else {
      console.log(`Database ${dbName} already exists.`);
    }
  } finally {
    client.release();
    await adminPool.end();
  }
};

const runMigration = async () => {
  try {
    console.log('Checking database...');
    await createDatabaseIfNotExists();
    console.log('Running migrations...');
    await createTables();
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration process failed:', error);
    process.exit(1);
  }
};

runMigration();
