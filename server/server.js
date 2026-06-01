const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const fs = require('fs');

const app = express();
const PORT = Number(process.env.BACKEND_PORT) || 53438;
const FRONTEND_PORT = Number(process.env.FRONTEND_PORT) || 43438;
const HOST = '127.0.0.1';
const frontendUrl = `http://${HOST}:${FRONTEND_PORT}`;

app.use(cors({ origin: frontendUrl }));
app.use(express.json());

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
const db = new Database(path.join(dataDir, 'app.sqlite'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      farm_name TEXT,
      farm_address TEXT,
      vehicle_plate TEXT,
      animal_type TEXT,
      quantity INTEGER,
      ear_tags TEXT,
      quarantine_cert_no TEXT,
      arrival_time DATETIME,
      status TEXT DEFAULT 'pending',
      operator TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      is_deleted INTEGER DEFAULT 0,
      delete_reason TEXT,
      delete_reviewer TEXT,
      delete_time DATETIME
    );

    CREATE TABLE IF NOT EXISTS pre_slaughter_inspections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entry_id INTEGER REFERENCES entries(id),
      body_temp TEXT,
      appearance TEXT,
      doc_check TEXT,
      abnormal_desc TEXT,
      isolation INTEGER DEFAULT 0,
      disposal_result TEXT,
      inspector TEXT,
      inspect_time DATETIME,
      result TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS slaughter_batches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entry_id INTEGER REFERENCES entries(id),
      batch_no TEXT UNIQUE,
      slaughter_time DATETIME,
      inspect_result TEXT,
      harmless_treatment TEXT,
      harmless_treatment_details TEXT,
      meat_yield REAL,
      responsible_person TEXT,
      segmentation_details TEXT,
      blocking_reason TEXT,
      review_status TEXT DEFAULT 'pending',
      reviewer TEXT,
      review_time DATETIME,
      status TEXT DEFAULT 'processing',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS certificates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      batch_no TEXT REFERENCES slaughter_batches(batch_no),
      cert_no TEXT UNIQUE,
      animal_type TEXT,
      quantity INTEGER,
      origin_farm TEXT,
      slaughter_date DATETIME,
      issue_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      issuer TEXT,
      qr_code TEXT,
      status TEXT DEFAULT 'valid'
    );

    CREATE TABLE IF NOT EXISTS product_flows (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cert_no TEXT REFERENCES certificates(cert_no),
      buyer_name TEXT,
      buyer_contact TEXT,
      destination TEXT,
      product_type TEXT,
      weight REAL,
      flow_time DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS recalls (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cert_no TEXT,
      reason TEXT,
      scope TEXT,
      initiator TEXT,
      recall_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      status TEXT DEFAULT 'active'
    );
  `);
}

function seedData() {
  const count = db.prepare('SELECT COUNT(*) AS c FROM entries').get().c;
  if (count > 0) return;

  const now = Date.now();
  const entries = [
    { farm_name: '绿源生态养殖场', farm_address: '山东省临沂市兰山区', vehicle_plate: '鲁Q88231', animal_type: '猪', quantity: 50, ear_tags: 'E20250001,E20250002,E20250003', quarantine_cert_no: 'QJ20250001', arrival_time: new Date(now - 6 * 86400000).toISOString(), status: 'qualified', operator: '张建国', verification_status: 'verified', isolation_status: 'none' },
    { farm_name: '金牧农牧公司', farm_address: '河南省驻马店市驿城区', vehicle_plate: '豫QM3321', animal_type: '牛', quantity: 20, ear_tags: 'B20250010,B20250011', quarantine_cert_no: 'QJ20250002', arrival_time: new Date(now - 5 * 86400000).toISOString(), status: 'qualified', operator: '李明辉', verification_status: 'verified', isolation_status: 'none' },
    { farm_name: '丰泽养殖合作社', farm_address: '河北省保定市涞水县', vehicle_plate: '冀F66789', animal_type: '羊', quantity: 80, ear_tags: 'S20250020,S20250021,S20250022', quarantine_cert_no: 'QJ20250003', arrival_time: new Date(now - 4 * 86400000).toISOString(), status: 'disqualified', operator: '王志强', verification_status: 'failed', isolation_status: 'completed', isolation_details: '宰前检疫不合格，已执行销毁处置，同群动物排查完毕' },
    { farm_name: '华兴禽业公司', farm_address: '辽宁省沈阳市于洪区', vehicle_plate: '辽AK1234', animal_type: '禽', quantity: 500, ear_tags: 'P20250030', quarantine_cert_no: 'QJ20250004', arrival_time: new Date(now - 3 * 86400000).toISOString(), status: 'qualified', operator: '赵德伟', verification_status: 'verified', isolation_status: 'none' },
    { farm_name: '绿源生态养殖场', farm_address: '山东省临沂市兰山区', vehicle_plate: '鲁Q99123', animal_type: '猪', quantity: 35, ear_tags: 'E20250040,E20250041', quarantine_cert_no: 'QJ20250005', arrival_time: new Date(now - 2 * 86400000).toISOString(), status: 'inspecting', operator: '张建国', verification_status: 'pending', isolation_status: 'none' },
    { farm_name: '鑫旺牧业公司', farm_address: '四川省成都市温江区', vehicle_plate: '川A78901', animal_type: '猪', quantity: 60, ear_tags: 'E20250050,E20250051,E20250052', quarantine_cert_no: 'QJ20250006', arrival_time: new Date(now - 86400000).toISOString(), status: 'qualified', operator: '陈海涛', verification_status: 'verified', isolation_status: 'none' },
    { farm_name: '宏达养殖场', farm_address: '安徽省阜阳市太和县', vehicle_plate: '皖K55678', animal_type: '牛', quantity: 15, ear_tags: 'B20250060,B20250061', quarantine_cert_no: 'QJ20250007', arrival_time: new Date(now - 12 * 3600000).toISOString(), status: 'pending', operator: '刘东升', verification_status: 'pending', isolation_status: 'none' },
    { farm_name: '丰泽养殖合作社', farm_address: '河北省保定市涞水县', vehicle_plate: '冀F77890', animal_type: '猪', quantity: 45, ear_tags: 'E20250070', quarantine_cert_no: 'QJ20250008', arrival_time: new Date(now - 3600000).toISOString(), status: 'pending', operator: '王志强', verification_status: 'pending', isolation_status: 'none' }
  ];

  const insertEntry = db.prepare(`
    INSERT INTO entries (farm_name, farm_address, vehicle_plate, animal_type, quantity, ear_tags, quarantine_cert_no, arrival_time, status, operator, verification_status, isolation_status, isolation_details, blocking_explanation, audit_log)
    VALUES (@farm_name, @farm_address, @vehicle_plate, @animal_type, @quantity, @ear_tags, @quarantine_cert_no, @arrival_time, @status, @operator, @verification_status, @isolation_status, @isolation_details, @blocking_explanation, @audit_log)
  `);

  const insertInspection = db.prepare(`
    INSERT INTO pre_slaughter_inspections (entry_id, body_temp, appearance, doc_check, abnormal_desc, isolation, disposal_result, inspector, inspect_time, result, judge_basis, disposal_closure, disposal_person, disposal_time, follow_up_status)
    VALUES (@entry_id, @body_temp, @appearance, @doc_check, @abnormal_desc, @isolation, @disposal_result, @inspector, @inspect_time, @result, @judge_basis, @disposal_closure, @disposal_person, @disposal_time, @follow_up_status)
  `);

  const insertBatch = db.prepare(`
      INSERT INTO slaughter_batches (entry_id, batch_no, slaughter_time, inspect_result, harmless_treatment, harmless_treatment_details, meat_yield, responsible_person, segmentation_details, blocking_reason, review_status, reviewer, review_time, review_confirmation, status)
      VALUES (@entry_id, @batch_no, @slaughter_time, @inspect_result, @harmless_treatment, @harmless_treatment_details, @meat_yield, @responsible_person, @segmentation_details, @blocking_reason, @review_status, @reviewer, @review_time, @review_confirmation, @status)
    `);

  const insertCert = db.prepare(`
    INSERT INTO certificates (batch_no, cert_no, animal_type, quantity, origin_farm, slaughter_date, issue_date, issuer, qr_code, status)
    VALUES (@batch_no, @cert_no, @animal_type, @quantity, @origin_farm, @slaughter_date, @issue_date, @issuer, @qr_code, @status)
  `);

  const insertFlow = db.prepare(`
    INSERT INTO product_flows (cert_no, buyer_name, buyer_contact, destination, product_type, weight, flow_time)
    VALUES (@cert_no, @buyer_name, @buyer_contact, @destination, @product_type, @weight, @flow_time)
  `);

  const seed = db.transaction(() => {
    const entryIds = [];
    for (const e of entries) {
      if (!e.blocking_explanation) e.blocking_explanation = null;
      if (!e.isolation_details) e.isolation_details = null;
      if (!e.audit_log) e.audit_log = null;
      const r = insertEntry.run(e);
      entryIds.push(r.lastInsertRowid);
    }

    db.prepare('UPDATE entries SET blocking_explanation = ?, audit_log = ? WHERE id = ?').run(
      '宰前检疫不合格：外观异常，证照不通过，销毁，体温偏高(>40.2)。处置方式：destroy，异常描述：部分羊只体温偏高，精神萎靡。已阻断进入屠宰流程。',
      JSON.stringify([
        { action: '入场登记', time: new Date(now - 4 * 86400000).toISOString(), operator: '王志强', detail: '新增入场记录', type: 'create' },
        { action: '宰前检疫不合格', time: new Date(now - 3.5 * 86400000).toISOString(), operator: '孙卫东', detail: '外观异常，证照不通过，销毁，体温偏高(>40.2)', type: 'block' },
        { action: '处置闭环完成', time: new Date(now - 3 * 86400000).toISOString(), operator: '刘东升', detail: '已按规范完成销毁处置，同群动物排查完毕', type: 'disposal' }
      ]),
      entryIds[2]
    );

    insertInspection.run({ entry_id: entryIds[0], body_temp: '38.5', appearance: 'normal', doc_check: 'pass', abnormal_desc: '', isolation: 0, disposal_result: 'pass', inspector: '孙卫东', inspect_time: new Date(now - 5.5 * 86400000).toISOString(), result: 'qualified', judge_basis: '外观正常，证照通过，处置通过', disposal_closure: null, disposal_person: null, disposal_time: null, follow_up_status: 'completed' });
    insertInspection.run({ entry_id: entryIds[1], body_temp: '38.8', appearance: 'normal', doc_check: 'pass', abnormal_desc: '', isolation: 0, disposal_result: 'pass', inspector: '孙卫东', inspect_time: new Date(now - 4.5 * 86400000).toISOString(), result: 'qualified', judge_basis: '外观正常，证照通过，处置通过', disposal_closure: null, disposal_person: null, disposal_time: null, follow_up_status: 'completed' });
    insertInspection.run({ entry_id: entryIds[2], body_temp: '40.2', appearance: 'abnormal', doc_check: 'fail', abnormal_desc: '部分羊只体温偏高，精神萎靡', isolation: 1, disposal_result: 'destroy', inspector: '孙卫东', inspect_time: new Date(now - 3.5 * 86400000).toISOString(), result: 'disqualified', judge_basis: '外观异常，证照不通过，销毁，体温偏高(>40.2)', disposal_closure: '已按规范完成销毁处置，现场监督人员确认，同群动物已完成排查和隔离观察，处置效果良好', disposal_person: '刘东升', disposal_time: new Date(now - 3 * 86400000).toISOString(), follow_up_status: 'completed' });
    insertInspection.run({ entry_id: entryIds[3], body_temp: '41.0', appearance: 'normal', doc_check: 'pass', abnormal_desc: '', isolation: 0, disposal_result: 'pass', inspector: '马晓峰', inspect_time: new Date(now - 2.5 * 86400000).toISOString(), result: 'qualified', judge_basis: '外观正常，证照通过，处置通过，体温偏高(>41.0)', disposal_closure: null, disposal_person: null, disposal_time: null, follow_up_status: 'completed' });
    insertInspection.run({ entry_id: entryIds[5], body_temp: '38.6', appearance: 'normal', doc_check: 'pass', abnormal_desc: '', isolation: 0, disposal_result: 'pass', inspector: '马晓峰', inspect_time: new Date(now - 0.5 * 86400000).toISOString(), result: 'qualified', judge_basis: '外观正常，证照通过，处置通过', disposal_closure: null, disposal_person: null, disposal_time: null, follow_up_status: 'completed' });

    const batch1No = 'PC' + (now - 5 * 86400000) + '2847';
    const batch2No = 'PC' + (now - 4 * 86400000) + '5913';
    const batch3No = 'PC' + (now - 2 * 86400000) + '7362';
    const batch4No = 'PC' + (now - 86400000) + '4019';

    insertBatch.run({ entry_id: entryIds[0], batch_no: batch1No, slaughter_time: new Date(now - 5 * 86400000).toISOString(), inspect_result: 'qualified', harmless_treatment: '', harmless_treatment_details: null, meat_yield: 3750, responsible_person: '周伟', segmentation_details: JSON.stringify(['二分体', '里脊肉', '五花肉', '排骨']), blocking_reason: null, review_status: 'reviewed', reviewer: '马晓峰', review_time: new Date(now - 4.8 * 86400000).toISOString(), review_confirmation: 0, status: 'qualified' });
    insertBatch.run({ entry_id: entryIds[1], batch_no: batch2No, slaughter_time: new Date(now - 4 * 86400000).toISOString(), inspect_result: 'qualified', harmless_treatment: '', harmless_treatment_details: null, meat_yield: 4800, responsible_person: '周伟', segmentation_details: JSON.stringify(['四分体', '带皮前腿', '带皮后腿', '内脏']), blocking_reason: null, review_status: 'reviewed', reviewer: '马晓峰', review_time: new Date(now - 3.8 * 86400000).toISOString(), review_confirmation: 0, status: 'qualified' });
    insertBatch.run({ entry_id: entryIds[3], batch_no: batch3No, slaughter_time: new Date(now - 2 * 86400000).toISOString(), inspect_result: 'disqualified', harmless_treatment: '焚烧', harmless_treatment_details: '发现疑似禽流感，已按规范进行无害化焚烧处理。处理地点：专用焚烧间，处理温度：850℃以上，处理时间：2小时，监督人员：孙卫东，处理设备参数：符合GB16548标准', meat_yield: 0, responsible_person: '周伟', segmentation_details: null, blocking_reason: '禽类疑似禽流感，整批屠宰检验不合格，已阻断出证和流向环节，全部执行无害化焚烧处理', review_status: 'reviewed', reviewer: '马晓峰', review_time: new Date(now - 2 * 86400000).toISOString(), review_confirmation: 1, status: 'disqualified' });
    insertBatch.run({ entry_id: entryIds[5], batch_no: batch4No, slaughter_time: new Date(now - 86400000).toISOString(), inspect_result: 'qualified', harmless_treatment: '', harmless_treatment_details: null, meat_yield: 4500, responsible_person: '周伟', segmentation_details: JSON.stringify(['二分体', '五花肉', '排骨', '内脏']), blocking_reason: null, review_status: 'reviewed', reviewer: '马晓峰', review_time: new Date(now - 0.8 * 86400000).toISOString(), review_confirmation: 0, status: 'qualified' });

    const cert1No = 'QJ' + (now - 4.8 * 86400000);
    const cert2No = 'QJ' + (now - 3.8 * 86400000);
    const cert4No = 'QJ' + (now - 0.8 * 86400000);

    insertCert.run({ batch_no: batch1No, cert_no: cert1No, animal_type: '猪', quantity: 50, origin_farm: '绿源生态养殖场', slaughter_date: new Date(now - 5 * 86400000).toISOString(), issue_date: new Date(now - 4.8 * 86400000).toISOString(), issuer: '孙卫东', qr_code: `${frontendUrl}/trace/${cert1No}`, status: 'valid' });
    insertCert.run({ batch_no: batch2No, cert_no: cert2No, animal_type: '牛', quantity: 20, origin_farm: '金牧农牧公司', slaughter_date: new Date(now - 4 * 86400000).toISOString(), issue_date: new Date(now - 3.8 * 86400000).toISOString(), issuer: '孙卫东', qr_code: `${frontendUrl}/trace/${cert2No}`, status: 'valid' });
    insertCert.run({ batch_no: batch4No, cert_no: cert4No, animal_type: '猪', quantity: 60, origin_farm: '鑫旺牧业公司', slaughter_date: new Date(now - 86400000).toISOString(), issue_date: new Date(now - 0.8 * 86400000).toISOString(), issuer: '马晓峰', qr_code: `${frontendUrl}/trace/${cert4No}`, status: 'valid' });

    insertFlow.run({ cert_no: cert1No, buyer_name: '鑫源肉联厂', buyer_contact: '13800001111', destination: '济南市历城区批发市场', product_type: '白条猪', weight: 3500, flow_time: new Date(now - 4 * 86400000).toISOString() });
    insertFlow.run({ cert_no: cert2No, buyer_name: '绿洲食品公司', buyer_contact: '13900002222', destination: '郑州市惠济区农贸市场', product_type: '牛肉', weight: 4200, flow_time: new Date(now - 3 * 86400000).toISOString() });
    insertFlow.run({ cert_no: cert4No, buyer_name: '川味食品批发', buyer_contact: '13700003333', destination: '成都市武侯区冷链市场', product_type: '白条猪', weight: 4100, flow_time: new Date(now - 0.5 * 86400000).toISOString() });
  });

  seed();
}

initTables();

function migrateTables() {
  const addCol = (table, col, definition) => {
    try {
      db.exec(`ALTER TABLE ${table} ADD COLUMN ${col} ${definition}`);
    } catch (e) {
      if (!e.message.includes('duplicate column name')) throw e;
    }
  };
  addCol('entries', 'is_deleted', 'INTEGER DEFAULT 0');
  addCol('entries', 'delete_reason', 'TEXT');
  addCol('entries', 'delete_reviewer', 'TEXT');
  addCol('entries', 'delete_time', 'DATETIME');
  addCol('entries', 'cert_attachment', 'TEXT');
  addCol('entries', 'verification_status', 'TEXT DEFAULT \'pending\'');
  addCol('entries', 'isolation_status', 'TEXT DEFAULT \'none\'');
  addCol('entries', 'isolation_details', 'TEXT');
  addCol('entries', 'blocking_explanation', 'TEXT');
  addCol('entries', 'audit_log', 'TEXT');

  addCol('pre_slaughter_inspections', 'judge_basis', 'TEXT');
  addCol('pre_slaughter_inspections', 'disposal_closure', 'TEXT');
  addCol('pre_slaughter_inspections', 'disposal_person', 'TEXT');
  addCol('pre_slaughter_inspections', 'disposal_time', 'DATETIME');
  addCol('pre_slaughter_inspections', 'follow_up_status', 'TEXT DEFAULT \'pending\'');

  addCol('slaughter_batches', 'harmless_treatment_details', 'TEXT');
  addCol('slaughter_batches', 'segmentation_details', 'TEXT');
  addCol('slaughter_batches', 'blocking_reason', 'TEXT');
  addCol('slaughter_batches', 'review_status', 'TEXT DEFAULT \'pending\'');
  addCol('slaughter_batches', 'reviewer', 'TEXT');
  addCol('slaughter_batches', 'review_time', 'DATETIME');
  addCol('slaughter_batches', 'review_confirmation', 'INTEGER DEFAULT 0');

  addCol('recalls', 'scope_details', 'TEXT');
  addCol('recalls', 'affected_flows', 'INTEGER DEFAULT 0');
  addCol('recalls', 'affected_quantity', 'REAL DEFAULT 0');
  addCol('recalls', 'completion_status', 'TEXT DEFAULT \'in_progress\'');
  addCol('recalls', 'completed_time', 'DATETIME');
}
migrateTables();

seedData();

app.get('/api/health', (req, res) => {
  res.json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() } });
});

const stmt_entry_list = db.prepare(`
  SELECT * FROM entries WHERE is_deleted = 0
  AND (@status IS NULL OR status = @status)
  AND (@animal_type IS NULL OR animal_type = @animal_type)
  AND (@date_from IS NULL OR arrival_time >= @date_from)
  AND (@date_to IS NULL OR arrival_time <= @date_to)
  ORDER BY created_at DESC
`);
app.get('/api/entries', (req, res) => {
  try {
    const { status, animal_type, date_from, date_to } = req.query;
    const rows = stmt_entry_list.all({ status: status || null, animal_type: animal_type || null, date_from: date_from || null, date_to: date_to || null });
    for (const r of rows) parseEntryFields(r);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

const stmt_entry_get = db.prepare('SELECT * FROM entries WHERE id = ?');

function parseEntryFields(row) {
  if (!row) return row;
  if (row.audit_log) { try { row.audit_log = JSON.parse(row.audit_log); } catch(e) {} }
  return row;
}

app.get('/api/entries/:id', (req, res) => {
  try {
    let row = stmt_entry_get.get(req.params.id);
    if (!row) return res.status(404).json({ success: false, message: '入场记录不存在' });
    row = parseEntryFields(row);
    res.json({ success: true, data: row });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/entries/:id/detail', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    let entry = stmt_entry_get.get(id);
    if (!entry) return res.status(404).json({ success: false, message: '入场记录不存在' });
    entry = parseEntryFields(entry);

    const inspections = db.prepare(`
      SELECT * FROM pre_slaughter_inspections WHERE entry_id = ? ORDER BY created_at DESC
    `).all(id);
    for (const insp of inspections) {
      if (insp.disposal_closure) { try { insp.disposal_closure = JSON.parse(insp.disposal_closure); } catch(e) {} }
    }

    const batches = db.prepare(`
      SELECT * FROM slaughter_batches WHERE entry_id = ? ORDER BY created_at DESC
    `).all(id);
    for (const b of batches) {
      if (b.segmentation_details) { try { b.segmentation_details = JSON.parse(b.segmentation_details); } catch(e) {} }
    }

    const batchNos = batches.map((b) => b.batch_no);
    let certs = [];
    let flows = [];
    if (batchNos.length > 0) {
      const placeholders = batchNos.map(() => '?').join(',');
      certs = db.prepare(`SELECT * FROM certificates WHERE batch_no IN (${placeholders}) ORDER BY issue_date DESC`).all(...batchNos);
      const certNos = certs.map((c) => c.cert_no);
      if (certNos.length > 0) {
        const ph2 = certNos.map(() => '?').join(',');
        flows = db.prepare(`SELECT * FROM product_flows WHERE cert_no IN (${ph2}) ORDER BY flow_time DESC`).all(...certNos);
      }
    }

    const recalls = db.prepare(`
      SELECT r.* FROM recalls r
      JOIN certificates c ON r.cert_no = c.cert_no
      JOIN slaughter_batches b ON c.batch_no = b.batch_no
      WHERE b.entry_id = ?
      ORDER BY r.recall_time DESC
    `).all(id);
    for (const r of recalls) {
      if (r.scope_details) { try { r.scope_details = JSON.parse(r.scope_details); } catch(e) {} }
    }

    res.json({
      success: true,
      data: { entry, inspections, batches, certificates: certs, flows, recalls }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

const stmt_entry_insert = db.prepare(`
  INSERT INTO entries (farm_name, farm_address, vehicle_plate, animal_type, quantity, ear_tags, quarantine_cert_no, arrival_time, status, operator, cert_attachment, verification_status, isolation_status, isolation_details, blocking_explanation, audit_log)
  VALUES (@farm_name, @farm_address, @vehicle_plate, @animal_type, @quantity, @ear_tags, @quarantine_cert_no, @arrival_time, @status, @operator, @cert_attachment, @verification_status, @isolation_status, @isolation_details, @blocking_explanation, @audit_log)
`);
app.post('/api/entries', (req, res) => {
  try {
    const body = req.body;
    body.status = body.status || 'pending';
    body.verification_status = body.verification_status || 'pending';
    body.isolation_status = body.isolation_status || 'none';
    body.cert_attachment = body.cert_attachment || null;
    body.isolation_details = body.isolation_details || null;
    body.blocking_explanation = body.blocking_explanation || null;
    body.audit_log = body.audit_log ? JSON.stringify(body.audit_log) : null;
    const r = stmt_entry_insert.run(body);
    res.status(201).json({ success: true, data: { id: r.lastInsertRowid } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put('/api/entries/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const body = req.body;
    const fields = [];
    const params = { id };
    const allowed = ['farm_name', 'farm_address', 'vehicle_plate', 'animal_type', 'quantity', 'ear_tags', 'quarantine_cert_no', 'arrival_time', 'status', 'operator', 'cert_attachment', 'verification_status', 'isolation_status', 'isolation_details', 'blocking_explanation'];
    for (const f of allowed) {
      if (body[f] !== undefined) {
        fields.push(`${f}=@${f}`);
        params[f] = body[f];
      }
    }
    if (body.audit_log !== undefined) {
      fields.push('audit_log=@audit_log');
      params.audit_log = JSON.stringify(body.audit_log);
    }
    if (fields.length === 0) return res.status(400).json({ success: false, message: '没有要更新的字段' });
    fields.push('updated_at=CURRENT_TIMESTAMP');
    const sql = `UPDATE entries SET ${fields.join(', ')} WHERE id=@id AND is_deleted=0`;
    const stmt = db.prepare(sql);
    const r = stmt.run(params);
    if (r.changes === 0) return res.status(404).json({ success: false, message: '入场记录不存在或已作废' });
    res.json({ success: true, data: { id } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

const stmt_entry_soft_delete = db.prepare(`
  UPDATE entries SET is_deleted = 1, delete_reason = @delete_reason, delete_reviewer = @delete_reviewer, 
    delete_time = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP, status = 'disqualified'
  WHERE id = @id AND is_deleted = 0
`);

const stmt_entry_impact_inspections = db.prepare('SELECT COUNT(*) AS c FROM pre_slaughter_inspections WHERE entry_id = ?');
const stmt_entry_impact_batches = db.prepare('SELECT COUNT(*) AS c FROM slaughter_batches WHERE entry_id = ?');
const stmt_entry_impact_certs = db.prepare(`
  SELECT COUNT(*) AS c FROM certificates c 
  JOIN slaughter_batches b ON c.batch_no = b.batch_no 
  WHERE b.entry_id = ?
`);
const stmt_entry_impact_flows = db.prepare(`
  SELECT COUNT(*) AS c FROM product_flows pf 
  JOIN certificates c ON pf.cert_no = c.cert_no
  JOIN slaughter_batches b ON c.batch_no = b.batch_no 
  WHERE b.entry_id = ?
`);
const stmt_entry_impact_recalls = db.prepare(`
  SELECT COUNT(*) AS c FROM recalls r
  JOIN certificates c ON r.cert_no = c.cert_no
  JOIN slaughter_batches b ON c.batch_no = b.batch_no 
  WHERE b.entry_id = ?
`);

app.get('/api/entries/:id/impact', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const entry = stmt_entry_get.get(id);
    if (!entry) return res.status(404).json({ success: false, message: '入场记录不存在' });
    
    const inspections = stmt_entry_impact_inspections.get(id).c;
    const batches = stmt_entry_impact_batches.get(id).c;
    const certs = stmt_entry_impact_certs.get(id).c;
    const flows = stmt_entry_impact_flows.get(id).c;
    const recalls = stmt_entry_impact_recalls.get(id).c;
    
    res.json({
      success: true,
      data: {
        has_inspections: inspections > 0,
        has_batches: batches > 0,
        has_certificates: certs > 0,
        has_flows: flows > 0,
        has_recalls: recalls > 0,
        total_impacted: inspections + batches + certs + flows + recalls,
        details: { inspections, batches, certs, flows, recalls }
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/entries/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { delete_reason, delete_reviewer } = req.body || {};
    
    if (!delete_reason) return res.status(400).json({ success: false, message: '请填写作废原因' });
    if (!delete_reviewer) return res.status(400).json({ success: false, message: '请填写复核人' });
    
    const r = stmt_entry_soft_delete.run({ id, delete_reason, delete_reviewer });
    if (r.changes === 0) return res.status(404).json({ success: false, message: '入场记录不存在或已作废' });

    const entry = stmt_entry_get.get(id);
    if (entry) {
      const audit = entry.audit_log ? JSON.parse(entry.audit_log) : [];
      audit.push({ action: '记录作废', time: new Date().toISOString(), operator: delete_reviewer, detail: delete_reason, type: 'void' });
      db.prepare('UPDATE entries SET audit_log = ? WHERE id = ?').run(JSON.stringify(audit), id);
    }

    res.json({ success: true, data: { id } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put('/api/entries/:id/verify', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { verification_status, cert_attachment, operator } = req.body;
    
    if (!verification_status) return res.status(400).json({ success: false, message: '请提供核验结论' });
    
    const entry = stmt_entry_get.get(id);
    if (!entry) return res.status(404).json({ success: false, message: '入场记录不存在' });
    
    const fields = ['verification_status = @verification_status', 'updated_at = CURRENT_TIMESTAMP'];
    const params = { id, verification_status };
    
    if (cert_attachment) { fields.push('cert_attachment = @cert_attachment'); params.cert_attachment = cert_attachment; }
    
    if (verification_status === 'failed') {
      fields.push('blocking_explanation = @blocking_explanation');
      params.blocking_explanation = `证照核验不通过：检疫证明信息与实际不符或证明无效，已阻断进入宰前检疫环节。`;
      fields.push('status = @status');
      params.status = 'disqualified';
    }
    
    const sql = `UPDATE entries SET ${fields.join(', ')} WHERE id = @id AND is_deleted = 0`;
    const r = db.prepare(sql).run(params);
    if (r.changes === 0) return res.status(404).json({ success: false, message: '入场记录不存在或已作废' });
    
    const audit = entry.audit_log ? JSON.parse(entry.audit_log) : [];
    audit.push({
      action: verification_status === 'verified' ? '证照核验通过' : '证照核验不通过',
      time: new Date().toISOString(),
      operator: operator || '系统',
      detail: verification_status === 'verified' ? '检疫证明信息核验一致' : '检疫证明信息与实际不符或证明无效',
      type: verification_status === 'verified' ? 'verify' : 'block'
    });
    db.prepare('UPDATE entries SET audit_log = ? WHERE id = ?').run(JSON.stringify(audit), id);
    
    res.json({ success: true, data: { id, verification_status } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

const stmt_inspection_list = db.prepare(`
  SELECT psi.*, e.farm_name, e.animal_type, e.quantity AS entry_quantity, e.ear_tags, e.status AS entry_status
  FROM pre_slaughter_inspections psi
  LEFT JOIN entries e ON psi.entry_id = e.id
  ORDER BY psi.created_at DESC
`);

function parseInspectionFields(row) {
  if (!row) return row;
  if (row.disposal_closure) { try { row.disposal_closure = JSON.parse(row.disposal_closure); } catch(e) {} }
  return row;
}

app.get('/api/inspections', (req, res) => {
  try {
    const rows = stmt_inspection_list.all();
    for (const r of rows) parseInspectionFields(r);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

const stmt_inspection_get = db.prepare(`
  SELECT psi.*, e.farm_name, e.animal_type, e.quantity AS entry_quantity, e.ear_tags, e.status AS entry_status
  FROM pre_slaughter_inspections psi
  LEFT JOIN entries e ON psi.entry_id = e.id
  WHERE psi.id = ?
`);
app.get('/api/inspections/:id', (req, res) => {
  try {
    let row = stmt_inspection_get.get(req.params.id);
    if (!row) return res.status(404).json({ success: false, message: '检疫记录不存在' });
    row = parseInspectionFields(row);
    res.json({ success: true, data: row });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

const stmt_inspection_insert = db.prepare(`
  INSERT INTO pre_slaughter_inspections (entry_id, body_temp, appearance, doc_check, abnormal_desc, isolation, disposal_result, inspector, inspect_time, result, judge_basis, disposal_closure, disposal_person, disposal_time, follow_up_status)
  VALUES (@entry_id, @body_temp, @appearance, @doc_check, @abnormal_desc, @isolation, @disposal_result, @inspector, @inspect_time, @result, @judge_basis, @disposal_closure, @disposal_person, @disposal_time, @follow_up_status)
`);
const stmt_entry_set_status = db.prepare('UPDATE entries SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
app.post('/api/inspections', (req, res) => {
  try {
    const body = req.body;
    const entry = stmt_entry_get.get(body.entry_id);
    if (!entry) return res.status(404).json({ success: false, message: '关联入场记录不存在' });
    if (entry.is_deleted === 1) return res.status(400).json({ success: false, message: '该入场记录已作废，无法进行检疫' });

    const isQualified = body.appearance === 'normal' && body.doc_check === 'pass' && body.disposal_result === 'pass';
    const expectedResult = isQualified ? 'qualified' : 'disqualified';

    if (body.appearance === 'abnormal' || body.doc_check === 'fail') {
      if (!body.abnormal_desc) return res.status(400).json({ success: false, message: '外观异常或证照不通过时必须填写异常描述' });
    }
    if (body.disposal_result === 'destroy' || body.disposal_result === 'isolate' || body.disposal_result === 'return') {
      if (body.isolation !== 1) return res.status(400).json({ success: false, message: '处置结果为隔离、退回或销毁时必须标记隔离' });
    }

    body.result = expectedResult;

    const basis = [];
    if (body.appearance === 'normal') basis.push('外观正常');
    if (body.appearance === 'abnormal') basis.push('外观异常');
    if (body.doc_check === 'pass') basis.push('证照通过');
    if (body.doc_check === 'fail') basis.push('证照不通过');
    if (body.disposal_result === 'pass') basis.push('处置通过');
    if (body.disposal_result === 'isolate') basis.push('隔离观察');
    if (body.disposal_result === 'return') basis.push('退回');
    if (body.disposal_result === 'destroy') basis.push('销毁');
    if (body.body_temp && parseFloat(body.body_temp) > 39.5) basis.push('体温偏高(>' + body.body_temp + ')');
    body.judge_basis = basis.join('，');

    body.disposal_closure = body.disposal_closure ? JSON.stringify(body.disposal_closure) : null;
    body.disposal_person = body.disposal_person || null;
    body.disposal_time = body.disposal_time || null;
    body.follow_up_status = body.follow_up_status || 'pending';

    const insertAndSync = db.transaction(() => {
      const r = stmt_inspection_insert.run(body);
      const newStatus = body.result === 'disqualified' ? 'disqualified' : 'qualified';
      stmt_entry_set_status.run(newStatus, body.entry_id);

      if (body.result === 'disqualified') {
        const blockingExpl = `宰前检疫不合格：${body.judge_basis}。处置方式：${body.disposal_result}，异常描述：${body.abnormal_desc || '无'}。已阻断进入屠宰流程。`;
        db.prepare('UPDATE entries SET blocking_explanation = ?, isolation_status = ? WHERE id = ?').run(
          blockingExpl,
          body.disposal_result === 'isolate' ? 'completed' : 'none',
          body.entry_id
        );

        if (entry.audit_log) {
          try {
            const existing = JSON.parse(entry.audit_log);
            existing.push({ action: '宰前检疫不合格', time: new Date().toISOString(), operator: body.inspector, detail: body.judge_basis });
            db.prepare('UPDATE entries SET audit_log = ? WHERE id = ?').run(JSON.stringify(existing), body.entry_id);
          } catch(e) {}
        } else {
          const audit = [{ action: '宰前检疫不合格', time: new Date().toISOString(), operator: body.inspector, detail: body.judge_basis }];
          db.prepare('UPDATE entries SET audit_log = ? WHERE id = ?').run(JSON.stringify(audit), body.entry_id);
        }
      }

      return r;
    });
    const r = insertAndSync();
    res.status(201).json({ success: true, data: { id: r.lastInsertRowid, result: expectedResult, judge_basis: body.judge_basis } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

const stmt_inspection_update = db.prepare(`
  UPDATE pre_slaughter_inspections SET body_temp=COALESCE(@body_temp, body_temp), appearance=COALESCE(@appearance, appearance),
    doc_check=COALESCE(@doc_check, doc_check), abnormal_desc=COALESCE(@abnormal_desc, abnormal_desc),
    isolation=COALESCE(@isolation, isolation), disposal_result=COALESCE(@disposal_result, disposal_result),
    inspector=COALESCE(@inspector, inspector), inspect_time=COALESCE(@inspect_time, inspect_time),
    result=COALESCE(@result, result), judge_basis=COALESCE(@judge_basis, judge_basis),
    disposal_closure=COALESCE(@disposal_closure, disposal_closure),
    disposal_person=COALESCE(@disposal_person, disposal_person),
    disposal_time=COALESCE(@disposal_time, disposal_time),
    follow_up_status=COALESCE(@follow_up_status, follow_up_status)
  WHERE id=@id
`);
app.put('/api/inspections/:id', (req, res) => {
  try {
    const body = { ...req.body, id: parseInt(req.params.id) };
    if (body.disposal_closure && typeof body.disposal_closure === 'object') {
      body.disposal_closure = JSON.stringify(body.disposal_closure);
    }
    const r = stmt_inspection_update.run(body);
    if (r.changes === 0) return res.status(404).json({ success: false, message: '检疫记录不存在' });

    if (body.result && body.entry_id) {
      const newStatus = body.result === 'disqualified' ? 'disqualified' : 'qualified';
      stmt_entry_set_status.run(newStatus, body.entry_id);
    }

    res.json({ success: true, data: { id: body.id } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put('/api/inspections/:id/follow-up', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { follow_up_status, disposal_closure, disposal_person, disposal_time } = req.body;
    
    if (!follow_up_status) return res.status(400).json({ success: false, message: '请提供后续复查状态' });
    
    const inspection = db.prepare('SELECT * FROM pre_slaughter_inspections WHERE id = ?').get(id);
    if (!inspection) return res.status(404).json({ success: false, message: '检疫记录不存在' });

    const fields = ['follow_up_status = @follow_up_status'];
    const params = { id, follow_up_status };
    
    if (disposal_closure) { fields.push('disposal_closure = @disposal_closure'); params.disposal_closure = disposal_closure; }
    if (disposal_person) { fields.push('disposal_person = @disposal_person'); params.disposal_person = disposal_person; }
    if (disposal_time) { fields.push('disposal_time = @disposal_time'); params.disposal_time = disposal_time; }

    fields.push('follow_up_status = @follow_up_status');
    
    const sql = `UPDATE pre_slaughter_inspections SET ${fields.join(', ')} WHERE id = @id`;
    db.prepare(sql).run(params);

    if (follow_up_status === 'completed' && inspection.result === 'disqualified') {
      const entry = stmt_entry_get.get(inspection.entry_id);
      if (entry) {
        const audit = entry.audit_log ? JSON.parse(entry.audit_log) : [];
        audit.push({ action: '处置闭环完成', time: new Date().toISOString(), operator: disposal_person || inspection.inspector, detail: disposal_closure || '后续复查已完成', type: 'disposal' });
        db.prepare('UPDATE entries SET audit_log = ?, isolation_status = ? WHERE id = ?').run(
          JSON.stringify(audit),
          'completed',
          inspection.entry_id
        );
      }
    }

    res.json({ success: true, data: { id, follow_up_status } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

const stmt_slaughter_list = db.prepare(`
  SELECT sb.*, e.farm_name, e.animal_type, e.quantity AS entry_quantity, e.ear_tags
  FROM slaughter_batches sb
  LEFT JOIN entries e ON sb.entry_id = e.id
  ORDER BY sb.created_at DESC
`);
app.get('/api/slaughter', (req, res) => {
  try {
    const rows = stmt_slaughter_list.all();
    for (const r of rows) {
      if (r.segmentation_details) { try { r.segmentation_details = JSON.parse(r.segmentation_details); } catch(e) {} }
    }
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

const stmt_slaughter_get = db.prepare(`
  SELECT sb.*, e.farm_name, e.animal_type, e.quantity AS entry_quantity, e.ear_tags
  FROM slaughter_batches sb
  LEFT JOIN entries e ON sb.entry_id = e.id
  WHERE sb.id = ?
`);
app.get('/api/slaughter/:id', (req, res) => {
  try {
    const row = stmt_slaughter_get.get(req.params.id);
    if (!row) return res.status(404).json({ success: false, message: '屠宰批次不存在' });
    if (row.segmentation_details) { try { row.segmentation_details = JSON.parse(row.segmentation_details); } catch(e) {} }
    res.json({ success: true, data: row });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

const stmt_slaughter_insert = db.prepare(`
  INSERT INTO slaughter_batches (entry_id, batch_no, slaughter_time, inspect_result, harmless_treatment, harmless_treatment_details, meat_yield, responsible_person, segmentation_details, blocking_reason, review_status, reviewer, review_time, review_confirmation, status)
  VALUES (@entry_id, @batch_no, @slaughter_time, @inspect_result, @harmless_treatment, @harmless_treatment_details, @meat_yield, @responsible_person, @segmentation_details, @blocking_reason, @review_status, @reviewer, @review_time, @review_confirmation, @status)
`);
app.post('/api/slaughter', (req, res) => {
  try {
    const body = req.body;
    const entry = stmt_entry_get.get(body.entry_id);
    if (!entry) return res.status(404).json({ success: false, message: '关联入场记录不存在' });
    if (entry.status !== 'qualified') return res.status(400).json({ success: false, message: '入场记录检疫未合格，无法创建屠宰批次' });
    if (entry.is_deleted === 1) return res.status(400).json({ success: false, message: '该入场记录已作废，无法创建屠宰批次' });

    body.batch_no = 'PC' + Date.now() + String(Math.floor(Math.random() * 10000)).padStart(4, '0');
    body.status = body.status || 'processing';
    body.review_status = body.review_status || 'pending';
    body.harmless_treatment = body.harmless_treatment || null;
    body.harmless_treatment_details = body.harmless_treatment_details || null;
    body.segmentation_details = body.segmentation_details ? JSON.stringify(body.segmentation_details) : null;
    body.blocking_reason = body.blocking_reason || null;
    body.reviewer = body.reviewer || null;
    body.review_time = body.review_time || null;
    body.review_confirmation = body.inspect_result === 'disqualified' && body.review_confirmation ? 1 : 0;

    if (body.inspect_result === 'disqualified') {
      if (!body.harmless_treatment) return res.status(400).json({ success: false, message: '检验不合格必须填写无害化处理方式' });
      if (!body.harmless_treatment_details) return res.status(400).json({ success: false, message: '检验不合格必须填写无害化处理明细' });
      if (!body.blocking_reason) return res.status(400).json({ success: false, message: '检验不合格必须填写阻断说明' });
      if (!body.reviewer) return res.status(400).json({ success: false, message: '检验不合格必须填写复核人' });
      if (!body.review_confirmation) return res.status(400).json({ success: false, message: '检验不合格必须确认复核' });
      body.review_status = 'reviewed';
      body.review_time = new Date().toISOString();

      if (entry.audit_log) {
        try {
          const existing = JSON.parse(entry.audit_log);
          existing.push({ action: '屠宰检验不合格', time: new Date().toISOString(), operator: body.reviewer, detail: body.blocking_reason });
          db.prepare('UPDATE entries SET audit_log = ?, blocking_explanation = ? WHERE id = ?').run(
            JSON.stringify(existing),
            `屠宰检验不合格：${body.blocking_reason}。无害化处理：${body.harmless_treatment}，${body.harmless_treatment_details}`,
            body.entry_id
          );
        } catch(e) {
          db.prepare('UPDATE entries SET blocking_explanation = ? WHERE id = ?').run(
            `屠宰检验不合格：${body.blocking_reason}。无害化处理：${body.harmless_treatment}，${body.harmless_treatment_details}`,
            body.entry_id
          );
        }
      } else {
        const audit = [{ action: '屠宰检验不合格', time: new Date().toISOString(), operator: body.reviewer, detail: body.blocking_reason }];
        db.prepare('UPDATE entries SET audit_log = ?, blocking_explanation = ? WHERE id = ?').run(
          JSON.stringify(audit),
          `屠宰检验不合格：${body.blocking_reason}。无害化处理：${body.harmless_treatment}，${body.harmless_treatment_details}`,
          body.entry_id
        );
      }
    }

    const r = stmt_slaughter_insert.run(body);
    res.status(201).json({ success: true, data: { id: r.lastInsertRowid, batch_no: body.batch_no } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

const stmt_slaughter_update = db.prepare(`
  UPDATE slaughter_batches SET inspect_result=COALESCE(@inspect_result, inspect_result),
    harmless_treatment=COALESCE(@harmless_treatment, harmless_treatment),
    harmless_treatment_details=COALESCE(@harmless_treatment_details, harmless_treatment_details),
    segmentation_details=COALESCE(@segmentation_details, segmentation_details),
    blocking_reason=COALESCE(@blocking_reason, blocking_reason),
    review_status=COALESCE(@review_status, review_status),
    reviewer=COALESCE(@reviewer, reviewer),
    review_time=COALESCE(@review_time, review_time),
    review_confirmation=COALESCE(@review_confirmation, review_confirmation),
    meat_yield=COALESCE(@meat_yield, meat_yield), responsible_person=COALESCE(@responsible_person, responsible_person),
    status=COALESCE(@status, status), updated_at=CURRENT_TIMESTAMP
  WHERE id=@id
`);
app.put('/api/slaughter/:id', (req, res) => {
  try {
    const body = { ...req.body, id: parseInt(req.params.id) };
    if (body.segmentation_details && typeof body.segmentation_details === 'object') {
      body.segmentation_details = JSON.stringify(body.segmentation_details);
    }
    const r = stmt_slaughter_update.run(body);
    if (r.changes === 0) return res.status(404).json({ success: false, message: '屠宰批次不存在' });
    res.json({ success: true, data: { id: body.id } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put('/api/slaughter/:id/review', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { reviewer, review_confirmation, blocking_reason, harmless_treatment_details } = req.body;
    
    if (!reviewer) return res.status(400).json({ success: false, message: '请提供复核人' });
    
    const batch = db.prepare('SELECT * FROM slaughter_batches WHERE id = ?').get(id);
    if (!batch) return res.status(404).json({ success: false, message: '屠宰批次不存在' });
    
    if (batch.inspect_result === 'disqualified' && !review_confirmation) {
      return res.status(400).json({ success: false, message: '不合格批次必须确认复核' });
    }
    
    const fields = ['review_status = @review_status', 'reviewer = @reviewer', 'review_time = @review_time', 'review_confirmation = @review_confirmation', 'updated_at = CURRENT_TIMESTAMP'];
    const params = { id, reviewer, review_status: 'reviewed', review_time: new Date().toISOString(), review_confirmation: review_confirmation ? 1 : 0 };
    
    if (blocking_reason) { fields.push('blocking_reason = @blocking_reason'); params.blocking_reason = blocking_reason; }
    if (harmless_treatment_details) { fields.push('harmless_treatment_details = @harmless_treatment_details'); params.harmless_treatment_details = harmless_treatment_details; }
    
    const sql = `UPDATE slaughter_batches SET ${fields.join(', ')} WHERE id = @id`;
    db.prepare(sql).run(params);

    if (batch.inspect_result === 'disqualified') {
      const entry = stmt_entry_get.get(batch.entry_id);
      if (entry) {
        const audit = entry.audit_log ? JSON.parse(entry.audit_log) : [];
        audit.push({ action: '屠宰复核确认', time: new Date().toISOString(), operator: reviewer, detail: `复核确认已完成，不合格批次已阻断出证。${blocking_reason || ''}`, type: 'review' });
        db.prepare('UPDATE entries SET audit_log = ?, blocking_explanation = ? WHERE id = ?').run(
          JSON.stringify(audit),
          `屠宰检验不合格：${blocking_reason || batch.blocking_reason || '检验不合格'}。已阻断出证和产品流向环节。`,
          batch.entry_id
        );
      }
    }
    
    res.json({ success: true, data: { id, review_status: 'reviewed', review_confirmation: params.review_confirmation } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

const stmt_cert_list = db.prepare('SELECT * FROM certificates ORDER BY issue_date DESC');
app.get('/api/certificates', (req, res) => {
  try {
    const rows = stmt_cert_list.all();
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

const stmt_cert_get = db.prepare('SELECT * FROM certificates WHERE id = ?');
app.get('/api/certificates/:id', (req, res) => {
  try {
    const row = stmt_cert_get.get(req.params.id);
    if (!row) return res.status(404).json({ success: false, message: '证书不存在' });
    res.json({ success: true, data: row });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

const stmt_batch_by_no = db.prepare('SELECT * FROM slaughter_batches WHERE batch_no = ?');
const stmt_cert_insert = db.prepare(`
  INSERT INTO certificates (batch_no, cert_no, animal_type, quantity, origin_farm, slaughter_date, issue_date, issuer, qr_code, status)
  VALUES (@batch_no, @cert_no, @animal_type, @quantity, @origin_farm, @slaughter_date, @issue_date, @issuer, @qr_code, @status)
`);
app.post('/api/certificates', (req, res) => {
  try {
    const body = req.body;
    const batch = stmt_batch_by_no.get(body.batch_no);
    if (!batch) return res.status(404).json({ success: false, message: '关联屠宰批次不存在' });
    if (batch.status !== 'qualified') return res.status(400).json({ success: false, message: '屠宰批次检验未合格，无法出证' });

    const cert_no = 'QJ' + Date.now();
    body.cert_no = cert_no;
    body.qr_code = `${frontendUrl}/trace/${cert_no}`;
    body.issue_date = new Date().toISOString();
    body.status = body.status || 'valid';

    const r = stmt_cert_insert.run(body);
    res.status(201).json({ success: true, data: { id: r.lastInsertRowid, cert_no, qr_code: body.qr_code } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

const stmt_cert_update = db.prepare(`
  UPDATE certificates SET animal_type=COALESCE(@animal_type, animal_type), quantity=COALESCE(@quantity, quantity),
    origin_farm=COALESCE(@origin_farm, origin_farm), issuer=COALESCE(@issuer, issuer),
    status=COALESCE(@status, status)
  WHERE id=@id
`);
app.put('/api/certificates/:id', (req, res) => {
  try {
    const body = { ...req.body, id: parseInt(req.params.id) };
    const r = stmt_cert_update.run(body);
    if (r.changes === 0) return res.status(404).json({ success: false, message: '证书不存在' });
    res.json({ success: true, data: { id: body.id } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

const stmt_cert_by_no = db.prepare('SELECT * FROM certificates WHERE cert_no = ?');
const stmt_batch_by_entry = db.prepare('SELECT * FROM slaughter_batches WHERE entry_id = ?');
const stmt_inspection_by_entry = db.prepare('SELECT * FROM pre_slaughter_inspections WHERE entry_id = ?');
const stmt_flows_by_cert = db.prepare('SELECT * FROM product_flows WHERE cert_no = ?');
app.get('/api/certificates/trace/:cert_no', (req, res) => {
  try {
    const cert = stmt_cert_by_no.get(req.params.cert_no);
    if (!cert) return res.status(404).json({ success: false, message: '证书不存在' });

    const batch = stmt_batch_by_no.get(cert.batch_no);
    let entry = null;
    let inspection = null;
    if (batch) {
      entry = stmt_entry_get.get(batch.entry_id);
      inspection = stmt_inspection_by_entry.get(batch.entry_id);
    }
    const flows = stmt_flows_by_cert.all(cert.cert_no);

    res.json({
      success: true,
      data: {
        certificate: cert,
        batch,
        entry,
        inspection,
        flows
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

const stmt_flow_list = db.prepare(`
  SELECT pf.*, c.animal_type, c.origin_farm, c.status AS cert_status, c.batch_no
  FROM product_flows pf
  LEFT JOIN certificates c ON pf.cert_no = c.cert_no
  ORDER BY pf.created_at DESC
`);
app.get('/api/flows', (req, res) => {
  try {
    const rows = stmt_flow_list.all();
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

const stmt_flow_insert = db.prepare(`
  INSERT INTO product_flows (cert_no, buyer_name, buyer_contact, destination, product_type, weight, flow_time)
  VALUES (@cert_no, @buyer_name, @buyer_contact, @destination, @product_type, @weight, @flow_time)
`);
app.post('/api/flows', (req, res) => {
  try {
    const body = req.body;
    const cert = stmt_cert_by_no.get(body.cert_no);
    if (!cert) return res.status(404).json({ success: false, message: '关联证书不存在' });

    const r = stmt_flow_insert.run(body);
    res.status(201).json({ success: true, data: { id: r.lastInsertRowid } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

const stmt_recall_list = db.prepare('SELECT * FROM recalls ORDER BY recall_time DESC');
app.get('/api/recalls', (req, res) => {
  try {
    const rows = stmt_recall_list.all();
    for (const r of rows) {
      if (r.scope_details) { try { r.scope_details = JSON.parse(r.scope_details); } catch(e) {} }
    }
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/recalls/:id', (req, res) => {
  try {
    let row = db.prepare('SELECT * FROM recalls WHERE id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ success: false, message: '召回记录不存在' });
    if (row.scope_details) { try { row.scope_details = JSON.parse(row.scope_details); } catch(e) {} }
    res.json({ success: true, data: row });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/recalls/scope/:certNo', (req, res) => {
  try {
    const certNo = req.params.certNo;
    const cert = stmt_cert_by_no.get(certNo);
    if (!cert) return res.status(404).json({ success: false, message: '证书不存在' });

    const batch = stmt_batch_by_no.get(cert.batch_no);
    let entry = null;
    let inspection = null;
    if (batch) {
      entry = stmt_entry_get.get(batch.entry_id);
      inspection = db.prepare('SELECT * FROM pre_slaughter_inspections WHERE entry_id = ? ORDER BY created_at DESC LIMIT 1').get(batch.entry_id);
    }

    const flows = stmt_flows_by_cert.all(certNo);
    const totalFlows = flows.length;
    const totalWeight = flows.reduce((sum, f) => sum + (f.weight || 0), 0);

    const destinations = [...new Set(flows.map((f) => f.destination).filter(Boolean))];
    const buyers = [...new Set(flows.map((f) => f.buyer_name).filter(Boolean))];

    res.json({
      success: true,
      data: {
        certificate: cert,
        batch,
        entry,
        inspection,
        flows,
        affected_flows: totalFlows,
        affected_weight: totalWeight,
        affected_destinations: destinations,
        affected_buyers: buyers,
        scope_summary: `影响 ${totalFlows} 条流向记录，共 ${totalWeight} kg 产品，涉及 ${destinations.length} 个目的地、${buyers.length} 家采购商`,
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

const stmt_cert_set_status = db.prepare('UPDATE certificates SET status = ? WHERE cert_no = ?');
const stmt_recall_insert = db.prepare(`
  INSERT INTO recalls (cert_no, reason, scope, initiator, recall_time, status, scope_details, affected_flows, affected_quantity, completion_status)
  VALUES (@cert_no, @reason, @scope, @initiator, @recall_time, @status, @scope_details, @affected_flows, @affected_quantity, @completion_status)
`);
app.post('/api/recalls', (req, res) => {
  try {
    const body = req.body;
    const cert = stmt_cert_by_no.get(body.cert_no);
    if (!cert) return res.status(404).json({ success: false, message: '关联证书不存在' });

    const flows = stmt_flows_by_cert.all(body.cert_no);
    body.affected_flows = flows.length;
    body.affected_quantity = flows.reduce((sum, f) => sum + (f.weight || 0), 0);

    body.recall_time = body.recall_time || new Date().toISOString();
    body.status = body.status || 'active';
    body.completion_status = body.completion_status || 'in_progress';
    body.scope_details = body.scope_details ? JSON.stringify(body.scope_details) : null;

    const insertRecall = db.transaction(() => {
      stmt_cert_set_status.run('recalled', body.cert_no);
      return stmt_recall_insert.run(body);
    });
    const r = insertRecall();
    res.status(201).json({ success: true, data: { id: r.lastInsertRowid, affected_flows: body.affected_flows, affected_quantity: body.affected_quantity } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put('/api/recalls/:id/complete', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const recall = db.prepare('SELECT * FROM recalls WHERE id = ?').get(id);
    if (!recall) return res.status(404).json({ success: false, message: '召回记录不存在' });

    db.prepare('UPDATE recalls SET completion_status = ?, completed_time = CURRENT_TIMESTAMP WHERE id = ?').run('completed', id);

    res.json({ success: true, data: { id, completion_status: 'completed' } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/dashboard/stats', (req, res) => {
  try {
    const total_entries = db.prepare('SELECT COUNT(*) AS c FROM entries WHERE is_deleted = 0').get().c;
    const qualified_entries = db.prepare("SELECT COUNT(*) AS c FROM entries WHERE status = 'qualified' AND is_deleted = 0").get().c;
    const disqualified_entries = db.prepare("SELECT COUNT(*) AS c FROM entries WHERE status = 'disqualified' AND is_deleted = 0").get().c;
    const pending_entries = db.prepare("SELECT COUNT(*) AS c FROM entries WHERE status IN ('pending', 'inspecting') AND is_deleted = 0").get().c;

    const total_slaughter_batches = db.prepare('SELECT COUNT(*) AS c FROM slaughter_batches').get().c;
    const qualified_batches = db.prepare("SELECT COUNT(*) AS c FROM slaughter_batches WHERE status = 'qualified'").get().c;
    const disqualified_batches = db.prepare("SELECT COUNT(*) AS c FROM slaughter_batches WHERE status = 'disqualified'").get().c;

    const total_certificates = db.prepare('SELECT COUNT(*) AS c FROM certificates').get().c;
    const valid_certificates = db.prepare("SELECT COUNT(*) AS c FROM certificates WHERE status = 'valid'").get().c;
    const recalled_certificates = db.prepare("SELECT COUNT(*) AS c FROM certificates WHERE status = 'recalled'").get().c;

    const total_harmless_treatments = db.prepare("SELECT COUNT(*) AS c FROM slaughter_batches WHERE harmless_treatment IS NOT NULL AND harmless_treatment != ''").get().c;

    const total_inspections = db.prepare('SELECT COUNT(*) AS c FROM pre_slaughter_inspections').get().c;
    const inspection_pass_rate = total_inspections > 0 ? Math.round((qualified_entries / total_entries) * 10000) / 100 : 0;

    const total_recalls = db.prepare('SELECT COUNT(*) AS c FROM recalls').get().c;
    const active_recalls = db.prepare("SELECT COUNT(*) AS c FROM recalls WHERE status = 'active'").get().c;
    const completed_recalls = db.prepare("SELECT COUNT(*) AS c FROM recalls WHERE completion_status = 'completed'").get().c;
    const total_affected_flows = db.prepare('SELECT COALESCE(SUM(affected_flows), 0) AS c FROM recalls').get().c;
    const total_affected_quantity = db.prepare('SELECT COALESCE(SUM(affected_quantity), 0) AS c FROM recalls').get().c;

    const animal_type_distribution = db.prepare('SELECT animal_type, COUNT(*) AS count FROM entries WHERE is_deleted = 0 GROUP BY animal_type ORDER BY count DESC').all();

    const recent_abnormal_batches = db.prepare(`
      SELECT sb.*, e.farm_name, e.animal_type
      FROM slaughter_batches sb
      LEFT JOIN entries e ON sb.entry_id = e.id
      WHERE sb.status = 'disqualified'
      ORDER BY sb.updated_at DESC
      LIMIT 10
    `).all();

    const farm_risk_stats = db.prepare(`
      SELECT farm_name, farm_address, 
        COUNT(*) AS total, 
        SUM(CASE WHEN status = 'disqualified' THEN 1 ELSE 0 END) AS disqualified_count,
        ROUND(SUM(CASE WHEN status = 'disqualified' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) AS risk_rate
      FROM entries
      WHERE is_deleted = 0
      GROUP BY farm_name, farm_address
      HAVING disqualified_count > 0
      ORDER BY risk_rate DESC
      LIMIT 10
    `).all();

    const source_risk_analysis = db.prepare(`
      SELECT 
        farm_address,
        COUNT(*) AS total,
        SUM(CASE WHEN status = 'disqualified' THEN 1 ELSE 0 END) AS disqualified,
        ROUND(SUM(CASE WHEN status = 'disqualified' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) AS risk_rate
      FROM entries
      WHERE is_deleted = 0 AND farm_address IS NOT NULL
      GROUP BY farm_address
      HAVING disqualified > 0
      ORDER BY risk_rate DESC
      LIMIT 10
    `).all();

    const enterprise_compliance = db.prepare(`
      SELECT 
        e.farm_name,
        COUNT(*) AS total,
        COUNT(DISTINCT CASE WHEN e.status = 'qualified' THEN e.id END) AS qualified,
        ROUND(COUNT(DISTINCT CASE WHEN e.status = 'qualified' THEN e.id END) * 100.0 / COUNT(*), 2) AS compliance_rate,
        COUNT(DISTINCT c.id) AS certificates_issued,
        COUNT(DISTINCT r.id) AS recall_count,
        CASE 
          WHEN COUNT(DISTINCT CASE WHEN e.status = 'qualified' THEN e.id END) * 100.0 / COUNT(*) > 80 THEN 'up'
          WHEN COUNT(DISTINCT CASE WHEN e.status = 'qualified' THEN e.id END) * 100.0 / COUNT(*) < 50 THEN 'down'
          ELSE 'stable'
        END AS trend
      FROM entries e
      LEFT JOIN slaughter_batches sb ON e.id = sb.entry_id
      LEFT JOIN certificates c ON sb.batch_no = c.batch_no
      LEFT JOIN recalls r ON c.cert_no = r.cert_no
      WHERE e.is_deleted = 0
      GROUP BY e.farm_name
      ORDER BY compliance_rate DESC, total DESC
    `).all();

    const recall_statistics = db.prepare(`
      SELECT 
        strftime('%Y-%m', recall_time) AS period,
        COUNT(*) AS count,
        COALESCE(SUM(affected_quantity), 0) AS affected_weight,
        CASE WHEN COUNT(*) > 0 THEN ROUND(SUM(CASE WHEN completion_status = 'completed' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) ELSE 0 END AS completion_rate
      FROM recalls
      GROUP BY strftime('%Y-%m', recall_time)
      ORDER BY period DESC
      LIMIT 12
    `).all();

    const recall_effectiveness = {
      total_recalls,
      active_recalls,
      completed_recalls,
      total_affected_flows,
      total_affected_quantity,
      completion_rate: total_recalls > 0 ? Math.round((completed_recalls / total_recalls) * 10000) / 100 : 0
    };

    const compliance_rate = total_entries > 0 ? Math.round((qualified_entries / total_entries) * 10000) / 100 : 0;

    const monthly_trend = db.prepare(`
      SELECT strftime('%Y-%m', arrival_time) AS month, 
        COUNT(*) AS count,
        SUM(CASE WHEN status = 'qualified' THEN 1 ELSE 0 END) AS qualified_count,
        SUM(CASE WHEN status = 'disqualified' THEN 1 ELSE 0 END) AS disqualified_count
      FROM entries
      WHERE arrival_time >= datetime('now', '-6 months') AND is_deleted = 0
      GROUP BY strftime('%Y-%m', arrival_time)
      ORDER BY month DESC
    `).all();

    const recent_audit_logs_raw = db.prepare(`
      SELECT e.id, e.farm_name, e.audit_log
      FROM entries e
      WHERE e.audit_log IS NOT NULL AND e.is_deleted = 0
      ORDER BY e.updated_at DESC
      LIMIT 10
    `).all();

    const recent_audit_logs = [];
    for (const row of recent_audit_logs_raw) {
      try {
        const logs = JSON.parse(row.audit_log);
        for (const log of logs) {
          recent_audit_logs.push({ ...log, entry_id: row.id, farm_name: row.farm_name });
        }
      } catch(e) {}
    }
    recent_audit_logs.sort((a, b) => new Date(b.time) - new Date(a.time));

    const recall_completion_rate = total_recalls > 0 ? Math.round((completed_recalls / total_recalls) * 10000) / 100 : 0;
    const total_recall_affected_weight = total_affected_quantity;

    res.json({
      success: true,
      data: {
        total_entries,
        qualified_entries,
        disqualified_entries,
        pending_entries,
        total_slaughter_batches,
        qualified_batches,
        disqualified_batches,
        total_certificates,
        valid_certificates,
        recalled_certificates,
        total_harmless_treatments,
        total_inspections,
        inspection_pass_rate,
        animal_type_distribution,
        recent_abnormal_batches,
        farm_risk_stats,
        compliance_rate,
        monthly_trend,
        source_risk_analysis,
        enterprise_compliance,
        recall_statistics,
        recall_effectiveness,
        recent_audit_logs,
        total_recalls,
        active_recalls,
        recall_completion_rate,
        total_recall_affected_weight,
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.use((err, req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: err.message });
});

app.listen(PORT, HOST, () => {
  console.log(`畜禽屠宰检疫追溯系统后端服务已启动: http://${HOST}:${PORT}`);
});
