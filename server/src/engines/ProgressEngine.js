const LearningProgress = require('../models/LearningProgress');
const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const AssignmentSubmission = require('../models/AssignmentSubmission');
const Assignment = require('../models/Assignment');

class ProgressEngine {
  static async calculateCourseProgress(userId, courseId) {
    const course = await Course.findById(courseId);
    if (!course) {
      throw new Error('课程不存在');
    }

    let totalLessons = 0;
    course.chapters.forEach(chapter => {
      totalLessons += chapter.lessons.length;
    });

    if (totalLessons === 0) {
      return { progress: 0, completedLessons: 0, totalLessons: 0 };
    }

    const completedLessons = await LearningProgress.countDocuments({
      student: userId,
      course: courseId,
      isCompleted: true
    });

    const progress = Math.round((completedLessons / totalLessons) * 100);

    return {
      progress,
      completedLessons,
      totalLessons,
      percentage: `${progress}%`
    };
  }

  static async calculateChapterProgress(userId, courseId, chapterId) {
    const course = await Course.findById(courseId);
    if (!course) {
      throw new Error('课程不存在');
    }

    const chapter = course.chapters.find(c => c._id.toString() === chapterId.toString());
    if (!chapter) {
      throw new Error('章节不存在');
    }

    const totalLessons = chapter.lessons.length;
    if (totalLessons === 0) {
      return { progress: 0, completedLessons: 0, totalLessons: 0 };
    }

    const lessonIds = chapter.lessons.map(l => l._id);
    const completedLessons = await LearningProgress.countDocuments({
      student: userId,
      course: courseId,
      lessonId: { $in: lessonIds },
      isCompleted: true
    });

    const progress = Math.round((completedLessons / totalLessons) * 100);

    return {
      progress,
      completedLessons,
      totalLessons,
      chapterId,
      chapterTitle: chapter.title
    };
  }

  static async updateEnrollmentProgress(userId, courseId) {
    const courseProgress = await this.calculateCourseProgress(userId, courseId);
    
    const enrollment = await Enrollment.findOneAndUpdate(
      { student: userId, course: courseId },
      { progress: courseProgress.progress },
      { new: true }
    );

    if (courseProgress.progress >= 100 && enrollment && enrollment.status !== 'completed') {
      enrollment.status = 'completed';
      enrollment.completedAt = new Date();
      await enrollment.save();
    }

    return enrollment;
  }

  static async checkCourseCompletion(userId, courseId) {
    const courseProgress = await this.calculateCourseProgress(userId, courseId);
    
    if (courseProgress.progress < 100) {
      return { isCompleted: false, reason: '课程学习进度未完成' };
    }

    const assignments = await Assignment.find({ course: courseId, type: 'exam' });
    
    for (const assignment of assignments) {
      const submission = await AssignmentSubmission.findOne({
        assignment: assignment._id,
        student: userId,
        status: 'graded'
      });

      if (!submission) {
        return { isCompleted: false, reason: '存在未完成的考试' };
      }

      if (submission.totalScore < assignment.passingScore) {
        return { 
          isCompleted: false, 
          reason: `考试「${assignment.title}」未通过，得分：${submission.totalScore}，及格分：${assignment.passingScore}` 
        };
      }
    }

    return { isCompleted: true };
  }

  static async getUserLearningStats(userId) {
    const enrollments = await Enrollment.find({ student: userId })
      .populate('course', 'title totalLessons');

    let totalCourses = 0;
    let completedCourses = 0;
    let totalWatchTime = 0;
    let totalLessonsLearned = 0;

    for (const enrollment of enrollments) {
      totalCourses++;
      if (enrollment.status === 'completed') {
        completedCourses++;
      }
      totalWatchTime += enrollment.totalWatchTime || 0;

      const courseProgress = await this.calculateCourseProgress(userId, enrollment.course._id);
      totalLessonsLearned += courseProgress.completedLessons;
    }

    return {
      totalCourses,
      completedCourses,
      inProgressCourses: totalCourses - completedCourses,
      totalWatchTime: this.formatWatchTime(totalWatchTime),
      totalWatchTimeSeconds: totalWatchTime,
      totalLessonsLearned,
      completionRate: totalCourses > 0 ? Math.round((completedCourses / totalCourses) * 100) : 0
    };
  }

  static formatWatchTime(seconds) {
    if (seconds < 60) {
      return `${seconds}秒`;
    } else if (seconds < 3600) {
      return `${Math.floor(seconds / 60)}分钟`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return minutes > 0 ? `${hours}小时${minutes}分钟` : `${hours}小时`;
    }
  }

  static async getCourseLearningStats(courseId) {
    const course = await Course.findById(courseId);
    if (!course) {
      throw new Error('课程不存在');
    }

    const enrollments = await Enrollment.find({ course: courseId });
    const totalStudents = enrollments.length;
    
    const completedStudents = enrollments.filter(e => e.status === 'completed').length;
    const totalWatchTime = enrollments.reduce((sum, e) => sum + (e.totalWatchTime || 0), 0);
    const avgProgress = totalStudents > 0 
      ? Math.round(enrollments.reduce((sum, e) => sum + (e.progress || 0), 0) / totalStudents)
      : 0;

    return {
      courseId,
      courseTitle: course.title,
      totalStudents,
      completedStudents,
      completionRate: totalStudents > 0 ? Math.round((completedStudents / totalStudents) * 100) : 0,
      avgProgress,
      totalWatchTime: this.formatWatchTime(totalWatchTime),
      totalWatchTimeSeconds: totalWatchTime
    };
  }
}

module.exports = ProgressEngine;
