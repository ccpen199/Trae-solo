const { db } = require('../database');

function getChannelCostAnalysis(companyId, days = 30) {
  const stmt = db.prepare(`
    SELECT 
      rc.id,
      rc.name,
      rc.cost_per_candidate,
      rc.total_spent,
      rc.total_candidates,
      COUNT(DISTINCT i.id) as interviews,
      SUM(CASE WHEN i.passed = 1 THEN 1 ELSE 0 END) as passed_interviews,
      SUM(CASE WHEN i.hired = 1 THEN 1 ELSE 0 END) as hired,
      SUM(CASE WHEN i.retention_30d = 1 THEN 1 ELSE 0 END) as retained_30d
    FROM recruitment_channels rc
    LEFT JOIN interviews i ON rc.id = i.channel_id
    WHERE rc.company_id = ?
      AND (i.created_at IS NULL OR JULIANDAY(CURRENT_TIMESTAMP) - JULIANDAY(i.created_at) <= ?)
    GROUP BY rc.id
  `);

  const channels = stmt.all(companyId, days);
  
  return channels.map(channel => {
    const interviewPassRate = channel.interviews > 0 
      ? Math.round((channel.passed_interviews / channel.interviews) * 100) 
      : 0;
    
    const qualityScore = channel.hired > 0
      ? Math.round(interviewPassRate * 0.6 + (channel.retained_30d / channel.hired) * 100 * 0.4)
      : 0;

    const cpa = channel.total_candidates > 0 
      ? Math.round(channel.total_spent / channel.total_candidates) 
      : 0;

    const cph = channel.hired > 0 
      ? Math.round(channel.total_spent / channel.hired) 
      : 0;

    return {
      ...channel,
      interviewPassRate,
      qualityScore,
      costPerApplicant: cpa,
      costPerHire: cph,
      roi: channel.hired > 0 ? Math.round(channel.hired * 10000 / channel.total_spent * 100) / 100 : 0
    };
  });
}

function getTeamEfficiency(companyId, days = 30) {
  const stmt = db.prepare(`
    SELECT 
      u.id,
      u.email,
      u.role,
      COUNT(DISTINCT i.id) as interviews_conducted,
      SUM(CASE WHEN i.hired = 1 THEN 1 ELSE 0 END) as hires_made,
      AVG(CASE WHEN i.passed = 1 THEN 1 ELSE 0 END) as pass_rate
    FROM users u
    LEFT JOIN interviews i ON u.id = i.interviewer_id
    WHERE u.company_id = ?
      AND (i.created_at IS NULL OR JULIANDAY(CURRENT_TIMESTAMP) - JULIANDAY(i.created_at) <= ?)
    GROUP BY u.id
  `);

  const teamMembers = stmt.all(companyId, days);
  const months = days / 30;

  return teamMembers.map(member => ({
    ...member,
    passRate: Math.round((member.pass_rate || 0) * 100),
    hiresPerMonth: Math.round((member.hires_made / months) * 10) / 10,
    timeToHire: member.hires_made > 0 ? Math.round(days / member.hires_made) : null
  }));
}

function getRecruitmentFunnel(companyId, days = 30) {
  const stmt = db.prepare(`
    SELECT 
      COUNT(*) as total_candidates,
      SUM(CASE WHEN status = 'scheduled' THEN 1 ELSE 0 END) as scheduled,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
      SUM(CASE WHEN passed = 1 THEN 1 ELSE 0 END) as passed,
      SUM(CASE WHEN hired = 1 THEN 1 ELSE 0 END) as hired
    FROM interviews
    WHERE company_id = ?
      AND JULIANDAY(CURRENT_TIMESTAMP) - JULIANDAY(created_at) <= ?
  `);

  const result = stmt.get(companyId, days);
  
  return {
    ...result,
    conversionRates: {
      toInterview: result.total_candidates > 0 
        ? Math.round((result.scheduled / result.total_candidates) * 100) : 0,
      toPass: result.scheduled > 0 
        ? Math.round((result.passed / result.scheduled) * 100) : 0,
      toHire: result.passed > 0 
        ? Math.round((result.hired / result.passed) * 100) : 0,
      overall: result.total_candidates > 0 
        ? Math.round((result.hired / result.total_candidates) * 100) : 0
    }
  };
}

