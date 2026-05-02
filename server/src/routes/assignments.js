const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const Assignment = require('../models/Assignment');
const AssignmentSubmission = require('../models/AssignmentSubmission');
const AssignmentGradingEngine = require('../engines/AssignmentGradingEngine');
const Course = require('../models/Course');

router.get('/', auth, async (req, res) => {
  try {
    const { courseId, type, status, page = 1, limit = 20 } = req.query;
    
    const query = {};
    if (courseId) query.course = courseId;
    if (type) query.type = type;
    if (status) query.status = status;

    const assignments = await Assignment.find(query)
      .populate('course', 'title')
      .populate('teacher', 'username avatar')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Assignment.countDocuments(query);

    res.json({
      assignments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: '获取作业列表失败', error: error.message });
  }
});

router.get('/my', auth, async (req, res) => {
  try {
    const { courseId, status, page = 1, limit = 20 } = req.query;
    
    const enrollmentQuery = { student: req.user._id };
    if (courseId) enrollmentQuery.course = courseId;
    
    const Enrollment = require('../models/Enrollment');
    const enrollments = await Enrollment.find(enrollmentQuery);
    const courseIds = enrollments.map(e => e.course);

    if (courseIds.length === 0) {
      return res.json({ assignments: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } });
    }

    const assignmentQuery = { course: { $in: courseIds }, status: 'published' };
    
    const assignments = await Assignment.find(assignmentQuery)
      .populate('course', 'title coverImage')
      .populate('teacher', 'username avatar')
      .sort({ startDate: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const assignmentsWithSubmission = [];
    for (const assignment of assignments) {
      const submission = await AssignmentSubmission.findOne({
        assignment: assignment._id,
        student: req.user._id
      });
      
      assignmentsWithSubmission.push({
        ...assignment.toObject(),
        submission: submission ? {
          id: submission._id,
          status: submission.status,
          totalScore: submission.totalScore,
          submittedAt: submission.submittedAt
        } : null
      });
    }

    const total = await Assignment.countDocuments(assignmentQuery);

    res.json({
      assignments: assignmentsWithSubmission,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: '获取我的作业失败', error: error.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id)
      .populate('course', 'title teacher')
      .populate('teacher', 'username avatar');

    if (!assignment) {
      return res.status(404).json({ message: '作业不存在' });
    }

    let submission = null;
    if (req.user.role === 'student') {
      submission = await AssignmentSubmission.findOne({
        assignment: assignment._id,
        student: req.user._id
      });
    }

    const assignmentData = assignment.toObject();
    if (req.user.role === 'student' && assignment.status === 'published') {
      assignmentData.questions = assignment.questions.map(q => ({
        ...q.toObject(),
        correctAnswer: undefined
      }));
    }

    res.json({ 
      assignment: assignmentData,
      submission: submission ? {
        id: submission._id,
        status: submission.status,
        totalScore: submission.totalScore,
        submittedAt: submission.submittedAt,
        answers: submission.answers
      } : null
    });
  } catch (error) {
    res.status(500).json({ message: '获取作业详情失败', error: error.message });
  }
});

router.post('/', auth, authorize('teacher', 'admin'), async (req, res) => {
  try {
    const { 
      title, description, courseId, chapterId, type, 
      questions, startDate, endDate, timeLimit, 
      passingScore, allowLateSubmission, attempts 
    } = req.body;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: '课程不存在' });
    }

    if (req.user.role !== 'admin' && course.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: '无权为该课程创建作业' });
    }

    const assignment = new Assignment({
      title,
      description,
      course: courseId,
      chapterId,
      teacher: req.user._id,
      type: type || 'homework',
      questions: questions || [],
      startDate,
      endDate,
      timeLimit,
      passingScore: passingScore || 60,
      allowLateSubmission: allowLateSubmission || false,
      attempts: attempts || 1
    });

    await assignment.save();
    await assignment.populate('course', 'title');
    await assignment.populate('teacher', 'username avatar');

    res.status(201).json({ message: '作业创建成功', assignment });
  } catch (error) {
    res.status(500).json({ message: '创建作业失败', error: error.message });
  }
});

router.put('/:id', auth, authorize('teacher', 'admin'), async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    
    if (!assignment) {
      return res.status(404).json({ message: '作业不存在' });
    }

    if (req.user.role !== 'admin' && assignment.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: '无权修改此作业' });
    }

    const updates = ['title', 'description', 'questions', 'startDate', 'endDate', 
                     'timeLimit', 'passingScore', 'allowLateSubmission', 'attempts', 'status'];
    updates.forEach(field => {
      if (req.body[field] !== undefined) {
        assignment[field] = req.body[field];
      }
    });

    await assignment.save();
    await assignment.populate('course', 'title');
    await assignment.populate('teacher', 'username avatar');

    res.json({ message: '作业更新成功', assignment });
  } catch (error) {
    res.status(500).json({ message: '更新作业失败', error: error.message });
  }
});

