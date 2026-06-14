const db = require('../database');
const auth = require('../auth');

function escapeStr(str) {
  return String(str || '').replace(/'/g, "''");
}

function calculateMatchScore(job, resume) {
  let score = 0;
  
  const jobSkills = (job.job_requirements || '').toLowerCase().split(/[，,、\s]+/);
  const resumeSkills = (resume.skills || '').toLowerCase().split(/[，,、\s]+/);
  const skillMatches = jobSkills.filter(s => resumeSkills.some(r => r.includes(s) || s.includes(r))).length;
  score += Math.min(skillMatches * 5, 25);
  
  const salaryMid = (job.salary_min + job.salary_max) / 2;
  const expectedMid = ((resume.expected_salary_min || 0) + (resume.expected_salary_max || 0)) / 2;
  if (expectedMid > 0 && salaryMid >= expectedMid * 0.9 && salaryMid <= expectedMid * 1.1) {
    score += 20;
  } else if (expectedMid > 0 && salaryMid >= expectedMid * 0.8 && salaryMid <= expectedMid * 1.2) {
    score += 10;
  }
  
  if (job.work_location && resume.expected_work_location) {
    if (job.work_location.includes(resume.expected_work_location) || resume.expected_work_location.includes(job.work_location)) {
      score += 15;
    }
  }
  
  if (job.education_requirement && resume.education) {
    const eduLevels = { '高中': 1, '大专': 2, '本科': 3, '硕士': 4, '博士': 5 };
    const jobEdu = eduLevels[job.education_requirement] || 0;
    const resumeEdu = eduLevels[resume.education] || 0;
    if (resumeEdu >= jobEdu) {
      score += 20;
    } else if (resumeEdu >= jobEdu - 1) {
      score += 10;
    }
  }
  
  if (job.experience_requirement && resume.work_experience_years !== undefined) {
    const expMatch = job.experience_requirement.match(/(\d+)/);
    if (expMatch) {
      const requiredExp = parseInt(expMatch[1]);
      if (resume.work_experience_years >= requiredExp) {
        score += 20;
      } else if (resume.work_experience_years >= requiredExp - 1) {
        score += 10;
      }
    }
  }
  
  return Math.min(score, 100);
}

function registerEmploymentRoutes(app) {
  app.get('/api/jobs', auth.requireAuth, auth.requirePermission('personal.job.search'), (req, res) => {
    const { keyword, job_type, industry, work_location, salary_min, salary_max, page = 1, page_size = 15 } = req.query;
    const offset = (page - 1) * page_size;
    
    let sql = `
      SELECT j.*, e.enterprise_name, e.industry as enterprise_industry,
             COUNT(ja.id) as real_apply_count
      FROM jobs j
      INNER JOIN enterprises e ON j.enterprise_id = e.id
      LEFT JOIN job_applications ja ON j.id = ja.job_id
      WHERE j.status = 'published'
    `;
    const params = [];
    
    if (keyword) {
      sql += " AND (j.title LIKE ? OR j.job_description LIKE ? OR j.job_requirements LIKE ?)";
      const kw = `%${keyword}%`;
      params.push(kw, kw, kw);
    }
    if (job_type) {
      sql += " AND j.job_type = ?";
      params.push(job_type);
    }
    if (industry) {
      sql += " AND j.industry = ?";
      params.push(industry);
    }
    if (work_location) {
      sql += " AND j.work_location LIKE ?";
      params.push(`%${work_location}%`);
    }
    if (salary_min) {
      sql += " AND j.salary_max >= ?";
      params.push(Number(salary_min));
    }
    if (salary_max) {
      sql += " AND j.salary_min <= ?";
      params.push(Number(salary_max));
    }
    
    sql += " GROUP BY j.id ORDER BY j.publish_date DESC, j.match_score DESC LIMIT ? OFFSET ?";
    params.push(Number(page_size), Number(offset));
    
    const jobs = db.query(sql, params);
    
    const countSql = `
      SELECT COUNT(*) as total FROM jobs j
      INNER JOIN enterprises e ON j.enterprise_id = e.id
      WHERE j.status = 'published'
      ${keyword ? " AND (j.title LIKE ? OR j.job_description LIKE ? OR j.job_requirements LIKE ?)" : ''}
      ${job_type ? " AND j.job_type = ?" : ''}
      ${industry ? " AND j.industry = ?" : ''}
      ${work_location ? " AND j.work_location LIKE ?" : ''}
      ${salary_min ? " AND j.salary_max >= ?" : ''}
      ${salary_max ? " AND j.salary_min <= ?" : ''}
    `;
    const countParams = [];
    if (keyword) {
      const kw = `%${keyword}%`;
      countParams.push(kw, kw, kw);
    }
    if (job_type) countParams.push(job_type);
    if (industry) countParams.push(industry);
    if (work_location) countParams.push(`%${work_location}%`);
    if (salary_min) countParams.push(Number(salary_min));
    if (salary_max) countParams.push(Number(salary_max));
    
    const countResult = db.query(countSql, countParams);
    const total = countResult[0]?.total || 0;
    
    const userResumes = db.query('SELECT * FROM resumes WHERE user_id = ? LIMIT 1', [req.session.userId]);
    const resume = userResumes[0];
    
    const jobsWithMatch = jobs.map(job => {
      const matchScore = resume ? calculateMatchScore(job, resume) : null;
      return { ...job, match_score: matchScore || job.match_score };
    });
    
    res.json({ 
      ok: true, 
      data: jobsWithMatch, 
      total,
      page: Number(page), 
      page_size: Number(page_size),
      total_pages: Math.ceil(total / page_size)
    });
  });

  app.get('/api/jobs/recommended', auth.requireAuth, auth.requirePermission('personal.job.search'), (req, res) => {
    const resumes = db.query('SELECT * FROM resumes WHERE user_id = ? LIMIT 1', [req.session.userId]);
    if (resumes.length === 0) {
      return res.json({ ok: true, data: [], message: '请先完善简历信息以获取智能推荐' });
    }
    const resume = resumes[0];
    
    const jobs = db.query(`
      SELECT j.*, e.enterprise_name, e.industry as enterprise_industry
      FROM jobs j
      INNER JOIN enterprises e ON j.enterprise_id = e.id
      WHERE j.status = 'published'
      ORDER BY j.match_score DESC, j.publish_date DESC
      LIMIT 10
    `);
    
    const scoredJobs = jobs.map(job => ({
      ...job,
      match_score: calculateMatchScore(job, resume)
    })).sort((a, b) => b.match_score - a.match_score).slice(0, 10);
    
    res.json({ ok: true, data: scoredJobs });
  });

  app.get('/api/jobs/:id', auth.requireAuth, (req, res) => {
    const jobId = Number(req.params.id);
    const jobs = db.query(`
      SELECT j.*, e.enterprise_name, e.unified_credit_code, e.industry as enterprise_industry,
             e.enterprise_type, e.contact_name as enterprise_contact
      FROM jobs j
      INNER JOIN enterprises e ON j.enterprise_id = e.id
      WHERE j.id = ? AND j.status = 'published'
      LIMIT 1
    `, [jobId]);
    
    if (jobs.length === 0) {
      return res.json({ ok: false, message: '岗位不存在或已下线' });
    }
    
    const job = jobs[0];
    db.execute('UPDATE jobs SET view_count = view_count + 1 WHERE id = ?', [jobId]);
    
    const hasApplied = db.query(`
      SELECT id FROM job_applications WHERE user_id = ? AND job_id = ? LIMIT 1
    `, [req.session.userId, jobId]);
    
    res.json({ ok: true, data: { ...job, has_applied: hasApplied.length > 0 } });
  });

  app.post('/api/jobs', auth.requireAuth, auth.requirePermission('enterprise.job.publish'), async (req, res) => {
    const body = await req.body;
    const { title, job_type, industry, work_location, salary_min, salary_max, salary_type, education_requirement, experience_requirement, job_description, job_requirements, benefits, contact_name, contact_phone, contact_email } = body;
    
    if (!title || !job_type || !work_location || !salary_min || !salary_max || !job_description) {
      return res.json({ ok: false, message: '缺少必要参数' });
    }
    
    const enterprises = db.query('SELECT * FROM enterprises WHERE user_id = ? LIMIT 1', [req.session.userId]);
    if (enterprises.length === 0) {
      return res.json({ ok: false, message: '企业信息不存在' });
    }
    
    db.execute(`
      INSERT INTO jobs (enterprise_id, title, job_type, industry, work_location, salary_min, salary_max, salary_type, education_requirement, experience_requirement, job_description, job_requirements, benefits, contact_name, contact_phone, contact_email)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [enterprises[0].id, title, job_type, industry, work_location, Number(salary_min), Number(salary_max), salary_type || 'monthly', education_requirement, experience_requirement, job_description, job_requirements, benefits, contact_name, contact_phone, contact_email]);
    
    const jobId = db.getLastInsertId();
    res.json({ ok: true, data: { id: jobId, message: '岗位发布成功' } });
  });

  app.get('/api/enterprise/jobs', auth.requireAuth, auth.requirePermission('enterprise.job.publish'), (req, res) => {
    const enterprises = db.query('SELECT * FROM enterprises WHERE user_id = ? LIMIT 1', [req.session.userId]);
    if (enterprises.length === 0) {
      return res.json({ ok: true, data: [] });
    }
    
    const { status, page = 1, page_size = 10 } = req.query;
    const offset = (page - 1) * page_size;
    
    let sql = `
      SELECT j.*, COUNT(ja.id) as apply_count
      FROM jobs j
      LEFT JOIN job_applications ja ON j.id = ja.job_id
      WHERE j.enterprise_id = ?
    `;
    const params = [enterprises[0].id];
    
    if (status) {
      sql += ' AND j.status = ?';
      params.push(status);
    }
    
    sql += ' GROUP BY j.id ORDER BY j.created_at DESC LIMIT ? OFFSET ?';
    params.push(Number(page_size), Number(offset));
    
    const jobs = db.query(sql, params);
    res.json({ ok: true, data: jobs });
  });

  app.get('/api/resumes/me', auth.requireAuth, auth.requirePermission('personal.resume.manage'), (req, res) => {
    const resumes = db.query('SELECT * FROM resumes WHERE user_id = ? LIMIT 1', [req.session.userId]);
    if (resumes.length === 0) {
      return res.json({ ok: true, data: null });
    }
    
    const resume = resumes[0];
    const workExperiences = db.query('SELECT * FROM work_experiences WHERE resume_id = ? ORDER BY start_date DESC', [resume.id]);
    const educationExperiences = db.query('SELECT * FROM education_experiences WHERE resume_id = ? ORDER BY start_date DESC', [resume.id]);
    
    res.json({ ok: true, data: { ...resume, work_experiences: workExperiences, education_experiences: educationExperiences } });
  });

  app.post('/api/resumes', auth.requireAuth, auth.requirePermission('personal.resume.manage'), async (req, res) => {
    const body = await req.body;
    const { resume_title, expected_salary_min, expected_salary_max, expected_work_location, expected_job_type, self_introduction, skills, work_experiences = [], education_experiences = [] } = body;
    
    if (!resume_title) {
      return res.json({ ok: false, message: '请输入简历标题' });
    }
    
    const existing = db.query('SELECT id FROM resumes WHERE user_id = ? LIMIT 1', [req.session.userId]);
    
    let resumeId;
    if (existing.length > 0) {
      resumeId = existing[0].id;
      db.execute(`
        UPDATE resumes SET resume_title = ?, expected_salary_min = ?, expected_salary_max = ?, expected_work_location = ?, expected_job_type = ?, self_introduction = ?, skills = ?, updated_at = datetime('now')
        WHERE id = ?
      `, [resume_title, Number(expected_salary_min || 0), Number(expected_salary_max || 0), expected_work_location, expected_job_type, self_introduction, skills, resumeId]);
      
      db.execute('DELETE FROM work_experiences WHERE resume_id = ?', [resumeId]);
      db.execute('DELETE FROM education_experiences WHERE resume_id = ?', [resumeId]);
    } else {
      db.execute(`
        INSERT INTO resumes (user_id, resume_title, expected_salary_min, expected_salary_max, expected_work_location, expected_job_type, self_introduction, skills, work_experience_years)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [req.session.userId, resume_title, Number(expected_salary_min || 0), Number(expected_salary_max || 0), expected_work_location, expected_job_type, self_introduction, skills, work_experiences.length > 0 ? Math.max(...work_experiences.map(w => {
        const start = new Date(w.start_date);
        const end = w.is_current ? new Date() : new Date(w.end_date || Date.now());
        return Math.floor((end - start) / (365 * 24 * 60 * 60 * 1000));
      })) : 0]);
      resumeId = db.getLastInsertId();
    }
    
    for (const we of work_experiences) {
      db.execute(`
        INSERT INTO work_experiences (resume_id, company_name, position, start_date, end_date, is_current, salary, work_description)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [resumeId, we.company_name, we.position, we.start_date, we.end_date || null, we.is_current ? 1 : 0, Number(we.salary || 0), we.work_description]);
    }
    
    for (const ee of education_experiences) {
      db.execute(`
        INSERT INTO education_experiences (resume_id, school_name, degree, major, start_date, end_date, gpa, description)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [resumeId, ee.school_name, ee.degree, ee.major, ee.start_date, ee.end_date, Number(ee.gpa || 0), ee.description]);
    }
    
    db.execute(`
      UPDATE resumes SET work_experience_years = (
        SELECT COALESCE(SUM(
          CAST((julianday(COALESCE(end_date, date('now'))) - julianday(start_date)) / 365 AS INTEGER)
        ), 0) FROM work_experiences WHERE resume_id = ?
      ) WHERE id = ?
    `, [resumeId, resumeId]);
    
    res.json({ ok: true, data: { id: resumeId, message: '简历保存成功' } });
  });

  app.post('/api/jobs/:id/apply', auth.requireAuth, auth.requirePermission('personal.job.search'), async (req, res) => {
    const jobId = Number(req.params.id);
    const body = await req.body;
    const { resume_id } = body;
    
    const jobs = db.query('SELECT * FROM jobs WHERE id = ? AND status = ?', [jobId, 'published']);
    if (jobs.length === 0) {
      return res.json({ ok: false, message: '岗位不存在或已下线' });
    }
    
    const existing = db.query('SELECT id FROM job_applications WHERE user_id = ? AND job_id = ?', [req.session.userId, jobId]);
    if (existing.length > 0) {
      return res.json({ ok: false, message: '您已申请过该岗位' });
    }
    
    let resumeId = resume_id;
    if (!resumeId) {
      const resumes = db.query('SELECT id FROM resumes WHERE user_id = ? LIMIT 1', [req.session.userId]);
      if (resumes.length === 0) {
        return res.json({ ok: false, message: '请先创建简历' });
      }
      resumeId = resumes[0].id;
    }
    
    db.execute(`
      INSERT INTO job_applications (user_id, job_id, resume_id, status, current_stage)
      VALUES (?, ?, ?, 'pending', 'initial_screening')
    `, [req.session.userId, jobId, resumeId]);
    
    const applicationId = db.getLastInsertId();
    
    db.execute(`
      INSERT INTO application_timeline (application_id, stage, status, operator_id, comment)
      VALUES (?, 'initial_screening', 'pending', ?, '简历已投递')
    `, [applicationId, req.session.userId]);
    
    db.execute('UPDATE jobs SET apply_count = apply_count + 1 WHERE id = ?', [jobId]);
    
    const job = jobs[0];
    db.execute(`
      INSERT INTO notifications (user_id, type, title, content, related_module, related_id)
      VALUES (?, 'business', ?, ?, 'employment', ?)
    `, [req.session.userId, '岗位申请已提交', `您已成功申请"${job.title}"岗位，请耐心等待企业审核。`, applicationId]);
    
    db.execute(`
      INSERT INTO notifications (user_id, type, title, content, related_module, related_id)
      SELECT e.user_id, 'business', ?, ?, 'employment', ?
      FROM jobs j
      INNER JOIN enterprises e ON j.enterprise_id = e.id
      WHERE j.id = ?
    `, ['新的岗位申请', `有新的求职者申请了"${job.title}"岗位，请及时查看。`, applicationId, jobId]);
    
    res.json({ ok: true, data: { id: applicationId } });
  });

  app.get('/api/job-applications', auth.requireAuth, (req, res) => {
    const { status, page = 1, page_size = 10 } = req.query;
    const offset = (page - 1) * page_size;
    
    let sql = `
      SELECT ja.*, j.title, j.work_location, j.salary_min, j.salary_max,
             e.enterprise_name, r.resume_title
      FROM job_applications ja
      INNER JOIN jobs j ON ja.job_id = j.id
      INNER JOIN enterprises e ON j.enterprise_id = e.id
      INNER JOIN resumes r ON ja.resume_id = r.id
      WHERE ja.user_id = ?
    `;
    const params = [req.session.userId];
    
    if (status) {
      sql += ' AND ja.status = ?';
      params.push(status);
    }
    
    sql += ' ORDER BY ja.application_date DESC LIMIT ? OFFSET ?';
    params.push(Number(page_size), Number(offset));
    
    const applications = db.query(sql, params);
    
    const enriched = applications.map(app => {
      const timeline = db.query(`
        SELECT at.*, u.real_name as operator_name
        FROM application_timeline at
        LEFT JOIN users u ON at.operator_id = u.id
        WHERE at.application_id = ?
        ORDER BY at.created_at ASC
      `, [app.id]);
      return { ...app, timeline };
    });
    
    res.json({ ok: true, data: enriched });
  });

  app.get('/api/enterprise/applications', auth.requireAuth, auth.requirePermission('enterprise.application.manage'), (req, res) => {
    const enterprises = db.query('SELECT * FROM enterprises WHERE user_id = ? LIMIT 1', [req.session.userId]);
    if (enterprises.length === 0) {
      return res.json({ ok: true, data: [] });
    }
    
    const { job_id, status, page = 1, page_size = 10 } = req.query;
    const offset = (page - 1) * page_size;
    
    let sql = `
      SELECT ja.*, j.title, u.real_name as applicant_name, u.phone as applicant_phone,
             r.resume_title, r.skills, r.work_experience_years
      FROM job_applications ja
      INNER JOIN jobs j ON ja.job_id = j.id
      INNER JOIN users u ON ja.user_id = u.id
      INNER JOIN resumes r ON ja.resume_id = r.id
      WHERE j.enterprise_id = ?
    `;
    const params = [enterprises[0].id];
    
    if (job_id) {
      sql += ' AND ja.job_id = ?';
      params.push(Number(job_id));
    }
    if (status) {
      sql += ' AND ja.status = ?';
      params.push(status);
    }
    
    sql += ' ORDER BY ja.application_date DESC LIMIT ? OFFSET ?';
    params.push(Number(page_size), Number(offset));
    
    const applications = db.query(sql, params);
    res.json({ ok: true, data: applications });
  });

  app.post('/api/job-applications/:id/status', auth.requireAuth, auth.requirePermission('enterprise.application.manage'), async (req, res) => {
    const applicationId = Number(req.params.id);
    const body = await req.body;
    const { status, stage, comment, interview_date, interview_location, offer_amount } = body;
    
    const applications = db.query('SELECT ja.*, j.enterprise_id FROM job_applications ja INNER JOIN jobs j ON ja.job_id = j.id WHERE ja.id = ?', [applicationId]);
    if (applications.length === 0) {
      return res.json({ ok: false, message: '申请不存在' });
    }
    
    const enterprises = db.query('SELECT id FROM enterprises WHERE user_id = ?', [req.session.userId]);
    if (!enterprises.some(e => e.id === applications[0].enterprise_id)) {
      return res.json({ ok: false, message: '无权操作此申请' });
    }
    
    db.execute(`
      UPDATE job_applications SET status = ?, current_stage = ?, employer_feedback = ?, interview_date = ?, interview_location = ?, offer_amount = ?, updated_at = datetime('now')
      WHERE id = ?
    `, [status, stage, comment, interview_date, interview_location, offer_amount ? Number(offer_amount) : null, applicationId]);
    
    db.execute(`
      INSERT INTO application_timeline (application_id, stage, status, operator_id, comment)
      VALUES (?, ?, ?, ?, ?)
    `, [applicationId, stage, status, req.session.userId, comment]);
    
    db.execute(`
      INSERT INTO notifications (user_id, type, title, content, related_module, related_id)
      SELECT user_id, 'business', ?, ?, 'employment', ? FROM job_applications WHERE id = ?
    `, [`申请状态更新`, `您的岗位申请状态已更新为：${status}${comment ? '，备注：' + comment : ''}`, applicationId, applicationId]);
    
    res.json({ ok: true, message: '状态更新成功' });
  });

  app.get('/api/job-fairs', auth.requireAuth, (req, res) => {
    const { status, page = 1, page_size = 10 } = req.query;
    const offset = (page - 1) * page_size;
    
    let sql = 'SELECT * FROM job_fairs WHERE 1=1';
    const params = [];
    
    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }
    
    sql += ' ORDER BY start_time DESC LIMIT ? OFFSET ?';
    params.push(Number(page_size), Number(offset));
    
    const fairs = db.query(sql, params);
    
    const enriched = fairs.map(fair => {
      const registered = db.query('SELECT id FROM job_fair_user_registrations WHERE job_fair_id = ? AND user_id = ?', [fair.id, req.session.userId]);
      return { ...fair, is_registered: registered.length > 0 };
    });
    
    res.json({ ok: true, data: enriched });
  });

  app.post('/api/job-fairs/:id/register', auth.requireAuth, async (req, res) => {
    const fairId = Number(req.params.id);
    
    const fairs = db.query('SELECT * FROM job_fairs WHERE id = ?', [fairId]);
    if (fairs.length === 0) {
      return res.json({ ok: false, message: '招聘会不存在' });
    }
    
    try {
      db.execute(`
        INSERT INTO job_fair_user_registrations (job_fair_id, user_id)
        VALUES (?, ?)
      `, [fairId, req.session.userId]);
      
      res.json({ ok: true, message: '预约成功' });
    } catch (e) {
      res.json({ ok: false, message: '您已预约过此招聘会' });
    }
  });

  app.get('/api/training-courses', auth.requireAuth, (req, res) => {
    const { category, level, status, page = 1, page_size = 10 } = req.query;
    const offset = (page - 1) * page_size;
    
    let sql = 'SELECT * FROM training_courses WHERE 1=1';
    const params = [];
    
    if (category) {
      sql += ' AND category = ?';
      params.push(category);
    }
    if (level) {
      sql += ' AND level = ?';
      params.push(level);
    }
    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }
    
    sql += ' ORDER BY start_date DESC LIMIT ? OFFSET ?';
    params.push(Number(page_size), Number(offset));
    
    const courses = db.query(sql, params);
    
    const enriched = courses.map(course => {
      const enrolled = db.query('SELECT id, enrollment_status, grade FROM training_enrollments WHERE course_id = ? AND user_id = ?', [course.id, req.session.userId]);
      return { ...course, is_enrolled: enrolled.length > 0, enrollment: enrolled[0] || null };
    });
    
    res.json({ ok: true, data: enriched });
  });

  app.get('/api/training-courses/:id', auth.requireAuth, (req, res) => {
    const courseId = Number(req.params.id);
    const courses = db.query('SELECT * FROM training_courses WHERE id = ?', [courseId]);
    
    if (courses.length === 0) {
      return res.json({ ok: false, message: '课程不存在' });
    }
    
    const enrolled = db.query('SELECT * FROM training_enrollments WHERE course_id = ? AND user_id = ?', [courseId, req.session.userId]);
    const attendance = enrolled.length > 0 ? db.query('SELECT * FROM training_attendance WHERE enrollment_id = ? ORDER BY session_date', [enrolled[0].id]) : [];
    
    res.json({ ok: true, data: { ...courses[0], is_enrolled: enrolled.length > 0, enrollment: enrolled[0] || null, attendance } });
  });

  app.post('/api/training-courses/:id/enroll', auth.requireAuth, auth.requirePermission('personal.training.enroll'), async (req, res) => {
    const courseId = Number(req.params.id);
    const body = await req.body;
    
    const courses = db.query('SELECT * FROM training_courses WHERE id = ?', [courseId]);
    if (courses.length === 0) {
      return res.json({ ok: false, message: '课程不存在' });
    }
    const course = courses[0];
    
    if (course.enrolled_count >= course.max_students) {
      return res.json({ ok: false, message: '课程名额已满' });
    }
    
    const actualFee = Math.max(0, course.fee - course.subsidy_amount);
    const subsidyReceived = course.subsidy_amount > 0 ? 1 : 0;
    
    try {
      db.execute(`
        INSERT INTO training_enrollments (course_id, user_id, actual_fee, subsidy_received, enrollment_status)
        VALUES (?, ?, ?, ?, 'enrolled')
      `, [courseId, req.session.userId, actualFee, subsidyReceived]);
      
      db.execute('UPDATE training_courses SET enrolled_count = enrolled_count + 1 WHERE id = ?', [courseId]);
      
      const enrollmentId = db.getLastInsertId();
      
      if (subsidyReceived) {
        const wf = require('../workflow');
        wf.startWorkflow(
          'WF_ES004',
          enrollmentId,
          'training_enrollment',
          req.session.userId,
          req.session.userType,
          { course_id: courseId, course_name: course.course_name, subsidy_amount: course.subsidy_amount },
          'normal'
        );
      }
      
      db.execute(`
        INSERT INTO notifications (user_id, type, title, content, related_module, related_id)
        VALUES (?, 'business', ?, ?, 'employment', ?)
      `, [req.session.userId, '培训报名成功', `您已成功报名"${course.course_name}"课程，${subsidyReceived ? '已享受政府补贴' + course.subsidy_amount + '元' : '请按时缴费'}。`, enrollmentId]);
      
      res.json({ ok: true, data: { id: enrollmentId, actual_fee: actualFee } });
    } catch (e) {
      res.json({ ok: false, message: '您已报名过此课程' });
    }
  });

  app.get('/api/my-trainings', auth.requireAuth, (req, res) => {
    const enrollments = db.query(`
      SELECT te.*, tc.course_name, tc.category, tc.level, tc.total_hours, tc.total_credits,
             tc.start_date, tc.end_date, tc.status as course_status
      FROM training_enrollments te
      INNER JOIN training_courses tc ON te.course_id = tc.id
      WHERE te.user_id = ?
      ORDER BY te.enrollment_date DESC
    `, [req.session.userId]);
    
    res.json({ ok: true, data: enrollments });
  });

  app.get('/api/employment/overview', auth.requireAuth, (req, res) => {
    if (req.session.userType === 'personal') {
      const applications = db.query(`
        SELECT ja.*, j.title, e.enterprise_name
        FROM job_applications ja
        INNER JOIN jobs j ON ja.job_id = j.id
        INNER JOIN enterprises e ON j.enterprise_id = e.id
        WHERE ja.user_id = ?
        ORDER BY ja.application_date DESC
        LIMIT 5
      `, [req.session.userId]);
      
      const myTrainings = db.query(`
        SELECT te.*, tc.course_name
        FROM training_enrollments te
        INNER JOIN training_courses tc ON te.course_id = tc.id
        WHERE te.user_id = ? AND te.enrollment_status = 'in_progress'
        LIMIT 3
      `, [req.session.userId]);
      
      const hasResume = db.query('SELECT id FROM resumes WHERE user_id = ? LIMIT 1', [req.session.userId]);
      
      const statusStats = db.query(`
        SELECT status, COUNT(*) as count FROM job_applications
        WHERE user_id = ? GROUP BY status
      `, [req.session.userId]);
      
      res.json({ ok: true, data: {
        applications,
        myTrainings,
        hasResume: hasResume.length > 0,
        statusStats,
        totalApplications: applications.length
      }});
    } else if (req.session.userType === 'enterprise') {
      const enterprises = db.query('SELECT * FROM enterprises WHERE user_id = ? LIMIT 1', [req.session.userId]);
      if (enterprises.length === 0) {
        return res.json({ ok: true, data: { hasEnterprise: false } });
      }
      
      const myJobs = db.query(`
        SELECT j.*, COUNT(ja.id) as apply_count
        FROM jobs j
        LEFT JOIN job_applications ja ON j.id = ja.job_id
        WHERE j.enterprise_id = ? AND j.status = 'published'
        GROUP BY j.id
        ORDER BY j.created_at DESC
        LIMIT 5
      `, [enterprises[0].id]);
      
      const pendingApplications = db.query(`
        SELECT COUNT(*) as count FROM job_applications ja
        INNER JOIN jobs j ON ja.job_id = j.id
        WHERE j.enterprise_id = ? AND ja.status = 'pending'
      `, [enterprises[0].id]);
      
      res.json({ ok: true, data: {
        hasEnterprise: true,
        enterprise: enterprises[0],
        myJobs,
        pendingApplications: pendingApplications[0]?.count || 0,
        totalJobs: myJobs.length
      }});
    } else {
      res.json({ ok: true, data: {} });
    }
  });
}

module.exports = { registerEmploymentRoutes, escapeStr };
