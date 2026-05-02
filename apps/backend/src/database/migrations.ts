import { query } from './index';

export const createTables = async () => {
  const createTablesSQL = `
    -- 患者表
    CREATE TABLE IF NOT EXISTS patients (
      id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(100) NOT NULL,
      gender VARCHAR(10) NOT NULL CHECK (gender IN ('male', 'female')),
      birth_date DATE NOT NULL,
      id_card VARCHAR(18) UNIQUE NOT NULL,
      phone VARCHAR(20) NOT NULL,
      email VARCHAR(100),
      address TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- 科室表
    CREATE TABLE IF NOT EXISTS departments (
      id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(100) NOT NULL,
      code VARCHAR(20) UNIQUE NOT NULL,
      location VARCHAR(200),
      capacity INTEGER DEFAULT 10,
      current_count INTEGER DEFAULT 0,
      avg_exam_time INTEGER DEFAULT 15,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- 医生表
    CREATE TABLE IF NOT EXISTS doctors (
      id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(100) NOT NULL,
      department_id VARCHAR(36) REFERENCES departments(id),
      title VARCHAR(50),
      phone VARCHAR(20),
      role VARCHAR(30) NOT NULL CHECK (role IN ('department_doctor', 'chief_doctor')),
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- 用户表（系统用户）
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
      username VARCHAR(50) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      name VARCHAR(100) NOT NULL,
      role VARCHAR(30) NOT NULL CHECK (role IN ('admin', 'reception', 'department_doctor', 'chief_doctor', 'customer_service')),
      doctor_id VARCHAR(36) REFERENCES doctors(id),
      is_active BOOLEAN DEFAULT TRUE,
      last_login_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- 体检套餐表
    CREATE TABLE IF NOT EXISTS medical_packages (
      id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(200) NOT NULL,
      description TEXT,
      price DECIMAL(10, 2) NOT NULL,
      original_price DECIMAL(10, 2) NOT NULL,
      category VARCHAR(20) NOT NULL CHECK (category IN ('basic', 'standard', 'premium', 'custom')),
      is_active BOOLEAN DEFAULT TRUE,
      estimated_duration INTEGER DEFAULT 60,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- 套餐项目表
    CREATE TABLE IF NOT EXISTS package_items (
      id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
      package_id VARCHAR(36) REFERENCES medical_packages(id) ON DELETE CASCADE,
      name VARCHAR(200) NOT NULL,
      department_id VARCHAR(36) REFERENCES departments(id),
      item_type VARCHAR(20) NOT NULL CHECK (item_type IN ('examination', 'lab', 'imaging')),
      estimated_duration INTEGER DEFAULT 15,
      normal_range_min DECIMAL(10, 2),
      normal_range_max DECIMAL(10, 2),
      normal_range_unit VARCHAR(20),
      gender_specific VARCHAR(10) CHECK (gender_specific IN ('male', 'female')),
      sort_order INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- 预约表
    CREATE TABLE IF NOT EXISTS reservations (
      id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
      reservation_code VARCHAR(20) UNIQUE NOT NULL,
      patient_id VARCHAR(36) REFERENCES patients(id),
      package_id VARCHAR(36) REFERENCES medical_packages(id),
      order_id VARCHAR(36),
      reservation_date DATE NOT NULL,
      time_slot VARCHAR(20) NOT NULL,
      status VARCHAR(30) NOT NULL DEFAULT 'created' CHECK (status IN ('created', 'reserved', 'checked_in', 'in_examination', 'examination_completed', 'report_generated', 'cancelled')),
      check_in_time TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- 体检订单表
    CREATE TABLE IF NOT EXISTS examination_orders (
      id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
      order_no VARCHAR(30) UNIQUE NOT NULL,
      patient_id VARCHAR(36) REFERENCES patients(id),
      package_id VARCHAR(36) REFERENCES medical_packages(id),
      total_amount DECIMAL(10, 2) NOT NULL,
      paid_amount DECIMAL(10, 2) DEFAULT 0,
      status VARCHAR(30) NOT NULL DEFAULT 'created' CHECK (status IN ('created', 'reserved', 'checked_in', 'in_examination', 'examination_completed', 'report_generated', 'cancelled')),
      reservation_id VARCHAR(36) REFERENCES reservations(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- 订单项目表
    CREATE TABLE IF NOT EXISTS order_items (
      id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
      order_id VARCHAR(36) REFERENCES examination_orders(id) ON DELETE CASCADE,
      package_item_id VARCHAR(36) REFERENCES package_items(id),
      item_name VARCHAR(200) NOT NULL,
      department_id VARCHAR(36) REFERENCES departments(id),
      item_type VARCHAR(20) NOT NULL CHECK (item_type IN ('examination', 'lab', 'imaging')),
      status VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'abnormal')),
      started_at TIMESTAMP,
      completed_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- 体检结果表
    CREATE TABLE IF NOT EXISTS examination_results (
      id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
      order_item_id VARCHAR(36) REFERENCES order_items(id),
      patient_id VARCHAR(36) REFERENCES patients(id),
      doctor_id VARCHAR(36) REFERENCES doctors(id),
      conclusion TEXT,
      is_abnormal BOOLEAN DEFAULT FALSE,
      is_crisis BOOLEAN DEFAULT FALSE,
      exam_time TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- 结果数值表
    CREATE TABLE IF NOT EXISTS result_values (
      id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
      result_id VARCHAR(36) REFERENCES examination_results(id) ON DELETE CASCADE,
      name VARCHAR(200) NOT NULL,
      value VARCHAR(100) NOT NULL,
      unit VARCHAR(20),
      normal_range VARCHAR(100),
      is_abnormal BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- 排队记录表
    CREATE TABLE IF NOT EXISTS queue_items (
      id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
      patient_id VARCHAR(36) REFERENCES patients(id),
      patient_name VARCHAR(100) NOT NULL,
      department_id VARCHAR(36) REFERENCES departments(id),
      order_id VARCHAR(36) REFERENCES examination_orders(id),
      reservation_code VARCHAR(20),
      status VARCHAR(30) NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'in_examination', 'completed', 'abnormal', 'locked')),
      queue_position INTEGER NOT NULL,
      estimated_wait_time INTEGER DEFAULT 0,
      assigned_doctor_id VARCHAR(36) REFERENCES doctors(id),
      joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      called_at TIMESTAMP,
      completed_at TIMESTAMP
    );

    -- 导检路径表
    CREATE TABLE IF NOT EXISTS triage_paths (
      id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
      reservation_id VARCHAR(36) REFERENCES reservations(id),
      patient_id VARCHAR(36) REFERENCES patients(id),
      current_step INTEGER DEFAULT 0,
      total_steps INTEGER NOT NULL,
      is_completed BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- 导检步骤表
    CREATE TABLE IF NOT EXISTS triage_steps (
      id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
      triage_path_id VARCHAR(36) REFERENCES triage_paths(id) ON DELETE CASCADE,
      step_index INTEGER NOT NULL,
      department_id VARCHAR(36) REFERENCES departments(id),
      department_name VARCHAR(100) NOT NULL,
      status VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped')),
      estimated_start_time TIMESTAMP,
      actual_start_time TIMESTAMP,
      completed_at TIMESTAMP,
      queue_position INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- 体检报告表
    CREATE TABLE IF NOT EXISTS examination_reports (
      id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
      report_no VARCHAR(30) UNIQUE NOT NULL,
      order_id VARCHAR(36) REFERENCES examination_orders(id),
      patient_id VARCHAR(36) REFERENCES patients(id),
      chief_doctor_id VARCHAR(36) REFERENCES doctors(id),
      summary TEXT,
      conclusions TEXT,
      risk_level VARCHAR(20) NOT NULL DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
      is_generated BOOLEAN DEFAULT FALSE,
      pdf_url VARCHAR(500),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- 健康建议表
    CREATE TABLE IF NOT EXISTS health_recommendations (
      id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
      report_id VARCHAR(36) REFERENCES examination_reports(id) ON DELETE CASCADE,
      category VARCHAR(30) NOT NULL CHECK (category IN ('diet', 'exercise', 'medication', 'follow_up', 'lifestyle')),
      content TEXT NOT NULL,
      priority VARCHAR(20) NOT NULL DEFAULT 'low' CHECK (priority IN ('low', 'medium', 'high')),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- 异常项目表
    CREATE TABLE IF NOT EXISTS abnormal_items (
      id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
      report_id VARCHAR(36) REFERENCES examination_reports(id) ON DELETE CASCADE,
      item_name VARCHAR(200) NOT NULL,
      item_type VARCHAR(20) NOT NULL CHECK (item_type IN ('examination', 'lab', 'imaging')),
      value VARCHAR(100) NOT NULL,
      normal_range VARCHAR(100),
      description TEXT,
      is_crisis BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- 随访任务表
    CREATE TABLE IF NOT EXISTS follow_up_tasks (
      id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
      task_no VARCHAR(30) UNIQUE NOT NULL,
      patient_id VARCHAR(36) REFERENCES patients(id),
      report_id VARCHAR(36) REFERENCES examination_reports(id),
      abnormal_items TEXT NOT NULL,
      risk_level VARCHAR(20) NOT NULL CHECK (risk_level IN ('medium', 'high', 'critical')),
      assigned_to VARCHAR(36) REFERENCES users(id),
      status VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'scheduled')),
      scheduled_date DATE,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- 通知表
    CREATE TABLE IF NOT EXISTS notifications (
      id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
      type VARCHAR(30) NOT NULL CHECK (type IN ('crisis_value', 'queue_update', 'report_ready', 'follow_up', 'system')),
      target_type VARCHAR(20) NOT NULL CHECK (target_type IN ('patient', 'doctor', 'reception', 'admin')),
      target_id VARCHAR(36) NOT NULL,
      title VARCHAR(200) NOT NULL,
      content TEXT NOT NULL,
      related_id VARCHAR(36),
      is_read BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- 审计日志表
    CREATE TABLE IF NOT EXISTS audit_logs (
      id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
      operation VARCHAR(20) NOT NULL CHECK (operation IN ('create', 'update', 'delete', 'login', 'logout')),
      entity VARCHAR(50) NOT NULL,
      entity_id VARCHAR(36) NOT NULL,
      operator_id VARCHAR(36) NOT NULL,
      operator_name VARCHAR(100) NOT NULL,
      old_value JSONB,
      new_value JSONB,
      ip_address VARCHAR(50),
      user_agent TEXT,
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- 离线同步记录表
    CREATE TABLE IF NOT EXISTS offline_sync_records (
      id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
      device_id VARCHAR(100) NOT NULL,
      operation VARCHAR(20) NOT NULL CHECK (operation IN ('create', 'update')),
      entity VARCHAR(50) NOT NULL,
      local_id VARCHAR(100) NOT NULL,
      data JSONB NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'synced', 'failed')),
      attempts INTEGER DEFAULT 0,
      error_message TEXT,
      synced_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- 创建索引
    CREATE INDEX IF NOT EXISTS idx_patients_id_card ON patients(id_card);
    CREATE INDEX IF NOT EXISTS idx_reservations_code ON reservations(reservation_code);
    CREATE INDEX IF NOT EXISTS idx_reservations_date ON reservations(reservation_date);
    CREATE INDEX IF NOT EXISTS idx_queue_department ON queue_items(department_id);
    CREATE INDEX IF NOT EXISTS idx_queue_status ON queue_items(status);
    CREATE INDEX IF NOT EXISTS idx_orders_patient ON examination_orders(patient_id);
    CREATE INDEX IF NOT EXISTS idx_reports_order ON examination_reports(order_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_target ON notifications(target_id, is_read);
    CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp);
  `;

  try {
    await query(createTablesSQL);
    console.log('Tables created successfully');
  } catch (error) {
    console.error('Error creating tables:', error);
    throw error;
  }
};

export default createTables;
