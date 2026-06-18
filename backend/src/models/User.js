const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    unique: true,
    sparse: true,
  },
  password: {
    type: String,
    select: false,
  },
  phone: {
    type: String,
    unique: true,
    sparse: true,
  },
  nickname: String,
  avatar: String,
  openid: {
    type: String,
    unique: true,
    sparse: true,
  },
  alipayId: {
    type: String,
    unique: true,
    sparse: true,
  },
  role: {
    type: String,
    enum: ['resident', 'property', 'operator', 'admin'],
    default: 'resident',
  },
  communityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Community',
  },
  balance: {
    type: Number,
    default: 0,
  },
  ecoPoints: {
    type: Number,
    default: 0,
  },
  streakDays: {
    type: Number,
    default: 0,
  },
  lastUseDate: Date,
  status: {
    type: String,
    enum: ['active', 'disabled'],
    default: 'active',
  },
  vouchers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Voucher',
  }],
}, {
  timestamps: true,
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
