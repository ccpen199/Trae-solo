import Database from 'better-sqlite3';
const db = new Database('./data/app.sqlite');

console.log('=== Testing parameter binding ===');
const days = 7;

// Test 1: Hardcoded
console.log('\n1. Hardcoded -7 days:');
const rows1 = db.prepare(`
  SELECT DATE(joined_at) as date, COUNT(*) as cnt
  FROM room_sessions
  WHERE joined_at >= datetime('now', '-7 days')
  GROUP BY DATE(joined_at)
`).all();
console.log('   Rows:', rows1.length);

// Test 2: Parameter with concatenation
console.log('\n2. Parameter with || operator:');
const rows2 = db.prepare(`
  SELECT DATE(joined_at) as date, COUNT(*) as cnt
  FROM room_sessions
  WHERE joined_at >= datetime('now', ? || ' days')
  GROUP BY DATE(joined_at)
`).all(`-${days} days`);
console.log('   Rows:', rows2.length);

// Test 3: Check what the parameter produces
console.log('\n3. Check datetime result:');
const t1 = db.prepare("SELECT datetime('now', '-7 days') as t").get().t;
console.log('   Hardcoded:', t1);
const t2 = db.prepare("SELECT datetime('now', ? || ' days') as t").get(`-${days} days`);
console.log('   Parameter:', t2);
const t3 = db.prepare("SELECT ? || ' days' as p").get(`-${days} days`);
console.log('   Param concat:', t3);

// Test 4: Direct date comparison
console.log('\n4. Direct date compare:');
const rows4 = db.prepare(`
  SELECT DATE(joined_at) as date, COUNT(*) as cnt
  FROM room_sessions
  WHERE joined_at >= ?
  GROUP BY DATE(joined_at)
`).all(t1);
console.log('   Rows:', rows4.length);
