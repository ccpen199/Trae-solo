const express = require('express');
const router = express.Router();

function generateSurveyNo() {
  const date = new Date();
  const ymd = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `SRV${ymd}${random}`;
}

router.get('/', (req, res) => {
  const { report_id, policy_id, surveyor_id, limit = 50, offset = 0 } = req.query;
  let sql = `
    SELECT s.*, r.report_no, r.disaster_type, r.damaged_area,
           p.policy_no, p.crop_type, p.area as policy_area,
           u.name as surveyor_name
    FROM surveys s
    LEFT JOIN reports r ON s.report_id = r.id
    LEFT JOIN policies p ON s.policy_id = p.id
    LEFT JOIN users u ON s.surveyor_id = u.id
    WHERE 1=1
  `;
  const params = [];
  if (report_id) { sql += ' AND s.report_id = ?'; params.push(report_id); }
  if (policy_id) { sql += ' AND s.policy_id = ?'; params.push(policy_id); }
  if (surveyor_id) { sql += ' AND s.surveyor_id = ?'; params.push(surveyor_id); }
  sql += ' ORDER BY s.id DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));
  
  const data = req.db.prepare(sql).all(...params);
  let countSql = 'SELECT COUNT(*) as count FROM surveys WHERE 1=1';
  const countParams = [];
  if (report_id) { countSql += ' AND report_id = ?'; countParams.push(report_id); }
  if (policy_id) { countSql += ' AND policy_id = ?'; countParams.push(policy_id); }
  if (surveyor_id) { countSql += ' AND surveyor_id = ?'; countParams.push(surveyor_id); }
  const total = req.db.prepare(countSql).get(...countParams).count;
  
  res.json({ data, total, limit: parseInt(limit), offset: parseInt(offset) });
});

router.get('/:id', (req, res) => {
  const data = req.db.prepare(`
    SELECT s.*, r.report_no, r.disaster_type, r.disaster_time, r.damaged_area,
           r.location as report_location, r.latitude as report_lat, r.longitude as report_lng,
           p.policy_no, p.crop_type, p.area as policy_area, p.insurance_amount,
           p.plot_location, p.deductible_ratio,
           f.name as farmer_name, f.phone as farmer_phone,
           u.name as surveyor_name
    FROM surveys s
    LEFT JOIN reports r ON s.report_id = r.id
    LEFT JOIN policies p ON s.policy_id = p.id
    LEFT JOIN farmers f ON p.farmer_id = f.id
    LEFT JOIN users u ON s.surveyor_id = u.id
    WHERE s.id = ?
  `).get(req.params.id);
  if (!data) return res.status(404).json({ error: '查勘记录不存在' });
  res.json(data);
});

router.post('/', (req, res) => {
  const {
    report_id, surveyor_id, survey_time, field_records, sampling_method,
    sampling_count, sample_loss_ratio, satellite_reference, weather_reference,
    loss_ratio, estimated_loss, survey_opinion, photos
  } = req.body;

  if (!report_id || !survey_time || loss_ratio === undefined || loss_ratio === null || !survey_opinion) {
    return res.status(400).json({ error: '缺少必要字段' });
  }

  const report = req.db.prepare('SELECT * FROM reports WHERE id = ?').get(report_id);
  if (!report) return res.status(404).json({ error: '报案不存在' });
  if (report.status !== 'pending' && report.status !== 'surveying') {
    return res.status(400).json({ error: '报案状态不允许查勘' });
  }

  const policy = req.db.prepare('SELECT * FROM policies WHERE id = ?').get(report.policy_id);
  if (!policy) return res.status(404).json({ error: '保单不存在' });

  const existing = req.db.prepare('SELECT * FROM surveys WHERE report_id = ?').get(report_id);
  if (existing) {
    return res.status(400).json({ error: '该报案已有查勘记录', existing_survey_id: existing.id });
  }

  if (loss_ratio < 0 || loss_ratio > 1) {
    return res.status(400).json({ error: '损失比例应在0-1之间' });
  }

  const survey_no = generateSurveyNo();
  const calculatedEstimatedLoss = estimated_loss || (policy.insurance_amount * report.damaged_area / policy.area * loss_ratio);

  const info = req.db.prepare(`
    INSERT INTO surveys (
      survey_no, report_id, policy_id, surveyor_id, survey_time,
      field_records, sampling_method, sampling_count, sample_loss_ratio,
      satellite_reference, weather_reference, loss_ratio, estimated_loss,
      survey_opinion, photos
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    survey_no, report_id, policy.id, surveyor_id, survey_time,
    field_records, sampling_method, sampling_count, sample_loss_ratio,
    satellite_reference, weather_reference, loss_ratio, calculatedEstimatedLoss,
    survey_opinion, photos
  );

  req.db.prepare(`UPDATE reports SET status = 'surveyed', updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(report_id);
  req.db.prepare(`UPDATE policies SET updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(policy.id);
  req.logOperation(surveyor_id || 1, 'survey', 'create', info.lastInsertRowid, `创建查勘: ${survey_no}`);

  const survey = req.db.prepare('SELECT * FROM surveys WHERE id = ?').get(info.lastInsertRowid);
  res.json(survey);
});

router.put('/:id', (req, res) => {
  const survey = req.db.prepare('SELECT * FROM surveys WHERE id = ?').get(req.params.id);
  if (!survey) return res.status(404).json({ error: '查勘记录不存在' });

  const {
    surveyor_id, survey_time, field_records, sampling_method,
    sampling_count, sample_loss_ratio, satellite_reference, weather_reference,
    loss_ratio, estimated_loss, survey_opinion, photos
  } = req.body;

  req.db.prepare(`
    UPDATE surveys SET
      surveyor_id = COALESCE(?, surveyor_id),
      survey_time = COALESCE(?, survey_time),
      field_records = COALESCE(?, field_records),
      sampling_method = COALESCE(?, sampling_method),
      sampling_count = COALESCE(?, sampling_count),
      sample_loss_ratio = COALESCE(?, sample_loss_ratio),
      satellite_reference = COALESCE(?, satellite_reference),
      weather_reference = COALESCE(?, weather_reference),
      loss_ratio = COALESCE(?, loss_ratio),
      estimated_loss = COALESCE(?, estimated_loss),
      survey_opinion = COALESCE(?, survey_opinion),
      photos = COALESCE(?, photos),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    surveyor_id, survey_time, field_records, sampling_method,
    sampling_count, sample_loss_ratio, satellite_reference, weather_reference,
    loss_ratio, estimated_loss, survey_opinion, photos,
    req.params.id
  );

  req.logOperation(surveyor_id || 1, 'survey', 'update', req.params.id, `更新查勘: ${survey.survey_no}`);

  const updated = req.db.prepare('SELECT * FROM surveys WHERE id = ?').get(req.params.id);
  res.json(updated);
});

module.exports = router;
