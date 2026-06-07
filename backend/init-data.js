const { db, initDatabase } = require('./src/database');
const bcrypt = require('bcryptjs');

function initTestData() {
  console.log('初始化数据库表...');
  initDatabase();
  
  console.log('开始初始化测试数据...');

  const adminPassword = bcrypt.hashSync('admin123', 10);
  const userPassword = bcrypt.hashSync('user123', 10);

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');

    db.run(`INSERT OR IGNORE INTO users (username, email, password, role, real_name, id_card, phone) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ['admin', 'admin@example.com', adminPassword, 'admin', '管理员', '110101199001011234', '13800138000']);
    
    db.run(`INSERT OR IGNORE INTO users (username, email, password, role, real_name, id_card, phone) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ['testuser', 'user@example.com', userPassword, 'user', '测试用户', '110101199001015678', '13900139000']);

    const events = [
      { title: '2024周杰伦演唱会北京站', category: 'concert', description: '周杰伦2024嘉年华世界巡回演唱会北京站', venue: '国家体育场（鸟巢）', address: '北京市朝阳区国家体育场南路1号', city: '北京', start_time: '2024-08-15 19:30:00', end_time: '2024-08-15 22:00:00', status: 'on_sale', is_hot: 1 },
      { title: '话剧《雷雨》经典复排', category: 'drama', description: '曹禺经典话剧《雷雨》全新复排版', venue: '国家大剧院', address: '北京市西城区西长安街2号', city: '北京', start_time: '2024-07-20 19:30:00', end_time: '2024-07-20 22:00:00', status: 'on_sale', is_hot: 1 },
      { title: '中超联赛：北京国安 vs 上海申花', category: 'sports', description: '2024赛季中超联赛第15轮焦点战', venue: '工人体育场', address: '北京市朝阳区工人体育场北路', city: '北京', start_time: '2024-07-28 19:35:00', end_time: '2024-07-28 21:30:00', status: 'on_sale', is_hot: 0 },
      { title: '梵高沉浸式艺术展', category: 'exhibition', description: '全球知名梵高沉浸式艺术体验展', venue: '798艺术区', address: '北京市朝阳区酒仙桥路4号', city: '北京', start_time: '2024-06-01 10:00:00', end_time: '2024-10-07 18:00:00', status: 'on_sale', is_hot: 0 },
      { title: '《复仇者联盟5》首映', category: 'movie', description: '漫威电影宇宙年度巨制首映', venue: '万达影城CBD店', address: '北京市朝阳区建国路93号', city: '北京', start_time: '2024-08-01 00:00:00', end_time: '2024-08-01 03:00:00', status: 'on_sale', is_hot: 1 },
      { title: '亲子音乐剧《冰雪奇缘》', category: 'family', description: '迪士尼正版授权亲子音乐剧', venue: '世纪剧院', address: '北京市朝阳区亮马桥路40号', city: '北京', start_time: '2024-07-15 14:00:00', end_time: '2024-07-15 16:30:00', status: 'on_sale', is_hot: 0 },
    ];

    const eventIds = [];
    events.forEach((event, index) => {
      db.run(`INSERT INTO events (title, category, description, venue, address, city, start_time, end_time, status, is_hot) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [event.title, event.category, event.description, event.venue, event.address, event.city, event.start_time, event.end_time, event.status, event.is_hot],
        function(err) {
          if (err) {
            console.log('插入活动失败:', err.message);
            return;
          }
          const eventId = this.lastID;
          eventIds.push(eventId);
          
          db.run(`INSERT INTO seat_maps (event_id, name, total_seats, available_seats, layout_data) VALUES (?, ?, ?, ?, ?)`,
            [eventId, '主会场', 100, 100, JSON.stringify({ rows: 10, cols: 10 })],
            function(err) {
              if (err) {
                console.log('插入座位图失败:', err.message);
                return;
              }
              const seatMapId = this.lastID;
              
              for (let row = 1; row <= 10; row++) {
                for (let col = 1; col <= 10; col++) {
                  const area = row <= 3 ? 'VIP' : row <= 6 ? 'A区' : 'B区';
                  db.run(`INSERT INTO seats (seat_map_id, row, seat_number, area, price_tier, status) VALUES (?, ?, ?, ?, ?, ?)`,
                    [seatMapId, row.toString(), col.toString(), area, area, 'available']);
                }
              }
            });

          const strategies = [
            { name: '早鸟优惠', type: 'early_bird', discount_type: 'percentage', discount_value: 15, min_quantity: 1, start_time: '2026-01-01 00:00:00', end_time: '2026-06-30 23:59:59', is_active: 1, base_price: 880 },
            { name: '阶梯优惠', type: 'tiered', discount_type: 'percentage', discount_value: 8, min_quantity: 3, start_time: '2026-03-01 00:00:00', end_time: '2026-09-30 23:59:59', is_active: 1, base_price: 880 },
            { name: '粉丝专属价', type: 'fan', discount_type: 'percentage', discount_value: 12, min_quantity: 1, start_time: '2026-02-01 00:00:00', end_time: '2026-12-31 23:59:59', is_active: 1, base_price: 880 },
            { name: '公益票', type: 'charity', discount_type: 'fixed', discount_value: 100, min_quantity: 1, start_time: '2026-01-01 00:00:00', end_time: '2026-12-31 23:59:59', is_active: 1, base_price: 880 },
          ];
          strategies.forEach(s => {
            db.run(`INSERT INTO price_strategies (event_id, name, type, discount_type, discount_value, min_quantity, start_time, end_time, is_active, base_price) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [eventId, s.name, s.type, s.discount_type, s.discount_value, s.min_quantity, s.start_time, s.end_time, s.is_active, s.base_price]);
          });
        });
    });

    const articles = [
      { title: '2024年最值得期待的10场演唱会', content: '今年将有众多重量级歌手举办演唱会，包括周杰伦嘉年华世界巡演、张学友60+巡回演唱会、陈奕迅Fear and Dreams巡回演唱会等。从流行到摇滚，从民谣到电音，总有一场让你心动。早鸟票已开售，抓紧抢票！', type: 'pgc', author: '票务小编', tags: '演唱会,音乐,热门', status: 'published', view_count: 4523, like_count: 189 },
      { title: '暑期亲子演出推荐', content: '暑假期间有多场适合全家观看的亲子演出，音乐剧、马戏、魔术应有尽有。推荐《冰雪奇缘》音乐剧，迪士尼正版授权，精彩绝伦的舞台效果和经典歌曲，让孩子沉浸在童话世界中。', type: 'pgc', author: '亲子频道', tags: '亲子,暑期,推荐', status: 'published', view_count: 1876, like_count: 67 },
      { title: '体育赛事观赛指南', content: '观看体育比赛时的注意事项和最佳观赛位置推荐。中超联赛北京国安主场工人体育场，VIP区视野最佳；篮球CBA五棵松体育馆，中层看台性价比最高。记得提前入场安检！', type: 'guide', author: '体育频道', tags: '体育,观赛,指南', status: 'published', view_count: 2340, like_count: 95 },
      { title: '周杰伦演唱会抢票攻略', content: '作为杰迷，抢到一张周杰伦演唱会的门票太重要了！首先提前注册并完善实名信息，其次多设备同时抢票，最后不要放弃捡漏机会。开票后15分钟内常有余票释放，持续刷新是关键！', type: 'guide', author: '杰迷小王', tags: '演唱会,周杰伦,攻略', status: 'published', view_count: 4987, like_count: 198 },
      { title: '新用户注册即送20元优惠券', content: '新注册用户专享福利！完成注册即送20元无门槛优惠券，可用于购买任意活动门票。优惠券有效期30天，不可叠加使用。快来注册，开启你的观演之旅吧！', type: 'welfare', author: '福利中心', tags: '福利,优惠券,新用户', status: 'published', view_count: 3210, like_count: 134 },
      { title: '梵高沉浸式艺术展：一场视觉盛宴', content: '上周末去看了梵高沉浸式艺术展，真的太震撼了！360度投影技术让梵高的画作活了起来，星空在头顶旋转，向日葵在身边绽放，仿佛走进了画中世界。强烈推荐带家人朋友一起去体验！', type: 'ugc', author: '文艺青年小李', tags: '展览,梵高,推荐', status: 'published', view_count: 1456, like_count: 78 },
      { title: '会员日福利：每周三购票9折', content: '票务中台会员专享福利！每周三为会员日，所有演出门票享9折优惠。同时还可参与会员专属抽奖活动，有机会获得免费观演机会和明星签名周边。升级VIP会员更享8.5折优惠！', type: 'welfare', author: '福利中心', tags: '福利,会员,折扣', status: 'published', view_count: 2890, like_count: 156 },
      { title: '话剧《雷雨》观后感：经典的力量', content: '第三次看《雷雨》，每次都有不同的感悟。这次复排版本在保留经典台词的基础上加入了现代舞台技术，灯光和音效的配合更加出色。周朴园的饰演者将角色的复杂性演绎得淋漓尽致。国家大剧院的声场效果也是一绝。', type: 'ugc', author: '戏剧迷小赵', tags: '话剧,雷雨,观后感', status: 'published', view_count: 987, like_count: 43 },
      { title: '中超联赛现场观赛体验分享', content: '第一次去工体看国安比赛，气氛太棒了！几万人齐声高喊国安加油，绿色的人浪此起彼伏。虽然最后1:1打平，但现场体验远超电视转播。建议买中层看台的票，视野好还能感受看台文化。', type: 'ugc', author: '球迷老张', tags: '体育,足球,国安', status: 'published', view_count: 2105, like_count: 112 },
      { title: '儿童剧选座指南：如何给孩子最佳观演体验', content: '带孩子看儿童剧，选座有讲究！首选前排中间位置，让孩子近距离观看演员表演。避免选在音响旁边，音量过大可能影响孩子听力。如果孩子年龄较小，建议选靠近走道的位置，方便随时带孩子出去。', type: 'guide', author: '亲子顾问', tags: '亲子,选座,指南', status: 'published', view_count: 678, like_count: 29 },
    ];

    const articleIds = [];
    articles.forEach(article => {
      db.run(`INSERT INTO articles (title, content, type, author, tags, status, view_count, like_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [article.title, article.content, article.type || 'pgc', article.author, article.tags, article.status, article.view_count || 0, article.like_count || 0],
        function(err) {
          if (!err) articleIds.push(this.lastID);
        });
    });

    const sampleComments = [
      { article_offset: 0, user_id: 2, content: '周杰伦的演唱会必须冲！', like_count: 23 },
      { article_offset: 0, user_id: 1, content: '早鸟票真的便宜很多，推荐大家抢', like_count: 15 },
      { article_offset: 3, user_id: 2, content: '多设备抢票确实有用，上次抢到了', like_count: 41 },
      { article_offset: 3, user_id: 1, content: '捡漏技巧太实用了！', like_count: 18 },
      { article_offset: 3, user_id: 2, content: '请问哪个平台抢票快？', like_count: 7 },
      { article_offset: 5, user_id: 2, content: '上个月去看了，真的很震撼！', like_count: 12 },
      { article_offset: 5, user_id: 1, content: '拍照效果也超好的', like_count: 9 },
      { article_offset: 7, user_id: 2, content: '经典话剧值得反复看', like_count: 6 },
      { article_offset: 8, user_id: 1, content: '工体氛围无敌！', like_count: 34 },
      { article_offset: 8, user_id: 2, content: '下次一起去！', like_count: 11 },
      { article_offset: 4, user_id: 2, content: '新用户福利真不错', like_count: 5 },
      { article_offset: 6, user_id: 1, content: '每周三都买票，省了不少', like_count: 19 },
    ];

    setTimeout(() => {
      sampleComments.forEach(comment => {
        const articleId = articleIds[comment.article_offset];
        if (articleId) {
          db.run(`INSERT INTO comments (article_id, user_id, content, like_count, status) VALUES (?, ?, ?, ?, ?)`,
            [articleId, comment.user_id, comment.content, comment.like_count, 'published']);
        }
      });
    }, 500);

    const agents = [
      { name: '大麦网', contact: '张三', phone: '13800138001', commission_rate: 5, status: 1 },
      { name: '猫眼娱乐', contact: '李四', phone: '13800138002', commission_rate: 6, status: 1 },
    ];

    agents.forEach(agent => {
      db.run(`INSERT INTO agents (name, contact, phone, commission_rate, status) VALUES (?, ?, ?, ?, ?)`,
        [agent.name, agent.contact, agent.phone, agent.commission_rate, agent.status]);
    });

    db.run('COMMIT', (err) => {
      if (err) console.log('事务提交失败:', err.message);
      else console.log('测试数据初始化完成！');
      console.log('管理员账号: admin / admin123');
      console.log('普通用户账号: testuser / user123');
    });
  });
}

initTestData();
