const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../database');
const { authenticateToken } = require('../middleware/auth');
const { createAuditLog } = require('../utils/audit');

const router = express.Router();

router.get('/', authenticateToken, (req, res) => {
  const { status, startDate, endDate, search } = req.query;
  
  let query = `
    SELECT m.*, 
           u.name as organizer_name,
           (SELECT COUNT(*) FROM action_items WHERE meeting_id = m.id) as action_item_count
    FROM meetings m
    LEFT JOIN users u ON m.organizer_id = u.id
    WHERE 1=1
  `;
  const params = [];

  if (status) {
    query += ' AND m.status = ?';
    params.push(status);
  }
  if (startDate) {
    query += ' AND m.meeting_date >= ?';
    params.push(startDate);
  }
  if (endDate) {
    query += ' AND m.meeting_date <= ?';
    params.push(endDate);
  }
  if (search) {
    query += ' AND (m.title LIKE ? OR m.description LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  query += ' ORDER BY m.meeting_date DESC, m.created_at DESC';

  const meetings = db.prepare(query).all(...params);
  res.json(meetings);
});

router.get('/:id', authenticateToken, (req, res) => {
  const meeting = db.prepare(`
    SELECT m.*, 
           u.name as organizer_name
    FROM meetings m
    LEFT JOIN users u ON m.organizer_id = u.id
    WHERE m.id = ?
  `).get(req.params.id);
  
  if (!meeting) {
    return res.status(404).json({ error: '会议不存在' });
  }
  
  const actionItems = db.prepare(`
    SELECT ai.*, u.name as assignee_name
    FROM action_items ai
    LEFT JOIN users u ON ai.assignee_id = u.id
    WHERE ai.meeting_id = ?
    ORDER BY ai.created_at DESC
  `).all(req.params.id);

  const auditLogs = db.prepare(`
    SELECT * FROM audit_logs 
    WHERE entity_type = 'meeting' AND entity_id = ?
    ORDER BY created_at DESC
  `).all(req.params.id);

  res.json({ ...meeting, action_items: actionItems, audit_logs: auditLogs });
});

router.post('/', authenticateToken, (req, res) => {
  const { title, description, meeting_date, organizer_id, content } = req.body;

  const validationErrors = [];
  if (!title || title.trim() === '') {
    validationErrors.push('会议标题不能为空');
  }
  if (!meeting_date) {
    validationErrors.push('会议日期不能为空');
  }

  if (validationErrors.length > 0) {
    return res.status(400).json({ errors: validationErrors });
  }

  const id = uuidv4();
  const stmt = db.prepare(`
    INSERT INTO meetings (id, title, description, meeting_date, organizer_id, content, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(id, title, description, meeting_date, organizer_id || req.user.id, content, req.user.id);

  createAuditLog({
    actionType: 'create',
    entityType: 'meeting',
    entityId: id,
    operatorId: req.user.id,
    operatorName: req.user.name,
    reason: '创建会议记录',
    newValue: { title, description, meeting_date, organizer_id, content },
    recoveryPath: `/meetings/${id}/edit`
  });

  const meeting = db.prepare('SELECT * FROM meetings WHERE id = ?').get(id);
  res.status(201).json(meeting);
});

router.put('/:id', authenticateToken, (req, res) => {
  const { title, description, meeting_date, organizer_id, content, status } = req.body;
  const meetingId = req.params.id;

  const oldMeeting = db.prepare('SELECT * FROM meetings WHERE id = ?').get(meetingId);
  if (!oldMeeting) {
    return res.status(404).json({ error: '会议不存在' });
  }

  const validationErrors = [];
  if (title && title.trim() === '') {
    validationErrors.push('会议标题不能为空');
  }
  if (validationErrors.length > 0) {
    return res.status(400).json({ errors: validationErrors });
  }

  const stmt = db.prepare(`
    UPDATE meetings 
    SET title = COALESCE(?, title),
        description = COALESCE(?, description),
        meeting_date = COALESCE(?, meeting_date),
        organizer_id = COALESCE(?, organizer_id),
        content = COALESCE(?, content),
        status = COALESCE(?, status),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);

  stmt.run(title, description, meeting_date, organizer_id, content, status, meetingId);

  createAuditLog({
    actionType: 'update',
    entityType: 'meeting',
    entityId: meetingId,
    operatorId: req.user.id,
    operatorName: req.user.name,
    reason: '更新会议记录',
    oldValue: oldMeeting,
    newValue: { title, description, meeting_date, organizer_id, content, status },
    recoveryPath: `/meetings/${meetingId}/revert`
  });

  const meeting = db.prepare('SELECT * FROM meetings WHERE id = ?').get(meetingId);
  res.json(meeting);
});

router.delete('/:id', authenticateToken, (req, res) => {
  const meetingId = req.params.id;
  const oldMeeting = db.prepare('SELECT * FROM meetings WHERE id = ?').get(meetingId);
  
  if (!oldMeeting) {
    return res.status(404).json({ error: '会议不存在' });
  }

  db.prepare('UPDATE meetings SET status = ? WHERE id = ?').run('deleted', meetingId);

  createAuditLog({
    actionType: 'delete',
    entityType: 'meeting',
    entityId: meetingId,
    operatorId: req.user.id,
    operatorName: req.user.name,
    reason: '删除会议记录',
    oldValue: oldMeeting,
    recoveryPath: `/meetings/${meetingId}/restore`
  });

  res.json({ message: '会议已删除' });
});

router.post('/extract-actions', authenticateToken, async (req, res) => {
  const { content } = req.body;
  
  if (!content || content.trim() === '') {
    return res.status(400).json({ error: '会议纪要内容不能为空' });
  }

  setTimeout(() => {
    const extractedItems = extractActionItems(content);
    res.json({ items: extractedItems });
  }, 1500);
});

function extractActionItems(content) {
  const items = [];
  const users = db.prepare('SELECT id, name FROM users').all();
  
  const lines = content.split('\n').filter(line => line.trim().length > 0);
  
  const actionPatterns = [
    /(.+?)(负责|承担|完成|跟进|处理|对接|牵头|主导)(.+)/,
    /(.+?)[:：]\s*(.+)/,
    /^\d+[.、]\s*(.+)/,
    /^[•·-]\s*(.+)/
  ];
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length < 5) continue;
    
    let matched = false;
    
    for (const pattern of actionPatterns) {
      const match = trimmed.match(pattern);
      if (match) {
        const item = parseActionItem(match[0] || trimmed, users);
        if (item) {
          items.push(item);
          matched = true;
          break;
        }
      }
    }
    
    if (!matched && (trimmed.includes('完成') || trimmed.includes('交付') || trimmed.includes('提交'))) {
      const item = parseActionItem(trimmed, users);
      if (item) {
        items.push(item);
      }
    }
  }
  
  const uniqueItems = [];
  const seenTitles = new Set();
  for (const item of items) {
    if (!seenTitles.has(item.title.substring(0, 20))) {
      uniqueItems.push(item);
      seenTitles.add(item.title.substring(0, 20));
    }
  }
  
  return uniqueItems.slice(0, 10);
}

