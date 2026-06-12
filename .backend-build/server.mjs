// api/server.ts
import "dotenv/config";

// api/app.ts
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

// api/database.ts
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var dataDir = path.join(__dirname, "..", "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}
var dbPath = path.join(dataDir, "app.sqlite");
var db = new Database(dbPath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('talent', 'institution', 'admin')),
    verified INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS talent_profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(id),
    practice_category TEXT,
    department TEXT,
    title TEXT,
    certificate_url TEXT,
    gender TEXT,
    age INTEGER,
    email TEXT,
    location TEXT
  );

  CREATE TABLE IF NOT EXISTS institution_profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(id),
    institution_name TEXT NOT NULL,
    institution_type TEXT,
    license_url TEXT,
    credit_code TEXT,
    license_expiry TEXT,
    review_status TEXT NOT NULL DEFAULT 'pending',
    last_review_date TEXT,
    location TEXT,
    description TEXT
  );

  CREATE TABLE IF NOT EXISTS resumes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    talent_id INTEGER NOT NULL REFERENCES talent_profiles(id),
    basic_info TEXT NOT NULL DEFAULT '{}',
    education TEXT NOT NULL DEFAULT '[]',
    certifications TEXT NOT NULL DEFAULT '[]',
    work_experience TEXT NOT NULL DEFAULT '[]',
    privacy_settings TEXT NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    institution_id INTEGER NOT NULL REFERENCES institution_profiles(id),
    title TEXT NOT NULL,
    department TEXT NOT NULL,
    required_title TEXT,
    required_category TEXT,
    location TEXT,
    salary_min INTEGER,
    salary_max INTEGER,
    description TEXT,
    requirements TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'active', 'rejected', 'closed')),
    ai_risk_score INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id INTEGER NOT NULL REFERENCES jobs(id),
    talent_id INTEGER NOT NULL REFERENCES talent_profiles(id),
    status TEXT NOT NULL DEFAULT 'applied' CHECK(status IN ('applied', 'read', 'invited', 'interview', 'offered', 'rejected')),
    timeline TEXT NOT NULL DEFAULT '[]',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(job_id, talent_id)
  );

  CREATE TABLE IF NOT EXISTS conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    talent_id INTEGER NOT NULL REFERENCES talent_profiles(id),
    institution_id INTEGER NOT NULL REFERENCES institution_profiles(id),
    last_message TEXT,
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(talent_id, institution_id)
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conversation_id INTEGER NOT NULL REFERENCES conversations(id),
    sender_id INTEGER NOT NULL REFERENCES users(id),
    sender_role TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'text' CHECK(type IN ('text', 'resume_card', 'job_card')),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS community_posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    author_id INTEGER NOT NULL REFERENCES users(id),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    tags TEXT NOT NULL DEFAULT '[]',
    category TEXT NOT NULL CHECK(category IN ('news', 'policy', 'education')),
    likes INTEGER NOT NULL DEFAULT 0,
    comments INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL REFERENCES community_posts(id),
    author_id INTEGER NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);
