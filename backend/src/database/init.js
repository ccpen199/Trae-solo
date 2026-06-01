const Database = require('better-sqlite3')
const path = require('path')
const fs = require('fs')
const bcrypt = require('bcryptjs')

const dbDir = path.join(__dirname, '../../../data')
const dbPath = path.join(dbDir, 'app.sqlite')

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true })
}

if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath)
}

const db = new Database(dbPath, { verbose: console.log })

console.log('开始创建数据表...')

db.exec(`
CREATE TABLE IF NOT EXISTS cities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name VARCHAR(50) NOT NULL,
  code VARCHAR(20) NOT NULL UNIQUE,
  pinyin VARCHAR(100),
  is_hot BOOLEAN DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  phone VARCHAR(20) UNIQUE,
  username VARCHAR(50),
  nickname VARCHAR(50),
  avatar VARCHAR(255),
  password VARCHAR(255),
  gender INTEGER DEFAULT 0,
  city_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (city_id) REFERENCES cities(id)
);

CREATE TABLE IF NOT EXISTS movies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title VARCHAR(100) NOT NULL,
  original_title VARCHAR(100),
  poster VARCHAR(255),
  backdrop VARCHAR(255),
  rating DECIMAL(3,1) DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  wish_count INTEGER DEFAULT 0,
  release_date DATE,
  duration INTEGER,
  description TEXT,
  director VARCHAR(100),
  actors TEXT,
  genres VARCHAR(200),
  country VARCHAR(50),
  language VARCHAR(50),
  status INTEGER DEFAULT 1,
  is_showing BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cinemas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name VARCHAR(100) NOT NULL,
  address VARCHAR(255),
  phone VARCHAR(50),
  city_id INTEGER,
  district VARCHAR(50),
  business_area VARCHAR(100),
  latitude DECIMAL(10,6),
  longitude DECIMAL(10,6),
  features VARCHAR(200),
  min_price DECIMAL(10,2) DEFAULT 0,
  rating DECIMAL(3,1) DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (city_id) REFERENCES cities(id)
);

CREATE TABLE IF NOT EXISTS halls (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cinema_id INTEGER NOT NULL,
  name VARCHAR(50) NOT NULL,
  type VARCHAR(50),
  seats_count INTEGER DEFAULT 0,
  rows INTEGER DEFAULT 0,
  cols INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (cinema_id) REFERENCES cinemas(id)
);

CREATE TABLE IF NOT EXISTS seats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  hall_id INTEGER NOT NULL,
  row_num INTEGER NOT NULL,
  col_num INTEGER NOT NULL,
  seat_code VARCHAR(20),
  seat_type INTEGER DEFAULT 1,
  is_available BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (hall_id) REFERENCES halls(id)
);

CREATE TABLE IF NOT EXISTS schedules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  movie_id INTEGER NOT NULL,
  cinema_id INTEGER NOT NULL,
  hall_id INTEGER NOT NULL,
  start_time DATETIME NOT NULL,
  end_time DATETIME NOT NULL,
  language VARCHAR(50),
  dimension VARCHAR(20),
  price DECIMAL(10,2) NOT NULL,
  status INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (movie_id) REFERENCES movies(id),
  FOREIGN KEY (cinema_id) REFERENCES cinemas(id),
  FOREIGN KEY (hall_id) REFERENCES halls(id)
);

CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_no VARCHAR(50) UNIQUE NOT NULL,
  user_id INTEGER NOT NULL,
  schedule_id INTEGER NOT NULL,
  seats TEXT NOT NULL,
  seats_count INTEGER NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  status INTEGER DEFAULT 0,
  pay_time DATETIME,
  cancel_time DATETIME,
  ticket_code VARCHAR(50),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (schedule_id) REFERENCES schedules(id)
);

CREATE TABLE IF NOT EXISTS reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  movie_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  rating DECIMAL(3,1) NOT NULL,
  content TEXT,
  likes_count INTEGER DEFAULT 0,
  is_wish BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (movie_id) REFERENCES movies(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS banners (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title VARCHAR(100),
  image_url VARCHAR(255) NOT NULL,
  link_url VARCHAR(255),
  sort_order INTEGER DEFAULT 0,
  status INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
`)

console.log('数据表创建成功！')
console.log('开始插入种子数据...')

