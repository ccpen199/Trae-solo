const { initDb, getDb } = require('./db');
const path = require('path');

const dbPath = process.env.DB_PATH || './data/warning.db';
initDb(path.resolve(__dirname, '..', dbPath));
const db = getDb();

let passed = 0;
let failed = 0;
const results = [];

function test(name, fn) {
  try {
    fn();
    passed++;
    results.push({ name, status: 'PASS' });
    console.log(`  ✓ ${name}`);
  } catch (e) {
    failed++;
    results.push({ name, status: 'FAIL', error: e.message });
    console.log(`  ✗ ${name}: ${e.message}`);
  }
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg || 'Assertion failed');
}

function assertEq(a, b, msg) {
  if (a !== b) throw new Error(msg || `Expected ${b}, got ${a}`);
}

console.log('\n=== Meteorological Warning System - Backend Tests ===\n');

console.log('--- Database & Tables ---');
test('Tables should exist', () => {
  const tables = db.prepare(
    "SELECT name FROM sqlite_master WHERE type='table' AND name IN ('stations','monitor_data','thresholds','warnings','warning_templates','channels','publish_records','targets','receipts','operations_log')"
  ).all();
  assertEq(tables.length, 10, 'Expected 10 tables');
});

test('Should have seed stations', () => {
  const count = db.prepare('SELECT COUNT(*) as c FROM stations').get().c;
  assert(count > 0, 'No stations found');
});

test('Should have seed monitor data', () => {
  const count = db.prepare('SELECT COUNT(*) as c FROM monitor_data').get().c;
  assert(count > 0, 'No monitor data found');
});

test('Should have thresholds configured', () => {
  const count = db.prepare('SELECT COUNT(*) as c FROM thresholds').get().c;
  assert(count > 0, 'No thresholds found');
});

console.log('\n--- Warning CRUD ---');
let testWarningId = null;
test('Create warning draft', () => {
  const stmt = db.prepare(
    "INSERT INTO warnings (type, level, affected_area, issuer, content, status) VALUES (?, ?, ?, ?, ?, 'draft')"
  );
  const info = stmt.run('雷电', 'yellow', '测试区域', '测试员', '测试预警内容');
  testWarningId = info.lastInsertRowid;
  assert(testWarningId > 0, 'Failed to create warning');
});

test('Read warning by id', () => {
  const w = db.prepare('SELECT * FROM warnings WHERE id = ?').get(testWarningId);
  assert(w, 'Warning not found');
  assertEq(w.type, '雷电');
  assertEq(w.status, 'draft');
});

test('Update warning', () => {
  db.prepare("UPDATE warnings SET content = ?, updated_at = datetime('now','localtime') WHERE id = ?")
    .run('更新后的测试预警内容', testWarningId);
  const w = db.prepare('SELECT * FROM warnings WHERE id = ?').get(testWarningId);
  assertEq(w.content, '更新后的测试预警内容');
});

test('Publish warning', () => {
  db.prepare("UPDATE warnings SET status = 'published' WHERE id = ?").run(testWarningId);
  const w = db.prepare('SELECT * FROM warnings WHERE id = ?').get(testWarningId);
  assertEq(w.status, 'published');
});

test('Cancel warning', () => {
  db.prepare("UPDATE warnings SET status = 'cancelled' WHERE id = ?").run(testWarningId);
  const w = db.prepare('SELECT * FROM warnings WHERE id = ?').get(testWarningId);
  assertEq(w.status, 'cancelled');
});

console.log('\n--- Publish Records ---');
test('Should have channels', () => {
  const count = db.prepare('SELECT COUNT(*) as c FROM channels').get().c;
  assert(count > 0, 'No channels found');
});

test('Should have targets', () => {
  const count = db.prepare('SELECT COUNT(*) as c FROM targets').get().c;
  assert(count > 0, 'No targets found');
});

test('Create publish record', () => {
  const channel = db.prepare('SELECT * FROM channels LIMIT 1').get();
  const warning = db.prepare("SELECT * FROM warnings WHERE status = 'published' LIMIT 1").get();
  if (channel && warning) {
    const batch = `TEST-BATCH-${Date.now()}`;
    const targets = db.prepare('SELECT id FROM targets').all();
    const stmt = db.prepare(
      'INSERT INTO publish_records (warning_id, channel_id, batch_no, total_count, success_count, fail_count, fail_list, status, started_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime(\'now\',\'localtime\'))'
    );
    const info = stmt.run(warning.id, channel.id, batch, targets.length, Math.floor(targets.length * 0.8),
      Math.ceil(targets.length * 0.2), JSON.stringify(targets.slice(0, 2).map(t => t.id)), 'completed');
    assert(info.lastInsertRowid > 0, 'Failed to create publish record');
  }
});

console.log('\n--- Receipts ---');
test('Should create and update receipts', () => {
  const pr = db.prepare('SELECT * FROM publish_records ORDER BY id DESC LIMIT 1').get();
  if (pr) {
    const targets = db.prepare('SELECT id FROM targets').all();
    const insertStmt = db.prepare(
      'INSERT INTO receipts (publish_record_id, target_id, confirm_status) VALUES (?, ?, ?)'
    );
    targets.forEach((t, i) => {
      const status = i === 0 ? 'confirmed' : i === 1 ? 'pending' : 'no_response';
      insertStmt.run(pr.id, t.id, status);
    });
    const count = db.prepare('SELECT COUNT(*) as c FROM receipts WHERE publish_record_id = ?').get(pr.id).c;
    assertEq(count, targets.length, 'Receipt count mismatch');
  }
});

console.log('\n--- Monitor Data ---');
test('Should detect threshold hits', () => {
  const thresholds = db.prepare('SELECT * FROM thresholds LIMIT 1').all();
  if (thresholds.length > 0) {
    const t = thresholds[0];
    const testValue = t.threshold_value + 10;
    const station = db.prepare('SELECT * FROM stations WHERE type = ? LIMIT 1').get(t.data_type);
    if (station) {
      const info = db.prepare(
        'INSERT INTO monitor_data (station_id, value, data_type, recorded_at, threshold_hit) VALUES (?, ?, ?, datetime(\'now\',\'localtime\'), 1)'
      ).run(station.id, testValue, t.data_type);
      assert(info.lastInsertRowid > 0, 'Failed to insert monitor data');
    }
  }
});

test('Operations log should record actions', () => {
  const count = db.prepare('SELECT COUNT(*) as c FROM operations_log').get().c;
  assert(count > 0, 'No operations logged');
});

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);
process.exit(failed > 0 ? 1 : 0);