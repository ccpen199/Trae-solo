
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../database/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/conversations', authenticateToken, (req, res) => {
  const conversations = db.prepare(`
    SELECT DISTINCT 
      CASE WHEN sender_id = ? THEN receiver_id ELSE sender_id END as other_user_id,
      conversation_id,
      MAX(created_at) as last_message_at
    FROM im_messages 
    WHERE sender_id = ? OR receiver_id = ?
    GROUP BY conversation_id, other_user_id
    ORDER BY last_message_at DESC
  `).all(req.user.id, req.user.id, req.user.id);

  const result = conversations.map(conv => {
    const otherUser = db.prepare(`
      SELECT id, username, real_name, avatar, role, credit_score FROM users WHERE id = ?
    `).get(conv.other_user_id);

    const lastMessage = db.prepare(`
      SELECT * FROM im_messages 
      WHERE conversation_id = ? 
      ORDER BY created_at DESC LIMIT 1
    `).get(conv.conversation_id);

    const unreadCount = db.prepare(`
      SELECT COUNT(*) as count FROM im_messages 
      WHERE conversation_id = ? AND receiver_id = ? AND is_read = 0
    `).get(conv.conversation_id, req.user.id).count;

    return {
      conversation_id: conv.conversation_id,
      other_user: otherUser,
      last_message: lastMessage,
      unread_count: unreadCount,
      last_message_at: conv.last_message_at
    };
  });

  res.json(result);
});

router.get('/messages/:conversationId', authenticateToken, (req, res) => {
  const { page = 1, pageSize = 50 } = req.query;
  const offset = (page - 1) * pageSize;

  const messages = db.prepare(`
    SELECT m.*, 
           u.real_name as sender_name, u.avatar as sender_avatar,
           r.candidate_name, r.current_position, r.current_company
    FROM im_messages m
    LEFT JOIN users u ON m.sender_id = u.id
    LEFT JOIN resumes r ON m.resume_id = r.id
    WHERE m.conversation_id = ?
    ORDER BY m.created_at DESC
    LIMIT ? OFFSET ?
  `).all(req.params.conversationId, parseInt(pageSize), offset).reverse();

  db.prepare(`
    UPDATE im_messages 
    SET is_read = 1 
    WHERE conversation_id = ? AND receiver_id = ? AND is_read = 0
  `).run(req.params.conversationId, req.user.id);

  res.json({ list: messages, page: parseInt(page), pageSize: parseInt(pageSize) });
});

