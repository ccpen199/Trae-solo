import db from './index';
import bcrypt from 'bcryptjs';

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('user', 'coach', 'advisor', 'admin')),
      email TEXT,
      phone TEXT,
      age INTEGER,
      gender TEXT,
      baseline_data TEXT,
      medical_history TEXT,
      contraindications TEXT,
      emergency_contact TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS devices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      device_type TEXT NOT NULL CHECK(device_type IN ('band', 'watch', 'web', 'other')),
      device_name TEXT NOT NULL,
      device_uuid TEXT UNIQUE NOT NULL,
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'disconnected', 'revoked', 'suspended')),
      last_sync_at DATETIME,
      auth_token TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS device_data (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      device_id INTEGER NOT NULL,
      data_type TEXT NOT NULL CHECK(data_type IN ('steps', 'heart_rate', 'sleep', 'track', 'calories')),
      data_value TEXT NOT NULL,
      sample_time DATETIME NOT NULL,
      source_hash TEXT NOT NULL,
      sync_batch_id TEXT,
      status TEXT NOT NULL DEFAULT 'normal' CHECK(status IN ('normal', 'duplicate', 'anomalous', 'revoked', 'pending_review')),
      anomaly_type TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (device_id) REFERENCES devices(id)
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_device_data_unique ON device_data(user_id, device_id, data_type, sample_time, source_hash);

    CREATE TABLE IF NOT EXISTS goals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      goal_type TEXT NOT NULL CHECK(goal_type IN ('fat_loss', 'muscle_gain', 'running', 'rehabilitation', 'general')),
      target_value REAL,
      current_value REAL DEFAULT 0,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      baseline_data TEXT,
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'completed', 'suspended', 'cancelled', 'pending_review')),
      created_by INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS training_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      goal_id INTEGER,
      plan_name TEXT NOT NULL,
      plan_type TEXT NOT NULL,
      description TEXT,
      intensity TEXT CHECK(intensity IN ('low', 'medium', 'high')),
      frequency_per_week INTEGER,
      rest_days TEXT,
      exercises TEXT,
      duration_weeks INTEGER,
      status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'pending_approval', 'approved', 'rejected', 'active', 'suspended', 'completed', 'cancelled', 'returned')),
      version INTEGER DEFAULT 1,
      parent_id INTEGER,
      generated_by TEXT NOT NULL CHECK(generated_by IN ('system', 'coach', 'user')),
      created_by INTEGER NOT NULL,
      approved_by INTEGER,
      approved_at DATETIME,
      rejection_reason TEXT,
      return_reason TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (goal_id) REFERENCES goals(id),
      FOREIGN KEY (created_by) REFERENCES users(id),
      FOREIGN KEY (approved_by) REFERENCES users(id),
      FOREIGN KEY (parent_id) REFERENCES training_plans(id)
    );

    CREATE TABLE IF NOT EXISTS workout_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      plan_id INTEGER,
      device_id INTEGER,
      workout_type TEXT NOT NULL,
      start_time DATETIME NOT NULL,
      end_time DATETIME NOT NULL,
      duration_seconds INTEGER,
      distance REAL,
      avg_pace REAL,
      avg_heart_rate INTEGER,
      heart_rate_zones TEXT,
      calories_burned REAL,
      track_data TEXT,
      recovery_suggestion TEXT,
      risk_notes TEXT,
      performance_score INTEGER,
      status TEXT NOT NULL DEFAULT 'completed' CHECK(status IN ('completed', 'partial', 'skipped', 'pending_review', 'revoked')),
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (plan_id) REFERENCES training_plans(id),
      FOREIGN KEY (device_id) REFERENCES devices(id)
    );

    CREATE TABLE IF NOT EXISTS alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      alert_type TEXT NOT NULL CHECK(alert_type IN ('heart_rate_anomaly', 'overtraining', 'missed_plan', 'device_disconnect', 'track_drift', 'data_duplicate', 'privacy_revoked', 'high_risk')),
      severity TEXT NOT NULL CHECK(severity IN ('low', 'medium', 'high', 'critical')),
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      related_data TEXT,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'acknowledged', 'confirmed', 'resolved', 'ignored', 'pending_emergency')),
      acknowledged_by INTEGER,
      acknowledged_at DATETIME,
      requires_confirmation BOOLEAN DEFAULT 0,
      contact_emergency BOOLEAN DEFAULT 0,
      emergency_contacted_at DATETIME,
      resolution_notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (acknowledged_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS coach_interventions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      coach_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      plan_id INTEGER,
      intervention_type TEXT NOT NULL CHECK(intervention_type IN ('adjust_intensity', 'rest_day', 'course_suggestion', 'goal_adjust', 'health_advice')),
      previous_value TEXT,
      new_value TEXT,
      reason TEXT,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected', 'implemented')),
      synced_to_user BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      implemented_at DATETIME,
      FOREIGN KEY (coach_id) REFERENCES users(id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (plan_id) REFERENCES training_plans(id)
    );

    CREATE TABLE IF NOT EXISTS coach_assignments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      coach_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'pending')),
      permissions TEXT,
      start_date DATE,
      end_date DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (coach_id) REFERENCES users(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS sync_batches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      batch_id TEXT UNIQUE NOT NULL,
      user_id INTEGER NOT NULL,
      device_id INTEGER NOT NULL,
      total_records INTEGER DEFAULT 0,
      success_count INTEGER DEFAULT 0,
      duplicate_count INTEGER DEFAULT 0,
      error_count INTEGER DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'processing' CHECK(status IN ('processing', 'completed', 'partial', 'failed', 'retrying')),
      retry_count INTEGER DEFAULT 0,
      error_message TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      completed_at DATETIME,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (device_id) REFERENCES devices(id)
    );

    CREATE TABLE IF NOT EXISTS operation_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      operation_type TEXT NOT NULL,
      entity_type TEXT,
      entity_id INTEGER,
      action TEXT NOT NULL,
      old_value TEXT,
      new_value TEXT,
      ip_address TEXT,
      user_agent TEXT,
      status TEXT NOT NULL DEFAULT 'success',
      error_message TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_device_data_user_time ON device_data(user_id, data_type, sample_time);
    CREATE INDEX IF NOT EXISTS idx_workout_user_time ON workout_records(user_id, start_time);
    CREATE INDEX IF NOT EXISTS idx_alerts_user_status ON alerts(user_id, status, created_at);
    CREATE INDEX IF NOT EXISTS idx_plans_user_status ON training_plans(user_id, status);
    CREATE INDEX IF NOT EXISTS idx_op_logs_entity ON operation_logs(entity_type, entity_id, created_at);
  `);

  const salt = bcrypt.genSaltSync(10);

  const checkUser = db.prepare('SELECT COUNT(*) as count FROM users');
  const { count } = checkUser.get() as { count: number };
  
  if (count === 0) {
    const insertUser = db.prepare(`
      INSERT INTO users (username, password, name, role, email, phone, age, gender, emergency_contact)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertUser.run(
      'user1',
      bcrypt.hashSync('123456', salt),
      '张三',
      'user',
      'zhangsan@example.com',
      '13800138001',
      28,
      'male',
      '李四 13900139001'
    );

    insertUser.run(
      'user2',
      bcrypt.hashSync('123456', salt),
      '王五',
      'user',
      'wangwu@example.com',
      '13800138002',
      35,
      'female',
      '赵六 13900139002'
    );

    insertUser.run(
      'coach1',
      bcrypt.hashSync('123456', salt),
      '陈教练',
      'coach',
      'chen@example.com',
      '13900139100',
      40,
      'male',
      null
    );

    insertUser.run(
      'advisor1',
      bcrypt.hashSync('123456', salt),
      '刘顾问',
      'advisor',
      'liu@example.com',
      '13900139200',
      45,
      'female',
      null
    );

    insertUser.run(
      'admin',
      bcrypt.hashSync('123456', salt),
      '系统管理员',
      'admin',
      'admin@example.com',
      '13900139999',
      30,
      'male',
      null
    );

    const assignCoach = db.prepare(`
      INSERT INTO coach_assignments (coach_id, user_id, status, permissions, start_date)
      VALUES (?, ?, 'active', ?, DATE('now'))
    `);

    assignCoach.run(3, 1, JSON.stringify(['view_data', 'adjust_plan', 'send_alert', 'view_trend']));
    assignCoach.run(3, 2, JSON.stringify(['view_data', 'adjust_plan']));
  }

  console.log('数据库初始化完成');
}

if (require.main === module) {
  initDatabase();
}
