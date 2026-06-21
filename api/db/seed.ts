import db from './database.js';
import { hashPassword, generateId, generateTransactionHash } from '../utils/hash.js';

export function seedDatabase(): void {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (userCount.count > 0) {
    console.log('数据库已有数据，跳过种子初始化');
    return;
  }

  const now = Date.now();

  const adminId = generateId('usr');
  db.prepare(`
    INSERT INTO users (id, account, password_hash, name, role, phone, created_at)
    VALUES (?, ?, ?, ?, 'admin', ?, ?)
  `).run(adminId, 'admin', hashPassword('admin123'), '系统管理员', '13800000000', now);

  const investorUserId = generateId('usr');
  const investorId = generateId('inv');
  db.prepare(`
    INSERT INTO users (id, account, password_hash, name, role, phone, created_at)
    VALUES (?, ?, ?, ?, 'investor', ?, ?)
  `).run(investorUserId, 'investor', hashPassword('invest123'), '张总', '13900000001', now);
  db.prepare(`
    INSERT INTO investor_profiles (id, user_id, company_name, total_revenue, available_balance, share_ratio)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(investorId, investorUserId, '清源科技投资有限公司', 128650.50, 45320.80, 0.7);

  const studentData = [
    { account: '2021001', name: '李明', studentNo: '2021001', campusCardId: 'C2021001', phone: '13811110001', balance: 256.80 },
    { account: '2021002', name: '王芳', studentNo: '2021002', campusCardId: 'C2021002', phone: '13811110002', balance: 128.50 },
    { account: '2021003', name: '张伟', studentNo: '2021003', campusCardId: 'C2021003', phone: '13811110003', balance: 67.20 },
    { account: '2021004', name: '刘洋', studentNo: '2021004', campusCardId: 'C2021004', phone: '13811110004', balance: 312.00 },
    { account: '2021005', name: '陈静', studentNo: '2021005', campusCardId: 'C2021005', phone: '13811110005', balance: 89.90 },
  ];

  const studentIds: string[] = [];
  const insertUser = db.prepare(`
    INSERT INTO users (id, account, password_hash, name, role, phone, created_at)
    VALUES (?, ?, ?, ?, 'student', ?, ?)
  `);
  const insertStudent = db.prepare(`
    INSERT INTO student_profiles (id, user_id, student_no, campus_card_id, balance)
    VALUES (?, ?, ?, ?, ?)
  `);

  for (const s of studentData) {
    const userId = generateId('usr');
    const studentProfileId = generateId('stu');
    insertUser.run(userId, s.account, hashPassword('student123'), s.name, s.phone, now);
    insertStudent.run(studentProfileId, userId, s.studentNo, s.campusCardId, s.balance);
    studentIds.push(studentProfileId);
  }

  const deviceData = [
    { name: '1号楼A区-01号热水器', location: '学生公寓1号楼A区1层', lat: 39.9087, lng: 116.3975, status: 'online', connectionTypes: ['nfc', 'bluetooth', 'qr'], queueCount: 2 },
    { name: '1号楼A区-02号热水器', location: '学生公寓1号楼A区2层', lat: 39.9088, lng: 116.3976, status: 'online', connectionTypes: ['qr', 'bluetooth'], queueCount: 0 },
    { name: '2号楼B区-01号热水器', location: '学生公寓2号楼B区1层', lat: 39.9090, lng: 116.3980, status: 'online', connectionTypes: ['nfc', 'qr'], queueCount: 5 },
    { name: '3号楼-01号热水器', location: '学生公寓3号楼大厅', lat: 39.9085, lng: 116.3970, status: 'fault', connectionTypes: ['nfc', 'bluetooth', 'qr'], queueCount: 0 },
    { name: '图书馆-饮水点', location: '图书馆一层大厅', lat: 39.9092, lng: 116.3965, status: 'online', connectionTypes: ['qr', 'nfc'], queueCount: 1 },
    { name: '教学楼A栋-01', location: '教学楼A栋3层', lat: 39.9095, lng: 116.3982, status: 'online', connectionTypes: ['qr', 'bluetooth'], queueCount: 3 },
    { name: '食堂-饮水点', location: '第一食堂二层', lat: 39.9080, lng: 116.3985, status: 'offline', connectionTypes: ['nfc', 'qr'], queueCount: 0 },
    { name: '体育馆-淋浴01', location: '体育馆更衣室', lat: 39.9100, lng: 116.3972, status: 'online', connectionTypes: ['nfc', 'bluetooth', 'qr'], queueCount: 4 },
  ];

  const insertDevice = db.prepare(`
    INSERT INTO devices (id, name, location, lat, lng, status, connection_types, queue_count, today_water_usage, today_revenue, total_water_usage, total_revenue, investor_id, last_online, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const deviceIds: string[] = [];
  for (const d of deviceData) {
    const deviceId = generateId('dev');
    insertDevice.run(
      deviceId, d.name, d.location, d.lat, d.lng, d.status,
      JSON.stringify(d.connectionTypes), d.queueCount,
      Math.random() * 500 + 100,
      Math.random() * 200 + 50,
      Math.random() * 50000 + 10000,
      Math.random() * 20000 + 5000,
      investorId, now - Math.random() * 3600000, now
    );
    deviceIds.push(deviceId);
  }

  const insertTransaction = db.prepare(`
    INSERT INTO water_transactions (id, student_id, device_id, start_time, end_time, volume, amount, hash, prev_hash, synced_to_campus, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  let prevHash: string | null = null;
  const locations = [
    { name: '1号楼A区-01号热水器', location: '学生公寓1号楼A区1层' },
    { name: '1号楼A区-02号热水器', location: '学生公寓1号楼A区2层' },
    { name: '2号楼B区-01号热水器', location: '学生公寓2号楼B区1层' },
  ];

  for (let i = 0; i < 30; i++) {
    const txId = generateId('tx');
    const studentId = studentIds[i % studentIds.length];
    const deviceId = deviceIds[i % 3];
    const startTime = now - (30 - i) * 3600000 * 2 - Math.random() * 1800000;
    const endTime = startTime + Math.random() * 600000 + 120000;
    const volume = Math.random() * 30 + 5;
    const amount = Number((volume * 0.08).toFixed(2));
    const hash = generateTransactionHash(txId, studentId, deviceId, startTime, volume, amount, prevHash);
    
    insertTransaction.run(
      txId, studentId, deviceId, startTime, endTime,
      volume, amount, hash, prevHash, 1, startTime
    );
    prevHash = hash;

    const loc = locations[i % 3];
    db.prepare(`
      UPDATE devices SET 
        today_water_usage = today_water_usage + ?,
        today_revenue = today_revenue + ?,
        total_water_usage = total_water_usage + ?,
        total_revenue = total_revenue + ?
      WHERE id = ?
    `).run(volume, amount, volume, amount, deviceId);
    void loc;
  }

  for (const devId of deviceIds.slice(0, 4)) {
    const diagnosisId = generateId('diag');
    const issues = devId === deviceIds[3]
      ? JSON.stringify([
          { code: 'E001', description: '水压异常偏低', suggestion: '检查进水管道是否堵塞' },
          { code: 'W003', description: '加热模块温度传感器异常', suggestion: '建议更换温度传感器' },
        ])
      : JSON.stringify([]);
    const metrics = JSON.stringify({
      waterPressure: 0.25 + Math.random() * 0.3,
      temperature: 45 + Math.random() * 15,
      batteryLevel: 60 + Math.random() * 40,
      signalStrength: -70 + Math.random() * 30,
    });
    const status = devId === deviceIds[3] ? 'critical' : (Math.random() > 0.7 ? 'warning' : 'normal');
    
    db.prepare(`
      INSERT INTO device_diagnoses (id, device_id, timestamp, status, issues_json, metrics_json)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(diagnosisId, devId, now, status, issues, metrics);
  }

  const periods = ['2026-05', '2026-04', '2026-03'];
  const insertRevenue = db.prepare(`
    INSERT INTO revenue_records (id, investor_id, device_id, period, total_revenue, investor_share, platform_share, settled, settled_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const period of periods) {
    for (const devId of deviceIds.slice(0, 5)) {
      const revId = generateId('rev');
      const totalRev = Math.random() * 3000 + 1000;
      insertRevenue.run(
        revId, investorId, devId, period,
        totalRev, totalRev * 0.7, totalRev * 0.3,
        period !== '2026-05' ? 1 : 0,
        period !== '2026-05' ? now : null,
        now
      );
    }
  }

  console.log('数据库种子数据初始化完成');
  console.log('测试账号:');
  console.log('  管理员: admin / admin123');
  console.log('  投资商: investor / invest123');
  console.log('  学生: 2021001-2021005 / student123');
}