router.post('/messages', authenticateToken, (req, res) => {
  const { receiver_id, content, message_type = 'text', resume_id, interview_id } = req.body;

  if (!receiver_id) {
    return res.status(400).json({ error: '接收者ID不能为空' });
  }

  const receiver = db.prepare('SELECT id FROM users WHERE id = ?').get(receiver_id);
  if (!receiver) {
    return res.status(404).json({ error: '接收者不存在' });
  }

  const participantIds = [req.user.id, receiver_id].sort();
  const conversation_id = `conv_${participantIds.join('_')}`;

  const stmt = db.prepare(`
    INSERT INTO im_messages (
      conversation_id, sender_id, receiver_id, message_type,
      content, resume_id, interview_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const info = stmt.run(
    conversation_id, req.user.id, receiver_id, message_type,
    content, resume_id, interview_id
  );

  const message = db.prepare(`
    SELECT m.*, u.real_name as sender_name, u.avatar as sender_avatar
    FROM im_messages m
    LEFT JOIN users u ON m.sender_id = u.id
    WHERE m.id = ?
  `).get(info.lastInsertRowid);

  if (resume_id) {
    const resume = db.prepare('SELECT candidate_name, current_position FROM resumes WHERE id = ?').get(resume_id);
    message.resume = resume;
  }

  res.status(201).json(message);
});

router.post('/interview/schedule', authenticateToken, async (req, res) => {
  const { recommendation_id, round, interview_type, scheduled_at, interviewer } = req.body;

  if (!recommendation_id || !scheduled_at) {
    return res.status(400).json({ error: '推荐ID和面试时间不能为空' });
  }

  const recommendation = db.prepare('SELECT * FROM recommendations WHERE id = ?').get(recommendation_id);
  if (!recommendation) {
    return res.status(404).json({ error: '推荐记录不存在' });
  }

  const roomId = `room_${uuidv4().replace(/-/g, '').slice(0, 16)}`;

  const insertInterview = db.prepare(`
    INSERT INTO interviews (
      recommendation_id, round, interview_type, scheduled_at,
      interviewer, webrtc_room, status
    ) VALUES (?, ?, ?, ?, ?, ?, 'scheduled')
  `);

  const interviewInfo = insertInterview.run(
    recommendation_id, round || 1, interview_type || 'video',
    scheduled_at, interviewer, roomId
  );

  db.prepare(`
    INSERT INTO video_rooms (
      room_id, interview_id, host_id, participant_ids, status
    ) VALUES (?, ?, ?, ?, 'waiting')
  `).run(roomId, interviewInfo.lastInsertRowid, req.user.id, JSON.stringify([req.user.id, recommendation.referrer_id]));

  const participantIds = [req.user.id, recommendation.referrer_id].sort();
  const conversation_id = `conv_${participantIds.join('_')}`;

  db.prepare(`
    INSERT INTO im_messages (
      conversation_id, sender_id, receiver_id, message_type,
      content, interview_id
    ) VALUES (?, ?, ?, 'interview_invite', ?, ?)
  `).run(
    conversation_id, req.user.id, recommendation.referrer_id,
    `面试邀请：${interview_type === 'video' ? '视频面试' : '现场面试'}，时间：${scheduled_at}`,
    interviewInfo.lastInsertRowid
  );

  db.prepare(`
    UPDATE recommendations 
    SET status = 'interviewing', updated_at = CURRENT_TIMESTAMP 
    WHERE id = ?
  `).run(recommendation_id);

  res.status(201).json({
    id: interviewInfo.lastInsertRowid,
    room_id: roomId,
    webrtc_config: {
      roomId,
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ],
      joinUrl: `/webrtc/join/${roomId}`
    },
    scheduled_at,
    interview_type
  });
});

router.get('/interview/:id/join', authenticateToken, (req, res) => {
  const interview = db.prepare(`
    SELECT i.*, vr.room_id, vr.participant_ids, vr.status as room_status
    FROM interviews i
    LEFT JOIN video_rooms vr ON i.webrtc_room = vr.room_id
    WHERE i.id = ?
  `).get(req.params.id);

  if (!interview) {
    return res.status(404).json({ error: '面试不存在' });
  }

  const participants = JSON.parse(interview.participant_ids || '[]');
  if (!participants.includes(req.user.id) && req.user.role !== 'admin') {
    return res.status(403).json({ error: '您不是该面试的参与者' });
  }

  if (interview.room_status === 'waiting') {
    db.prepare(`
      UPDATE video_rooms SET status = 'active', started_at = CURRENT_TIMESTAMP 
      WHERE room_id = ?
    `).run(interview.room_id);
  }

  res.json({
    room_id: interview.room_id,
    interview_id: interview.id,
    webrtc_config: {
      roomId: interview.room_id,
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' }
      ],
      token: `webrtc_token_${Date.now()}_${req.user.id}`
    },
    participant_ids: participants,
    scheduled_at: interview.scheduled_at,
    interview_type: interview.interview_type
  });
});

router.post('/interview/:id/summary', authenticateToken, (req, res) => {
  const { feedback, result } = req.body;
  const interviewId = req.params.id;

  const interview = db.prepare('SELECT * FROM interviews WHERE id = ?').get(interviewId);
  if (!interview) {
    return res.status(404).json({ error: '面试记录不存在' });
  }

  const aiSummary = generateAISummary(interview, feedback, result);

  db.prepare(`
    UPDATE interviews 
    SET feedback = ?, result = ?, ai_summary = ?, status = ?, updated_at = CURRENT_TIMESTAMP 
    WHERE id = ?
  `).run(feedback, result, aiSummary, result === 'pass' ? 'passed' : 'failed', interviewId);

  res.json({
    id: interviewId,
    ai_summary: aiSummary,
    result,
    feedback
  });
});

router.post('/interview/:id/end', authenticateToken, (req, res) => {
  const interview = db.prepare('SELECT * FROM interviews WHERE id = ?').get(req.params.id);
  if (!interview) {
    return res.status(404).json({ error: '面试记录不存在' });
  }

  db.prepare(`
    UPDATE video_rooms 
    SET status = 'ended', ended_at = CURRENT_TIMESTAMP 
    WHERE interview_id = ?
  `).run(req.params.id);

  db.prepare(`
    UPDATE interviews 
    SET status = 'completed', updated_at = CURRENT_TIMESTAMP 
    WHERE id = ?
  `).run(req.params.id);

  res.json({ message: '面试已结束' });
});

function generateAISummary(interview, feedback, result) {
  const strengths = [];
  const weaknesses = [];
  const suggestions = [];

  const feedbackLower = (feedback || '').toLowerCase();

  if (feedbackLower.includes('技术') || feedbackLower.includes('能力')) {
    strengths.push('技术能力扎实');
  }
  if (feedbackLower.includes('沟通') || feedbackLower.includes('表达')) {
    strengths.push('沟通表达能力良好');
  }
  if (feedbackLower.includes('经验') || feedbackLower.includes('项目')) {
    strengths.push('项目经验丰富');
  }
  if (feedbackLower.includes('逻辑') || feedbackLower.includes('思维')) {
    strengths.push('逻辑思维清晰');
  }
  if (strengths.length === 0) {
    strengths.push('整体表现符合岗位要求');
  }

  if (feedbackLower.includes('不足') || feedbackLower.includes('欠缺')) {
    weaknesses.push('部分技术深度有待提升');
  }
  if (feedbackLower.includes('紧张') || feedbackLower.includes('不够')) {
    weaknesses.push('面试表现稍显紧张');
  }
  if (weaknesses.length === 0 && result !== 'pass') {
    weaknesses.push('与岗位要求存在一定差距');
  }

  if (result === 'pass') {
    suggestions.push('建议进入下一轮面试');
    suggestions.push('可重点考察技术深度和系统设计能力');
  } else if (result === 'fail') {
    suggestions.push('建议加入人才库，后续有合适岗位可再联系');
    suggestions.push('可提供面试反馈帮助候选人成长');
  } else {
    suggestions.push('建议综合评估后决定');
  }

  const summary = `
【面试纪要 AI 摘要】
面试编号: #${interview.id}
面试轮次: 第 ${interview.round} 轮
面试类型: ${interview.interview_type === 'video' ? '视频面试' : '现场面试'}
面试结果: ${result === 'pass' ? '通过' : result === 'fail' ? '未通过' : '待定'}

一、候选人优势
${strengths.map((s, i) => `${i + 1}. ${s}`).join('\n')}

二、待改进方面
${weaknesses.length > 0 ? weaknesses.map((w, i) => `${i + 1}. ${w}`).join('\n') : '无明显短板'}

三、面试官评价
${feedback || '无详细评价'}

四、后续建议
${suggestions.map((s, i) => `${i + 1}. ${s}`).join('\n')}

---
*本摘要由 AI 自动生成，仅供参考*
  `.trim();

  return summary;
}

module.exports = router;
