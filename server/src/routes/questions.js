const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const QnAEngine = require('../engines/QnAEngine');
const Question = require('../models/Question');
const Course = require('../models/Course');

router.get('/', auth, async (req, res) => {
  try {
    const { courseId, status, userId, page = 1, limit = 20, sort = '-createdAt' } = req.query;
    
    if (courseId) {
      const result = await QnAEngine.getCourseQuestions(courseId, {
        status,
        userId,
        page: parseInt(page),
        limit: parseInt(limit),
        sort
      });
      return res.json(result);
    }

    const query = {};
    if (status) query.status = status;
    if (userId) query.user = userId;

    const questions = await Question.find(query)
      .populate('user', 'username avatar')
      .populate('course', 'title')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Question.countDocuments(query);

    res.json({
      questions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: '获取问题列表失败', error: error.message });
  }
});

router.get('/my', auth, async (req, res) => {
  try {
    const { courseId, status, page = 1, limit = 20 } = req.query;
    
    const result = await QnAEngine.getUserQuestions(req.user._id, {
      courseId,
      status,
      page: parseInt(page),
      limit: parseInt(limit)
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: '获取我的问题失败', error: error.message });
  }
});

router.get('/hot-tags/:courseId', auth, async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const tags = await QnAEngine.getHotTags(req.params.courseId, parseInt(limit));
    res.json({ tags });
  } catch (error) {
    res.status(500).json({ message: '获取热门标签失败', error: error.message });
  }
});

router.get('/search', auth, async (req, res) => {
  try {
    const { courseId, keyword, page = 1, limit = 20 } = req.query;
    
    if (!courseId || !keyword) {
      return res.status(400).json({ message: '请提供课程ID和搜索关键词' });
    }

    const result = await QnAEngine.searchQuestions(courseId, keyword, {
      page: parseInt(page),
      limit: parseInt(limit)
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: '搜索失败', error: error.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const question = await QnAEngine.getQuestionDetail(req.params.id);
    res.json({ question });
  } catch (error) {
    if (error.message === '问题不存在') {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: '获取问题详情失败', error: error.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { courseId, chapterId, lessonId, title, content, tags } = req.body;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: '课程不存在' });
    }

    const Enrollment = require('../models/Enrollment');
    const enrollment = await Enrollment.findOne({
      student: req.user._id,
      course: courseId
    });

    const isTeacher = course.teacher.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    const isTa = req.user.role === 'ta';

    if (!enrollment && !isTeacher && !isAdmin && !isTa) {
      return res.status(403).json({ message: '您未购买该课程' });
    }

    const question = await QnAEngine.createQuestion(req.user._id, courseId, {
      title,
      content,
      chapterId,
      lessonId,
      tags
    });

    await question.populate('user', 'username avatar');
    await question.populate('course', 'title');

    res.status(201).json({ message: '问题发布成功', question });
  } catch (error) {
    res.status(500).json({ message: '发布问题失败', error: error.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { title, content, tags } = req.body;
    
    const question = await QnAEngine.updateQuestion(req.params.id, req.user._id, {
      title,
      content,
      tags
    });

    res.json({ message: '问题更新成功', question });
  } catch (error) {
    if (error.message === '问题不存在') {
      return res.status(404).json({ message: error.message });
    }
    if (error.message === '无权修改此问题') {
      return res.status(403).json({ message: error.message });
    }
    res.status(500).json({ message: '更新问题失败', error: error.message });
  }
});

router.post('/:id/answers', auth, async (req, res) => {
  try {
    const { content } = req.body;
    
    const question = await QnAEngine.addAnswer(req.params.id, req.user._id, content);
    
    await question.populate('answers.user', 'username avatar');

    res.status(201).json({ message: '回答成功', question });
  } catch (error) {
    if (error.message === '问题不存在') {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: '回答失败', error: error.message });
  }
});

router.post('/:id/like', auth, async (req, res) => {
  try {
    const question = await QnAEngine.likeQuestion(req.params.id, req.user._id);
    res.json({ 
      message: question.likes.includes(req.user._id) ? '点赞成功' : '取消点赞',
      likeCount: question.likeCount 
    });
  } catch (error) {
    if (error.message === '问题不存在') {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: '操作失败', error: error.message });
  }
});

router.post('/:id/answers/:answerId/like', auth, async (req, res) => {
  try {
    const question = await QnAEngine.likeAnswer(
      req.params.id, 
      req.params.answerId, 
      req.user._id
    );
    
    const answer = question.answers.id(req.params.answerId);
    
    res.json({ 
      message: answer?.likes?.includes(req.user._id) ? '点赞成功' : '取消点赞',
      likeCount: answer?.likeCount || 0 
    });
  } catch (error) {
    if (error.message === '问题不存在' || error.message === '答案不存在') {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: '操作失败', error: error.message });
  }
});

router.post('/:id/answers/:answerId/accept', auth, async (req, res) => {
  try {
    const question = await QnAEngine.acceptAnswer(
      req.params.id,
      req.params.answerId,
      req.user._id
    );

    res.json({ message: '答案采纳成功', question });
  } catch (error) {
    if (error.message === '问题不存在' || error.message === '答案不存在') {
      return res.status(404).json({ message: error.message });
    }
    if (error.message === '只有提问者才能采纳答案') {
      return res.status(403).json({ message: error.message });
    }
    res.status(500).json({ message: '采纳失败', error: error.message });
  }
});

router.post('/:id/close', auth, async (req, res) => {
  try {
    const question = await QnAEngine.closeQuestion(req.params.id, req.user._id);
    res.json({ message: '问题已关闭', question });
  } catch (error) {
    if (error.message === '问题不存在') {
      return res.status(404).json({ message: error.message });
    }
    if (error.message === '无权关闭此问题') {
      return res.status(403).json({ message: error.message });
    }
    res.status(500).json({ message: '关闭失败', error: error.message });
  }
});

module.exports = router;
