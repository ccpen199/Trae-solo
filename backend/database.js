import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '..', 'data', 'app.sqlite');

let db;

const initTables = async () => {
  db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  await db.exec('PRAGMA journal_mode = WAL');
  await db.exec('PRAGMA foreign_keys = ON');

  await db.exec(`
    DROP TABLE IF EXISTS audit_logs;
    DROP TABLE IF EXISTS merchants;
    DROP TABLE IF EXISTS comments;
    DROP TABLE IF EXISTS likes;
    DROP TABLE IF EXISTS reviews;
    DROP TABLE IF EXISTS notes;
    DROP TABLE IF EXISTS pois;
    DROP TABLE IF EXISTS poi_categories;
    DROP TABLE IF EXISTS users;

    CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      nickname TEXT,
      avatar TEXT,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE poi_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      icon TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE pois (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category_id INTEGER REFERENCES poi_categories(id),
      address TEXT,
      latitude REAL,
      longitude REAL,
      business_hours TEXT,
      avg_price REAL,
      facilities TEXT,
      accessibility TEXT,
      contact TEXT,
      tags TEXT,
      description TEXT,
      rating REAL DEFAULT 0,
      review_count INTEGER DEFAULT 0,
      status INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      poi_id INTEGER REFERENCES pois(id),
      title TEXT NOT NULL,
      content TEXT,
      images TEXT,
      status INTEGER DEFAULT 0,
      hot_score REAL DEFAULT 0,
      view_count INTEGER DEFAULT 0,
      like_count INTEGER DEFAULT 0,
      comment_count INTEGER DEFAULT 0,
      risk_tips TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      poi_id INTEGER REFERENCES pois(id),
      note_id INTEGER REFERENCES notes(id),
      rating INTEGER NOT NULL,
      content TEXT,
      credibility_score REAL DEFAULT 0,
      status INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE likes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      note_id INTEGER REFERENCES notes(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, note_id)
    );

    CREATE TABLE comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      note_id INTEGER REFERENCES notes(id),
      content TEXT NOT NULL,
      status INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE merchants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      poi_id INTEGER REFERENCES pois(id),
      business_license TEXT,
      verified INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      note_id INTEGER REFERENCES notes(id),
      reviewer_id INTEGER REFERENCES users(id),
      action TEXT,
      reason TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const catCount = await db.get('SELECT COUNT(*) as count FROM poi_categories');
  if (catCount.count === 0) {
    await db.run('INSERT INTO poi_categories (name, icon) VALUES (?, ?)', '美食', 'food');
    await db.run('INSERT INTO poi_categories (name, icon) VALUES (?, ?)', '景点', 'sight');
    await db.run('INSERT INTO poi_categories (name, icon) VALUES (?, ?)', '亲子', 'family');
    await db.run('INSERT INTO poi_categories (name, icon) VALUES (?, ?)', '新奇体验', 'adventure');
    await db.run('INSERT INTO poi_categories (name, icon) VALUES (?, ?)', '生活服务', 'service');
  }

  const userCount = await db.get('SELECT COUNT(*) as count FROM users');
  if (userCount.count === 0) {
    const passwordHash = '$2b$10$EixZaY3s7vjRjMRC/.R6IeKv0u8b8g7h5i4j3k2l1m0n9o8p7q6r5';
    await db.run('INSERT INTO users (username, nickname, avatar, password_hash) VALUES (?, ?, ?, ?)', 
      'demo', '探店达人小王', 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo', passwordHash);
    await db.run('INSERT INTO users (username, nickname, avatar, password_hash) VALUES (?, ?, ?, ?)', 
      'foodie', '美食家小李', 'https://api.dicebear.com/7.x/avataaars/svg?seed=foodie', passwordHash);
    await db.run('INSERT INTO users (username, nickname, avatar, password_hash) VALUES (?, ?, ?, ?)', 
      'traveler', '旅行者小张', 'https://api.dicebear.com/7.x/avataaars/svg?seed=traveler', passwordHash);
    await db.run('INSERT INTO users (username, nickname, avatar, password_hash) VALUES (?, ?, ?, ?)', 
      'admin', '管理员', 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin', passwordHash);
  }

  const poiCount = await db.get('SELECT COUNT(*) as count FROM pois');
  if (poiCount.count === 0) {
    const pois = [
      ['老北京铜锅涮肉', 1, '北京市朝阳区三里屯路19号院', 39.9356, 116.4545, '11:00-22:00', 128, '免费WiFi,空调,包厢,停车位,刷卡支付', '无障碍通道,轮椅可用', '010-66668888', '涮肉,铜锅,老字号,聚餐', '传承百年的老北京涮肉，采用传统铜锅炭火，羊肉选自内蒙锡林郭勒，肉质鲜嫩入口即化。', 4.8, 256],
      ['川味火锅城', 1, '北京市东城区王府井大街88号', 39.9147, 116.4108, '10:00-23:00', 156, '免费WiFi,空调,包厢,停车位,扫码点餐', '无障碍通道', '010-88886666', '火锅,川菜,麻辣,老字号', '正宗重庆火锅，牛油锅底麻辣鲜香，毛肚鸭肠鲜脆爽口，吃货必打卡！', 4.6, 189],
      ['故宫博物院', 2, '北京市东城区景山前街4号', 39.9163, 116.3972, '08:30-17:00(周一闭馆)', 60, '讲解服务,语音导览,纪念品商店,餐厅,休息区', '无障碍通道,轮椅租借,无障碍卫生间', '010-85007421', '历史古迹,博物馆,文化,皇家园林', '明清两代皇家宫殿，世界上现存规模最大的木质结构建筑群，馆藏文物百万余件。', 4.9, 5234],
      ['北京欢乐谷', 2, '北京市朝阳区东四环小武基北路', 39.8673, 116.4892, '09:30-22:00', 299, '免费WiFi,寄存柜,餐厅,商店,医务室', '无障碍通道,部分项目轮椅可参与', '010-67389898', '主题乐园,过山车,游乐设施,亲子', '超大型主题乐园，拥有过山车、激流勇进等百余项游乐设施，适合全家出游。', 4.5, 892],
      ['宝贝王儿童乐园', 3, '北京市海淀区中关村大街1号', 39.9847, 116.3165, '09:00-21:00', 88, '母婴室,休息区,免费WiFi,消毒设施', '无障碍通道,婴儿推车可进', '010-12345678', '儿童乐园,淘气堡,亲子,早教', '专为1-12岁儿童设计的室内乐园，含淘气堡、沙池、手工区等，安全卫生有保障。', 4.7, 456],
      ['周末农场亲子采摘园', 3, '北京市昌平区兴寿镇', 40.1423, 116.4231, '08:00-18:00', 50, '停车场,卫生间,休息区,餐饮', '无障碍通道', '010-87654321', '采摘,农场,亲子,农家乐', '周末遛娃好去处！可以采摘草莓、葡萄、蔬菜等，还有小动物喂养，让孩子亲近自然。', 4.4, 234],
      ['谜境密室逃脱', 4, '北京市朝阳区建国路88号', 39.9087, 116.4578, '10:00-24:00', 168, '免费WiFi,休息区,饮用水,存包', '暂无', '13800138000', '密室逃脱,解谜,恐怖,团建', '沉浸式密室逃脱，多个主题可选，NPC互动逼真，烧脑又刺激，团建首选。', 4.6, 567],
      ['星空露营基地', 4, '北京市怀柔区雁栖镇', 40.3678, 116.6234, '24小时营业', 399, '帐篷出租,烧烤设备,卫生间,淋浴,停车场', '部分区域可达', '13900139000', '露营,星空,烧烤,户外', '远离城市喧嚣，仰望星空入睡，提供全套露营装备，可烧烤可篝火，浪漫又治愈。', 4.8, 189],
      ['初心手作工坊', 4, '北京市西城区南锣鼓巷108号', 39.9378, 116.4034, '10:00-20:00', 128, '免费WiFi,休息区,茶饮', '无障碍通道', '13700137000', '手作,DIY,陶艺,创意', '慢生活体验空间，可制作陶艺、蜡烛、皮具等，专业老师指导，成品可带走做纪念。', 4.7, 345],
      ['梵希美发沙龙', 5, '北京市朝阳区国贸商城B1层', 39.9089, 116.4592, '10:00-22:00', 388, '免费WiFi,饮品,杂志,存包', '无障碍通道', '010-65667788', '美发,造型,烫染,护理', '高端美发沙龙，来自东京的造型师团队，采用进口产品，打造专属你的时尚造型。', 4.5, 678],
      ['悦SPA养生会所', 5, '北京市海淀区中关村南大街2号', 39.9567, 116.3213, '12:00-24:00', 598, '免费WiFi,淋浴,汗蒸,茶点', '无障碍通道', '010-88665544', 'SPA,按摩,养生,美容', '城市中的静谧绿洲，专业技师提供精油按摩、热石SPA等服务，舒缓身心压力。', 4.6, 432],
      ['燃健身俱乐部', 5, '北京市朝阳区望京SOHO T3', 39.9876, 116.4789, '06:00-23:00', 299, '免费WiFi,更衣室,淋浴,储物柜', '无障碍通道', '010-84987654', '健身,私教,团课,瑜伽', '24小时智能健身房，顶级器械设备，专业私教指导，还有瑜伽、动感单车等团课。', 4.7, 567]
    ];

    for (const poi of pois) {
      await db.run(`INSERT INTO pois (name, category_id, address, latitude, longitude, business_hours, avg_price, facilities, accessibility, contact, tags, description, rating, review_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, poi);
    }
  }

  const noteCount = await db.get('SELECT COUNT(*) as count FROM notes');
  if (noteCount.count === 0) {
    const notes = [
      [2, 1, '涮肉天花板！这家铜锅让我吃出了北京味', '作为一个土生土长的北京人，这家涮肉馆真的让我找回了小时候的味道。铜锅炭火，清汤锅底，最能检验羊肉的品质。\n\n【必点菜品】\n✅ 手切鲜羊肉：立盘不倒，涮8秒即可，鲜嫩无膻\n✅ 芝麻火烧：外酥里软，芝麻香浓郁\n✅ 糖蒜：酸甜脆爽，解腻神器\n\n【避坑提示】\n⚠️ 周末晚上人超级多，建议提前电话预约\n⚠️ 停车位紧张，建议地铁前往，10号线团结湖站\n⚠️ 人均150左右，分量足，别点太多\n\n【真实体验】\n我们4个人花了500多，吃到扶墙出。服务员态度特别好，会帮你涮肉，告诉你最佳时间。麻酱小料特别正宗，配上辣椒油，绝了！', 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800,https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800', 1, 95.5, 1234, 267, 45, '周末人多需排队，建议工作日前往或提前预约'],
      [2, 2, '辣到爽！这家川味火锅让我欲罢不能', '无辣不欢的姐妹们看过来！这家火锅真的是我吃过最正宗的重庆味道了！\n\n【锅底推荐】\n🌶️ 牛油九宫格：经典必点，越煮越香\n🥘 鸳鸯锅：不能吃辣的朋友也有口福\n\n【必点菜品】\n✅ 鲜毛肚：七上八下，脆嫩爽口\n✅ 鸭肠：涮10秒，脆到弹牙\n✅ 贡菜：重庆特色，嘎嘣脆\n✅ 红糖糍粑：外酥里糯，解辣必备\n\n【避坑提示】\n⚠️ 真的很辣！不能吃辣的选微辣就好\n⚠️ 人均150+，建议团购更划算\n⚠️ 香油碟是灵魂，一定要试试', 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800,https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800', 1, 87.3, 987, 189, 34, '辣度较高，肠胃不好的朋友注意'],
      [3, 3, '故宫正确打开方式｜避开人流的小众路线', '来北京必去故宫，但你知道怎么逛才能避开人潮吗？\n\n【推荐路线】\n🚶 午门→武英殿→文华殿→慈宁宫→寿康宫→御花园→神武门\n\n【避坑攻略】\n✅ 提前10天官网预约，早上8:30开门就进\n✅ 直奔珍宝馆、钟表馆，人少展品精\n✅ 下午3点后旅行团开始离场，拍照光线也好\n✅ 租个讲解器，比听导游方便\n\n【隐藏彩蛋】\n💫 珍宝馆的金发塔，工艺精湛叹为观止\n💫 延禧宫的水晶宫，虽然烂尾但很有特色\n💫 神武门外角楼，最佳拍照点\n\n门票60元，建议预留一整天时间慢慢逛！', 'https://images.unsplash.com/photo-1584450150050-4b9bdbd51f68?w=800,https://images.unsplash.com/photo-1547981609-4b6bfe67ca0b?w=800', 1, 234.7, 5678, 892, 156, '周一闭馆，务必提前预约，节假日人极多'],
      [3, 4, '欢乐谷尖叫指南｜最刺激的5个项目', '胆大的朋友看过来！欢乐谷最值得玩的5个项目，按刺激程度排名：\n\n🏆 TOP1 极速飞车\n弹射式过山车，0-135km/h仅需2秒，全程尖叫！\n\n🏆 TOP2 太阳神车\n大摆锤，荡到最高处俯瞰全园，失重感超强！\n\n🏆 TOP3 特洛伊木马\n360度翻滚，还会突然反转，超级晕但也超级爽！\n\n🏆 TOP4 丛林飞车\n矿山式过山车，速度快弯道多，虽然不高但很刺激！\n\n🏆 TOP5 鬼屋\n沉浸式恐怖体验，NPC会追人，胆小慎入！\n\n【小贴士】\n💡 工作日去不用排队\n💡 带好雨衣，激流勇进会全身湿\n💡 存包要钱，尽量少带东西', 'https://images.unsplash.com/photo-1513889961551-628c1e5e2ee9?w=800,https://images.unsplash.com/photo-1572088558639-460f85867e9e?w=800', 1, 156.8, 2345, 456, 78, '部分项目有身高体重限制，注意身体状况'],
      [2, 6, '周末遛娃好去处｜农场采摘一日游', '终于带娃打卡了心心念念的采摘园，小朋友玩到不想走！\n\n【体验项目】\n🍓 草莓采摘：30元/斤，超甜！小朋友自己摘，成就感满满\n🐑 小动物喂养：有羊、兔子、鸡，10元饲料\n🎣 钓鱼：鱼竿可租，钓上来的鱼可以烤\n🍢 自助烧烤：提供场地和碳，食材可自带\n\n【费用】\n🎫 门票：成人50元，儿童30元（可抵采摘费）\n💰 人均100元左右\n\n【推荐理由】\n✅ 场地大，空气好\n✅ 工作人员热情，会教小朋友摘\n✅ 草莓品质好，没有空心\n✅ 可以呆一整天，不会无聊\n\n周末带娃放电的好地方，强烈推荐！', 'https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=800,https://images.unsplash.com/photo-1465695954255-a262b0f57b40?w=800', 1, 78.5, 1567, 234, 56, '注意防晒防蚊，建议自带野餐垫'],
      [3, 8, '星空露营｜城市出逃计划', '想远离城市喧嚣？来这里看星星吧！\n\n【预订方式】\n提前3天电话预约，周末一定要早订！我们选的是豪华帐篷套餐，399/人，包含：\n⛺ 帐篷+防潮垫+睡袋（很干净）\n🍖 烧烤套餐（食材很新鲜）\n🔥 篝火+露天电影\n\n【体验】\n✨ 晚上星星真的超级多，能看到银河\n✨ 老板很热情，会帮着生火\n✨ 可以唱歌，氛围超级好\n✨ 早上被鸟叫醒，感觉住在森林里\n\n【注意事项】\n⚠️ 早晚温差大，带件厚外套\n⚠️ 有虫子，带好驱蚊水\n⚠️ 没有热水洗澡，讲究的自带湿巾\n\n超级治愈的体验，下次还来！', 'https://images.unsplash.com/photo-1445363915871-80053973585e?w=800,https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800', 1, 134.2, 1890, 312, 67, '昼夜温差大，山区天气多变'],
      [2, 9, '手作初体验｜做个杯子送给TA', '和男票约会找到了这家手作店，也太有意义了吧！\n\n【做陶艺流程】\n1️⃣ 选款式：杯子、碗、花瓶都可以\n2️⃣ 老师教学：会手把手教，手残党也不怕\n3️⃣ 制作拉坯：大概1小时，特别解压\n4️⃣ 上色：可以写字画画，我们写了纪念日\n5️⃣ 烧制：一周后取成品\n\n【费用】\n🎨 人均128元，包含所有材料\n💝 加30元可以刻字\n\n【环境】\n小店在南锣鼓巷里，闹中取静，装修很文艺。老板是个小姐姐，特别有耐心。我们做了一对情侣杯，虽然歪歪扭扭的，但特别有纪念意义～\n\n约会、闺蜜聚会、亲子活动都适合！', 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=800,https://images.unsplash.com/photo-1578737121213-5e3e693b99d4?w=800', 0, 0, 0, 0, 0, null],
      [3, 11, 'SPA测评｜这家按摩让我舒服到睡着', '加班一个月，肩颈快废了，被闺蜜安利了这家SPA，太爽了！\n\n【我做的项目】\n💆 精油按摩：60分钟，598元\n\n【体验】\n🌿 环境：很安静，灯光柔和，音乐舒缓，一进去就放松了\n💆 手法：技师手法专业，知道哪里痛，按的时候有点痛但很爽\n🛁 可以先淋浴，用的都是欧舒丹，很高级\n🍵 做完有茶点，银耳汤很好喝\n\n【服务】\n✅ 全程无推销！这点太重要了\n✅ 技师话不多，不会尬聊\n✅ 可以选精油香味，我选的薰衣草\n\n【注意】\n⏰ 建议提前预约，周末人多\n💳 办卡更划算，我办了次卡\n\n真的是打工人的救赎，已经把它列入我的每周放松清单了！', 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800,https://images.unsplash.com/photo-1600334129128-685c5582fd35?w=800', 0, 0, 0, 0, 0, null],
      [2, 12, '健身小白打卡｜这家健身房太友好了', '终于下定决心办健身卡了！对比了好几家，最终选了这里。\n\n【为什么选这家】\n✅ 器械全：都是泰诺健的，很新\n✅ 环境好：落地窗，采光好，空气不闷\n✅ 有团课：瑜伽、普拉提、动感单车都有\n✅ 24小时：加班晚也能练\n\n【私教体验】\n买了10节私教课，教练很专业，不会硬推销。\n第一节课测了体脂，制定了训练计划，每节课都会记录体重围度变化，很科学。\n\n【费用】\n💰 年卡：3999元（现在活动送2个月）\n💰 私教：300元/节\n\n【小贴士】\n💡 更衣室有戴森吹风机，很赞\n💡 有免费的饮用水和毛巾\n💡 楼下就有停车场，很方便\n\n希望三个月后能练出马甲线！', 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800,https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=800', 0, 0, 0, 0, 0, null],
      [3, 7, '密室逃脱攻略｜新手也能通关', '第一次玩密室逃脱，我们选了这个恐怖主题，超级刺激！\n\n【主题】《返校》恐怖校园主题\n【人数】4人（最少3人）\n【时长】90分钟\n【难度】⭐⭐⭐\n\n【剧情】\n回到废弃的学校，找出当年学生跳楼的真相...有NPC，会突然出现，吓死人了！\n\n【通关技巧】\n🧩 仔细听语音提示，很多线索在里面\n🧩 注意墙上、桌子上的细节\n🧩 不要分开行动，NPC会抓落单的人\n🧩 胆子小的站中间！\n\n【我们的情况】\n4个人，最后差5分钟通关，求助了一次。整体体验很好，场景很逼真，代入感强。\n\n工作人员服务态度很好，结束后会复盘。下次想试试别的主题！', 'https://images.unsplash.com/photo-1551632436-cbf8dd35adfa?w=800,https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800', 0, 0, 0, 0, 0, null]
    ];

    for (const note of notes) {
      await db.run(`INSERT INTO notes (user_id, poi_id, title, content, images, status, hot_score, view_count, like_count, comment_count, risk_tips) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, note);
    }
  }

  const reviewCount = await db.get('SELECT COUNT(*) as count FROM reviews');
  if (reviewCount.count === 0) {
    const reviews = [
      [2, 1, null, 5, '味道正宗，服务周到，老字号值得信赖！会经常来的。', 0.92],
      [3, 1, null, 4, '羊肉很新鲜，就是人太多了，排了半小时队。', 0.88],
      [2, 3, null, 5, '故宫真的太震撼了，每次来都有新发现！', 0.95],
      [3, 4, null, 4, '项目很刺激，就是排队太久了，建议工作日来。', 0.85],
      [2, 6, null, 5, '带娃好去处，小朋友玩得特别开心！', 0.90],
      [3, 8, null, 5, '看星星太浪漫了，强烈推荐情侣来！', 0.87],
      [2, 11, null, 4, '按摩很舒服，就是价格有点贵。', 0.82],
      [3, 12, null, 5, '器械很新，环境很好，会坚持来健身的！', 0.89]
    ];

    for (const review of reviews) {
      await db.run(`INSERT INTO reviews (user_id, poi_id, note_id, rating, content, credibility_score) VALUES (?, ?, ?, ?, ?, ?)`, review);
    }
  }

  const commentCount = await db.get('SELECT COUNT(*) as count FROM comments');
  if (commentCount.count === 0) {
    const comments = [
      [3, 1, '看起来好好吃！收藏了，周末去打卡！'],
      [2, 1, '这家我也去过，麻酱真的绝了！'],
      [3, 2, '收藏，下周团建就去这家！'],
      [2, 3, '攻略太实用了，照着走避开了好多人！'],
      [3, 3, '故宫真的值得好好逛一整天！'],
      [2, 4, '极速飞车真的太爽了，我刷了3次！'],
      [3, 5, '周末带娃去，小朋友应该会喜欢！'],
      [2, 6, '看星星太浪漫了，已种草！']
    ];

    for (const comment of comments) {
      await db.run(`INSERT INTO comments (user_id, note_id, content) VALUES (?, ?, ?)`, comment);
    }
  }

  console.log('Database initialized successfully');
};

await initTables();

export default db;
