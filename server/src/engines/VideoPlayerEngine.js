const LearningProgress = require('../models/LearningProgress');
const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');

class VideoPlayerEngine {
  static async updateProgress(userId, courseId, chapterId, lessonId, currentTime, duration) {
    const progress = await LearningProgress.findOneAndUpdate(
      { student: userId, course: courseId, lessonId },
      {
        $set: {
          currentTime,
          duration,
          chapterId,
          lastWatchedAt: new Date()
        },
        $inc: { totalWatchTime: 5 }
      },
      { upsert: true, new: true }
    );

    let newProgress = 0;
    if (duration > 0) {
      newProgress = Math.min((currentTime / duration) * 100, 100);
    }

    if (newProgress >= 95 && !progress.isCompleted) {
      progress.isCompleted = true;
      progress.completedAt = new Date();
      progress.progress = 100;
      await progress.save();
    } else if (newProgress > progress.progress) {
      progress.progress = newProgress;
      await progress.save();
    }

    return progress;
  }

  static async getProgress(userId, courseId, lessonId) {
    const progress = await LearningProgress.findOne({
      student: userId,
      course: courseId,
      lessonId
    });

    return progress || {
      currentTime: 0,
      duration: 0,
      progress: 0,
      isCompleted: false,
      totalWatchTime: 0
    };
  }

  static async getCourseLessonProgress(userId, courseId) {
    const progressRecords = await LearningProgress.find({
      student: userId,
      course: courseId
    });

    return progressRecords;
  }

  static async getCompletedLessons(userId, courseId) {
    const completed = await LearningProgress.countDocuments({
      student: userId,
      course: courseId,
      isCompleted: true
    });

    return completed;
  }

  static async updatePlaybackSettings(userId, courseId, lessonId, settings) {
    const { playbackSpeed, quality } = settings;
    
    const progress = await LearningProgress.findOneAndUpdate(
      { student: userId, course: courseId, lessonId },
      {
        $set: {
          ...(playbackSpeed && { playbackSpeed }),
          ...(quality && { quality })
        }
      },
      { upsert: true, new: true }
    );

    return progress;
  }

  static async getLastWatchedLesson(userId, courseId) {
    const lastProgress = await LearningProgress.findOne({
      student: userId,
      course: courseId
    }).sort({ lastWatchedAt: -1 });

    return lastProgress;
  }
}

module.exports = VideoPlayerEngine;
