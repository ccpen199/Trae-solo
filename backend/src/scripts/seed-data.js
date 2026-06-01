require('dotenv').config({ path: '../../.env' });
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../../data/app.sqlite');
const db = new Database(dbPath);
db.pragma('foreign_keys = ON');

try {
  const insertFleet = db.prepare('INSERT INTO fleets (name, description) VALUES (?, ?)');
  const fleet1 = insertFleet.run('北京客运段一队', '负责京沪、京广线路');
  const fleet2 = insertFleet.run('北京客运段二队', '负责京汉、京蓉线路');
  const fleet3 = insertFleet.run('上海客运段一队', '负责沪宁、沪杭线路');
  
  console.log('车队数据插入完成');

  const insertCrew = db.prepare(`
    INSERT INTO crew_members 
    (employee_no, name, gender, phone, position, fleet_id, status, health_status, schedule_scope, hire_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const crewData = [
    ['BJ001', '张伟', '男', '13800138001', '列车长', fleet1.lastInsertRowid, 'active', 'normal', '京沪线', '2018-03-15'],
    ['BJ002', '李娜', '女', '13800138002', '列车长', fleet1.lastInsertRowid, 'active', 'normal', '京沪线', '2019-05-20'],
    ['BJ003', '王芳', '女', '13800138003', '乘务员', fleet1.lastInsertRowid, 'active', 'normal', '京沪线', '2020-02-10'],
    ['BJ004', '刘洋', '男', '13800138004', '乘务员', fleet1.lastInsertRowid, 'active', 'normal', '京沪线', '2020-06-25'],
    ['BJ005', '陈静', '女', '13800138005', '乘务员', fleet2.lastInsertRowid, 'active', 'normal', '京汉线', '2019-11-08'],
    ['BJ006', '赵强', '男', '13800138006', '安全员', fleet1.lastInsertRowid, 'active', 'normal', '京沪线', '2018-09-12'],
    ['BJ007', '孙丽', '女', '13800138007', '餐车长', fleet1.lastInsertRowid, 'active', 'normal', '京沪线', '2017-04-30'],
    ['BJ008', '周明', '男', '13800138008', '乘务员', fleet2.lastInsertRowid, 'active', 'normal', '京汉线', '2021-01-18'],
    ['SH001', '吴敏', '女', '13800138009', '列车长', fleet3.lastInsertRowid, 'active', 'normal', '沪宁线', '2019-07-22'],
    ['SH002', '郑华', '男', '13800138010', '乘务员', fleet3.lastInsertRowid, 'active', 'normal', '沪宁线', '2020-08-05'],
  ];

  const crewIds = [];
  for (const crew of crewData) {
    const result = insertCrew.run(...crew);
    crewIds.push(result.lastInsertRowid);
  }
  console.log('乘务人员数据插入完成');

  const insertQual = db.prepare(`
    INSERT INTO qualifications (crew_member_id, type, certificate_no, issue_date, expiry_date, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  const qualData = [
    [crewIds[0], '动车组列车长证', 'CZZ20230001', '2023-01-15', '2026-01-14', 'valid'],
    [crewIds[1], '动车组列车长证', 'CZZ20230002', '2023-03-20', '2026-03-19', 'valid'],
    [crewIds[5], '安全员资格证', 'AQY20220001', '2022-06-10', '2025-06-09', 'valid'],
    [crewIds[6], '餐饮服务证', 'CYF20210001', '2021-11-05', '2024-11-04', 'valid'],
  ];
  
  for (const qual of qualData) {
    insertQual.run(...qual);
  }
  console.log('资质数据插入完成');

  const insertVacation = db.prepare(`
    INSERT INTO vacations (crew_member_id, type, start_date, end_date, reason, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  insertVacation.run(crewIds[3], '年假', '2026-06-01', '2026-06-05', '年度休假', 'approved');
  console.log('休假数据插入完成');

  const insertRoute = db.prepare('INSERT INTO routes (route_no, route_name) VALUES (?, ?)');
  const route1 = insertRoute.run('G101-110', '京沪高速');
  const route2 = insertRoute.run('G501-510', '京汉高速');
  console.log('线路数据插入完成');

  const insertTrain = db.prepare(`
    INSERT INTO trains 
    (train_no, route_id, departure_station, arrival_station, departure_time, arrival_time, duration_minutes, train_type, marshalling)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  const train1 = insertTrain.run('G101', route1.lastInsertRowid, '北京南', '上海虹桥', '07:00', '11:30', 270, 'CR400AF', '8编组');
  const train2 = insertTrain.run('G103', route1.lastInsertRowid, '北京南', '上海虹桥', '07:30', '12:15', 285, 'CR400BF', '16编组');
  const train3 = insertTrain.run('G501', route2.lastInsertRowid, '北京西', '武汉', '08:00', '12:30', 270, 'CRH380A', '8编组');
  console.log('车次数据插入完成');

  const insertReq = db.prepare(`
    INSERT INTO position_requirements (train_id, position, count, qualification_required)
    VALUES (?, ?, ?, ?)
  `);
  
  insertReq.run(train1.lastInsertRowid, '列车长', 1, '动车组列车长证');
  insertReq.run(train1.lastInsertRowid, '乘务员', 2, null);
  insertReq.run(train1.lastInsertRowid, '安全员', 1, '安全员资格证');
  insertReq.run(train1.lastInsertRowid, '餐车长', 1, '餐饮服务证');
  
  insertReq.run(train2.lastInsertRowid, '列车长', 1, '动车组列车长证');
  insertReq.run(train2.lastInsertRowid, '乘务员', 3, null);
  insertReq.run(train2.lastInsertRowid, '安全员', 1, '安全员资格证');
  
  insertReq.run(train3.lastInsertRowid, '列车长', 1, '动车组列车长证');
  insertReq.run(train3.lastInsertRowid, '乘务员', 2, null);
  console.log('岗位需求数据插入完成');

  console.log('\n=== 测试数据初始化完成 ===');
  console.log('车队: 3 个');
  console.log('乘务人员: 10 人');
  console.log('线路: 2 条');
  console.log('车次: 3 趟');
  console.log('=========================');

} catch (err) {
  console.error('插入数据失败:', err.message);
} finally {
  db.close();
}