const cities = [
  { name: '北京', code: 'beijing', pinyin: 'beijing', is_hot: 1, sort_order: 1 },
  { name: '上海', code: 'shanghai', pinyin: 'shanghai', is_hot: 1, sort_order: 2 },
  { name: '广州', code: 'guangzhou', pinyin: 'guangzhou', is_hot: 1, sort_order: 3 },
  { name: '深圳', code: 'shenzhen', pinyin: 'shenzhen', is_hot: 1, sort_order: 4 },
  { name: '杭州', code: 'hangzhou', pinyin: 'hangzhou', is_hot: 1, sort_order: 5 },
  { name: '成都', code: 'chengdu', pinyin: 'chengdu', is_hot: 1, sort_order: 6 },
]

const insertCity = db.prepare('INSERT INTO cities (name, code, pinyin, is_hot, sort_order) VALUES (?, ?, ?, ?, ?)')
cities.forEach(city => insertCity.run(city.name, city.code, city.pinyin, city.is_hot, city.sort_order))
console.log('城市数据插入完成')

const banners = [
  { title: '流浪地球3震撼来袭', image_url: 'https://picsum.photos/800/300?random=1', link_url: '', sort_order: 1 },
  { title: '速度与激情10首映', image_url: 'https://picsum.photos/800/300?random=2', link_url: '', sort_order: 2 },
  { title: '复仇者联盟5', image_url: 'https://picsum.photos/800/300?random=3', link_url: '', sort_order: 3 },
]

const insertBanner = db.prepare('INSERT INTO banners (title, image_url, link_url, sort_order, status) VALUES (?, ?, ?, ?, ?)')
banners.forEach(banner => insertBanner.run(banner.title, banner.image_url, banner.link_url, banner.sort_order, 1))
console.log('Banner数据插入完成')

const movies = [
  {
    title: '流浪地球3',
    original_title: 'The Wandering Earth 3',
    poster: 'https://picsum.photos/300/400?random=10',
    backdrop: 'https://picsum.photos/800/400?random=10',
    rating: 9.2,
    rating_count: 125680,
    wish_count: 25680,
    release_date: '2025-01-22',
    duration: 173,
    description: '太阳即将毁灭，人类在地球表面建造出巨大的推进器，寻找新的家园。然而宇宙之路危机四伏，为了拯救地球，流浪地球时代的年轻人再次挺身而出，展开争分夺秒的生死之战。',
    director: '郭帆',
    actors: '吴京,刘德华,李雪健,沙溢,宁理',
    genres: '科幻,冒险,灾难',
    country: '中国大陆',
    language: '普通话',
    status: 1,
    is_showing: 1,
  },
  {
    title: '满江红',
    original_title: 'Full River Red',
    poster: 'https://picsum.photos/300/400?random=11',
    backdrop: 'https://picsum.photos/800/400?random=11',
    rating: 8.5,
    rating_count: 89560,
    wish_count: 15680,
    release_date: '2025-01-15',
    duration: 159,
    description: '南宋绍兴年间，岳飞死后四年，秦桧率兵与金国会谈。会谈前夜，金国使者死在宰相驻地，所携密信也不翼而飞。',
    director: '张艺谋',
    actors: '沈腾,易烊千玺,张译,雷佳音,岳云鹏',
    genres: '悬疑,喜剧,古装',
    country: '中国大陆',
    language: '普通话',
    status: 1,
    is_showing: 1,
  },
  {
    title: '封神第二部',
    original_title: 'Creation of The Gods II',
    poster: 'https://picsum.photos/300/400?random=12',
    backdrop: 'https://picsum.photos/800/400?random=12',
    rating: 8.8,
    rating_count: 76540,
    wish_count: 32560,
    release_date: '2025-02-01',
    duration: 148,
    description: '商王殷寿与狐妖妲己勾结，暴虐无道，引起民怨沸腾。姬发联合四方诸侯，共同讨伐殷商，开启了一场惊心动魄的封神之战。',
    director: '乌尔善',
    actors: '费翔,李雪健,黄渤,于适,娜然',
    genres: '神话,动作,奇幻',
    country: '中国大陆',
    language: '普通话',
    status: 1,
    is_showing: 1,
  },
  {
    title: '热辣滚烫',
    original_title: 'Never Say Never',
    poster: 'https://picsum.photos/300/400?random=13',
    backdrop: 'https://picsum.photos/800/400?random=13',
    rating: 7.9,
    rating_count: 65230,
    wish_count: 12350,
    release_date: '2025-02-10',
    duration: 128,
    description: '宅家多年的乐莹在生活浑浑噩噩，如掌上观剧、嗑糖追剧，在经历了一次欺骗后，决定重新找回自己的人生。',
    director: '贾玲',
    actors: '贾玲,雷佳音,李雪琴,沈腾',
    genres: '喜剧,励志',
    country: '中国大陆',
    language: '普通话',
    status: 1,
    is_showing: 1,
  },
  {
    title: '飞驰人生3',
    original_title: 'Pegasus 3',
    poster: 'https://picsum.photos/300/400?random=14',
    backdrop: 'https://picsum.photos/800/400?random=14',
    rating: 8.2,
    rating_count: 54320,
    wish_count: 28960,
    release_date: '2025-02-15',
    duration: 136,
    description: '曾经的赛车手张驰，在经历了人生的大起大落后，决定重返赛场，挑战新一代的年轻车手们。',
    director: '韩寒',
    actors: '沈腾,范丞丞,尹正,张本煜',
    genres: '喜剧,运动,励志',
    country: '中国大陆',
    language: '普通话',
    status: 1,
    is_showing: 0,
  },
  {
    title: '功夫熊猫5',
    original_title: 'Kung Fu Panda 5',
    poster: 'https://picsum.photos/300/400?random=15',
    backdrop: 'https://picsum.photos/800/400?random=15',
    rating: 0,
    rating_count: 0,
    wish_count: 45680,
    release_date: '2025-03-01',
    duration: 105,
    description: '神龙大侠阿宝再次踏上新的冒险旅程，面对更强大的敌人正在等待着他。',
    director: 'Jennifer Yuh',
    actors: 'Jack Black,Angelina Jolie,Dustin Hoffman',
    genres: '动画,喜剧,动作',
    country: '美国',
    language: '英语',
    status: 1,
    is_showing: 0,
  },
]

