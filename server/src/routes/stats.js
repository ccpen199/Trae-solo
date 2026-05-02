const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const ProgressEngine = require('../engines/ProgressEngine');
const AssignmentGradingEngine = require('../engines/AssignmentGradingEngine');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const User = require('../models/User');
const Order = require('../models/Order');
const Assignment = require('../models/Assignment');
const Question = require('../models/Question');
const Certificate = require('../models/Certificate');

router.get('/dashboard', auth, authorize('admin', 'teacher'), async (req, res) => {
  try {
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    const isAdmin = req.user.role === 'admin';
    
    const courseQuery = isAdmin ? {} : { teacher: req.user._id };
    
    const totalCourses = await Course.countDocuments(courseQuery);
    const publishedCourses = await Course.countDocuments({ ...courseQuery, status: 'published' });
    
    const enrollments = await Enrollment.find();
    const totalStudents = new Set(enrollments.map(e => e.student.toString())).size;
    
    const todayEnrollments = await Enrollment.countDocuments({
      enrolledAt: { $gte: todayStart }
    });
    
    const totalOrders = await Order.countDocuments({ status: 'paid' });
    const todayOrders = await Order.countDocuments({
      paidAt: { $gte: todayStart }
    });
    
    const totalRevenue = await Order.aggregate([
      { $match: { status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    
    const totalAssignments = await Assignment.countDocuments(courseQuery.course ? {} : {});
    const totalQuestions = await Question.countDocuments();
    const resolvedQuestions = await Question.countDocuments({ status: 'resolved' });
    
    const totalCertificates = await Certificate.countDocuments({ status: 'active' });

    res.json({
      overview: {
        totalCourses,
        publishedCourses,
        totalStudents,
        todayEnrollments,
        totalOrders,
        todayOrders,
        totalRevenue: totalRevenue[0]?.total || 0,
        totalAssignments,
        totalQuestions,
        resolvedQuestions,
        resolutionRate: totalQuestions > 0 ? Math.round((resolvedQuestions / totalQuestions) * 100) : 0,
        totalCertificates
      }
    });
  } catch (error) {
    res.status(500).json({ message: '获取仪表板数据失败', error: error.message });
  }
});

router.get('/courses', auth, authorize('admin', 'teacher'), async (req, res) => {
  try {
    const { page = 1, limit = 20, sort = '-createdAt' } = req.query;
    const isAdmin = req.user.role === 'admin';
    
    const query = isAdmin ? {} : { teacher: req.user._id };
    
    const courses = await Course.find(query)
      .populate('teacher', 'username avatar')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const coursesWithStats = [];
    
    for (const course of courses) {
      const enrollments = await Enrollment.find({ course: course._id });
      const studentIds = [...new Set(enrollments.map(e => e.student.toString()))];
      
      const completedCount = enrollments.filter(e => e.status === 'completed').length;
      const totalWatchTime = enrollments.reduce((sum, e) => sum + (e.totalWatchTime || 0), 0);
      
      const assignments = await Assignment.find({ course: course._id });
      let totalSubmissions = 0;
      let gradedSubmissions = 0;
      
      for (const assignment of assignments) {
        const stats = await AssignmentGradingEngine.getSubmissionStats(assignment._id);
        totalSubmissions += stats.submitted;
        gradedSubmissions += stats.graded;
      }
      
      const questions = await Question.countDocuments({ course: course._id });
      const resolvedQuestions = await Question.countDocuments({ 
        course: course._id, 
        status: 'resolved' 
      });

      coursesWithStats.push({
        ...course.toObject(),
        stats: {
          totalStudents: studentIds.length,
          completedStudents: completedCount,
          completionRate: studentIds.length > 0 ? Math.round((completedCount / studentIds.length) * 100) : 0,
          totalWatchTime: ProgressEngine.formatWatchTime(totalWatchTime),
          totalWatchTimeSeconds: totalWatchTime,
          assignments: assignments.length,
          totalSubmissions,
          gradedSubmissions,
          questions,
          resolvedQuestions,
          resolutionRate: questions > 0 ? Math.round((resolvedQuestions / questions) * 100) : 0
        }
      });
    }

    const total = await Course.countDocuments(query);

    res.json({
      courses: coursesWithStats,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: '获取课程统计失败', error: error.message });
  }
});

router.get('/course/:courseId', auth, authorize('admin', 'teacher'), async (req, res) => {
  try {
    const { courseId } = req.params;
    
    const course = await Course.findById(courseId).populate('teacher', 'username avatar');
    if (!course) {
      return res.status(404).json({ message: '课程不存在' });
    }

    const enrollments = await Enrollment.find({ course: courseId })
      .populate('student', 'username avatar email');

    const studentIds = [...new Set(enrollments.map(e => e.student._id.toString()))];
    const completedCount = enrollments.filter(e => e.status === 'completed').length;
    const totalWatchTime = enrollments.reduce((sum, e) => sum + (e.totalWatchTime || 0), 0);
    const avgProgress = studentIds.length > 0 
      ? Math.round(enrollments.reduce((sum, e) => sum + (e.progress || 0), 0) / studentIds.length)
      : 0;

    const assignments = await Assignment.find({ course: courseId });
    const assignmentStats = [];
    
    for (const assignment of assignments) {
      const stats = await AssignmentGradingEngine.getSubmissionStats(assignment._id);
      assignmentStats.push({
        assignment: {
          id: assignment._id,
          title: assignment.title,
          type: assignment.type,
          totalScore: assignment.totalScore
        },
        stats
      });
    }

    const questions = await Question.find({ course: courseId })
      .populate('user', 'username avatar')
      .sort('-createdAt');

    const certificates = await Certificate.countDocuments({ 
      course: courseId, 
      status: 'active' 
    });

    res.json({
      course: {
        id: course._id,
        title: course.title,
        teacher: course.teacher,
        status: course.status,
        price: course.price,
        totalLessons: course.totalLessons
      },
      overview: {
        totalStudents: studentIds.length,
        completedStudents: completedCount,
        completionRate: studentIds.length > 0 ? Math.round((completedCount / studentIds.length) * 100) : 0,
        avgProgress,
        totalWatchTime: ProgressEngine.formatWatchTime(totalWatchTime),
        totalWatchTimeSeconds: totalWatchTime,
        certificatesIssued: certificates
      },
      enrollments: enrollments.map(e => ({
        id: e._id,
        student: e.student,
        progress: e.progress,
        status: e.status,
        totalWatchTime: e.totalWatchTime,
        enrolledAt: e.enrolledAt,
        completedAt: e.completedAt,
        lastAccessedAt: e.lastAccessedAt
      })),
      assignments: assignmentStats,
      questions: questions.map(q => ({
        id: q._id,
        title: q.title,
        user: q.user,
        status: q.status,
        views: q.views,
        likeCount: q.likeCount,
        answerCount: q.answerCount,
        createdAt: q.createdAt
      }))
    });
  } catch (error) {
    res.status(500).json({ message: '获取课程详情统计失败', error: error.message });
  }
});

router.get('/users', auth, authorize('admin'), async (req, res) => {
  try {
    const { role, status, page = 1, limit = 20 } = req.query;
    
    const query = {};
    if (role) query.role = role;
    if (status) query.status = status;

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const usersWithStats = [];
    
    for (const user of users) {
      const enrollments = await Enrollment.find({ student: user._id });
      const certificates = await Certificate.countDocuments({ 
        student: user._id, 
        status: 'active' 
      });
      const totalWatchTime = enrollments.reduce((sum, e) => sum + (e.totalWatchTime || 0), 0);
      const completedCount = enrollments.filter(e => e.status === 'completed').length;

      usersWithStats.push({
        ...user.toObject(),
        stats: {
          enrolledCourses: enrollments.length,
          completedCourses: completedCount,
          certificates,
          totalWatchTime: ProgressEngine.formatWatchTime(totalWatchTime),
          totalWatchTimeSeconds: totalWatchTime
        }
      });
    }

    const total = await User.countDocuments(query);
    const totalByRole = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);

    res.json({
      users: usersWithStats,
      summary: {
        totalByRole: totalByRole.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {})
      },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: '获取用户统计失败', error: error.message });
  }
});

router.get('/revenue', auth, authorize('admin'), async (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'day' } = req.query;
    
    const matchQuery = { status: 'paid' };
    if (startDate) {
      matchQuery.paidAt = { $gte: new Date(startDate) };
    }
    if (endDate) {
      matchQuery.paidAt = { ...matchQuery.paidAt, $lte: new Date(endDate) };
    }

    let groupId;
    switch (groupBy) {
      case 'day':
        groupId = { 
          year: { $year: '$paidAt' }, 
          month: { $month: '$paidAt' }, 
          day: { $dayOfMonth: '$paidAt' } 
        };
        break;
      case 'month':
        groupId = { 
          year: { $year: '$paidAt' }, 
          month: { $month: '$paidAt' } 
        };
        break;
      case 'year':
        groupId = { year: { $year: '$paidAt' } };
        break;
      default:
        groupId = { 
          year: { $year: '$paidAt' }, 
          month: { $month: '$paidAt' }, 
          day: { $dayOfMonth: '$paidAt' } 
        };
    }

    const revenueData = await Order.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: groupId,
          totalRevenue: { $sum: '$totalAmount' },
          orderCount: { $sum: 1 },
          avgOrderValue: { $avg: '$totalAmount' }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1, '_id.day': -1 } }
    ]);

    const totalRevenue = await Order.aggregate([
      { $match: { status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } }
    ]);

    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    const todayRevenue = await Order.aggregate([
      { $match: { status: 'paid', paidAt: { $gte: todayStart } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } }
    ]);

    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthRevenue = await Order.aggregate([
      { $match: { status: 'paid', paidAt: { $gte: monthStart } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } }
    ]);

    res.json({
      overview: {
        totalRevenue: totalRevenue[0]?.total || 0,
        totalOrders: totalRevenue[0]?.count || 0,
        todayRevenue: todayRevenue[0]?.total || 0,
        todayOrders: todayRevenue[0]?.count || 0,
        monthRevenue: monthRevenue[0]?.total || 0,
        monthOrders: monthRevenue[0]?.count || 0
      },
      revenueData: revenueData.map(item => ({
        period: item._id,
        totalRevenue: item.totalRevenue,
        orderCount: item.orderCount,
        avgOrderValue: Math.round(item.avgOrderValue * 100) / 100
      }))
    });
  } catch (error) {
    res.status(500).json({ message: '获取收入统计失败', error: error.message });
  }
});

