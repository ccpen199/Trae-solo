const pool = require('../config/database');
const bcrypt = require('bcryptjs');

const createTables = async () => {
  const createTablesSQL = `
    -- 用户表
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(50) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role VARCHAR(20) DEFAULT 'user',
      name VARCHAR(100),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- 车型表
    CREATE TABLE IF NOT EXISTS vehicle_models (
      id SERIAL PRIMARY KEY,
      model_name VARCHAR(100) NOT NULL,
      model_code VARCHAR(50) UNIQUE NOT NULL,
      engine_type VARCHAR(100),
      displacement VARCHAR(50),
      fuel_type VARCHAR(50),
      manufacturer VARCHAR(100),
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- 车辆档案表
    CREATE TABLE IF NOT EXISTS vehicles (
      id SERIAL PRIMARY KEY,
      vin VARCHAR(50) UNIQUE,
      license_plate VARCHAR(20),
      model_id INTEGER REFERENCES vehicle_models(id),
      ecu_serial VARCHAR(100) UNIQUE,
      ecu_model VARCHAR(100),
      engine_number VARCHAR(100),
      production_date DATE,
      purchase_date DATE,
      mileage DECIMAL(10, 2) DEFAULT 0,
      status VARCHAR(20) DEFAULT 'active',
      owner_name VARCHAR(100),
      owner_phone VARCHAR(20),
      remarks TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- 传感器表
    CREATE TABLE IF NOT EXISTS sensors (
      id SERIAL PRIMARY KEY,
      vehicle_id INTEGER REFERENCES vehicles(id),
      sensor_code VARCHAR(50) NOT NULL,
      sensor_name VARCHAR(100) NOT NULL,
      sensor_type VARCHAR(50),
      unit VARCHAR(20),
      min_value DECIMAL(10, 2),
      max_value DECIMAL(10, 2),
      warning_min DECIMAL(10, 2),
      warning_max DECIMAL(10, 2),
      position VARCHAR(100),
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- 执行器表
    CREATE TABLE IF NOT EXISTS actuators (
      id SERIAL PRIMARY KEY,
      vehicle_id INTEGER REFERENCES vehicles(id),
      actuator_code VARCHAR(50) NOT NULL,
      actuator_name VARCHAR(100) NOT NULL,
      actuator_type VARCHAR(50),
      control_method VARCHAR(50),
      working_voltage DECIMAL(5, 2),
      position VARCHAR(100),
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- 数据采集会话表
    CREATE TABLE IF NOT EXISTS data_sessions (
      id SERIAL PRIMARY KEY,
      vehicle_id INTEGER REFERENCES vehicles(id),
      session_code VARCHAR(100) UNIQUE NOT NULL,
      protocol_type VARCHAR(20) DEFAULT 'CAN',
      start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      end_time TIMESTAMP,
      total_samples INTEGER DEFAULT 0,
      status VARCHAR(20) DEFAULT 'running',
      created_by INTEGER REFERENCES users(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- 时序数据表
    CREATE TABLE IF NOT EXISTS time_series_data (
      id SERIAL PRIMARY KEY,
      session_id INTEGER REFERENCES data_sessions(id),
      vehicle_id INTEGER REFERENCES vehicles(id),
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      rpm DECIMAL(10, 2),
      intake_pressure DECIMAL(10, 2),
      intake_temp DECIMAL(10, 2),
      coolant_temp DECIMAL(10, 2),
      voltage DECIMAL(5, 2),
      throttle_position DECIMAL(5, 2),
      vehicle_speed DECIMAL(10, 2),
      fuel_consumption DECIMAL(10, 4),
      raw_data JSONB,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- 创建时序数据索引
    CREATE INDEX IF NOT EXISTS idx_time_series_session ON time_series_data(session_id);
    CREATE INDEX IF NOT EXISTS idx_time_series_vehicle ON time_series_data(vehicle_id);
    CREATE INDEX IF NOT EXISTS idx_time_series_timestamp ON time_series_data(timestamp);

    -- 故障码表
    CREATE TABLE IF NOT EXISTS dtcs (
      id SERIAL PRIMARY KEY,
      dtc_code VARCHAR(20) UNIQUE NOT NULL,
      dtc_name VARCHAR(200) NOT NULL,
      category VARCHAR(50),
      severity VARCHAR(20),
      description TEXT,
      possible_causes TEXT,
      troubleshooting_steps TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- 故障记录表
    CREATE TABLE IF NOT EXISTS fault_records (
      id SERIAL PRIMARY KEY,
      vehicle_id INTEGER REFERENCES vehicles(id),
      dtc_id INTEGER REFERENCES dtcs(id),
      fault_category VARCHAR(50),
      fault_code VARCHAR(50),
      fault_name VARCHAR(200),
      severity VARCHAR(20),
      occurrence_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      cleared_time TIMESTAMP,
      status VARCHAR(20) DEFAULT 'active',
      source_sensor VARCHAR(100),
      source_actuator VARCHAR(100),
      details TEXT,
      suggestion TEXT,
      repair_result TEXT,
      repair_user_id INTEGER REFERENCES users(id),
      repair_time TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- 标定参数表
    CREATE TABLE IF NOT EXISTS calibration_parameters (
      id SERIAL PRIMARY KEY,
      parameter_code VARCHAR(50) UNIQUE NOT NULL,
      parameter_name VARCHAR(100) NOT NULL,
      category VARCHAR(50),
      unit VARCHAR(20),
      min_value DECIMAL(15, 6),
      max_value DECIMAL(15, 6),
      default_value DECIMAL(15, 6),
      step_value DECIMAL(15, 6),
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- 标定版本表
    CREATE TABLE IF NOT EXISTS calibration_versions (
      id SERIAL PRIMARY KEY,
      version_code VARCHAR(50) UNIQUE NOT NULL,
      version_name VARCHAR(100),
      vehicle_model_id INTEGER REFERENCES vehicle_models(id),
      ecu_model VARCHAR(100),
      description TEXT,
      status VARCHAR(20) DEFAULT 'draft',
      created_by INTEGER REFERENCES users(id),
      reviewed_by INTEGER REFERENCES users(id),
      review_time TIMESTAMP,
      review_comment TEXT,
      published_by INTEGER REFERENCES users(id),
      publish_time TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- 标定版本参数详情表
    CREATE TABLE IF NOT EXISTS calibration_version_params (
      id SERIAL PRIMARY KEY,
      version_id INTEGER REFERENCES calibration_versions(id),
      parameter_id INTEGER REFERENCES calibration_parameters(id),
      parameter_value DECIMAL(15, 6),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- 标定审核记录表
    CREATE TABLE IF NOT EXISTS calibration_reviews (
      id SERIAL PRIMARY KEY,
      version_id INTEGER REFERENCES calibration_versions(id),
      reviewer_id INTEGER REFERENCES users(id),
      status VARCHAR(20),
      comment TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- 通讯日志表
    CREATE TABLE IF NOT EXISTS communication_logs (
      id SERIAL PRIMARY KEY,
      vehicle_id INTEGER REFERENCES vehicles(id),
      session_id INTEGER REFERENCES data_sessions(id),
      protocol_type VARCHAR(20),
      direction VARCHAR(20),
      message_type VARCHAR(50),
      message_data TEXT,
      response_time_ms INTEGER,
      is_success BOOLEAN DEFAULT TRUE,
      error_message TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- 创建通讯日志索引
    CREATE INDEX IF NOT EXISTS idx_comm_log_vehicle ON communication_logs(vehicle_id);
    CREATE INDEX IF NOT EXISTS idx_comm_log_created ON communication_logs(created_at);

    -- 审计日志表
    CREATE TABLE IF NOT EXISTS audit_logs (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id),
      action VARCHAR(100),
      module VARCHAR(50),
      target_type VARCHAR(50),
      target_id INTEGER,
      old_value JSONB,
      new_value JSONB,
      ip_address VARCHAR(50),
      user_agent TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- 创建审计日志索引
    CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);
    CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);
  `;

  try {
    await pool.query(createTablesSQL);
    console.log('表结构创建成功');
  } catch (err) {
    console.error('创建表结构失败:', err);
    throw err;
  }
};

