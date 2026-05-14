const db = require('../config/database');
const bcrypt = require('bcryptjs');

function initDatabase() {
  const users = db.getTable('users');
  
  if (users.length === 0) {
    const salt = bcrypt.genSaltSync(10);
    
    const hashedAdmin = bcrypt.hashSync('admin123', salt);
    const hashedEditor = bcrypt.hashSync('editor123', salt);
    const hashedModerator = bcrypt.hashSync('moderator123', salt);
    const hashedUser = bcrypt.hashSync('user123', salt);

    db.insert('users', { username: 'admin', email: 'admin@pmcaff.com', password: hashedAdmin, nickname: '管理员', role: 'admin', status: 'active' });
    db.insert('users', { username: 'editor', email: 'editor@pmcaff.com', password: hashedEditor, nickname: '编辑', role: 'editor', status: 'active' });
    db.insert('users', { username: 'moderator', email: 'moderator@pmcaff.com', password: hashedModerator, nickname: '审核员', role: 'moderator', status: 'active' });
    db.insert('users', { username: 'user1', email: 'user1@pmcaff.com', password: hashedUser, nickname: '产品小王', role: 'user', status: 'active' });

    db.insert('topics', { name: '产品设计', description: '产品设计方法论、原型设计、交互设计', sort_order: 1 });
    db.insert('topics', { name: '用户研究', description: '用户调研、用户画像、可用性测试', sort_order: 2 });
    db.insert('topics', { name: '数据分析', description: '数据指标、数据分析方法、AB测试', sort_order: 3 });
    db.insert('topics', { name: '运营增长', description: '用户运营、内容运营、增长黑客', sort_order: 4 });
    db.insert('topics', { name: '职业发展', description: '产品经理求职、职业规划、面试经验', sort_order: 5 });
    db.insert('topics', { name: '技术相关', description: '前端、后端、技术选型', sort_order: 6 });

    db.insert('questions', { user_id: 4, title: '如何从零开始设计一个优秀的产品原型？', content: '我是一个刚入行的产品经理，想请教一下如何从零开始设计一个好的产品原型？需要注意哪些方面？', topic_id: 1, status: 'published', view_count: 156, answer_count: 2, like_count: 23, follow_count: 5 });
    db.insert('questions', { user_id: 4, title: '产品设计的7个核心原则是什么？', content: '在产品设计过程中，有哪些核心原则是必须遵守的？大家能分享一下自己的经验吗？', topic_id: 1, status: 'published', view_count: 234, answer_count: 2, like_count: 45, follow_count: 8 });
    db.insert('questions', { user_id: 4, title: 'B端产品和C端产品设计有什么本质区别？', content: '做了一年C端产品，现在转做B端，感觉思路完全不一样，想请教一下大家两者的核心区别是什么？', topic_id: 1, status: 'published', view_count: 189, answer_count: 1, like_count: 18, follow_count: 6 });
    db.insert('questions', { user_id: 4, title: '如何进行有效的用户访谈？', content: '下周要做用户访谈，有什么技巧和注意事项吗？', topic_id: 2, status: 'published', view_count: 128, answer_count: 1, like_count: 15, follow_count: 4 });
    db.insert('questions', { user_id: 4, title: '用户画像应该包含哪些关键维度？', content: '想建立用户画像，但不知道应该从哪些维度入手，求分享！', topic_id: 2, status: 'published', view_count: 98, answer_count: 1, like_count: 12, follow_count: 3 });
    db.insert('questions', { user_id: 4, title: '可用性测试的流程和方法有哪些？', content: '产品上线前想做可用性测试，请问有什么好的方法推荐吗？', topic_id: 2, status: 'published', view_count: 76, answer_count: 0, like_count: 9, follow_count: 2 });
    db.insert('questions', { user_id: 4, title: '产品经理必看的核心数据指标有哪些？', content: '刚接手一个新项目，不知道该关注哪些数据指标，求指点！', topic_id: 3, status: 'published', view_count: 215, answer_count: 1, like_count: 28, follow_count: 7 });
    db.insert('questions', { user_id: 4, title: '如何设计一个靠谱的AB测试方案？', content: '想做AB测试，但是不知道怎么设计方案才科学，有什么最佳实践吗？', topic_id: 3, status: 'published', view_count: 145, answer_count: 1, like_count: 19, follow_count: 5 });
    db.insert('questions', { user_id: 4, title: '数据分析师和数据产品经理的区别是什么？', content: '一直在做数据分析，想转产品经理，请问两者的核心区别在哪里？', topic_id: 3, status: 'published', view_count: 112, answer_count: 0, like_count: 14, follow_count: 4 });
    db.insert('questions', { user_id: 4, title: '如何从零搭建用户增长体系？', content: '产品DAU一直上不去，想搭建用户增长体系，求经验分享！', topic_id: 4, status: 'published', view_count: 187, answer_count: 1, like_count: 22, follow_count: 6 });
    db.insert('questions', { user_id: 4, title: '内容运营的核心方法论是什么？', content: '做了半年内容运营，感觉一直在打杂，想系统性学习一下方法论', topic_id: 4, status: 'published', view_count: 134, answer_count: 0, like_count: 17, follow_count: 4 });
    db.insert('questions', { user_id: 4, title: '增长黑客的常用手段有哪些？', content: '听说增长黑客很火，想了解一下具体有哪些常用的增长手段？', topic_id: 4, status: 'published', view_count: 156, answer_count: 1, like_count: 19, follow_count: 5 });
    db.insert('questions', { user_id: 4, title: '产品经理面试如何准备？', content: '准备跳槽，请问产品经理面试一般会问什么问题？', topic_id: 5, status: 'published', view_count: 312, answer_count: 2, like_count: 42, follow_count: 12 });
    db.insert('questions', { user_id: 4, title: '3年产品经理如何突破职业瓶颈？', content: '做了3年产品，感觉遇到了瓶颈，不知道该往哪个方向发展', topic_id: 5, status: 'published', view_count: 245, answer_count: 1, like_count: 35, follow_count: 9 });
    db.insert('questions', { user_id: 4, title: '产品经理转管理岗需要具备哪些能力？', content: '工作4年了，考虑转管理岗，需要提升哪些能力？', topic_id: 5, status: 'published', view_count: 178, answer_count: 1, like_count: 26, follow_count: 7 });
    db.insert('questions', { user_id: 4, title: '产品经理需要掌握哪些技术知识？', content: '非技术背景的产品经理，应该学习哪些技术知识比较合适？', topic_id: 6, status: 'published', view_count: 167, answer_count: 1, like_count: 21, follow_count: 5 });
    db.insert('questions', { user_id: 4, title: '如何和开发高效沟通？', content: '和开发沟通总是鸡同鸭讲，有什么好的沟通技巧吗？', topic_id: 6, status: 'published', view_count: 198, answer_count: 2, like_count: 28, follow_count: 8 });
    db.insert('questions', { user_id: 4, title: '技术选型时产品经理应该参与吗？', content: '团队做技术选型，产品经理应该参与吗？参与到什么程度比较合适？', topic_id: 6, status: 'published', view_count: 89, answer_count: 0, like_count: 11, follow_count: 3 });

    db.insert('articles', { 
      user_id: 2, 
      title: '产品设计入门：从0到1的完整指南', 
      content: `# 产品设计入门指南\n\n作为产品经理，产品设计是我们的核心能力之一。本文将带你从0到1，系统地学习产品设计。\n\n## 一、什么是产品设计\n\n产品设计不仅仅是画原型，而是一个完整的产品设计流程，包括：\n- 用户研究和需求分析\n- 信息架构设计\n- 交互设计\n- 视觉设计\n- 原型设计\n- 用户测试\n\n## 二、产品设计的核心原则\n\n1. 以用户为中心\n2. 简洁至上\n3. 一致性\n4. 容错性\n5. 可访问性\n\n## 三、常用工具推荐\n- Figma/Sketch：UI设计\n- Axure：高保真原型\n- 墨刀：快速原型\n\n希望这篇文章对大家有所帮助！`,
      excerpt: '本文系统介绍产品设计的完整流程，从用户研究到原型设计，帮助新人快速上手',
      topic_id: 1,
      status: 'published',
      view_count: 1256,
      like_count: 89,
      favorite_count: 45,
      comment_count: 12
    });

    db.insert('articles', { 
      user_id: 2, 
      title: '用户研究方法论大全',
      content: `# 用户研究方法论\n\n用户研究是产品设计的基础，没有用户研究的产品设计都是空中楼阁。\n\n## 一、定性研究方法\n- 用户访谈\n- 焦点小组\n- 可用性测试\n- 情境访谈\n\n## 二、定量研究方法\n- 问卷调查\n- 数据分析\n- A/B测试\n\n## 三、用户画像构建\n用户画像不是简单的用户信息堆砌，而是对用户的综合特征的提炼...`,
      excerpt: '全面介绍用户研究的各种方法，从定性到定量，帮助你真正理解用户',
      topic_id: 2,
      status: 'published',
      view_count: 987,
      like_count: 67,
      favorite_count: 34,
      comment_count: 9
    });

    db.insert('articles', { 
      user_id: 2, 
      title: '数据指标体系搭建实战',
      content: `# 数据指标体系搭建\n\n数据是产品经理的眼睛，没有数据就像盲人摸象。\n\n## 一、为什么需要哪些数据\n- 用户数据\n- 行为数据\n- 业务数据\n\n## 二、如何搭建指标体系\n1. 确定核心指标\n2. 拆解二级指标\n3. 建立数据看板\n4. 定期复盘`,
      excerpt: '从0到1教你搭建完整的数据指标体系，让数据驱动产品决策',
      topic_id: 3,
      status: 'published',
      view_count: 1123,
      like_count: 78,
      favorite_count: 41,
      comment_count: 15
    });

    db.insert('articles', { 
      user_id: 2, 
      title: '用户增长实战笔记',
      content: `# 用户增长实战笔记\n\n做了3年增长，分享一些实战经验。\n\n## 一、增长的核心逻辑\n增长不是拉新，而是完整的用户生命周期管理。\n\n## 二、AARRR模型\n- 获取（Acquisition）\n- 激活（Activation）\n- 留存（Retention）\n- 变现（Revenue）\n- 推荐（Referral）\n\n## 三、常见增长手段\n1. 病毒传播\n2. 裂变活动\n3. 召回策略`,
      excerpt: '3年增长经验分享，从AARRR模型到具体实战经验',
      topic_id: 4,
      status: 'published',
      view_count: 1567,
      like_count: 102,
      favorite_count: 56,
      comment_count: 23
    });

    db.insert('articles', { 
      user_id: 2, 
      title: '产品经理职业发展路径',
      content: `# 产品经理职业发展路径\n\n产品经理的职业发展一般有几个方向：\n\n## 一、专业线\n- 初级产品经理\n- 高级产品经理\n- 产品专家\n- 产品架构师\n\n## 二、管理线\n- 产品经理\n- 产品负责人\n- 产品总监\n- CPO\n\n## 三、如何选择\n根据自己的兴趣和能力选择合适的发展路径`,
      excerpt: '详解产品经理的两条职业发展路径，帮你找到适合自己的方向',
      topic_id: 5,
      status: 'published',
      view_count: 2134,
      like_count: 156,
      favorite_count: 89,
      comment_count: 34
    });

    db.insert('articles', { 
      user_id: 2, 
      title: '产品经理技术知识图谱',
      content: `# 产品经理技术知识图谱\n\n作为产品经理，不需要写代码，但需要懂技术。\n\n## 一、前端技术栈\n- HTML/CSS\n- JavaScript\n- 前端框架\n\n## 二、后端技术\n- 数据库\n- API设计\n- 服务架构\n\n## 三、如何学习\n1. 看技术博客\n2. 和开发交朋友\n3. 参与技术分享`,
      excerpt: '产品经理需要掌握的技术知识图谱，非技术背景也能看懂',
      topic_id: 6,
      status: 'published',
      view_count: 876,
      like_count: 54,
      favorite_count: 28,
      comment_count: 8
    });

    db.insert('answers', { question_id: 1, user_id: 2, content: '作为一个有经验的产品经理，我来分享一下我的经验：首先要明确产品定位，然后做用户研究，再画原型，最后做用户测试。原型工具推荐Figma，团队协作方便。', like_count: 15, is_accepted: 1 });
    db.insert('answers', { question_id: 1, user_id: 3, content: '补充一点，原型设计不要追求完美，快速迭代很重要。先做低保真，验证思路后再做高保真。', like_count: 8, is_accepted: 0 });
    db.insert('answers', { question_id: 2, user_id: 2, content: '产品设计的7个核心原则：1.以用户为中心、2.简洁、3.一致性、4.容错性、5.可访问性、6.高效性、7.可扩展性。这7个原则是我做产品设计的基石。', like_count: 23, is_accepted: 1 });
    db.insert('answers', { question_id: 2, user_id: 3, content: '还要加上第8个原则：美学。好的设计不仅要好用，还要好看！', like_count: 12, is_accepted: 0 });
    db.insert('answers', { question_id: 4, user_id: 2, content: '用户访谈技巧：1.提前准备提纲，但不要被提纲限制；2.多问开放式问题，不要问引导性问题；3.多听少说；4.及时记录；5.事后复盘。', like_count: 10, is_accepted: 1 });

    db.insert('comments', { target_type: 'article', target_id: 1, user_id: 4, content: '写得很详细，对新人很有帮助！', like_count: 5 });
    db.insert('comments', { target_type: 'article', target_id: 1, user_id: 3, content: '收藏了，慢慢看', like_count: 3 });
    db.insert('comments', { target_type: 'article', target_id: 2, user_id: 4, content: '用户研究真的很重要，很多产品经理都忽略了这一步', like_count: 8 });
    db.insert('comments', { target_type: 'article', target_id: 4, user_id: 4, content: '增长是个系统工程，不是一两个活动就能搞定的', like_count: 6 });
    db.insert('comments', { target_type: 'article', target_id: 5, user_id: 3, content: '职业发展这篇写得很实在，没有鸡汤', like_count: 12 });

    db.saveData();
  }
}

module.exports = { initDatabase };
