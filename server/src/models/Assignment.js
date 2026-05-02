const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['single_choice', 'multiple_choice', 'true_false', 'essay'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  options: [{
    type: String
  }],
  correctAnswer: {
    type: mongoose.Schema.Types.Mixed
  },
  score: {
    type: Number,
    required: true,
    min: 0
  },
  explanation: {
    type: String,
    default: ''
  },
  sortOrder: {
    type: Number,
    default: 0
  }
});

const assignmentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
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
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['homework', 'quiz', 'exam'],
    default: 'homework'
  },
  questions: [questionSchema],
  totalScore: {
    type: Number,
    default: 0
  },
  passingScore: {
    type: Number,
    default: 60
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'closed'],
    default: 'draft'
  },
  startDate: {
    type: Date,
    default: null
  },
  endDate: {
    type: Date,
    default: null
  },
  timeLimit: {
    type: Number,
    default: null
  },
  allowLateSubmission: {
    type: Boolean,
    default: false
  },
  attempts: {
    type: Number,
    default: 1
  },
  showAnswerAfterSubmit: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

assignmentSchema.pre('save', function(next) {
  if (this.questions && this.questions.length > 0) {
    this.totalScore = this.questions.reduce((sum, q) => sum + (q.score || 0), 0);
  }
  next();
});

assignmentSchema.index({ course: 1 });
assignmentSchema.index({ teacher: 1 });
assignmentSchema.index({ status: 1 });
assignmentSchema.index({ type: 1 });

module.exports = mongoose.model('Assignment', assignmentSchema);
