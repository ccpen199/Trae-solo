const express = require('express');
const { db } = require('../models/db');
const { authMiddleware } = require('./auth');

const router = express.Router();

function parseVoiceQuery(text) {
  const result = {
    keyword: '',
    industry: null,
    location: null,
    arrival_time: null
  };

  const industryMap = {
    '奶茶': '餐饮', '咖啡': '餐饮', '餐饮': '餐饮', '餐厅': '餐饮', '饭店': '餐饮', '火锅': '餐饮',
    '快递': '物流', '物流': '物流', '分拣': '物流', '配送': '物流', '外卖': '物流',
    '便利店': '零售', '超市': '零售', '零售': '零售', '店员': null, '营业员': null
  };

  const timeMap = {
    '今天': '当日', '今日': '当日', '马上': '当日', '立即': '当日', '当日': '当日',
    '3天': '3日内', '三天': '3日内', '3日内': '3日内',
    '一周': '一周内', '一星期': '一周内', '一周内': '一周内'
  };

  for (const [key, val] of Object.entries(industryMap)) {
    if (text.includes(key)) {
      result.keyword = key;
      if (val) result.industry = val;
      break;
    }
  }

  for (const [key, val] of Object.entries(timeMap)) {
    if (text.includes(key)) {
      result.arrival_time = val;
      break;
    }
  }

  const locationMatch = text.match(/附近|周边|离家|离家近/);
  if (locationMatch) {
    result.location = '附近';
  }

  if (!result.keyword) {
    result.keyword = text.replace(/找|招|求职|工作|附近|今天|马上|立即|3天|三天|一周|一星期/gi, '').trim();
  }

  return result;
}

router.post('/search', authMiddleware, (req, res) => {
  const { voice_text } = req.body;
  if (!voice_text) {
    return res.status(400).json({ error: '请提供语音文本' });
  }

  const parsed = parseVoiceQuery(voice_text);

  let sql = `
    SELECT j.*, c.name as company_name, c.turnover_rate, c.social_insurance_rate, c.credit_score
    FROM jobs j
    LEFT JOIN companies c ON j.company_id = c.id
    WHERE j.status = 'active'
  `;
  const params = [];

  if (parsed.keyword) {
    sql += ' AND (j.title LIKE ? OR j.requirements LIKE ? OR c.name LIKE ?)';
    params.push(`%${parsed.keyword}%`, `%${parsed.keyword}%`, `%${parsed.keyword}%`);
  }
  if (parsed.industry) {
    sql += ' AND j.industry = ?';
    params.push(parsed.industry);
  }
  if (parsed.arrival_time) {
    sql += ' AND j.arrival_time = ?';
    params.push(parsed.arrival_time);
  }

  sql += ' ORDER BY j.created_at DESC LIMIT 20';

  const jobs = db.prepare(sql).all(...params);

  db.prepare(`
    INSERT INTO voice_searches (seeker_id, voice_text, result_count)
    VALUES (?, ?, ?)
  `).run(req.user.seeker_id || null, voice_text, jobs.length);

  res.json({
    jobs,
    parsed_query: parsed,
    original_text: voice_text
  });
});

router.post('/ar/navigate', authMiddleware, (req, res) => {
  if (req.user.role !== 'seeker') {
    return res.status(403).json({ error: '无权限' });
  }

  const { job_id, start_point } = req.body;
  if (!job_id) {
    return res.status(400).json({ error: '请选择职位' });
  }

  const job = db.prepare('SELECT work_address, work_lng, work_lat FROM jobs WHERE id = ?').get(job_id);
  if (!job) {
    return res.status(404).json({ error: '职位不存在' });
  }

  const duration = Math.floor(Math.random() * 30) + 10;

  db.prepare(`
    INSERT INTO ar_navigations (seeker_id, job_id, start_point, end_point, duration)
    VALUES (?, ?, ?, ?, ?)
  `).run(req.user.seeker_id, job_id, start_point || '当前位置', job.work_address, duration);

  res.json({
    job_id,
    start_point: start_point || '当前位置',
    end_point: job.work_address,
    end_lng: job.work_lng,
    end_lat: job.work_lat,
    duration,
    route: [
      { step: 1, instruction: '向东直行50米', distance: 50 },
      { step: 2, instruction: '左转进入XX路', distance: 200 },
      { step: 3, instruction: '右转进入XX街', distance: 150 },
      { step: 4, instruction: '到达目的地，位于您的右侧', distance: 0 }
    ],
    ar_anchors: [
      { type: 'sign', content: '前方50米路口左转', distance: 50 },
      { type: 'landmark', content: '经过XX银行后右转', distance: 180 },
      { type: 'destination', content: '到达面试地点', distance: 0 }
    ]
  });
});

module.exports = router;