router.get('/assignments/:assignmentId', auth, authorize('admin', 'teacher', 'ta'), async (req, res) => {
  try {
    const { assignmentId } = req.params;
    
    const stats = await AssignmentGradingEngine.getSubmissionStats(assignmentId);
    
    const submissions = await AssignmentSubmission.find({ assignment: assignmentId })
      .populate('student', 'username avatar email')
      .sort({ submittedAt: -1 });

    const assignment = await Assignment.findById(assignmentId)
      .populate('course', 'title')
      .populate('teacher', 'username avatar');

    const scoreDistribution = {};
    submissions.forEach(s => {
      if (s.totalScore !== null && s.totalScore !== undefined) {
        const range = Math.floor(s.totalScore / 10) * 10;
        scoreDistribution[range] = (scoreDistribution[range] || 0) + 1;
      }
    });

    res.json({
      assignment,
      stats,
      submissions: submissions.map(s => ({
        id: s._id,
        student: s.student,
        status: s.status,
        totalScore: s.totalScore,
        submittedAt: s.submittedAt,
        gradedAt: s.gradedAt,
        isLate: s.isLate,
        attempt: s.attempt
      })),
      scoreDistribution
    });
  } catch (error) {
    res.status(500).json({ message: '获取作业统计失败', error: error.message });
  }
});

router.get('/my-stats', auth, async (req, res) => {
  try {
    const stats = await ProgressEngine.getUserLearningStats(req.user._id);
    
    const certificates = await Certificate.countDocuments({ 
      student: req.user._id, 
      status: 'active' 
    });
    
    const questions = await Question.countDocuments({ user: req.user._id });
    const resolvedQuestions = await Question.countDocuments({ 
      user: req.user._id, 
      status: 'resolved' 
    });

    const AssignmentSubmission = require('../models/AssignmentSubmission');
    const totalSubmissions = await AssignmentSubmission.countDocuments({ 
      student: req.user._id,
      status: { $ne: 'draft' }
    });
    const gradedSubmissions = await AssignmentSubmission.countDocuments({ 
      student: req.user._id,
      status: 'graded'
    });

    res.json({
      ...stats,
      certificates,
      questions,
      resolvedQuestions,
      resolutionRate: questions > 0 ? Math.round((resolvedQuestions / questions) * 100) : 0,
      totalSubmissions,
      gradedSubmissions
    });
  } catch (error) {
    res.status(500).json({ message: '获取个人统计失败', error: error.message });
  }
});

module.exports = router;