const insertMovie = db.prepare(`
  INSERT INTO movies 
  (title, original_title, poster, backdrop, rating, rating_count, wish_count, release_date, duration, 
   description, director, actors, genres, country, language, status, is_showing) 
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`)
movies.forEach(movie => {
  insertMovie.run(
    movie.title, movie.original_title, movie.poster, movie.backdrop, movie.rating, 
    movie.rating_count, movie.wish_count, movie.release_date, movie.duration, movie.description,
    movie.director, movie.actors, movie.genres, movie.country, movie.language,
    movie.status, movie.is_showing
  )
})
console.log('影片数据插入完成')

const cinemas = [
  {
    name: '万达影城(CBD店)',
    address: '朝阳区建国路88号SOHO现代城',
    phone: '010-88888888',
    city_id: 1,
    district: '朝阳区',
    business_area: 'CBD',
    latitude: 39.914,
    longitude: 116.465,
    features: 'IMAX,4D,杜比全景声',
    min_price: 35.00,
    rating: 4.8,
  },
  {
    name: 'CGV影城(望京店)',
    address: '朝阳区望京街9号望京SOHO',
    phone: '010-66666666',
    city_id: 1,
    district: '朝阳区',
    business_area: '望京',
    latitude: 39.985,
    longitude: 116.475,
    features: 'IMAX,4DX,ScreenX',
    min_price: 38.00,
    rating: 4.7,
  },
  {
    name: '金逸影城(西单店)',
    address: '西城区西单北大街130号',
    phone: '010-77777777',
    city_id: 1,
    district: '西城区',
    business_area: '西单',
    latitude: 39.912,
    longitude: 116.375,
    features: '杜比全景声,巨幕厅',
    min_price: 32.00,
    rating: 4.5,
  },
  {
    name: '百老汇影城(国瑞城店)',
    address: '东城区崇文门外大街18号',
    phone: '010-99999999',
    city_id: 1,
    district: '东城区',
    business_area: '崇文门',
    latitude: 39.902,
    longitude: 116.415,
    features: '激光IMAX,VIP厅',
    min_price: 45.00,
    rating: 4.9,
  },
  {
    name: '博纳国际影城(悠唐店)',
    address: '朝阳区三丰北里2号',
    phone: '010-55555555',
    city_id: 1,
    district: '朝阳区',
    business_area: '朝外',
    latitude: 39.920,
    longitude: 116.435,
    features: '杜比影院,4D',
    min_price: 33.00,
    rating: 4.6,
  },
]

const insertCinema = db.prepare(`
  INSERT INTO cinemas 
  (name, address, phone, city_id, district, business_area, latitude, longitude, features, min_price, rating) 
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`)
cinemas.forEach(cinema => {
  insertCinema.run(
    cinema.name, cinema.address, cinema.phone, cinema.city_id,
    cinema.district, cinema.business_area, cinema.latitude, cinema.longitude,
    cinema.features, cinema.min_price, cinema.rating
  )
})
console.log('影院数据插入完成')

