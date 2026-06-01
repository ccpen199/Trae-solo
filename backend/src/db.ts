import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const dbPath = path.join(__dirname, '..', 'data', 'app.sqlite');

export const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export type Status = 'pending' | 'accepted' | 'supplementing' | 'processing' | 'fixed' | 'verifying' | 'closed';
export type ProblemType = 'bug' | 'feature' | 'performance' | 'ui' | 'other';
export type Severity = 'critical' | 'major' | 'minor' | 'trivial';

export interface Feedback {
  id: string;
  title: string;
  description: string;
  page_url: string;
  browser_info: string;
  os_info: string;
  screen_resolution: string;
  user_agent: string;
  problem_type: ProblemType;
  severity: Severity;
  contact: string;
  reproduce_steps: string;
  console_errors: string | null;
  network_errors: string | null;
  status: Status;
  module: string;
  version: string;
  affected_users_count: number;
  source_channel: string;
  merge_parent_id: string | null;
  defect_id: string | null;
  assignee: string | null;
  verifier: string | null;
  close_reason: string | null;
  created_at: number;
  updated_at: number;
}

export interface Attachment {
  id: string;
  feedback_id: string;
  filename: string;
  original_name: string;
  file_path: string;
  file_size: number;
  content_type: string;
  created_at: number;
}

export interface StatusLog {
  id: string;
  feedback_id: string;
  old_status: string;
  new_status: string;
  operator: string;
  remark: string;
  created_at: number;
}

export interface Comment {
  id: string;
  feedback_id: string;
  author: string;
  content: string;
  created_at: number;
}

export interface Defect {
  id: string;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'critical' | 'high' | 'medium' | 'low';
  assignee: string;
  created_by: string;
  created_at: number;
  updated_at: number;
}

export function initDb(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS feedbacks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      page_url TEXT,
      browser_info TEXT,
      os_info TEXT,
      screen_resolution TEXT,
      user_agent TEXT,
      problem_type TEXT NOT NULL CHECK(problem_type IN ('bug', 'feature', 'performance', 'ui', 'other')),
      severity TEXT NOT NULL CHECK(severity IN ('critical', 'major', 'minor', 'trivial')),
      contact TEXT,
      reproduce_steps TEXT,
      console_errors TEXT,
      network_errors TEXT,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'accepted', 'supplementing', 'processing', 'fixed', 'verifying', 'closed')),
      module TEXT,
      version TEXT,
      affected_users_count INTEGER DEFAULT 1,
      source_channel TEXT,
      merge_parent_id TEXT,
      defect_id TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (merge_parent_id) REFERENCES feedbacks(id)
    );

    CREATE TABLE IF NOT EXISTS attachments (
      id TEXT PRIMARY KEY,
      feedback_id TEXT NOT NULL,
      filename TEXT NOT NULL,
      original_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      content_type TEXT,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (feedback_id) REFERENCES feedbacks(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS status_logs (
      id TEXT PRIMARY KEY,
      feedback_id TEXT NOT NULL,
      old_status TEXT,
      new_status TEXT NOT NULL,
      operator TEXT,
      remark TEXT,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (feedback_id) REFERENCES feedbacks(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY,
      feedback_id TEXT NOT NULL,
      author TEXT,
      content TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (feedback_id) REFERENCES feedbacks(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS defects (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open', 'in_progress', 'resolved', 'closed')),
      priority TEXT NOT NULL DEFAULT 'medium' CHECK(priority IN ('critical', 'high', 'medium', 'low')),
      assignee TEXT,
      created_by TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_feedbacks_status ON feedbacks(status);
    CREATE INDEX IF NOT EXISTS idx_feedbacks_module ON feedbacks(module);
    CREATE INDEX IF NOT EXISTS idx_feedbacks_version ON feedbacks(version);
    CREATE INDEX IF NOT EXISTS idx_feedbacks_source_channel ON feedbacks(source_channel);
    CREATE INDEX IF NOT EXISTS idx_feedbacks_created_at ON feedbacks(created_at);
    CREATE INDEX IF NOT EXISTS idx_attachments_feedback_id ON attachments(feedback_id);
    CREATE INDEX IF NOT EXISTS idx_status_logs_feedback_id ON status_logs(feedback_id);
    CREATE INDEX IF NOT EXISTS idx_comments_feedback_id ON comments(feedback_id);
    CREATE INDEX IF NOT EXISTS idx_defects_status ON defects(status);
    CREATE INDEX IF NOT EXISTS idx_defects_priority ON defects(priority);
  `);

  // 添加新列（如果不存在）
  try {
    db.exec(`ALTER TABLE feedbacks ADD COLUMN assignee TEXT`);
  } catch (e) {}
  try {
    db.exec(`ALTER TABLE feedbacks ADD COLUMN verifier TEXT`);
  } catch (e) {}
  try {
    db.exec(`ALTER TABLE feedbacks ADD COLUMN close_reason TEXT`);
  } catch (e) {}
}
