const db = require('./connection');

db.exec(`
  CREATE TABLE IF NOT EXISTS cities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    pinyin TEXT,
    province TEXT,
    is_hot INTEGER DEFAULT 0,
    latitude REAL,
    longitude REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS movies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    original_title TEXT,
    poster TEXT,
    backdrop TEXT,
    rating REAL,
    rating_count INTEGER DEFAULT 0,
    release_date DATE,
    runtime INTEGER,
    genres TEXT,
    overview TEXT,
    director TEXT,
    actors TEXT,
    trailer_url TEXT,
    status TEXT DEFAULT 'upcoming',
    is_showing INTEGER DEFAULT 0,
    city_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS cinemas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    address TEXT,
    city_id INTEGER,
    district TEXT,
    phone TEXT,
    latitude REAL,
    longitude REAL,
    features TEXT,
    rating REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS schedules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    movie_id INTEGER NOT NULL,
    cinema_id INTEGER NOT NULL,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    hall TEXT,
    language TEXT,
    price REAL,
    seats_available INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    phone TEXT UNIQUE,
    email TEXT UNIQUE,
    password TEXT NOT NULL,
    nickname TEXT,
    avatar TEXT,
    is_vip INTEGER DEFAULT 0,
    vip_expire_at DATETIME,
    city_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS favorites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    movie_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, movie_id)
  );
`);

const insertCities = db.prepare(`
  INSERT OR IGNORE INTO cities (name, pinyin, province, is_hot, latitude, longitude) VALUES
  (?, ?, ?, ?, ?, ?)
`);

const cities = [
  ['北京', 'beijing', '北京', 1, 39.9042, 116.4074],
  ['上海', 'shanghai', '上海', 1, 31.2304, 121.4737],
  ['广州', 'guangzhou', '广东', 1, 23.1291, 113.2644],
  ['深圳', 'shenzhen', '广东', 1, 22.5431, 114.0579],
  ['杭州', 'hangzhou', '浙江', 1, 30.2741, 120.1551],
  ['成都', 'chengdu', '四川', 1, 30.5728, 104.0668],
  ['武汉', 'wuhan', '湖北', 0, 30.5928, 114.3055],
  ['南京', 'nanjing', '江苏', 0, 32.0603, 118.7969],
  ['西安', 'xian', '陕西', 0, 34.3416, 108.9398]
];

cities.forEach(city => insertCities.run(...city));

const insertMovies = db.prepare(`
  INSERT OR IGNORE INTO movies (title, original_title, poster, rating, release_date, runtime, genres, overview, director, actors, status, is_showing, city_id) VALUES
  (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const movies = [
  ['流浪地球3', 'The Wandering Earth 3', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=sci-fi%20movie%20poster%20space%20earth%20disaster%20epic&image_size=portrait_4_3', 9.2, '2025-01-28', 173, '科幻,冒险,灾难', '太阳即将毁灭，人类在地球表面建造出巨大的推进器，寻找新的家园。', '郭帆', '吴京,刘德华,李雪健', 'showing', 1, 1],
  ['热辣滚烫', 'No More Bets', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=comedy%20movie%20poster%20boxing%20woman%20inspiring&image_size=portrait_4_3', 8.5, '2025-02-10', 128, '喜剧,运动', '一个胖女孩通过拳击改变人生的励志故事。', '贾玲', '贾玲,雷佳音,李雪琴', 'showing', 1, 1],
  ['封神第三部', 'Fengshen Part 3', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=fantasy%20movie%20poster%20ancient%20china%20gods%20war&image_size=portrait_4_3', 8.8, '2025-01-25', 148, '奇幻,古装,动作', '武王伐纣的最终决战，封神榜的终极秘密揭晓。', '乌尔善', '费翔,黄渤,于适', 'showing', 1, 1],
  ['红海行动2', 'Operation Red Sea 2', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=action%20movie%20poster%20military%20soldiers%20war&image_size=portrait_4_3', 8.6, '2025-02-01', 135, '动作,战争', '蛟龙突击队再次出征，执行更加危险的撤侨任务。', '林超贤', '张译,黄景瑜,杜江', 'upcoming', 0, 1],
  ['唐人街探案4', 'Detective Chinatown 4', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=comedy%20mystery%20movie%20poster%20detective%20funny&image_size=portrait_4_3', 8.3, '2025-02-14', 130, '喜剧,悬疑,犯罪', '唐仁和秦风来到新的城市，揭开更大的阴谋。', '陈思诚', '王宝强,刘昊然', 'upcoming', 0, 1],
  ['复仇者联盟5', 'Avengers 5', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=superhero%20movie%20poster%20marvel%20avengers%20epic&image_size=portrait_4_3', 8.9, '2025-05-01', 180, '科幻,动作,冒险', '复仇者们面对前所未有的威胁。', '漫威', '钢铁侠,美国队长,雷神', 'upcoming', 0, 1]
];

movies.forEach(movie => insertMovies.run(...movie));

const insertCinemas = db.prepare(`
  INSERT OR IGNORE INTO cinemas (name, address, city_id, district, phone, latitude, longitude, features, rating) VALUES
  (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const cinemas = [
  ['万达影城(CBD店)', '朝阳区建国路88号SOHO现代城', 1, '朝阳区', '010-88888888', 39.91, 116.47, 'IMAX,3D,杜比全景声', 4.8],
  ['博纳国际影城(悠唐店)', '朝阳区三丰北里2号悠唐购物中心', 1, '朝阳区', '010-66666666', 39.92, 116.44, 'IMAX,4D', 4.6],
  ['CGV影城(国贸店)', '朝阳区建国门外大街1号国贸商城', 1, '朝阳区', '010-77777777', 39.90, 116.46, 'IMAX,ScreenX', 4.7],
  ['金逸影城(中关村店)', '海淀区中关村大街19号新中关购物中心', 1, '海淀区', '010-55555555', 39.98, 116.31, '3D,激光厅', 4.5]
];

cinemas.forEach(cinema => insertCinemas.run(...cinema));

const insertSchedule = db.prepare(`
  INSERT OR IGNORE INTO schedules (movie_id, cinema_id, date, start_time, end_time, hall, language, price, seats_available) VALUES
  (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const today = new Date();
const dates = [
  today.toISOString().split('T')[0],
  new Date(today.getTime() + 86400000).toISOString().split('T')[0],
  new Date(today.getTime() + 172800000).toISOString().split('T')[0]
];

const times = [
  ['09:30', '11:40'],
  ['12:00', '14:10'],
  ['14:30', '16:40'],
  ['17:00', '19:10'],
  ['19:30', '21:40'],
  ['20:00', '22:10']
];

const halls = ['1号厅', '2号厅', '3号厅', 'IMAX厅', '杜比厅'];

for (let movieId = 1; movieId <= 3; movieId++) {
  for (let cinemaId = 1; cinemaId <= 4; cinemaId++) {
    for (const date of dates) {
      for (let i = 0; i < 4; i++) {
        const time = times[Math.floor(Math.random() * times.length)];
        insertSchedule.run(
          movieId, cinemaId, date, time[0], time[1],
          halls[Math.floor(Math.random() * halls.length)],
          '国语', 35 + Math.floor(Math.random() * 30),
          50 + Math.floor(Math.random() * 100)
        );
      }
    }
  }
}

console.log('✅ Database initialized successfully!');
db.close();
