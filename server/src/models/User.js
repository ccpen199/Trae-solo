const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 2,
    maxlength: 50
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['questioner', 'answerer', 'expert', 'editor', 'admin'],
    default: 'questioner'
  },
  profile: {
    nickname: String,
    avatar: String,
    bio: String,
    location: String,
    expertise: [String],
    education: [Object],
    experience: [Object]
  },
  creditScore: {
    type: Number,
    default: 100,
    min: 0,
    max: 1000
  },
  creditLevel: {
    type: String,
    enum: ['bronze', 'silver', 'gold', 'platinum', 'diamond'],
    default: 'bronze'
  },
  activityWeight: {
    type: Number,
    default: 1.0,
    min: 0,
    max: 5.0
  },
  balance: {
    type: Number,
    default: 0
  },
  points: {
    type: Number,
    default: 0
  },
  notificationPreferences: {
    email: { type: Boolean, default: true },
    push: { type: Boolean, default: true },
    expertMatch: { type: Boolean, default: true }
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationCode: String,
  verificationExpires: Date,
  lastLoginAt: Date,
  lastActiveAt: Date,
  status: {
    type: String,
    enum: ['active', 'suspended', 'banned'],
    default: 'active'
  },
  metadata: {
    questionCount: { type: Number, default: 0 },
    answerCount: { type: Number, default: 0 },
    acceptedAnswerCount: { type: Number, default: 0 },
    voteReceived: { type: Number, default: 0 },
    voteGiven: { type: Number, default: 0 }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.updateCreditLevel = function() {
  const levels = [
    { level: 'bronze', min: 0, max: 199 },
    { level: 'silver', min: 200, max: 399 },
    { level: 'gold', min: 400, max: 599 },
    { level: 'platinum', min: 600, max: 799 },
    { level: 'diamond', min: 800, max: 1000 }
  ];
  
  for (const { level, min, max } of levels) {
    if (this.creditScore >= min && this.creditScore <= max) {
      this.creditLevel = level;
      break;
    }
  }
};

userSchema.index({ username: 1, email: 1 });
userSchema.index({ role: 1, status: 1 });
userSchema.index({ creditScore: -1, creditLevel: 1 });
userSchema.index({ 'profile.expertise': 1 });

module.exports = mongoose.model('User', userSchema);
