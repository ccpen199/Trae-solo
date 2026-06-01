const { db } = require('../database');

const CHANNEL_PRIORITY = ['email', 'sms', 'in_app', 'phone'];
const CHANNEL_THRESHOLDS = {
  email: { views: 1, days: 7 },
  sms: { views: 3, days: 5 },
  in_app: { views: 5, days: 3 },
  phone: { views: 8, days: 1 }
};

function trackCandidateBehavior(candidateId, jobId, action) {
  const checkStmt = db.prepare(`
    SELECT id, action_count FROM candidate_behavior 
    WHERE candidate_id = ? AND job_id = ? AND action = ?
  `);
  
  const existing = checkStmt.get(candidateId, jobId, action);
  
  if (existing) {
    const updateStmt = db.prepare(`
      UPDATE candidate_behavior 
      SET action_count = action_count + 1, last_action_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    updateStmt.run(existing.id);
  } else {
    const insertStmt = db.prepare(`
      INSERT INTO candidate_behavior (candidate_id, job_id, action, action_count)
      VALUES (?, ?, ?, 1)
    `);
    insertStmt.run(candidateId, jobId, action);
  }
  
  return evaluateEngagement(candidateId, jobId);
}

function evaluateEngagement(candidateId, jobId) {
  const behaviorStmt = db.prepare(`
    SELECT action, action_count, 
           JULIANDAY(CURRENT_TIMESTAMP) - JULIANDAY(last_action_at) as days_ago
    FROM candidate_behavior
    WHERE candidate_id = ? AND job_id = ?
  `);
  
  const behaviors = behaviorStmt.all(candidateId, jobId);
  
  const viewBehavior = behaviors.find(b => b.action === 'view_job');
  const totalViews = viewBehavior ? viewBehavior.action_count : 0;
  const daysSinceLastView = viewBehavior ? viewBehavior.days_ago : 999;
  
  let recommendedChannel = 'email';
  let urgency = 'low';
  
  for (let i = CHANNEL_PRIORITY.length - 1; i >= 0; i--) {
    const channel = CHANNEL_PRIORITY[i];
    const threshold = CHANNEL_THRESHOLDS[channel];
    
    if (totalViews >= threshold.views && daysSinceLastView <= threshold.days) {
      recommendedChannel = channel;
      urgency = i > 1 ? 'high' : i > 0 ? 'medium' : 'low';
      break;
    }
  }
  
  return {
    totalViews,
    daysSinceLastView: Math.round(daysSinceLastView),
    recommendedChannel,
    urgency,
    nextBestAction: generateRecommendation(recommendedChannel, urgency, totalViews)
  };
}

function generateRecommendation(channel, urgency, views) {
  const templates = {
    email: {
      low: `候选人已浏览职位${views}次，建议发送个性化邮件进行初步沟通`,
      medium: `候选人活跃度较高，建议通过邮件邀请参加初面`,
      high: `候选人高度关注该职位，应立即发送重点邀约邮件`
    },
    sms: {
      low: `建议发送短信提醒候选人查看邮件`,
      medium: `通过短信发送面试邀请，提高触达率`,
      high: `紧急：通过短信发送邀约并请求确认`
    },
    in_app: {
      low: `发送站内信进行跟进`,
      medium: `站内信+推送通知组合触达`,
      high: `高频站内信提醒+即时推送`
    },
    phone: {
      low: `安排HR进行电话初步沟通`,
      medium: `直接电话邀约面试`,
      high: `紧急：立即致电候选人进行offer沟通`
    }
  };
  
  return templates[channel][urgency];
}

function sendInvitation(candidateId, jobId, channel, message) {
  const stmt = db.prepare(`
    INSERT INTO invitations (candidate_id, job_id, channel, status, message)
    VALUES (?, ?, ?, 'sent', ?)
  `);
  
  const result = stmt.run(candidateId, jobId, channel, message);
  
  return {
    invitationId: result.lastInsertRowid,
    channel,
    status: 'sent',
    timestamp: new Date().toISOString()
  };
}

function getInvitationsByCandidate(candidateId, limit = 20) {
  const stmt = db.prepare(`
    SELECT i.*, j.title as job_title
    FROM invitations i
    JOIN jobs j ON i.job_id = j.id
    WHERE i.candidate_id = ?
    ORDER BY i.sent_at DESC
    LIMIT ?
  `);
  
  return stmt.all(candidateId, limit);
}

function getCandidateEngagementScore(candidateId, days = 30) {
  const stmt = db.prepare(`
    SELECT 
      COUNT(DISTINCT job_id) as jobs_viewed,
      SUM(action_count) as total_actions,
      MAX(last_action_at) as last_activity
    FROM candidate_behavior
    WHERE candidate_id = ? 
      AND JULIANDAY(CURRENT_TIMESTAMP) - JULIANDAY(last_action_at) <= ?
  `);
  
  const result = stmt.get(candidateId, days);
  
  const score = Math.min(100, Math.round(
    (result.jobs_viewed * 10) + (result.total_actions * 5)
  ));
  
  return {
    score,
    jobsViewed: result.jobs_viewed || 0,
    totalActions: result.total_actions || 0,
    lastActivity: result.last_activity
  };
}

function getAutoInvitationCandidates(jobId, threshold = 5) {
  const stmt = db.prepare(`
    SELECT 
      cb.candidate_id,
      c.name,
      c.email,
      SUM(cb.action_count) as total_views,
      MAX(cb.last_action_at) as last_view
    FROM candidate_behavior cb
    JOIN candidates c ON cb.candidate_id = c.id
    WHERE cb.job_id = ? AND cb.action = 'view_job'
    GROUP BY cb.candidate_id
    HAVING total_views >= ?
    ORDER BY total_views DESC
  `);
  
  return stmt.all(jobId, threshold).map(row => ({
    ...row,
    recommendedChannel: evaluateEngagement(row.candidate_id, jobId).recommendedChannel
  }));
}

module.exports = {
  trackCandidateBehavior,
  evaluateEngagement,
  sendInvitation,
  getInvitationsByCandidate,
  getCandidateEngagementScore,
  getAutoInvitationCandidates
};
