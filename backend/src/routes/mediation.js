const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/:caseId/meetings', (req, res) => {
  const meetings = db.prepare(`
    SELECT * FROM mediation_meetings
    WHERE case_id = ? ORDER BY meeting_time DESC
  `).all(req.params.caseId);
  
  const meetingsWithPhotos = meetings.map(meeting => {
    const photos = db.prepare(`
      SELECT * FROM mediation_photos WHERE meeting_id = ?
    `).all(meeting.id);
    return { ...meeting, photos };
  });
  
  res.json(meetingsWithPhotos);
});

router.post('/:caseId/meetings', (req, res) => {
  const {
    meeting_time,
    meeting_location,
    mediator,
    participants,
    dispute_focus,
    mediation_plan,
    result,
    next_step
  } = req.body;
  
  const result2 = db.prepare(`
    INSERT INTO mediation_meetings (case_id, meeting_time, meeting_location, mediator,
                                    participants, dispute_focus, mediation_plan, result, next_step)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    req.params.caseId,
    meeting_time,
    meeting_location,
    mediator,
    participants,
    dispute_focus,
    mediation_plan,
    result,
    next_step
  );
  
  db.prepare("UPDATE cases SET status = 'mediating', updated_at = CURRENT_TIMESTAMP WHERE id = ?")
    .run(req.params.caseId);
  
  res.json({ id: result2.lastInsertRowid, message: '调解会议记录添加成功' });
});

router.put('/meetings/:id', (req, res) => {
  const {
    meeting_time,
    meeting_location,
    mediator,
    participants,
    dispute_focus,
    mediation_plan,
    result,
    next_step
  } = req.body;
  
  db.prepare(`
    UPDATE mediation_meetings SET meeting_time = ?, meeting_location = ?, mediator = ?,
                                  participants = ?, dispute_focus = ?, mediation_plan = ?,
                                  result = ?, next_step = ?
    WHERE id = ?
  `).run(
    meeting_time,
    meeting_location,
    mediator,
    participants,
    dispute_focus,
    mediation_plan,
    result,
    next_step,
    req.params.id
  );
  
  res.json({ message: '调解会议记录更新成功' });
});

router.delete('/meetings/:id', (req, res) => {
  db.prepare('DELETE FROM mediation_photos WHERE meeting_id = ?').run(req.params.id);
  db.prepare('DELETE FROM mediation_meetings WHERE id = ?').run(req.params.id);
  res.json({ message: '删除成功' });
});

module.exports = router;
