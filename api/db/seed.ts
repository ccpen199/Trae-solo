import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { db } from './index.ts';

const categories = ['舞蹈', '音乐', '运动', '绘画', '摄影', '烹饪', '编程', '语言'];

function svgDataUri(label: string, bg = '#4f46e5', fg = '#ffffff') {
  const text = label.slice(0, 4);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360"><rect width="640" height="360" rx="28" fill="${bg}"/><circle cx="520" cy="70" r="90" fill="${fg}" opacity=".14"/><circle cx="90" cy="300" r="120" fill="${fg}" opacity=".10"/><text x="50%" y="52%" text-anchor="middle" dominant-baseline="middle" font-family="Arial,'PingFang SC',sans-serif" font-size="58" font-weight="700" fill="${fg}">${text}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const avatar = (label: string) => svgDataUri(label, '#2563eb');
const cover = (label: string, bg: string) => svgDataUri(label, bg);

const creators = [
  { username: '林舞蹈家', avatar: avatar('舞蹈'), bio: '爵士舞/现代舞导师，10年教学经验', location: '北京', rating: 4.9 },
  { username: '张吉他手', avatar: avatar('吉他'), bio: '民谣/电吉他教学，音乐制作人', location: '上海', rating: 4.8 },
  { username: '王健身教练', avatar: avatar('健身'), bio: '健身/瑜伽/普拉提认证教练', location: '深圳', rating: 4.7 },
  { username: '李画师', avatar: avatar('绘画'), bio: '水彩/油画/数字绘画', location: '杭州', rating: 4.9 },
  { username: '陈摄影师', avatar: avatar('摄影'), bio: '人像/风光/商业摄影', location: '广州', rating: 4.8 },
];

const courses = [
  { title: '爵士舞入门到精通', description: '从零开始学习爵士舞，基础步伐到成品舞', category: '舞蹈', price: 199, cover: cover('爵士舞', '#7c3aed'), chapters: 8 },
  { title: '吉他弹唱三月通', description: '零基础吉他教学，轻松学会弹唱', category: '音乐', price: 149, cover: cover('吉他弹唱', '#0f766e'), chapters: 12 },
  { title: '居家健身减脂计划', description: '科学减脂，30天蜕变', category: '运动', price: 99, cover: cover('健身减脂', '#dc2626'), chapters: 15 },
  { title: '水彩风景绘画', description: '掌握水彩技法，画出美丽风景', category: '绘画', price: 129, cover: cover('水彩绘画', '#0284c7'), chapters: 10 },
  { title: '人像摄影入门', description: '拍出专业级人像照片', category: '摄影', price: 169, cover: cover('人像摄影', '#334155'), chapters: 8 },
  { title: '法式甜点烘焙', description: '在家也能做出专业甜点', category: '烹饪', price: 89, cover: cover('甜点烘焙', '#c2410c'), chapters: 10 },
  { title: 'Web前端开发实战', description: 'React+TypeScript全栈开发', category: '编程', price: 299, cover: cover('前端开发', '#1d4ed8'), chapters: 20 },
  { title: '商务英语口语', description: '职场英语轻松应对', category: '语言', price: 179, cover: cover('商务英语', '#9333ea'), chapters: 16 },
];

const serviceOrders = [
  { title: '上门教爵士舞基础', description: '想学习爵士舞基础，每周2次，每次1小时', category: '舞蹈', price: 300, deposit: 100, location: '朝阳区', duration: 60 },
  { title: '吉他一对一教学', description: '零基础，想学习民谣吉他弹唱', category: '音乐', price: 200, deposit: 50, location: '浦东新区', duration: 90 },
  { title: '私教健身课程', description: '增肌减脂，每周3次', category: '运动', price: 400, deposit: 150, location: '南山区', duration: 90 },
  { title: '儿童绘画启蒙', description: '5岁孩子绘画启蒙，周末上课', category: '绘画', price: 180, deposit: 50, location: '西湖区', duration: 60 },
  { title: '家庭摄影服务', description: '全家福拍摄，精修20张', category: '摄影', price: 800, deposit: 300, location: '天河区', duration: 180 },
  { title: '家宴烹饪指导', description: '生日派对家宴，8人份', category: '烹饪', price: 1500, deposit: 500, location: '海淀区', duration: 240 },
];

export function seedData() {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (userCount.count > 0) {
    console.log('Database already seeded, skipping...');
    return;
  }

  const insertUser = db.prepare(`
    INSERT INTO users (id, username, password_hash, avatar, role, bio, follower_count, following_count, rating, verified, location)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertWallet = db.prepare(`
    INSERT INTO wallets (id, user_id, balance)
    VALUES (?, ?, ?)
  `);

  const passwordHash = bcrypt.hashSync('123456', 10);

  const adminId = uuidv4();
  insertUser.run(adminId, 'admin', passwordHash, '', 'admin', '平台管理员', 0, 0, 5.0, 1, '');
  insertWallet.run(uuidv4(), adminId, 0);

  const requesterId = uuidv4();
  insertUser.run(
    requesterId,
    '需求方小王',
    passwordHash,
    avatar('需求方'),
    'requester',
    '企业采购负责人，经常发布定制服务需求',
    50,
    120,
    4.8,
    1,
    '北京'
  );
  insertWallet.run(uuidv4(), requesterId, 50000);

  const creatorIds: string[] = [];
  creators.forEach((creator) => {
    const id = uuidv4();
    insertUser.run(
      id,
      creator.username,
      passwordHash,
      creator.avatar,
      'creator',
      creator.bio,
      Math.floor(Math.random() * 5000) + 100,
      Math.floor(Math.random() * 100),
      creator.rating,
      1,
      creator.location
    );
    insertWallet.run(uuidv4(), id, Math.floor(Math.random() * 50000) + 1000);
    creatorIds.push(id);
  });

  for (let i = 1; i <= 20; i++) {
    const id = uuidv4();
    insertUser.run(
      id,
      `用户${i}`,
      passwordHash,
      avatar(`用户${i}`),
      'user',
      `这是用户${i}的简介`,
      Math.floor(Math.random() * 500),
      Math.floor(Math.random() * 200),
      4.5 + Math.random() * 0.5,
      i <= 5 ? 1 : 0,
      ['北京', '上海', '深圳', '广州', '杭州'][Math.floor(Math.random() * 5)]
    );
    insertWallet.run(uuidv4(), id, Math.floor(Math.random() * 5000));
  }

  const insertCourse = db.prepare(`
    INSERT INTO courses (id, creator_id, title, description, cover_image, category, price, subscription_price, is_subscription, student_count, rating, review_count, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertChapter = db.prepare(`
    INSERT INTO chapters (id, course_id, title, video_url, duration, order_index, is_free)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const insertReviewRecord = db.prepare(`
    INSERT INTO review_records (id, content_type, content_id, submitter_id, status)
    VALUES (?, ?, ?, ?, ?)
  `);

  courses.forEach((course, idx) => {
    const courseId = uuidv4();
    const creatorIdx = idx % creatorIds.length;
    insertCourse.run(
      courseId,
      creatorIds[creatorIdx],
      course.title,
      course.description,
      course.cover,
      course.category,
      course.price,
      Math.floor(course.price * 0.3),
      1,
      Math.floor(Math.random() * 2000) + 100,
      4.5 + Math.random() * 0.5,
      Math.floor(Math.random() * 200) + 10,
      'published'
    );

    for (let i = 1; i <= course.chapters; i++) {
      insertChapter.run(
        uuidv4(),
        courseId,
        `第${i}课：${['基础介绍', '核心动作', '进阶技巧', '组合练习', '成品演练', '易错纠正', '实战应用', '总结回顾'][Math.min(i - 1, 7)]}`,
        `https://example.com/videos/${courseId}/${i}.mp4`,
        Math.floor(Math.random() * 600) + 120,
        i,
        i <= 2 ? 1 : 0
      );
    }

    const reviewId = uuidv4();
    insertReviewRecord.run(reviewId, 'course', courseId, creatorIds[creatorIdx], 'approved');
    db.prepare('UPDATE review_records SET reviewed_at = CURRENT_TIMESTAMP, reviewer_id = ? WHERE id = ?').run(adminId, reviewId);
  });

  const insertOrder = db.prepare(`
    INSERT INTO service_orders (id, requester_id, creator_id, title, description, category, price, deposit, location, service_time, duration, status, insurance_policy, requirements)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertTrace = db.prepare(`
    INSERT INTO service_traces (id, order_id, type, content, operator_id)
    VALUES (?, ?, ?, ?, ?)
  `);

  const allUserIds: string[] = [...creatorIds];
  for (let i = 1; i <= 10; i++) {
    const user = db.prepare('SELECT id FROM users WHERE username = ?').get(`用户${i}`) as { id: string };
    if (user) allUserIds.push(user.id);
  }

  serviceOrders.forEach((order, idx) => {
    const orderId = uuidv4();
    const requesterIdx = (idx + 3) % allUserIds.length;
    const statuses: ('published' | 'matched' | 'confirmed' | 'deposit_paid' | 'in_progress' | 'completed')[] = 
      ['published', 'matched', 'confirmed', 'deposit_paid', 'in_progress', 'completed'];
    const status = statuses[idx % statuses.length];
    const hasCreator = status !== 'published';
    const creatorIdx = idx % creatorIds.length;

    const serviceDate = new Date();
    serviceDate.setDate(serviceDate.getDate() + Math.floor(Math.random() * 30));

    insertOrder.run(
      orderId,
      allUserIds[requesterIdx],
      hasCreator ? creatorIds[creatorIdx] : null,
      order.title,
      order.description,
      order.category,
      order.price,
      order.deposit,
      order.location,
      serviceDate.toISOString(),
      order.duration,
      status,
      status === 'deposit_paid' || status === 'in_progress' || status === 'completed' ? `INS-${uuidv4().slice(0, 8).toUpperCase()}` : null,
      '请提前准备相关器材'
    );

    insertTrace.run(uuidv4(), orderId, 'create', '订单创建成功', allUserIds[requesterIdx]);
    if (hasCreator) {
      insertTrace.run(uuidv4(), orderId, 'match', '匹配到合适的服务者', null);
      insertTrace.run(uuidv4(), orderId, 'accept', '服务者已接单', creatorIds[creatorIdx]);
    }
    if (status === 'deposit_paid' || status === 'in_progress' || status === 'completed') {
      insertTrace.run(uuidv4(), orderId, 'deposit_paid', '定金已支付', allUserIds[requesterIdx]);
    }
    if (status === 'completed') {
      insertTrace.run(uuidv4(), orderId, 'complete', '服务已完成', null);
    }
  });

  const insertReview = db.prepare(`
    INSERT INTO reviews (id, order_id, course_id, user_id, rating, content)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const completedOrders = db.prepare("SELECT * FROM service_orders WHERE status = 'completed'").all() as any[];
  completedOrders.forEach((order) => {
    insertReview.run(
      uuidv4(),
      order.id,
      null,
      order.requester_id,
      4 + Math.floor(Math.random() * 2),
      ['老师很专业，讲解清晰', '服务态度很好，学到很多', '非常满意，下次还会约', '性价比很高，推荐！'][Math.floor(Math.random() * 4)]
    );
  });

  const publishedCourses = db.prepare("SELECT id FROM courses WHERE status = 'published'").all() as { id: string }[];
  publishedCourses.slice(0, 3).forEach((course) => {
    for (let i = 0; i < 5; i++) {
      const userIdx = 5 + i;
      const user = db.prepare('SELECT id FROM users WHERE username = ?').get(`用户${userIdx}`) as { id: string };
      if (user) {
        insertReview.run(
          uuidv4(),
          null,
          course.id,
          user.id,
          4 + Math.floor(Math.random() * 2),
          ['课程内容很丰富', '讲解很细致', '物有所值', '老师讲得很好', '适合零基础'][Math.floor(Math.random() * 5)]
        );
      }
    }
  });

  const insertTx = db.prepare(`
    INSERT INTO transactions (id, order_id, course_id, from_user_id, to_user_id, amount, platform_fee, type, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  completedOrders.forEach((order) => {
    const platformFee = order.price * 0.1;
    insertTx.run(
      uuidv4(),
      order.id,
      null,
      order.requester_id,
      order.creator_id,
      order.price - platformFee,
      platformFee,
      'service_final',
      'success'
    );
  });

  publishedCourses.slice(0, 3).forEach((course) => {
    const courseData = db.prepare('SELECT creator_id, price FROM courses WHERE id = ?').get(course.id) as { creator_id: string; price: number };
    for (let i = 0; i < 3; i++) {
      const user = db.prepare('SELECT id FROM users WHERE username = ?').get(`用户${8 + i}`) as { id: string };
      if (user && courseData) {
        const platformFee = courseData.price * 0.15;
        insertTx.run(
          uuidv4(),
          null,
          course.id,
          user.id,
          courseData.creator_id,
          courseData.price - platformFee,
          platformFee,
          'course_purchase',
          'success'
        );
      }
    }
  });

  console.log('Database seeded successfully.');
  console.log('Test accounts:');
  console.log('  Admin: admin / 123456');
  console.log('  Creator: 林舞蹈家 / 123456');
  console.log('  Requester: 需求方小王 / 123456');
  console.log('  User: 用户1 / 123456');
}

export default seedData;
