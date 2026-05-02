const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const Certificate = require('../models/Certificate');
const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const ProgressEngine = require('../engines/ProgressEngine');
const { v4: uuidv4 } = require('uuid');

router.get('/', auth, async (req, res) => {
  try {
    const { courseId, page = 1, limit = 20 } = req.query;
    
    const query = { student: req.user._id, status: 'active' };
    if (courseId) query.course = courseId;

    const certificates = await Certificate.find(query)
      .populate('course', 'title coverImage')
      .populate('courseTeacher', 'username avatar')
      .sort({ issuedDate: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Certificate.countDocuments(query);

    res.json({
      certificates,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: '获取证书列表失败', error: error.message });
  }
});

router.get('/all', auth, authorize('admin'), async (req, res) => {
  try {
    const { courseId, studentId, page = 1, limit = 20 } = req.query;
    
    const query = { status: 'active' };
    if (courseId) query.course = courseId;
    if (studentId) query.student = studentId;

    const certificates = await Certificate.find(query)
      .populate('student', 'username avatar email')
      .populate('course', 'title coverImage')
      .populate('courseTeacher', 'username avatar')
      .sort({ issuedDate: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Certificate.countDocuments(query);

    res.json({
      certificates,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: '获取证书列表失败', error: error.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const certificate = await Certificate.findById(req.params.id)
      .populate('student', 'username avatar email')
      .populate('course', 'title coverImage description')
      .populate('courseTeacher', 'username avatar bio')
      .populate('enrollment');

    if (!certificate) {
      return res.status(404).json({ message: '证书不存在' });
    }

    if (req.user.role !== 'admin' && certificate.student._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: '无权查看此证书' });
    }

    res.json({ certificate });
  } catch (error) {
    res.status(500).json({ message: '获取证书详情失败', error: error.message });
  }
});

router.get('/verify/:code', async (req, res) => {
  try {
    const { code } = req.params;
    
    const certificate = await Certificate.findOne({ 
      verificationCode: code,
      status: 'active'
    })
      .populate('student', 'username avatar')
      .populate('course', 'title coverImage')
      .populate('courseTeacher', 'username avatar');

    if (!certificate) {
      return res.status(404).json({ 
        valid: false, 
        message: '证书不存在或已失效' 
      });
    }

    res.json({
      valid: true,
      certificate: {
        certificateNo: certificate.certificateNo,
        studentName: certificate.studentName,
        courseTitle: certificate.courseTitle,
        completionDate: certificate.completionDate,
        issuedDate: certificate.issuedDate,
        finalScore: certificate.finalScore,
        progress: certificate.progress
      }
    });
  } catch (error) {
    res.status(500).json({ message: '验证失败', error: error.message });
  }
});

router.post('/generate/:courseId', auth, async (req, res) => {
  try {
    const { courseId } = req.params;

    const enrollment = await Enrollment.findOne({
      student: req.user._id,
      course: courseId
    }).populate('course');

    if (!enrollment) {
      return res.status(404).json({ message: '您未购买该课程' });
    }

    const existingCertificate = await Certificate.findOne({
      student: req.user._id,
      course: courseId,
      status: 'active'
    });

    if (existingCertificate) {
      return res.json({ 
        message: '您已拥有该课程的证书',
        certificate: existingCertificate 
      });
    }

    const completionCheck = await ProgressEngine.checkCourseCompletion(req.user._id, courseId);
    
    if (!completionCheck.isCompleted) {
      return res.status(400).json({ 
        message: completionCheck.reason || '未满足结业条件' 
      });
    }

    const course = await Course.findById(courseId).populate('teacher', 'username avatar');
    if (!course) {
      return res.status(404).json({ message: '课程不存在' });
    }

    const AssignmentSubmission = require('../models/AssignmentSubmission');
    const Assignment = require('../models/Assignment');
    
    const exams = await Assignment.find({ course: courseId, type: 'exam' });
    let finalScore = null;
    
    if (exams.length > 0) {
      let totalScore = 0;
      let totalWeight = 0;
      
      for (const exam of exams) {
        const submission = await AssignmentSubmission.findOne({
          assignment: exam._id,
          student: req.user._id,
          status: 'graded'
        });
        
        if (submission && submission.totalScore !== null) {
          totalScore += submission.totalScore;
          totalWeight++;
        }
      }
      
      if (totalWeight > 0) {
        finalScore = Math.round(totalScore / totalWeight);
      }
    }

    const courseProgress = await ProgressEngine.calculateCourseProgress(req.user._id, courseId);

    const certificate = new Certificate({
      certificateNo: `CERT${Date.now()}${uuidv4().slice(0, 6).toUpperCase()}`,
      student: req.user._id,
      course: courseId,
      enrollment: enrollment._id,
      courseTitle: course.title,
      courseTeacher: course.teacher._id,
      studentName: req.user.username,
      completionDate: enrollment.completedAt || new Date(),
      finalScore,
      totalWatchTime: enrollment.totalWatchTime,
      progress: courseProgress.progress,
      verificationCode: uuidv4().replace(/-/g, '').substring(0, 16).toUpperCase()
    });

    await certificate.save();

    enrollment.certificate = certificate._id;
    await enrollment.save();

    await certificate.populate('course', 'title coverImage');
    await certificate.populate('courseTeacher', 'username avatar');

    res.status(201).json({ 
      message: '证书生成成功',
      certificate 
    });
  } catch (error) {
    res.status(500).json({ message: '生成证书失败', error: error.message });
  }
});

router.post('/admin/generate', auth, authorize('admin'), async (req, res) => {
  try {
    const { studentId, courseId, finalScore } = req.body;

    const enrollment = await Enrollment.findOne({
      student: studentId,
      course: courseId
    });

    if (!enrollment) {
      return res.status(404).json({ message: '选课记录不存在' });
    }

    const existingCertificate = await Certificate.findOne({
      student: studentId,
      course: courseId,
      status: 'active'
    });

    if (existingCertificate) {
      return res.json({ 
        message: '该学员已拥有该课程的证书',
        certificate: existingCertificate 
      });
    }

    const course = await Course.findById(courseId).populate('teacher', 'username avatar');
    const User = require('../models/User');
    const student = await User.findById(studentId);

    if (!course || !student) {
      return res.status(404).json({ message: '课程或学员不存在' });
    }

    const certificate = new Certificate({
      certificateNo: `CERT${Date.now()}${uuidv4().slice(0, 6).toUpperCase()}`,
      student: studentId,
      course: courseId,
      enrollment: enrollment._id,
      courseTitle: course.title,
      courseTeacher: course.teacher._id,
      studentName: student.username,
      completionDate: new Date(),
      finalScore,
      totalWatchTime: enrollment.totalWatchTime,
      progress: enrollment.progress,
      verificationCode: uuidv4().replace(/-/g, '').substring(0, 16).toUpperCase()
    });

    await certificate.save();

    enrollment.certificate = certificate._id;
    enrollment.status = 'completed';
    enrollment.completedAt = new Date();
    await enrollment.save();

    res.status(201).json({ 
      message: '证书生成成功',
      certificate 
    });
  } catch (error) {
    res.status(500).json({ message: '生成证书失败', error: error.message });
  }
});

router.post('/:id/revoke', auth, authorize('admin'), async (req, res) => {
  try {
    const certificate = await Certificate.findById(req.params.id);
    
    if (!certificate) {
      return res.status(404).json({ message: '证书不存在' });
    }

    certificate.status = 'revoked';
    await certificate.save();

    res.json({ message: '证书已吊销' });
  } catch (error) {
    res.status(500).json({ message: '吊销证书失败', error: error.message });
  }
});

module.exports = router;
