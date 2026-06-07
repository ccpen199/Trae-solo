const db = require('../config/database')
const bcrypt = require('bcryptjs')

const hashedPassword = bcrypt.hashSync('123456', 10)

db.prepare(`INSERT OR IGNORE INTO users (username, password, nickname, phone, role) VALUES (?, ?, ?, ?, ?)`).run('admin', hashedPassword, '系统管理员', '13800138000', 'admin')
db.prepare(`INSERT OR IGNORE INTO users (username, password, nickname, phone, role) VALUES (?, ?, ?, ?, ?)`).run('operator', hashedPassword, '影城运营员', '13800138001', 'operator')
db.prepare(`INSERT OR IGNORE INTO users (username, password, nickname, phone, role) VALUES (?, ?, ?, ?, ?)`).run('user1', hashedPassword, '测试用户', '13800138002', 'user')

const cinemas = [
  { name: '万达影城（北京CBD店）', address: '北京市朝阳区建国路88号SOHO现代城', city: '北京', province: '北京市', latitude: 39.9087, longitude: 116.4605, hall_count: 8, equipment_types: 'IMAX,DOLBY,3D' },
  { name: 'CGV影城（上海五角场店）', address: '上海市杨浦区淞沪路77号万达广场', city: '上海', province: '上海市', latitude: 31.2987, longitude: 121.5012, hall_count: 10, equipment_types: 'IMAX,4DX,DOLBY' },
  { name: '金逸影城（广州天河店）', address: '广州市天河区天河路208号天河城', city: '广州', province: '广东省', latitude: 23.1200, longitude: 113.3267, hall_count: 6, equipment_types: 'IMAX,3D' },
  { name: '百老汇影城（深圳万象城店）', address: '深圳市罗湖区宝安南路1881号万象城', city: '深圳', province: '广东省', latitude: 22.5410, longitude: 114.1050, hall_count: 7, equipment_types: 'IMAX,DOLBY' },
  { name: '博纳国际影城（杭州西溪店）', address: '杭州市西湖区西溪路588号西溪天街', city: '杭州', province: '浙江省', latitude: 30.2741, longitude: 120.1551, hall_count: 9, equipment_types: 'IMAX,4DX,3D' },
]

