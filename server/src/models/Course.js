const mongoose = require('mongoose');

const lessonSchema = new mongoose.Schema({
  _id: {
    type: mongoose.Schema.Types.ObjectId,
    default: () => new mongoose.Types.ObjectId()
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  videoUrl: {
    type: String,
    default: ''
  },
  duration: {
    type: Number,
    default: 0
  },
  freePreview: {
    type: Boolean,
    default: false
  },
  sortOrder: {
    type: Number,
    default: 0
  },
  attachments: [{
    name: String,
    url: String,
    type: String
  }]
});

const chapterSchema = new mongoose.Schema({
  _id: {
    type: mongoose.Schema.Types.ObjectId,
    default: () => new mongoose.Types.ObjectId()
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  sortOrder: {
    type: Number,
    default: 0
  },
  lessons: [lessonSchema]
});

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    default: ''
  },
  coverImage: {
    type: String,
    default: ''
  },
  category: {
    type: String,
    default: '未分类'
  },
  tags: [{
    type: String
  }],
  price: {
    type: Number,
    default: 0,
    min: 0
  },
  originalPrice: {
    type: Number,
    default: null
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  chapters: [chapterSchema],
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner'
  },
  estimatedDuration: {
    type: Number,
    default: 0
  },
  totalLessons: {
    type: Number,
    default: 0
  },
  totalStudents: {
    type: Number,
    default: 0
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  ratingCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

courseSchema.virtual('totalDuration').get(function() {
  return this.chapters.reduce((total, chapter) => {
    return total + chapter.lessons.reduce((chapterTotal, lesson) => {
      return chapterTotal + (lesson.duration || 0);
    }, 0);
  }, 0);
});

courseSchema.pre('save', function(next) {
  let totalLessons = 0;
  this.chapters.forEach(chapter => {
    totalLessons += chapter.lessons.length;
  });
  this.totalLessons = totalLessons;
  next();
});

courseSchema.index({ status: 1 });
courseSchema.index({ category: 1 });
courseSchema.index({ teacher: 1 });
courseSchema.index({ tags: 1 });
courseSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Course', courseSchema);
