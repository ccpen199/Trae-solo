const db = require('../database');

const initDatabase = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      nickname TEXT,
      avatar TEXT,
      level INTEGER DEFAULT 1,
      experience INTEGER DEFAULT 0,
      coins INTEGER DEFAULT 100,
      reputation INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS channels (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      icon TEXT,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'post',
      channel_id INTEGER,
      author_id INTEGER NOT NULL,
      view_count INTEGER DEFAULT 0,
      like_count INTEGER DEFAULT 0,
      comment_count INTEGER DEFAULT 0,
      is_bright INTEGER DEFAULT 0,
      is_top INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (channel_id) REFERENCES channels(id),
      FOREIGN KEY (author_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      parent_id INTEGER DEFAULT 0,
      content TEXT NOT NULL,
      like_count INTEGER DEFAULT 0,
      is_bright INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (post_id) REFERENCES posts(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS likes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      target_type TEXT NOT NULL,
      target_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, target_type, target_id)
    );

    CREATE TABLE IF NOT EXISTS search_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      keyword TEXT NOT NULL,
      search_count INTEGER DEFAULT 1,
      last_searched_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS user_relations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      follower_id INTEGER NOT NULL,
      following_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(follower_id, following_id),
      FOREIGN KEY (follower_id) REFERENCES users(id),
      FOREIGN KEY (following_id) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_posts_channel ON posts(channel_id);
    CREATE INDEX IF NOT EXISTS idx_posts_author ON posts(author_id);
    CREATE INDEX IF NOT EXISTS idx_posts_created ON posts(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_id);
    CREATE INDEX IF NOT EXISTS idx_comments_user ON comments(user_id);
  `);

  const channelCount = db.prepare('SELECT COUNT(*) as count FROM channels').get().count;
  if (channelCount === 0) {
    const insertChannel = db.prepare('INSERT INTO channels (name, slug, sort_order) VALUES (?, ?, ?)');
    const channels = [
      ['推荐', 'recommend', 0],
      ['NBA', 'nba', 1],
      ['足球', 'football', 2],
      ['CBA', 'cba', 3],
      ['电竞', 'esports', 4],
      ['综合体育', 'sports', 5],
      ['步行街', 'street', 6]
    ];
    channels.forEach(([name, slug, order]) => insertChannel.run(name, slug, order));
  }

  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount === 0) {
    const bcrypt = require('bcryptjs');
    const hashedPassword = bcrypt.hashSync('123456', 10);
    const insertUser = db.prepare('INSERT INTO users (username, password, nickname, level, coins, reputation) VALUES (?, ?, ?, ?, ?, ?)');
    
    const users = [
      ['admin', hashedPassword, '管理员', 10, 10000, 5000],
      ['sports_fan', hashedPassword, '体育迷小王', 5, 500, 200],
      ['basketball_lover', hashedPassword, '篮球狂热者', 3, 200, 100]
    ];
    users.forEach(([username, pwd, nickname, level, coins, rep]) => {
      insertUser.run(username, pwd, nickname, level, coins, rep);
    });

    const samplePosts = [
      {
        title: '湖人vs勇士总决赛前瞻：詹姆斯能否再创历史？',
        content: '北京时间明天上午9点，湖人将在主场迎战勇士，开启本赛季总决赛的首场较量。詹姆斯在本赛季季后赛中场均贡献28.5分8.3篮板7.2助攻，状态依旧神勇。而库里则带领勇士一路过关斩将，场均32.1分的表现堪称完美。这场对决无疑将是近年来最精彩的总决赛之一。\n\n湖人这边，除了詹姆斯的稳定发挥，戴维斯在内线的统治力也至关重要。在上一轮对阵掘金的系列赛中，戴维斯场均能拿到30+15的数据，是湖人晋级的关键功臣。而勇士方面，汤普森的手感回暖也为球队增添了更多胜算。\n\n你更看好哪支球队拿下首胜？欢迎在评论区留下你的看法！',
        type: 'news',
        channel_id: 2,
        author_id: 1
      },
      {
        title: '理性讨论：现在的C罗还是世界顶级前锋吗？',
        content: '随着葡萄牙在欧洲杯预选赛中的出色表现，C罗再次成为球迷讨论的焦点。已经39岁的他，依然能够在国家队中扮演核心角色，并且保持着不错的进球效率。\n\n从数据来看，C罗本赛季在俱乐部的表现确实有所下滑，出场时间和进球数都不如巅峰时期。但在国家队层面，他依然是无可替代的存在，无论是精神领袖作用还是关键时刻的得分能力，都让人印象深刻。\n\n那么问题来了：你认为现在的C罗还能算是世界顶级前锋吗？或者说他更多的是凭借经验和意识在踢球？\n\n个人认为，即使身体机能有所下降，但C罗的职业态度和比赛阅读能力依然是顶级的，只是可能不再适合作为豪门俱乐部的绝对核心了。',
        type: 'post',
        channel_id: 3,
        author_id: 2
      },
      {
        title: '【赛后】辽宁夺冠！CBA三连冠达成，王朝正式建立',
        content: '恭喜辽宁男篮！在刚刚结束的CBA总决赛G4中，辽宁队以106-98战胜浙江队，大比分4-0横扫对手，成功卫冕的同时也达成了队史首个三连冠！\n\n本场比赛，郭艾伦表现出色，全场砍下32分8助攻，尤其是在第四节关键时刻连续得分，彻底杀死了比赛的悬念。张镇麟也贡献了25分10篮板的两双数据，内线韩德君虽然年纪偏大，但依然高效拿到18分12篮板。\n\n回顾整个季后赛，辽宁队展现出了超强的统治力，整个季后赛只输了一场球。球队阵容深度、战术执行力、关键球员的发挥都堪称完美。这个三连冠实至名归，辽宁王朝正式建立！\n\n下赛季你认为哪支球队能够挑战辽宁的霸主地位？',
        type: 'news',
        channel_id: 4,
        author_id: 1
      },
      {
        title: '分享一下今天去现场看球的经历，太爽了！',
        content: '今天终于圆了多年的梦想，去现场看了一场CBA的比赛！\n\n先说说感受：现场的氛围真的是电视直播完全比不了的！球迷的呐喊声、DJ的音乐、每次进球后的欢呼声，那种沉浸感太棒了！我坐的位置虽然不是特别靠前，但依然能够清晰地看到球员们的每一个动作。\n\n印象最深的是，在比赛最后关头，主队球员投中绝杀三分的那一刻，整个球馆都沸腾了！我身边的球迷都在疯狂庆祝，那种感觉真的是无法用语言形容。\n\n建议大家如果有机会的话，一定要去现场体验一次！门票其实没有想象中那么贵，但是那种体验绝对值回票价。\n\n最后放几张现场拍的照片，虽然拍得一般，但留作纪念嘛。',
        type: 'post',
        channel_id: 4,
        author_id: 3
      },
      {
        title: 'S14世界赛赛程公布，LPL四支战队出征！',
        content: '英雄联盟S14全球总决赛的赛程终于公布了！本届世界赛将在韩国举办，LPL赛区派出了JDG、BLG、LNG、WBG四支战队出征。\n\n小组赛阶段，JDG被分到了A组，同组的还有GEN和T1，可以说是名副其实的死亡之组。BLG则在B组，对手相对较弱，出线形势比较乐观。LNG和WBG分别在C组和D组，都有不小的出线机会。\n\n作为LPL的粉丝，当然是希望四支战队都能有好的表现。尤其是JDG，今年他们的状态非常好，如果能够保持下去的话，完全有机会争夺冠军。\n\n大家觉得今年LPL能拿几个八强名额？总冠军又会花落谁家呢？',
        type: 'post',
        channel_id: 5,
        author_id: 2
      },
      {
        title: '羽毛球世锦赛：国羽斩获两金一银，表现超出预期',
        content: '2024年羽毛球世锦赛落下帷幕，中国队最终收获两金一银的好成绩，整体表现超出了赛前预期。\n\n女单方面，陈雨菲一路过关斩将，最终在决赛中以2-1战胜戴资颖，成功卫冕冠军。这也是她职业生涯第二个世锦赛冠军，展现出了超强的稳定性。\n\n男双方面，梁王组合表现神勇，决赛中直落两局击败印尼组合，首次夺得世锦赛冠军。这对年轻组合的成长速度令人惊喜，未来可期。\n\n混双项目中，雅思组合虽然未能夺冠，但银牌的成绩也值得肯定。毕竟两人都已经是老将，能够保持这样的竞技状态已经非常不容易。\n\n整体来看，国羽在本届世锦赛上的表现还是相当不错的，尤其是年轻球员的成长让人看到了希望。',
        type: 'news',
        channel_id: 6,
        author_id: 1
      }
    ];

    const insertPost = db.prepare('INSERT INTO posts (title, content, type, channel_id, author_id) VALUES (?, ?, ?, ?, ?)');
    samplePosts.forEach(post => {
      insertPost.run(post.title, post.content, post.type, post.channel_id, post.author_id);
    });

    const sampleComments = [
      { post_id: 1, user_id: 2, parent_id: 0, content: '还是更看好勇士，库里现在的状态太无解了。' },
      { post_id: 1, user_id: 3, parent_id: 0, content: '湖人总冠军！詹姆斯不老传奇！' },
      { post_id: 1, user_id: 2, parent_id: 1, content: '库里确实强，但湖人的内线优势明显啊' },
      { post_id: 2, user_id: 1, parent_id: 0, content: '顶级肯定还是顶级，就是踢法需要调整了' },
      { post_id: 2, user_id: 3, parent_id: 0, content: 'C罗的职业态度真的值得所有球员学习' },
      { post_id: 3, user_id: 2, parent_id: 0, content: '辽宁确实太强了，其他队要加油啊' },
      { post_id: 3, user_id: 3, parent_id: 0, content: '恭喜辽宁！但作为广东球迷，下赛季我们一定会回来的！' }
    ];

    const insertComment = db.prepare('INSERT INTO comments (post_id, user_id, parent_id, content) VALUES (?, ?, ?, ?)');
    sampleComments.forEach(comment => {
      insertComment.run(comment.post_id, comment.user_id, comment.parent_id, comment.content);
    });
  }

  console.log('Database initialized successfully!');
};

module.exports = initDatabase;
