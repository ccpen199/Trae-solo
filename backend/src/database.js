const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '../../data/app.sqlite');
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('business_owner', 'model_ops', 'auditor', 'user')),
      name TEXT NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
    );

    CREATE TABLE IF NOT EXISTS interviews (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'transcribing', 'transcribed', 'reviewing', 'clustering', 'summarizing', 'completed', 'archived')),
      recording_path TEXT,
      recording_duration INTEGER,
      interviewee_name TEXT,
      interviewee_role TEXT,
      interview_date INTEGER,
      created_by TEXT NOT NULL REFERENCES users(id),
      created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
      version INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS transcripts (
      id TEXT PRIMARY KEY,
      interview_id TEXT NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      language TEXT,
      confidence REAL,
      created_by TEXT REFERENCES users(id),
      created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
      version INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS speakers (
      id TEXT PRIMARY KEY,
      interview_id TEXT NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      role TEXT,
      color TEXT,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
    );

    CREATE TABLE IF NOT EXISTS transcript_segments (
      id TEXT PRIMARY KEY,
      transcript_id TEXT NOT NULL REFERENCES transcripts(id) ON DELETE CASCADE,
      speaker_id TEXT REFERENCES speakers(id),
      start_time REAL NOT NULL,
      end_time REAL NOT NULL,
      text TEXT NOT NULL,
      confidence REAL,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
    );

    CREATE TABLE IF NOT EXISTS topics (
      id TEXT PRIMARY KEY,
      interview_id TEXT NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      description TEXT,
      keywords TEXT,
      cluster_id INTEGER,
      sentiment TEXT CHECK(sentiment IN ('positive', 'neutral', 'negative')),
      created_by TEXT REFERENCES users(id),
      created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
    );

    CREATE TABLE IF NOT EXISTS pain_points (
      id TEXT PRIMARY KEY,
      interview_id TEXT NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
      topic_id TEXT REFERENCES topics(id),
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      severity TEXT CHECK(severity IN ('low', 'medium', 'high', 'critical')),
      frequency TEXT CHECK(frequency IN ('rare', 'occasional', 'frequent', 'constant')),
      status TEXT NOT NULL DEFAULT 'identified' CHECK(status IN ('identified', 'validated', 'addressed', 'rejected')),
      created_by TEXT REFERENCES users(id),
      created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
    );

    CREATE TABLE IF NOT EXISTS evidence (
      id TEXT PRIMARY KEY,
      interview_id TEXT NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
      pain_point_id TEXT REFERENCES pain_points(id),
      topic_id TEXT REFERENCES topics(id),
      segment_id TEXT REFERENCES transcript_segments(id),
      quote TEXT NOT NULL,
      context TEXT,
      relevance_score REAL,
      verified BOOLEAN DEFAULT 0,
      verified_by TEXT REFERENCES users(id),
      verified_at INTEGER,
      created_by TEXT REFERENCES users(id),
      created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
    );

    CREATE TABLE IF NOT EXISTS summaries (
      id TEXT PRIMARY KEY,
      interview_id TEXT NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
      type TEXT NOT NULL CHECK(type IN ('executive', 'detailed', 'action_items')),
      content TEXT NOT NULL,
      created_by TEXT REFERENCES users(id),
      created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
      version INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS workflow_tasks (
      id TEXT PRIMARY KEY,
      interview_id TEXT NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
      type TEXT NOT NULL CHECK(type IN ('speaker_confusion', 'missing_transcript', 'over_generalization', 'insufficient_evidence')),
      title TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open', 'in_progress', 'resolved', 'closed')),
      assignee TEXT REFERENCES users(id),
      suggested_action TEXT,
      resolution TEXT,
      closed_by TEXT REFERENCES users(id),
      closed_at INTEGER,
      created_by TEXT REFERENCES users(id),
      created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      interview_id TEXT REFERENCES interviews(id),
      action_type TEXT NOT NULL,
      object_type TEXT NOT NULL,
      object_id TEXT NOT NULL,
      actor_id TEXT REFERENCES users(id),
      actor_name TEXT,
      change_reason TEXT,
      affected_fields TEXT,
      old_values TEXT,
      new_values TEXT,
      recovery_path TEXT,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
    );

    CREATE INDEX IF NOT EXISTS idx_interviews_status ON interviews(status);
    CREATE INDEX IF NOT EXISTS idx_interviews_date ON interviews(interview_date);
    CREATE INDEX IF NOT EXISTS idx_topics_interview ON topics(interview_id);
    CREATE INDEX IF NOT EXISTS idx_pain_points_interview ON pain_points(interview_id);
    CREATE INDEX IF NOT EXISTS idx_evidence_interview ON evidence(interview_id);
    CREATE INDEX IF NOT EXISTS idx_audit_interview ON audit_logs(interview_id);
    CREATE INDEX IF NOT EXISTS idx_tasks_status ON workflow_tasks(status);
    CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON workflow_tasks(assignee);
  `);

  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount === 0) {
    const insertUser = db.prepare(`
      INSERT INTO users (id, username, role, name) VALUES (?, ?, ?, ?)
    `);
    insertUser.run('user_biz', 'biz_manager', 'business_owner', '业务负责人');
    insertUser.run('user_ops', 'model_ops', 'model_ops', '模型运营');
    insertUser.run('user_auditor', 'auditor', 'auditor', '审核人员');
    insertUser.run('user_front', 'front_user', 'user', '一线使用者');
  }
}

module.exports = { db, initDatabase };
