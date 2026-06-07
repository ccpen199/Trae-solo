const { db } = require('../models/database');

function createResume(req, res) {
  const { title, skills, aiTags, videoId } = req.body;

  const jobseeker = db.prepare('SELECT id FROM jobseekers WHERE user_id = ?').get(req.user.id);
  if (!jobseeker) {
    return res.status(404).json({ error: '求职者信息不存在' });
  }

  const insertResume = db.prepare(`
    INSERT INTO resumes (jobseeker_id, title, skills, ai_tags, video_id)
    VALUES (?, ?, ?, ?, ?)
  `);

  const result = insertResume.run(
    jobseeker.id,
    title || '我的视频简历',
    skills ? JSON.stringify(skills) : null,
    aiTags ? JSON.stringify(aiTags) : null,
    videoId || null
  );

  const resume = db.prepare(`
    SELECT r.*, v.status as video_status, v.file_path as video_path, v.thumbnail as video_thumbnail
    FROM resumes r
    LEFT JOIN videos v ON r.video_id = v.id
    WHERE r.id = ?
  `).get(result.lastInsertRowid);

  resume.skills = resume.skills ? JSON.parse(resume.skills) : [];
  resume.ai_tags = resume.ai_tags ? JSON.parse(resume.ai_tags) : [];

  res.json({ resume });
}

function updateResume(req, res) {
  const resumeId = req.params.id;
  const { title, skills, aiTags, videoId, isPublic } = req.body;

  const jobseeker = db.prepare('SELECT id FROM jobseekers WHERE user_id = ?').get(req.user.id);
  if (!jobseeker) {
    return res.status(404).json({ error: '求职者信息不存在' });
  }

  const resume = db.prepare('SELECT * FROM resumes WHERE id = ? AND jobseeker_id = ?').get(resumeId, jobseeker.id);
  if (!resume) {
    return res.status(404).json({ error: '简历不存在或无权限修改' });
  }

  const updateResume = db.prepare(`
    UPDATE resumes SET 
      title = COALESCE(?, title),
      skills = COALESCE(?, skills),
      ai_tags = COALESCE(?, ai_tags),
      video_id = COALESCE(?, video_id),
      is_public = COALESCE(?, is_public)
    WHERE id = ?
  `);

  updateResume.run(
    title,
    skills ? JSON.stringify(skills) : null,
    aiTags ? JSON.stringify(aiTags) : null,
    videoId,
    isPublic,
    resumeId
  );

  const updatedResume = db.prepare(`
    SELECT r.*, v.status as video_status, v.file_path as video_path, v.thumbnail as video_thumbnail
    FROM resumes r
    LEFT JOIN videos v ON r.video_id = v.id
    WHERE r.id = ?
  `).get(resumeId);

  updatedResume.skills = updatedResume.skills ? JSON.parse(updatedResume.skills) : [];
  updatedResume.ai_tags = updatedResume.ai_tags ? JSON.parse(updatedResume.ai_tags) : [];

  res.json({ resume: updatedResume });
}

function getMyResumes(req, res) {
  const jobseeker = db.prepare('SELECT id FROM jobseekers WHERE user_id = ?').get(req.user.id);
  if (!jobseeker) {
    return res.status(404).json({ error: '求职者信息不存在' });
  }

  const resumes = db.prepare(`
    SELECT r.*, v.status as video_status, v.file_path as video_path, v.thumbnail as video_thumbnail
    FROM resumes r
    LEFT JOIN videos v ON r.video_id = v.id
    WHERE r.jobseeker_id = ?
    ORDER BY r.created_at DESC
  `).all(jobseeker.id);

  resumes.forEach(resume => {
    resume.skills = resume.skills ? JSON.parse(resume.skills) : [];
    resume.ai_tags = resume.ai_tags ? JSON.parse(resume.ai_tags) : [];
  });

  res.json({ resumes });
}

function getResumeDetail(req, res) {
  const resumeId = req.params.id;

  const resume = db.prepare(`
    SELECT r.*, j.name as jobseeker_name, j.education, j.experience, j.phone,
           v.status as video_status, v.file_path as video_path, v.thumbnail as video_thumbnail
    FROM resumes r
    JOIN jobseekers j ON r.jobseeker_id = j.id
    LEFT JOIN videos v ON r.video_id = v.id
    WHERE r.id = ?
  `).get(resumeId);

  if (!resume) {
    return res.status(404).json({ error: '简历不存在' });
  }

  resume.skills = resume.skills ? JSON.parse(resume.skills) : [];
  resume.ai_tags = resume.ai_tags ? JSON.parse(resume.ai_tags) : [];

  res.json({ resume });
}

module.exports = { createResume, updateResume, getMyResumes, getResumeDetail };
