const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  _id: {
    type: mongoose.Schema.Types.ObjectId,
    default: () => new mongoose.Types.ObjectId()
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  likeCount: {
    type: Number,
    default: 0
  },
  isAccepted: {
    type: Boolean,
    default: false
  },
  acceptedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

const questionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    minlength: 5,
    maxlength: 200
  },
  content: {
    type: String,
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
    default: null
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tags: [{
    type: String
  }],
  status: {
    type: String,
    enum: ['open', 'resolved', 'closed'],
    default: 'open'
  },
  views: {
    type: Number,
    default: 0
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  likeCount: {
    type: Number,
    default: 0
  },
  answers: [answerSchema],
  answerCount: {
    type: Number,
    default: 0
  },
  acceptedAnswerId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

questionSchema.pre('save', function(next) {
  this.likeCount = this.likes.length;
  if (this.answers) {
    this.answerCount = this.answers.length;
    this.answers.forEach(answer => {
      answer.likeCount = answer.likes.length;
    });
  }
  next();
});

questionSchema.index({ course: 1 });
questionSchema.index({ user: 1 });
questionSchema.index({ status: 1 });
questionSchema.index({ tags: 1 });
questionSchema.index({ title: 'text', content: 'text' });

module.exports = mongoose.model('Question', questionSchema);
