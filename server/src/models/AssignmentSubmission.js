const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  answer: {
    type: mongoose.Schema.Types.Mixed
  },
  score: {
    type: Number,
    default: null
  },
  isCorrect: {
    type: Boolean,
    default: null
  },
  needsManualGrading: {
    type: Boolean,
    default: false
  },
  teacherComment: {
    type: String,
    default: ''
  }
});

const assignmentSubmissionSchema = new mongoose.Schema({
  assignment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assignment',
    required: true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  answers: [answerSchema],
  totalScore: {
    type: Number,
    default: null
  },
  status: {
    type: String,
    enum: ['draft', 'submitted', 'graded', 'returned'],
    default: 'draft'
  },
  attempt: {
    type: Number,
    default: 1
  },
  submittedAt: {
    type: Date,
    default: null
  },
  isLate: {
    type: Boolean,
    default: false
  },
  gradedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  gradedAt: {
    type: Date,
    default: null
  },
  teacherFeedback: {
    type: String,
    default: ''
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

assignmentSubmissionSchema.index({ assignment: 1, student: 1 });
assignmentSubmissionSchema.index({ assignment: 1 });
assignmentSubmissionSchema.index({ student: 1 });
assignmentSubmissionSchema.index({ status: 1 });

module.exports = mongoose.model('AssignmentSubmission', assignmentSubmissionSchema);
