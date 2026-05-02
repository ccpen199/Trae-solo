require('dotenv').config();
const { getDb } = require('../config/database');
const schema = require('../config/schema');
const enums = require('../config/enums');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

async function initializeDatabase() {
  const db = getDb();
  if (!db) {
    console.error('数据库未初始化');
    return;
  }

  const statements = schema.split(';').filter(s => s.trim());

  statements.forEach((stmt, index) => {
    const sql = stmt.trim();
    if (sql && sql.length > 0) {
      try {
        db.exec(sql + ';');
      } catch (err) {
        console.error(`Error executing statement ${index}:`, err.message);
      }
    }
  });

  const usersResult = db.exec('SELECT COUNT(*) as count FROM users');
  const usersCount = usersResult.length > 0 && usersResult[0].values.length > 0 
    ? usersResult[0].values[0][0] 
    : 0;

  if (usersCount === 0) {
    const hashPassword = (password) => bcrypt.hashSync(password, 10);
    
    const adminId = uuidv4();
    const ownerId = uuidv4();
    const workerId = uuidv4();
    const investorId = uuidv4();
    const vendorId = uuidv4();

    db.run(`
      INSERT INTO users (id, username, password, name, phone, email, role)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, adminId, 'admin', hashPassword('admin123'), '系统管理员', '13800138000', 'admin@pvops.com', enums.UserRole.ADMIN);

    db.run(`
      INSERT INTO users (id, username, password, name, phone, email, role)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, ownerId, 'owner', hashPassword('owner123'), '张三', '13800138001', 'owner@pvops.com', enums.UserRole.STATION_OWNER);

    db.run(`
      INSERT INTO users (id, username, password, name, phone, email, role)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, workerId, 'worker', hashPassword('worker123'), '李四', '13800138002', 'worker@pvops.com', enums.UserRole.MAINTENANCE_WORKER);

    db.run(`
      INSERT INTO users (id, username, password, name, phone, email, role)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, investorId, 'investor', hashPassword('investor123'), '王五', '13800138003', 'investor@pvops.com', enums.UserRole.INVESTOR);

    db.run(`
      INSERT INTO users (id, username, password, name, phone, email, role)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, vendorId, 'vendor', hashPassword('vendor123'), '阳光电源', '4008088888', 'vendor@pvops.com', enums.UserRole.EQUIPMENT_VENDOR);

    const station1Id = uuidv4();
    const station2Id = uuidv4();
    const station3Id = uuidv4();

    db.run(`
      INSERT INTO stations (id, name, code, capacity_kw, address, latitude, longitude, installed_date, owner_id, investor_id, status, health_level, pr_target)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, station1Id, '河西光伏电站一期', 'PV-HX-001', 5000, 
       '甘肃省酒泉市肃州区经济技术开发区', 39.7518, 98.5146,
       '2022-06-15', ownerId, investorId, enums.StationStatus.OPERATING, enums.HealthLevel.GOOD, 0.85);

    db.run(`
      INSERT INTO stations (id, name, code, capacity_kw, address, latitude, longitude, installed_date, owner_id, investor_id, status, health_level, pr_target)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, station2Id, '东山分布式光伏', 'PV-DS-002', 800,
       '山东省青岛市黄岛区工业园', 35.9211, 120.1815,
       '2023-03-20', ownerId, investorId, enums.StationStatus.OPERATING, enums.HealthLevel.EXCELLENT, 0.88);

    db.run(`
      INSERT INTO stations (id, name, code, capacity_kw, address, latitude, longitude, installed_date, owner_id, investor_id, status, health_level, pr_target)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, station3Id, '南沙光伏电站', 'PV-NS-003', 2000,
       '广东省广州市南沙区保税区', 22.8025, 113.5307,
       '2021-11-08', ownerId, null, enums.StationStatus.OPERATING, enums.HealthLevel.FAIR, 0.82);

    const inv1Id = uuidv4();
    const inv2Id = uuidv4();
    const inv3Id = uuidv4();

    db.run(`
      INSERT INTO inverters (id, station_id, serial_number, model, capacity_kw, status, vendor, firmware_version)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, inv1Id, station1Id, 'SG500-001', 'SG500KTL', 500, enums.InverterStatus.OPERATING, '阳光电源', 'V2.1.5');

    db.run(`
      INSERT INTO inverters (id, station_id, serial_number, model, capacity_kw, status, vendor, firmware_version)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, inv2Id, station1Id, 'SG500-002', 'SG500KTL', 500, enums.InverterStatus.OPERATING, '阳光电源', 'V2.1.5');

    db.run(`
      INSERT INTO inverters (id, station_id, serial_number, model, capacity_kw, status, vendor, firmware_version)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, inv3Id, station2Id, 'SG100-001', 'SG110KTL', 110, enums.InverterStatus.OPERATING, '阳光电源', 'V2.0.3');

    for (let i = 1; i <= 20; i++) {
      db.run(`
        INSERT INTO strings (id, station_id, inverter_id, string_number, panels_count, capacity_kw, status)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, uuidv4(), station1Id, inv1Id, i, 22, 66, 'normal');
      db.run(`
        INSERT INTO strings (id, station_id, inverter_id, string_number, panels_count, capacity_kw, status)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, uuidv4(), station1Id, inv2Id, i, 22, 66, 'normal');
    }

    for (let i = 1; i <= 10; i++) {
      db.run(`
        INSERT INTO strings (id, station_id, inverter_id, string_number, panels_count, capacity_kw, status)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, uuidv4(), station2Id, inv3Id, i, 20, 60, 'normal');
    }

    const sampleFaultId = uuidv4();
    const now = new Date();
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

    db.run(`
      INSERT INTO faults (id, station_id, inverter_id, string_id, detected_time, fault_code, fault_description, severity, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, sampleFaultId, station1Id, inv1Id, null,
       twoHoursAgo.toISOString(), 'E012', '组串1直流电流异常降低',
       enums.FaultSeverity.MAJOR, enums.FaultStatus.DETECTED);

    const moId = uuidv4();
    db.run(`
      INSERT INTO maintenance_orders (id, station_id, fault_id, assigned_worker_id, problem_description, status, priority)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, moId, station1Id, sampleFaultId, workerId,
       '逆变器SG500-001报告组串电流异常，请现场检查',
       enums.MaintenanceOrderStatus.PENDING, 2);

    const coId = uuidv4();
    db.run(`
      INSERT INTO cleaning_orders (id, station_id, assigned_worker_id, cause, current_degradation_percent, status, priority)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, coId, station3Id, workerId, enums.CleaningCause.DUST, 15.5,
       enums.CleaningOrderStatus.PENDING, 1);

    db.run(`
      INSERT INTO notifications (id, user_id, type, title, content, reference_type, reference_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, uuidv4(), workerId, enums.NotificationType.MAINTENANCE_TASK,
       '新维修单分派', '您有一张新的维修工单需要处理：逆变器电流异常',
       'maintenance_order', moId);

    db.run(`
      INSERT INTO notifications (id, user_id, type, title, content, reference_type, reference_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, uuidv4(), workerId, enums.NotificationType.CLEANING_REMINDER,
       '新清洗单分派', '您有一张新的清洗工单需要处理：南沙电站灰尘积灰',
       'cleaning_order', coId);

    db.run(`
      INSERT INTO notifications (id, user_id, type, title, content, reference_type, reference_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, uuidv4(), ownerId, enums.NotificationType.FAULT_ALERT,
       '电站故障告警', '河西光伏电站一期检测到逆变器故障：E012 组串电流异常',
       'fault', sampleFaultId);

    console.log('Sample data initialized successfully');
  }

  if (db.save) db.save();
  console.log('Database initialized successfully');
}

module.exports = {
  initializeDatabase
};