router.post('/:id/submit', auth, async (req, res) => {
  try {
    const { answers } = req.body;
    const assignment = await Assignment.findById(req.params.id);
    
    if (!assignment) {
      return res.status(404).json({ message: '作业不存在' });
    }

    if (assignment.status !== 'published') {
      return res.status(400).json({ message: '作业未发布' });
    }

    const Enrollment = require('../models/Enrollment');
    const enrollment = await Enrollment.findOne({
      student: req.user._id,
      course: assignment.course
    });

    if (!enrollment) {
      return res.status(403).json({ message: '您未购买该课程' });
    }

    const existingSubmission = await AssignmentSubmission.findOne({
      assignment: assignment._id,
      student: req.user._id
    });

    if (existingSubmission && existingSubmission.status !== 'draft') {
      const attemptsUsed = await AssignmentSubmission.countDocuments({
        assignment: assignment._id,
        student: req.user._id,
        status: { $ne: 'draft' }
      });

      if (attemptsUsed >= assignment.attempts) {
        return res.status(400).json({ message: '已达到最大提交次数' });
      }
    }

    let submission;
    if (existingSubmission && existingSubmission.status === 'draft') {
      submission = existingSubmission;
      submission.answers = answers;
    } else {
      submission = new AssignmentSubmission({
        assignment: assignment._id,
        student: req.user._id,
        answers,
        attempt: existingSubmission ? (existingSubmission.attempt + 1) : 1
      });
    }

    submission.status = 'submitted';
    submission.submittedAt = new Date();

    if (assignment.endDate && new Date() > new Date(assignment.endDate)) {
      submission.isLate = true;
    }

    await submission.save();

    const gradingResult = await AssignmentGradingEngine.autoGradeSubmission(submission._id);

    res.json({ 
      message: '提交成功',
      submission: gradingResult.submission,
      autoGraded: gradingResult.autoGraded
    });
  } catch (error) {
    res.status(500).json({ message: '提交失败', error: error.message });
  }
});

router.post('/:id/save-draft', auth, async (req, res) => {
  try {
    const { answers } = req.body;
    const assignment = await Assignment.findById(req.params.id);
    
    if (!assignment) {
      return res.status(404).json({ message: '作业不存在' });
    }

    const Enrollment = require('../models/Enrollment');
    const enrollment = await Enrollment.findOne({
      student: req.user._id,
      course: assignment.course
    });

    if (!enrollment) {
      return res.status(403).json({ message: '您未购买该课程' });
    }

    let submission = await AssignmentSubmission.findOne({
      assignment: assignment._id,
      student: req.user._id,
      status: 'draft'
    });

    if (!submission) {
      submission = new AssignmentSubmission({
        assignment: assignment._id,
        student: req.user._id,
        answers,
        status: 'draft',
        attempt: 1
      });
    } else {
      submission.answers = answers;
    }

    await submission.save();

    res.json({ message: '草稿保存成功', submission });
  } catch (error) {
    res.status(500).json({ message: '保存草稿失败', error: error.message });
  }
});

router.get('/:id/submissions', auth, authorize('teacher', 'ta', 'admin'), async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    
    const query = { assignment: req.params.id };
    if (status) query.status = status;

    const submissions = await AssignmentSubmission.find(query)
      .populate('student', 'username avatar email')
      .sort({ submittedAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await AssignmentSubmission.countDocuments(query);

    res.json({
      submissions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: '获取提交列表失败', error: error.message });
  }
});

router.post('/submissions/:id/grade', auth, authorize('teacher', 'ta', 'admin'), async (req, res) => {
  try {
    const { totalScore, teacherFeedback, answers } = req.body;
    const submissionId = req.params.id;

    let submission;
    if (answers && Array.isArray(answers)) {
      for (const answer of answers) {
        submission = await AssignmentGradingEngine.manualGradeAnswer(
          submissionId,
          answer.questionId,
          answer.score,
          answer.comment,
          req.user._id
        );
      }
    } else if (totalScore !== undefined) {
      submission = await AssignmentGradingEngine.gradeSubmission(
        submissionId,
        totalScore,
        teacherFeedback,
        req.user._id
      );
    } else {
      return res.status(400).json({ message: '请提供评分信息' });
    }

    await submission.populate('student', 'username avatar');
    await submission.populate('assignment', 'title');

    res.json({ message: '批改成功', submission });
  } catch (error) {
    res.status(500).json({ message: '批改失败', error: error.message });
  }
});

router.get('/submissions/:id', auth, async (req, res) => {
  try {
    const submission = await AssignmentSubmission.findById(req.params.id)
      .populate('student', 'username avatar')
      .populate('assignment', 'title questions passingScore')
      .populate('gradedBy', 'username avatar');

    if (!submission) {
      return res.status(404).json({ message: '提交记录不存在' });
    }

    if (req.user.role === 'student' && submission.student._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: '无权查看此提交' });
    }

    res.json({ submission });
  } catch (error) {
    res.status(500).json({ message: '获取提交详情失败', error: error.message });
  }
});

module.exports = router;
