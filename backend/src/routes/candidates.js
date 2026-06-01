const express = require('express');
const moment = require('moment');
const { all, get, run } = require('../database');
const { authenticateToken, requireRoles } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);

const STAGES = [
  { key: 'screening', name: '简历筛选', order: 1 },
  { key: 'phone_interview', name: '电话沟通', order: 2 },
  { key: 'client_recommend', name: '推荐客户', order: 3 },
  { key: 'interview', name: '面试', order: 4 },
  { key: 'offer', name: 'Offer', order: 5 },
  { key: 'onboard', name: '入职', order: 6 },
  { key: 'eliminated', name: '淘汰', order: 7 }
];

router.get('/', async (req, res) => {
  try {
    const candidates = await all('SELECT * FROM candidates ORDER BY created_at DESC');
    res.json(candidates);
  } catch (error) {
    console.error('获取候选人列表错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const candidate = await get('SELECT * FROM candidates WHERE id = ?', [req.params.id]);
    if (!candidate) {
      return res.status(404).json({ error: '候选人不存在' });
    }
    res.json(candidate);
  } catch (error) {
    console.error('获取候选人详情错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

router.post('/', requireRoles('admin', 'manager', 'consultant'), async (req, res) => {
  try {
    const { name, phone, email, gender, age, education, work_experience, current_company, current_position, expected_salary, tags, source } = req.body;
    
    const result = await run(
      `INSERT INTO candidates (name, phone, email, gender, age, education, work_experience, current_company, current_position, expected_salary, tags, source, created_by) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, phone, email, gender, age, education, work_experience, current_company, current_position, expected_salary, tags, source, req.user.id]
    );

    const candidate = await get('SELECT * FROM candidates WHERE id = ?', [result.lastID]);
    res.status(201).json(candidate);
  } catch (error) {
    console.error('创建候选人错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

router.get('/applications/funnel', async (req, res) => {
  try {
    const { position_id } = req.query;
    let sql = 'SELECT current_stage, COUNT(*) as count FROM candidate_applications';
    let params = [];
    
    if (position_id) {
      sql += ' WHERE position_id = ?';
      params.push(position_id);
    }
    
    sql += ' GROUP BY current_stage';
    
    const results = await all(sql, params);
    
    const funnel = {};
    STAGES.forEach(stage => {
      funnel[stage.key] = {
        name: stage.name,
        count: 0,
        rate: 0
      };
    });
    
    results.forEach(r => {
      if (funnel[r.current_stage]) {
        funnel[r.current_stage].count = r.count;
      }
    });
    
    let prevCount = null;
    STAGES.forEach(stage => {
      if (stage.key !== 'eliminated' && prevCount !== null && prevCount > 0) {
        funnel[stage.key].rate = Math.round((funnel[stage.key].count / prevCount) * 100);
      }
      if (stage.key !== 'eliminated') {
        prevCount = funnel[stage.key].count;
      }
    });
    
    res.json(funnel);
  } catch (error) {
    console.error('获取漏斗数据错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

router.get('/applications/:position_id', async (req, res) => {
  try {
    const applications = await all(`
      SELECT ca.*, c.name as candidate_name, c.phone, c.email, p.title as position_title
      FROM candidate_applications ca
      LEFT JOIN candidates c ON ca.candidate_id = c.id
      LEFT JOIN positions p ON ca.position_id = p.id
      WHERE ca.position_id = ?
      ORDER BY ca.created_at DESC
    `, [req.params.position_id]);
    
    res.json(applications);
  } catch (error) {
    console.error('获取应聘记录错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

router.post('/applications', requireRoles('admin', 'manager', 'consultant'), async (req, res) => {
  try {
    const { candidate_id, position_id } = req.body;
    
    const existing = await get(
      'SELECT * FROM candidate_applications WHERE candidate_id = ? AND position_id = ?',
      [candidate_id, position_id]
    );
    
    if (existing) {
      await run(
        `UPDATE candidate_applications SET is_repeat = 1, pool_count = pool_count + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [existing.id]
      );
      
      const application = await get('SELECT * FROM candidate_applications WHERE id = ?', [existing.id]);
      return res.json(application);
    }
    
    const result = await run(
      `INSERT INTO candidate_applications (candidate_id, position_id, created_by) VALUES (?, ?, ?)`,
      [candidate_id, position_id, req.user.id]
    );
    
    const now = moment().format('YYYY-MM-DD HH:mm:ss');
    await run(
      `INSERT INTO stage_records (application_id, stage, status, started_at, created_by) VALUES (?, ?, ?, ?, ?)`,
      [result.lastID, 'screening', 'pending', now, req.user.id]
    );
    
    await run(
      `INSERT INTO sla_records (application_id, metric_type, start_time, target_hours, status) VALUES (?, ?, ?, ?, ?)`,
      [result.lastID, 'response', now, 24, 'pending']
    );

    const application = await get('SELECT * FROM candidate_applications WHERE id = ?', [result.lastID]);
    res.status(201).json(application);
  } catch (error) {
    console.error('创建应聘记录错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

router.post('/applications/:id/stage', requireRoles('admin', 'manager', 'consultant'), async (req, res) => {
  try {
    const { stage, status, result: stageResult, reason, notes, internal_notes, interview_time, interview_location, interviewer } = req.body;
    const applicationId = req.params.id;
    
    const application = await get('SELECT * FROM candidate_applications WHERE id = ?', [applicationId]);
    if (!application) {
      return res.status(404).json({ error: '应聘记录不存在' });
    }
    
    const currentStageIndex = STAGES.findIndex(s => s.key === application.current_stage);
    const newStageIndex = STAGES.findIndex(s => s.key === stage);
    
    if (newStageIndex < currentStageIndex && stage !== application.current_stage) {
      return res.status(400).json({ error: '不能回退到之前的阶段' });
    }
    
    const now = moment().format('YYYY-MM-DD HH:mm:ss');
    
    const existingRecord = await get(
      'SELECT * FROM stage_records WHERE application_id = ? AND stage = ? ORDER BY id DESC LIMIT 1',
      [applicationId, stage]
    );
    
    let stageRecordId;
    if (existingRecord) {
      await run(
        `UPDATE stage_records SET status = ?, completed_at = ?, result = ?, reason = ?, notes = ?, internal_notes = ?, interview_time = ?, interview_location = ?, interviewer = ? WHERE id = ?`,
        [status, now, stageResult, reason, notes, internal_notes, interview_time, interview_location, interviewer, existingRecord.id]
      );
      stageRecordId = existingRecord.id;
    } else {
      const recordResult = await run(
        `INSERT INTO stage_records (application_id, stage, status, started_at, completed_at, result, reason, notes, internal_notes, interview_time, interview_location, interviewer, created_by) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [applicationId, stage, status, now, status === 'completed' ? now : null, stageResult, reason, notes, internal_notes, interview_time, interview_location, interviewer, req.user.id]
      );
      stageRecordId = recordResult.lastID;
    }
    
    if (status === 'completed') {
      const pendingSla = await get(
        'SELECT * FROM sla_records WHERE application_id = ? AND status = "pending" ORDER BY id DESC LIMIT 1',
        [applicationId]
      );
      
      if (pendingSla) {
        const startTime = moment(pendingSla.start_time);
        const actualHours = moment().diff(startTime, 'hours');
        
        let slaStatus = 'met';
        if (actualHours > pendingSla.target_hours) {
          slaStatus = 'overdue';
        }
        
        await run(
          `UPDATE sla_records SET end_time = ?, actual_hours = ?, status = ? WHERE id = ?`,
          [now, actualHours, slaStatus, pendingSla.id]
        );
      }
    }
    
    if (stageResult === 'eliminated') {
      await run(
        `UPDATE candidate_applications SET current_stage = 'eliminated', stage_status = 'completed', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [applicationId]
      );
      
      await run(
        `INSERT INTO elimination_reasons (application_id, stage, reason_category, reason_detail, created_by) VALUES (?, ?, ?, ?, ?)`,
        [applicationId, stage, reason, notes, req.user.id]
      );
    } else if (status === 'completed') {
      const currentStageIndex = STAGES.findIndex(s => s.key === stage);
      if (currentStageIndex >= 0 && currentStageIndex < STAGES.length - 2) {
        const nextStage = STAGES[currentStageIndex + 1];
        await run(
          `UPDATE candidate_applications SET current_stage = ?, stage_status = 'pending', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
          [nextStage.key, applicationId]
        );
        
        await run(
          `INSERT INTO stage_records (application_id, stage, status, started_at, created_by) VALUES (?, ?, ?, ?, ?)`,
          [applicationId, nextStage.key, 'pending', now, req.user.id]
        );
      } else {
        await run(
          `UPDATE candidate_applications SET current_stage = ?, stage_status = 'completed', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
          [stage, applicationId]
        );
      }
    }

    const application = await get('SELECT * FROM candidate_applications WHERE id = ?', [applicationId]);
    res.json(application);
  } catch (error) {
    console.error('更新阶段错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

router.post('/applications/:id/eliminate', requireRoles('admin', 'manager', 'consultant'), async (req, res) => {
  try {
    const { stage, reason_category, reason_detail, description } = req.body;
    const applicationId = req.params.id;
    
    const now = moment().format('YYYY-MM-DD HH:mm:ss');
    
    await run(
      `UPDATE candidate_applications SET current_stage = 'eliminated', stage_status = 'completed', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [applicationId]
    );
    
    const existingElimination = await get(
      'SELECT * FROM elimination_reasons WHERE application_id = ? ORDER BY id DESC LIMIT 1',
      [applicationId]
    );
    
    if (existingElimination) {
      await run(
        `UPDATE elimination_reasons SET stage = ?, reason_category = ?, reason_detail = ?, description = ?, created_by = ? WHERE id = ?`,
        [stage, reason_category, reason_detail, description, req.user.id, existingElimination.id]
      );
    } else {
      await run(
        `INSERT INTO elimination_reasons (application_id, stage, reason_category, reason_detail, description, created_by) VALUES (?, ?, ?, ?, ?, ?)`,
        [applicationId, stage, reason_category, reason_detail, description, req.user.id]
      );
    }
    
    const application = await get('SELECT * FROM candidate_applications WHERE id = ?', [applicationId]);
    res.json(application);
  } catch (error) {
    console.error('淘汰候选人错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

module.exports = router;
