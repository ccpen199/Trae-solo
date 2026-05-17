const db = require('./src/db');

// 检查是否已有schedule数据
const existingSchedules = db.prepare('SELECT COUNT(*) as count FROM group_class_schedules').get();

if (existingSchedules.count === 0) {
  console.log('添加测试课程场次数据...');
  
  const insertSchedule = db.prepare(`
    INSERT INTO group_class_schedules (class_id, store_id, coach_name, start_time, end_time, capacity, booked_count)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const today = new Date();
  const schedules = [
    { classId: 1, coach: '王教练', hour: 10 },
    { classId: 1, coach: '王教练', hour: 14 },
    { classId: 2, coach: '李教练', hour: 11 },
    { classId: 2, coach: '李教练', hour: 15 },
    { classId: 3, coach: '张教练', hour: 9 },
    { classId: 3, coach: '张教练', hour: 16 },
    { classId: 4, coach: '赵教练', hour: 12 },
    { classId: 5, coach: '刘教练', hour: 17 },
    { classId: 5, coach: '刘教练', hour: 19 }
  ];

  schedules.forEach((s, index) => {
    const date = new Date(today);
    date.setDate(date.getDate() + Math.floor(index / 3));
    const dateStr = date.toISOString().split('T')[0];
    
    insertSchedule.run(
      s.classId,
      1,
      s.coach,
      `${dateStr} ${String(s.hour).padStart(2, '0')}:00:00`,
      `${dateStr} ${String(s.hour + 1).padStart(2, '0')}:00:00`,
      20,
      Math.floor(Math.random() * 10)
    );
  });

  console.log(`已添加 ${schedules.length} 条课程场次数据`);
} else {
  console.log(`已有 ${existingSchedules.count} 条课程场次数据，跳过添加`);
}

// 检查并添加教练时间安排
const existingCoachSchedules = db.prepare('SELECT COUNT(*) as count FROM coach_schedules').get();

if (existingCoachSchedules.count === 0) {
  console.log('添加教练可预约时间...');
  
  const insertCoachSchedule = db.prepare(`
    INSERT INTO coach_schedules (coach_id, date, start_time, end_time)
    VALUES (?, ?, ?, ?)
  `);

  for (let coachId = 1; coachId <= 3; coachId++) {
    for (let day = 0; day < 7; day++) {
      const date = new Date(today);
      date.setDate(date.getDate() + day);
      const dateStr = date.toISOString().split('T')[0];
      
      const times = [
        { start: '09:00', end: '10:00' },
        { start: '10:30', end: '11:30' },
        { start: '14:00', end: '15:00' },
        { start: '15:30', end: '16:30' },
        { start: '19:00', end: '20:00' }
      ];
      
      times.forEach(t => {
        insertCoachSchedule.run(coachId, dateStr, t.start, t.end);
      });
    }
  }
  
  console.log('教练可预约时间添加完成');
}

console.log('测试数据添加完成!');
process.exit(0);
