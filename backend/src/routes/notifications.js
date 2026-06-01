const express = require('express');
const router = express.Router();
const db = require('../database/init');

router.get('/', (req, res) => {
  const { status, schedule_id } = req.query;
  let query = 'SELECT * FROM notifications WHERE 1=1';
  const params = [];

  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }
  if (schedule_id) {
    query += ' AND schedule_id = ?';
    params.push(schedule_id);
  }
  query += ' ORDER BY created_at DESC';

  const notifications = db.prepare(query).all(...params);
  res.json(notifications);
});

router.post('/', (req, res) => {
  const { schedule_id, recipient_type, recipient_name, recipient_contact, notification_type, content } = req.body;
  const result = db.prepare(`
    INSERT INTO notifications (schedule_id, recipient_type, recipient_name, recipient_contact, notification_type, content)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(schedule_id, recipient_type, recipient_name, recipient_contact, notification_type, content);

  res.status(201).json({ id: result.lastInsertRowid, ...req.body, status: 'pending' });
});

router.post('/generate', (req, res) => {
  const { schedule_id } = req.body;

  const schedule = db.prepare(`
    SELECT s.*, c.case_number, c.case_reason, c.parties, c.agents,
           ct.name as court_name, j.name as judge_name
    FROM schedules s
    JOIN cases c ON s.case_id = c.id
    JOIN courts ct ON s.court_id = ct.id
    JOIN judges j ON s.judge_id = j.id
    WHERE s.id = ?
  `).get(schedule_id);

  if (!schedule) {
    return res.status(404).json({ error: 'Schedule not found' });
  }

  const notifications = [];
  const content = `【开庭通知】案号: ${schedule.case_number}, 案由: ${schedule.case_reason}, 时间: ${schedule.start_time}, 法庭: ${schedule.court_name}, 法官: ${schedule.judge_name}`;

  const parties = schedule.parties.split(/[,，、]/).filter(p => p.trim());
  parties.forEach(party => {
    const result = db.prepare(`
      INSERT INTO notifications (schedule_id, recipient_type, recipient_name, recipient_contact, notification_type, content)
      VALUES (?, 'party', ?, '13800138000', 'scheduling', ?)
    `).run(schedule_id, party.trim(), content);
    notifications.push({ id: result.lastInsertRowid, recipient_name: party.trim() });
  });

  if (schedule.agents) {
    const agents = schedule.agents.split(/[,，、]/).filter(a => a.trim());
    agents.forEach(agent => {
      const result = db.prepare(`
        INSERT INTO notifications (schedule_id, recipient_type, recipient_name, recipient_contact, notification_type, content)
        VALUES (?, 'lawyer', ?, '13800138001', 'scheduling', ?)
      `).run(schedule_id, agent.trim(), content);
      notifications.push({ id: result.lastInsertRowid, recipient_name: agent.trim() });
    });
  }

  const judgeResult = db.prepare(`
    INSERT INTO notifications (schedule_id, recipient_type, recipient_name, recipient_contact, notification_type, content)
    VALUES (?, 'judge', ?, '13800138002', 'scheduling', ?)
  `).run(schedule_id, schedule.judge_name, content);
  notifications.push({ id: judgeResult.lastInsertRowid, recipient_name: schedule.judge_name });

  db.prepare(`
    INSERT INTO case_timeline (case_id, event_type, event_content, operator)
    VALUES (?, 'notification', '已生成开庭通知，共 ' || ? || ' 条', 'system')
  `).run(schedule.case_id, notifications.length);

  res.status(201).json({ message: '通知已生成', count: notifications.length, notifications });
});

router.put('/:id/status', (req, res) => {
  const { id } = req.params;
  const { status, failure_reason } = req.body;

  db.prepare(`
    UPDATE notifications 
    SET status = ?, send_time = CURRENT_TIMESTAMP, failure_reason = ?
    WHERE id = ?
  `).run(status, failure_reason || null, id);

  const notification = db.prepare('SELECT * FROM notifications WHERE id = ?').get(id);
  
  if (status === 'failed') {
    const schedule = db.prepare('SELECT case_id FROM schedules WHERE id = ?').get(notification.schedule_id);
    if (schedule) {
      db.prepare(`
        INSERT INTO case_timeline (case_id, event_type, event_content, operator)
        VALUES (?, 'notification_failed', ?, 'system')
      `).run(schedule.case_id, `通知发送失败: ${notification.recipient_name} - ${failure_reason}`);
    }
  }

  res.json({ message: '通知状态已更新' });
});

module.exports = router;
