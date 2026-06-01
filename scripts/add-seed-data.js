const db = require('../backend/src/database');

function addSeedData() {
  console.log('Checking and adding seed data...');

  const liveCount = db.prepare('SELECT COUNT(*) as count FROM live_rooms').get().count;
  
  if (liveCount === 0) {
    console.log('Adding live rooms seed data...');
    
    const insertLiveRoom = db.prepare(`
      INSERT INTO live_rooms (company_id, hr_id, title, description, status, viewer_count, start_time, end_time)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const dayAfterTomorrow = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

    insertLiveRoom.run(
      1, 2, 
      '【春招专场】科技创新前端/算法岗位热招',
      '春招进行时！科技创新有限公司前端/算法岗位热招中，本次直播将详细介绍公司福利、技术栈、面试流程。HR在线答疑，现场投递简历直通面试！',
      'live', 128,
      now.toISOString(), null
    );

    insertLiveRoom.run(
      1, 2,
      '【校招专属】2024校园招聘技术岗解读',
      '针对2024届毕业生，解读校招政策、培养体系、晋升路径，学长学姐分享工作体验。',
      'live', 89,
      now.toISOString(), null
    );

    insertLiveRoom.run(
      2, 3,
      '金融精英专场：技术/数据分析岗位招聘',
      '金融控股集团技术中心招聘，Java/数据分析师多岗位，提供具有竞争力的薪资和完善的培训体系。',
      'upcoming', 0,
      tomorrow.toISOString(), null
    );

    insertLiveRoom.run(
      2, 3,
      '【高管面对面】金融科技战略与人才发展',
      'CTO亲自解读公司金融科技战略，与高管一对一交流机会，现场发放直通终面卡。',
      'upcoming', 0,
      dayAfterTomorrow.toISOString(), null
    );

    insertLiveRoom.run(
      1, 2,
      '【回顾】人工智能在企业中的应用实践',
      'AI算法团队负责人分享在实际业务中的AI应用案例和技术选型思路。',
      'ended', 512,
      twoDaysAgo.toISOString(), yesterday.toISOString()
    );

    insertLiveRoom.run(
      2, 3,
      '【回顾】金融行业Java面试经验分享',
      '资深面试官亲授金融行业Java面试要点，助你拿到心仪offer。',
      'ended', 348,
      yesterday.toISOString(), now.toISOString()
    );

    console.log('Added 6 live rooms');
  }

  const danmakuCount = db.prepare('SELECT COUNT(*) as count FROM live_danmakus').get().count;
  if (danmakuCount === 0) {
    console.log('Adding danmaku seed data...');
    
    const insertDanmaku = db.prepare(`
      INSERT INTO live_danmakus (live_room_id, user_id, content)
      VALUES (?, ?, ?)
    `);

    const messages = [
      '这个岗位薪资范围是多少？',
      '请问需要加班吗？',
      '投递简历后多久有反馈？',
      '公司有食堂吗？',
      '五险一金按什么基数缴纳？',
      '有远程办公机会吗？',
      '新人培训体系怎么样？',
      '请问这个岗位招应届生吗？',
      '工作地点在哪里？',
      '请问团队有多少人？',
    ];

    for (let i = 0; i < 20; i++) {
      insertDanmaku.run(1, (i % 3) + 4, messages[i % messages.length]);
    }

    console.log('Added 20 danmakus');
  }

  console.log('Seed data check complete!');
}

addSeedData();
