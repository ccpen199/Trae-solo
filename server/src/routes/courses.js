const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');

router.get('/', async (req, res) => {
  try {
    const { category, teacher, status = 'published', page = 1, limit = 20, sort = '-createdAt' } = req.query;
    
    const query = {};
    if (status) query.status = status;
    if (category) query.category = category;
    if (teacher) query.teacher = teacher;

    const courses = await Course.find(query)
      .populate('teacher', 'username avatar')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Course.countDocuments(query);

    res.json({
      courses,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: '获取课程列表失败', error: error.message });
  }
});

router.get('/my', auth, async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ student: req.user._id })
      .populate({
        path: 'course',
        populate: { path: 'teacher', select: 'username avatar' }
      })
      .sort({ lastAccessedAt: -1 });

    const courses = enrollments.map(e => ({
      ...e.course.toObject(),
      enrollment: {
        progress: e.progress,
        totalWatchTime: e.totalWatchTime,
        status: e.status,
        enrolledAt: e.enrolledAt,
        completedAt: e.completedAt
      }
    }));

    res.json({ courses });
  } catch (error) {
    res.status(500).json({ message: '获取我的课程失败', error: error.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('teacher', 'username avatar bio');

    if (!course) {
      return res.status(404).json({ message: '课程不存在' });
    }

    let enrollment = null;
    if (req.user) {
      enrollment = await Enrollment.findOne({
        student: req.user._id,
        course: course._id
      });
    }

    res.json({
      course,
      isEnrolled: !!enrollment,
      enrollment: enrollment ? {
        progress: enrollment.progress,
        status: enrollment.status
      } : null
    });
  } catch (error) {
    res.status(500).json({ message: '获取课程详情失败', error: error.message });
  }
});

router.post('/', auth, authorize('teacher', 'admin'), async (req, res) => {
  try {
    const { title, description, coverImage, category, tags, price, originalPrice, chapters } = req.body;

    const course = new Course({
      title,
      description,
      coverImage,
      category,
      tags,
      price: price || 0,
      originalPrice,
      teacher: req.user._id,
      chapters: chapters || []
    });

    await course.save();
    await course.populate('teacher', 'username avatar');

    res.status(201).json({ message: '课程创建成功', course });
  } catch (error) {
    res.status(500).json({ message: '创建课程失败', error: error.message });
  }
});

router.put('/:id', auth, authorize('teacher', 'admin'), async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({ message: '课程不存在' });
    }

    if (req.user.role !== 'admin' && course.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: '无权修改此课程' });
    }

    const updates = ['title', 'description', 'coverImage', 'category', 'tags', 'price', 'originalPrice', 'chapters', 'status'];
    updates.forEach(field => {
      if (req.body[field] !== undefined) {
        course[field] = req.body[field];
      }
    });

    await course.save();
    await course.populate('teacher', 'username avatar');

    res.json({ message: '课程更新成功', course });
  } catch (error) {
    res.status(500).json({ message: '更新课程失败', error: error.message });
  }
});

router.delete('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({ message: '课程不存在' });
    }

    course.status = 'archived';
    await course.save();

    res.json({ message: '课程已归档' });
  } catch (error) {
    res.status(500).json({ message: '归档课程失败', error: error.message });
  }
});

router.get('/:id/chapters', auth, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({ message: '课程不存在' });
    }

    const enrollment = await Enrollment.findOne({
      student: req.user._id,
      course: course._id
    });

    const isEnrolled = !!enrollment;
    const isTeacher = course.teacher.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isEnrolled && !isTeacher && !isAdmin) {
      const filteredChapters = course.chapters.map(chapter => ({
        ...chapter.toObject(),
        lessons: chapter.lessons.map(lesson => ({
          ...lesson.toObject(),
          videoUrl: lesson.freePreview ? lesson.videoUrl : null
        }))
      }));
      return res.json({ chapters: filteredChapters, isEnrolled: false });
    }

    res.json({ chapters: course.chapters, isEnrolled: true });
  } catch (error) {
    res.status(500).json({ message: '获取章节失败', error: error.message });
  }
});

router.get('/categories/list', async (req, res) => {
  try {
    const categories = await Course.distinct('category', { status: 'published' });
    res.json({ categories });
  } catch (error) {
    res.status(500).json({ message: '获取分类失败', error: error.message });
  }
});

module.exports = router;
