const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../database/init');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/questions', (req, res) => {
  try {
    const { limit = 5 } = req.query;

    const questions = db.prepare(`
      SELECT * FROM assessment_questions ORDER BY RANDOM() LIMIT ?
    `).all(parseInt(limit));

    const parsedQuestions = questions.map(row => ({
      ...row,
      options: row.options ? JSON.parse(row.options) : []
    }));

    res.json({
      success: true,
      data: { questions: parsedQuestions }
    });
  } catch (error) {
    console.error('Get questions error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Database error',
      error: error.message 
    });
  }
});

router.post('/submit', authenticateToken, (req, res) => {
  try {
    const { answers } = req.body;
    const userId = req.user.userId;

    if (!Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Answers are required' 
      });
    }

    const questionIds = answers.map(a => a.questionId);
    const placeholders = questionIds.map(() => '?').join(',');

    const questions = db.prepare(`
      SELECT id, correct_answer FROM assessment_questions WHERE id IN (${placeholders})
    `).all(...questionIds);

    let correctCount = 0;
    const results = answers.map(answer => {
      const question = questions.find(q => q.id === answer.questionId);
      const isCorrect = question && question.correct_answer === answer.answer;
      if (isCorrect) correctCount++;
      return {
        questionId: answer.questionId,
        correct: isCorrect,
        correctAnswer: question?.correct_answer
      };
    });

    const score = Math.round((correctCount / answers.length) * 100);
    let level = 'beginner';
    if (score >= 80) level = 'advanced';
    else if (score >= 50) level = 'intermediate';

    const assessmentId = uuidv4();

    db.prepare(`
      INSERT INTO user_assessments (id, user_id, score, level, details)
      VALUES (?, ?, ?, ?, ?)
    `).run(assessmentId, userId, score, level, JSON.stringify(results));

    db.prepare('UPDATE users SET level = ? WHERE id = ?').run(level, userId);

    res.json({
      success: true,
      data: {
        score,
        level,
        results
      }
    });
  } catch (error) {
    console.error('Submit assessment error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to save assessment',
      error: error.message 
    });
  }
});

router.get('/history', authenticateToken, (req, res) => {
  try {
    const userId = req.user.userId;

    const assessments = db.prepare(`
      SELECT * FROM user_assessments WHERE user_id = ? ORDER BY created_at DESC
    `).all(userId);

    const parsedAssessments = assessments.map(row => ({
      ...row,
      details: row.details ? JSON.parse(row.details) : []
    }));

    res.json({
      success: true,
      data: { assessments: parsedAssessments }
    });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Database error',
      error: error.message 
    });
  }
});

module.exports = router;
