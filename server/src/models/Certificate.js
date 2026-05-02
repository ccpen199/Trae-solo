const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const certificateSchema = new mongoose.Schema({
  certificateNo: {
    type: String,
    unique: true,
    required: true
  },
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
  enrollment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Enrollment',
    required: true
  },
  courseTitle: {
    type: String,
    required: true
  },
  courseTeacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  studentName: {
    type: String,
    required: true
  },
  completionDate: {
    type: Date,
    required: true
  },
  issuedDate: {
    type: Date,
    default: Date.now
  },
  finalScore: {
    type: Number,
    default: null
  },
  totalWatchTime: {
    type: Number,
    default: 0
  },
  progress: {
    type: Number,
    default: 100
  },
  certificateUrl: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['active', 'revoked'],
    default: 'active'
  },
  verificationCode: {
    type: String,
    unique: true,
    required: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

certificateSchema.pre('validate', function(next) {
  if (!this.certificateNo) {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.certificateNo = `CERT${timestamp}${random}`;
  }
  if (!this.verificationCode) {
    this.verificationCode = uuidv4().replace(/-/g, '').substring(0, 16).toUpperCase();
  }
  next();
});

certificateSchema.index({ certificateNo: 1 }, { unique: true });
certificateSchema.index({ verificationCode: 1 }, { unique: true });
certificateSchema.index({ student: 1 });
certificateSchema.index({ course: 1 });
certificateSchema.index({ status: 1 });

module.exports = mongoose.model('Certificate', certificateSchema);