function getDashboardMetrics(companyId) {
  const channels = getChannelCostAnalysis(companyId, 30);
  const team = getTeamEfficiency(companyId, 30);
  const funnel = getRecruitmentFunnel(companyId, 30);

  const totalSpent = channels.reduce((sum, c) => sum + c.total_spent, 0);
  const totalHires = channels.reduce((sum, c) => sum + c.hired, 0);
  const avgQualityScore = channels.length > 0 
    ? Math.round(channels.reduce((sum, c) => sum + c.qualityScore, 0) / channels.length) 
    : 0;
  const avgHiresPerMonth = team.length > 0
    ? Math.round(team.reduce((sum, m) => sum + m.hiresPerMonth, 0) / team.length * 10) / 10
    : 0;

  return {
    overview: {
      totalSpent,
      totalHires,
      avgCostPerHire: totalHires > 0 ? Math.round(totalSpent / totalHires) : 0,
      avgQualityScore,
      avgHiresPerMonth,
      openPositions: db.prepare("SELECT COUNT(*) as count FROM jobs WHERE company_id = ? AND status = 'published'").get(companyId).count,
      totalCandidates: db.prepare('SELECT COUNT(*) as count FROM candidates WHERE company_id = ?').get(companyId).count
    },
    topChannels: channels
      .sort((a, b) => b.qualityScore - a.qualityScore)
      .slice(0, 3),
    bottomChannels: channels
      .filter(c => c.qualityScore > 0)
      .sort((a, b) => a.qualityScore - b.qualityScore)
      .slice(0, 3),
    topPerformers: team
      .sort((a, b) => b.hiresPerMonth - a.hiresPerMonth)
      .slice(0, 3),
    funnel
  };
}

function addRecruitmentChannel(companyId, name, costPerCandidate) {
  const stmt = db.prepare(`
    INSERT INTO recruitment_channels (company_id, name, cost_per_candidate)
    VALUES (?, ?, ?)
  `);
  
  return stmt.run(companyId, name, costPerCandidate).lastInsertRowid;
}

function recordInterview(interviewData) {
  const stmt = db.prepare(`
    INSERT INTO interviews (
      company_id, candidate_id, job_id, channel_id, status, 
      interviewer_id, scheduled_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  
  return stmt.run(
    interviewData.company_id || 1,
    interviewData.candidate_id,
    interviewData.job_id,
    interviewData.channel_id || null,
    interviewData.status || 'scheduled',
    interviewData.interviewer_id,
    interviewData.scheduled_at
  ).lastInsertRowid;
}

function updateInterviewResult(interviewId, passed, hired, retention30d = null) {
  const stmt = db.prepare(`
    UPDATE interviews 
    SET passed = ?, hired = ?, retention_30d = ?, status = 'completed'
    WHERE id = ?
  `);
  
  stmt.run(passed ? 1 : 0, hired ? 1 : 0, retention30d ? 1 : 0, interviewId);
  
  if (hired) {
    const updateStmt = db.prepare(`
      UPDATE recruitment_channels 
      SET total_candidates = total_candidates + 1,
          total_spent = total_spent + cost_per_candidate
      WHERE id = (SELECT channel_id FROM interviews WHERE id = ?)
    `);
    updateStmt.run(interviewId);
  }
}

module.exports = {
  getChannelCostAnalysis,
  getTeamEfficiency,
  getRecruitmentFunnel,
  getDashboardMetrics,
  addRecruitmentChannel,
  recordInterview,
  updateInterviewResult
};