const halls = [
  { cinema_id: 1, name: '1号厅(IMAX)', type: 'IMAX', seats_count: 300, rows: 15, cols: 20 },
  { cinema_id: 1, name: '2号厅', type: '标准厅', seats_count: 150, rows: 10, cols: 15 },
  { cinema_id: 1, name: '3号厅(杜比)', type: '杜比全景声', seats_count: 200, rows: 12, cols: 17 },
  { cinema_id: 2, name: '1号厅(IMAX)', type: 'IMAX', seats_count: 280, rows: 14, cols: 20 },
  { cinema_id: 2, name: '2号厅(4DX)', type: '4DX', seats_count: 120, rows: 8, cols: 15 },
  { cinema_id: 3, name: '1号厅', type: '标准厅', seats_count: 180, rows: 12, cols: 15 },
  { cinema_id: 3, name: '2号厅(巨幕)', type: '巨幕厅', seats_count: 250, rows: 13, cols: 19 },
  { cinema_id: 4, name: '1号厅(激光IMAX)', type: '激光IMAX', seats_count: 350, rows: 17, cols: 21 },
  { cinema_id: 4, name: '2号厅(VIP)', type: 'VIP厅', seats_count: 40, rows: 5, cols: 8 },
  { cinema_id: 5, name: '1号厅', type: '标准厅', seats_count: 160, rows: 10, cols: 16 },
]

const insertHall = db.prepare('INSERT INTO halls (cinema_id, name, type, seats_count, rows, cols) VALUES (?, ?, ?, ?, ?, ?)')
halls.forEach(hall => insertHall.run(hall.cinema_id, hall.name, hall.type, hall.seats_count, hall.rows, hall.cols))
console.log('影厅数据插入完成')

console.log('开始生成座位数据...')
const insertSeat = db.prepare('INSERT INTO seats (hall_id, row_num, col_num, seat_code, seat_type, is_available) VALUES (?, ?, ?, ?, ?, ?)')
halls.forEach((hall, hallIndex) => {
  const hallId = hallIndex + 1
  for (let row = 1; row <= hall.rows; row++) {
    for (let col = 1; col <= hall.cols; col++) {
      const seatCode = `${String.fromCharCode(64 + row)}排${col}座`
      insertSeat.run(hallId, row, col, seatCode, 1, 1)
    }
  }
})
console.log('座位数据插入完成')

console.log('开始生成场次数据...')
const insertSchedule = db.prepare(`
  INSERT INTO schedules 
  (movie_id, cinema_id, hall_id, start_time, end_time, language, dimension, price, status) 
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`)

const today = new Date()
const timeSlots = [
  { start: '10:00', end: '12:10' },
  { start: '12:30', end: '14:40' },
  { start: '15:00', end: '17:10' },
  { start: '17:30', end: '19:40' },
  { start: '20:00', end: '22:10' },
  { start: '22:30', end: '00:40' },
]

for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
  const date = new Date(today)
  date.setDate(date.getDate() + dayOffset)
  const dateStr = date.toISOString().split('T')[0]

  for (let movieId = 1; movieId <= 4; movieId++) {
    for (let cinemaId = 1; cinemaId <= 5; cinemaId++) {
      const hallId = ((cinemaId - 1) * 2 + (movieId % 2)) % 10 + 1
      const numSlots = 3 + Math.floor(Math.random() * 3)
      
      for (let i = 0; i < numSlots; i++) {
        const slot = timeSlots[Math.floor(Math.random() * timeSlots.length)]
        const price = 35 + Math.floor(Math.random() * 30)
        insertSchedule.run(
          movieId,
          cinemaId,
          hallId,
          `${dateStr} ${slot.start}:00`,
          `${dateStr} ${slot.end}:00`,
          '普通话',
          '2D',
          price,
          1
        )
      }
    }
  }
}
console.log('场次数据插入完成')

console.log('开始插入用户数据...')
const hashedPassword = bcrypt.hashSync('123456', 10)
db.prepare('INSERT INTO users (phone, username, nickname, password) VALUES (?, ?, ?, ?)').run(
  '13800138000', 'test', '测试用户', hashedPassword
)
console.log('用户数据插入完成')

console.log('所有种子数据插入成功！')
db.close()
console.log('数据库连接已关闭')