try {
  db.exec(`
    ALTER TABLE jobs ADD COLUMN approved_by INTEGER REFERENCES users(id);
    ALTER TABLE jobs ADD COLUMN approved_at TEXT;
    ALTER TABLE jobs ADD COLUMN closed_reason TEXT;
    ALTER TABLE jobs ADD COLUMN closed_at TEXT;
    ALTER TABLE jobs ADD COLUMN closed_by INTEGER REFERENCES users(id);
    ALTER TABLE jobs ADD COLUMN review_note TEXT;
  `);
} catch (e) {
}
try {
  db.exec(`
    ALTER TABLE applications ADD COLUMN read_at TEXT;
    ALTER TABLE applications ADD COLUMN invited_at TEXT;
    ALTER TABLE applications ADD COLUMN interview_at TEXT;
    ALTER TABLE applications ADD COLUMN offered_at TEXT;
    ALTER TABLE applications ADD COLUMN rejected_at TEXT;
  `);
} catch (e) {
}
try {
  db.exec(`
    ALTER TABLE institution_profiles ADD COLUMN verified_level INTEGER DEFAULT 0;
  `);
} catch (e) {
}
var userCount = db.prepare("SELECT COUNT(*) as count FROM users").get();
if (userCount.count === 0) {
  const insertUser = db.prepare(`
    INSERT INTO users (phone, password, name, role, verified) VALUES (?, ?, ?, ?, ?)
  `);
  const insertTalentProfile = db.prepare(`
    INSERT INTO talent_profiles (user_id, practice_category, department, title, gender, age, email, location) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertInstitutionProfile = db.prepare(`
    INSERT INTO institution_profiles (user_id, institution_name, institution_type, credit_code, license_expiry, review_status, last_review_date, location, description, verified_level) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertResume = db.prepare(`
    INSERT INTO resumes (talent_id, basic_info, education, certifications, work_experience, privacy_settings) VALUES (?, ?, ?, ?, ?, ?)
  `);
  const insertJob = db.prepare(`
    INSERT INTO jobs (institution_id, title, department, required_title, required_category, location, salary_min, salary_max, description, requirements, status, ai_risk_score, approved_by, approved_at, review_note) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertApplication = db.prepare(`
    INSERT INTO applications (job_id, talent_id, status, timeline, read_at, invited_at, interview_at, offered_at, rejected_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertConversation = db.prepare(`
    INSERT INTO conversations (talent_id, institution_id, last_message, updated_at) VALUES (?, ?, ?, datetime('now'))
  `);
  const insertMessage = db.prepare(`
    INSERT INTO messages (conversation_id, sender_id, sender_role, content, type) VALUES (?, ?, ?, ?, ?)
  `);
  const insertPost = db.prepare(`
    INSERT INTO community_posts (author_id, title, content, tags, category, likes, comments) VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const insertComment = db.prepare(`
    INSERT INTO comments (post_id, author_id, content) VALUES (?, ?, ?)
  `);
  const seed = db.transaction(() => {
    insertUser.run("13800000001", "admin123", "\u7CFB\u7EDF\u7BA1\u7406\u5458", "admin", 1);
    const talentData = [
      { phone: "13800000002", name: "\u5F20\u4F1F", category: "\u4E34\u5E8A", dept: "\u5185\u79D1", title: "\u4E3B\u6CBB\u533B\u5E08", gender: "\u7537", age: 35, email: "zhangwei@med.com", location: "\u5317\u4EAC" },
      { phone: "13800000003", name: "\u674E\u5A1C", category: "\u4E34\u5E8A", dept: "\u5916\u79D1", title: "\u526F\u4E3B\u4EFB\u533B\u5E08", gender: "\u5973", age: 42, email: "lina@med.com", location: "\u4E0A\u6D77" },
      { phone: "13800000004", name: "\u738B\u78CA", category: "\u4E34\u5E8A", dept: "\u513F\u79D1", title: "\u4F4F\u9662\u533B\u5E08", gender: "\u7537", age: 28, email: "wanglei@med.com", location: "\u5E7F\u5DDE" },
      { phone: "13800000005", name: "\u9648\u9759", category: "\u4E34\u5E8A", dept: "\u5987\u4EA7\u79D1", title: "\u4E3B\u6CBB\u533B\u5E08", gender: "\u5973", age: 33, email: "chenjing@med.com", location: "\u6DF1\u5733" },
      { phone: "13800000006", name: "\u5218\u6D0B", category: "\u836F\u5B66", dept: "\u836F\u5B66", title: "\u4E3B\u4EFB\u836F\u5E08", gender: "\u7537", age: 50, email: "liuyang@med.com", location: "\u676D\u5DDE" }
    ];
    const talentUserIds = [];
    const talentProfileIds = [];
    for (const t of talentData) {
      const r = insertUser.run(t.phone, "123456", t.name, "talent", 1);
      talentUserIds.push(Number(r.lastInsertRowid));
      const pr = insertTalentProfile.run(r.lastInsertRowid, t.category, t.dept, t.title, t.gender, t.age, t.email, t.location);
      talentProfileIds.push(Number(pr.lastInsertRowid));
    }
    const instData = [
      { name: "\u5317\u4EAC\u534F\u548C\u533B\u9662", type: "\u4E09\u7532\u533B\u9662", code: "91110000MA01A001", expiry: "2027-12-31", review: "approved", lastDate: "2025-01-15", location: "\u5317\u4EAC", desc: "\u4E2D\u56FD\u6700\u9876\u5C16\u7684\u7EFC\u5408\u6027\u533B\u9662\u4E4B\u4E00", verifiedLevel: 2 },
      { name: "\u4E0A\u6D77\u5E02\u7B2C\u4E00\u4EBA\u6C11\u533B\u9662", type: "\u4E8C\u7532\u533B\u9662", code: "91310000MA01B002", expiry: "2026-06-30", review: "approved", lastDate: "2024-11-20", location: "\u4E0A\u6D77", desc: "\u4E0A\u6D77\u5E02\u5386\u53F2\u60A0\u4E45\u7684\u7EFC\u5408\u6027\u533B\u9662", verifiedLevel: 2 },
      { name: "\u5E7F\u5DDE\u5987\u513F\u533B\u7597\u4E2D\u5FC3", type: "\u4E13\u79D1\u533B\u9662", code: "91440100MA01C003", expiry: "2026-03-15", review: "pending", lastDate: null, location: "\u5E7F\u5DDE", desc: "\u4E13\u6CE8\u4E8E\u5987\u5973\u513F\u7AE5\u5065\u5EB7\u7684\u4E13\u79D1\u533B\u7597\u673A\u6784", verifiedLevel: 0 },
      { name: "\u676D\u5DDE\u897F\u6E56\u793E\u533A\u536B\u751F\u670D\u52A1\u4E2D\u5FC3", type: "\u793E\u533A\u533B\u9662", code: "91330100MA01D004", expiry: "2025-09-30", review: "approved", lastDate: "2024-08-10", location: "\u676D\u5DDE", desc: "\u670D\u52A1\u793E\u533A\u7684\u57FA\u5C42\u533B\u7597\u673A\u6784", verifiedLevel: 1 }
    ];
    const instUserIds = [];
    const instProfileIds = [];
    for (const inst of instData) {
      const r = insertUser.run(`1390000000${instProfileIds.length + 1}`, "123456", inst.name, "institution", 1);
      instUserIds.push(Number(r.lastInsertRowid));
      const pr = insertInstitutionProfile.run(r.lastInsertRowid, inst.name, inst.type, inst.code, inst.expiry, inst.review, inst.lastDate, inst.location, inst.desc, inst.verifiedLevel);
      instProfileIds.push(Number(pr.lastInsertRowid));
    }
    for (let i = 0; i < talentProfileIds.length; i++) {
      const tp = talentProfileIds[i];
      const t = talentData[i];
      insertResume.run(
        tp,
        JSON.stringify({ name: t.name, gender: t.gender, age: t.age, phone: t.phone, email: t.email, location: t.location }),
        JSON.stringify([
          { school: "\u5317\u4EAC\u5927\u5B66\u533B\u5B66\u90E8", degree: "\u535A\u58EB", major: "\u4E34\u5E8A\u533B\u5B66", year: `${2010 + i}` },
          { school: "\u590D\u65E6\u5927\u5B66\u4E0A\u6D77\u533B\u5B66\u9662", degree: "\u7855\u58EB", major: "\u57FA\u7840\u533B\u5B66", year: `${2007 + i}` }
        ]),
        JSON.stringify([
          { name: "\u6267\u4E1A\u533B\u5E08\u8D44\u683C\u8BC1", year: `${2012 + i}`, status: "\u6709\u6548" },
          { name: "\u4E13\u79D1\u533B\u5E08\u89C4\u8303\u5316\u57F9\u8BAD\u5408\u683C\u8BC1", year: `${2015 + i}`, status: "\u6709\u6548" }
        ]),
        JSON.stringify([
          { hospital: instData[0].name, department: t.dept, position: t.title, startYear: `${2013 + i}`, endYear: "\u81F3\u4ECA" }
        ]),
        JSON.stringify({ phone: false, email: true, realName: false })
      );
    }
    const jobData = [
      { inst: 0, title: "\u5185\u79D1\u4E3B\u6CBB\u533B\u5E08", dept: "\u5185\u79D1", reqTitle: "\u4E3B\u6CBB\u533B\u5E08", reqCat: "\u4E34\u5E8A", loc: "\u5317\u4EAC", salMin: 15e3, salMax: 25e3, desc: "\u8D1F\u8D23\u5185\u79D1\u95E8\u8BCA\u53CA\u4F4F\u9662\u60A3\u8005\u7684\u8BCA\u7597\u5DE5\u4F5C", req: "\u5185\u79D1\u4E3B\u6CBB\u533B\u5E08\u804C\u79F0\uFF0C3\u5E74\u4EE5\u4E0A\u4E34\u5E8A\u7ECF\u9A8C", status: "active", risk: 0, approvedBy: 1, approvedAt: "2025-01-20T10:00:00Z", reviewNote: "\u8D44\u8D28\u9F50\u5168\uFF0C\u4FE1\u606F\u771F\u5B9E\uFF0C\u4E88\u4EE5\u901A\u8FC7" },
      { inst: 0, title: "\u5916\u79D1\u526F\u4E3B\u4EFB\u533B\u5E08", dept: "\u5916\u79D1", reqTitle: "\u526F\u4E3B\u4EFB\u533B\u5E08", reqCat: "\u4E34\u5E8A", loc: "\u5317\u4EAC", salMin: 2e4, salMax: 35e3, desc: "\u8D1F\u8D23\u5916\u79D1\u624B\u672F\u53CA\u7591\u96BE\u75C5\u4F8B\u4F1A\u8BCA", req: "\u5916\u79D1\u526F\u4E3B\u4EFB\u533B\u5E08\u804C\u79F0\uFF0C5\u5E74\u4EE5\u4E0A\u4E34\u5E8A\u7ECF\u9A8C", status: "active", risk: 0, approvedBy: 1, approvedAt: "2025-01-22T14:30:00Z", reviewNote: "\u9AD8\u804C\u79F0\u5C97\u4F4D\uFF0C\u85AA\u8D44\u5408\u7406\uFF0C\u4E88\u4EE5\u901A\u8FC7" },
      { inst: 1, title: "\u513F\u79D1\u4F4F\u9662\u533B\u5E08", dept: "\u513F\u79D1", reqTitle: "\u4F4F\u9662\u533B\u5E08", reqCat: "\u4E34\u5E8A", loc: "\u4E0A\u6D77", salMin: 1e4, salMax: 18e3, desc: "\u8D1F\u8D23\u513F\u79D1\u95E8\u8BCA\u53CA\u75C5\u623F\u5DE5\u4F5C", req: "\u513F\u79D1\u4F4F\u9662\u533B\u5E08\u89C4\u8303\u5316\u57F9\u8BAD\u5408\u683C", status: "active", risk: 0, approvedBy: 1, approvedAt: "2025-02-01T09:15:00Z", reviewNote: "\u4F4F\u9662\u533B\u5E08\u5C97\u4F4D\uFF0C\u8981\u6C42\u5408\u7406\uFF0C\u4E88\u4EE5\u901A\u8FC7" },
      { inst: 1, title: "\u5987\u4EA7\u79D1\u4E3B\u6CBB\u533B\u5E08", dept: "\u5987\u4EA7\u79D1", reqTitle: "\u4E3B\u6CBB\u533B\u5E08", reqCat: "\u4E34\u5E8A", loc: "\u4E0A\u6D77", salMin: 14e3, salMax: 22e3, desc: "\u8D1F\u8D23\u5987\u4EA7\u79D1\u95E8\u8BCA\u53CA\u624B\u672F", req: "\u5987\u4EA7\u79D1\u4E3B\u6CBB\u533B\u5E08\u804C\u79F0\uFF0C2\u5E74\u4EE5\u4E0A\u4E34\u5E8A\u7ECF\u9A8C", status: "active", risk: 0, approvedBy: 1, approvedAt: "2025-02-05T11:00:00Z", reviewNote: "\u4E3B\u6CBB\u533B\u5E08\u5C97\u4F4D\uFF0C\u4FE1\u606F\u5B8C\u6574\uFF0C\u4E88\u4EE5\u901A\u8FC7" },
      { inst: 2, title: "\u513F\u79D1\u4E3B\u6CBB\u533B\u5E08", dept: "\u513F\u79D1", reqTitle: "\u4E3B\u6CBB\u533B\u5E08", reqCat: "\u4E34\u5E8A", loc: "\u5E7F\u5DDE", salMin: 12e3, salMax: 2e4, desc: "\u8D1F\u8D23\u513F\u7AE5\u5E38\u89C1\u75C5\u7684\u8BCA\u7597", req: "\u513F\u79D1\u4E3B\u6CBB\u533B\u5E08\u804C\u79F0", status: "pending", risk: 15, approvedBy: null, approvedAt: null, reviewNote: "\u673A\u6784\u672A\u5B8C\u6210\u9AD8\u7EA7\u8BA4\u8BC1\uFF0C\u804C\u4F4D\u6682\u7F13\u4E0A\u67B6" },
      { inst: 2, title: "\u4EA7\u79D1\u4F4F\u9662\u533B\u5E08", dept: "\u5987\u4EA7\u79D1", reqTitle: "\u4F4F\u9662\u533B\u5E08", reqCat: "\u4E34\u5E8A", loc: "\u5E7F\u5DDE", salMin: 1e4, salMax: 16e3, desc: "\u8D1F\u8D23\u4EA7\u79D1\u75C5\u623F\u53CA\u5206\u5A29\u5DE5\u4F5C", req: "\u5987\u4EA7\u79D1\u4F4F\u9662\u533B\u5E08\u89C4\u8303\u5316\u57F9\u8BAD\u5408\u683C", status: "pending", risk: 10, approvedBy: null, approvedAt: null, reviewNote: "\u673A\u6784\u672A\u5B8C\u6210\u9AD8\u7EA7\u8BA4\u8BC1\uFF0C\u804C\u4F4D\u6682\u7F13\u4E0A\u67B6" },
      { inst: 3, title: "\u5168\u79D1\u533B\u751F", dept: "\u5168\u79D1", reqTitle: "\u4E3B\u6CBB\u533B\u5E08", reqCat: "\u4E34\u5E8A", loc: "\u676D\u5DDE", salMin: 8e3, salMax: 15e3, desc: "\u8D1F\u8D23\u793E\u533A\u5C45\u6C11\u5E38\u89C1\u75C5\u8BCA\u7597\u53CA\u5065\u5EB7\u7BA1\u7406", req: "\u5168\u79D1\u533B\u5B66\u4E3B\u6CBB\u533B\u5E08\u804C\u79F0", status: "pending", risk: 8, approvedBy: null, approvedAt: null, reviewNote: "\u673A\u6784\u4EC5\u57FA\u7840\u8BA4\u8BC1\uFF0C\u9700\u9AD8\u7EA7\u8BA4\u8BC1\u540E\u65B9\u53EF\u4E0A\u67B6" },
      { inst: 3, title: "\u836F\u623F\u4E3B\u7BA1", dept: "\u836F\u5B66", reqTitle: "\u4E3B\u7BA1\u836F\u5E08", reqCat: "\u836F\u5B66", loc: "\u676D\u5DDE", salMin: 9e3, salMax: 14e3, desc: "\u8D1F\u8D23\u836F\u623F\u65E5\u5E38\u7BA1\u7406\u53CA\u836F\u54C1\u8C03\u914D", req: "\u4E3B\u7BA1\u836F\u5E08\u53CA\u4EE5\u4E0A\u804C\u79F0\uFF0C2\u5E74\u4EE5\u4E0A\u836F\u623F\u7BA1\u7406\u7ECF\u9A8C", status: "pending", risk: 5, approvedBy: null, approvedAt: null, reviewNote: "\u673A\u6784\u4EC5\u57FA\u7840\u8BA4\u8BC1\uFF0C\u9700\u9AD8\u7EA7\u8BA4\u8BC1\u540E\u65B9\u53EF\u4E0A\u67B6" },
      { inst: 0, title: "\u6025\u8BCA\u79D1\u533B\u5E08", dept: "\u6025\u8BCA\u79D1", reqTitle: "\u4E3B\u6CBB\u533B\u5E08", reqCat: "\u4E34\u5E8A", loc: "\u5317\u4EAC", salMin: 18e3, salMax: 3e4, desc: "\u8D1F\u8D23\u6025\u8BCA\u60A3\u8005\u7684\u6551\u6CBB\u53CA\u62A2\u6551\u5DE5\u4F5C", req: "\u6025\u8BCA\u79D1\u4E3B\u6CBB\u533B\u5E08\u804C\u79F0\uFF0C3\u5E74\u4EE5\u4E0A\u6025\u8BCA\u7ECF\u9A8C", status: "active", risk: 5, approvedBy: 1, approvedAt: "2025-02-15T09:00:00Z", reviewNote: "\u6025\u8BCA\u5C97\u4F4D\uFF0C\u98CE\u9669\u8BC4\u52065\uFF0C\u9700\u5173\u6CE8\u85AA\u8D44\u5408\u7406\u6027" }
    ];
    const jobIds = [];
    for (const j of jobData) {
      const r = insertJob.run(instProfileIds[j.inst], j.title, j.dept, j.reqTitle, j.reqCat, j.loc, j.salMin, j.salMax, j.desc, j.req, j.status, j.risk, j.approvedBy, j.approvedAt, j.reviewNote);
      jobIds.push(Number(r.lastInsertRowid));
    }
    const appData = [
      { job: 0, talent: 0, status: "interview", timeline: '[{"status":"applied","at":"2025-03-01"},{"status":"read","at":"2025-03-02"},{"status":"invited","at":"2025-03-05"},{"status":"interview","at":"2025-03-10"}]', readAt: "2025-03-02T10:00:00Z", invitedAt: "2025-03-05T14:30:00Z", interviewAt: "2025-03-10T09:00:00Z", offeredAt: null, rejectedAt: null },
      { job: 1, talent: 1, status: "offered", timeline: '[{"status":"applied","at":"2025-02-15"},{"status":"read","at":"2025-02-16"},{"status":"invited","at":"2025-02-20"},{"status":"interview","at":"2025-02-25"},{"status":"offered","at":"2025-03-01"}]', readAt: "2025-02-16T11:00:00Z", invitedAt: "2025-02-20T15:00:00Z", interviewAt: "2025-02-25T10:00:00Z", offeredAt: "2025-03-01T16:00:00Z", rejectedAt: null },
      { job: 2, talent: 2, status: "read", timeline: '[{"status":"applied","at":"2025-04-01"},{"status":"read","at":"2025-04-02"}]', readAt: "2025-04-02T09:30:00Z", invitedAt: null, interviewAt: null, offeredAt: null, rejectedAt: null },
      { job: 3, talent: 3, status: "applied", timeline: '[{"status":"applied","at":"2025-04-10"}]', readAt: null, invitedAt: null, interviewAt: null, offeredAt: null, rejectedAt: null },
      { job: 4, talent: 2, status: "invited", timeline: '[{"status":"applied","at":"2025-03-20"},{"status":"read","at":"2025-03-21"},{"status":"invited","at":"2025-03-25"}]', readAt: "2025-03-21T14:00:00Z", invitedAt: "2025-03-25T10:30:00Z", interviewAt: null, offeredAt: null, rejectedAt: null },
      { job: 6, talent: 3, status: "rejected", timeline: '[{"status":"applied","at":"2025-03-15"},{"status":"read","at":"2025-03-16"},{"status":"rejected","at":"2025-03-20"}]', readAt: "2025-03-16T11:00:00Z", invitedAt: null, interviewAt: null, offeredAt: null, rejectedAt: "2025-03-20T16:00:00Z" },
      { job: 7, talent: 4, status: "applied", timeline: '[{"status":"applied","at":"2025-04-05"}]', readAt: null, invitedAt: null, interviewAt: null, offeredAt: null, rejectedAt: null },
      { job: 8, talent: 0, status: "applied", timeline: '[{"status":"applied","at":"2025-04-12"}]', readAt: null, invitedAt: null, interviewAt: null, offeredAt: null, rejectedAt: null }
    ];
    for (const a of appData) {
      insertApplication.run(jobIds[a.job], talentProfileIds[a.talent], a.status, a.timeline, a.readAt, a.invitedAt, a.interviewAt, a.offeredAt, a.rejectedAt);
    }
    const conv1 = insertConversation.run(talentProfileIds[0], instProfileIds[0], "\u60A8\u597D\uFF0C\u8BF7\u95EE\u9762\u8BD5\u65F6\u95F4\u65B9\u4FBF\u5B89\u6392\u5417\uFF1F");
    const conv2 = insertConversation.run(talentProfileIds[1], instProfileIds[0], "\u611F\u8C22\u60A8\u7684\u5F55\u7528\u610F\u5411\uFF01");
    const conv3 = insertConversation.run(talentProfileIds[2], instProfileIds[1], "\u8BF7\u95EE\u8FD9\u4E2A\u5C97\u4F4D\u8FD8\u62DB\u4EBA\u5417\uFF1F");
    insertMessage.run(Number(conv1.lastInsertRowid), talentUserIds[0], "talent", "\u60A8\u597D\uFF0C\u6211\u5BF9\u8D35\u9662\u5185\u79D1\u4E3B\u6CBB\u533B\u5E08\u804C\u4F4D\u5F88\u611F\u5174\u8DA3\uFF0C\u8BF7\u95EE\u53EF\u4EE5\u5B89\u6392\u9762\u8BD5\u5417\uFF1F", "text");
    insertMessage.run(Number(conv1.lastInsertRowid), instUserIds[0], "institution", "\u60A8\u597D\u5F20\u533B\u751F\uFF0C\u6211\u4EEC\u5DF2\u6536\u5230\u60A8\u7684\u7B80\u5386\uFF0C\u9762\u8BD5\u65F6\u95F4\u65B9\u4FBF\u5B89\u6392\u5417\uFF1F", "text");
    insertMessage.run(Number(conv1.lastInsertRowid), talentUserIds[0], "talent", "\u53EF\u4EE5\uFF0C\u4E0B\u5468\u4E09\u4E0A\u5348\u65B9\u4FBF\u3002", "text");
    insertMessage.run(Number(conv2.lastInsertRowid), instUserIds[0], "institution", "\u674E\u533B\u751F\u60A8\u597D\uFF0C\u606D\u559C\u60A8\u901A\u8FC7\u9762\u8BD5\uFF0C\u6211\u4EEC\u51B3\u5B9A\u5F55\u7528\u60A8\u3002", "text");
    insertMessage.run(Number(conv2.lastInsertRowid), talentUserIds[1], "talent", "\u611F\u8C22\u60A8\u7684\u5F55\u7528\u610F\u5411\uFF01\u6211\u975E\u5E38\u613F\u610F\u52A0\u5165\u8D35\u9662\u3002", "text");
    insertMessage.run(Number(conv3.lastInsertRowid), talentUserIds[2], "talent", "\u8BF7\u95EE\u4E0A\u6D77\u7B2C\u4E00\u4EBA\u6C11\u533B\u9662\u7684\u513F\u79D1\u5C97\u4F4D\u8FD8\u5728\u62DB\u4EBA\u5417\uFF1F", "text");
    insertMessage.run(Number(conv3.lastInsertRowid), instUserIds[1], "institution", "\u76EE\u524D\u8FD8\u5728\u62DB\u8058\u4E2D\uFF0C\u60A8\u53EF\u4EE5\u6295\u9012\u7B80\u5386\u3002", "text");
    const postData = [
      { author: 0, title: "2025\u5E74\u533B\u7597\u536B\u751F\u4F53\u5236\u6539\u9769\u6700\u65B0\u653F\u7B56\u89E3\u8BFB", content: "\u8FD1\u65E5\uFF0C\u56FD\u52A1\u9662\u53D1\u5E03\u4E86\u6700\u65B0\u7684\u533B\u7597\u536B\u751F\u4F53\u5236\u6539\u9769\u65B9\u6848\uFF0C\u91CD\u70B9\u63A8\u8FDB\u5206\u7EA7\u8BCA\u7597\u5236\u5EA6\u5EFA\u8BBE\uFF0C\u52A0\u5F3A\u57FA\u5C42\u533B\u7597\u670D\u52A1\u80FD\u529B\u3002\u65B9\u6848\u660E\u786E\u63D0\u51FA\u52302025\u5E74\u5E95\uFF0C\u53BF\u57DF\u5C31\u8BCA\u7387\u8981\u8FBE\u523090%\u4EE5\u4E0A...", tags: '["\u533B\u6539","\u5206\u7EA7\u8BCA\u7597","\u653F\u7B56"]', category: "policy", likes: 128, comments: 45 },
      { author: 1, title: "\u4F4F\u9662\u533B\u5E08\u89C4\u8303\u5316\u57F9\u8BAD\u7ECF\u9A8C\u5206\u4EAB", content: "\u4F5C\u4E3A\u4E00\u540D\u521A\u521A\u5B8C\u6210\u4F4F\u9662\u533B\u5E08\u89C4\u8303\u5316\u57F9\u8BAD\u7684\u533B\u751F\uFF0C\u6211\u60F3\u5206\u4EAB\u4E00\u4E0B\u81EA\u5DF1\u7684\u57F9\u8BAD\u7ECF\u5386\u548C\u5FC3\u5F97\u3002\u89C4\u57F9\u4E09\u5E74\uFF0C\u6211\u5728\u5185\u79D1\u8F6E\u8F6C\u4E86\u591A\u4E2A\u79D1\u5BA4\uFF0C\u79EF\u7D2F\u4E86\u4E30\u5BCC\u7684\u4E34\u5E8A\u7ECF\u9A8C...", tags: '["\u89C4\u57F9","\u7ECF\u9A8C\u5206\u4EAB","\u533B\u5B66\u6559\u80B2"]', category: "education", likes: 256, comments: 89 },
      { author: 0, title: "\u4EBA\u5DE5\u667A\u80FD\u5728\u533B\u7597\u5F71\u50CF\u8BCA\u65AD\u4E2D\u7684\u5E94\u7528\u8FDB\u5C55", content: "\u8FD1\u5E74\u6765\uFF0C\u4EBA\u5DE5\u667A\u80FD\u6280\u672F\u5728\u533B\u7597\u5F71\u50CF\u8BCA\u65AD\u9886\u57DF\u53D6\u5F97\u4E86\u663E\u8457\u8FDB\u5C55\u3002\u591A\u9879\u7814\u7A76\u8868\u660E\uFF0CAI\u8F85\u52A9\u8BCA\u65AD\u7CFB\u7EDF\u5728\u80BA\u7ED3\u8282\u68C0\u6D4B\u3001\u773C\u5E95\u75C5\u53D8\u7B5B\u67E5\u7B49\u65B9\u9762\u7684\u51C6\u786E\u7387\u5DF2\u63A5\u8FD1\u751A\u81F3\u8D85\u8FC7\u8D44\u6DF1\u5F71\u50CF\u79D1\u533B\u751F...", tags: '["AI","\u533B\u7597\u5F71\u50CF","\u524D\u6CBF\u6280\u672F"]', category: "news", likes: 342, comments: 67 },
      { author: 2, title: "\u513F\u79D1\u533B\u751F\u77ED\u7F3A\u95EE\u9898\u7684\u6DF1\u5C42\u539F\u56E0\u5206\u6790", content: "\u6211\u56FD\u513F\u79D1\u533B\u751F\u957F\u671F\u77ED\u7F3A\uFF0C\u6BCF\u5343\u540D\u513F\u7AE5\u513F\u79D1\u533B\u751F\u6570\u4EC5\u4E3A0.63\u4EBA\uFF0C\u8FDC\u4F4E\u4E8E\u53D1\u8FBE\u56FD\u5BB6\u6C34\u5E73\u3002\u9020\u6210\u8FD9\u4E00\u5C40\u9762\u7684\u539F\u56E0\u5305\u62EC\uFF1A\u513F\u79D1\u5DE5\u4F5C\u5F3A\u5EA6\u5927\u3001\u6536\u5165\u76F8\u5BF9\u8F83\u4F4E\u3001\u804C\u4E1A\u53D1\u5C55\u7A7A\u95F4\u6709\u9650\u7B49...", tags: '["\u513F\u79D1","\u4EBA\u624D\u77ED\u7F3A","\u5206\u6790"]', category: "policy", likes: 189, comments: 56 },
      { author: 3, title: "\u6267\u4E1A\u836F\u5E08\u7EE7\u7EED\u6559\u80B2\u65B0\u89C4\u89E3\u8BFB", content: "\u56FD\u5BB6\u836F\u76D1\u5C40\u8FD1\u65E5\u53D1\u5E03\u65B0\u89C4\uFF0C\u5BF9\u6267\u4E1A\u836F\u5E08\u7EE7\u7EED\u6559\u80B2\u5236\u5EA6\u8FDB\u884C\u4E86\u91CD\u5927\u8C03\u6574\u3002\u65B0\u89C4\u8981\u6C42\u6267\u4E1A\u836F\u5E08\u6BCF\u5E74\u53C2\u52A0\u4E0D\u5C11\u4E8E90\u5B66\u65F6\u7684\u7EE7\u7EED\u6559\u80B2\uFF0C\u5176\u4E2D\u4E13\u4E1A\u79D1\u76EE\u4E0D\u5C11\u4E8E60\u5B66\u65F6...", tags: '["\u836F\u5E08","\u7EE7\u7EED\u6559\u80B2","\u65B0\u89C4"]', category: "education", likes: 95, comments: 32 },
      { author: 4, title: "\u793E\u533A\u533B\u9662\u4FE1\u606F\u5316\u5EFA\u8BBE\u5B9E\u8DF5\u4E0E\u601D\u8003", content: "\u968F\u7740\u533B\u7597\u4FE1\u606F\u5316\u5EFA\u8BBE\u7684\u4E0D\u65AD\u63A8\u8FDB\uFF0C\u793E\u533A\u533B\u9662\u4E5F\u9762\u4E34\u7740\u6570\u5B57\u5316\u8F6C\u578B\u7684\u6311\u6218\u3002\u6211\u9662\u5728\u4FE1\u606F\u5316\u5EFA\u8BBE\u4E2D\uFF0C\u91CD\u70B9\u63A8\u8FDB\u4E86\u7535\u5B50\u75C5\u5386\u7CFB\u7EDF\u3001\u8FDC\u7A0B\u4F1A\u8BCA\u5E73\u53F0\u548C\u667A\u6167\u836F\u623F\u5EFA\u8BBE...", tags: '["\u793E\u533A\u533B\u9662","\u4FE1\u606F\u5316","\u5B9E\u8DF5"]', category: "news", likes: 67, comments: 21 }
    ];
    const postIds = [];
    for (const p of postData) {
      const r = insertPost.run(talentUserIds[p.author], p.title, p.content, p.tags, p.category, p.likes, p.comments);
      postIds.push(Number(r.lastInsertRowid));
    }
    insertComment.run(postIds[0], talentUserIds[1], "\u653F\u7B56\u89E3\u8BFB\u5F88\u53CA\u65F6\uFF0C\u5206\u7EA7\u8BCA\u7597\u786E\u5B9E\u662F\u672A\u6765\u7684\u65B9\u5411\u3002");
    insertComment.run(postIds[0], talentUserIds[2], "\u5E0C\u671B\u57FA\u5C42\u533B\u9662\u7684\u5F85\u9047\u80FD\u8DDF\u4E0A\uFF0C\u5426\u5219\u4EBA\u624D\u7559\u4E0D\u4F4F\u3002");
    insertComment.run(postIds[1], talentUserIds[3], "\u89C4\u57F9\u786E\u5B9E\u5F88\u8F9B\u82E6\uFF0C\u4F46\u6536\u83B7\u4E5F\u5F88\u5927\uFF0C\u52A0\u6CB9\uFF01");
    insertComment.run(postIds[2], instUserIds[0], "AI\u8F85\u52A9\u8BCA\u65AD\u5728\u6211\u4EEC\u533B\u9662\u5DF2\u7ECF\u8BD5\u70B9\u5E94\u7528\uFF0C\u6548\u679C\u4E0D\u9519\u3002");
    insertComment.run(postIds[3], talentUserIds[0], "\u513F\u79D1\u786E\u5B9E\u9700\u8981\u66F4\u591A\u653F\u7B56\u652F\u6301\u548C\u6295\u5165\u3002");
  });
  seed();
}
var database_default = db;

// api/routes/auth.ts
import { Router } from "express";
var router = Router();
function readCurrentProfile(req) {
  const userId = req.headers["x-user-id"] || req.query.userId || "1";
  const user = database_default.prepare("SELECT id, phone, name, role, verified, created_at FROM users WHERE id = ?").get(userId);
  if (!user) return null;
  let profile = null;
  if (user.role === "talent") {
    profile = database_default.prepare("SELECT * FROM talent_profiles WHERE user_id = ?").get(userId);
  } else if (user.role === "institution") {
    profile = database_default.prepare("SELECT * FROM institution_profiles WHERE user_id = ?").get(userId);
  }
  return { user, profile };
}
router.post("/register", async (req, res) => {
  try {
    const { phone, password, name, role } = req.body;
    if (!phone || !password || !name || !role) {
      res.status(400).json({ success: false, error: "\u7F3A\u5C11\u5FC5\u586B\u5B57\u6BB5" });
      return;
    }
    if (!["talent", "institution", "admin"].includes(role)) {
      res.status(400).json({ success: false, error: "\u65E0\u6548\u7684\u89D2\u8272\u7C7B\u578B" });
      return;
    }
    const existing = database_default.prepare("SELECT id FROM users WHERE phone = ?").get(phone);
    if (existing) {
      res.status(409).json({ success: false, error: "\u8BE5\u624B\u673A\u53F7\u5DF2\u6CE8\u518C" });
      return;
    }
    const userResult = database_default.prepare("INSERT INTO users (phone, password, name, role) VALUES (?, ?, ?, ?)").run(phone, password, name, role);
    const userId = Number(userResult.lastInsertRowid);
    if (role === "talent") {
      database_default.prepare("INSERT INTO talent_profiles (user_id) VALUES (?)").run(userId);
    } else if (role === "institution") {
      database_default.prepare("INSERT INTO institution_profiles (user_id, institution_name) VALUES (?, ?)").run(userId, name);
    }
    const user = database_default.prepare("SELECT id, phone, name, role, verified, created_at FROM users WHERE id = ?").get(userId);
    res.status(201).json({ success: true, data: { user, token: String(userId) } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
router.post("/login", async (req, res) => {
  try {
    const { phone, password } = req.body;
    if (!phone || !password) {
      res.status(400).json({ success: false, error: "\u7F3A\u5C11\u624B\u673A\u53F7\u6216\u5BC6\u7801" });
      return;
    }
    const user = database_default.prepare("SELECT id, phone, password, name, role, verified, created_at FROM users WHERE phone = ?").get(phone);
    if (!user || user.password !== password) {
      res.status(401).json({ success: false, error: "\u624B\u673A\u53F7\u6216\u5BC6\u7801\u9519\u8BEF" });
      return;
    }
    const { password: _, ...userWithoutPassword } = user;
    res.json({ success: true, data: { user: userWithoutPassword, token: String(user.id) } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
router.get(["/profile", "/me"], async (req, res) => {
  try {
    const current = readCurrentProfile(req);
    if (!current) {
      res.status(404).json({ success: false, error: "\u7528\u6237\u4E0D\u5B58\u5728" });
      return;
    }
    res.json({ success: true, data: current });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
router.put("/profile", async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];
    const userRole = req.headers["x-user-role"];
    if (!userId) {
      res.status(401).json({ success: false, error: "\u672A\u767B\u5F55" });
      return;
    }
    if (userRole === "talent") {
      const { practice_category, department, title, certificate_url, gender, age, email, location } = req.body;
      database_default.prepare(`
        UPDATE talent_profiles SET practice_category = COALESCE(?, practice_category), department = COALESCE(?, department),
        title = COALESCE(?, title), certificate_url = COALESCE(?, certificate_url), gender = COALESCE(?, gender),
        age = COALESCE(?, age), email = COALESCE(?, email), location = COALESCE(?, location) WHERE user_id = ?
      `).run(practice_category, department, title, certificate_url, gender, age, email, location, userId);
    } else if (userRole === "institution") {
      const { institution_name, institution_type, license_url, credit_code, license_expiry, location, description } = req.body;
      database_default.prepare(`
        UPDATE institution_profiles SET institution_name = COALESCE(?, institution_name), institution_type = COALESCE(?, institution_type),
        license_url = COALESCE(?, license_url), credit_code = COALESCE(?, credit_code), license_expiry = COALESCE(?, license_expiry),
        location = COALESCE(?, location), description = COALESCE(?, description) WHERE user_id = ?
      `).run(institution_name, institution_type, license_url, credit_code, license_expiry, location, description, userId);
    }
    const user = database_default.prepare("SELECT id, phone, name, role, verified, created_at FROM users WHERE id = ?").get(userId);
    let profile = null;
    if (user.role === "talent") {
      profile = database_default.prepare("SELECT * FROM talent_profiles WHERE user_id = ?").get(userId);
    } else if (user.role === "institution") {
      profile = database_default.prepare("SELECT * FROM institution_profiles WHERE user_id = ?").get(userId);
    }
    res.json({ success: true, data: { user, profile } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
router.get("/status", async (req, res) => {
  try {
    const { phone, role } = req.query;
    if (!phone || !role) {
      res.status(400).json({ success: false, error: "\u7F3A\u5C11\u53C2\u6570" });
      return;
    }
    const user = database_default.prepare("SELECT id, verified, created_at FROM users WHERE phone = ? AND role = ?").get(phone, role);
    if (!user) {
      res.json({ success: true, data: { status: "not_found", message: "\u672A\u627E\u5230\u7533\u8BF7\u8BB0\u5F55" } });
      return;
    }
    if (user.verified) {
      res.json({ success: true, data: { status: "approved", message: "\u5BA1\u6838\u5DF2\u901A\u8FC7\uFF0C\u60A8\u53EF\u4EE5\u6B63\u5E38\u767B\u5F55\u4F7F\u7528" } });
    } else {
      res.json({ success: true, data: { status: "pending", message: "\u5BA1\u6838\u4E2D\uFF0C\u8BF7\u8010\u5FC3\u7B49\u5F85\uFF0C\u9884\u8BA11-3\u4E2A\u5DE5\u4F5C\u65E5\u5B8C\u6210" } });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
var auth_default = router;

// api/routes/jobs.ts
import { Router as Router2 } from "express";
var router2 = Router2();
function calculateRiskScore(job) {
  let score = 0;
  if (job.salary_max && job.salary_min && job.salary_max - job.salary_min > 3e4) score += 30;
  if (job.salary_max && job.salary_max > 8e4) score += 25;
  if (!job.description || job.description.length < 20) score += 20;
  if (!job.requirements || job.requirements.length < 10) score += 15;
  if (!job.required_title && !job.required_category) score += 10;
  return Math.min(score, 100);
}
var VERIFIED_LEVEL_MAP = {
  0: "\u672A\u8BA4\u8BC1",
  1: "\u57FA\u7840\u8BA4\u8BC1",
  2: "\u9AD8\u7EA7\u8BA4\u8BC1"
};
router2.get("/", async (req, res) => {
  try {
    const { department, location, title, category, salary_min, salary_max, status, page = "1", limit = "10" } = req.query;
    const conditions = [];
    const params = [];
    if (department) {
      conditions.push("j.department = ?");
      params.push(department);
    }
    if (location) {
      conditions.push("j.location = ?");
      params.push(location);
    }
    if (title) {
      conditions.push("j.title LIKE ?");
      params.push(`%${title}%`);
    }
    if (category) {
      conditions.push("j.required_category = ?");
      params.push(category);
    }
    if (salary_min) {
      conditions.push("j.salary_max >= ?");
      params.push(Number(salary_min));
    }
    if (salary_max) {
      conditions.push("j.salary_min <= ?");
      params.push(Number(salary_max));
    }
    if (status) {
      conditions.push("j.status = ?");
      params.push(status);
    }
    const whereClause = conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : "";
    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.max(1, Math.min(100, Number(limit)));
    const offset = (pageNum - 1) * limitNum;
    const totalResult = database_default.prepare(`SELECT COUNT(*) as count FROM jobs j ${whereClause}`).get(...params);
    const jobs = database_default.prepare(`
      SELECT j.*, ip.institution_name, ip.institution_type, ip.location as institution_location,
             ip.verified_level, ip.license_expiry, ip.review_status,
             ua.name as approved_by_name
      FROM jobs j
      JOIN institution_profiles ip ON j.institution_id = ip.id
      LEFT JOIN users ua ON j.approved_by = ua.id
      ${whereClause}
      ORDER BY j.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, limitNum, offset);
    const jobsWithVerified = jobs.map((job) => ({
      ...job,
      verified_level_text: VERIFIED_LEVEL_MAP[job.verified_level] || "\u672A\u77E5"
    }));
    res.json({
      success: true,
      data: {
        items: jobsWithVerified,
        total: totalResult.count,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(totalResult.count / limitNum)
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
router2.get("/:id", async (req, res) => {
  try {
    const job = database_default.prepare(`
      SELECT j.*, ip.institution_name, ip.institution_type, ip.location as institution_location, ip.description as institution_description,
             ip.verified_level, ip.license_expiry, ip.review_status,
             ua.name as approved_by_name, uc.name as closed_by_name
      FROM jobs j
      JOIN institution_profiles ip ON j.institution_id = ip.id
      LEFT JOIN users ua ON j.approved_by = ua.id
      LEFT JOIN users uc ON j.closed_by = uc.id
      WHERE j.id = ?
    `).get(req.params.id);
    if (!job) {
      res.status(404).json({ success: false, error: "\u804C\u4F4D\u4E0D\u5B58\u5728" });
      return;
    }
    job.verified_level_text = VERIFIED_LEVEL_MAP[job.verified_level] || "\u672A\u77E5";
    res.json({ success: true, data: job });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
router2.put("/:id/status", async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];
    const userRole = req.headers["x-user-role"];
    if (!userId) {
      res.status(401).json({ success: false, error: "\u672A\u767B\u5F55" });
      return;
    }
    const { status, closed_reason } = req.body;
    if (!status) {
      res.status(400).json({ success: false, error: "\u8BF7\u63D0\u4F9B\u72B6\u6001" });
      return;
    }
    const existing = database_default.prepare("SELECT * FROM jobs WHERE id = ?").get(req.params.id);
    if (!existing) {
      res.status(404).json({ success: false, error: "\u804C\u4F4D\u4E0D\u5B58\u5728" });
      return;
    }
    if (userRole !== "admin") {
      const instProfile = database_default.prepare("SELECT id FROM institution_profiles WHERE user_id = ?").get(userId);
      if (!instProfile || instProfile.id !== existing.institution_id) {
        res.status(403).json({ success: false, error: "\u65E0\u6743\u4FEE\u6539\u6B64\u804C\u4F4D\u72B6\u6001" });
        return;
      }
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    if (status === "closed") {
      if (!closed_reason) {
        res.status(400).json({ success: false, error: "\u8BF7\u63D0\u4F9B\u5173\u95ED\u539F\u56E0" });
        return;
      }
      database_default.prepare(`
        UPDATE jobs SET status = 'closed', closed_reason = ?, closed_at = ?, closed_by = ?, updated_at = datetime('now')
        WHERE id = ?
      `).run(closed_reason, now, userId, req.params.id);
    } else {
      database_default.prepare(`
        UPDATE jobs SET status = ?, updated_at = datetime('now') WHERE id = ?
      `).run(status, req.params.id);
    }
    const job = database_default.prepare(`
      SELECT j.*, ip.institution_name, ip.verified_level,
             ua.name as approved_by_name, uc.name as closed_by_name
      FROM jobs j
      JOIN institution_profiles ip ON j.institution_id = ip.id
      LEFT JOIN users ua ON j.approved_by = ua.id
      LEFT JOIN users uc ON j.closed_by = uc.id
      WHERE j.id = ?
    `).get(req.params.id);
    if (job) {
      job.verified_level_text = VERIFIED_LEVEL_MAP[job.verified_level] || "\u672A\u77E5";
    }
    res.json({ success: true, data: job });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
router2.put("/:id/close", async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];
    const userRole = req.headers["x-user-role"];
    if (!userId) {
      res.status(401).json({ success: false, error: "\u672A\u767B\u5F55" });
      return;
    }
    const { close_reason } = req.body;
    if (!close_reason) {
      res.status(400).json({ success: false, error: "\u8BF7\u63D0\u4F9B\u5173\u95ED\u539F\u56E0" });
      return;
    }
    const existing = database_default.prepare("SELECT * FROM jobs WHERE id = ?").get(req.params.id);
    if (!existing) {
      res.status(404).json({ success: false, error: "\u804C\u4F4D\u4E0D\u5B58\u5728" });
      return;
    }
    if (userRole !== "admin") {
      const instProfile = database_default.prepare("SELECT id FROM institution_profiles WHERE user_id = ?").get(userId);
      if (!instProfile || instProfile.id !== existing.institution_id) {
        res.status(403).json({ success: false, error: "\u65E0\u6743\u5173\u95ED\u6B64\u804C\u4F4D" });
        return;
      }
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    database_default.prepare(`
      UPDATE jobs SET status = 'closed', closed_reason = ?, closed_at = ?, closed_by = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(close_reason, now, userId, req.params.id);
    const job = database_default.prepare(`
      SELECT j.*, u.name as closed_by_name
      FROM jobs j
      LEFT JOIN users u ON j.closed_by = u.id
      WHERE j.id = ?
    `).get(req.params.id);
    res.json({ success: true, data: job });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
router2.post("/", async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];
    const userRole = req.headers["x-user-role"];
    if (!userId || userRole !== "institution") {
      res.status(403).json({ success: false, error: "\u4EC5\u673A\u6784\u7528\u6237\u53EF\u53D1\u5E03\u804C\u4F4D" });
      return;
    }
    const instProfile = database_default.prepare("SELECT id FROM institution_profiles WHERE user_id = ?").get(userId);
    if (!instProfile) {
      res.status(404).json({ success: false, error: "\u673A\u6784\u8D44\u6599\u4E0D\u5B58\u5728" });
      return;
    }
    const { title, department, required_title, required_category, location, salary_min, salary_max, description, requirements } = req.body;
    if (!title || !department) {
      res.status(400).json({ success: false, error: "\u7F3A\u5C11\u804C\u4F4D\u540D\u79F0\u6216\u79D1\u5BA4" });
      return;
    }
    const riskScore = calculateRiskScore(req.body);
    const result = database_default.prepare(`
      INSERT INTO jobs (institution_id, title, department, required_title, required_category, location, salary_min, salary_max, description, requirements, status, ai_risk_score)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)
    `).run(instProfile.id, title, department, required_title, required_category, location, salary_min, salary_max, description, requirements, riskScore);
    const job = database_default.prepare("SELECT * FROM jobs WHERE id = ?").get(result.lastInsertRowid);
    res.status(201).json({ success: true, data: job });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
router2.put("/:id", async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];
    const userRole = req.headers["x-user-role"];
    const existing = database_default.prepare(`
      SELECT j.*, ip.verified_level, ip.institution_name
      FROM jobs j
      JOIN institution_profiles ip ON j.institution_id = ip.id
      WHERE j.id = ?
    `).get(req.params.id);
    if (!existing) {
      res.status(404).json({ success: false, error: "\u804C\u4F4D\u4E0D\u5B58\u5728" });
      return;
    }
    if (userRole !== "admin") {
      const instProfile = database_default.prepare("SELECT id FROM institution_profiles WHERE user_id = ?").get(userId);
      if (!instProfile || instProfile.id !== existing.institution_id) {
        res.status(403).json({ success: false, error: "\u65E0\u6743\u4FEE\u6539\u6B64\u804C\u4F4D" });
        return;
      }
    }
    const { title, department, required_title, required_category, location, salary_min, salary_max, description, requirements, status } = req.body;
    if (status === "active" && (existing.verified_level || 0) < 2 && userRole !== "admin") {
      const levelText = (existing.verified_level || 0) === 1 ? "\u57FA\u7840\u8BA4\u8BC1" : "\u672A\u8BA4\u8BC1";
      res.status(400).json({ success: false, error: `\u673A\u6784"${existing.institution_name}"\u5F53\u524D\u4E3A${levelText}\uFF0C\u9700\u5B8C\u6210\u9AD8\u7EA7\u8BA4\u8BC1\u540E\u65B9\u53EF\u4E0A\u67B6\u804C\u4F4D\u3002`, code: "INSTITUTION_NOT_FULLY_VERIFIED" });
      return;
    }
    database_default.prepare(`
      UPDATE jobs SET title = COALESCE(?, title), department = COALESCE(?, department),
      required_title = COALESCE(?, required_title), required_category = COALESCE(?, required_category),
      location = COALESCE(?, location), salary_min = COALESCE(?, salary_min), salary_max = COALESCE(?, salary_max),
      description = COALESCE(?, description), requirements = COALESCE(?, requirements),
      status = COALESCE(?, status), updated_at = datetime('now') WHERE id = ?
    `).run(title, department, required_title, required_category, location, salary_min, salary_max, description, requirements, status, req.params.id);
    const job = database_default.prepare("SELECT * FROM jobs WHERE id = ?").get(req.params.id);
    res.json({ success: true, data: job });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
router2.delete("/:id", async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];
    const userRole = req.headers["x-user-role"];
    const existing = database_default.prepare("SELECT * FROM jobs WHERE id = ?").get(req.params.id);
    if (!existing) {
      res.status(404).json({ success: false, error: "\u804C\u4F4D\u4E0D\u5B58\u5728" });
      return;
    }
    if (userRole !== "admin") {
      const instProfile = database_default.prepare("SELECT id FROM institution_profiles WHERE user_id = ?").get(userId);
      if (!instProfile || instProfile.id !== existing.institution_id) {
        res.status(403).json({ success: false, error: "\u65E0\u6743\u5220\u9664\u6B64\u804C\u4F4D" });
        return;
      }
    }
    database_default.prepare("DELETE FROM jobs WHERE id = ?").run(req.params.id);
    res.json({ success: true, data: null });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
var jobs_default = router2;

// api/routes/resumes.ts
import { Router as Router3 } from "express";
import multer from "multer";
var router3 = Router3();
var upload = multer({ storage: multer.memoryStorage() });
function parseResume(basicInfo) {
  try {
    const info = JSON.parse(basicInfo);
    const parsed = {};
    if (info.name) parsed.name = info.name;
    if (info.gender) parsed.gender = info.gender;
    if (info.age) parsed.age = info.age;
    if (info.location) parsed.location = info.location;
    if (info.practice_category) parsed.practice_category = info.practice_category;
    if (info.department) parsed.department = info.department;
    if (info.title) parsed.title = info.title;
    parsed.parsed_at = (/* @__PURE__ */ new Date()).toISOString();
    parsed.confidence = 0.92;
    return parsed;
  } catch {
    return { parsed_at: (/* @__PURE__ */ new Date()).toISOString(), confidence: 0 };
  }
}
router3.get("/", async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];
    const userRole = req.headers["x-user-role"];
    if (!userId) {
      res.status(401).json({ success: false, error: "\u672A\u767B\u5F55" });
      return;
    }
    let resumes;
    if (userRole === "talent") {
      const talent = database_default.prepare("SELECT id FROM talent_profiles WHERE user_id = ?").get(userId);
      if (!talent) {
        res.status(404).json({ success: false, error: "\u4EBA\u624D\u8D44\u6599\u4E0D\u5B58\u5728" });
        return;
      }
      resumes = database_default.prepare("SELECT * FROM resumes WHERE talent_id = ?").all(talent.id);
    } else if (userRole === "institution" || userRole === "admin") {
      resumes = database_default.prepare(`
        SELECT r.*, tp.department, tp.title, tp.practice_category, u.name as talent_name
        FROM resumes r
        JOIN talent_profiles tp ON r.talent_id = tp.id
        JOIN users u ON tp.user_id = u.id
      `).all();
    } else {
      resumes = [];
    }
    res.json({ success: true, data: resumes });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
router3.get("/:id", async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];
    if (!userId) {
      res.status(401).json({ success: false, error: "\u672A\u767B\u5F55" });
      return;
    }
    const resume = database_default.prepare(`
      SELECT r.*, tp.department, tp.title, tp.practice_category, u.name as talent_name
      FROM resumes r
      JOIN talent_profiles tp ON r.talent_id = tp.id
      JOIN users u ON tp.user_id = u.id
      WHERE r.id = ?
    `).get(req.params.id);
    if (!resume) {
      res.status(404).json({ success: false, error: "\u7B80\u5386\u4E0D\u5B58\u5728" });
      return;
    }
    const privacy = JSON.parse(resume.privacy_settings || "{}");
    if (privacy.realName && resume.talent_name) {
      resume.talent_name = resume.talent_name.charAt(0) + "**";
    }
    if (privacy.phone) {
      const info = JSON.parse(resume.basic_info || "{}");
      if (info.phone) info.phone = info.phone.replace(/(\d{3})\d{4}(\d{4})/, "$1****$2");
      resume.basic_info = JSON.stringify(info);
    }
    if (privacy.email) {
      const info = JSON.parse(resume.basic_info || "{}");
      if (info.email) info.email = info.email.replace(/(.{2}).*(@.*)/, "$1***$2");
      resume.basic_info = JSON.stringify(info);
    }
    res.json({ success: true, data: resume });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
router3.post("/", async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];
    const userRole = req.headers["x-user-role"];
    if (!userId || userRole !== "talent") {
      res.status(403).json({ success: false, error: "\u4EC5\u4EBA\u624D\u7528\u6237\u53EF\u521B\u5EFA\u7B80\u5386" });
      return;
    }
    const talent = database_default.prepare("SELECT id FROM talent_profiles WHERE user_id = ?").get(userId);
    if (!talent) {
      res.status(404).json({ success: false, error: "\u4EBA\u624D\u8D44\u6599\u4E0D\u5B58\u5728" });
      return;
    }
    const { basic_info, education, certifications, work_experience, privacy_settings } = req.body;
    const result = database_default.prepare(`
      INSERT INTO resumes (talent_id, basic_info, education, certifications, work_experience, privacy_settings)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      talent.id,
      JSON.stringify(basic_info || {}),
      JSON.stringify(education || []),
      JSON.stringify(certifications || []),
      JSON.stringify(work_experience || []),
      JSON.stringify(privacy_settings || {})
    );
    const resume = database_default.prepare("SELECT * FROM resumes WHERE id = ?").get(result.lastInsertRowid);
    res.status(201).json({ success: true, data: resume });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
router3.put("/:id", async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];
    if (!userId) {
      res.status(401).json({ success: false, error: "\u672A\u767B\u5F55" });
      return;
    }
    const existing = database_default.prepare("SELECT * FROM resumes WHERE id = ?").get(req.params.id);
    if (!existing) {
      res.status(404).json({ success: false, error: "\u7B80\u5386\u4E0D\u5B58\u5728" });
      return;
    }
    const talent = database_default.prepare("SELECT id FROM talent_profiles WHERE user_id = ?").get(userId);
    if (!talent || talent.id !== existing.talent_id && req.headers["x-user-role"] !== "admin") {
      res.status(403).json({ success: false, error: "\u65E0\u6743\u4FEE\u6539\u6B64\u7B80\u5386" });
      return;
    }
    const { basic_info, education, certifications, work_experience, privacy_settings } = req.body;
    database_default.prepare(`
      UPDATE resumes SET basic_info = COALESCE(?, basic_info), education = COALESCE(?, education),
      certifications = COALESCE(?, certifications), work_experience = COALESCE(?, work_experience),
      privacy_settings = COALESCE(?, privacy_settings), updated_at = datetime('now') WHERE id = ?
    `).run(
      basic_info ? JSON.stringify(basic_info) : null,
      education ? JSON.stringify(education) : null,
      certifications ? JSON.stringify(certifications) : null,
      work_experience ? JSON.stringify(work_experience) : null,
      privacy_settings ? JSON.stringify(privacy_settings) : null,
      req.params.id
    );
    const resume = database_default.prepare("SELECT * FROM resumes WHERE id = ?").get(req.params.id);
    res.json({ success: true, data: resume });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
router3.delete("/:id", async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];
    if (!userId) {
      res.status(401).json({ success: false, error: "\u672A\u767B\u5F55" });
      return;
    }
    const existing = database_default.prepare("SELECT * FROM resumes WHERE id = ?").get(req.params.id);
    if (!existing) {
      res.status(404).json({ success: false, error: "\u7B80\u5386\u4E0D\u5B58\u5728" });
      return;
    }
    const talent = database_default.prepare("SELECT id FROM talent_profiles WHERE user_id = ?").get(userId);
    if (!talent || talent.id !== existing.talent_id && req.headers["x-user-role"] !== "admin") {
      res.status(403).json({ success: false, error: "\u65E0\u6743\u5220\u9664\u6B64\u7B80\u5386" });
      return;
    }
    database_default.prepare("DELETE FROM resumes WHERE id = ?").run(req.params.id);
    res.json({ success: true, data: null });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
router3.post("/:id/parse", async (req, res) => {
  try {
    const resume = database_default.prepare("SELECT * FROM resumes WHERE id = ?").get(req.params.id);
    if (!resume) {
      res.status(404).json({ success: false, error: "\u7B80\u5386\u4E0D\u5B58\u5728" });
      return;
    }
    const parsed = parseResume(resume.basic_info);
    res.json({ success: true, data: parsed });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
router3.get("/:id/export", async (req, res) => {
  try {
    const resume = database_default.prepare("SELECT * FROM resumes WHERE id = ?").get(req.params.id);
    if (!resume) {
      res.status(404).json({ success: false, error: "\u7B80\u5386\u4E0D\u5B58\u5728" });
      return;
    }
    res.json({ success: true, data: { message: "PDF\u5BFC\u51FA\u529F\u80FD\u5F85\u5B9E\u73B0", resume_id: resume.id } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
router3.post("/parse", upload.single("file"), async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];
    if (!userId) {
      res.status(401).json({ success: false, error: "\u672A\u767B\u5F55" });
      return;
    }
    const talent = database_default.prepare("SELECT id FROM talent_profiles WHERE user_id = ?").get(userId);
    if (!talent) {
      res.status(404).json({ success: false, error: "\u4EBA\u624D\u8D44\u6599\u4E0D\u5B58\u5728" });
      return;
    }
    const mockParsed = {
      basic_info: {
        name: "\u5F20\u4E09",
        phone: "13800138000",
        email: "zhangsan@example.com",
        gender: "\u7537",
        birthDate: "1990-01-15",
        address: "\u5317\u4EAC\u5E02\u671D\u9633\u533A",
        department: "\u5185\u79D1",
        title: "\u4E3B\u6CBB\u533B\u5E08",
        practiceCategory: "\u4E34\u5E8A",
        currentEmployer: "\u5317\u4EAC\u534F\u548C\u533B\u9662",
        expectedSalary: "25000"
      },
      education: [
        { school: "\u5317\u4EAC\u5927\u5B66\u533B\u5B66\u90E8", major: "\u4E34\u5E8A\u533B\u5B66", degree: "\u7855\u58EB", startDate: "2010-09", endDate: "2015-06" },
        { school: "\u6E05\u534E\u5927\u5B66\u533B\u5B66\u9662", major: "\u5185\u79D1\u5B66", degree: "\u535A\u58EB", startDate: "2015-09", endDate: "2018-06" }
      ],
      certifications: [
        { name: "\u533B\u5E08\u8D44\u683C\u8BC1\u4E66", number: "2018110111000001", issuedBy: "\u56FD\u5BB6\u536B\u751F\u5065\u5EB7\u59D4\u5458\u4F1A", issuedDate: "2018-11-01" },
        { name: "\u4E3B\u6CBB\u533B\u5E08\u8D44\u683C\u8BC1", number: "2021110111000002", issuedBy: "\u5317\u4EAC\u5E02\u536B\u751F\u5065\u5EB7\u59D4\u5458\u4F1A", issuedDate: "2021-11-01" }
      ],
      work_experience: [
        { institution: "\u5317\u4EAC\u534F\u548C\u533B\u9662", department: "\u5FC3\u5185\u79D1", title: "\u4F4F\u9662\u533B\u5E08", startDate: "2018-07", endDate: "2021-06", description: "\u8D1F\u8D23\u5FC3\u5185\u79D1\u5E38\u89C1\u75C5\u3001\u591A\u53D1\u75C5\u7684\u8BCA\u65AD\u548C\u6CBB\u7597" },
        { institution: "\u5317\u4EAC\u534F\u548C\u533B\u9662", department: "\u5FC3\u5185\u79D1", title: "\u4E3B\u6CBB\u533B\u5E08", startDate: "2021-07", endDate: "", description: "\u72EC\u7ACB\u5904\u7406\u5FC3\u5185\u79D1\u7591\u96BE\u75C5\u4F8B\uFF0C\u53C2\u4E0E\u6559\u5B66\u548C\u79D1\u7814\u5DE5\u4F5C" }
      ]
    };
    res.json({ success: true, data: mockParsed });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
router3.get("/:id/export-pdf", async (req, res) => {
  try {
    const resume = database_default.prepare("SELECT * FROM resumes WHERE id = ?").get(req.params.id);
    if (!resume) {
      res.status(404).json({ success: false, error: "\u7B80\u5386\u4E0D\u5B58\u5728" });
      return;
    }
    const pdfContent = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>
endobj
4 0 obj
<< /Length 44 >>
stream
BT
/F1 24 Tf
100 700 Td
(Resume Export) Tj
ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000010 00000 n 
0000000060 00000 n 
0000000110 00000 n 
0000000180 00000 n 
0000000290 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
360
%%EOF`;
    const buffer = Buffer.from(pdfContent, "utf-8");
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="resume-${req.params.id}.pdf"`);
    res.setHeader("Content-Length", buffer.length);
    res.send(buffer);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
var resumes_default = router3;

// api/routes/applications.ts
import { Router as Router4 } from "express";
var router4 = Router4();
var VALID_TRANSITIONS = {
  applied: ["read", "rejected"],
  read: ["invited", "rejected"],
  invited: ["interview", "rejected"],
  interview: ["offered", "rejected"],
  offered: [],
  rejected: []
};
var STATUS_TIMESTAMP_FIELDS = {
  read: "read_at",
  invited: "invited_at",
  interview: "interview_at",
  offered: "offered_at",
  rejected: "rejected_at"
};
router4.get("/", async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];
    const userRole = req.headers["x-user-role"];
    if (!userId) {
      res.status(401).json({ success: false, error: "\u672A\u767B\u5F55" });
      return;
    }
    let applications;
    if (userRole === "talent") {
      const talent = database_default.prepare("SELECT id FROM talent_profiles WHERE user_id = ?").get(userId);
      if (!talent) {
        res.status(404).json({ success: false, error: "\u4EBA\u624D\u8D44\u6599\u4E0D\u5B58\u5728" });
        return;
      }
      applications = database_default.prepare(`
        SELECT a.*, j.title as job_title, j.department, j.location, j.salary_min, j.salary_max,
        ip.institution_name, ip.institution_type
        FROM applications a
        JOIN jobs j ON a.job_id = j.id
        JOIN institution_profiles ip ON j.institution_id = ip.id
        WHERE a.talent_id = ?
        ORDER BY a.created_at DESC
      `).all(talent.id);
    } else if (userRole === "institution") {
      const instProfile = database_default.prepare("SELECT id FROM institution_profiles WHERE user_id = ?").get(userId);
      if (!instProfile) {
        res.status(404).json({ success: false, error: "\u673A\u6784\u8D44\u6599\u4E0D\u5B58\u5728" });
        return;
      }
      const { status } = req.query;
      if (status) {
        applications = database_default.prepare(`
          SELECT a.*, j.title as job_title, j.department, tp.title as talent_title, tp.department as talent_dept, u.name as talent_name
          FROM applications a
          JOIN jobs j ON a.job_id = j.id
          JOIN talent_profiles tp ON a.talent_id = tp.id
          JOIN users u ON tp.user_id = u.id
          WHERE j.institution_id = ? AND a.status = ?
          ORDER BY a.created_at DESC
        `).all(instProfile.id, status);
      } else {
        applications = database_default.prepare(`
          SELECT a.*, j.title as job_title, j.department, tp.title as talent_title, tp.department as talent_dept, u.name as talent_name
          FROM applications a
          JOIN jobs j ON a.job_id = j.id
          JOIN talent_profiles tp ON a.talent_id = tp.id
          JOIN users u ON tp.user_id = u.id
          WHERE j.institution_id = ?
          ORDER BY a.created_at DESC
        `).all(instProfile.id);
      }
    } else {
      applications = database_default.prepare(`
        SELECT a.*, j.title as job_title, j.department, ip.institution_name,
        tp.title as talent_title, u.name as talent_name
        FROM applications a
        JOIN jobs j ON a.job_id = j.id
        JOIN institution_profiles ip ON j.institution_id = ip.id
        JOIN talent_profiles tp ON a.talent_id = tp.id
        JOIN users u ON tp.user_id = u.id
        ORDER BY a.created_at DESC
      `).all();
    }
    res.json({ success: true, data: applications });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
router4.get("/funnel", async (req, res) => {
  try {
    const funnelStats = database_default.prepare(`
      SELECT status, COUNT(*) as count FROM applications GROUP BY status ORDER BY
        CASE status
          WHEN 'applied' THEN 1
          WHEN 'read' THEN 2
          WHEN 'invited' THEN 3
          WHEN 'interview' THEN 4
          WHEN 'offered' THEN 5
          WHEN 'rejected' THEN 6
        END
    `).all();
    const funnelMap = {
      applied: 0,
      read: 0,
      invited: 0,
      interview: 0,
      offered: 0,
      rejected: 0
    };
    for (const stat of funnelStats) {
      funnelMap[stat.status] = stat.count;
    }
    const result = [
      { status: "applied", label: "\u5DF2\u6295\u9012", count: funnelMap.applied },
      { status: "read", label: "\u5DF2\u67E5\u770B", count: funnelMap.read },
      { status: "invited", label: "\u5DF2\u9080\u8BF7", count: funnelMap.invited },
      { status: "interview", label: "\u9762\u8BD5\u4E2D", count: funnelMap.interview },
      { status: "offered", label: "\u5DF2\u5F55\u7528", count: funnelMap.offered }
    ];
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
router4.post("/", async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];
    const userRole = req.headers["x-user-role"];
    if (!userId || userRole !== "talent") {
      res.status(403).json({ success: false, error: "\u4EC5\u4EBA\u624D\u7528\u6237\u53EF\u6295\u9012" });
      return;
    }
    const { job_id } = req.body;
    if (!job_id) {
      res.status(400).json({ success: false, error: "\u7F3A\u5C11\u804C\u4F4DID" });
      return;
    }
    const talent = database_default.prepare("SELECT id FROM talent_profiles WHERE user_id = ?").get(userId);
    if (!talent) {
      res.status(404).json({ success: false, error: "\u4EBA\u624D\u8D44\u6599\u4E0D\u5B58\u5728" });
      return;
    }
    const job = database_default.prepare("SELECT * FROM jobs WHERE id = ? AND status = ?").get(job_id, "active");
    if (!job) {
      res.status(404).json({ success: false, error: "\u804C\u4F4D\u4E0D\u5B58\u5728\u6216\u5DF2\u5173\u95ED" });
      return;
    }
    const existing = database_default.prepare("SELECT id FROM applications WHERE job_id = ? AND talent_id = ?").get(job_id, talent.id);
    if (existing) {
      res.status(409).json({ success: false, error: "\u5DF2\u6295\u9012\u8FC7\u8BE5\u804C\u4F4D" });
      return;
    }
    const timeline = JSON.stringify([{ status: "applied", at: (/* @__PURE__ */ new Date()).toISOString() }]);
    const result = database_default.prepare("INSERT INTO applications (job_id, talent_id, status, timeline) VALUES (?, ?, ?, ?)").run(job_id, talent.id, "applied", timeline);
    const application = database_default.prepare("SELECT * FROM applications WHERE id = ?").get(result.lastInsertRowid);
    res.status(201).json({ success: true, data: application });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
router4.patch("/:id/status", async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];
    const userRole = req.headers["x-user-role"];
    if (!userId) {
      res.status(401).json({ success: false, error: "\u672A\u767B\u5F55" });
      return;
    }
    const { status, note } = req.body;
    if (!status) {
      res.status(400).json({ success: false, error: "\u7F3A\u5C11\u72B6\u6001" });
      return;
    }
    const application = database_default.prepare("SELECT * FROM applications WHERE id = ?").get(req.params.id);
    if (!application) {
      res.status(404).json({ success: false, error: "\u6295\u9012\u8BB0\u5F55\u4E0D\u5B58\u5728" });
      return;
    }
    const currentStatus = application.status;
    const validNext = VALID_TRANSITIONS[currentStatus];
    if (!validNext || !validNext.includes(status)) {
      res.status(400).json({ success: false, error: `\u65E0\u6CD5\u4ECE ${currentStatus} \u8F6C\u6362\u5230 ${status}` });
      return;
    }
    if (userRole === "talent" && status !== "applied") {
      res.status(403).json({ success: false, error: "\u4EBA\u624D\u7528\u6237\u65E0\u6CD5\u66F4\u6539\u6295\u9012\u72B6\u6001" });
      return;
    }
    const timeline = JSON.parse(application.timeline || "[]");
    const entry = { status, at: (/* @__PURE__ */ new Date()).toISOString() };
    if (note) entry.note = note;
    timeline.push(entry);
    const timestampField = STATUS_TIMESTAMP_FIELDS[status];
    const now = (/* @__PURE__ */ new Date()).toISOString();
    let updateQuery = "UPDATE applications SET status = ?, timeline = ?, updated_at = datetime('now')";
    const updateParams = [status, JSON.stringify(timeline)];
    if (timestampField) {
      updateQuery += `, ${timestampField} = ?`;
      updateParams.push(now);
    }
    updateQuery += " WHERE id = ?";
    updateParams.push(req.params.id);
    database_default.prepare(updateQuery).run(...updateParams);
    const updated = database_default.prepare("SELECT * FROM applications WHERE id = ?").get(req.params.id);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
router4.get("/:id", async (req, res) => {
  try {
    const application = database_default.prepare(`
      SELECT a.*, j.title as job_title, j.department, j.location, j.salary_min, j.salary_max, j.description as job_description,
      ip.institution_name, ip.institution_type,
      tp.title as talent_title, tp.department as talent_dept, u.name as talent_name
      FROM applications a
      JOIN jobs j ON a.job_id = j.id
      JOIN institution_profiles ip ON j.institution_id = ip.id
      JOIN talent_profiles tp ON a.talent_id = tp.id
      JOIN users u ON tp.user_id = u.id
      WHERE a.id = ?
    `).get(req.params.id);
    if (!application) {
      res.status(404).json({ success: false, error: "\u6295\u9012\u8BB0\u5F55\u4E0D\u5B58\u5728" });
      return;
    }
    application.timeline = JSON.parse(application.timeline || "[]");
    res.json({ success: true, data: application });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
var applications_default = router4;

// api/routes/messages.ts
import { Router as Router5 } from "express";
var router5 = Router5();
router5.get("/conversations", async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];
    const userRole = req.headers["x-user-role"];
    if (!userId) {
      res.status(401).json({ success: false, error: "\u672A\u767B\u5F55" });
      return;
    }
    let conversations;
    if (userRole === "talent") {
      const talent = database_default.prepare("SELECT id FROM talent_profiles WHERE user_id = ?").get(userId);
      if (!talent) {
        res.status(404).json({ success: false, error: "\u4EBA\u624D\u8D44\u6599\u4E0D\u5B58\u5728" });
        return;
      }
      conversations = database_default.prepare(`
        SELECT c.*, ip.institution_name, u.name as institution_user_name
        FROM conversations c
        JOIN institution_profiles ip ON c.institution_id = ip.id
        JOIN users u ON ip.user_id = u.id
        WHERE c.talent_id = ?
        ORDER BY c.updated_at DESC
      `).all(talent.id);
    } else if (userRole === "institution") {
      const instProfile = database_default.prepare("SELECT id FROM institution_profiles WHERE user_id = ?").get(userId);
      if (!instProfile) {
        res.status(404).json({ success: false, error: "\u673A\u6784\u8D44\u6599\u4E0D\u5B58\u5728" });
        return;
      }
      conversations = database_default.prepare(`
        SELECT c.*, tp.title as talent_title, tp.department as talent_dept, u.name as talent_name
        FROM conversations c
        JOIN talent_profiles tp ON c.talent_id = tp.id
        JOIN users u ON tp.user_id = u.id
        WHERE c.institution_id = ?
        ORDER BY c.updated_at DESC
      `).all(instProfile.id);
    } else {
      conversations = database_default.prepare(`
        SELECT c.*, ip.institution_name, u_inst.name as institution_user_name,
        tp.title as talent_title, u_talent.name as talent_name
        FROM conversations c
        JOIN institution_profiles ip ON c.institution_id = ip.id
        JOIN users u_inst ON ip.user_id = u_inst.id
        JOIN talent_profiles tp ON c.talent_id = tp.id
        JOIN users u_talent ON tp.user_id = u_talent.id
        ORDER BY c.updated_at DESC
      `).all();
    }
    res.json({ success: true, data: conversations });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
router5.get("/conversations/:id/messages", async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];
    if (!userId) {
      res.status(401).json({ success: false, error: "\u672A\u767B\u5F55" });
      return;
    }
    const conversation = database_default.prepare("SELECT * FROM conversations WHERE id = ?").get(req.params.id);
    if (!conversation) {
      res.status(404).json({ success: false, error: "\u4F1A\u8BDD\u4E0D\u5B58\u5728" });
      return;
    }
    const { before, limit = "20" } = req.query;
    const limitNum = Math.max(1, Math.min(100, Number(limit)));
    let messages;
    if (before) {
      messages = database_default.prepare(`
        SELECT * FROM messages WHERE conversation_id = ? AND id < ? ORDER BY id DESC LIMIT ?
      `).all(req.params.id, Number(before), limitNum);
    } else {
      messages = database_default.prepare(`
        SELECT * FROM messages WHERE conversation_id = ? ORDER BY id DESC LIMIT ?
      `).all(req.params.id, limitNum);
    }
    messages.reverse();
    res.json({ success: true, data: messages });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
router5.post("/send", async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];
    const userRole = req.headers["x-user-role"];
    if (!userId) {
      res.status(401).json({ success: false, error: "\u672A\u767B\u5F55" });
      return;
    }
    const { conversation_id, receiver_id, content, type = "text" } = req.body;
    if (!content) {
      res.status(400).json({ success: false, error: "\u6D88\u606F\u5185\u5BB9\u4E0D\u80FD\u4E3A\u7A7A" });
      return;
    }
    if (!["text", "resume_card", "job_card"].includes(type)) {
      res.status(400).json({ success: false, error: "\u65E0\u6548\u7684\u6D88\u606F\u7C7B\u578B" });
      return;
    }
    let convId = conversation_id;
    if (!convId && receiver_id) {
      let talentId = null;
      let institutionId = null;
      if (userRole === "talent") {
        const talent = database_default.prepare("SELECT id FROM talent_profiles WHERE user_id = ?").get(userId);
        talentId = talent?.id || null;
        const instProfile = database_default.prepare("SELECT id FROM institution_profiles WHERE user_id = ?").get(receiver_id);
        institutionId = instProfile?.id || null;
      } else if (userRole === "institution") {
        const instProfile = database_default.prepare("SELECT id FROM institution_profiles WHERE user_id = ?").get(userId);
        institutionId = instProfile?.id || null;
        const talent = database_default.prepare("SELECT id FROM talent_profiles WHERE user_id = ?").get(receiver_id);
        talentId = talent?.id || null;
      }
      if (!talentId || !institutionId) {
        res.status(400).json({ success: false, error: "\u65E0\u6CD5\u786E\u5B9A\u6536\u4EF6\u4EBA" });
        return;
      }
      let existing = database_default.prepare("SELECT id FROM conversations WHERE talent_id = ? AND institution_id = ?").get(talentId, institutionId);
      if (!existing) {
        const r = database_default.prepare("INSERT INTO conversations (talent_id, institution_id, last_message, updated_at) VALUES (?, ?, ?, datetime('now'))").run(talentId, institutionId, content);
        convId = Number(r.lastInsertRowid);
      } else {
        convId = existing.id;
      }
    }
    if (!convId) {
      res.status(400).json({ success: false, error: "\u7F3A\u5C11\u4F1A\u8BDD\u4FE1\u606F" });
      return;
    }
    const result = database_default.prepare("INSERT INTO messages (conversation_id, sender_id, sender_role, content, type) VALUES (?, ?, ?, ?, ?)").run(convId, userId, userRole, content, type);
    database_default.prepare("UPDATE conversations SET last_message = ?, updated_at = datetime('now') WHERE id = ?").run(content, convId);
    const message = database_default.prepare("SELECT * FROM messages WHERE id = ?").get(result.lastInsertRowid);
    res.status(201).json({ success: true, data: message });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
var messages_default = router5;

// api/routes/community.ts
import { Router as Router6 } from "express";
var router6 = Router6();
router6.get("/posts", async (req, res) => {
  try {
    const { category, tag, page = "1", limit = "10" } = req.query;
    const conditions = [];
    const params = [];
    if (category) {
      conditions.push("cp.category = ?");
      params.push(category);
    }
    if (tag) {
      conditions.push("cp.tags LIKE ?");
      params.push(`%${tag}%`);
    }
    const whereClause = conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : "";
    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.max(1, Math.min(100, Number(limit)));
    const offset = (pageNum - 1) * limitNum;
    const totalResult = database_default.prepare(`SELECT COUNT(*) as count FROM community_posts cp ${whereClause}`).get(...params);
    const posts = database_default.prepare(`
      SELECT cp.*, u.name as author_name, u.role as author_role
      FROM community_posts cp
      JOIN users u ON cp.author_id = u.id
      ${whereClause}
      ORDER BY cp.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, limitNum, offset);
    res.json({
      success: true,
      data: {
        items: posts,
        total: totalResult.count,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(totalResult.count / limitNum)
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
router6.get("/posts/new", async (req, res) => {
  res.json({
    success: true,
    data: {
      mode: "create",
      categories: ["news", "policy", "education"],
      draft: { title: "", content: "", tags: [], category: "policy" }
    }
  });
});
router6.get("/posts/:id/comments", async (req, res) => {
  try {
    const postId = Number(req.params.id);
    if (!Number.isFinite(postId)) {
      res.json({ success: true, data: { items: [], total: 0 } });
      return;
    }
    const comments = database_default.prepare(`
      SELECT c.*, u.name as author_name, u.role as author_role
      FROM comments c
      JOIN users u ON c.author_id = u.id
      WHERE c.post_id = ?
      ORDER BY c.created_at ASC
    `).all(postId);
    res.json({ success: true, data: { items: comments, total: comments.length } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
router6.get("/posts/:id", async (req, res) => {
  try {
    const post = database_default.prepare(`
      SELECT cp.*, u.name as author_name, u.role as author_role
      FROM community_posts cp
      JOIN users u ON cp.author_id = u.id
      WHERE cp.id = ?
    `).get(req.params.id);
    if (!post) {
      res.status(404).json({ success: false, error: "\u5E16\u5B50\u4E0D\u5B58\u5728" });
      return;
    }
    const comments = database_default.prepare(`
      SELECT c.*, u.name as author_name, u.role as author_role
      FROM comments c
      JOIN users u ON c.author_id = u.id
      WHERE c.post_id = ?
      ORDER BY c.created_at ASC
    `).all(req.params.id);
    res.json({ success: true, data: { ...post, commentList: comments } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
router6.post("/posts", async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];
    if (!userId) {
      res.status(401).json({ success: false, error: "\u672A\u767B\u5F55" });
      return;
    }
    const { title, content, tags, category } = req.body;
    if (!title || !content || !category) {
      res.status(400).json({ success: false, error: "\u7F3A\u5C11\u6807\u9898\u3001\u5185\u5BB9\u6216\u5206\u7C7B" });
      return;
    }
    if (!["news", "policy", "education"].includes(category)) {
      res.status(400).json({ success: false, error: "\u65E0\u6548\u7684\u5206\u7C7B" });
      return;
    }
    const result = database_default.prepare("INSERT INTO community_posts (author_id, title, content, tags, category) VALUES (?, ?, ?, ?, ?)").run(userId, title, content, JSON.stringify(tags || []), category);
    const post = database_default.prepare("SELECT * FROM community_posts WHERE id = ?").get(result.lastInsertRowid);
    res.status(201).json({ success: true, data: post });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
router6.put("/posts/:id", async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];
    if (!userId) {
      res.status(401).json({ success: false, error: "\u672A\u767B\u5F55" });
      return;
    }
    const existing = database_default.prepare("SELECT * FROM community_posts WHERE id = ?").get(req.params.id);
    if (!existing) {
      res.status(404).json({ success: false, error: "\u5E16\u5B50\u4E0D\u5B58\u5728" });
      return;
    }
    if (existing.author_id !== Number(userId) && req.headers["x-user-role"] !== "admin") {
      res.status(403).json({ success: false, error: "\u65E0\u6743\u4FEE\u6539\u6B64\u5E16\u5B50" });
      return;
    }
    const { title, content, tags, category } = req.body;
    database_default.prepare(`
      UPDATE community_posts SET title = COALESCE(?, title), content = COALESCE(?, content),
      tags = COALESCE(?, tags), category = COALESCE(?, category) WHERE id = ?
    `).run(title, content, tags ? JSON.stringify(tags) : null, category, req.params.id);
    const post = database_default.prepare("SELECT * FROM community_posts WHERE id = ?").get(req.params.id);
    res.json({ success: true, data: post });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
router6.delete("/posts/:id", async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];
    if (!userId) {
      res.status(401).json({ success: false, error: "\u672A\u767B\u5F55" });
      return;
    }
    const existing = database_default.prepare("SELECT * FROM community_posts WHERE id = ?").get(req.params.id);
    if (!existing) {
      res.status(404).json({ success: false, error: "\u5E16\u5B50\u4E0D\u5B58\u5728" });
      return;
    }
    if (existing.author_id !== Number(userId) && req.headers["x-user-role"] !== "admin") {
      res.status(403).json({ success: false, error: "\u65E0\u6743\u5220\u9664\u6B64\u5E16\u5B50" });
      return;
    }
    database_default.prepare("DELETE FROM comments WHERE post_id = ?").run(req.params.id);
    database_default.prepare("DELETE FROM community_posts WHERE id = ?").run(req.params.id);
    res.json({ success: true, data: null });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
router6.post("/posts/:id/like", async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];
    if (!userId) {
      res.status(401).json({ success: false, error: "\u672A\u767B\u5F55" });
      return;
    }
    const existing = database_default.prepare("SELECT * FROM community_posts WHERE id = ?").get(req.params.id);
    if (!existing) {
      res.status(404).json({ success: false, error: "\u5E16\u5B50\u4E0D\u5B58\u5728" });
      return;
    }
    database_default.prepare("UPDATE community_posts SET likes = likes + 1 WHERE id = ?").run(req.params.id);
    const post = database_default.prepare("SELECT * FROM community_posts WHERE id = ?").get(req.params.id);
    res.json({ success: true, data: post });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
router6.post("/posts/:id/comments", async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];
    if (!userId) {
      res.status(401).json({ success: false, error: "\u672A\u767B\u5F55" });
      return;
    }
    const { content } = req.body;
    if (!content) {
      res.status(400).json({ success: false, error: "\u8BC4\u8BBA\u5185\u5BB9\u4E0D\u80FD\u4E3A\u7A7A" });
      return;
    }
    const existing = database_default.prepare("SELECT * FROM community_posts WHERE id = ?").get(req.params.id);
    if (!existing) {
      res.status(404).json({ success: false, error: "\u5E16\u5B50\u4E0D\u5B58\u5728" });
      return;
    }
    const result = database_default.prepare("INSERT INTO comments (post_id, author_id, content) VALUES (?, ?, ?)").run(req.params.id, userId, content);
    database_default.prepare("UPDATE community_posts SET comments = comments + 1 WHERE id = ?").run(req.params.id);
    const comment = database_default.prepare("SELECT c.*, u.name as author_name, u.role as author_role FROM comments c JOIN users u ON c.author_id = u.id WHERE c.id = ?").get(result.lastInsertRowid);
    res.status(201).json({ success: true, data: comment });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
router6.delete("/comments/:id", async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];
    if (!userId) {
      res.status(401).json({ success: false, error: "\u672A\u767B\u5F55" });
      return;
    }
    const comment = database_default.prepare("SELECT * FROM comments WHERE id = ?").get(req.params.id);
    if (!comment) {
      res.status(404).json({ success: false, error: "\u8BC4\u8BBA\u4E0D\u5B58\u5728" });
      return;
    }
    if (comment.author_id !== Number(userId) && req.headers["x-user-role"] !== "admin") {
      res.status(403).json({ success: false, error: "\u65E0\u6743\u5220\u9664\u6B64\u8BC4\u8BBA" });
      return;
    }
    database_default.prepare("UPDATE community_posts SET comments = comments - 1 WHERE id = ?").run(comment.post_id);
    database_default.prepare("DELETE FROM comments WHERE id = ?").run(req.params.id);
    res.json({ success: true, data: null });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
var community_default = router6;

// api/routes/admin.ts
import { Router as Router7 } from "express";
var router7 = Router7();
router7.get("/institutions/review", async (req, res) => {
  try {
    const userRole = req.headers["x-user-role"];
    if (userRole !== "admin") {
      res.status(403).json({ success: false, error: "\u4EC5\u7BA1\u7406\u5458\u53EF\u8BBF\u95EE" });
      return;
    }
    const { status } = req.query;
    let institutions;
    if (status) {
      institutions = database_default.prepare(`
        SELECT ip.*, u.phone, u.verified, u.name as user_name
        FROM institution_profiles ip
        JOIN users u ON ip.user_id = u.id
        WHERE ip.review_status = ?
      `).all(status);
    } else {
      institutions = database_default.prepare(`
        SELECT ip.*, u.phone, u.verified, u.name as user_name
        FROM institution_profiles ip
        JOIN users u ON ip.user_id = u.id
      `).all();
    }
    res.json({ success: true, data: institutions });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
router7.put("/institutions/:id/review", async (req, res) => {
  try {
    const userRole = req.headers["x-user-role"];
    if (userRole !== "admin") {
      res.status(403).json({ success: false, error: "\u4EC5\u7BA1\u7406\u5458\u53EF\u64CD\u4F5C" });
      return;
    }
    const { review_status, last_review_date } = req.body;
    if (!["approved", "rejected", "pending"].includes(review_status)) {
      res.status(400).json({ success: false, error: "\u65E0\u6548\u7684\u5BA1\u6838\u72B6\u6001" });
      return;
    }
    const existing = database_default.prepare("SELECT * FROM institution_profiles WHERE id = ?").get(req.params.id);
    if (!existing) {
      res.status(404).json({ success: false, error: "\u673A\u6784\u4E0D\u5B58\u5728" });
      return;
    }
    database_default.prepare("UPDATE institution_profiles SET review_status = ?, last_review_date = COALESCE(?, last_review_date) WHERE id = ?").run(review_status, last_review_date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0], req.params.id);
    if (review_status === "approved") {
      database_default.prepare("UPDATE users SET verified = 1 WHERE id = ?").run(existing.user_id);
    }
    const institution = database_default.prepare("SELECT * FROM institution_profiles WHERE id = ?").get(req.params.id);
    res.json({ success: true, data: institution });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
router7.get("/jobs/review", async (req, res) => {
  try {
    const userRole = req.headers["x-user-role"];
    if (userRole !== "admin") {
      res.status(403).json({ success: false, error: "\u4EC5\u7BA1\u7406\u5458\u53EF\u8BBF\u95EE" });
      return;
    }
    const { status } = req.query;
    let jobs;
    if (status) {
      jobs = database_default.prepare(`
        SELECT j.*, ip.institution_name, ip.institution_type
        FROM jobs j
        JOIN institution_profiles ip ON j.institution_id = ip.id
        WHERE j.status = ?
      `).all(status);
    } else {
      jobs = database_default.prepare(`
        SELECT j.*, ip.institution_name, ip.institution_type
        FROM jobs j
        JOIN institution_profiles ip ON j.institution_id = ip.id
      `).all();
    }
    res.json({ success: true, data: jobs });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
router7.put("/jobs/:id/review", async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];
    const userRole = req.headers["x-user-role"];
    if (userRole !== "admin") {
      res.status(403).json({ success: false, error: "\u4EC5\u7BA1\u7406\u5458\u53EF\u64CD\u4F5C" });
      return;
    }
    const { status, review_note, ai_review_note } = req.body;
    if (!["active", "rejected"].includes(status)) {
      res.status(400).json({ success: false, error: "\u65E0\u6548\u7684\u5BA1\u6838\u72B6\u6001" });
      return;
    }
    const existing = database_default.prepare(`
      SELECT j.*, ip.verified_level, ip.institution_name, ip.license_expiry
      FROM jobs j
      JOIN institution_profiles ip ON j.institution_id = ip.id
      WHERE j.id = ?
    `).get(req.params.id);
    if (!existing) {
      res.status(404).json({ success: false, error: "\u804C\u4F4D\u4E0D\u5B58\u5728" });
      return;
    }
    if (status === "active" && (existing.verified_level || 0) < 2) {
      const levelText = (existing.verified_level || 0) === 1 ? "\u57FA\u7840\u8BA4\u8BC1" : "\u672A\u8BA4\u8BC1";
      res.status(400).json({
        success: false,
        error: `\u673A\u6784"${existing.institution_name}"\u5F53\u524D\u4E3A${levelText}\uFF0C\u9700\u5B8C\u6210\u9AD8\u7EA7\u8BA4\u8BC1\u540E\u65B9\u53EF\u53D1\u5E03\u804C\u4F4D\u3002\u8BF7\u5148\u901A\u8FC7\u673A\u6784\u8D44\u8D28\u5BA1\u6838\u3002`,
        code: "INSTITUTION_NOT_FULLY_VERIFIED"
      });
      return;
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    database_default.prepare(`
      UPDATE jobs SET status = ?, approved_by = ?, approved_at = ?, review_note = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(status, userId, now, review_note, req.params.id);
    const job = database_default.prepare(`
      SELECT j.*, u.name as approved_by_name, ip.verified_level, ip.institution_name
      FROM jobs j
      LEFT JOIN users u ON j.approved_by = u.id
      JOIN institution_profiles ip ON j.institution_id = ip.id
      WHERE j.id = ?
    `).get(req.params.id);
    res.json({ success: true, data: { job, ai_review_note: ai_review_note || `AI\u5BA1\u6838\u5B8C\u6210\uFF0C\u98CE\u9669\u8BC4\u5206: ${existing.ai_risk_score}/100` } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
router7.post("/resumes/mask", async (req, res) => {
  try {
    const userRole = req.headers["x-user-role"];
    if (userRole !== "admin") {
      res.status(403).json({ success: false, error: "\u4EC5\u7BA1\u7406\u5458\u53EF\u64CD\u4F5C" });
      return;
    }
    const { resume_ids } = req.body;
    if (!resume_ids || !Array.isArray(resume_ids) || resume_ids.length === 0) {
      res.status(400).json({ success: false, error: "\u8BF7\u63D0\u4F9B\u7B80\u5386ID\u5217\u8868" });
      return;
    }
    const masked = [];
    for (const rid of resume_ids) {
      const resume = database_default.prepare("SELECT r.*, u.name as talent_name FROM resumes r JOIN talent_profiles tp ON r.talent_id = tp.id JOIN users u ON tp.user_id = u.id WHERE r.id = ?").get(rid);
      if (!resume) continue;
      const basicInfo = JSON.parse(resume.basic_info || "{}");
      if (basicInfo.phone) basicInfo.phone = basicInfo.phone.replace(/(\d{3})\d{4}(\d{4})/, "$1****$2");
      if (basicInfo.email) basicInfo.email = basicInfo.email.replace(/(.{2}).*(@.*)/, "$1***$2");
      const maskedName = resume.talent_name ? resume.talent_name.charAt(0) + "**" : "***";
      masked.push({
        id: resume.id,
        talent_name: maskedName,
        basic_info: basicInfo,
        masked_fields: ["phone", "email", "real_name"]
      });
    }
    res.json({ success: true, data: masked });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
router7.get("/dashboard", async (req, res) => {
  try {
    const totalUsers = database_default.prepare("SELECT COUNT(*) as count FROM users").get().count;
    const totalTalents = database_default.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'talent'").get().count;
    const totalInstitutions = database_default.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'institution'").get().count;
    const totalJobs = database_default.prepare("SELECT COUNT(*) as count FROM jobs").get().count;
    const activeJobs = database_default.prepare("SELECT COUNT(*) as count FROM jobs WHERE status = 'active'").get().count;
    const totalApplications = database_default.prepare("SELECT COUNT(*) as count FROM applications").get().count;
    const totalResumes = database_default.prepare("SELECT COUNT(*) as count FROM resumes").get().count;
    const pendingReviews = database_default.prepare("SELECT COUNT(*) as count FROM institution_profiles WHERE review_status = 'pending'").get().count;
    const pendingJobs = database_default.prepare("SELECT COUNT(*) as count FROM jobs WHERE status = 'pending'").get().count;
    const applicationFunnel = database_default.prepare(`
      SELECT status, COUNT(*) as count FROM applications GROUP BY status ORDER BY
        CASE status
          WHEN 'applied' THEN 1
          WHEN 'read' THEN 2
          WHEN 'invited' THEN 3
          WHEN 'interview' THEN 4
          WHEN 'offered' THEN 5
          WHEN 'rejected' THEN 6
        END
    `).all();
    const regionHeatmap = database_default.prepare(`
      SELECT j.location as region, ip.institution_type, COUNT(*) as count
      FROM jobs j
      JOIN institution_profiles ip ON j.institution_id = ip.id
      WHERE j.status = 'active'
      GROUP BY j.location, ip.institution_type
      ORDER BY count DESC
    `).all();
    const departmentHeatmap = database_default.prepare(`
      SELECT j.department, j.required_title, COUNT(*) as count
      FROM jobs j
      WHERE j.status = 'active'
      GROUP BY j.department, j.required_title
      ORDER BY count DESC
    `).all();
    const positionHeatmap = database_default.prepare(`
      SELECT j.required_title as position, COUNT(*) as count
      FROM jobs j WHERE j.status = 'active' GROUP BY j.required_title ORDER BY count DESC
    `).all();
    const applicationStatusDist = database_default.prepare(`
      SELECT status, COUNT(*) as count FROM applications GROUP BY status
    `).all();
    const monthlyApplications = database_default.prepare(`
      SELECT strftime('%Y-%m', a.created_at) as month, j.department, COUNT(*) as count
      FROM applications a
      JOIN jobs j ON a.job_id = j.id
      GROUP BY month, j.department
      ORDER BY month DESC, count DESC
      LIMIT 24
    `).all();
    const monthlyJobs = database_default.prepare(`
      SELECT strftime('%Y-%m', created_at) as month, COUNT(*) as count
      FROM jobs GROUP BY month ORDER BY month DESC LIMIT 6
    `).all();
    const institutionsPendingRenewal = database_default.prepare(`
      SELECT COUNT(*) as count FROM institution_profiles
      WHERE license_expiry IS NOT NULL
      AND date(license_expiry) <= date('now', '+90 days')
      AND review_status = 'approved'
    `).get().count;
    const highRiskJobs = database_default.prepare(`
      SELECT COUNT(*) as count FROM jobs
      WHERE ai_risk_score >= 30 AND status IN ('pending', 'active')
    `).get().count;
    const pendingReviewItems = database_default.prepare(`
      SELECT j.id, j.title, ip.institution_name
      FROM jobs j
      JOIN institution_profiles ip ON j.institution_id = ip.id
      WHERE j.status = 'pending'
      ORDER BY j.updated_at DESC
      LIMIT 6
    `).all();
    const expiringInstitutionItems = database_default.prepare(`
      SELECT id, institution_name, license_expiry
      FROM institution_profiles
      WHERE license_expiry IS NOT NULL
      AND date(license_expiry) <= date('now', '+90 days')
      AND review_status = 'approved'
      ORDER BY license_expiry ASC
      LIMIT 6
    `).all();
    const highRiskJobItems = database_default.prepare(`
      SELECT j.id, j.title, j.ai_risk_score, ip.institution_name
      FROM jobs j
      JOIN institution_profiles ip ON j.institution_id = ip.id
      WHERE j.ai_risk_score >= 30 AND j.status IN ('pending', 'active')
      ORDER BY j.ai_risk_score DESC
      LIMIT 6
    `).all();
    const months = [...new Set(monthlyApplications.map((item) => item.month))].slice(0, 6).reverse();
    const departments = [...new Set(monthlyApplications.map((item) => item.department))];
    const monthlyTrendByDept = months.map((month) => {
      const monthData = { month };
      for (const dept of departments) {
        const record = monthlyApplications.find((r) => r.month === month && r.department === dept);
        monthData[dept] = record ? record.count : 0;
      }
      return monthData;
    });
    res.json({
      success: true,
      data: {
        overview: { totalUsers, totalTalents, totalInstitutions, totalJobs, activeJobs, totalApplications, totalResumes, pendingReviews, pendingJobs },
        funnel: applicationFunnel,
        heatmaps: {
          region: regionHeatmap,
          department: departmentHeatmap,
          position: positionHeatmap
        },
        distributions: { applicationStatus: applicationStatusDist },
        trends: {
          applications: monthlyJobs,
          jobs: monthlyJobs,
          byDepartment: monthlyTrendByDept
        },
        compliance: {
          pendingJobsReview: pendingJobs,
          institutionsPendingRenewal,
          highRiskJobs,
          pendingReviews: pendingReviewItems.map((item) => ({
            id: String(item.id),
            title: `${item.institution_name} \xB7 ${item.title}`,
            type: "job",
            status: "pending"
          })),
          expiringInstitutions: expiringInstitutionItems.map((item) => ({
            id: String(item.id),
            title: `${item.institution_name} \xB7 ${item.license_expiry}`,
            type: "institution",
            status: "expired"
          })),
          highRiskJobItems: highRiskJobItems.map((item) => ({
            id: String(item.id),
            title: `${item.institution_name} \xB7 ${item.title} \xB7 \u98CE\u9669 ${item.ai_risk_score}`,
            type: "job",
            status: "highRisk"
          }))
        }
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
var admin_default = router7;

// api/app.ts
dotenv.config({ quiet: true });
var app = express();
app.use(cors({
  origin: ["http://127.0.0.1:49180", "http://localhost:49180"],
  credentials: true
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use("/api/auth", auth_default);
app.use("/api/users", auth_default);
app.use("/api/user", auth_default);
app.use("/api/jobs", jobs_default);
app.use("/api/resumes", resumes_default);
app.use("/api/applications", applications_default);
app.use("/api/messages", messages_default);
app.use("/api/community", community_default);
app.use("/api/admin", admin_default);
app.use(
  "/api/health",
  (req, res, next) => {
    res.status(200).json({
      success: true,
      message: "ok"
    });
  }
);
app.use((error, req, res, next) => {
  res.status(500).json({
    success: false,
    error: "Server internal error"
  });
});
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "API not found"
  });
});
var app_default = app;

// api/server.ts
var HOST = process.env.HOST || "127.0.0.1";
var PORT = Number(process.env.BACKEND_PORT || process.env.PORT || 59180);
var server = app_default.listen(PORT, HOST, () => {
  console.log(`Server ready on http://${HOST}:${PORT}`);
});
process.on("SIGTERM", () => {
  console.log("SIGTERM signal received");
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});
process.on("SIGINT", () => {
  console.log("SIGINT signal received");
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});
var server_default = app_default;
export {
  server_default as default
};
