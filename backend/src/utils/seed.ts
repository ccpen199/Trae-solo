import db from '../models/database';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

export function seedInitialData() {
  const adminCount = db.prepare('SELECT COUNT(*) as count FROM users WHERE role = ?').get('admin') as any;
  if (adminCount.count > 0) {
    console.log('Initial data already seeded');
    return;
  }

  const hashPassword = (pwd: string) => bcrypt.hashSync(pwd, 10);

  const insertUser = db.prepare(`
    INSERT INTO users (id, username, password, role, phone) VALUES (?, ?, ?, ?, ?)
  `);

  const insertWorker = db.prepare(`
    INSERT INTO workers (id, user_id, name, id_card, role, phone, age, gender, experience_years, native_place, education, skills, languages, certificates, lbs_fence, service_cities, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertEmployer = db.prepare(`
    INSERT INTO employers (id, user_id, name, phone, address, city, district, longitude, latitude, family_members, special_requirements)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertCertificate = db.prepare(`
    INSERT INTO skill_certificates (id, worker_id, certificate_type, certificate_number, issuing_authority, issue_date, image_url, ocr_data, verified)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertCourse = db.prepare(`
    INSERT INTO training_courses (id, title, description, cover_image, video_url, duration, category, level)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertQuiz = db.prepare(`
    INSERT INTO training_quizzes (id, course_id, question, options, correct_answer)
    VALUES (?, ?, ?, ?, ?)
  `);

  const insertGrid = db.prepare(`
    INSERT INTO service_grids (id, city, district, worker_capacity, current_workers, order_demand, min_rating, max_orders_per_day)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const adminId = uuidv4();
  insertUser.run(adminId, 'admin', hashPassword('admin123'), 'admin', '13800000000');

  const expertId = uuidv4();
  insertUser.run(expertId, 'expert', hashPassword('expert123'), 'expert', '13800000001');

  const workersData = [
    { name: '李阿姨', role: 'nanny' as const, age: 45, gender: 'female' as const, experience: 8, native: '四川', education: '高中', skills: '婴幼儿护理,辅食制作,早教启蒙', languages: '普通话,四川话' },
    { name: '王阿姨', role: 'cleaner' as const, age: 42, gender: 'female' as const, experience: 6, native: '安徽', education: '初中', skills: '家庭保洁,衣物收纳,厨艺', languages: '普通话' },
    { name: '张阿姨', role: 'maternity' as const, age: 48, gender: 'female' as const, experience: 12, native: '湖南', education: '中专', skills: '产妇护理,新生儿护理,月子餐制作,催乳', languages: '普通话,湖南话' },
    { name: '刘阿姨', role: 'nanny' as const, age: 38, gender: 'female' as const, experience: 5, native: '江苏', education: '大专', skills: '婴幼儿护理,儿童英语辅导,手工制作', languages: '普通话,英语' },
    { name: '陈阿姨', role: 'cleaner' as const, age: 40, gender: 'female' as const, experience: 7, native: '山东', education: '高中', skills: '深度清洁,家电保养,厨艺', languages: '普通话' },
  ];

  const workerIds: string[] = [];
  workersData.forEach((w, i) => {
    const userId = uuidv4();
    const workerId = uuidv4();
    workerIds.push(workerId);
    insertUser.run(userId, `worker${i + 1}`, hashPassword('worker123'), 'worker', `1390000000${i}`);
    insertWorker.run(
      workerId, userId, w.name, `31010119${80 - i}0101${1000 + i}`, w.role, `1390000000${i}`,
      w.age, w.gender, w.experience, w.native, w.education, w.skills, w.languages,
      JSON.stringify([{ type: w.role === 'nanny' ? '育婴师证' : w.role === 'cleaner' ? '家政服务员证' : '高级母婴护理师证', level: '高级' }]),
      JSON.stringify({ center: { lng: 121.4737, lat: 31.2304 }, radius: 5000 }),
      JSON.stringify(['上海市', '苏州市']),
      'active'
    );

    insertCertificate.run(
      uuidv4(), workerId,
      w.role === 'nanny' ? '育婴师职业资格证' : w.role === 'cleaner' ? '家政服务员资格证' : '高级母婴护理师证',
      `CERT${2020000 + i}`,
      '中国家庭服务业协会',
      `2020-0${i + 1}-01`,
      `/uploads/cert${i + 1}.jpg`,
      JSON.stringify({ name: w.name, certNumber: `CERT${2020000 + i}`, issueDate: `2020-0${i + 1}-01` }),
      1
    );
  });

  const employersData = [
    { name: '张先生', address: '上海市浦东新区陆家嘴环路1000号', city: '上海市', district: '浦东新区', lng: 121.5049, lat: 31.2397, family: 4, reqs: '需要照顾3岁宝宝,要求有育婴师证' },
    { name: '李女士', address: '上海市徐汇区衡山路100号', city: '上海市', district: '徐汇区', lng: 121.4370, lat: 31.2001, family: 3, reqs: '需要每周3次深度保洁' },
    { name: '王先生', address: '上海市静安区南京西路1266号', city: '上海市', district: '静安区', lng: 121.4520, lat: 31.2280, family: 5, reqs: '月嫂服务,预产期2024年3月' },
  ];

  employersData.forEach((e, i) => {
    const userId = uuidv4();
    insertUser.run(userId, `employer${i + 1}`, hashPassword('employer123'), 'employer', `1370000000${i}`);
    insertEmployer.run(uuidv4(), userId, e.name, `1370000000${i}`, e.address, e.city, e.district, e.lng, e.lat, e.family, e.reqs);
  });

  const coursesData = [
    { title: '婴幼儿日常护理基础', desc: '学习婴幼儿喂养、睡眠、卫生等基础护理知识', cat: 'nanny' as const, level: 'beginner' as const, duration: 120 },
    { title: '家庭保洁标准化流程', desc: '掌握科学的保洁顺序和高效清洁技巧', cat: 'cleaner' as const, level: 'beginner' as const, duration: 90 },
    { title: '产妇产后恢复护理', desc: '专业的月子护理知识,帮助产妇科学恢复', cat: 'maternity' as const, level: 'intermediate' as const, duration: 180 },
    { title: '婴幼儿早教启蒙', desc: '0-3岁宝宝智力开发和早期教育方法', cat: 'nanny' as const, level: 'intermediate' as const, duration: 150 },
    { title: '新生儿常见疾病预防', desc: '识别和应对新生儿常见健康问题', cat: 'maternity' as const, level: 'advanced' as const, duration: 120 },
    { title: '沟通技巧与服务礼仪', desc: '提升服务者与雇主的沟通能力和职业素养', cat: 'general' as const, level: 'beginner' as const, duration: 60 },
  ];

  const courseIds: string[] = [];
  coursesData.forEach((c, i) => {
    const courseId = uuidv4();
    courseIds.push(courseId);
    insertCourse.run(courseId, c.title, c.desc, `/uploads/course${i + 1}.jpg`, `/videos/course${i + 1}.mp4`, c.duration, c.cat, c.level);

    const quizQuestions = [
      { q: '婴幼儿适宜的室温是多少？', options: ['18-20°C', '22-24°C', '26-28°C', '30-32°C'], ans: 1 },
      { q: '新生儿多久需要喂一次奶？', options: ['1-2小时', '2-3小时', '3-4小时', '4-5小时'], ans: 1 },
    ];
    quizQuestions.forEach((quiz, j) => {
      insertQuiz.run(uuidv4(), courseId, quiz.q, JSON.stringify(quiz.options), quiz.ans);
    });
  });

  const grids = [
    { city: '上海市', district: '浦东新区', capacity: 50, workers: 35, demand: 80, rating: 4.0, maxOrders: 5 },
    { city: '上海市', district: '徐汇区', capacity: 40, workers: 28, demand: 60, rating: 4.2, maxOrders: 5 },
    { city: '上海市', district: '静安区', capacity: 30, workers: 22, demand: 45, rating: 4.0, maxOrders: 5 },
    { city: '上海市', district: '黄浦区', capacity: 25, workers: 18, demand: 40, rating: 4.3, maxOrders: 5 },
  ];
  grids.forEach((g) => {
    insertGrid.run(uuidv4(), g.city, g.district, g.capacity, g.workers, g.demand, g.rating, g.maxOrders);
  });

  console.log('Initial data seeded successfully');
}
