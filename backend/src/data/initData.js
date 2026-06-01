const bcrypt = require('bcryptjs');

function initData(db) {
  const hash = bcrypt.hashSync('123456', 10);
  
  const insertUser = db.prepare(`
    INSERT INTO users (username, email, password, nickname, avatar, bio)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  insertUser.run('demo', 'demo@example.com', hash, '旅行达人', 'https://picsum.photos/100/100?random=1', '热爱旅行，分享美好');
  insertUser.run('traveler', 'traveler@example.com', hash, '背包客', 'https://picsum.photos/100/100?random=2', '在路上');

  const insertGuide = db.prepare(`
    INSERT INTO guides (user_id, title, content, cover, destination, days, budget, tags, views, likes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const guideContent = `
# 日本东京5日深度游攻略

## Day 1: 浅草寺与晴空塔
上午抵达东京后，先去浅草寺感受传统文化。这里有东京最古老的寺庙，雷门的大红灯笼非常壮观。
下午可以去晴空塔，俯瞰整个东京的景色。

## Day 2: 涩谷与原宿
涩谷十字路口是必打卡之地，感受东京的繁华。原宿的竹下通有很多时尚小店。

## Day 3: 新宿御苑与明治神宫
上午在新宿御苑散步，下午去明治神宫感受宁静。

## Day 4: 台场
台场有很多商场和娱乐设施，适合购物和亲子游玩。

## Day 5: 筑地市场
最后一天去筑地市场吃最新鲜的寿司，然后返程。
  `;

  insertGuide.run(1, '日本东京5日深度游攻略', guideContent, 'https://picsum.photos/800/400?random=10', '东京', 5, 8000, '日本,东京,自由行', 1520, 89);
  insertGuide.run(1, '泰国曼谷清迈7天游记', guideContent, 'https://picsum.photos/800/400?random=11', '曼谷', 7, 5000, '泰国,曼谷,清迈', 2340, 156);
  insertGuide.run(2, '云南大理丽江自由行', guideContent, 'https://picsum.photos/800/400?random=12', '大理', 6, 3000, '云南,大理,丽江', 1890, 123);
  insertGuide.run(2, '厦门鼓浪屿3天周末游', guideContent, 'https://picsum.photos/800/400?random=13', '厦门', 3, 1500, '厦门,鼓浪屿,文艺', 980, 67);

  const insertHotel = db.prepare(`
    INSERT INTO hotels (name, destination, address, stars, price, rating, images, facilities, description)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const hotels = [
    ['东京希尔顿酒店', '东京', '东京都新宿区西新宿6-6-2', 5, 1200, 4.8, 'https://picsum.photos/400/300?random=20', 'wifi,pool,gym,parking,restaurant', '位于新宿中心，交通便利，设施完善'],
    ['曼谷文华东方酒店', '曼谷', '泰国曼谷湄南河畔', 5, 1500, 4.9, 'https://picsum.photos/400/300?random=21', 'wifi,pool,gym,parking,restaurant,spa', '百年历史的奢华酒店，湄南河畔美景'],
    ['大理古城客栈', '大理', '云南省大理市古城人民路', 3, 280, 4.5, 'https://picsum.photos/400/300?random=22', 'wifi,breakfast', '古城内特色客栈，文艺气息浓厚'],
    ['厦门曾厝垵民宿', '厦门', '福建省厦门市思明区曾厝垵', 2, 180, 4.3, 'https://picsum.photos/400/300?random=23', 'wifi', '海边文艺民宿，距离沙滩仅5分钟路程'],
    ['东京新宿华盛顿酒店', '东京', '东京都新宿区西新宿3-2-9', 4, 680, 4.2, 'https://picsum.photos/400/300?random=24', 'wifi,parking,restaurant', '性价比高，交通便利'],
    ['清迈古城酒店', '清迈', '泰国清迈古城内', 4, 450, 4.4, 'https://picsum.photos/400/300?random=25', 'wifi,pool,breakfast', '泰式风格酒店，环境优美'],
  ];

  hotels.forEach(h => insertHotel.run(...h));

  const insertDest = db.prepare(`
    INSERT INTO destinations (name, country, image, description)
    VALUES (?, ?, ?, ?)
  `);

  const dests = [
    ['东京', '日本', 'https://picsum.photos/300/200?random=30', '繁华都市，传统文化与现代科技完美融合'],
    ['曼谷', '泰国', 'https://picsum.photos/300/200?random=31', '微笑之国的首都，寺庙林立，美食天堂'],
    ['大理', '中国', 'https://picsum.photos/300/200?random=32', '风花雪月，苍山洱海，文艺青年圣地'],
    ['厦门', '中国', 'https://picsum.photos/300/200?random=33', '海上花园，文艺小清新的代表城市'],
    ['清迈', '泰国', 'https://picsum.photos/300/200?random=34', '泰北玫瑰，慢生活的代表'],
    ['丽江', '中国', 'https://picsum.photos/300/200?random=35', '纳西古镇，玉龙雪山脚下的浪漫'],
    ['成都', '中国', 'https://picsum.photos/300/200?random=36', '美食之都，熊猫故乡，悠闲生活'],
    ['杭州', '中国', 'https://picsum.photos/300/200?random=37', '西湖美景，人间天堂'],
  ];

  dests.forEach(d => insertDest.run(...d));
}

module.exports = initData;
