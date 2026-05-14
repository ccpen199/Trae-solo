const express = require('express');
const router = express.Router();
const { query, get, run } = require('./database');

router.get('/cities', async (req, res) => {
  try {
    const { keyword, type } = req.query;
    let sql = 'SELECT * FROM cities WHERE 1=1';

    if (type) {
      sql += ` AND type = '${type}'`;
    }

    if (keyword) {
      const kw = keyword.toLowerCase();
      sql += ` AND (name LIKE '%${keyword}%' OR pinyin LIKE '%${kw}%' OR pinyin_first LIKE '%${kw}%')`;
    }

    const cities = query(sql);
    res.json({ success: true, data: cities });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/hot-cities', async (req, res) => {
  try {
    const { type } = req.query;
    let sql = 'SELECT * FROM cities WHERE has_airport = 1';

    if (type) {
      sql += ` AND type = '${type}'`;
    }

    sql += ' ORDER BY id LIMIT 10';
    const cities = query(sql);
    res.json({ success: true, data: cities });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/flights', async (req, res) => {
  try {
    const { from, to, date, type, returnDate, dateStart, dateEnd } = req.query;
    let sql = 'SELECT * FROM flights WHERE 1=1';

    if (from) {
      sql += ` AND from_city = '${from}'`;
    }
    if (to) {
      sql += ` AND to_city = '${to}'`;
    }
    if (dateStart && dateEnd) {
      sql += ` AND date BETWEEN '${dateStart}' AND '${dateEnd}'`;
    } else if (date) {
      sql += ` AND date = '${date}'`;
    }
    if (type) {
      sql += ` AND type = '${type}'`;
    }
    sql += ` ORDER BY date ASC, price ASC`;

    const flights = query(sql);

    if (returnDate && returnDate !== date) {
      const returnSql = `SELECT * FROM flights WHERE from_city = '${to}' AND to_city = '${from}' AND date = '${returnDate}'`;
      const returnFlights = query(returnSql);
      res.json({ success: true, data: { outbound: flights, inbound: returnFlights } });
    } else {
      res.json({ success: true, data: { outbound: flights, inbound: [] } });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/multi-flights', async (req, res) => {
  try {
    const { segments } = req.query;
    if (!segments) {
      return res.status(400).json({ success: false, message: '缺少航程段信息' });
    }

    const segmentsArr = JSON.parse(segments);
    const results = [];

    for (const segment of segmentsArr) {
      const { from, to, date } = segment;
      const sql = `SELECT * FROM flights WHERE from_city = '${from}' AND to_city = '${to}' AND date = '${date}'`;
      const flights = query(sql);
      results.push({ from, to, date, flights });
    }

    res.json({ success: true, data: results });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/price-trend', async (req, res) => {
  try {
    const { from, to, startDate, endDate } = req.query;
    if (!from || !to || !startDate || !endDate) {
      return res.status(400).json({ success: false, message: '参数不完整' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const trend = [];

    while (start <= end) {
      const dateStr = start.toISOString().split('T')[0];
      const sql = `SELECT AVG(price) as avg_price, MIN(price) as min_price, MAX(price) as max_price FROM flights WHERE from_city = '${from}' AND to_city = '${to}' AND date = '${dateStr}'`;
      const result = get(sql);

      trend.push({
        date: dateStr,
        avgPrice: result && result.avg_price ? Math.round(result.avg_price) : null,
        minPrice: result && result.min_price || null,
        maxPrice: result && result.max_price || null
      });

      start.setDate(start.getDate() + 1);
    }

    res.json({ success: true, data: trend });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/orders', async (req, res) => {
  try {
    const { orderNo } = req.query;
    let sql = 'SELECT * FROM orders';

    if (orderNo) {
      sql += ` WHERE order_no LIKE '%${orderNo}%'`;
    }

    const orders = query(sql);
    res.json({ success: true, data: orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/regions', async (req, res) => {
  try {
    const regions = [
      { name: '港澳台', countries: ['中国'] },
      { name: '东亚', countries: ['日本', '韩国'] },
      { name: '东南亚', countries: ['泰国', '新加坡', '马来西亚', '越南'] },
      { name: '欧洲', countries: ['英国', '法国', '德国', '意大利'] },
      { name: '北美', countries: ['美国', '加拿大'] },
      { name: '大洋洲', countries: ['澳大利亚', '新西兰'] },
      { name: '中东', countries: ['阿联酋', '沙特阿拉伯'] }
    ];
    res.json({ success: true, data: regions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/order', async (req, res) => {
  try {
    const { flightInfo, passengerName } = req.body;
    const orderNo = 'QF' + Date.now().toString().slice(-10);
    const createTime = new Date().toISOString();
    const flightInfoStr = JSON.stringify(flightInfo);

    const sql = `INSERT INTO orders (order_no, status, passenger_name, flight_info, create_time) 
                 VALUES ('${orderNo}', 'pending', '${passengerName}', '${flightInfoStr}', '${createTime}')`;
    run(sql);

    res.json({ success: true, data: { orderNo, status: 'pending' } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;