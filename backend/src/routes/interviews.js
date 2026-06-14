const express = require('express');
const { db } = require('../models/db');
const { authMiddleware } = require('./auth');

const router = express.Router();

function extractKeyPromises(summary) {
  const keywords = ['薪资', '工资', '底薪', '提成', '奖金', '五险一金', '社保', '住宿', '包吃', '包住', '加班', '加班费', '休息', '休假', '年假', '试用期', '转正', '培训'];
  const promises = [];
  for (const kw of keywords) {
    const regex = new RegExp(`[^。！？；]*${kw}[^。！？；]*[。！？；]`, 'g');
    const matches = summary.match(regex);
    if (matches) {
      promises.push(...matches);
    }
  }
  return [...new Set(promises)];
}

router.post('/', authMiddleware, (req, res) => {
  if (req.user.role !== 'company') {
    return res.status(403).json({ error: '无权限' });
  }

  const { application_id, interview_time, call_summary } = req.body;

  if (!application_id || !interview_time) {
    return res.status(400).json({ error: '请填写完整信息' });
  }

  const keyPromises = call_summary ? extractKeyPromises(call_summary) : [];

  try {
    const result = db.prepare(`
      INSERT INTO interviews (application_id, interview_time, call_summary, key_promises)
      VALUES (?, ?, ?, ?)
    `).run(application_id, interview_time, call_summary || '', JSON.stringify(keyPromises));

    db.prepare('UPDATE applications SET status = ? WHERE id = ?').run('interview', application_id);

    res.json({
      id: result.lastInsertRowid,
      key_promises: keyPromises
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', authMiddleware, (req, res) => {
  const interview = db.prepare(`
    SELECT i.*, a.job_id, a.seeker_id,
           j.title, j.work_address,
           js.name as seeker_name, js.phone,
           c.name as company_name
    FROM interviews i
    LEFT JOIN applications a ON i.application_id = a.id
    LEFT JOIN jobs j ON a.job_id = j.id
    LEFT JOIN job_seekers js ON a.seeker_id = js.id
    LEFT JOIN companies c ON j.company_id = c.id
    WHERE i.id = ?
  `).get(req.params.id);

  if (!interview) {
    return res.status(404).json({ error: '面试邀约不存在' });
  }

  try {
    interview.key_promises = JSON.parse(interview.key_promises || '[]');
  } catch (e) {
    interview.key_promises = [];
  }

  res.json(interview);
});

router.put('/:id/confirm', authMiddleware, (req, res) => {
  const { role } = req.user;
  const { confirmed } = req.body;

  if (role === 'company') {
    db.prepare('UPDATE interviews SET confirmed_by_company = ? WHERE id = ?')
      .run(confirmed ? 1 : 0, req.params.id);
  } else if (role === 'seeker') {
    db.prepare('UPDATE interviews SET confirmed_by_seeker = ? WHERE id = ?')
      .run(confirmed ? 1 : 0, req.params.id);
  } else {
    return res.status(403).json({ error: '无权限' });
  }

  res.json({ status: 'success' });
});

router.get('/company/my', authMiddleware, (req, res) => {
  if (req.user.role !== 'company') {
    return res.status(403).json({ error: '无权限' });
  }

  const interviews = db.prepare(`
    SELECT i.*, j.title, js.name as seeker_name, js.phone
    FROM interviews i
    LEFT JOIN applications a ON i.application_id = a.id
    LEFT JOIN jobs j ON a.job_id = j.id
    LEFT JOIN job_seekers js ON a.seeker_id = js.id
    WHERE j.company_id = ?
    ORDER BY i.interview_time DESC
  `).all(req.user.company_id);

  res.json(interviews);
});

router.get('/seeker/my', authMiddleware, (req, res) => {
  if (req.user.role !== 'seeker') {
    return res.status(403).json({ error: '无权限' });
  }

  const interviews = db.prepare(`
    SELECT i.*, j.title, j.work_address, c.name as company_name,
           c.turnover_rate, c.social_insurance_rate
    FROM interviews i
    LEFT JOIN applications a ON i.application_id = a.id
    LEFT JOIN jobs j ON a.job_id = j.id
    LEFT JOIN companies c ON j.company_id = c.id
    WHERE a.seeker_id = ?
    ORDER BY i.interview_time DESC
  `).all(req.user.seeker_id);

  for (const iv of interviews) {
    try {
      iv.key_promises = JSON.parse(iv.key_promises || '[]');
    } catch (e) {
      iv.key_promises = [];
    }
  }

  res.json(interviews);
});

module.exports = router;
