const express = require('express');
const moment = require('moment');
const { all, get, run } = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);

const SLA_METRICS = [
  { key: 'response', name: '岗位响应', defaultHours: 24 },
  { key: 'first_recommend', name: '首批推荐', defaultHours: 72 },
  { key: 'interview_arrange', name: '面试安排', defaultHours: 48 },
  { key: 'offer_follow', name: 'Offer跟进', defaultHours: 24 }
];

router.get('/metrics', async (req, res) => {
  try {
    const { project_id } = req.query;
    let sql = 'SELECT * FROM sla_configs';
    let params = [];
    
    if (project_id) {
      sql += ' WHERE project_id = ?';
      params.push(project_id);
    }
    
    const configs = await all(sql, params);
    res.json(configs);
  } catch (error) {
    console.error('获取SLA配置错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

router.get('/warnings', async (req, res) => {
  try {
    const now = moment();
    
    const records = await all(`
      SELECT sr.*, 
             ca.candidate_id, ca.position_id,
             c.name as candidate_name,
             p.title as position_title,
             pr.name as project_name
      FROM sla_records sr
      LEFT JOIN candidate_applications ca ON sr.application_id = ca.id
      LEFT JOIN candidates c ON ca.candidate_id = c.id
      LEFT JOIN positions p ON ca.position_id = p.id
      LEFT JOIN projects pr ON p.project_id = pr.id
      WHERE sr.status = 'pending'
      ORDER BY sr.start_time ASC
    `);
    
    const warnings = records.map(record => {
      const startTime = moment(record.start_time);
      const elapsedHours = now.diff(startTime, 'hours');
      const remainingHours = record.target_hours - elapsedHours;
      const warningLevel = remainingHours <= 0 ? 'critical' : 
                           remainingHours <= record.target_hours * 0.25 ? 'warning' : 'normal';
      
      return {
        ...record,
        elapsed_hours: elapsedHours,
        remaining_hours: remainingHours,
        warning_level: warningLevel
      };
    });
    
    res.json(warnings.filter(w => w.warning_level !== 'normal'));
  } catch (error) {
    console.error('获取SLA预警错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

router.get('/records', async (req, res) => {
  try {
    const { application_id } = req.query;
    let sql = `
      SELECT sr.*, 
             c.name as candidate_name,
             p.title as position_title
      FROM sla_records sr
      LEFT JOIN candidate_applications ca ON sr.application_id = ca.id
      LEFT JOIN candidates c ON ca.candidate_id = c.id
      LEFT JOIN positions p ON ca.position_id = p.id
    `;
    let params = [];
    
    if (application_id) {
      sql += ' WHERE sr.application_id = ?';
      params.push(application_id);
    }
    
    sql += ' ORDER BY sr.created_at DESC';
    
    const records = await all(sql, params);
    res.json(records);
  } catch (error) {
    console.error('获取SLA记录错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

router.post('/configs', async (req, res) => {
  try {
    const { project_id, position_id, metric_type, metric_name, target_hours, description } = req.body;
    
    const result = await run(
      `INSERT INTO sla_configs (project_id, position_id, metric_type, metric_name, target_hours, description) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [project_id, position_id, metric_type, metric_name, target_hours, description]
    );

    const config = await get('SELECT * FROM sla_configs WHERE id = ?', [result.lastID]);
    res.status(201).json(config);
  } catch (error) {
    console.error('创建SLA配置错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

router.patch('/records/:id/delay', async (req, res) => {
  try {
    const { delay_reason } = req.body;
    
    await run(
      `UPDATE sla_records SET delay_reason = ? WHERE id = ?`,
      [delay_reason, req.params.id]
    );

    const record = await get('SELECT * FROM sla_records WHERE id = ?', [req.params.id]);
    res.json(record);
  } catch (error) {
    console.error('更新延期原因错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

module.exports = router;
