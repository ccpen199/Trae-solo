const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const Enrollment = require('../models/Enrollment');
const ProgressEngine = require('../engines/ProgressEngine');

router.get('/', auth, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    
    const query = { student: req.user._id };
    if (status) query.status = status;

    const enrollments = await Enrollment.find(query)
      .populate({
        path: 'course',
        populate: { path: 'teacher', select: 'username avatar' }
      })
      .sort({ lastAccessedAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Enrollment.countDocuments(query);

    res.json({
      enrollments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: '获取选课列表失败', error: error.message });
  }
});

router.get('/stats', auth, async (req, res) => {
  try {
    const stats = await ProgressEngine.getStudyStats(req.user._id);
    res.json({ stats });
  } catch (error) {
    res.status(500).json({ message: '获取学习统计失败', error: error.message });
  }
});

router.get('/recent', auth, async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const activities = await ProgressEngine.getRecentActivity(req.user._id, parseInt(limit));
    res.json({ activities });
  } catch (error) {
    res.status(500).json({ message: '获取最近活动失败', error: error.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const enrollment = await Enrollment.findOne({
      _id: req.params.id,
      student: req.user._id
    }).populate({
      path: 'course',
      populate: { path: 'teacher', select: 'username avatar' }
    });

    if (!enrollment) {
      return res.status(404).json({ message: '选课记录不存在' });
    }

    const progress = await ProgressEngine.calculateCourseProgress(
      req.user._id,
      enrollment.course._id
    );

    res.json({ 
      enrollment,
      progress: {
        ...progress,
        enrollmentProgress: enrollment.progress
      }
    });
  } catch (error) {
    res.status(500).json({ message: '获取选课详情失败', error: error.message });
  }
});

module.exports = router;