function parseActionItem(text, users) {
  let title = text.replace(/^\d+[.、]\s*/, '').replace(/^[•·-]\s*/, '').trim();
  let assignee_id = null;
  let assignee_name = null;
  let due_date = null;
  let priority = 'medium';
  let description = '';
  
  for (const user of users) {
    if (text.includes(user.name)) {
      assignee_id = user.id;
      assignee_name = user.name;
      title = title.replace(new RegExp(user.name, 'g'), '').trim();
      break;
    }
  }
  
  const datePatterns = [
    /(\d{1,2})月(\d{1,2})日/,
    /(\d{4})[-年](\d{1,2})[-月](\d{1,2})日?/,
    /下(周[一二三四五六日])/,
    /本(周[一二三四五六日])/,
    /([下本])周/,
    /(\d{1,2})号/
  ];
  
  const today = new Date();
  
  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) {
      if (match[0].includes('下周')) {
        const nextWeek = new Date(today);
        nextWeek.setDate(nextWeek.getDate() + 7);
        due_date = nextWeek.toISOString().split('T')[0];
      } else if (match[0].includes('本周')) {
        due_date = today.toISOString().split('T')[0];
      } else if (match.length === 3 && match[0].includes('月')) {
        const month = parseInt(match[1]);
        const day = parseInt(match[2]);
        const year = today.getFullYear();
        due_date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      } else if (match.length === 4) {
        due_date = `${match[1]}-${String(match[2]).padStart(2, '0')}-${String(match[3]).padStart(2, '0')}`;
      } else if (match[1] && !isNaN(parseInt(match[1]))) {
        const day = parseInt(match[1]);
        due_date = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      }
      title = title.replace(pattern, '').trim();
      break;
    }
  }
  
  if (text.includes('紧急') || text.includes('尽快') || text.includes('马上')) {
    priority = 'high';
  } else if (text.includes('后续') || text.includes('后续') || text.includes('有空')) {
    priority = 'low';
  }
  
  title = title.replace(/[，。、：:;；!！?？]/g, '').trim();
  title = title.replace(/(负责|承担|完成|跟进|处理|对接|牵头|主导|需要|要|请|需)/g, '').trim();
  title = title.replace(/^\s*[0-9一二三四五六七八九十]+[.、\s]*/, '').trim();
  
  if (title.length < 2) {
    return null;
  }
  
  if (title.length > 50) {
    description = title.substring(30);
    title = title.substring(0, 30) + '...';
  }
  
  return {
    title,
    description,
    assignee_id,
    assignee_name,
    due_date,
    priority
  };
}

module.exports = router;
