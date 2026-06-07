import { getDb, initDb } from './init.js';

export function migrateDb() {
  const db = getDb();

  try {
    db.exec(`
      ALTER TABLE obu_devices ADD COLUMN last_upgrade_status TEXT DEFAULT 'none' CHECK(last_upgrade_status IN ('none','pending','success','failed'));
    `);
    console.log('Added: last_upgrade_status');
  } catch (e) { console.log('Skip:', e.message); }

  try {
    db.exec(`ALTER TABLE obu_devices ADD COLUMN last_upgrade_result TEXT;`);
    console.log('Added: last_upgrade_result');
  } catch (e) { console.log('Skip:', e.message); }

  try {
    db.exec(`ALTER TABLE obu_devices ADD COLUMN last_upgrade_at DATETIME;`);
    console.log('Added: last_upgrade_at');
  } catch (e) { console.log('Skip:', e.message); }

  try {
    db.exec(`ALTER TABLE obu_devices ADD COLUMN batch_activate_progress TEXT DEFAULT '0%';`);
    console.log('Added: batch_activate_progress');
  } catch (e) { console.log('Skip:', e.message); }

  try {
    db.exec(`
      ALTER TABLE obu_devices ADD COLUMN apply_review_status TEXT DEFAULT 'approved' CHECK(apply_review_status IN ('pending','approved','rejected'));
    `);
    console.log('Added: apply_review_status');
  } catch (e) { console.log('Skip:', e.message); }

  try {
    db.exec(`ALTER TABLE obu_devices ADD COLUMN apply_reason TEXT;`);
    console.log('Added: apply_reason');
  } catch (e) { console.log('Skip:', e.message); }

  try {
    db.exec(`ALTER TABLE obu_devices ADD COLUMN apply_at DATETIME;`);
    console.log('Added: apply_at');
  } catch (e) { console.log('Skip:', e.message); }

  try {
    db.exec(`ALTER TABLE obu_devices ADD COLUMN reject_reason TEXT;`);
    console.log('Added: reject_reason');
  } catch (e) { console.log('Skip:', e.message); }

  try {
    db.exec(`ALTER TABLE toll_records ADD COLUMN evidence_urls TEXT;`);
    console.log('Added: evidence_urls to toll_records');
  } catch (e) { console.log('Skip:', e.message); }

  try {
    db.exec(`
      ALTER TABLE obu_devices ADD COLUMN activation_status TEXT DEFAULT 'inactive' CHECK(activation_status IN ('inactive','active','suspended','deactivated','faulty'));
    `);
    console.log('Updated: activation_status CHECK');
  } catch (e) { console.log('Skip:', e.message); }

  try {
    db.exec(`
      ALTER TABLE exception_events ADD COLUMN type TEXT NOT NULL CHECK(type IN ('deduction_failed','path_missing','duplicate_billing','abnormal_deduction','missing_exit'));
    `);
    console.log('Updated: exception_events type CHECK');
  } catch (e) { console.log('Skip:', e.message); }

  seedDataQuality();
  updateExistingDevices();

  console.log('✅ Database migration completed');
}

function seedDataQuality() {
  const db = getDb();
  const existing = db.prepare('SELECT COUNT(*) AS count FROM data_quality_metrics').get().count;
  if (existing > 0) return;

  const stmt = db.prepare(`
    INSERT INTO data_quality_metrics (metric_date, total_records, missing_records, latency_records, missing_rate, latency_rate, alert_count)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const total = 1000 + Math.floor(Math.random() * 500);
    const missing = Math.floor(total * (Math.random() * 6));
    const latency = Math.floor(total * (Math.random() * 6));
    const missingRate = (missing / total * 100).toFixed(2);
    const latencyRate = (latency / total * 100).toFixed(2);
    const alerts = (parseFloat(missingRate) > 2 ? 1 : 0) + (parseFloat(latencyRate) > 2 ? 1 : 0);

    stmt.run(dateStr, total, missing, latency, parseFloat(missingRate), parseFloat(latencyRate), alerts);
  }
  console.log('✅ Data quality metrics seeded (7 days)');
}

function updateExistingDevices() {
  const db = getDb();
  db.prepare(`
    UPDATE obu_devices SET apply_review_status = 'approved' WHERE apply_review_status IS NULL
  `).run();
  db.prepare(`
    UPDATE obu_devices SET last_upgrade_status = 'none' WHERE last_upgrade_status IS NULL
  `).run();
  db.prepare(`
    UPDATE obu_devices SET batch_activate_progress = '100%' WHERE activation_status = 'active' AND batch_activate_progress IS NULL
  `).run();
  console.log('✅ Existing devices updated');
}
