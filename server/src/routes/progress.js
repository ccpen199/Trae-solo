const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const VideoPlayerEngine = require('../engines/VideoPlayerEngine');
const ProgressEngine = require('../engines/ProgressEngine');
const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');

router.post('/update', auth, async (req, res) => {
  try {
    const { courseId, chapterId, lessonId, currentTime, duration } = req.body;

    const enrollment = await Enrollment.findOne({
      student: req.user._id,
      course: courseId
    });

    if (!enrollment) {
      return res.status(403).json({ message: '您未购买该课程' });
    }

    const progress = await VideoPlayerEngine.updateProgress(
      req.user._id,
      courseId,
      chapterId,
      lessonId,
      currentTime,
      duration
    );

    enrollment.lastAccessedAt = new Date();
    await enrollment.save();

    res.json({ 
      message: '进度更新成功',
      progress 
    });
  } catch (error) {
    res.status(500).json({ message: '更新进度失败', error: error.message });
  }
});

router.get('/course/:courseId', auth, async (req, res) => {
  try {
    const { courseId } = req.params;

    const enrollment = await Enrollment.findOne({
      student: req.user._id,
      course: courseId
    });

    if (!enrollment) {
      return res.status(403).json({ message: '您未购买该课程' });
    }

    const progressRecords = await VideoPlayerEngine.getCourseLessonProgress(
      req.user._id,
      courseId
    );

    const courseProgress = await ProgressEngine.calculateCourseProgress(
      req.user._id,
      courseId
    );

    res.json({
      progressRecords,
      courseProgress,
      enrollmentProgress: enrollment.progress
    });
  } catch (error) {
    res.status(500).json({ message: '获取进度失败', error: error.message });
  }
});

router.get('/lesson/:courseId/:lessonId', auth, async (req, res) => {
  try {
    const { courseId, lessonId } = req.params;

    const enrollment = await Enrollment.findOne({
      student: req.user._id,
      course: courseId
    });

    const course = await Course.findById(courseId);
    const isTeacher = course && course.teacher.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!enrollment && !isTeacher && !isAdmin) {
      const chapter = course.chapters.find(ch => 
        ch.lessons.some(l => l._id.toString() === lessonId)
      );
      const lesson = chapter?.lessons.find(l => l._id.toString() === lessonId);
      
      if (lesson?.freePreview) {
        const progress = await VideoPlayerEngine.getProgress(
          req.user._id,
          courseId,
          lessonId
        );
        return res.json({ progress, isFreePreview: true });
      }

      return res.status(403).json({ message: '您未购买该课程' });
    }

    const progress = await VideoPlayerEngine.getProgress(
      req.user._id,
      courseId,
      lessonId
    );

    res.json({ progress });
  } catch (error) {
    res.status(500).json({ message: '获取课时进度失败', error: error.message });
  }
});

module.exports = router;