const insertSeedData = async () => {
  try {
    // 创建默认管理员用户
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await pool.query(`
      INSERT INTO users (username, password, role, name) 
      VALUES ('admin', $1, 'admin', '系统管理员')
      ON CONFLICT (username) DO NOTHING
    `, [hashedPassword]);

    const hashedPassword2 = await bcrypt.hash('user123', 10);
    await pool.query(`
      INSERT INTO users (username, password, role, name) 
      VALUES ('user', $1, 'user', '维修技师')
      ON CONFLICT (username) DO NOTHING
    `, [hashedPassword2]);

    console.log('默认用户创建成功 (admin/admin123, user/user123)');

    // 插入示例车型
    await pool.query(`
      INSERT INTO vehicle_models (model_name, model_code, engine_type, displacement, fuel_type, manufacturer) 
      VALUES 
      ('本田CB400X', 'CB400X-2024', '直列四缸', '399cc', '汽油', '本田'),
      ('雅马哈R3', 'YZF-R3-2024', '直列双缸', '321cc', '汽油', '雅马哈'),
      ('春风250SR', 'CF250SR-2024', '单缸', '249cc', '汽油', '春风动力')
      ON CONFLICT (model_code) DO NOTHING
    `);
    console.log('示例车型创建成功');

    // 插入示例故障码
    await pool.query(`
      INSERT INTO dtcs (dtc_code, dtc_name, category, severity, description, possible_causes, troubleshooting_steps) 
      VALUES 
      ('P0100', '空气流量传感器电路故障', '传感器异常', 'high', 'ECU检测到空气流量传感器信号超出正常范围', '空气流量传感器故障、线路断路、ECU故障', '1.检查传感器供电 2.检查信号线路 3.更换传感器'),
      ('P0110', '进气温度传感器电路故障', '传感器异常', 'medium', '进气温度传感器信号异常', '传感器故障、线路接触不良', '检查传感器及线束'),
      ('P0300', '多缸失火检测', '执行器驱动异常', 'high', 'ECU检测到多个气缸失火', '点火线圈故障、火花塞损坏、喷油嘴堵塞', '1.检查火花塞 2.检查点火线圈 3.检查燃油系统'),
      ('U0100', '与ECM/PCM通讯中断', '通讯异常', 'high', '无法与发动机控制模块通讯', 'CAN总线故障、ECU电源故障、ECU损坏', '1.检查CAN总线 2.检查ECU供电 3.更换ECU')
      ON CONFLICT (dtc_code) DO NOTHING
    `);
    console.log('示例故障码创建成功');

    // 插入示例标定参数
    await pool.query(`
      INSERT INTO calibration_parameters (parameter_code, parameter_name, category, unit, min_value, max_value, default_value, step_value, description) 
      VALUES 
      ('INJ_BASE_MAP', '基础喷油MAP', '喷油', 'ms/rpm', 0, 50, 10, 0.1, '基础喷油脉宽MAP表'),
      ('IGN_BASE_MAP', '基础点火MAP', '点火', 'deg', -30, 60, 15, 0.5, '基础点火提前角MAP表'),
      ('IDLE_TARGET_RPM', '怠速目标转速', '怠速', 'rpm', 1000, 3000, 1500, 10, '怠速控制目标转速'),
      ('FAN_ON_TEMP', '风扇开启温度', '风扇', 'degC', 80, 110, 95, 1, '冷却风扇开启温度'),
      ('FAN_OFF_TEMP', '风扇关闭温度', '风扇', 'degC', 70, 100, 88, 1, '冷却风扇关闭温度'),
      ('CANISTER_PURGE_DUTY', '碳罐电磁阀占空比', '碳罐电磁阀', '%', 0, 100, 20, 1, '碳罐清洗电磁阀占空比')
      ON CONFLICT (parameter_code) DO NOTHING
    `);
    console.log('示例标定参数创建成功');

  } catch (err) {
    console.error('插入种子数据失败:', err);
    throw err;
  }
};

const main = async () => {
  console.log('开始初始化数据库...');
  try {
    await createTables();
    await insertSeedData();
    console.log('数据库初始化完成!');
    process.exit(0);
  } catch (err) {
    console.error('数据库初始化失败:', err);
    process.exit(1);
  }
};

main();
