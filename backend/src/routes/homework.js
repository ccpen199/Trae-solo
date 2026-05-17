const express = require('express');
const db = require('../models/database');
const router = express.Router();

router.post('/create', (req, res) => {
  try {
    const { title, classId, subject, type, knowledgePoints, studentScope, deadline, questions } = req.body;
    const teacherId = req.user.id;

    if (!title || !classId) {
      return res.json({ success: false, message: '标题和班级必填' });
    }

    const stmt = db.prepare(`
      INSERT INTO homeworks (teacher_id, class_id, title, subject, type, knowledge_points, student_scope, deadline)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(teacherId, classId, title, subject, type, knowledgePoints, studentScope, deadline);
    const homeworkId = result.lastInsertRowid;

    const questionArray = questions || [];
    if (questionArray.length > 0) {
      const questionStmt = db.prepare('INSERT INTO homework_questions (homework_id, content, answer, order_num) VALUES (?, ?, ?, ?)');
      questionArray.forEach((q, index) => {
        questionStmt.run(homeworkId, q.content, q.answer, index);
      });
    }

    res.json({ success: true, message: '创建成功', data: { id: homeworkId } });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: '服务器错误' });
  }
});

router.post('/publish/:id', (req, res) => {
  try {
    const homeworkId = req.params.id;
    const publishTime = new Date().toISOString();

    const stmt = db.prepare('UPDATE homeworks SET status = ?, publish_time = ? WHERE id = ? AND teacher_id = ?');
    stmt.run('published', publishTime, homeworkId, req.user.id);

    res.json({ success: true, message: '发布成功' });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: '服务器错误' });
  }
});

router.get('/list', (req, res) => {
  try {
    const teacherId = req.user.id;
    const { status } = req.query;

    let query = `
      SELECT h.*, c.name as class_name,
        (SELECT COUNT(*) FROM homework_submissions WHERE homework_id = h.id AND submitted_at IS NOT NULL) as submitted_count,
        (SELECT COUNT(*) FROM class_members WHERE class_id = h.class_id) as total_students
      FROM homeworks h
      JOIN classes c ON h.class_id = c.id
      WHERE h.teacher_id = ?
    `;
    const params = [teacherId];

    if (status) {
      query += ' AND h.status = ?';
      params.push(status);
    }

    query += ' ORDER BY h.created_at DESC';

    const homeworks = db.prepare(query).all(...params);
    res.json({ success: true, data: homeworks });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: '获取作业列表失败' });
  }
});

router.get('/:id', (req, res) => {
  try {
    const homeworkId = req.params.id;

    const homework = db.prepare(`
      SELECT h.*, c.name as class_name,
        (SELECT COUNT(*) FROM homework_submissions WHERE homework_id = h.id AND submitted_at IS NOT NULL) as submitted_count,
        (SELECT COUNT(*) FROM class_members WHERE class_id = h.class_id) as total_students
      FROM homeworks h
      JOIN classes c ON h.class_id = c.id
      WHERE h.id = ? AND h.teacher_id = ?
    `).get(homeworkId, req.user.id);

    if (!homework) {
      return res.json({ success: false, message: '作业不存在' });
    }

    homework.questions = db.prepare('SELECT * FROM homework_questions WHERE homework_id = ? ORDER BY order_num').all(homeworkId);
    res.json({ success: true, data: homework });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: '服务器错误' });
  }
});

router.get('/:id/overview', (req, res) => {
  try {
    const homeworkId = req.params.id;

    const submissions = db.prepare(`
      SELECT hs.*, cm.name as student_name
      FROM homework_submissions hs
      JOIN class_members cm ON hs.student_id = cm.id
      WHERE hs.homework_id = ? AND hs.submitted_at IS NOT NULL
      ORDER BY hs.accuracy DESC
    `).all(homeworkId);

    const avgAccuracy = submissions.length 
      ? submissions.reduce((sum, s) => sum + (s.accuracy || 0), 0) / submissions.length 
      : 0;

    const questions = db.prepare('SELECT * FROM homework_questions WHERE homework_id = ? ORDER BY order_num').all(homeworkId);
    const questionStats = questions.map(q => {
      const correctCount = submissions.filter(s => {
        try {
          const answers = JSON.parse(s.answers || '{}');
          return answers[q.id] === q.answer;
        } catch {
          return false;
        }
      }).length;
      return {
        ...q,
        correctCount,
        totalCount: submissions.length,
        accuracy: submissions.length ? correctCount / submissions.length : 0
      };
    });

    res.json({
      success: true,
      data: {
        avgAccuracy,
        submissions,
        questionStats
      }
    });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: '获取概览失败' });
  }
});

router.get('/:id/student/:studentId', (req, res) => {
  try {
    const { id, studentId } = req.params;

    const submission = db.prepare(`
      SELECT hs.*, cm.name as student_name
      FROM homework_submissions hs
      JOIN class_members cm ON hs.student_id = cm.id
      WHERE hs.homework_id = ? AND hs.student_id = ?
    `).get(id, studentId);

    if (!submission) {
      return res.json({ success: false, message: '提交不存在' });
    }

    const questionsWithAnswers = db.prepare(`
      SELECT 
        q.*,
        CASE WHEN json_extract(hs.answers, '$.' || q.id) = q.answer THEN 1 ELSE 0 END as is_correct
      FROM homework_questions q
      CROSS JOIN homework_submissions hs
      WHERE hs.homework_id = ? AND hs.student_id = ?
      ORDER BY q.order_num
    `).all(id, studentId);

    submission.answers = questionsWithAnswers;
    res.json({ success: true, data: submission });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: '服务器错误' });
  }
});

router.post('/:id/student/:studentId/comment', (req, res) => {
  try {
    const { id, studentId } = req.params;
    const { voiceComment } = req.body;

    db.prepare('UPDATE homework_submissions SET voice_comment = ? WHERE homework_id = ? AND student_id = ?')
      .run(voiceComment, id, studentId);

    res.json({ success: true, message: '评语发布成功' });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: '服务器错误' });
  }
});

module.exports = router;