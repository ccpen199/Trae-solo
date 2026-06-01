require('dotenv').config({ path: '../../.env' });
const Database = require('better-sqlite3');
const path = require('path');
const dayjs = require('dayjs');

const dbPath = path.join(__dirname, '../../data/app.sqlite');
const db = new Database(dbPath);
db.pragma('foreign_keys = ON');

try {
  db.exec('PRAGMA foreign_keys = OFF');
  db.exec('DELETE FROM work_records');
  db.exec('DELETE FROM schedule_assignments');
  db.exec('DELETE FROM schedules');
  db.exec('DELETE FROM shift_changes');
  db.exec('DELETE FROM position_requirements');
  db.exec('DELETE FROM trains');
  db.exec('DELETE FROM routes');
  db.exec('DELETE FROM vacations');
  db.exec('DELETE FROM trainings');
  db.exec('DELETE FROM qualifications');
  db.exec('DELETE FROM crew_members');
  db.exec('DELETE FROM fleets');
  db.exec('PRAGMA foreign_keys = ON');

  console.log('已清空旧数据');

  const insertFleet = db.prepare('INSERT INTO fleets (name, description) VALUES (?, ?)');
  const fleet1 = insertFleet.run('北京客运段一队', '负责京沪、京广线路');
  const fleet2 = insertFleet.run('北京客运段二队', '负责京汉、京蓉线路');
  const fleet3 = insertFleet.run('上海客运段一队', '负责沪宁、沪杭线路');
  
  console.log('✓ 车队数据: 3 个');

  const insertCrew = db.prepare(`
    INSERT INTO crew_members 
    (employee_no, name, gender, phone, position, fleet_id, status, health_status, schedule_scope, hire_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const crewData = [
    ['BJ001', '张伟', '男', '13800138001', '列车长', fleet1.lastInsertRowid, 'active', 'normal', '京沪线,京广线', '2018-03-15'],
    ['BJ002', '李娜', '女', '13800138002', '列车长', fleet1.lastInsertRowid, 'active', 'normal', '京沪线', '2019-05-20'],
    ['BJ003', '王芳', '女', '13800138003', '乘务员', fleet1.lastInsertRowid, 'active', 'normal', '京沪线', '2020-02-10'],
    ['BJ004', '刘洋', '男', '13800138004', '乘务员', fleet1.lastInsertRowid, 'active', 'normal', '京沪线,京广线', '2020-06-25'],
    ['BJ005', '陈静', '女', '13800138005', '乘务员', fleet2.lastInsertRowid, 'active', 'normal', '京汉线', '2019-11-08'],
    ['BJ006', '赵强', '男', '13800138006', '安全员', fleet1.lastInsertRowid, 'active', 'normal', '京沪线', '2018-09-12'],
    ['BJ007', '孙丽', '女', '13800138007', '餐车长', fleet1.lastInsertRowid, 'active', 'normal', '京沪线', '2017-04-30'],
    ['BJ008', '周明', '男', '13800138008', '乘务员', fleet2.lastInsertRowid, 'active', 'normal', '京汉线,京蓉线', '2021-01-18'],
    ['SH001', '吴敏', '女', '13800138009', '列车长', fleet3.lastInsertRowid, 'active', 'normal', '沪宁线', '2019-07-22'],
    ['SH002', '郑华', '男', '13800138010', '乘务员', fleet3.lastInsertRowid, 'active', 'normal', '沪宁线,沪杭线', '2020-08-05'],
    ['BJ009', '马超', '男', '13800138011', '列车长', fleet2.lastInsertRowid, 'active', 'normal', '京汉线', '2017-12-01'],
    ['BJ010', '黄蓉', '女', '13800138012', '乘务员', fleet1.lastInsertRowid, 'active', 'normal', '京沪线', '2022-03-15'],
    ['BJ011', '林冲', '男', '13800138013', '安全员', fleet2.lastInsertRowid, 'active', 'normal', '京汉线', '2019-06-20'],
    ['BJ012', '黛玉', '女', '13800138014', '乘务员', fleet1.lastInsertRowid, 'active', 'normal', '京沪线', '2021-09-10'],
  ];

  const crewIds = [];
  for (const crew of crewData) {
    const result = insertCrew.run(...crew);
    crewIds.push(result.lastInsertRowid);
  }
  console.log('✓ 乘务人员数据: 14 人');

  const insertQual = db.prepare(`
    INSERT INTO qualifications (crew_member_id, type, certificate_no, issue_date, expiry_date, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  const qualData = [
    [crewIds[0], '动车组列车长证', 'CZZ20230001', '2023-01-15', '2026-01-14', 'valid'],
    [crewIds[1], '动车组列车长证', 'CZZ20230002', '2023-03-20', '2026-03-19', 'valid'],
    [crewIds[5], '安全员资格证', 'AQY20220001', '2022-06-10', '2025-06-09', 'valid'],
    [crewIds[6], '餐饮服务证', 'CYF20210001', '2021-11-05', '2024-11-04', 'valid'],
    [crewIds[8], '动车组列车长证', 'CZZ20230003', '2023-05-10', '2026-05-09', 'valid'],
    [crewIds[10], '动车组列车长证', 'CZZ20220004', '2022-08-15', '2025-08-14', 'valid'],
    [crewIds[12], '安全员资格证', 'AQY20230002', '2023-02-20', '2026-02-19', 'valid'],
    [crewIds[2], '乘务服务资格证', 'CWF20220001', '2022-04-10', '2025-04-09', 'valid'],
    [crewIds[3], '乘务服务资格证', 'CWF20220002', '2022-05-15', '2025-05-14', 'valid'],
  ];
  
  for (const qual of qualData) {
    insertQual.run(...qual);
  }
  console.log('✓ 资质数据: 9 条');

  const insertVacation = db.prepare(`
    INSERT INTO vacations (crew_member_id, type, start_date, end_date, reason, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const today = dayjs();
  insertVacation.run(crewIds[4], '年假', today.subtract(2, 'day').format('YYYY-MM-DD'), today.add(3, 'day').format('YYYY-MM-DD'), '年度休假', 'approved');
  insertVacation.run(crewIds[9], '病假', today.add(5, 'day').format('YYYY-MM-DD'), today.add(7, 'day').format('YYYY-MM-DD'), '感冒发烧', 'approved');
  insertVacation.run(crewIds[7], '事假', today.subtract(10, 'day').format('YYYY-MM-DD'), today.subtract(8, 'day').format('YYYY-MM-DD'), '家庭事务', 'approved');
  console.log('✓ 休假数据: 3 条');

  const insertTraining = db.prepare(`
    INSERT INTO trainings (crew_member_id, course_name, training_date, result, score)
    VALUES (?, ?, ?, ?, ?)
  `);
  insertTraining.run(crewIds[0], '安全生产培训', today.subtract(5, 'day').format('YYYY-MM-DD'), '合格', 92);
  insertTraining.run(crewIds[1], '服务礼仪培训', today.subtract(3, 'day').format('YYYY-MM-DD'), '优秀', 95);
  insertTraining.run(crewIds[2], '应急演练', today.subtract(7, 'day').format('YYYY-MM-DD'), '合格', 88);
  insertTraining.run(crewIds[3], '消防知识培训', today.subtract(10, 'day').format('YYYY-MM-DD'), '合格', 85);
  insertTraining.run(crewIds[5], '安全检查培训', today.subtract(15, 'day').format('YYYY-MM-DD'), '优秀', 96);
  console.log('✓ 培训数据: 5 条');

  const insertRoute = db.prepare('INSERT INTO routes (route_no, route_name) VALUES (?, ?)');
  const route1 = insertRoute.run('G101-110', '京沪高速');
  const route2 = insertRoute.run('G501-510', '京汉高速');
  const route3 = insertRoute.run('G7001-7010', '沪宁城际');
  console.log('✓ 线路数据: 3 条');

  const insertTrain = db.prepare(`
    INSERT INTO trains 
    (train_no, route_id, departure_station, arrival_station, departure_time, arrival_time, duration_minutes, train_type, marshalling)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  const train1 = insertTrain.run('G101', route1.lastInsertRowid, '北京南', '上海虹桥', '07:00', '11:30', 270, 'CR400AF', '8编组');
  const train2 = insertTrain.run('G103', route1.lastInsertRowid, '北京南', '上海虹桥', '07:30', '12:15', 285, 'CR400BF', '16编组');
  const train3 = insertTrain.run('G105', route1.lastInsertRowid, '北京南', '上海虹桥', '08:00', '12:45', 285, 'CRH380B', '8编组');
  const train4 = insertTrain.run('G501', route2.lastInsertRowid, '北京西', '武汉', '08:00', '12:30', 270, 'CRH380A', '8编组');
  const train5 = insertTrain.run('G503', route2.lastInsertRowid, '北京西', '武汉', '09:00', '13:45', 285, 'CR400AF', '16编组');
  const train6 = insertTrain.run('G7001', route3.lastInsertRowid, '上海', '南京', '06:30', '08:45', 135, 'CRH2C', '8编组');
  console.log('✓ 车次数据: 6 趟');

  const insertReq = db.prepare(`
    INSERT INTO position_requirements (train_id, position, count, qualification_required)
    VALUES (?, ?, ?, ?)
  `);
  
  const trains = [train1, train2, train3, train4, train5, train6];
  for (const train of trains) {
    insertReq.run(train.lastInsertRowid, '列车长', 1, '动车组列车长证');
    insertReq.run(train.lastInsertRowid, '乘务员', 2, '乘务服务资格证');
    insertReq.run(train.lastInsertRowid, '安全员', 1, '安全员资格证');
    if (train === train1 || train === train3) {
      insertReq.run(train.lastInsertRowid, '餐车长', 1, '餐饮服务证');
    }
  }
  console.log('✓ 岗位需求数据已配置');

  const insertSchedule = db.prepare(`
    INSERT INTO schedules (train_id, schedule_date, status, notes)
    VALUES (?, ?, ?, ?)
  `);

  const insertAssignment = db.prepare(`
    INSERT INTO schedule_assignments 
    (schedule_id, crew_member_id, position, duty_start_time, duty_end_time, work_hours, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const insertWorkRecord = db.prepare(`
    INSERT INTO work_records (crew_member_id, schedule_id, record_date, work_type, hours)
    VALUES (?, ?, ?, 'duty', ?)
  `);

  const scheduleData = [
    { trainId: train1.lastInsertRowid, date: today.format('YYYY-MM-DD'), crew: [crewIds[0], crewIds[2], crewIds[3], crewIds[5], crewIds[6]] },
    { trainId: train2.lastInsertRowid, date: today.format('YYYY-MM-DD'), crew: [crewIds[1], crewIds[11], crewIds[13], crewIds[12]] },
    { trainId: train4.lastInsertRowid, date: today.format('YYYY-MM-DD'), crew: [crewIds[10], crewIds[7], crewIds[4]] },
    { trainId: train1.lastInsertRowid, date: today.subtract(1, 'day').format('YYYY-MM-DD'), crew: [crewIds[0], crewIds[2], crewIds[3], crewIds[5], crewIds[6]] },
    { trainId: train2.lastInsertRowid, date: today.subtract(1, 'day').format('YYYY-MM-DD'), crew: [crewIds[1], crewIds[11], crewIds[13], crewIds[12]] },
    { trainId: train1.lastInsertRowid, date: today.subtract(2, 'day').format('YYYY-MM-DD'), crew: [crewIds[0], crewIds[2], crewIds[3], crewIds[5], crewIds[6]] },
    { trainId: train3.lastInsertRowid, date: today.subtract(2, 'day').format('YYYY-MM-DD'), crew: [crewIds[8], crewIds[9], crewIds[13], crewIds[12]] },
    { trainId: train1.lastInsertRowid, date: today.subtract(3, 'day').format('YYYY-MM-DD'), crew: [crewIds[0], crewIds[2], crewIds[3], crewIds[5], crewIds[6]] },
    { trainId: train1.lastInsertRowid, date: today.subtract(4, 'day').format('YYYY-MM-DD'), crew: [crewIds[0], crewIds[2], crewIds[3], crewIds[5], crewIds[6]] },
    { trainId: train1.lastInsertRowid, date: today.subtract(5, 'day').format('YYYY-MM-DD'), crew: [crewIds[0], crewIds[2], crewIds[3], crewIds[5], crewIds[6]] },
    { trainId: train1.lastInsertRowid, date: today.subtract(6, 'day').format('YYYY-MM-DD'), crew: [crewIds[0], crewIds[2], crewIds[3], crewIds[5], crewIds[6]] },
    { trainId: train1.lastInsertRowid, date: today.subtract(7, 'day').format('YYYY-MM-DD'), crew: [crewIds[0], crewIds[2], crewIds[3], crewIds[5], crewIds[6]] },
  ];

  const positions = ['列车长', '乘务员', '乘务员', '安全员', '餐车长'];
  
  for (const sched of scheduleData) {
    const schedResult = insertSchedule.run(sched.trainId, sched.date, 'confirmed', '系统自动排班');
    
    for (let i = 0; i < sched.crew.length; i++) {
      const pos = positions[i] || '乘务员';
      const dutyStart = `${sched.date} 06:00`;
      const dutyEnd = `${sched.date} 13:00`;
      const hours = 7.0;
      
      const assignResult = insertAssignment.run(
        schedResult.lastInsertRowid,
        sched.crew[i],
        pos,
        dutyStart,
        dutyEnd,
        hours,
        'assigned'
      );
      
      insertWorkRecord.run(sched.crew[i], schedResult.lastInsertRowid, sched.date, hours);
    }
  }
  console.log('✓ 排班数据: 12 天排班记录已生成');

  const insertShiftChange = db.prepare(`
    INSERT INTO shift_changes 
    (schedule_assignment_id, type, original_crew_id, new_crew_id, reason, status, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const assignments = db.prepare('SELECT * FROM schedule_assignments LIMIT 5').all();
  
  if (assignments.length >= 3) {
    insertShiftChange.run(
      assignments[0].id, 
      'swap', 
      crewIds[0], 
      crewIds[1], 
      '张伟家中有事，与李娜换班', 
      'pending',
      1
    );
    insertShiftChange.run(
      assignments[1].id, 
      'replace', 
      crewIds[4], 
      crewIds[11], 
      '陈静休假，由黄蓉临时补班', 
      'approved',
      1
    );
    insertShiftChange.run(
      assignments[2].id, 
      'shortage', 
      null, 
      crewIds[13], 
      '临时缺员，紧急调配黛玉上岗', 
      'approved',
      1
    );
  }
  console.log('✓ 调班申请数据: 3 条');

  console.log('\n========================================');
  console.log('  测试数据生成完成！');
  console.log('  - 车队: 3 个');
  console.log('  - 乘务人员: 14 人');
  console.log('  - 线路: 3 条');
  console.log('  - 车次: 6 趟');
  console.log('  - 今日排班: 3 趟');
  console.log('  - 待处理调班: 1 条');
  console.log('  - 已生成连续排班(可测试连续值乘超限)');
  console.log('========================================\n');

} catch (err) {
  console.error('❌ 生成数据失败:', err.message);
  console.error(err.stack);
} finally {
  db.close();
}
