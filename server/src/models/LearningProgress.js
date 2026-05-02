const mongoose = require('mongoose');

const learningProgressSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  chapterId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
  lessonId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  currentTime: {
    type: Number,
    default: 0
  },
  duration: {
    type: Number,
    default: 0
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Date,
    default: null
  },
  totalWatchTime: {
    type: Number,
    default: 0
  },
  lastWatchedAt: {
    type: Date,
    default: Date.now
  },
  playbackSpeed: {
    type: Number,
    default: 1.0
  },
  quality: {
    type: String,
    enum: ['auto', '360p', '480p', '720p', '1080p'],
    default: 'auto'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

learningProgressSchema.index({ student: 1, course: 1, lessonId: 1 }, { unique: true });
learningProgressSchema.index({ student: 1, course: 1 });
learningProgressSchema.index({ student: 1 });
learningProgressSchema.index({ course: 1 });
learningProgressSchema.index({ isCompleted: 1 });

module.exports = mongoose.model('LearningProgress', learningProgressSchema);
