const { db, initDatabase } = require('./src/database');
const bcrypt = require('bcryptjs');

function initTestData() {
  console.log('初始化数据库表...');
  initDatabase();
  
  console.log('开始初始化测试数据...');

  db.serialize(() => {
    const adminPassword = bcrypt.hashSync('admin123', 10);
    const userPassword = bcrypt.hashSync('user123', 10);

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
      { title: '亲子音乐剧《冰雪奇缘》', category: 'variety', description: '迪士尼正版授权亲子音乐剧', venue: '世纪剧院', address: '北京市朝阳区亮马桥路40号', city: '北京', start_time: '2024-07-15 14:00:00', end_time: '2024-07-15 16:30:00', status: 'on_sale', is_hot: 0 },
    ];

    events.forEach((event, index) => {
      db.run(`INSERT INTO events (title, category, description, venue, address, city, start_time, end_time, status, is_hot) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [event.title, event.category, event.description, event.venue, event.address, event.city, event.start_time, event.end_time, event.status, event.is_hot],
        function(err) {
          if (err) {
            console.log('插入活动失败:', err.message);
            return;
          }
          const eventId = this.lastID;
          
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

          db.run(`INSERT INTO price_strategies (event_id, name, type, discount_type, discount_value, min_quantity, start_time, end_time, is_active, base_price) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [eventId, '早鸟优惠', 'early_bird', 'percentage', 15, 1, '2024-05-01 00:00:00', '2024-12-31 23:59:59', 1, 880]);
        });
    });

    const articles = [
      { title: '2024年最值得期待的10场演唱会', content: '今年将有众多重量级歌手举办演唱会，包括周杰伦、张学友、陈奕迅等...', author: '票务小编', tags: '演唱会,音乐,热门', status: 'published' },
      { title: '暑期亲子演出推荐', content: '暑假期间有多场适合全家观看的亲子演出，音乐剧、马戏、魔术应有尽有...', author: '亲子频道', tags: '亲子,暑期,推荐', status: 'published' },
      { title: '体育赛事观赛指南', content: '观看体育比赛时的注意事项和最佳观赛位置推荐...', author: '体育频道', tags: '体育,观赛,指南', status: 'published' },
    ];

    articles.forEach(article => {
      db.run(`INSERT INTO articles (title, content, author, tags, status) VALUES (?, ?, ?, ?, ?)`,
        [article.title, article.content, article.author, article.tags, article.status]);
    });

    const agents = [
      { name: '大麦网', contact: '张三', phone: '13800138001', commission_rate: 5, status: 1 },
      { name: '猫眼娱乐', contact: '李四', phone: '13800138002', commission_rate: 6, status: 1 },
    ];

    agents.forEach(agent => {
      db.run(`INSERT INTO agents (name, contact, phone, commission_rate, status) VALUES (?, ?, ?, ?, ?)`,
        [agent.name, agent.contact, agent.phone, agent.commission_rate, agent.status]);
    });

    setTimeout(() => {
      console.log('测试数据初始化完成！');
      console.log('管理员账号: admin / admin123');
      console.log('普通用户账号: testuser / user123');
    }, 2000);
  });
}

initTestData();
