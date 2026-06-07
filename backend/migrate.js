const { getDB } = require('./db/init');

const db = getDB();

console.log('Running database migrations...');

try {
  const columns = db.prepare("PRAGMA table_info(courier_profiles)").all();
  const hasServiceAreas = columns.some(c => c.name === 'service_areas');
  
  if (!hasServiceAreas) {
    console.log('Adding service_areas column to courier_profiles...');
    db.exec('ALTER TABLE courier_profiles ADD COLUMN service_areas TEXT');
    console.log('✓ service_areas column added');
  } else {
    console.log('✓ service_areas column already exists');
  }

  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='credit_adjustments'").get();
  if (!tables) {
    console.log('Creating credit_adjustments table...');
    db.exec(`
      CREATE TABLE IF NOT EXISTS credit_adjustments (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        reason TEXT,
        score_change INTEGER,
        created_by TEXT,
        created_at TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);
    console.log('✓ credit_adjustments table created');
  } else {
    console.log('✓ credit_adjustments table already exists');
  }

  const saCount = db.prepare('SELECT COUNT(*) as count FROM service_areas').get().count;
  if (saCount === 0) {
    console.log('Adding sample service_areas data...');
    const serviceAreas = [
      { id: 'sa1', city: '北京市', district: '朝阳-望京', grid_code: 'BJ-CY-WJ', center_latitude: 39.9908, center_longitude: 116.4714, heat_level: 5, active_couriers: 12, pending_orders: 23 },
      { id: 'sa2', city: '北京市', district: '海淀-中关村', grid_code: 'BJ-HD-ZGC', center_latitude: 39.9831, center_longitude: 116.3169, heat_level: 4, active_couriers: 8, pending_orders: 15 },
      { id: 'sa3', city: '北京市', district: '东城-王府井', grid_code: 'BJ-DC-WFJ', center_latitude: 39.9154, center_longitude: 116.4041, heat_level: 3, active_couriers: 5, pending_orders: 8 },
      { id: 'sa4', city: '北京市', district: '西城-金融街', grid_code: 'BJ-XC-JRJ', center_latitude: 39.9129, center_longitude: 116.3642, heat_level: 4, active_couriers: 6, pending_orders: 11 },
      { id: 'sa5', city: '北京市', district: '丰台-总部基地', grid_code: 'BJ-FT-ZBJD', center_latitude: 39.8283, center_longitude: 116.2975, heat_level: 2, active_couriers: 3, pending_orders: 4 },
      { id: 'sa6', city: '北京市', district: '通州-万达', grid_code: 'BJ-TZ-WD', center_latitude: 39.9087, center_longitude: 116.6569, heat_level: 1, active_couriers: 2, pending_orders: 2 },
    ];
    
    const insertSA = db.prepare(`
      INSERT INTO service_areas (id, city, district, grid_code, center_latitude, center_longitude, heat_level, active_couriers, pending_orders, created_at, updated_at)
      VALUES (@id, @city, @district, @grid_code, @center_latitude, @center_longitude, @heat_level, @active_couriers, @pending_orders, datetime('now'), datetime('now'))
    `);
    
    const tx = db.transaction(areas => {
      for (const area of areas) insertSA.run(area);
    });
    
    tx(serviceAreas);
    console.log('✓ Sample service_areas data added');
  } else {
    console.log(`✓ service_areas already has ${saCount} records`);
  }

  const couriers = db.prepare('SELECT user_id FROM courier_profiles').all();
  const sampleServiceAreas = JSON.stringify([
    { city: '北京市', district: '朝阳区' },
    { city: '北京市', district: '海淀区' }
  ]);
  
  const updateSA = db.prepare('UPDATE courier_profiles SET service_areas = ? WHERE service_areas IS NULL');
  const result = updateSA.run(sampleServiceAreas);
  console.log(`✓ Updated ${result.changes} courier profiles with default service areas`);

  console.log('\n✓ All migrations completed successfully!');
} catch (e) {
  console.error('✗ Migration failed:', e.message);
  process.exit(1);
}
