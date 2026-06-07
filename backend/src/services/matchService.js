const db = require('../db');

const calculateMatchScore = (jobSeeker, resume, job) => {
  const scores = {
    technicalSkill: 0,
    experienceMatch: 0,
    educationMatch: 0,
    certificateMatch: 0,
    projectMatch: 0,
  };

  const certs = db.prepare('SELECT * FROM skill_certificates WHERE job_seeker_id = ?').all(jobSeeker.id);
  const jobAbility = job.ability_model ? JSON.parse(job.ability_model) : null;
  const resumeSkills = resume.skills ? JSON.parse(resume.skills) : [];

  if (jobAbility && jobAbility.technical && resumeSkills.length > 0) {
    const matchedSkills = jobAbility.technical.filter(skill =>
      resumeSkills.some(rs => rs.toLowerCase().includes(skill.toLowerCase()) || skill.toLowerCase().includes(rs.toLowerCase()))
    );
    scores.technicalSkill = Math.round((matchedSkills.length / jobAbility.technical.length) * 100);
  }

  if (job.work_experience_required && jobSeeker.work_years) {
    const expMatch = {
      '不限': 90,
      '1-3年': jobSeeker.work_years >= 1 ? (jobSeeker.work_years >= 3 ? 100 : 80) : 40,
      '3-5年': jobSeeker.work_years >= 3 ? (jobSeeker.work_years >= 5 ? 100 : 80) : 40,
      '5-10年': jobSeeker.work_years >= 5 ? (jobSeeker.work_years >= 10 ? 100 : 80) : 40,
      '10年以上': jobSeeker.work_years >= 10 ? 100 : 50,
    };
    scores.experienceMatch = expMatch[job.work_experience_required] || 70;
  }

  if (job.education_required && jobSeeker.education) {
    const eduLevels = { '高中': 1, '大专': 2, '本科': 3, '硕士': 4, '博士': 5 };
    const jobEdu = eduLevels[job.education_required] || 0;
    const seekerEdu = eduLevels[jobSeeker.education] || 0;
    scores.educationMatch = seekerEdu >= jobEdu ? 100 : (seekerEdu === jobEdu - 1 ? 60 : 30);
  }

  if (certs.length > 0) {
    const verifiedCerts = certs.filter(c => c.verified === 1);
    scores.certificateMatch = Math.min(verifiedCerts.length * 25, 100);
  }

  if (resume.project_experience) {
    try {
      const projects = JSON.parse(resume.project_experience);
      scores.projectMatch = Math.min(projects.length * 20, 100);
    } catch (e) {
      scores.projectMatch = 60;
    }
  }

  const overallScore = Math.round(
    scores.technicalSkill * 0.3 +
    scores.experienceMatch * 0.25 +
    scores.educationMatch * 0.15 +
    scores.certificateMatch * 0.15 +
    scores.projectMatch * 0.15
  );

  return {
    scores,
    overallScore,
    dimensions: [
      { name: '技能匹配', score: scores.technicalSkill },
      { name: '经验匹配', score: scores.experienceMatch },
      { name: '学历匹配', score: scores.educationMatch },
      { name: '证书匹配', score: scores.certificateMatch },
      { name: '项目匹配', score: scores.projectMatch },
    ]
  };
};

const saveMatchScore = (jobId, jobSeekerId, result) => {
  const existing = db.prepare('SELECT id FROM job_match_scores WHERE job_id = ? AND job_seeker_id = ?').get(jobId, jobSeekerId);
  
  const data = {
    job_id: jobId,
    job_seeker_id: jobSeekerId,
    technical_skill_score: result.scores.technicalSkill,
    experience_match_score: result.scores.experienceMatch,
    education_match_score: result.scores.educationMatch,
    certificate_match_score: result.scores.certificateMatch,
    project_match_score: result.scores.projectMatch,
    overall_score: result.overallScore,
    dimension_scores: JSON.stringify(result.dimensions),
  };

  if (existing) {
    db.prepare(`
      UPDATE job_match_scores SET
        technical_skill_score = ?, experience_match_score = ?, education_match_score = ?,
        certificate_match_score = ?, project_match_score = ?, overall_score = ?,
        dimension_scores = ?, created_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(data.technical_skill_score, data.experience_match_score, data.education_match_score,
           data.certificate_match_score, data.project_match_score, data.overall_score,
           data.dimension_scores, existing.id);
  } else {
    db.prepare(`
      INSERT INTO job_match_scores 
      (job_id, job_seeker_id, technical_skill_score, experience_match_score, education_match_score,
       certificate_match_score, project_match_score, overall_score, dimension_scores)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(jobId, jobSeekerId, data.technical_skill_score, data.experience_match_score,
           data.education_match_score, data.certificate_match_score, data.project_match_score,
           data.overall_score, data.dimension_scores);
  }

  return result;
};

module.exports = { calculateMatchScore, saveMatchScore };
