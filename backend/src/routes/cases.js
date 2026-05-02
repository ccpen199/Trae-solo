const express = require('express');
const db = require('../database/init');
const LegalTimeline = require('../engines/LegalTimeline');
const { authMiddleware, roleMiddleware, caseAccessMiddleware } = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

const generateCaseNumber = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const random = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
  return `LAW-${year}${month}-${random}`;
};

router.post('/', roleMiddleware('lead_lawyer', 'assistant'), async (req, res) => {
  try {
    const {
      title,
      type,
      client_id,
      lead_lawyer_id,
      assistant_id,
      description,
      court,
      case_value,
      hearing_date
    } = req.body;

    const caseNumber = generateCaseNumber();
    const userId = req.user.id;

    db.run(
      `INSERT INTO cases (case_number, title, type, status, client_id, lead_lawyer_id, assistant_id, 
                          description, court, case_value, hearing_date)
       VALUES (?, ?, ?, 'active', ?, ?, ?, ?, ?, ?, ?)`,
      [
        caseNumber,
        title,
        type || 'civil',
        client_id,
        lead_lawyer_id || userId,
        assistant_id,
        description,
        court,
        case_value || 0,
        hearing_date
      ],
      async function (err) {
        if (err) {
          console.error(err);
          return res.status(500).json({ error: '创建案件失败' });
        }

        const caseId = this.lastID;
        
        try {
          await LegalTimeline.createCaseCreatedEvent(caseId, userId);
          
          if (hearing_date) {
            db.run(
              `INSERT INTO reminders (case_id, reminder_type, title, description, reminder_date)
               VALUES (?, 'hearing', '开庭提醒', '案件即将开庭，请准时参加', ?)`,
              [caseId, hearing_date]
            );
          }

          res.json({
            id: caseId,
            case_number: caseNumber,
            title,
            status: 'active',
            message: '案件创建成功'
          });
        } catch (timelineErr) {
          console.error(timelineErr);
          res.json({
            id: caseId,
            case_number: caseNumber,
            title,
            status: 'active',
            message: '案件创建成功，时间轴记录失败'
          });
        }
      }
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '服务器错误' });
  }
});

router.get('/', (req, res) => {
  const { status, type } = req.query;
  const userId = req.user.id;
  const role = req.user.role;

  let query = `SELECT c.*, 
                      u1.name as client_name, 
                      u2.name as lead_lawyer_name,
                      u3.name as assistant_name
               FROM cases c
               LEFT JOIN users u1 ON c.client_id = u1.id
               LEFT JOIN users u2 ON c.lead_lawyer_id = u2.id
               LEFT JOIN users u3 ON c.assistant_id = u3.id
               WHERE 1=1`;
  const params = [];

  if (role === 'client') {
    query += ' AND c.client_id = ?';
    params.push(userId);
  } else if (role === 'lead_lawyer') {
    query += ' AND c.lead_lawyer_id = ?';
    params.push(userId);
  } else if (role === 'assistant') {
    query += ' AND (c.assistant_id = ? OR c.lead_lawyer_id = ?)';
    params.push(userId, userId);
  }

  if (status) {
    query += ' AND c.status = ?';
    params.push(status);
  }

  if (type) {
    query += ' AND c.type = ?';
    params.push(type);
  }

  query += ' ORDER BY c.created_at DESC';

  db.all(query, params, (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: '查询案件失败' });
    }
    res.json(rows);
  });
});

router.get('/:caseId', caseAccessMiddleware, (req, res) => {
  res.json(req.caseData);
});

router.put('/:caseId/status', roleMiddleware('lead_lawyer', 'assistant'), caseAccessMiddleware, (req, res) => {
  const { status } = req.body;
  const caseId = req.params.caseId;
  const validStatuses = ['pending', 'active', 'hearing', 'executing', 'closed', 'archived'];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: '无效的案件状态' });
  }

  db.run(
    `UPDATE cases SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    [status, caseId],
    function (err) {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: '更新案件状态失败' });
      }
      res.json({ caseId, status, updatedAt: new Date().toISOString() });
    }
  );
});

router.get('/:caseId/timeline', caseAccessMiddleware, async (req, res) => {
  try {
    const timeline = await LegalTimeline.getCaseTimeline(req.params.caseId);
    res.json(timeline);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '获取时间轴失败' });
  }
});

router.post('/:caseId/sign-hearing', roleMiddleware('lead_lawyer', 'assistant'), caseAccessMiddleware, async (req, res) => {
  try {
    const caseId = req.params.caseId;
    const userId = req.user.id;

    await LegalTimeline.createHearingSignedEvent(caseId, userId);

    db.run(
      `UPDATE cases SET status = 'hearing', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [caseId],
      (err) => {
        if (err) console.error(err);
      }
    );

    res.json({
      caseId,
      signedAt: new Date().toISOString(),
      signedBy: userId,
      message: '开庭签到成功'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '签到失败' });
  }
});

router.get('/:caseId/communications', caseAccessMiddleware, (req, res) => {
  db.all(
    `SELECT cl.*, u.name as creator_name
     FROM communication_logs cl
     LEFT JOIN users u ON cl.created_by = u.id
     WHERE cl.case_id = ?
     ORDER BY cl.created_at DESC`,
    [req.params.caseId],
    (err, rows) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: '查询外联记录失败' });
      }
      res.json(rows);
    }
  );
});

router.post('/:caseId/communications', caseAccessMiddleware, async (req, res) => {
  const { type, participants, content } = req.body;
  const caseId = req.params.caseId;
  const userId = req.user.id;

  db.run(
    `INSERT INTO communication_logs (case_id, type, participants, content, created_by)
     VALUES (?, ?, ?, ?, ?)`,
    [caseId, type || 'other', participants, content, userId],
    async function (err) {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: '创建外联记录失败' });
      }

      const logId = this.lastID;
      try {
        await LegalTimeline.createCommunicationEvent(caseId, logId, userId);
      } catch (e) {
        console.error('时间轴记录失败:', e);
      }

      res.json({
        id: logId,
        caseId,
        type,
        createdAt: new Date().toISOString()
      });
    }
  );
});

module.exports = router;
