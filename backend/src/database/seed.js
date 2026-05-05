require('dotenv').config();
const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'train_ticket',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

const generateTicketNo = () => {
  return 'TK' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase();
};

const generateOrderNo = () => {
  return 'ORD' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase();
};

const seedData = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    console.log('Seeding stations...');
    const stations = [
      { code: 'BJP', name: '北京', city: '北京' },
      { code: 'SHH', name: '上海', city: '上海' },
      { code: 'GZG', name: '广州', city: '广州' },
      { code: 'SZQ', name: '深圳', city: '深圳' },
      { code: 'WHN', name: '武汉', city: '武汉' },
      { code: 'CDW', name: '成都', city: '成都' },
      { code: 'XA', name: '西安', city: '西安' },
      { code: 'ZZF', name: '郑州', city: '郑州' },
      { code: 'NJN', name: '南京', city: '南京' },
      { code: 'HZH', name: '杭州', city: '杭州' },
    ];

    const stationIds = {};
    for (const station of stations) {
      const result = await client.query(
        `INSERT INTO stations (station_code, station_name, city) 
         VALUES ($1, $2, $3) 
         ON CONFLICT (station_code) DO UPDATE SET station_name = $2, city = $3 
         RETURNING id`,
        [station.code, station.name, station.city]
      );
      stationIds[station.code] = result.rows[0].id;
    }

    console.log('Seeding trains...');
    const trains = [
      {
        number: 'G1',
        name: '复兴号',
        type: '高铁',
        from: '北京',
        to: '上海',
        depTime: '07:00:00',
        arrTime: '11:30:00',
        duration: 270,
        totalSeats: 200,
      },
      {
        number: 'G2',
        name: '和谐号',
        type: '高铁',
        from: '上海',
        to: '北京',
        depTime: '08:00:00',
        arrTime: '12:30:00',
        duration: 270,
        totalSeats: 200,
      },
      {
        number: 'G81',
        name: '京广高铁',
        type: '高铁',
        from: '北京',
        to: '广州',
        depTime: '09:00:00',
        arrTime: '17:00:00',
        duration: 480,
        totalSeats: 150,
      },
      {
        number: 'D954',
        name: '沪蓉动车',
        type: '动车',
        from: '上海',
        to: '成都',
        depTime: '10:00:00',
        arrTime: '22:30:00',
        duration: 750,
        totalSeats: 180,
      },
      {
        number: 'Z164',
        name: '京沪直达',
        type: '直达',
        from: '北京',
        to: '上海',
        depTime: '20:00:00',
        arrTime: '07:00:00',
        duration: 660,
        totalSeats: 300,
      },
      {
        number: 'K1156',
        name: '普快',
        type: '普快',
        from: '上海',
        to: '成都',
        depTime: '11:16:00',
        arrTime: '16:45:00',
        duration: 1769,
        totalSeats: 500,
      },
      {
        number: 'G65',
        name: '京西高铁',
        type: '高铁',
        from: '北京',
        to: '西安',
        depTime: '10:00:00',
        arrTime: '15:30:00',
        duration: 330,
        totalSeats: 200,
      },
      {
        number: 'G542',
        name: '广深高铁',
        type: '高铁',
        from: '广州',
        to: '深圳',
        depTime: '08:30:00',
        arrTime: '09:30:00',
        duration: 60,
        totalSeats: 250,
      },
    ];

    const trainIds = {};
    for (const train of trains) {
      const result = await client.query(
        `INSERT INTO trains (train_number, train_name, train_type, from_station, to_station, 
                              departure_time, arrival_time, duration_minutes, total_seats, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (train_number) DO UPDATE SET 
           train_name = $2, train_type = $3, from_station = $4, to_station = $5,
           departure_time = $6, arrival_time = $7, duration_minutes = $8, total_seats = $9
         RETURNING id`,
        [train.number, train.name, train.type, train.from, train.to, 
         train.depTime, train.arrTime, train.duration, train.totalSeats, true]
      );
      trainIds[train.number] = result.rows[0].id;
    }

    console.log('Seeding tickets and inventory...');
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const dates = [today, tomorrow];
    const seatTypes = ['硬座', '软座', '硬卧', '软卧', '一等座', '二等座'];

    for (const train of trains) {
      const trainId = trainIds[train.number];
      
      for (const date of dates) {
        const basePrice = train.type === '高铁' ? 500 : 
                          train.type === '动车' ? 300 : 
                          train.type === '直达' ? 200 : 100;

        for (const seatType of seatTypes.slice(0, train.type === '高铁' ? 2 : 4)) {
          const priceMultiplier = seatType.includes('硬') ? 1 : 
                                  seatType.includes('软') ? 1.5 :
                                  seatType.includes('一等') ? 2 : 1.2;
          const price = Math.round(basePrice * priceMultiplier);

          const totalCount = Math.floor(train.totalSeats / (train.type === '高铁' ? 2 : 4));
          const availableCount = totalCount - Math.floor(Math.random() * 10);

          const invResult = await client.query(
            `INSERT INTO inventory (train_id, from_station, to_station, seat_type, travel_date, 
                                    total_count, available_count, locked_count, sold_count, version)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
             ON CONFLICT (train_id, from_station, to_station, seat_type, travel_date) 
             DO UPDATE SET total_count = $6, available_count = $7, version = EXCLUDED.version + 1
             RETURNING id`,
            [trainId, train.from, train.to, seatType, date, 
             totalCount, availableCount, 0, totalCount - availableCount, 1]
          );

          for (let i = 1; i <= availableCount; i++) {
            const carriageNum = Math.floor(i / 20) + 1;
            const seatNum = (i % 20) || 20;
            
            await client.query(
              `INSERT INTO tickets (ticket_no, train_id, from_station, to_station, 
                                    seat_type, seat_number, carriage_number, price, status, travel_date)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
               ON CONFLICT (ticket_no) DO NOTHING`,
              [
                generateTicketNo(),
                trainId,
                train.from,
                train.to,
                seatType,
                `${seatNum}${['A', 'B', 'C', 'D', 'F'][i % 5]}`,
                `${carriageNum}车厢`,
                price,
                'available',
                date
              ]
            );
          }
        }
      }
    }

    await client.query('COMMIT');
    console.log('Seed data completed successfully!');
    console.log(`  - ${trains.length} 个车次`);
    console.log(`  - ${stations.length} 个车站`);
    console.log(`  - 覆盖日期: ${dates.join(', ')}`);

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Seeding failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
};

seedData();
