import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = path.join(__dirname, '../../data/crowdsourcing.sqlite');
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const createTables = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      avatar TEXT,
      phone TEXT,
      userType TEXT NOT NULL CHECK(userType IN ('admin', 'platform', 'ops')),
      status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'banned')),
      realNameVerified INTEGER DEFAULT 0,
      idCardNo TEXT,
      idCardFront TEXT,
      idCardBack TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS providers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER UNIQUE NOT NULL,
      categoryId INTEGER,
      bio TEXT,
      skills TEXT,
      rating REAL DEFAULT 5.0,
      level INTEGER DEFAULT 1,
      completedTasks INTEGER DEFAULT 0,
      totalEarnings REAL DEFAULT 0,
      location TEXT,
      verificationStatus TEXT DEFAULT 'pending' CHECK(verificationStatus IN ('pending', 'verified', 'rejected')),
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (categoryId) REFERENCES categories(id)
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      icon TEXT,
      description TEXT,
      sortOrder INTEGER DEFAULT 0,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      requestNo TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      categoryId INTEGER NOT NULL,
      employerId INTEGER NOT NULL,
      providerId INTEGER,
      budgetMin REAL NOT NULL,
      budgetMax REAL NOT NULL,
      deadline TEXT NOT NULL,
      status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'pending_review', 'published', 'bidding', 'in_progress', 'reviewing', 'revision', 'completed', 'cancelled', 'disputed')),
      skillsRequired TEXT,
      attachments TEXT,
      deliveryDays INTEGER,
      reviewRemark TEXT,
      reviewBy INTEGER,
      reviewAt TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (categoryId) REFERENCES categories(id),
      FOREIGN KEY (employerId) REFERENCES users(id),
      FOREIGN KEY (providerId) REFERENCES providers(id),
      FOREIGN KEY (reviewBy) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS bids (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      taskId INTEGER NOT NULL,
      providerId INTEGER NOT NULL,
      bidAmount REAL NOT NULL,
      deliveryDays INTEGER NOT NULL,
      proposal TEXT NOT NULL,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'accepted', 'rejected')),
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (taskId) REFERENCES tasks(id) ON DELETE CASCADE,
      FOREIGN KEY (providerId) REFERENCES providers(id),
      UNIQUE(taskId, providerId)
    );

    CREATE TABLE IF NOT EXISTS submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      taskId INTEGER NOT NULL,
      providerId INTEGER NOT NULL,
      version INTEGER DEFAULT 1,
      title TEXT NOT NULL,
      description TEXT,
      files TEXT,
      hash TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (taskId) REFERENCES tasks(id) ON DELETE CASCADE,
      FOREIGN KEY (providerId) REFERENCES providers(id)
    );

    CREATE TABLE IF NOT EXISTS review_comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      taskId INTEGER NOT NULL,
      submissionId INTEGER NOT NULL,
      reviewerId INTEGER NOT NULL,
      content TEXT NOT NULL,
      rating INTEGER,
      status TEXT DEFAULT 'comment' CHECK(status IN ('comment', 'accepted', 'rejected')),
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (taskId) REFERENCES tasks(id) ON DELETE CASCADE,
      FOREIGN KEY (submissionId) REFERENCES submissions(id) ON DELETE CASCADE,
      FOREIGN KEY (reviewerId) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      conversationId TEXT NOT NULL,
      senderId INTEGER NOT NULL,
      receiverId INTEGER NOT NULL,
      content TEXT NOT NULL,
      type TEXT DEFAULT 'text' CHECK(type IN ('text', 'image', 'file', 'system')),
      isRead INTEGER DEFAULT 0,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (senderId) REFERENCES users(id),
      FOREIGN KEY (receiverId) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      transactionNo TEXT UNIQUE NOT NULL,
      taskId INTEGER NOT NULL,
      payerId INTEGER NOT NULL,
      payeeId INTEGER NOT NULL,
      amount REAL NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('escrow', 'milestone', 'release', 'refund')),
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'completed', 'failed', 'refunded')),
      milestone TEXT,
      remark TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (taskId) REFERENCES tasks(id),
      FOREIGN KEY (payerId) REFERENCES users(id),
      FOREIGN KEY (payeeId) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS ip_certificates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      submissionId INTEGER,
      taskId INTEGER,
      providerId INTEGER,
      hash TEXT NOT NULL UNIQUE,
      type TEXT NOT NULL CHECK(type IN ('submission', 'copyright', 'trademark', 'patent')),
      title TEXT NOT NULL,
      description TEXT,
      evidence TEXT,
      registrationNo TEXT,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'registered', 'rejected')),
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (submissionId) REFERENCES submissions(id),
      FOREIGN KEY (taskId) REFERENCES tasks(id),
      FOREIGN KEY (providerId) REFERENCES providers(id)
    );

    CREATE TABLE IF NOT EXISTS disputes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      taskId INTEGER NOT NULL,
      complainantId INTEGER NOT NULL,
      respondentId INTEGER NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      evidence TEXT,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'processing', 'resolved', 'closed')),
      arbitratorId INTEGER,
      arbitrationResult TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      resolvedAt TEXT,
      FOREIGN KEY (taskId) REFERENCES tasks(id),
      FOREIGN KEY (complainantId) REFERENCES users(id),
      FOREIGN KEY (respondentId) REFERENCES users(id),
      FOREIGN KEY (arbitratorId) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER,
      module TEXT NOT NULL,
      action TEXT NOT NULL,
      targetId INTEGER,
      targetType TEXT,
      details TEXT,
      ip TEXT,
      userAgent TEXT,
      riskLevel TEXT DEFAULT 'low' CHECK(riskLevel IN ('low', 'medium', 'high')),
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS portfolio_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      providerId INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      categoryId INTEGER,
      images TEXT,
      files TEXT,
      tags TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (providerId) REFERENCES providers(id) ON DELETE CASCADE,
      FOREIGN KEY (categoryId) REFERENCES categories(id)
    );

    CREATE TABLE IF NOT EXISTS verification_docs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      providerId INTEGER NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      fileUrl TEXT NOT NULL,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'verified', 'rejected')),
      remark TEXT,
      verifiedAt TEXT,
      verifiedBy INTEGER,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (providerId) REFERENCES providers(id) ON DELETE CASCADE,
      FOREIGN KEY (verifiedBy) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS ratings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      taskId INTEGER NOT NULL,
      raterId INTEGER NOT NULL,
      rateeId INTEGER NOT NULL,
      score INTEGER NOT NULL CHECK(score >= 1 AND score <= 5),
      content TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (taskId) REFERENCES tasks(id),
      FOREIGN KEY (raterId) REFERENCES users(id),
      FOREIGN KEY (rateeId) REFERENCES users(id),
      UNIQUE(taskId, raterId, rateeId)
    );

    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_type ON users(userType);
    CREATE INDEX IF NOT EXISTS idx_providers_userId ON providers(userId);
    CREATE INDEX IF NOT EXISTS idx_providers_category ON providers(categoryId);
    CREATE INDEX IF NOT EXISTS idx_providers_rating ON providers(rating);
    CREATE INDEX IF NOT EXISTS idx_providers_level ON providers(level);
    CREATE INDEX IF NOT EXISTS idx_tasks_employer ON tasks(employerId);
    CREATE INDEX IF NOT EXISTS idx_tasks_provider ON tasks(providerId);
    CREATE INDEX IF NOT EXISTS idx_tasks_category ON tasks(categoryId);
    CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
    CREATE INDEX IF NOT EXISTS idx_tasks_requestNo ON tasks(requestNo);
    CREATE INDEX IF NOT EXISTS idx_tasks_budget ON tasks(budgetMin, budgetMax);
    CREATE INDEX IF NOT EXISTS idx_bids_task ON bids(taskId);
    CREATE INDEX IF NOT EXISTS idx_bids_provider ON bids(providerId);
    CREATE INDEX IF NOT EXISTS idx_bids_status ON bids(status);
    CREATE INDEX IF NOT EXISTS idx_submissions_task ON submissions(taskId);
    CREATE INDEX IF NOT EXISTS idx_submissions_provider ON submissions(providerId);
    CREATE INDEX IF NOT EXISTS idx_submissions_hash ON submissions(hash);
    CREATE INDEX IF NOT EXISTS idx_reviews_task ON review_comments(taskId);
    CREATE INDEX IF NOT EXISTS idx_reviews_submission ON review_comments(submissionId);
    CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversationId);
    CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(senderId);
    CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiverId);
    CREATE INDEX IF NOT EXISTS idx_messages_read ON messages(isRead);
    CREATE INDEX IF NOT EXISTS idx_payments_task ON payments(taskId);
    CREATE INDEX IF NOT EXISTS idx_payments_transactionNo ON payments(transactionNo);
    CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
    CREATE INDEX IF NOT EXISTS idx_ip_hash ON ip_certificates(hash);
    CREATE INDEX IF NOT EXISTS idx_ip_task ON ip_certificates(taskId);
    CREATE INDEX IF NOT EXISTS idx_disputes_task ON disputes(taskId);
    CREATE INDEX IF NOT EXISTS idx_disputes_status ON disputes(status);
    CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(userId);
    CREATE INDEX IF NOT EXISTS idx_audit_module ON audit_logs(module);
    CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);
    CREATE INDEX IF NOT EXISTS idx_audit_risk ON audit_logs(riskLevel);
    CREATE INDEX IF NOT EXISTS idx_audit_createdAt ON audit_logs(createdAt);
    CREATE INDEX IF NOT EXISTS idx_portfolio_provider ON portfolio_items(providerId);
    CREATE INDEX IF NOT EXISTS idx_portfolio_category ON portfolio_items(categoryId);
    CREATE INDEX IF NOT EXISTS idx_ratings_task ON ratings(taskId);
    CREATE INDEX IF NOT EXISTS idx_ratings_ratee ON ratings(rateeId);
  `);
};

const migrate = () => {
  const taskColumns = db.prepare("PRAGMA table_info(tasks)").all() as { name: string }[];
  const columnNames = taskColumns.map(col => col.name);
  if (!columnNames.includes('deliveryDays')) {
    db.exec('ALTER TABLE tasks ADD COLUMN deliveryDays INTEGER');
  }
};

createTables();
migrate();

export default db;
