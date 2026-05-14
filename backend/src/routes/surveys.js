const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { runQuery, getOne, getAll, db } = require('../database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

const runTransaction = (fn) => {
  const execTransaction = db.transaction(fn);
  return execTransaction();
};

router.get('/', authMiddleware, async (req, res) => {
  try {
    const user = req.user;
    const today = new Date().toISOString().split('T')[0];
    
    if (user.last_answer_date !== today) {
      await runQuery('UPDATE users SET daily_answers = 0, last_answer_date = ? WHERE id = ?', [today, user.id]);
      user.daily_answers = 0;
    }

    let sql = `
      SELECT s.*, u.nickname as publisher_name
      FROM surveys s
      LEFT JOIN users u ON s.publisher_id = u.id
      WHERE s.status = 'active'
      AND s.completed_surveys < s.total_surveys
      AND s.id NOT IN (
        SELECT survey_id FROM user_surveys 
        WHERE user_id = ? AND status IN ('completed', 'in_progress')
      )
    `;
    
    const params = [user.id];

    if (user.gender) {
      sql += ` AND (s.target_gender IS NULL OR s.target_gender = ? OR s.target_gender = 'all')`;
      params.push(user.gender);
    }

    if (user.province) {
      sql += ` AND (s.target_province IS NULL OR s.target_province = ? OR s.target_province = 'all')`;
      params.push(user.province);
    }

    if (user.age) {
      sql += ` AND (
        (s.target_age_min IS NULL OR s.target_age_min <= ?) 
        AND 
        (s.target_age_max IS NULL OR s.target_age_max >= ?)
      )`;
      params.push(user.age, user.age);
    }

    sql += ` ORDER BY s.created_at DESC`;

    const surveys = await getAll(sql, params);

    const processedSurveys = surveys.map(survey => {
      const hasReward = survey.reward_per_question > 0;
      const canAnswer = user.gender && user.province && user.age;
      return {
        ...survey,
        hasReward,
        canAnswer
      };
    });

    res.json({
      success: true,
      data: processedSurveys
    });
  } catch (error) {
    console.error('Get surveys error:', error);
    res.status(500).json({
      success: false,
      message: '获取问卷列表失败'
    });
  }
});

router.get('/my', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const published = await getAll(`
      SELECT s.*, 
        COUNT(DISTINCT us.id) as response_count
      FROM surveys s
      LEFT JOIN user_surveys us ON s.id = us.survey_id AND us.status = 'completed'
      WHERE s.publisher_id = ?
      GROUP BY s.id
      ORDER BY s.created_at DESC
    `, [userId]);

    const answered = await getAll(`
      SELECT us.*, s.title, s.reward_per_question, s.question_count
      FROM user_surveys us
      JOIN surveys s ON us.survey_id = s.id
      WHERE us.user_id = ?
      ORDER BY us.created_at DESC
    `, [userId]);

    res.json({
      success: true,
      data: {
        published,
        answered
      }
    });
  } catch (error) {
    console.error('Get my surveys error:', error);
    res.status(500).json({
      success: false,
      message: '获取我的问卷失败'
    });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      title,
      description,
      target_gender,
      target_province,
      target_age_min,
      target_age_max,
      question_count,
      total_surveys,
      reward_per_question,
      questions
    } = req.body;

    if (!title || !total_surveys || reward_per_question === undefined || !questions || questions.length === 0) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数或没有有效题目'
      });
    }

    const actual_question_count = questions.length;
    const total_reward = actual_question_count * total_surveys * reward_per_question;

    const publisher = await getOne('SELECT balance FROM users WHERE id = ?', [userId]);
    if (!publisher || publisher.balance < total_reward) {
      return res.status(400).json({
        success: false,
        message: '余额不足，请先充值'
      });
    }

    const surveyId = uuidv4();

    runTransaction(() => {
      runQuery(
        `INSERT INTO surveys (
          id, publisher_id, title, description, target_gender, target_province,
          target_age_min, target_age_max, question_count, total_surveys,
          reward_per_question, total_reward
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          surveyId, userId, title, description, target_gender, target_province,
          target_age_min || null, target_age_max || null, actual_question_count, total_surveys,
          reward_per_question, total_reward
        ]
      );

      for (let i = 0; i < questions.length; i++) {
        const question = questions[i];
        const questionId = uuidv4();
        runQuery(
          'INSERT INTO questions (id, survey_id, question_text, options, order_index) VALUES (?, ?, ?, ?, ?)',
          [questionId, surveyId, question.question_text, JSON.stringify(question.options), i]
        );
      }

      runQuery(
        'UPDATE users SET balance = balance - ? WHERE id = ?',
        [total_reward, userId]
      );

      const transactionId = uuidv4();
      runQuery(
        'INSERT INTO transactions (id, user_id, type, amount, status, description) VALUES (?, ?, ?, ?, ?, ?)',
        [transactionId, userId, 'publish_survey', total_reward, 'completed', `发布问卷：${title}`]
      );
    });

    const survey = await getOne('SELECT * FROM surveys WHERE id = ?', [surveyId]);

    res.json({
      success: true,
      data: survey,
      message: '问卷发布成功'
    });
  } catch (error) {
    console.error('Create survey error:', error);
    res.status(500).json({
      success: false,
      message: '发布问卷失败'
    });
  }
});

router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const surveyId = req.params.id;
    const userId = req.user.id;

    const survey = await getOne('SELECT * FROM surveys WHERE id = ?', [surveyId]);
    if (!survey) {
      return res.status(404).json({
        success: false,
        message: '问卷不存在'
      });
    }

    const questions = await getAll(
      'SELECT * FROM questions WHERE survey_id = ? ORDER BY order_index ASC',
      [surveyId]
    );

    const userSurvey = await getOne(
      'SELECT * FROM user_surveys WHERE user_id = ? AND survey_id = ?',
      [userId, surveyId]
    );

    res.json({
      success: true,
      data: {
        survey,
        questions,
        userSurvey
      }
    });
  } catch (error) {
    console.error('Get survey detail error:', error);
    res.status(500).json({
      success: false,
      message: '获取问卷详情失败'
    });
  }
});

router.post('/:id/start', authMiddleware, async (req, res) => {
  try {
    const surveyId = req.params.id;
    const userId = req.user.id;

    const user = req.user;
    if (!user.gender || !user.province || !user.age) {
      return res.status(400).json({
        success: false,
        message: '请先完善个人信息'
      });
    }

    const survey = await getOne('SELECT * FROM surveys WHERE id = ?', [surveyId]);
    if (!survey) {
      return res.status(404).json({
        success: false,
        message: '问卷不存在'
      });
    }

    if (survey.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: '问卷已结束'
      });
    }

    if (survey.completed_surveys >= survey.total_surveys) {
      return res.status(400).json({
        success: false,
        message: '问卷名额已满'
      });
    }

    const existing = await getOne(
      'SELECT * FROM user_surveys WHERE user_id = ? AND survey_id = ?',
      [userId, surveyId]
    );

    if (existing) {
      if (existing.status === 'completed') {
        return res.status(400).json({
          success: false,
          message: '您已完成此问卷'
        });
      }
      return res.json({
        success: true,
        data: existing,
        message: '继续答题'
      });
    }

    const userSurveyId = uuidv4();
    const startTime = new Date().toISOString();

    await runQuery(
      'INSERT INTO user_surveys (id, user_id, survey_id, start_time, last_answer_time) VALUES (?, ?, ?, ?, ?)',
      [userSurveyId, userId, surveyId, startTime, startTime]
    );

    const userSurvey = await getOne('SELECT * FROM user_surveys WHERE id = ?', [userSurveyId]);

    res.json({
      success: true,
      data: userSurvey,
      message: '开始答题'
    });
  } catch (error) {
    console.error('Start survey error:', error);
    res.status(500).json({
      success: false,
      message: '开始答题失败'
    });
  }
});

router.post('/:id/answer', authMiddleware, async (req, res) => {
  try {
    const surveyId = req.params.id;
    const userId = req.user.id;
    const { question_index, answer } = req.body;

    if (question_index === undefined || answer === undefined) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数'
      });
    }

    const userSurvey = await getOne(
      'SELECT * FROM user_surveys WHERE user_id = ? AND survey_id = ?',
      [userId, surveyId]
    );

    if (!userSurvey) {
      return res.status(404).json({
        success: false,
        message: '答题记录不存在'
      });
    }

    if (userSurvey.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: '问卷已完成'
      });
    }

    const startTime = new Date(userSurvey.start_time).getTime();
    const now = Date.now();
    if (now - startTime > 30 * 60 * 1000) {
      await runQuery(
        'UPDATE user_surveys SET status = ? WHERE id = ?',
        ['timeout', userSurvey.id]
      );
      return res.status(400).json({
        success: false,
        message: '答题超时'
      });
    }

    const lastAnswerTime = userSurvey.last_answer_time ? new Date(userSurvey.last_answer_time).getTime() : startTime;
    if (now - lastAnswerTime < 10 * 1000 && question_index > 0) {
      return res.status(400).json({
        success: false,
        message: '请认真阅读题目后再作答'
      });
    }

    let answers = userSurvey.answers ? JSON.parse(userSurvey.answers) : {};
    answers[question_index] = answer;

    await runQuery(
      'UPDATE user_surveys SET answers = ?, current_question = ?, last_answer_time = ? WHERE id = ?',
      [JSON.stringify(answers), question_index + 1, new Date().toISOString(), userSurvey.id]
    );

    res.json({
      success: true,
      data: { current_question: question_index + 1 },
      message: '答案已保存'
    });
  } catch (error) {
    console.error('Answer question error:', error);
    res.status(500).json({
      success: false,
      message: '提交答案失败'
    });
  }
});

router.post('/:id/complete', authMiddleware, async (req, res) => {
  try {
    const surveyId = req.params.id;
    const userId = req.user.id;

    const userSurvey = await getOne(
      'SELECT * FROM user_surveys WHERE user_id = ? AND survey_id = ?',
      [userId, surveyId]
    );

    if (!userSurvey) {
      return res.status(404).json({
        success: false,
        message: '答题记录不存在'
      });
    }

    if (userSurvey.status === 'completed') {
      return res.json({
        success: true,
        message: '问卷已完成'
      });
    }

    const survey = await getOne('SELECT * FROM surveys WHERE id = ?', [surveyId]);
    const reward = survey.question_count * survey.reward_per_question;

    runTransaction(() => {
      runQuery(
        'UPDATE user_surveys SET status = ?, end_time = ?, reward = ? WHERE id = ?',
        ['completed', new Date().toISOString(), reward, userSurvey.id]
      );

      runQuery(
        'UPDATE users SET balance = balance + ?, total_answers = total_answers + 1, daily_answers = daily_answers + 1 WHERE id = ?',
        [reward, userId]
      );

      runQuery(
        'UPDATE surveys SET completed_surveys = completed_surveys + 1 WHERE id = ?',
        [surveyId]
      );

      const transactionId = uuidv4();
      runQuery(
        'INSERT INTO transactions (id, user_id, type, amount, status, description) VALUES (?, ?, ?, ?, ?, ?)',
        [transactionId, userId, 'answer_reward', reward, 'completed', `完成问卷：${survey.title}`]
      );
    });

    res.json({
      success: true,
      data: { reward },
      message: `问卷完成，获得奖励 ${reward} 元`
    });
  } catch (error) {
    console.error('Complete survey error:', error);
    res.status(500).json({
      success: false,
      message: '完成问卷失败'
    });
  }
});

router.post('/:id/abandon', authMiddleware, async (req, res) => {
  try {
    const surveyId = req.params.id;
    const userId = req.user.id;

    await runQuery(
      'DELETE FROM user_surveys WHERE user_id = ? AND survey_id = ? AND status = ?',
      [userId, surveyId, 'in_progress']
    );

    res.json({
      success: true,
      message: '已放弃问卷'
    });
  } catch (error) {
    console.error('Abandon survey error:', error);
    res.status(500).json({
      success: false,
      message: '操作失败'
    });
  }
});

module.exports = router;