cinemas.forEach(c => {
  const result = db.prepare(`INSERT OR IGNORE INTO cinemas (name, address, city, province, latitude, longitude, hall_count, equipment_types) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(c.name, c.address, c.city, c.province, c.latitude, c.longitude, c.hall_count, c.equipment_types)
  const cinemaId = result.lastInsertRowid || db.prepare('SELECT id FROM cinemas WHERE name = ?').get(c.name).id
  
  for (let i = 1; i <= c.hall_count; i++) {
    const equipment = i === 1 ? 'IMAX' : (i === 2 ? 'DOLBY' : 'Standard')
    db.prepare(`INSERT OR IGNORE INTO halls (cinema_id, name, seat_rows, seat_cols, equipment_type) VALUES (?, ?, ?, ?, ?)`).run(cinemaId, `${i}号厅`, 10, 15, equipment)
  }
})

const movies = [
  { title: '流浪地球3', original_title: 'The Wandering Earth III', poster: 'poster-1', description: '太阳即将毁灭，人类在地球表面建造出巨大的推进器，寻找新的家园。', duration: 173, release_date: '2025-01-28', country: '中国', language: '普通话', versions: '2D,3D,IMAX', rating: 9.5, trailer_url: '' },
  { title: '复仇者联盟：终局之战', original_title: 'Avengers: Endgame', poster: 'poster-2', description: '漫威宇宙的终极对决，复仇者们将作出终极牺牲。', duration: 181, release_date: '2025-04-24', country: '美国', language: '英语', versions: '2D,3D,IMAX', rating: 9.2, trailer_url: '' },
  { title: '封神第三部', original_title: 'Feng Shen Part III', poster: 'poster-3', description: '武王伐纣的终极决战，封神榜的最终命运将何去何从。', duration: 148, release_date: '2025-02-01', country: '中国', language: '普通话', versions: '2D,IMAX', rating: 8.9, trailer_url: '' },
  { title: '星际穿越2', original_title: 'Interstellar II', poster: 'poster-4', description: '库珀博士再次踏上星际之旅，寻找人类新的希望。', duration: 169, release_date: '2025-07-15', country: '美国', language: '英语', versions: '2D,3D,IMAX', rating: 9.3, trailer_url: '' },
  { title: '唐人街探案4', original_title: 'Detective Chinatown 4', poster: 'poster-5', description: '唐仁和秦风再次联手，在新的城市展开爆笑探案。', duration: 136, release_date: '2025-01-25', country: '中国', language: '普通话', versions: '2D,3D', rating: 8.5, trailer_url: '' },
]

movies.forEach(m => {
  db.prepare(`INSERT OR IGNORE INTO movies (title, original_title, poster, description, duration, release_date, country, language, versions, rating, trailer_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(m.title, m.original_title, m.poster, m.description, m.duration, m.release_date, m.country, m.language, m.versions, m.rating, m.trailer_url)
})

const allCinemas = db.prepare('SELECT * FROM cinemas').all()
const allMovies = db.prepare('SELECT * FROM movies').all()
const allHalls = db.prepare('SELECT * FROM halls').all()

allCinemas.forEach(cinema => {
  const cinemaHalls = allHalls.filter(h => h.cinema_id === cinema.id)
  allMovies.forEach(movie => {
    cinemaHalls.slice(0, 3).forEach((hall, idx) => {
      const date = new Date()
      date.setDate(date.getDate() + idx)
      const hours = [10, 14, 18, 20]
      
      hours.forEach((hour, hIdx) => {
        const start_time = new Date(date)
        start_time.setHours(hour, 0, 0, 0)
        const end_time = new Date(start_time.getTime() + movie.duration * 60000)
        const price = 35 + hIdx * 5 + Math.floor(Math.random() * 20)
        
        db.prepare(`INSERT OR IGNORE INTO movie_sessions (movie_id, cinema_id, hall_id, start_time, end_time, version, language, base_price) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(
          movie.id, cinema.id, hall.id, start_time.toISOString(), end_time.toISOString(), '2D', movie.language, price
        )
      })
    })
  })
})

const coupons = [
  { name: '新用户立减券', type: 'fixed', value: 10, min_amount: 30, total_count: 1000 },
  { name: '早鸟票优惠', type: 'fixed', value: 15, min_amount: 50, total_count: 500 },
  { name: '情侣套票券', type: 'fixed', value: 20, min_amount: 80, total_count: 300 },
  { name: '会员专属券', type: 'percent', value: 10, min_amount: 50, total_count: 200 },
]

coupons.forEach(c => {
  db.prepare(`INSERT OR IGNORE INTO coupons (name, type, value, min_amount, total_count) VALUES (?, ?, ?, ?, ?)`).run(c.name, c.type, c.value, c.min_amount, c.total_count)
})

const packages = [
  { name: '白银会员包', description: '白银等级会员权益包，赠送积分和优惠券', price: 29.9, points_bonus: 200, coupons: '[1,2]', valid_days: 30 },
  { name: '黄金会员包', description: '黄金等级会员权益包，更多积分和专属权益', price: 59.9, points_bonus: 500, coupons: '[1,2,3]', valid_days: 90 },
  { name: '钻石会员包', description: '钻石等级会员权益包，尊享全部特权', price: 99.9, points_bonus: 1000, coupons: '[1,2,3,4]', valid_days: 180 },
]

packages.forEach(p => {
  db.prepare(`INSERT OR IGNORE INTO benefit_packages (name, description, price, points_bonus, coupons, valid_days) VALUES (?, ?, ?, ?, ?, ?)`).run(p.name, p.description, p.price, p.points_bonus, p.coupons, p.valid_days)
})

console.log('Seed data inserted successfully')
db.close()
