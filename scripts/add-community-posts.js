const db = require('../backend/src/database');

function addCommunityPosts() {
  console.log('Adding community posts seed data...');

  const communities = db.prepare('SELECT id, name FROM communities').all();
  const users = db.prepare('SELECT id FROM users WHERE role IN (?, ?)', ['jobseeker', 'hr']).all();

  const postTemplates = [
    {
      type: 'question',
      title: '请问前端岗位一般面试流程是怎样的？',
      content: '最近在面试前端岗位，想了解一下一般会有几轮面试，每轮主要考察什么？有什么需要特别注意的吗？',
      is_anonymous: true,
    },
    {
      type: 'question',
      title: '大家觉得在互联网公司工作35岁以上真的有年龄危机吗？',
      content: '看到很多讨论说互联网35岁危机，想问问圈内的朋友真实情况是怎样的？技术岗和管理岗分别是什么情况？',
      is_anonymous: true,
    },
    {
      type: 'question',
      title: '请问公司的前端技术栈是什么样的？',
      content: '刚通过一面，想了解一下公司主要用什么框架，有没有代码规范和CI/CD流程？',
      is_anonymous: false,
    },
    {
      type: 'discussion',
      title: '分享一下我今年跳槽涨薪50%的经验',
      content: '年前开始准备，系统复习了两个月，面试了5家公司，最终拿到了涨幅50%的offer。主要经验是：1. 系统整理知识体系 2. 多刷算法题 3. 项目经历要深挖 4. 谈薪技巧很重要。大家有什么问题可以问我。',
      is_anonymous: false,
    },
    {
      type: 'discussion',
      title: '你们会在下班时间回复工作消息吗？',
      content: '最近入职的新公司，领导经常在晚上和周末发消息安排工作，感觉私人时间被严重占用。想问问大家都是怎么处理这种情况的？',
      is_anonymous: true,
    },
    {
      type: 'referral',
      title: '【内推】科技创新-高级前端开发工程师',
      content: '团队扩招，HC充足，面试流程快。要求：3年以上前端经验，精通React，有大型项目经验。福利：14薪+年终奖+股票期权。感兴趣的朋友可以私信我发简历，合适的话可以直接推给部门leader。',
      is_anonymous: false,
    },
    {
      type: 'referral',
      title: '【内推】金融集团-Java开发工程师',
      content: '金融科技团队招聘，稳定不裁员。要求：本科以上学历，2年以上Java开发经验，熟悉Spring Boot。内推免简历筛选，直通技术面。',
      is_anonymous: false,
    },
    {
      type: 'question',
      title: '试用期6个月正常吗？会不会有坑？',
      content: '拿到的offer试用期是6个月，工资打8折。想问问这是不是正常的？有没有什么需要注意的地方，避免试用期被辞退？',
      is_anonymous: true,
    },
    {
      type: 'discussion',
      title: '大家觉得远程办公效率怎么样？',
      content: '我们公司已经远程办公半年了，我个人感觉效率反而更高了，节省了通勤时间，也更自由。但也有同事觉得在家容易摸鱼。想听听大家的看法？',
      is_anonymous: false,
    },
    {
      type: 'referral',
      title: '【校友内推】字节跳动2024校园招聘',
      content: '作为校友给大家内推字节跳动的校招岗位，算法、开发、产品都有HC。内推码：XX2024，网申时填写可以优先筛选。有问题可以在评论区问我。',
      is_anonymous: false,
    },
  ];

  let count = 0;
  const insertStmt = db.prepare(`
    INSERT INTO community_posts (community_id, user_id, title, content, type, is_anonymous, view_count, reply_count)
    VALUES (?, ?, ?, ?, ?, ?, 0, 0)
  `);

  communities.forEach(community => {
    postTemplates.forEach((template, idx) => {
      const user = users[(idx * 3 + community.id) % users.length];
      try {
        insertStmt.run(
          community.id,
          user.id,
          template.title,
          template.content,
          template.type,
          template.is_anonymous ? 1 : 0
        );
        count++;
      } catch (e) {
        // Skip duplicates
      }
    });
    console.log(`  Added posts to "${community.name}"`);
  });

  console.log(`Total posts added: ${count}`);
  console.log('Community posts seed data complete!');
}

try {
  // Check if there are any posts already
  const existingCount = db.prepare('SELECT COUNT(*) as count FROM community_posts').get().count;
  if (existingCount > 0) {
    console.log(`Posts already exist (${existingCount}), skipping seed data`);
  } else {
    addCommunityPosts();
  }
} catch (e) {
  console.error('Error:', e.message);
}
