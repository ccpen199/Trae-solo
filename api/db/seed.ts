import crypto from 'crypto'
import type Database from 'better-sqlite3'

function hashPassword(pwd: string) {
  return crypto.createHash('sha256').update(pwd).digest('hex')
}

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

function blockchainHash(data: string) {
  return crypto.createHash('sha256').update(data + Date.now() + 'TICKET_SECRET').digest('hex')
}

export default function seed(db: Database.Database) {
  const userCount = db.prepare('SELECT COUNT(*) as cnt FROM users').get() as { cnt: number }
  if (userCount.cnt > 0) {
    console.log('Seed data already exists, skipping...')
    return
  }

  const insertUser = db.prepare(
    'INSERT INTO users (phone, password_hash, real_name, id_card, role, credit_score) VALUES (?, ?, ?, ?, ?, ?)'
  )
  const insertOrganizer = db.prepare(
    'INSERT INTO organizers (user_id, company_name, license, contact_name, contact_phone, status) VALUES (?, ?, ?, ?, ?, ?)'
  )
  const insertEvent = db.prepare(
    'INSERT INTO events (organizer_id, title, category, description, venue, poster, status) VALUES (?, ?, ?, ?, ?, ?, ?)'
  )
  const insertShowtime = db.prepare(
    'INSERT INTO showtimes (event_id, start_time, sale_start_time, presale_start_time, total_seats, available_seats, status) VALUES (?, ?, ?, ?, ?, ?, ?)'
  )
  const insertZone = db.prepare(
    'INSERT INTO zones (showtime_id, name, color, rows, cols, seat_layout, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)'
  )
  const insertPricingTier = db.prepare(
    'INSERT INTO pricing_tiers (showtime_id, name, tier_type, price, valid_from, valid_to, quota, sold) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  )
  const insertSeat = db.prepare(
    'INSERT INTO seats (zone_id, row_num, col_num, seat_label, status, pricing_tier_id, showtime_id) VALUES (?, ?, ?, ?, ?, ?, ?)'
  )
  const insertOrder = db.prepare(
    'INSERT INTO orders (user_id, order_no, total_amount, payment_method, payment_status) VALUES (?, ?, ?, ?, ?)'
  )
  const insertTicket = db.prepare(
    'INSERT INTO tickets (order_id, seat_id, showtime_id, user_id, pricing_tier_id, anti_fake_code, blockchain_hash, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  )

  const now = new Date()
  const future = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  const past = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const presale = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
  const saleStart = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000)

  const adminResult = insertUser.run('admin', hashPassword('123456'), '系统管理员', '110101199001010001', 'admin', 800)
  const orgResult = insertUser.run('organizer', hashPassword('123456'), '主办方管理员', '110101199001010002', 'organizer', 700)
  const user1Result = insertUser.run('user1', hashPassword('123456'), '张三', '110101199001010003', 'user', 650)
  insertUser.run('user2', hashPassword('123456'), '李四', '110101199001010004', 'user', 580)

  const organizerResult = insertOrganizer.run(orgResult.lastInsertRowid, '星耀文化传播有限公司', '91110000MA00ABCD12', '王经理', '13800138000', 'approved')

  const eventsData = [
    { title: '2026周杰伦「嘉年华」世界巡回演唱会北京站', category: 'concert', desc: '华语乐坛天王周杰伦2026年度巡回演唱会北京站，带你重温经典，见证青春！', venue: '国家体育场（鸟巢）' },
    { title: '孟京辉话剧「恋爱的犀牛」20周年纪念版', category: 'drama', desc: '中国当代戏剧经典之作，20周年纪念版全新呈现。', venue: '国家大剧院戏剧场' },
    { title: '李诞脱口秀「笑场」2026特别专场', category: 'talkshow', desc: '李诞携手众脱口秀演员，带来一场笑声盛宴！', venue: '北展剧场' },
  ]

  const zoneColors = ['#D4AF37', '#8B1A2B', '#1E88E5', '#43A047']
  const zoneNames = ['VIP区', 'A区', 'B区', 'C区']
  const tierTypes = [
    { name: '早鸟票', type: 'early_bird', price: 280, quota: 100 },
    { name: '预售票', type: 'presale', price: 580, quota: 200 },
    { name: '全价票', type: 'full', price: 880, quota: 500 },
    { name: 'VIP票', type: 'vip', price: 1680, quota: 80 },
  ]

  eventsData.forEach((eventData, eventIdx) => {
    const eventResult = insertEvent.run(
      Number(organizerResult.lastInsertRowid),
      eventData.title,
      eventData.category,
      eventData.desc,
      eventData.venue,
      '',
      'published'
    )
    const eventId = Number(eventResult.lastInsertRowid)

    for (let s = 0; s < 3; s++) {
      const showDate = new Date(future.getTime() + s * 24 * 60 * 60 * 1000)
      const status = s === 0 ? 'on_sale' : s === 1 ? 'presale' : 'upcoming'
      const showResult = insertShowtime.run(
        eventId,
        showDate.toISOString().slice(0, 19).replace('T', ' '),
        saleStart.toISOString().slice(0, 19).replace('T', ' '),
        presale.toISOString().slice(0, 19).replace('T', ' '),
        0,
        0,
        status
      )
      const showtimeId = Number(showResult.lastInsertRowid)

      let totalSeats = 0
      tierTypes.forEach((tier, tIdx) => {
        insertPricingTier.run(
          showtimeId,
          tier.name,
          tier.type,
          tier.price * (1 + eventIdx * 0.5),
          tIdx === 0 ? past.toISOString().slice(0, 19).replace('T', ' ') : null,
          tIdx === 0 ? now.toISOString().slice(0, 19).replace('T', ' ') : null,
          tier.quota,
          Math.floor(tier.quota * 0.3)
        )
      })

      for (let z = 0; z < 4; z++) {
        const rows = 5 - z
        const cols = 8
        const zoneResult = insertZone.run(
          showtimeId,
          zoneNames[z],
          zoneColors[z],
          rows,
          cols,
          'normal',
          z
        )
        const zoneId = Number(zoneResult.lastInsertRowid)

        for (let r = 1; r <= rows; r++) {
          for (let c = 1; c <= cols; c++) {
            const label = `${String.fromCharCode(64 + r)}${c}`
            const sold = Math.random() < 0.3
            insertSeat.run(
              zoneId,
              r,
              c,
              label,
              sold ? 'sold' : 'available',
              4 - z,
              showtimeId
            )
            totalSeats++
          }
        }
      }

      db.prepare('UPDATE showtimes SET total_seats = ?, available_seats = ? WHERE id = ?').run(
        totalSeats,
        Math.floor(totalSeats * 0.7),
        showtimeId
      )
    }

    if (eventIdx === 0) {
      const showtime = db.prepare('SELECT * FROM showtimes WHERE event_id = ? LIMIT 1').get(eventId) as any
      const seats = db.prepare('SELECT * FROM seats WHERE showtime_id = ? AND status = ? LIMIT 2').all(showtime.id, 'available') as any[]

      if (seats.length >= 2) {
        const orderNo = 'TK' + Date.now()
        const orderResult = insertOrder.run(
          Number(user1Result.lastInsertRowid),
          orderNo,
          1760,
          'direct',
          'paid'
        )
        const orderId = Number(orderResult.lastInsertRowid)

        seats.forEach((seat: any) => {
          const afCode = generateUUID()
          insertTicket.run(
            orderId,
            seat.id,
            showtime.id,
            Number(user1Result.lastInsertRowid),
            seat.pricing_tier_id,
            afCode,
            blockchainHash(afCode),
            'valid'
          )
          db.prepare('UPDATE seats SET status = ? WHERE id = ?').run('sold', seat.id)
        })
      }
    }
  })

  console.log('Seed data inserted successfully!')
}
