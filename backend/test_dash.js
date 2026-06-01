import Database from 'better-sqlite3';
const db = new Database('./data/app.sqlite');

const days = 7;

// Test 1: datetime with two parameters
console.log('Test 1: datetime(?, ?)');
const rows1 = db.prepare(`
  SELECT DATE(joined_at) as date, COUNT(DISTINCT room_id) as room_count,
    COALESCE(SUM(duration_seconds), 0) as total_seconds
  FROM room_sessions
  WHERE joined_at >= datetime(?, ?)
  GROUP BY DATE(joined_at) ORDER BY date DESC
`).all('now', `-${days} days`);
console.log('  Rows:', rows1.length);
rows1.slice(0, 3).forEach(r => console.log('   ', r));

// Test 2: datetime with single parameter (the way dashboard.js does it)
console.log('\nTest 2: datetime(?, ?) with modifier as second param');
const modifier = `-${days} days`;
console.log('  Modifier:', modifier);
const rows2 = db.prepare(`
  SELECT DATE(joined_at) as date, COUNT(DISTINCT room_id) as room_count
  FROM room_sessions
  WHERE joined_at >= datetime('now', ?)
  GROUP BY DATE(joined_at) ORDER BY date DESC
`).all(modifier);
console.log('  Rows:', rows2.length);

// Test 3: Check what the datetime evaluates to
console.log('\nTest 3: datetime evaluation');
const d1 = db.prepare("SELECT datetime('now', ?) as d").get(modifier);
console.log('  datetime result:', d1.d);

// Test 4: Hardcoded
console.log('\nTest 4: Hardcoded');
const rows4 = db.prepare(`
  SELECT DATE(joined_at) as date, COUNT(*) as cnt
  FROM room_sessions
  WHERE joined_at >= datetime('now', '-7 days')
  GROUP BY DATE(joined_at) ORDER BY date DESC
`).all();
console.log('  Rows:', rows4.length);
