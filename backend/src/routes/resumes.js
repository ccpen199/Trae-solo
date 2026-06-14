
const express = require('express');
const db = require('../database/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, (req, res) => {
  const { page = 1, pageSize = 20, keyword, city, education, work_years, is_public } = req.query;
  const offset = (page - 1) * pageSize;

  let whereClause = 'WHERE 1=1';
  const params = [];

  if (keyword) {
    whereClause += ' AND (candidate_name LIKE ? OR current_position LIKE ? OR skills LIKE ?)';
    params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
  }
  if (city) {
    whereClause += ' AND city = ?';
    params.push(city);
  }
  if (education) {
    whereClause += ' AND education = ?';
    params.push(education);
  }
  if (work_years) {
    whereClause += ' AND work_years >= ?';
    params.push(parseInt(work_years));
  }
  if (is_public !== undefined) {
    whereClause += ' AND is_public = ?';
    params.push(is_public === 'true' ? 1 : 0);
  }

  const total = db.prepare(`SELECT COUNT(*) as count FROM resumes ${whereClause}`).get(...params).count;

  const resumes = db.prepare(`
    SELECT r.*, u.real_name as owner_name, u.credit_score as owner_credit
    FROM resumes r
    LEFT JOIN users u ON r.owner_id = u.id
    ${whereClause}
    ORDER BY r.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(pageSize), offset).map(r => ({
    ...r,
    portrait_tags: r.portrait_tags ? JSON.parse(r.portrait_tags) : [],
    skills: r.skills ? r.skills.split(',') : []
  }));

  res.json({ list: resumes, total, page: parseInt(page), pageSize: parseInt(pageSize) });
});

router.get('/mine', authenticateToken, (req, res) => {
  const resumes = db.prepare(`
    SELECT * FROM resumes WHERE owner_id = ? ORDER BY created_at DESC
  `).all(req.user.id).map(r => ({
    ...r,
    portrait_tags: r.portrait_tags ? JSON.parse(r.portrait_tags) : [],
    skills: r.skills ? r.skills.split(',') : []
  }));

  res.json(resumes);
});

router.get('/:id', authenticateToken, (req, res) => {
  const resume = db.prepare(`
    SELECT r.*, u.real_name as owner_name, u.credit_score as owner_credit
    FROM resumes r
    LEFT JOIN users u ON r.owner_id = u.id
    WHERE r.id = ?
  `).get(req.params.id);

  if (!resume) {
    return res.status(404).json({ error: '简历不存在' });
  }

  resume.portrait_tags = resume.portrait_tags ? JSON.parse(resume.portrait_tags) : [];
  resume.skills = resume.skills ? resume.skills.split(',') : [];

  res.json(resume);
});

router.post('/', authenticateToken, (req, res) => {
  const {
    candidate_name, candidate_phone, candidate_email, age, gender,
    current_company, current_position, current_salary,
    expected_salary_min, expected_salary_max, city,
    education, work_years, skills, experience,
    education_detail, is_public
  } = req.body;

  if (!candidate_name || !candidate_phone || !current_position) {
    return res.status(400).json({ error: '必填项不能为空' });
  }

  const skillStr = Array.isArray(skills) ? skills.join(',') : skills;

  const tags = generatePortraitTags(req.body);
  const poachingRisk = calculatePoachingRisk(req.body);

  const stmt = db.prepare(`
    INSERT INTO resumes (
      candidate_name, candidate_phone, candidate_email, age, gender,
      current_company, current_position, current_salary,
      expected_salary_min, expected_salary_max, city,
      education, work_years, skills, experience,
      education_detail, portrait_tags, poaching_risk, owner_id, is_public
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const info = stmt.run(
    candidate_name, candidate_phone, candidate_email, age, gender,
    current_company, current_position, current_salary,
    expected_salary_min, expected_salary_max, city,
    education, work_years, skillStr, experience,
    education_detail, JSON.stringify(tags), poachingRisk, req.user.id, is_public ? 1 : 0
  );

  db.prepare(`
    INSERT INTO audit_logs (user_id, action, resource_type, resource_id, ip)
    VALUES (?, 'create_resume', 'resume', ?, ?)
  `).run(req.user.id, info.lastInsertRowid, req.ip);

  res.status(201).json({
    id: info.lastInsertRowid,
    portrait_tags: tags,
    poaching_risk: poachingRisk
  });
});

router.put('/:id', authenticateToken, (req, res) => {
  const resume = db.prepare('SELECT * FROM resumes WHERE id = ?').get(req.params.id);

  if (!resume) {
    return res.status(404).json({ error: '简历不存在' });
  }

  if (resume.owner_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: '无权限修改此简历' });
  }

  const {
    candidate_name, candidate_phone, candidate_email, age, gender,
    current_company, current_position, current_salary,
    expected_salary_min, expected_salary_max, city,
    education, work_years, skills, experience,
    education_detail, is_public
  } = req.body;

  const skillStr = Array.isArray(skills) ? skills.join(',') : skills;
  const tags = generatePortraitTags(req.body);
  const poachingRisk = calculatePoachingRisk(req.body);

  db.prepare(`
    UPDATE resumes SET
      candidate_name = ?, candidate_phone = ?, candidate_email = ?,
      age = ?, gender = ?, current_company = ?, current_position = ?,
      current_salary = ?, expected_salary_min = ?, expected_salary_max = ?,
      city = ?, education = ?, work_years = ?, skills = ?, experience = ?,
      education_detail = ?, portrait_tags = ?, poaching_risk = ?,
      is_public = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    candidate_name, candidate_phone, candidate_email, age, gender,
    current_company, current_position, current_salary,
    expected_salary_min, expected_salary_max, city,
    education, work_years, skillStr, experience,
    education_detail, JSON.stringify(tags), poachingRisk,
    is_public ? 1 : 0, req.params.id
  );

  db.prepare(`
    INSERT INTO audit_logs (user_id, action, resource_type, resource_id, ip)
    VALUES (?, 'update_resume', 'resume', ?, ?)
  `).run(req.user.id, req.params.id, req.ip);

  res.json({ message: '更新成功', portrait_tags: tags, poaching_risk: poachingRisk });
});

router.delete('/:id', authenticateToken, (req, res) => {
  const resume = db.prepare('SELECT * FROM resumes WHERE id = ?').get(req.params.id);

  if (!resume) {
    return res.status(404).json({ error: '简历不存在' });
  }

  if (resume.owner_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: '无权限删除此简历' });
  }

  db.prepare('DELETE FROM resumes WHERE id = ?').run(req.params.id);

  db.prepare(`
    INSERT INTO audit_logs (user_id, action, resource_type, resource_id, ip)
    VALUES (?, 'delete_resume', 'resume', ?, ?)
  `).run(req.user.id, req.params.id, req.ip);

  res.json({ message: '删除成功' });
});

function generatePortraitTags(data) {
  const tags = [];
  
  if (data.work_years >= 5) tags.push('资深经验');
  else if (data.work_years >= 3) tags.push('中坚力量');
  else tags.push('潜力新星');

  if (data.education === '博士') tags.push('高学历');
  else if (data.education === '硕士') tags.push('学历优秀');

  if (data.current_salary >= 500000) tags.push('高薪人才');
  else if (data.current_salary >= 300000) tags.push('中高收入');

  if (data.skills) {
    const skillArr = Array.isArray(data.skills) ? data.skills : data.skills.split(',');
    const hotSkills = ['React', 'Vue', 'AI', 'Python', 'Java', 'Go', 'Node.js', 'TypeScript'];
    const hasHotSkill = skillArr.some(s => hotSkills.some(h => s.includes(h)));
    if (hasHotSkill) tags.push('热门技能');
  }

  if (data.age >= 25 && data.age <= 32) tags.push('黄金年龄');
  if (data.city === '北京' || data.city === '上海' || data.city === '深圳') tags.push('一线城市');

  return tags;
}

function calculatePoachingRisk(data) {
  let risk = 0.3;

  if (data.expected_salary_min && data.current_salary) {
    const expectIncrease = (data.expected_salary_min - data.current_salary) / data.current_salary;
    if (expectIncrease > 0.3) risk += 0.25;
    else if (expectIncrease > 0.15) risk += 0.15;
  }

  if (data.work_years >= 3 && data.work_years <= 8) risk += 0.15;
  if (data.age >= 25 && data.age <= 32) risk += 0.1;

  const hotCompanies = ['字节', '阿里', '腾讯', '百度', '美团', '京东', '拼多多', '华为'];
  if (data.current_company && hotCompanies.some(c => data.current_company.includes(c))) {
    risk += 0.2;
  }

  if (data.skills) {
    const skillArr = Array.isArray(data.skills) ? data.skills : data.skills.split(',');
    const hotSkills = ['AI', '机器学习', '深度学习', '大模型', 'Go', 'Rust'];
    if (skillArr.some(s => hotSkills.some(h => s.includes(h)))) {
      risk += 0.15;
    }
  }

  return Math.min(risk, 0.98);
}

module.exports = router;
