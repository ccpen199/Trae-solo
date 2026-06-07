import { Router } from 'express';
import db from '../db.js';

const router = Router();

function parsePickupCode(smsContent) {
  const patterns = [
    /(取件码|提货码|验证码)[:：]?\s*([A-Za-z0-9\-]{3,12})/i,
    /码[：:]?\s*([A-Za-z0-9\-]{3,12})/i,
    /单号[：:]?\s*(\d{10,15})/i,
    /快递公司[：:]?\s*([\u4e00-\u9fa5]+)/i
  ];

  let code = null;
  let stationName = null;
  let company = null;

  patterns.forEach(pattern => {
    const match = smsContent.match(pattern);
    if (match) {
      if (pattern.source.includes('码') && !pattern.source.includes('快递')) {
        code = match[1] || match[2];
      }
      if (pattern.source.includes('公司')) {
        company = match[1];
      }
    }
  });

  const stationPatterns = [
    /(菜鸟驿站|驿站|快递柜|自提点|代收点)/,
    /@([^\s@]+)/
  ];

  stationPatterns.forEach(pattern => {
    const match = smsContent.match(pattern);
    if (match) {
      stationName = match[1] || match[0];
    }
  });

  return {
    code: code || '未识别到取件码',
    station_name: stationName || '未知站点',
    company: company || '未知快递公司',
    raw_sms: smsContent
  };
}

router.post('/parse', (req, res) => {
  try {
    const { sms_content } = req.body;

    if (!sms_content) {
      return res.status(400).json({ error: '短信内容不能为空' });
    }

    const parsed = parsePickupCode(sms_content);

    const stmt = db.prepare(`
      INSERT INTO pickup_code (phone, code, station_name, expire_time)
      VALUES (?, ?, ?, ?)
    `);
    const result = stmt.run(
      '',
      parsed.code,
      parsed.station_name,
      new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
    );

    res.json({
      id: result.lastInsertRowid,
      ...parsed,
      created_at: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/phone/:phone', (req, res) => {
  try {
    const { phone } = req.params;

    const codes = db.prepare(`
      SELECT * FROM pickup_code
      WHERE phone = ?
      ORDER BY created_at DESC
    `).all(phone);

    res.json(codes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/bind', (req, res) => {
  try {
    const { phone, code_id, order_id } = req.body;

    if (!phone || !code_id) {
      return res.status(400).json({ error: '手机号和取件码ID不能为空' });
    }

    const stmt = db.prepare('UPDATE pickup_code SET phone = ?, order_id = ? WHERE id = ?');
    stmt.run(phone, order_id || null, code_id);

    const code = db.prepare('SELECT * FROM pickup_code WHERE id = ?').get(code_id);
    res.json(code);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
