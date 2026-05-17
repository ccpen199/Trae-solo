const { db } = require('../models/database');

const getAssessments = (req, res) => {
  try {
    const { page = 1, pageSize = 10 } = req.query;
    const offset = (page - 1) * pageSize;

    const total = db.prepare("SELECT COUNT(*) as count FROM assessments WHERE status = ?").get('published').count;

    const assessments = db.prepare(`
      SELECT * FROM assessments
      WHERE status = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).all('published', parseInt(pageSize), offset);

    res.json({
      success: true,
      data: {
        list: assessments,
        pagination: { total, page: parseInt(page), pageSize: parseInt(pageSize) }
      }
    });
  } catch (error) {
    console.error('Get assessments error:', error);
    res.status(500).json({ success: false, message: '获取测评列表失败' });
  }
};

const getAssessmentDetail = (req, res) => {
  try {
    const { id } = req.params;

    const assessment = db.prepare('SELECT * FROM assessments WHERE id = ?').get(id);
    
    if (!assessment) {
      return res.status(404).json({ success: false, message: '测评不存在' });
    }

    const questions = db.prepare(`
      SELECT * FROM assessment_questions
      WHERE assessment_id = ?
      ORDER BY sort_order
    `).all(id);

    questions.forEach(q => {
      q.options = q.options ? JSON.parse(q.options) : [];
      delete q.answer;
      delete q.explanation;
    });

    res.json({
      success: true,
      data: { assessment, questions }
    });
  } catch (error) {
    console.error('Get assessment detail error:', error);
    res.status(500).json({ success: false, message: '获取测评详情失败' });
  }
};

const submitAssessment = (req, res) => {
  try {
    const userId = req.user.userId;
    const { assessmentId, answers } = req.body;

    const questions = db.prepare('SELECT * FROM assessment_questions WHERE assessment_id = ? ORDER BY sort_order').all(assessmentId);
    
    let correctCount = 0;
    const wrongQuestions = [];

    questions.forEach((q, index) => {
      const userAnswer = answers[index] || '';
      if (userAnswer === q.answer) {
        correctCount++;
      } else {
        wrongQuestions.push({
          questionId: q.id,
          userAnswer
        });
      }
    });

    const score = Math.round((correctCount / questions.length) * 100);
    const isPassed = score >= (db.prepare('SELECT pass_score FROM assessments WHERE id = ?').get(assessmentId).pass_score || 60);

    const result = db.prepare(`
      INSERT INTO user_assessments (user_id, assessment_id, score, is_passed, answers, completed_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
    `).run(userId, assessmentId, score, isPassed ? 1 : 0, JSON.stringify(answers));

    const wrongInsert = db.prepare('INSERT INTO wrong_questions (user_id, assessment_id, question_id, user_answer) VALUES (?, ?, ?, ?)');
    wrongQuestions.forEach(wq => {
      wrongInsert.run(userId, assessmentId, wq.questionId, wq.userAnswer);
    });

    res.json({
      success: true,
      message: isPassed ? '恭喜，通过测评！' : '很遗憾，未通过测评，再接再厉！',
      data: {
        id: result.lastInsertRowid,
        score,
        isPassed,
        correctCount,
        totalCount: questions.length
      }
    });
  } catch (error) {
    console.error('Submit assessment error:', error);
    res.status(500).json({ success: false, message: '提交失败' });
  }
};

const getMyAssessments = (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, pageSize = 10 } = req.query;
    const offset = (page - 1) * pageSize;

    const total = db.prepare('SELECT COUNT(*) as count FROM user_assessments WHERE user_id = ?').get(userId).count;

    const assessments = db.prepare(`
      SELECT ua.*, a.title, a.description, a.cover
      FROM user_assessments ua
      JOIN assessments a ON ua.assessment_id = a.id
      WHERE ua.user_id = ?
      ORDER BY ua.completed_at DESC
      LIMIT ? OFFSET ?
    `).all(userId, parseInt(pageSize), offset);

    res.json({
      success: true,
      data: {
        list: assessments,
        pagination: { total, page: parseInt(page), pageSize: parseInt(pageSize) }
      }
    });
  } catch (error) {
    console.error('Get my assessments error:', error);
    res.status(500).json({ success: false, message: '获取我的测评失败' });
  }
};

const getWrongQuestions = (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, pageSize = 10 } = req.query;
    const offset = (page - 1) * pageSize;

    const total = db.prepare('SELECT COUNT(*) as count FROM wrong_questions WHERE user_id = ?').get(userId).count;

    const wrongQuestions = db.prepare(`
      SELECT wq.*, q.question, q.options, q.answer, q.explanation, a.title as assessment_title
      FROM wrong_questions wq
      JOIN assessment_questions q ON wq.question_id = q.id
      JOIN assessments a ON wq.assessment_id = a.id
      WHERE wq.user_id = ?
      ORDER BY wq.created_at DESC
      LIMIT ? OFFSET ?
    `).all(userId, parseInt(pageSize), offset);

    wrongQuestions.forEach(wq => {
      wq.options = wq.options ? JSON.parse(wq.options) : [];
    });

    res.json({
      success: true,
      data: {
        list: wrongQuestions,
        pagination: { total, page: parseInt(page), pageSize: parseInt(pageSize) }
      }
    });
  } catch (error) {
    console.error('Get wrong questions error:', error);
    res.status(500).json({ success: false, message: '获取错题本失败' });
  }
};

module.exports = {
  getAssessments,
  getAssessmentDetail,
  submitAssessment,
  getMyAssessments,
  getWrongQuestions
};
